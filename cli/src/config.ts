/**
 * Copyright (c) 2024-2026 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

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
