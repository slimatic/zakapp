import React from 'react';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';

export const Settings: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 text-center space-y-4">
          <span className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 text-indigo-600 mx-auto">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 3v4M12 17v4M4.93 7.93l2.83 2.83M16.24 15.24l2.83 2.83M3 12h4M17 12h4M4.93 16.07l2.83-2.83M16.24 8.76l2.83-2.83" />
            </svg>
          </span>
          <h1 className="text-3xl font-semibold text-gray-900">Settings Coming Soon</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            We are rebuilding these controls to give you better guidance around notifications, privacy, and UI preferences.
            In the meantime the rest of ZakApp continues to work as expected and you can return to the dashboard.
          </p>
          <div className="pt-4">
            <Button variant="secondary" onClick={() => navigate('/dashboard')}>
              ← Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
