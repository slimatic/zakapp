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

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AssetForm } from './AssetForm';
import { useNisabRecordRepository } from '../../hooks/useNisabRecordRepository';
import { usePaymentRepository } from '../../hooks/usePaymentRepository';

/**
 * AssetFormPage - A wrapper component for the AssetForm that handles navigation
 * Used for the /assets/new route to provide proper navigation callbacks
 */
export const AssetFormPage: React.FC = () => {
  const navigate = useNavigate();
  // We don't rely on 'assets' count for the redirect logic itself anymore, 
  // as adding an asset satisfies the first step. We check the other steps.
  const { records } = useNisabRecordRepository();
  const { payments } = usePaymentRepository();

  const handleSuccess = () => {
    // UX Requirement: 
    // If the "Zakat Journey" is incomplete (Progress < 3/3), redirect to Dashboard to guide next steps.
    // "Zakat Journey" steps: 1. Assets, 2. Nisab Record, 3. Payments.
    // Since we just successfully created an asset, Step 1 is done.
    // We check if Step 2 (Records) and Step 3 (Payments) are also done.

    // Note: This assumes repositories have loaded. Since the form interaction takes time, 
    // these should be populated by the time submit happens.
    const hasRecords = records.length > 0;
    const hasPayments = payments.length > 0;
    const isJourneyComplete = hasRecords && hasPayments;

    if (isJourneyComplete) {
      navigate('/assets');
    } else {
      navigate('/dashboard');
    }
  };

  const handleCancel = () => {
    // Navigate back to assets list when user cancels
    navigate('/assets');
  };

  return (
    <AssetForm
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  );
};