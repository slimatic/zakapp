/**
 * Copyright (c) 2024 ZakApp Contributors
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

/**
 * Logger Utility
 * Simple logging wrapper for consistent logging across services
 */

// Build one already-formatted string instead of passing a tainted value as
// console's first argument: console treats the first argument as a printf-style
// format string when more arguments follow (js/tainted-format-string, CWE-134).
// Line breaks are removed with an empty replacement, which the log-injection
// query recognises as a sanitizer (js/log-injection, CWE-117).
function logLine(context: string, level: string, message: string, extra?: unknown): string {
  const text = `[${context}] ${level}: ${String(message).replace(/\r/g, '').replace(/\n/g, '')}`;
  if (extra === undefined || extra === '') {
    return text;
  }
  try {
    // JSON.stringify escapes line breaks and keeps objects readable.
    return text + ' ' + JSON.stringify(extra);
  } catch {
    return text + ' [unserializable]';
  }
}

export class Logger {
  constructor(private context: string) {}

  info(message: string, data?: any): void {
    if (process.env.NODE_ENV !== 'production') {
      console.log(logLine(this.context, 'INFO', message, data));
    }
  }

  error(message: string, error?: any): void {
    console.error(logLine(this.context, 'ERROR', message, error));
  }

  warn(message: string, data?: any): void {
    console.warn(logLine(this.context, 'WARN', message, data));
  }

  debug(message: string, data?: any): void {
    if (process.env.DEBUG) {
      console.debug(logLine(this.context, 'DEBUG', message, data));
    }
  }
}

// Export default singleton logger instance for use in preciousMetalsApi.ts
export const logger = new Logger('APP');
