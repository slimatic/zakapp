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
 * Push subscription hook (#383).
 *
 * Wraps the browser PushManager + our API:
 *   - Fetches the VAPID public key from GET /api/push/vapid-key
 *   - Subscribes the PushManager and POSTs the subscription to /api/push/subscribe
 *   - Handles permission state + loading/error states for the UI
 *   - Unsubscribes on request and POSTs to /api/push/unsubscribe
 */

import { useCallback, useEffect, useState } from 'react';
import {
  getVapidPublicKey,
  persistSubscription,
  persistUnsubscribe,
  subscribe,
} from '../services/pushService';

export interface PushState {
  supported: boolean;
  permission: NotificationPermission;
  subscribed: boolean;
  loading: boolean;
  error: string | null;
  subscription: PushSubscription | null;
}

export function usePush(): PushState & { enable: () => Promise<void>; disable: () => Promise<void> } {
  const supported = 'serviceWorker' in navigator && 'PushManager' in window;
  const [permission, setPermission] = useState<NotificationPermission>(
    supported ? Notification.permission : 'denied',
  );
  const [subscribed, setSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refresh existing subscription state on mount.
  useEffect(() => {
    if (!supported) return;
    let cancelled = false;
    (async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const existing = await reg.pushManager.getSubscription();
        if (!cancelled) {
          setSubscription(existing);
          setSubscribed(!!existing);
          setPermission(Notification.permission);
        }
      } catch {
        /* ignore — will show as not-subscribed */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supported]);

  const enable = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (Notification.permission === 'denied') {
        throw new Error('Notification permission denied — enable it in your browser settings.');
      }
      const vapidKey = await getVapidPublicKey();
      const sub = await subscribe(vapidKey);
      await persistSubscription(sub);
      setSubscription(sub);
      setSubscribed(true);
      setPermission(Notification.permission);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enable notifications');
      setSubscribed(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const disable = useCallback(async () => {
    if (!subscription) return;
    setLoading(true);
    setError(null);
    try {
      await persistUnsubscribe(subscription);
      await subscription.unsubscribe();
      setSubscription(null);
      setSubscribed(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disable notifications');
    } finally {
      setLoading(false);
    }
  }, [subscription]);

  return { supported, permission, subscribed, loading, error, subscription, enable, disable };
}
