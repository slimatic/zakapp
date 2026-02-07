
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import path from 'path';
import fs from 'fs';
import { checkSchemaStatus } from '../../utils/schemaCheck';
import { prisma } from '../../utils/prisma';

// Mock fs and prisma
vi.mock('fs');
vi.mock('../../utils/prisma', () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
}));

describe('checkSchemaStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mocks
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readdirSync).mockReturnValue([]);
    vi.mocked(fs.statSync).mockReturnValue({ isDirectory: () => true } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return upToDate=true when no pending migrations', async () => {
    // Mock DB response
    const appliedMigrations = [
      { migration_name: '20230101_init' },
      { migration_name: '20230201_feature' },
    ];
    vi.mocked(prisma.$queryRaw).mockResolvedValue(appliedMigrations);

    // Mock FS response
    const availableMigrations = ['20230101_init', '20230201_feature'];
    vi.mocked(fs.readdirSync).mockReturnValue(availableMigrations as any);
    vi.mocked(fs.statSync).mockReturnValue({ isDirectory: () => true } as any);

    const result = await checkSchemaStatus();

    expect(result.upToDate).toBe(true);
    expect(result.pending).toEqual([]);
    expect(result.missing).toEqual([]);
    expect(result.applied).toEqual(['20230101_init', '20230201_feature']);
  });

  it('should return upToDate=false when there are pending migrations', async () => {
    // Mock DB response
    const appliedMigrations = [
      { migration_name: '20230101_init' },
    ];
    vi.mocked(prisma.$queryRaw).mockResolvedValue(appliedMigrations);

    // Mock FS response
    const availableMigrations = ['20230101_init', '20230201_feature'];
    vi.mocked(fs.readdirSync).mockReturnValue(availableMigrations as any);

    const result = await checkSchemaStatus();

    expect(result.upToDate).toBe(false);
    expect(result.pending).toEqual(['20230201_feature']);
    expect(result.missing).toEqual([]);
  });

  it('should detect missing migrations (applied but not in code)', async () => {
    // Mock DB response
    const appliedMigrations = [
      { migration_name: '20230101_init' },
      { migration_name: '20230201_feature' },
    ];
    vi.mocked(prisma.$queryRaw).mockResolvedValue(appliedMigrations);

    // Mock FS response
    const availableMigrations = ['20230101_init'];
    vi.mocked(fs.readdirSync).mockReturnValue(availableMigrations as any);

    const result = await checkSchemaStatus();

    expect(result.upToDate).toBe(true); // Technically up to date regarding pending work
    expect(result.missing).toEqual(['20230201_feature']);
  });

  it('should handle error when migrations directory is not found', async () => {
     vi.mocked(fs.existsSync).mockReturnValue(false);
     vi.mocked(prisma.$queryRaw).mockResolvedValue([]); // Mock DB success

     const result = await checkSchemaStatus();
     expect(result.error).toContain('Could not locate prisma/migrations directory');
     expect(result.upToDate).toBe(false);
  });
  
  it('should handle DB errors', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(prisma.$queryRaw).mockRejectedValue(new Error('DB connection failed'));
      
      const result = await checkSchemaStatus();
      expect(result.error).toBe('DB connection failed');
      expect(result.upToDate).toBe(false);
  });
});
