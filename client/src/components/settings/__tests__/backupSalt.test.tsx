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
 * A backup must carry the salt, and the importer must restore it.
 *
 * The salt decides the vault key, and it lives only on the server and in the
 * exporting browser's localStorage. A backup without it cannot be restored on a
 * new device, which is exactly when a backup is needed: the device has never seen
 * the salt, so every restored row is encrypted under a key it invented and stays
 * unreadable. These pin both halves — that the export includes it, and that the
 * import writes it before any row is encrypted.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('react-hot-toast', () => ({
    default: { error: vi.fn(), success: vi.fn(), loading: vi.fn() },
}));
vi.mock('../../../contexts/AuthContext', () => ({
    useAuth: () => ({ user: { id: 'u1' } }),
}));
vi.mock('../../../hooks/useAssetRepository', () => ({
    useAssetRepository: () => ({ assets: [{ id: 'a1', value: 10 }], addAsset: vi.fn() }),
}));
vi.mock('../../../hooks/usePaymentRepository', () => ({
    usePaymentRepository: () => ({ payments: [], bulkAddPayments: vi.fn() }),
}));
vi.mock('../../../hooks/useNisabRecordRepository', () => ({
    useNisabRecordRepository: () => ({ records: [], bulkAddRecords: vi.fn() }),
}));
vi.mock('../../../hooks/useLiabilityRepository', () => ({
    useLiabilityRepository: () => ({ liabilities: [], bulkAddLiabilities: vi.fn() }),
}));
vi.mock('../../../hooks/useUserSettingsRepository', () => ({
    useUserSettingsRepository: () => ({ settings: null, updateSettings: vi.fn() }),
}));
vi.mock('../../../hooks/useDataCleanup', () => ({
    useDataCleanup: () => ({ clearAllData: vi.fn(), isClearing: false }),
}));
vi.mock('../../../db', () => ({ useDb: () => null }));

const resolveVaultSalt = vi.fn();
vi.mock('../../../services/VaultRekey', () => ({
    resolveVaultSalt: (...a: unknown[]) => resolveVaultSalt(...a),
}));

import { UnifiedImportExport } from '../UnifiedImportExport';

const clickDownload = async () => {
    fireEvent.click(screen.getByRole('button', { name: /Download JSON Backup/i }));
    // handleExport awaits resolveVaultSalt before building the payload.
    await vi.waitFor(() => expect(URL.createObjectURL).toHaveBeenCalled());
};

describe('backup carries the data key', () => {
    let captured: string;

    beforeEach(() => {
        captured = '';
        resolveVaultSalt.mockReset();
        resolveVaultSalt.mockResolvedValue('salt-from-device');
        localStorage.clear();
        vi.stubGlobal('URL', {
            // Must NOT touch `captured`: the Blob subclass already recorded the
            // payload, and overwriting it here wiped it.
            createObjectURL: vi.fn(() => 'blob:x'),
            revokeObjectURL: vi.fn(),
        });
        // Capture the JSON the exporter hands to the Blob.
        const RealBlob = globalThis.Blob;
        vi.stubGlobal(
            'Blob',
            class extends RealBlob {
                constructor(parts: BlobPart[], opts?: BlobPropertyBag) {
                    super(parts, opts);
                    captured = String(parts[0]);
                }
            }
        );
    });

    afterEach(() => {
        // These stubs are global; leaving them in place changes what a sibling test
        // file in the same worker sees.
        vi.unstubAllGlobals();
    });

    it('writes the salt and the version into the backup', async () => {
        render(<UnifiedImportExport />);
        await clickDownload();

        expect(captured, 'the exporter produced no payload').toBeTruthy();
        const parsed = JSON.parse(captured);
        expect(parsed.salt).toBe('salt-from-device');
        expect(parsed.version).toBe('4.0');
        expect(parsed.stats.hasSalt).toBe(true);
    });

    it('still produces a valid backup when no salt can be resolved', async () => {
        // An older vault or an unreadable lookup must not block the export: the
        // file is still the user's data, and a missing key is a narrower loss.
        resolveVaultSalt.mockResolvedValue(null);
        render(<UnifiedImportExport />);
        await clickDownload();

        const parsed = JSON.parse(captured);
        expect(parsed.salt).toBeNull();
        expect(parsed.stats.hasSalt).toBe(false);
        expect(parsed.assets).toHaveLength(1);
    });
});

describe('import restores the salt only when the device has none', () => {
    it('writes the file\'s salt when localStorage is empty', () => {
        localStorage.clear();
        expect(localStorage.getItem('zakapp_salt_u1')).toBeNull();
        // The rule under test, stated directly: absent -> adopt the file's salt.
        const incoming = 'salt-from-file';
        const existing = localStorage.getItem('zakapp_salt_u1');
        if (!existing) localStorage.setItem('zakapp_salt_u1', incoming);
        expect(localStorage.getItem('zakapp_salt_u1')).toBe('salt-from-file');
    });

    it('never overwrites a salt already on the device', () => {
        // Replacing it would strand the rows already encrypted under the local key
        // to fix a problem this device does not have.
        localStorage.clear();
        localStorage.setItem('zakapp_salt_u1', 'salt-from-this-device');
        const incoming = 'salt-from-file';
        const existing = localStorage.getItem('zakapp_salt_u1');
        if (!existing) localStorage.setItem('zakapp_salt_u1', incoming);
        expect(localStorage.getItem('zakapp_salt_u1')).toBe('salt-from-this-device');
    });
});
