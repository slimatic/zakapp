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
 * Push subscription helpers.
 *
 * Extracted from `hooks/usePush` so the logout path can unsubscribe the
 * current device without mounting a React hook. See #383.
 */

import { getAuthToken } from '../utils/auth';

export const VAPID_KEY_URL = '/api/push/vapid-key';
export const SUBSCRIBE_URL = '/api/push/subscribe';
export const UNSUBSCRIBE_URL = '/api/push/unsubscribe';

export function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes.buffer as ArrayBuffer;
}

export async function getVapidPublicKey(): Promise<string> {
  const res = await fetch(VAPID_KEY_URL);
  if (!res.ok) throw new Error(`VAPID key fetch failed: ${res.status}`);
  const json = await res.json();
  if (!json.publicKey) throw new Error('No publicKey in response');
  return json.publicKey;
}

export async function subscribe(vapidKey: string): Promise<PushSubscription> {
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey),
  });
}

export async function persistSubscription(sub: PushSubscription): Promise<void> {
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

export async function persistUnsubscribe(sub: PushSubscription): Promise<void> {
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

export function pushSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator &&
    typeof window !== 'undefined' &&
    'PushManager' in window
  );
}

/**
 * Detach this device from push notifications.
 *
 * MUST be called BEFORE the access token is cleared — `persistUnsubscribe`
 * sends the endpoint to the server as an authenticated request, so dropping
 * the token first means the server keeps the endpoint on file and the
 * logged-out device keeps receiving notifications.
 *
 * Best-effort by design: a failure here must never block logout. The browser
 * subscription is still torn down locally so this device stops receiving push
 * even if the server call fails.
 *
 * @returns true if a server-side unsubscribe was performed.
 */
export async function unsubscribeCurrentDevice(): Promise<boolean> {
  if (!pushSupported()) return false;

  let sub: PushSubscription | null = null;
  try {
    const reg = await navigator.serviceWorker.ready;
    sub = await reg.pushManager.getSubscription();
  } catch {
    return false; // no SW / not ready — nothing to detach
  }
  if (!sub) return false;

  let serverOk = false;
  try {
    await persistUnsubscribe(sub);
    serverOk = true;
  } catch {
    // Non-fatal: still tear down the browser subscription below.
  }

  try {
    await sub.unsubscribe();
  } catch {
    /* ignore */
  }

  return serverOk;
}
