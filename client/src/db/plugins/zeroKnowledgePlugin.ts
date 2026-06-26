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

import { RxPlugin, RxCollection, RxDocument } from 'rxdb';
import { cryptoService } from '../../services/CryptoService';

export const RxDBZeroKnowledgePlugin: RxPlugin = {
    name: 'zero-knowledge-encryption',
    rxdb: true,
    hooks: {
        createRxCollection: {
            // @ts-ignore
            after: ({ collection }: { collection: RxCollection }) => {
                // Identify encrypted paths from schema
                const schema = collection.schema.jsonSchema;
                const encryptedPaths: string[] = [];

                if (schema.properties) {
                    Object.keys(schema.properties).forEach(key => {
                        if ((schema.properties[key] as any).encrypted) {
                            encryptedPaths.push(key);
                        }
                    });
                }

                if (encryptedPaths.length === 0) return;

                // Hook: preInsert - Encrypt data before storage
                collection.preInsert(async (data: any) => {
                    for (const path of encryptedPaths) {
                        if (data[path]) {
                            try {
                                const { cipherText, iv } = await cryptoService.encrypt(data[path]);
                                data[path] = cryptoService.packEncrypted(iv, cipherText);
                            } catch (e) {
                                console.error(`ZK Encryption failed for ${path}`, e);
                                // Safety: Fail the insert rather than storing cleartext
                                throw new Error('Encryption failed');
                            }
                        }
                    }
                    return data;
                }, false);

                // Hook: preSave - Encrypt data before update
                collection.preSave(async (data: any, oldData: any) => {
                    for (const path of encryptedPaths) {
                        // Logic: If field exists AND is not already encrypted...
                        // We do NOT check if it changed. We secure it if it's open.
                        if (data[path]) {
                            // Check if it's already encrypted
                            if (cryptoService.isEncrypted(data[path])) continue;

                            try {
                                const { cipherText, iv } = await cryptoService.encrypt(data[path]);
                                data[path] = cryptoService.packEncrypted(iv, cipherText);
                            } catch (e) {
                                console.error(`ZK Encryption failed for ${path}`, e);
                                throw new Error('Encryption failed');
                            }
                        }
                    }
                    return data;
                }, false);

                // No postCreate helper - Decryption must happen in UI/Service layer asynchronously
            }
        }
    }
};
