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

import React, { useState } from 'react';
import { useMigration } from '../../hooks/useMigration';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Progress } from '../ui/Progress';

export interface MigrationWizardProps {
  open: boolean;
  onClose: () => void;
}

export function MigrationWizard({ open, onClose }: MigrationWizardProps) {
  const { status, migrationProgress, isLoading, error, startMigration } = useMigration();
  const [step, setStep] = useState<'intro' | 'confirm' | 'progress' | 'success'>('intro');
  const [acknowledged, setAcknowledged] = useState(false);
  
  const handleStart = async () => {
    setStep('progress');
    const result = await startMigration();
    if (result.success) {
      setStep('success');
    }
  };
  
  const handleClose = () => {
    // Reset wizard state when closing
    setStep('intro');
    setAcknowledged(false);
    onClose();
  };
  
  return (
    <Modal 
      isOpen={open} 
      onClose={handleClose}
      size="md"
      showCloseButton={step !== 'progress'}
    >
      {step === 'intro' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Privacy Upgrade Available</h2>
          </div>
          
          <p className="text-gray-700">
            We've enhanced ZakApp's encryption! <strong className="font-semibold">{status?.serverPayments || 0}</strong> of your payments can be upgraded to zero-knowledge encryption.
          </p>
          
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="font-semibold text-green-900 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Benefits:
            </p>
            <ul className="list-disc list-inside text-sm text-green-800 space-y-1">
              <li>Server cannot read your payment data</li>
              <li>Maximum privacy protection</li>
              <li>Your data encrypted with your password</li>
            </ul>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <p className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Important Trade-offs:
            </p>
            <ul className="list-disc list-inside text-sm text-yellow-800 space-y-1">
              <li>Lost password = lost data</li>
              <li>No account recovery possible</li>
              <li>You are responsible for password security</li>
            </ul>
          </div>
          
          <div className="flex gap-3 pt-2">
            <Button onClick={() => setStep('confirm')} className="flex-1">
              Upgrade Now
            </Button>
            <Button onClick={handleClose} variant="outline" className="flex-1">
              Skip for Now
            </Button>
          </div>
        </div>
      )}
      
      {step === 'confirm' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-amber-100 rounded-lg">
              <svg className="w-8 h-8 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Password Responsibility</h2>
          </div>
          
          <div className="bg-amber-50 p-4 rounded-lg border-2 border-amber-300">
            <p className="text-sm text-gray-800 leading-relaxed">
              After this upgrade, your payment data will be encrypted with <strong>YOUR password</strong>. 
              If you lose your password, we <strong className="text-amber-900">CANNOT</strong> recover your data.
            </p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm font-medium text-blue-900 mb-2">Recommended Security Practices:</p>
            <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
              <li>Use a strong, unique password</li>
              <li>Write it down in a secure place</li>
              <li>Consider using a password manager</li>
              <li>Never share your password</li>
            </ul>
          </div>
          
          <label className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
            <input 
              type="checkbox" 
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-1 h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-900 flex-1">
              I understand that I am solely responsible for my password and that losing it will result in permanent data loss. 
              I will keep my password safe and secure.
            </span>
          </label>
          
          <div className="flex gap-3 pt-2">
            <Button 
              onClick={handleStart} 
              disabled={!acknowledged}
              className="flex-1"
            >
              Yes, Upgrade My Data
            </Button>
            <Button onClick={() => setStep('intro')} variant="outline" className="flex-1">
              Back
            </Button>
          </div>
        </div>
      )}
      
      {step === 'progress' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-indigo-100 rounded-lg animate-pulse">
              <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Upgrading Encryption...</h2>
          </div>
          
          <div className="space-y-3">
            <Progress value={migrationProgress} />
            <p className="text-center text-2xl font-bold text-primary-600">{migrationProgress}%</p>
            <p className="text-sm text-gray-600 text-center">
              Re-encrypting {status?.serverPayments || 0} payment{(status?.serverPayments || 0) !== 1 ? 's' : ''}...
            </p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-900">Please keep this window open</p>
                <p className="text-xs text-blue-700 mt-1">
                  Your payment data is being securely re-encrypted. This process may take a few moments.
                </p>
              </div>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-red-900">Migration Error</p>
                  <p className="text-xs text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {step === 'success' && (
        <div className="space-y-6">
          <div className="flex flex-col items-center text-center">
            <div className="p-4 bg-green-100 rounded-full mb-4">
              <svg className="w-12 h-12 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Upgrade Complete!</h2>
            <p className="text-gray-700">
              All your payment data is now protected with zero-knowledge encryption.
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-lg border-2 border-blue-200">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="font-semibold text-blue-900 mb-2">Remember:</p>
                <p className="text-sm text-blue-800">
                  Keep your password safe! Write it down in a secure place or use a password manager. 
                  Without your password, your encrypted data cannot be recovered.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-semibold text-green-900">Zero-Knowledge Encrypted</span>
          </div>
          
          <Button onClick={handleClose} className="w-full" size="lg">
            Got It
          </Button>
        </div>
      )}
    </Modal>
  );
}
