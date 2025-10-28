/**
 * Logger Utility
 * Simple logging wrapper for consistent logging across services
 */

export class Logger {
  constructor(private context: string) {}

  info(message: string, data?: any): void {
    console.log(`[${this.context}] INFO: ${message}`, data || '');
  }

  error(message: string, error?: any): void {
    console.error(`[${this.context}] ERROR: ${message}`, error || '');
  }

  warn(message: string, data?: any): void {
    console.warn(`[${this.context}] WARN: ${message}`, data || '');
  }

  debug(message: string, data?: any): void {
    if (process.env.DEBUG) {
      console.debug(`[${this.context}] DEBUG: ${message}`, data || '');
    }
  }
}

// Export default singleton logger instance for use in preciousMetalsApi.ts
export const logger = new Logger('APP');
