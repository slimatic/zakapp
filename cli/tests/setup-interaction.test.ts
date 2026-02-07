import { describe, it, expect, vi, beforeEach } from 'vitest';
import inquirer from 'inquirer';
import { setupCommand } from '../src/commands/setup';
import * as configModule from '../src/config';
import chalk from 'chalk';

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

describe('Setup Command Interaction', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should load existing config and use it as defaults', async () => {
    // Arrange
    const existingConfig = {
      currency: 'EUR',
      language: 'ar',
      zakatMethod: 'hanafi',
      calendarType: 'solar',
    };
    (configModule.loadConfig as any).mockReturnValue(existingConfig);
    
    // Mock inquirer to return a promise that resolves to answers
    const promptSpy = vi.spyOn(inquirer, 'prompt').mockResolvedValue({
      continue: true,
      currency: 'EUR',
      language: 'ar',
      zakatMethod: 'hanafi',
      calendarType: 'solar',
    });

    // Act
    await setupCommand.parseAsync(['node', 'test', 'setup']);

    // Assert
    expect(configModule.loadConfig).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Existing configuration found'));
    
    // Check if defaults were passed correctly to inquirer
    const calls = promptSpy.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const questions = calls[0][0] as any[];
    
    const currencyQ = questions.find(q => q.name === 'currency');
    expect(currencyQ.default).toBe('EUR');
    
    const languageQ = questions.find(q => q.name === 'language');
    expect(languageQ.default).toBe('ar');

    expect(configModule.saveConfig).toHaveBeenCalledWith(existingConfig);
  });

  it('should use default config if no existing config found', async () => {
    // Arrange
    (configModule.loadConfig as any).mockReturnValue(null);
    
    const promptSpy = vi.spyOn(inquirer, 'prompt').mockResolvedValue({
      continue: true,
      currency: 'USD',
      language: 'en',
      zakatMethod: 'standard',
      calendarType: 'lunar',
    });

    // Act
    await setupCommand.parseAsync(['node', 'test', 'setup']);

    // Assert
    expect(configModule.loadConfig).toHaveBeenCalled();
    
    const questions = (promptSpy.mock.calls[0][0] as any[]);
    const currencyQ = questions.find(q => q.name === 'currency');
    expect(currencyQ.default).toBe(configModule.DEFAULT_CONFIG.currency);
  });

  it('should save the new configuration', async () => {
    // Arrange
    (configModule.loadConfig as any).mockReturnValue(null);
    
    const newAnswers = {
      continue: true,
      currency: 'GBP',
      language: 'en',
      zakatMethod: 'shafii',
      calendarType: 'lunar',
    };
    
    vi.spyOn(inquirer, 'prompt').mockResolvedValue(newAnswers);

    // Act
    await setupCommand.parseAsync(['node', 'test', 'setup']);

    // Assert
    const expectedConfig = {
      currency: 'GBP',
      language: 'en',
      zakatMethod: 'shafii',
      calendarType: 'lunar',
    };
    expect(configModule.saveConfig).toHaveBeenCalledWith(expectedConfig);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Configuration saved successfully'));
  });

  it('should not save if setup is cancelled', async () => {
    // Arrange
    (configModule.loadConfig as any).mockReturnValue(null);
    
    vi.spyOn(inquirer, 'prompt').mockResolvedValue({
      continue: false
    });

    // Act
    await setupCommand.parseAsync(['node', 'test', 'setup']);

    // Assert
    expect(configModule.saveConfig).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Setup cancelled'));
  });
});
