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

import React, { Component, ErrorInfo, ReactNode } from 'react';
import toast from 'react-hot-toast';
import { Button } from '../ui/Button';
import { DataRecoveryFallback } from '../auth/DataRecoveryFallback';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Does this error look like a lazily-loaded chunk that failed to fetch?
 *
 * Bundlers word this differently and the mismatch is silent, so match all of them:
 * webpack throws "Loading chunk 123 failed" / a `ChunkLoadError`, while Vite (what this
 * app is built with) surfaces "Failed to fetch dynamically imported module" in Chrome
 * and Firefox, and "Importing a module script failed" in Safari.
 */
const CHUNK_ERROR_PATTERNS = [
  'Loading chunk',
  'ChunkLoadError',
  'Failed to fetch dynamically imported module',
  'Importing a module script failed',
  'error loading dynamically imported module',
];

export const isChunkLoadError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return CHUNK_ERROR_PATTERNS.some((pattern) => message.includes(pattern));
};

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, _errorInfo: ErrorInfo) {
    toast.error('An unexpected error occurred');

    // A lazily-loaded route (e.g. /admin, /assets) failing to fetch its chunk means the
    // document's chunk names are older than what the server is serving - the normal
    // aftermath of a deploy.
    //
    // Detection has to cover the bundler's actual wording. This only matched webpack's
    // "Loading chunk" / "ChunkLoadError", but the client is built with Vite, whose
    // browsers say "Failed to fetch dynamically imported module" (Safari: "Importing a
    // module script failed"). So in production the recovery never ran at all - the user
    // got the generic error page with no attempt made.
    //
    // A plain reload would not have fixed it either: the service worker answers
    // navigation from its PRECACHED index.html, so a reload re-serves the same stale
    // document with the same dead chunk names. The stale shell has to go first.
    if (isChunkLoadError(error)) {
      const isReloading = sessionStorage.getItem('chunk_reload');

      if (!isReloading) {
        sessionStorage.setItem('chunk_reload', 'true');
        void this.dropStaleShellAndReload();
      } else {
        // Already reset once and still failing: stop, rather than loop.
        sessionStorage.removeItem('chunk_reload');
      }
    }
  }

  /**
   * Unregister the worker and clear its caches, then reload - so the next load fetches
   * the current index.html from the network instead of the cached one.
   *
   * The reload runs even if the reset throws: a broken reset must not leave the user
   * staring at an error page with no way forward.
   */
  private dropStaleShellAndReload = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
      }
      if (typeof caches !== 'undefined') {
        const names = await caches.keys();
        await Promise.all(names.map((name) => caches.delete(name)));
      }
    } catch (resetError) {
      // Cleanup is best-effort; recovering the user matters more than a clean reset.
      console.warn('Stale shell cleanup failed', resetError);
    } finally {
      window.location.reload();
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.state.error?.message.includes('Decryption failed') ||
        this.state.error?.message.includes('Invalid key') ||
        this.state.error?.message.includes('DB1')) { // Also catch the specific auth DB code
        return <DataRecoveryFallback onReset={this.handleReload} />;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-muted px-4">
          <div className="max-w-md w-full bg-card rounded-lg shadow-lg p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-danger-soft mb-4">
              <svg className="h-6 w-6 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-6">
              {this.state.error?.message.includes('Loading chunk')
                ? 'A new version of the app is available. Please refresh the page.'
                : this.state.error?.message.includes('COL23') || this.state.error?.message.includes('limit')
                  ? 'Connection limit reached. Please refresh the page to reconnect.'
                  : process.env.NODE_ENV === 'production'
                    ? 'An unexpected error occurred. Please try refreshing the page.'
                    : `Error: ${this.state.error?.message}`}
            </p>
            {process.env.NODE_ENV !== 'production' && this.state.error?.message && (
              <div className="mt-4 p-2 bg-danger-soft text-danger text-xs text-start overflow-auto max-h-32 rounded">
                {this.state.error.message}
              </div>
            )}
            <Button onClick={this.handleReload} variant="default" className="w-full">
              Refresh Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
