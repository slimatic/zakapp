import fs from 'fs';
import path from 'path';
import os from 'os';

export interface UserConfig {
  currency: string;
  language: string;
  zakatMethod: string;
  calendarType: 'lunar' | 'solar';
  securityKeys?: {
    encryptionKey: string;
    jwtSecret: string;
  };
}

const CONFIG_DIR = path.join(os.homedir(), '.zakapp');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

export const DEFAULT_CONFIG: UserConfig = {
  currency: 'USD',
  language: 'en',
  zakatMethod: 'standard',
  calendarType: 'lunar',
};

export function loadConfig(): UserConfig | null {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      return null;
    }
    const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(data) as UserConfig;
  } catch (error) {
    return null;
  }
}

export function saveConfig(config: UserConfig): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}
