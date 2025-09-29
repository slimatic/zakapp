import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AssetForm } from './AssetForm';

/**
 * AssetFormPage - A wrapper component for the AssetForm that handles navigation
 * Used for the /assets/new route to provide proper navigation callbacks
 */
export const AssetFormPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    // Navigate back to assets list after successful creation
    navigate('/assets');
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