import { describe, it, expect, afterEach } from 'vitest';
import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { param } from '../utils/params';
import { sqliteAdapter } from './prismaAdapter';

describe('param', () => {
  it('passes a single value through', () => {
    expect(param('abc')).toBe('abc');
  });

  it('takes the first value when a name repeats', () => {
    expect(param(['first', 'second'])).toBe('first');
  });

  it('returns an empty string rather than undefined', () => {
    expect(param(undefined)).toBe('');
    expect(param([])).toBe('');
  });
});

describe('sqliteAdapter', () => {
  const dir = path.join(os.tmpdir(), `zakapp-adapter-${process.pid}`);
  const file = path.join(dir, 'nested', 'test.db');

  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it('creates the parent directory Prisma 6 used to create', () => {
    expect(existsSync(path.dirname(file))).toBe(false);
    sqliteAdapter(`file:${file}`);
    expect(existsSync(path.dirname(file))).toBe(true);
  });

  it('leaves an in-memory url alone', () => {
    const adapter = sqliteAdapter(':memory:');
    expect(adapter.provider).toBe('sqlite');
  });
});
