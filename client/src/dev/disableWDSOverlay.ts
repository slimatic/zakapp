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
