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
 * Regression coverage for #383: a logged-out device must stop receiving push.
 *
 * The failure mode these tests lock down: the server-side unsubscribe is an
 * authenticated POST, so if logout clears the access token first, the request
 * goes out unauthenticated and the endpoint stays registered server-side —
 * the device keeps getting notifications after the user logged out.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  persistUnsubscribe,
  unsubscribeCurrentDevice,
  pushSupported,
} from '../pushService';

const ENDPOINT = 'https://push.example.com/abc123';

function makeSubscription() {
  return {
    endpoint: ENDPOINT,
    toJSON: () => ({ endpoint: ENDPOINT }),
    unsubscribe: vi.fn().mockResolvedValue(true),
  } as unknown as PushSubscription & { unsubscribe: ReturnType<typeof vi.fn> };
}

describe('pushService — unsubscribe on logout (#383)', () => {
  let unsubSpy: ReturnType<typeof vi.fn>;
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    unsubSpy = vi.fn().mockResolvedValue(true);
  });

  function stubServiceWorker(sub: PushSubscription | null) {
    // jsdom has neither PushManager nor serviceWorker, and pushSupported()
    // guards on both.
    if (!('PushManager' in window)) {
      (window as any).PushManager = function PushManager() {};
    }
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        ready: Promise.resolve({
          pushManager: { getSubscription: vi.fn().mockResolvedValue(sub) },
        }),
      },
    });
  }

  it('sends the access token so the server can deregister the endpoint', async () => {
    sessionStorage.setItem('zakapp_token', 'test-token-123');
    fetchSpy = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal('fetch', fetchSpy);

    await persistUnsubscribe(makeSubscription());

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('/api/push/unsubscribe');
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe('Bearer test-token-123');
    expect(JSON.parse(init.body)).toEqual({ endpoint: ENDPOINT });
  });

  it('tears down the browser subscription and reports server success', async () => {
    sessionStorage.setItem('zakapp_token', 'test-token-123');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));

    const sub = makeSubscription() as any;
    sub.unsubscribe = unsubSpy;
    stubServiceWorker(sub);

    const serverOk = await unsubscribeCurrentDevice();

    expect(serverOk).toBe(true);
    expect(unsubSpy).toHaveBeenCalledTimes(1);
  });

  it('still unsubscribes locally when the server call fails', async () => {
    sessionStorage.setItem('zakapp_token', 'test-token-123');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    const sub = makeSubscription() as any;
    sub.unsubscribe = unsubSpy;
    stubServiceWorker(sub);

    const serverOk = await unsubscribeCurrentDevice();

    // Server did not deregister, but this device must stop receiving push
    // regardless — logout must never be blocked by a failed API call.
    expect(serverOk).toBe(false);
    expect(unsubSpy).toHaveBeenCalledTimes(1);
  });

  it('is a no-op when there is no browser subscription', async () => {
    vi.stubGlobal('fetch', vi.fn());
    stubServiceWorker(null);

    const serverOk = await unsubscribeCurrentDevice();

    expect(serverOk).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('reports push as unsupported when PushManager is absent', () => {
    const original = (window as any).PushManager;
    delete (window as any).PushManager;
    expect(pushSupported()).toBe(false);
    (window as any).PushManager = original;
  });
});
