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
 * Error details that are safe to return to an API caller.
 *
 * The route-level catch blocks hand `error.message` to the response's `details`
 * field. Two things leak through that:
 *
 *  - A module-resolution failure carries a "Require stack" block listing every
 *    absolute path in the load chain, so a caller learns the deployment's
 *    filesystem layout and checkout name. That is reconnaissance, and it is not
 *    gated behind NODE_ENV — it ships in production.
 *  - Windows absolute paths, same reasoning.
 *
 * Keeping the first line preserves the useful part ("Cannot find module 'x'")
 * and drops the stack block. Redacting in one helper rather than at each of the
 * (seventeen, at the time of writing) call sites means a new catch block gets
 * the behaviour for free.
 */
export function redactErrorDetail(err: unknown): string {
  const message = err instanceof Error ? err.message : 'Unknown error';

  return (
    message
      // First line only — the "Require stack:" block and its entries follow it.
      .split('\n')[0]
      .replace(/\/(?:home|Users|var|opt|srv|root|tmp|usr)\/[\w.@+/-]+/g, '<path>')
      .replace(/[A-Za-z]:\\[\w.\\-]+/g, '<path>')
      .trim()
  );
}
