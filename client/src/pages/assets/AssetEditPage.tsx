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
