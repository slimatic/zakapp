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

import React, { useState, useEffect } from 'react';
import { ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { skipWaiting } from '../../serviceWorkerRegistration';

/**
 * Update Notification Component
 * 
 * Displays a banner when a new service worker version is available.
 * Allows users to manually trigger the update instead of waiting for all tabs to close.
 */

export const UpdateNotification: React.FC = () => {
  const [showUpdate, setShowUpdate] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Listen for service worker updates
      navigator.serviceWorker.ready.then((reg) => {
        // Check for updates every hour
        setInterval(() => {
          reg.update();
        }, 60 * 60 * 1000); // 1 hour

        // Listen for updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;

          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker available
                setRegistration(reg);
                setShowUpdate(true);
              }
            });
          }
        });
      });

      // Listen for controller change (new SW activated)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // Reload the page to load new assets
        window.location.reload();
      });
    }
  }, []);

  const handleUpdate = () => {
    if (registration?.waiting) {
      // Send skip waiting message to the waiting service worker
      skipWaiting();

      // The page will reload automatically when the new SW takes control
      setShowUpdate(false);
    }
  };

  const handleDismiss = () => {
    setShowUpdate(false);

    // Show again after 1 hour if user dismisses
    setTimeout(() => {
      setShowUpdate(true);
    }, 60 * 60 * 1000);
  };

  if (!showUpdate) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-96 bg-indigo-600 text-white rounded-lg shadow-2xl p-4 z-50 animate-slide-down">
      <div className="flex items-start gap-3">
        {/* Update Icon */}
        <div className="flex-shrink-0 w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
          <ArrowPathIcon className="w-5 h-5 text-white" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold mb-1">
            Update Available
          </h3>
          <p className="text-sm text-indigo-100 mb-3">
            A new version of ZakApp is ready. Refresh to get the latest features and improvements.
          </p>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleUpdate}
              className="px-4 py-2 bg-white text-indigo-600 font-medium rounded-lg hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600 transition-colors text-sm"
            >
              Update Now
            </button>

            <button
              onClick={handleDismiss}
              className="px-4 py-2 border border-indigo-400 text-white font-medium rounded-lg hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600 transition-colors text-sm"
            >
              Later
            </button>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 text-indigo-200 hover:text-white rounded-lg hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-white"
          aria-label="Dismiss update notification"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default UpdateNotification;
