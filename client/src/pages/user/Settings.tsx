import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UnifiedImportExport } from '../../components/settings/UnifiedImportExport';
import { Button } from '../../components/ui/Button';

export const Settings: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-4xl mx-auto px-4 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-500">Manage your data and preferences</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            ← Back to Dashboard
          </Button>
        </div>

        <div className="space-y-6">
          {/* Unified Data Management */}
          <UnifiedImportExport />

          {/* Placeholder for future settings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Preferences</h2>
            <p className="text-sm text-gray-500">
              Additional settings for notifications, privacy, and display options will appear here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
