import fs from 'fs-extra';
import path from 'path';

const TEST_DATA_DIR = path.join(process.cwd(), 'debug_direct_test');

describe('Direct File Corruption Test', () => {
  beforeEach(async () => {
    if (await fs.pathExists(TEST_DATA_DIR)) {
      await fs.remove(TEST_DATA_DIR);
    }
    await fs.ensureDir(TEST_DATA_DIR);
  });

  afterEach(async () => {
    if (await fs.pathExists(TEST_DATA_DIR)) {
      await fs.remove(TEST_DATA_DIR);
    }
  });

  it('should demonstrate fs.readJson behavior with empty file', async () => {
    const filePath = path.join(TEST_DATA_DIR, 'empty.json');
    
    // Create empty file
    await fs.writeFile(filePath, '');
    
    // Verify file exists and is empty
    expect(await fs.pathExists(filePath)).toBe(true);
    const content = await fs.readFile(filePath, 'utf8');
    expect(content).toBe('');
    
    // Try to read with fs.readJson - should throw
    await expect(fs.readJson(filePath)).rejects.toThrow();
  });

  it('should demonstrate fs.readJson behavior with malformed JSON', async () => {
    const filePath = path.join(TEST_DATA_DIR, 'malformed.json');
    
    // Create malformed JSON file
    await fs.writeFile(filePath, '{"incomplete": "json"');
    
    // Verify file exists and has malformed content
    expect(await fs.pathExists(filePath)).toBe(true);
    const content = await fs.readFile(filePath, 'utf8');
    expect(content).toBe('{"incomplete": "json"');
    
    // Try to read with fs.readJson - should throw
    await expect(fs.readJson(filePath)).rejects.toThrow(SyntaxError);
  });
});