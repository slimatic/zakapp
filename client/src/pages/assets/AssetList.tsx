import React from 'react';
import { AssetList } from '../../components/assets/AssetList';

export const AssetListPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <AssetList />
    </div>
  );
};