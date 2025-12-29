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
import { useNavigate, useParams } from 'react-router-dom';
import { useAssetRepository } from '../../hooks/useAssetRepository';
import { AssetForm } from '../../components/assets/AssetForm';
import { LoadingSpinner, ErrorMessage } from '../../components/ui';

export const AssetEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // Fetch assets locally using RxDB repository hook
  const { assets, isLoading, error } = useAssetRepository();
  const asset = assets.find(a => a.id === id);

  const handleSuccess = () => {
    navigate(`/assets/${id}`);
  };

  const handleCancel = () => {
    navigate(`/assets/${id}`);
  };

  // We don't have a refetch method for the realtime subscription, so onRetry is omitted or just reloads
  const handleRetry = () => {
    window.location.reload();
  };

  if (isLoading) return <div className="min-h-64 flex items-center justify-center"><LoadingSpinner /></div>;
  if (error) return <ErrorMessage error={error instanceof Error ? error : new Error(String(error))} onRetry={handleRetry} />;

  // Note: assets might load asynchronously, but isLoading handles initialization. 
  // If initialized and not found, show error.
  if (!isLoading && !asset) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg">
          Asset not found in local database.
        </div>
      </div>
    );
  }

  // If assets empty but loading finished? Handled above.

  return (
    <div className="max-w-4xl mx-auto p-6">
      {asset && <AssetForm asset={asset} onSuccess={handleSuccess} onCancel={handleCancel} />}
    </div>
  );
};

export default AssetEditPage;
