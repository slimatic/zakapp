import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAsset } from '../../services/apiHooks';
import { AssetForm } from '../../components/assets/AssetForm';
import { LoadingSpinner, ErrorMessage } from '../../components/ui';

export const AssetEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: assetData, isLoading, error, refetch } = useAsset(id!);

  const asset = (assetData?.data && (assetData.data.asset || assetData.data)) || undefined;

  const handleSuccess = () => {
    navigate(`/assets/${id}`);
  };

  const handleCancel = () => {
    navigate(`/assets/${id}`);
  };

  if (isLoading) return <div className="min-h-64 flex items-center justify-center"><LoadingSpinner /></div>;
  if (error) return <ErrorMessage error={error} onRetry={refetch} />;
  if (!asset) return <div className="max-w-4xl mx-auto p-6">Asset not found</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <AssetForm asset={asset} onSuccess={handleSuccess} onCancel={handleCancel} />
    </div>
  );
};

export default AssetEditPage;
