import { MethodologyConfig, CreateMethodologyConfig, UpdateMethodologyConfig } from '../../../shared/src/types';
import { prisma } from '../config/database';
import { AppError, ErrorCode } from '../middleware/ErrorHandler';
import { EncryptionService } from './EncryptionService';
import { ZAKAT_METHODS } from '../../../shared/src/constants';

/**
 * Methodology Configuration Service
 *
 * Manages user-specific Zakat methodology configurations including:
 * - Fixed methodologies (STANDARD, HANAFI, SHAFII)
 * - Custom user-defined methodologies
 * - Methodology overrides and preferences
 *
 * Constitutional Compliance:
 * - Privacy & Security First: Encrypts sensitive custom settings
 * - Spec-Driven & Clear Development: Follows methodology contract specifications
 * - Quality & Performance: Implements caching and validation
 */
export class MethodologyConfigService {
  private encryptionService: EncryptionService;
  private cache = new Map<string, { data: MethodologyConfig[]; expires: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.encryptionService = new EncryptionService();
  }

  /**
   * Get all methodologies available to a user
   * Returns both fixed methodologies and user's custom configurations
   *
   * @param userId - User identifier
   * @returns Object containing fixed and custom methodologies
   */
  async getMethodologies(userId: string): Promise<{
    fixed: MethodologyConfig[];
    custom: MethodologyConfig[];
  }> {
    // Get fixed methodologies from constants
    const fixedMethodologies = this.getFixedMethodologies();

    // Get user's custom methodologies
    const customMethodologies = await this.getCustomMethodologies(userId);

    return {
      fixed: fixedMethodologies,
      custom: customMethodologies
    };
  }

  /**
   * Get a specific methodology configuration
   *
   * @param userId - User identifier
   * @param methodologyId - Methodology ID (can be fixed or custom)
   * @returns Methodology configuration
   */
  async getMethodology(userId: string, methodologyId: string): Promise<MethodologyConfig> {
    // Check if it's a fixed methodology
    const fixedMethodology = this.getFixedMethodology(methodologyId);
    if (fixedMethodology) {
      return fixedMethodology;
    }

    // Check if it's a custom methodology
    const customMethodology = await this.getCustomMethodology(userId, methodologyId);
    if (customMethodology) {
      return customMethodology;
    }

    throw new AppError(`Methodology not found: ${methodologyId}`, 404, ErrorCode.RECORD_NOT_FOUND);
  }

  /**
   * Update a methodology configuration
   * Only custom methodologies can be updated
   *
   * @param userId - User identifier
   * @param methodologyId - Methodology ID to update
   * @param updates - Partial configuration updates
   * @returns Updated methodology configuration
   */
  async updateMethodology(
    userId: string,
    methodologyId: string,
    updates: UpdateMethodologyConfig
  ): Promise<MethodologyConfig> {
    // Validate updates
    this.validateMethodologyUpdates(updates);

    // Check if it's a fixed methodology (cannot be updated)
    if (this.isFixedMethodology(methodologyId)) {
      throw new AppError('Fixed methodologies cannot be updated', 400, ErrorCode.VALIDATION_ERROR);
    }

    // Get existing custom methodology
    const existing = await prisma.methodologyConfig.findFirst({
      where: {
        id: methodologyId,
        userId: userId
      }
    });

    if (!existing) {
      throw new AppError(`Custom methodology not found: ${methodologyId}`, 404, ErrorCode.RECORD_NOT_FOUND);
    }

    // Decrypt existing configuration
    const existingConfig = await this.decryptMethodologyConfig(existing);

    // Apply updates
    const updatedConfig = { ...existingConfig, ...updates };

    // Encrypt and save
    const encryptedData = await this.encryptMethodologyConfig(updatedConfig);

    const updated = await prisma.methodologyConfig.update({
      where: { id: methodologyId },
      data: {
        ...encryptedData,
        updatedAt: new Date()
      }
    });

    // Clear cache
    this.clearUserCache(userId);

    // Return decrypted result
    return await this.decryptMethodologyConfig(updated);
  }

  /**
   * Create a custom methodology configuration
   *
   * @param userId - User identifier
   * @param config - Custom methodology configuration
   * @returns Created methodology configuration
   */
  async createCustomMethodology(
    userId: string,
    config: CreateMethodologyConfig
  ): Promise<MethodologyConfig> {
    // Validate configuration
    this.validateCustomMethodologyConfig(config);

    // Encrypt sensitive data
    const encryptedData = await this.encryptMethodologyConfig(config);

    // Create in database
    const created = await prisma.methodologyConfig.create({
      data: {
        userId,
        name: config.name,
        nisabBasis: config.nisabBasis,
        customNisabValue: config.customNisabValue,
        rate: config.rate,
        assetRules: encryptedData.assetRules, // Encrypted
        isCustom: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Clear cache
    this.clearUserCache(userId);

    // Return with decrypted data
    return await this.decryptMethodologyConfig(created);
  }

  /**
   * Delete a custom methodology configuration
   *
   * @param userId - User identifier
   * @param methodologyId - Custom methodology ID to delete
   */
  async deleteCustomMethodology(userId: string, methodologyId: string): Promise<void> {
    // Check if it's a fixed methodology (cannot be deleted)
    if (this.isFixedMethodology(methodologyId)) {
      throw new AppError('Fixed methodologies cannot be deleted', 400, ErrorCode.VALIDATION_ERROR);
    }

    // Delete from database
    const deleted = await prisma.methodologyConfig.deleteMany({
      where: {
        id: methodologyId,
        userId: userId,
        isCustom: true
      }
    });

    if (deleted.count === 0) {
      throw new AppError(`Custom methodology not found: ${methodologyId}`, 404, ErrorCode.RECORD_NOT_FOUND);
    }

    // Clear cache
    this.clearUserCache(userId);
  }

  // Private helper methods

  private getFixedMethodologies(): MethodologyConfig[] {
    return Object.values(ZAKAT_METHODS).map(method => ({
      id: method.id,
      name: method.name,
      description: method.description,
      nisabBasis: method.nisabBasis,
      rate: method.zakatRate,
      assetRules: {}, // Fixed methodologies use default rules
      isCustom: false,
      scholarlyBasis: method.scholarlyBasis,
      regions: method.regions,
      suitableFor: method.suitableFor,
      pros: method.pros,
      cons: method.cons,
      explanation: method.explanation
    }));
  }

  private getFixedMethodology(id: string): MethodologyConfig | null {
    const method = ZAKAT_METHODS[id as keyof typeof ZAKAT_METHODS];
    if (!method) return null;

    return {
      id: method.id,
      name: method.name,
      description: method.description,
      nisabBasis: method.nisabBasis,
      rate: method.zakatRate,
      assetRules: {},
      isCustom: false,
      scholarlyBasis: method.scholarlyBasis,
      regions: method.regions,
      suitableFor: method.suitableFor,
      pros: method.pros,
      cons: method.cons,
      explanation: method.explanation
    };
  }

  private async getCustomMethodologies(userId: string): Promise<MethodologyConfig[]> {
    const cacheKey = `custom_${userId}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const configs = await prisma.methodologyConfig.findMany({
      where: {
        userId: userId,
        isCustom: true
      }
    });

    const decrypted = await Promise.all(
      configs.map(config => this.decryptMethodologyConfig(config))
    );

    this.setCached(cacheKey, decrypted);
    return decrypted;
  }

  private async getCustomMethodology(userId: string, methodologyId: string): Promise<MethodologyConfig | null> {
    const config = await prisma.methodologyConfig.findFirst({
      where: {
        id: methodologyId,
        userId: userId,
        isCustom: true
      }
    });

    if (!config) return null;

    return await this.decryptMethodologyConfig(config);
  }

  private isFixedMethodology(methodologyId: string): boolean {
    return Object.keys(ZAKAT_METHODS).includes(methodologyId);
  }

  private validateMethodologyUpdates(updates: UpdateMethodologyConfig): void {
    if (updates.customNisabValue !== undefined && updates.customNisabValue <= 0) {
      throw new AppError('Custom nisab value must be positive', 400, ErrorCode.VALIDATION_ERROR);
    }

    if (updates.rate !== undefined && (updates.rate <= 0 || updates.rate > 100)) {
      throw new AppError('Rate must be between 0 and 100', 400, ErrorCode.VALIDATION_ERROR);
    }
  }

  private validateCustomMethodologyConfig(config: CreateMethodologyConfig): void {
    if (!config.name || config.name.trim().length === 0) {
      throw new AppError('Methodology name is required', 400, ErrorCode.VALIDATION_ERROR);
    }

    if (config.nisabBasis === 'CUSTOM_VALUE' && !config.customNisabValue) {
      throw new AppError('Custom nisab value required when nisabBasis is CUSTOM_VALUE', 400, ErrorCode.VALIDATION_ERROR);
    }

    if (config.customNisabValue !== undefined && config.customNisabValue <= 0) {
      throw new AppError('Custom nisab value must be positive', 400, ErrorCode.VALIDATION_ERROR);
    }

    if (!config.rate || config.rate <= 0 || config.rate > 100) {
      throw new AppError('Valid rate between 0 and 100 is required', 400, ErrorCode.VALIDATION_ERROR);
    }

    if (!config.assetRules || Object.keys(config.assetRules).length === 0) {
      throw new AppError('Asset rules are required', 400, ErrorCode.VALIDATION_ERROR);
    }
  }

  private async encryptMethodologyConfig(config: any): Promise<any> {
    const result = { ...config };

    // Encrypt sensitive asset rules
    if (config.assetRules) {
      result.assetRules = await EncryptionService.encrypt(
        JSON.stringify(config.assetRules),
        process.env.ENCRYPTION_KEY || 'default-key-for-development-purposes-32'
      );
    }

    return result;
  }

  private async decryptMethodologyConfig(config: {
    id: string;
    userId: string;
    name: string;
    nisabBasis: string;
    customNisabValue: number | null;
    rate: number;
    assetRules: string;
    isCustom: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): Promise<MethodologyConfig> {
    const result: MethodologyConfig = {
      id: config.id,
      name: config.name,
      nisabBasis: config.nisabBasis,
      customNisabValue: config.customNisabValue || undefined,
      rate: config.rate,
      assetRules: {},
      isCustom: config.isCustom
    };

    // Decrypt asset rules
    if (config.assetRules) {
      try {
        result.assetRules = JSON.parse(
          await EncryptionService.decrypt(config.assetRules, process.env.ENCRYPTION_KEY || 'default-key-for-development-purposes-32')
        );
      } catch {
        // If decryption fails, use empty object
        result.assetRules = {};
      }
    }

    return result;
  }

  private getCached(key: string): MethodologyConfig[] | null {
    const cached = this.cache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCached(key: string, data: MethodologyConfig[]): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + this.CACHE_TTL
    });
  }

  private clearUserCache(userId: string): void {
    // Clear all cache entries for this user
    for (const key of this.cache.keys()) {
      if (key.includes(userId)) {
        this.cache.delete(key);
      }
    }
  }
}