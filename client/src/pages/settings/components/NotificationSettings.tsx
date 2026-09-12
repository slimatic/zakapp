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

/**
 * Notifications settings (#383).
 *
 * Toggle to enable/disable push notifications for Zakat reminders.
 * Uses the usePush hook to manage subscription state.
 */

import React from 'react';
import { Bell, BellOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { usePush } from '../../../hooks/usePush';

export const NotificationSettings: React.FC = () => {
  const { supported, permission, subscribed, loading, error, enable, disable } = usePush();

  if (!supported) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-yellow-800">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm">
            Push notifications are not supported in this browser. Please use a modern browser
            (Chrome, Firefox, Edge, or Safari) over HTTPS.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {subscribed ? (
            <Bell className="w-5 h-5 text-green-600" />
          ) : (
            <BellOff className="w-5 h-5 text-gray-400" />
          )}
          <div>
            <h3 className="text-sm font-medium text-gray-900">Push Notifications</h3>
            <p className="text-sm text-gray-500">
              {subscribed
                ? 'You will receive Zakat reminders 30, 7, and 1 day before due dates.'
                : 'Get reminded when your Zakat is due.'}
            </p>
          </div>
        </div>

        <button
          onClick={subscribed ? disable : enable}
          disabled={loading || permission === 'denied'}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            loading
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : subscribed
              ? 'bg-red-100 text-red-700 hover:bg-red-200'
              : 'bg-emerald-600 text-white hover:bg-emerald-700'
          }`}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Working...
            </span>
          ) : subscribed ? (
            'Disable'
          ) : (
            'Enable'
          )}
        </button>
      </div>

      {permission === 'denied' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-700">
            Notification permission was denied. Please enable it in your browser settings to
            receive reminders.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {subscribed && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm text-green-700">
            <CheckCircle2 className="w-4 h-4" />
            Push notifications are active on this device.
          </div>
        </div>
      )}
    </div>
  );
};
