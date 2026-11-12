/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
// @ts-nocheck — better-sqlite3 ships no types; vitest transpiles, tsc does not need to.
import { describe, it, expect } from 'vitest';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { sqliteFileUrl } from '../../src/config/prismaAdapter';

describe('sqliteFileUrl', () => {
    it('drops the Prisma 6 connection options that are not a filename', () => {
        // This exact string shipped in docker-compose and made production open
        // an empty database called "prod.db?connection_limit=1".
        expect(sqliteFileUrl('file:/app/server/prisma/data/prod.db?connection_limit=1'))
            .toBe('file:/app/server/prisma/data/prod.db');
    });

    it('leaves a plain file URL and :memory: untouched', () => {
        expect(sqliteFileUrl('file:./dev.db')).toBe('file:./dev.db');
        expect(sqliteFileUrl('file::memory:')).toBe('file::memory:');
    });

    it('does not touch a non-file URL', () => {
        expect(sqliteFileUrl('postgres://user:pw@host/db?sslmode=require'))
            .toBe('postgres://user:pw@host/db?sslmode=require');
    });

    it('opens the real file, where the raw URL created a question-mark sibling', () => {
        const dir = mkdtempSync(join(tmpdir(), 'zakapp-adapter-'));
        try {
            const target = join(dir, 'prod.db');
            const raw = `${target}?connection_limit=1`;

            // Control: the old behaviour. better-sqlite3 treats the query as
            // part of the name, which is what production did.
            new Database(raw).close();
            expect(readdirSync(dir)).toContain('prod.db?connection_limit=1');

            // Fixed behaviour.
            new Database(sqliteFileUrl(`file:${raw}`).replace('file:', '')).close();
            expect(readdirSync(dir)).toContain('prod.db');
        } finally {
            rmSync(dir, { recursive: true, force: true });
        }
    });
});
