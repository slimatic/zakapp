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

import express from 'express';
import EncryptionAdminService from '../../services/EncryptionAdminService';
import { requireAdmin } from '../../middleware/AuthMiddleware';

const router = express.Router();

// Trigger a scan for undecryptable records and create remediation entries
router.post('/scan', requireAdmin, async (req, res) => {
  try {
    const result = await EncryptionAdminService.scanForIssues();
    res.json({ success: true, created: result.created });
  } catch (e) {
    res.status(500).json({ success: false, error: 'SCAN_FAILED', message: e instanceof Error ? e.message : String(e) });
  }
});

// List remediation issues
router.get('/issues', requireAdmin, async (req, res) => {
  try {
    const issues = await EncryptionAdminService.listIssues();
    res.json({ success: true, issues });
  } catch (e) {
    res.status(500).json({ success: false, error: 'LIST_FAILED', message: e instanceof Error ? e.message : String(e) });
  }
});

// Retry remediation with provided key
router.post('/:id/retry', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { key } = req.body;
  if (!key) return res.status(400).json({ success: false, error: 'MISSING_KEY', message: 'Key is required' });

  try {
    const adminId = (req as any).user?.id;
    await EncryptionAdminService.retryWithKey(id as string, key, adminId);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: 'RETRY_FAILED', message: e instanceof Error ? e.message : String(e) });
  }
});

router.post('/:id/unrecoverable', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { note } = req.body;
  try {
    const adminId = (req as any).user?.id;
    const rem = await EncryptionAdminService.markUnrecoverable(id as string, adminId, note);
    res.json({ success: true, remediation: rem });
  } catch (e) {
    res.status(500).json({ success: false, error: 'MARK_FAILED', message: e instanceof Error ? e.message : String(e) });
  }
});

export default router;
