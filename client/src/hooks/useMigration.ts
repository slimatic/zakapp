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

import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { PaymentEncryptionService } from '../services/PaymentEncryptionService';

const encryptPaymentData = async (payment: any) => {
  return PaymentEncryptionService.encryptPaymentData(payment);
};

export interface MigrationStatus {
  needsMigration: boolean;
  totalPayments: number;
  zkPayments: number;
  serverPayments: number;
}

export function useMigration() {
  const [status, setStatus] = useState<MigrationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Check migration status on mount
  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await apiService.get('/api/user/encryption-status');
        if (res.success && res.data) {
          setStatus(res.data);
        }
      } catch (err) {
        console.error('Failed to check migration status:', err);
      }
    }
    checkStatus();
  }, []);
  
  const startMigration = async () => {
    setIsLoading(true);
    setError(null);
    setProgress(0);
    
    try {
      // Step 1: Get decrypted legacy data from server
      const { data } = await apiService.post('/api/user/prepare-migration');
      
      if (!data || !data.payments) {
        throw new Error('No payments data received from server');
      }
      
      const paymentsToReencrypt = data.payments;
      
      if (paymentsToReencrypt.length === 0) {
        // No payments to migrate
        await apiService.post('/api/user/mark-migrated');
        setStatus({ 
          ...status!, 
          needsMigration: false, 
          zkPayments: status!.totalPayments, 
          serverPayments: 0 
        });
        setProgress(100);
        setIsLoading(false);
        return { success: true };
      }
      
      // Step 2: Re-encrypt each payment with user's password
      for (let i = 0; i < paymentsToReencrypt.length; i++) {
        const payment = paymentsToReencrypt[i];
        
        // Encrypt with client-side key
        const encrypted = await encryptPaymentData(payment);
        
        // Update payment on server
        await apiService.post(`/api/payments/${payment.id}`, encrypted);
        
        // Update progress
        setProgress(Math.round(((i + 1) / paymentsToReencrypt.length) * 100));
      }
      
      // Step 3: Mark user as migrated
      await apiService.post('/api/user/mark-migrated');
      
      setStatus({ 
        ...status!, 
        needsMigration: false, 
        zkPayments: status!.totalPayments, 
        serverPayments: 0 
      });
      setIsLoading(false);
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Migration failed';
      setError(message);
      setIsLoading(false);
      return { success: false, error: message };
    }
  };
  
  return {
    status,
    needsMigration: status?.needsMigration || false,
    migrationProgress: progress,
    isLoading,
    error,
    startMigration
  };
}
