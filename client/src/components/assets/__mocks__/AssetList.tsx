import React from 'react';
import { useAssets } from '../../../services/apiHooks';

export const AssetList = () => {
  const assets = useAssets().data.data.assets || [];
  return (
    <div data-testid="asset-list">
      {assets.map((a: any) => (
        <div key={a.assetId}>
          {a.name}
          {a.zakatEligible && a.isPassiveInvestment ? ' Passive' : ''}
        </div>
      ))}
    </div>
  );
};
