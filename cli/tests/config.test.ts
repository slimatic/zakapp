import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { loadConfig, saveConfig, DEFAULT_CONFIG, UserConfig } from '../src/config';

// Mock fs and os
vi.mock('fs');
vi.mock('os', () => ({
  default: {
    homedir: () => '/mock/home',
  },
  homedir: () => '/mock/home',
}));

describe('Config Manager', () => {
  const mockHomeDir = '/mock/home';
  const mockConfigDir = path.join(mockHomeDir, '.zakapp');
  const mockConfigFile = path.join(mockConfigDir, 'config.json');

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('loadConfig', () => {
    it('should return null if config file does not exist', () => {
      (fs.existsSync as any).mockReturnValue(false);
      const config = loadConfig();
      expect(config).toBeNull();
      expect(fs.existsSync).toHaveBeenCalledWith(mockConfigFile);
    });

    it('should return parsed config if file exists', () => {
      const mockConfig: UserConfig = { ...DEFAULT_CONFIG, currency: 'EUR' };
      (fs.existsSync as any).mockReturnValue(true);
      (fs.readFileSync as any).mockReturnValue(JSON.stringify(mockConfig));

      const config = loadConfig();
      expect(config).toEqual(mockConfig);
      expect(fs.readFileSync).toHaveBeenCalledWith(mockConfigFile, 'utf-8');
    });

    it('should return null if file content is invalid JSON', () => {
      (fs.existsSync as any).mockReturnValue(true);
      (fs.readFileSync as any).mockReturnValue('invalid json');

      const config = loadConfig();
      expect(config).toBeNull();
    });
  });

  describe('saveConfig', () => {
    it('should create directory if it does not exist', () => {
      (fs.existsSync as any).mockReturnValue(false);
      const newConfig: UserConfig = { ...DEFAULT_CONFIG };

      saveConfig(newConfig);

      expect(fs.existsSync).toHaveBeenCalledWith(mockConfigDir);
      expect(fs.mkdirSync).toHaveBeenCalledWith(mockConfigDir, { recursive: true });
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        mockConfigFile,
        JSON.stringify(newConfig, null, 2),
        'utf-8'
      );
    });

    it('should save config to file', () => {
      (fs.existsSync as any).mockReturnValue(true);
      const newConfig: UserConfig = { ...DEFAULT_CONFIG, language: 'ar' };

      saveConfig(newConfig);

      expect(fs.mkdirSync).not.toHaveBeenCalled();
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        mockConfigFile,
        JSON.stringify(newConfig, null, 2),
        'utf-8'
      );
    });
  });
});
