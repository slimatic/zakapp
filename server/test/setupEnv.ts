// Early test setup: ensure all Prisma clients use the TEST_DATABASE_URL when provided
// Force the correct absolute path where migration ran
import { resolveTestDbUrl } from './dbUrl';

// Same rule globalSetup used to migrate: a relative file: URL is resolved
// against the cwd, then handed to every client as an absolute path.
const dbUrl = resolveTestDbUrl();
process.env.DATABASE_URL = dbUrl;
process.env.TEST_DATABASE_URL = dbUrl;

// Ensure ENCRYPTION_KEY has a default during tests to avoid runtime errors
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'test-encryption-key-32-chars-!!!';
process.env.JWT_SECRET = 'supersecret';
process.env.JWT_ACCESS_SECRET = 'supersecret';
process.env.JWT_REFRESH_SECRET = 'supersecret-refresh';
process.env.APP_URL = 'http://localhost:3000';
process.env.FRONTEND_URL = 'http://localhost:3000';

// Polyfill File for environments where it's missing (needed by some undici/fetch versions)
if (typeof File === 'undefined') {
  (global as any).File = class File extends Blob {
    name: string;
    lastModified: number;
    constructor(parts: any[], name: string, options?: any) {
      super(parts, options);
      this.name = name;
      this.lastModified = options?.lastModified || Date.now();
    }
  };
}

export { };
