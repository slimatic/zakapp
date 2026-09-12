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
import { getAuthToken } from '../utils/auth';

const VAPID_KEY_URL = '/api/push/vapid-key';
const SUBSCRIBE_URL = '/api/push/subscribe';
const UNSUBSCRIBE_URL = '/api/push/unsubscribe';

export interface PushState {
  supported: boolean;
  permission: NotificationPermission;
  subscribed: boolean;
  loading: boolean;
  error: string | null;
  subscription: PushSubscription | null;
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes.buffer as ArrayBuffer;
}

async function getVapidPublicKey(): Promise<string> {
  const res = await fetch(VAPID_KEY_URL);
  if (!res.ok) throw new Error(`VAPID key fetch failed: ${res.status}`);
  const json = await res.json();
  if (!json.publicKey) throw new Error('No publicKey in response');
  return json.publicKey;
}

async function subscribe(vapidKey: string): Promise<PushSubscription> {
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey),
  });
}

async function persistSubscription(sub: PushSubscription): Promise<void> {
  const token = getAuthToken();
  const res = await fetch(SUBSCRIBE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(sub.toJSON()),
  });
  if (!res.ok) throw new Error(`Subscribe failed: ${res.status}`);
}

async function persistUnsubscribe(sub: PushSubscription): Promise<void> {
  const token = getAuthToken();
  await fetch(UNSUBSCRIBE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ endpoint: sub.endpoint }),
  });
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
