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
                        // Only encrypt if changed/present and not already encrypted
                        if (data[path] && data[path] !== oldData[path]) {
                            // Check if it looks like it's already encrypted (avoid double encryption)
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
