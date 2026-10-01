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
      <div className="bg-accent border border-border rounded-lg p-4">
        <div className="flex items-center gap-2 text-primary">
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
            <Bell className="w-5 h-5 text-primary" />
          ) : (
            <BellOff className="w-5 h-5 text-muted-foreground" />
          )}
          <div>
            <h3 className="text-sm font-medium text-foreground">Push Notifications</h3>
            <p className="text-sm text-muted-foreground">
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
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : subscribed
              ? 'bg-danger-soft text-danger hover:bg-danger/20'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/90'
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
        <div className="bg-danger-soft border border-danger/30 rounded-lg p-3">
          <p className="text-sm text-danger">
            Notification permission was denied. Please enable it in your browser settings to
            receive reminders.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-danger-soft border border-danger/30 rounded-lg p-3">
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      {subscribed && (
        <div className="bg-success-soft border border-success/30 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm text-success">
            <CheckCircle2 className="w-4 h-4" />
            Push notifications are active on this device.
          </div>
        </div>
      )}
    </div>
  );
};
