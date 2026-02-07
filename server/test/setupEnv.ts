// Early test setup: ensure all Prisma clients use the TEST_DATABASE_URL when provided
// Force the correct absolute path where migration ran
import path from 'path';

// Resolve database path relative to the server directory (assumed to be CWD)
// Prisma CLI resolves relative paths in DATABASE_URL relative to the schema file location (prisma/schema.prisma)
// So 'file:./test/test.db' in globalSetup becomes 'server/prisma/test/test.db'
const dbPath = path.resolve(process.cwd(), 'prisma/test/test.db');
process.env.DATABASE_URL = `file:${dbPath}`;
process.env.TEST_DATABASE_URL = process.env.DATABASE_URL;

/*
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
} else if (!process.env.DATABASE_URL) {
  // Default to the correct absolute path where migration ran
  process.env.DATABASE_URL = 'file:/home/agentx/github-repos/zakapp/server/prisma/test/test.db';
  process.env.TEST_DATABASE_URL = process.env.DATABASE_URL;
}
*/

// Ensure ENCRYPTION_KEY has a default during tests to avoid runtime errors
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'test-encryption-key-32-chars-!!!';
process.env.JWT_SECRET = 'supersecret';

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
