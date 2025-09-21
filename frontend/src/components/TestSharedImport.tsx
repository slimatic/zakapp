// Simple test component to verify shared types work
import { ASSET_CATEGORIES } from '@zakapp/shared';

export const TestSharedImport = () => {
  const categories = Object.values(ASSET_CATEGORIES);

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-2">Shared Types Test</h3>
      <p className="text-sm text-gray-600 mb-2">
        Successfully imported {categories.length} asset categories from shared
        package:
      </p>
      <ul className="text-xs space-y-1">
        {categories.map(category => (
          <li key={category.id} className="flex justify-between">
            <span>{category.name}</span>
            <span className="text-gray-500">{category.zakatRate}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
