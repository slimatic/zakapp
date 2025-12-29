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

// Development helper: remove webpack-dev-server client overlay if it appears.
// This prevents the dev overlay iframe from intercepting pointer events during E2E runs.
export function disableWDSOverlay() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const removeOverlay = () => {
    try {
      const el = document.getElementById('webpack-dev-server-client-overlay');
      if (el && el.parentNode) {
        // prevent it from intercepting pointer events
        (el as HTMLElement).style.pointerEvents = 'none';
        el.parentNode.removeChild(el);
      }
    } catch (err) {
      // ignore
    }
  };

  // Run immediately and also on DOM mutations
  removeOverlay();
  try {
    const obs = new MutationObserver(() => removeOverlay());
    obs.observe(document.documentElement || document.body, { childList: true, subtree: true });
    // stop observing after 15 seconds
    setTimeout(() => obs.disconnect(), 15000);
  } catch (err) {
    // ignore errors in older browsers
  }
}

export default disableWDSOverlay;
