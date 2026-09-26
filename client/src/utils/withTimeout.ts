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
 * Bounded awaits for teardown paths.
 *
 * `try/catch` handles a promise that REJECTS. It does nothing for a promise that
 * never settles - and the web platform has several of those. The one that caused
 * a real bug: `navigator.serviceWorker.ready` never resolves when no worker
 * reaches "active", so an `await` on it parked forever and left users unable to
 * log out.
 *
 * Use this anywhere a step is best-effort cleanup rather than a required gate.
 * If the work must actually complete, do not use this - let it fail loudly.
 */
export function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>(resolve => setTimeout(() => resolve(fallback), ms)),
  ]);
}

/**
 * Sentinel returned by `withTimeout` callers that need to tell "gave up" apart
 * from a legitimate result.
 */
export const TIMED_OUT: unique symbol = Symbol('timedOut');
export type TimedOut = typeof TIMED_OUT;
