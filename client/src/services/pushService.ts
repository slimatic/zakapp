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
import { withTimeout, TIMED_OUT } from '../utils/withTimeout';

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
  // Bounded for the same reason as the unsubscribe path: `ready` never settles
  // when no worker reaches "active", and this is called straight from a user
  // tapping "Enable notifications". Unbounded, the toggle spins forever with no
  // error. Here we want a real failure, so throw rather than resolve a fallback.
  const reg = await withTimeout(navigator.serviceWorker.ready, SW_READY_TIMEOUT_MS, null);
  if (!reg) throw new Error('Service worker not ready');
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
/** How long to wait for the service worker before giving up on push teardown. */
const SW_READY_TIMEOUT_MS = 1500;
/** How long to wait for the server-side unsubscribe before abandoning it. */
const UNSUBSCRIBE_TIMEOUT_MS = 3000;

export async function unsubscribeCurrentDevice(): Promise<boolean> {
  if (!pushSupported()) return false;

  let sub: PushSubscription | null = null;
  try {
    // `navigator.serviceWorker.ready` NEVER settles when no worker reaches
    // "active". It does not reject, it simply never resolves - so the try/catch
    // below cannot help, and the await hangs the caller forever. On a PWA whose
    // worker is mid-registration, or that was never registered at all, this is
    // what kept users logged in: AuthService awaits this before clearing the
    // session, so the logout never completed and the menu item appeared dead.
    const reg = await withTimeout(navigator.serviceWorker.ready, SW_READY_TIMEOUT_MS, null);
    if (!reg) return false;
    sub = await reg.pushManager.getSubscription();
  } catch {
    return false; // no SW / not ready — nothing to detach
  }
  if (!sub) return false;

  let serverOk = false;
  try {
    // A wedged request must not block logout either. The token is still valid
    // here (#383), so a hang is a network problem, not an auth one.
    const result = await withTimeout<unknown>(persistUnsubscribe(sub), UNSUBSCRIBE_TIMEOUT_MS, TIMED_OUT);
    serverOk = result !== TIMED_OUT;
  } catch {
    // Non-fatal: still tear down the browser subscription below.
  }

  try {
    await withTimeout(sub.unsubscribe(), UNSUBSCRIBE_TIMEOUT_MS, undefined);
  } catch {
    /* ignore */
  }

  return serverOk;
}
