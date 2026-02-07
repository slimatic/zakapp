import { describe, it, expect, vi, beforeEach } from 'vitest';
import inquirer from 'inquirer';
import { setupCommand } from '../src/commands/setup';
import * as configModule from '../src/config';

// Mock dependencies
vi.mock('inquirer');
vi.mock('../src/config', async () => {
  const actual = await vi.importActual('../src/config');
  return {
    ...actual,
    loadConfig: vi.fn(),
    saveConfig: vi.fn(),
  };
});

// Mock console.log to avoid clutter
const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

describe('Setup Command - Security Keys', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should generate security keys if they do not exist', async () => {
    // Arrange
    (configModule.loadConfig as any).mockReturnValue(null);
    
    const newAnswers = {
      continue: true,
      currency: 'GBP',
      language: 'en',
      zakatMethod: 'standard',
      calendarType: 'lunar',
    };
    
    vi.spyOn(inquirer, 'prompt').mockResolvedValue(newAnswers);

    // Act
    await setupCommand.parseAsync(['node', 'test', 'setup']);

    // Assert
    expect(configModule.saveConfig).toHaveBeenCalled();
    const savedConfig = (configModule.saveConfig as any).mock.calls[0][0];
    
    expect(savedConfig.securityKeys).toBeDefined();
    expect(savedConfig.securityKeys.encryptionKey).toBeDefined();
    expect(savedConfig.securityKeys.jwtSecret).toBeDefined();
    expect(savedConfig.securityKeys.encryptionKey).toHaveLength(64); // 32 bytes hex
    expect(savedConfig.securityKeys.jwtSecret).toHaveLength(64); // 32 bytes hex
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Security keys generated'));
  });

  it('should preserve existing security keys', async () => {
    // Arrange
    const existingConfig = {
      currency: 'EUR',
      language: 'ar',
      zakatMethod: 'hanafi',
      calendarType: 'solar',
      securityKeys: {
        encryptionKey: 'existing-encryption-key',
        jwtSecret: 'existing-jwt-secret'
      }
    };
    (configModule.loadConfig as any).mockReturnValue(existingConfig);
    
    const newAnswers = {
      continue: true,
      currency: 'USD',
      language: 'en',
      zakatMethod: 'shafii',
      calendarType: 'lunar',
    };
    
    vi.spyOn(inquirer, 'prompt').mockResolvedValue(newAnswers);

    // Act
    await setupCommand.parseAsync(['node', 'test', 'setup']);

    // Assert
    expect(configModule.saveConfig).toHaveBeenCalled();
    const savedConfig = (configModule.saveConfig as any).mock.calls[0][0];
    
    expect(savedConfig.securityKeys).toEqual(existingConfig.securityKeys);
    expect(savedConfig.currency).toBe('USD'); // Verify other changes applied
  });
});
