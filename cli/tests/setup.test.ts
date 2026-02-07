import { describe, it, expect } from 'vitest';
import { setupCommand } from '../src/commands/setup';

describe('Setup Command', () => {
  it('should be defined', () => {
    expect(setupCommand).toBeDefined();
  });

  it('should have the correct name', () => {
    expect(setupCommand.name()).toBe('setup');
  });

  it('should have the correct description', () => {
    expect(setupCommand.description()).toBe('Setup Zakapp configuration');
  });
});
