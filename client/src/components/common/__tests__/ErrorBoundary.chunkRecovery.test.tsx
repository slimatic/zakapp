/**
 * A deploy replaces the hashed JS chunks. A browser still running the previous document
 * keeps requesting the old chunk names, every lazy route throws, and the ErrorBoundary
 * takes over — which is what "Something went wrong" on /admin after a release really is.
 *
 * A plain reload cannot fix it: the service worker answers navigation from its PRECACHED
 * index.html, so the reload re-serves the same stale document with the same dead chunk
 * names. Recovery therefore has to drop the worker and its caches BEFORE reloading, and
 * this pins that order down.
 *
 * The method is invoked directly rather than through a rendered thrower: the behaviour
 * under test is the recovery sequence, and driving it through the React error path only
 * adds renderer timing to the assertion.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ErrorBoundary } from '../ErrorBoundary';

vi.mock('react-hot-toast', () => ({ default: { error: vi.fn() } }));

/** The error shape a failed dynamic import produces. */
const chunkError = () =>
  new TypeError('Failed to fetch dynamically imported module: /assets/AdminDashboard-B1_t-69z.js');

describe('ErrorBoundary chunk recovery', () => {
  const order: string[] = [];
  let unregister: ReturnType<typeof vi.fn>;
  let cacheDelete: ReturnType<typeof vi.fn>;
  let reload: ReturnType<typeof vi.fn>;

  /**
   * A real instance, not a prototype clone: `dropStaleShellAndReload` is a class field
   * (assigned in the constructor), so `Object.create(prototype)` would omit it and the
   * test would fail on a missing method rather than on the behaviour.
   */
  const makeBoundary = () => new ErrorBoundary({ children: null });

  /**
   * Trigger the lifecycle and let its internal async chain finish.
   *
   * `componentDidCatch` returns void by React's contract, so awaiting it would not wait
   * for the recovery promise it starts - a macrotask flush is what actually drains it.
   */
  const fire = async (error: Error) => {
    const boundary = makeBoundary();
    boundary.componentDidCatch(error, {} as never);
    await new Promise((resolve) => setTimeout(resolve, 0));
    return boundary;
  };

  beforeEach(() => {
    order.length = 0;
    sessionStorage.clear();

    unregister = vi.fn(async () => { order.push('unregister'); });
    cacheDelete = vi.fn(async () => { order.push('cache-delete'); return true; });
    reload = vi.fn(() => { order.push('reload'); });

    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { getRegistrations: async () => [{ unregister }] },
    });
    Object.defineProperty(window, 'caches', {
      configurable: true,
      value: { keys: async () => ['workbox-precache-v2'], delete: cacheDelete },
    });
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, reload },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('drops the stale shell BEFORE reloading, so the retry can actually succeed', async () => {
    await fire(chunkError());

    expect(order).toEqual(['unregister', 'cache-delete', 'reload']);
    expect(unregister).toHaveBeenCalledTimes(1);
    expect(cacheDelete).toHaveBeenCalledWith('workbox-precache-v2');
  });

  it('still reloads when the worker APIs are unavailable', async () => {
    Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: undefined });
    Object.defineProperty(window, 'caches', { configurable: true, value: undefined });

    await fire(chunkError());

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('reloads even when clearing the caches throws - cleanup must not block recovery', async () => {
    cacheDelete.mockRejectedValueOnce(new Error('quota'));

    await fire(chunkError());

    // The throw is swallowed and the reload still happens: the try/finally contract.
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('does not loop: a second chunk failure stops instead of reloading forever', async () => {
    sessionStorage.setItem('chunk_reload', 'true');

    await fire(chunkError());

    expect(reload).not.toHaveBeenCalled();
    // Cleared so a later, unrelated visit can attempt recovery again.
    expect(sessionStorage.getItem('chunk_reload')).toBeNull();
  });

  it('ignores unrelated errors - they are not a stale deploy', async () => {
    await fire(new Error('cannot read properties of undefined'));

    expect(order).toEqual([]);
  });
});
