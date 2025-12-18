import express from 'express';
import { PrismaClient } from '@prisma/client';
import { EncryptionService } from '../services/EncryptionService';

const router = express.Router();
const prisma = new PrismaClient();

// Development-only diagnostic endpoint to inspect raw payment fields
router.get('/payments-raw', async (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ success: false, error: 'Forbidden' });
  }

  const idsParam = String(req.query.ids || '');
  const ids = idsParam.split(',').map(s => s.trim()).filter(Boolean);

  if (!ids.length) {
    return res.status(400).json({ success: false, error: 'ids query parameter is required' });
  }

  try {
    const rows = await prisma.paymentRecord.findMany({ where: { id: { in: ids } }, select: { id: true, recipientName: true, notes: true, receiptReference: true, amount: true } });

    const inspected = await Promise.all(rows.map(async (r: any) => {
      const result: any = { id: r.id };
      const fields = ['recipientName', 'notes', 'receiptReference', 'amount'];
      for (const f of fields) {
        const val = r[f];
        result[`${f}_raw`] = String(val || '').slice(0, 1000);
        try {
          result[`${f}_isEncrypted`] = typeof val === 'string' ? EncryptionService.isEncrypted(val) : false;
        } catch (e) {
          result[`${f}_isEncrypted`] = false;
        }

        try {
          // If testKey supplied, attempt decryption using it first (does not modify env)
          const testKey = typeof req.query.testKey === 'string' ? req.query.testKey : undefined;
          if (typeof val === 'string' && EncryptionService.isEncrypted(val)) {
            try {
              if (testKey) {
                const decTest = await EncryptionService.decrypt(val, testKey);
                result[`${f}_decrypted_sample`] = String(decTest).slice(0, 1000);
                result[`${f}_decrypted_using_testKey`] = true;
              } else {
                const dec = await EncryptionService.decrypt(val, process.env.ENCRYPTION_KEY || '');
                result[`${f}_decrypted_sample`] = String(dec).slice(0, 1000);
                result[`${f}_decrypted_using_testKey`] = false;
              }
            } catch (e) {
              // Try to decrypt with test key fallback if provided
              if (testKey) {
                result[`${f}_decrypt_error`] = e instanceof Error ? e.message : String(e);
              } else {
                result[`${f}_decrypt_error`] = e instanceof Error ? e.message : String(e);
              }
            }
          } else {
            result[`${f}_decrypted_sample`] = null;
          }
        } catch (e) {
          result[`${f}_decrypt_error`] = e instanceof Error ? e.message : String(e);
        }
      }

      return result;
    }));

    res.json({ success: true, data: inspected });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Unknown error' });
  }
});

export default router;
