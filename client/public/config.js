// ZakApp runtime configuration — loaded by index.html as `/config.js?v=2`.
//
// WHY THIS FILE EXISTS
//   `getApiBaseUrl()` (client/src/config.ts) reads window.APP_CONFIG first and
//   otherwise falls back to `http://localhost:3001/api`. That fallback is fine on
//   a laptop and wrong everywhere else: from a phone or any other device,
//   localhost is the device itself, so every API call fails with "Unable to
//   reach the server". On an HTTPS page it is also blocked outright as mixed
//   content. Serving this file at runtime is what makes one build work on any
//   host.
//
// WHY THE RELATIVE URL
//   `/api` is same-origin, so whatever host the browser used is the host that
//   answers — including over the TLS proxy. It also keeps working when the port
//   or the tunnel changes, and it cannot be broken by a stale build.
//
// NOT GITIGNORED
//   The root .gitignore has a blanket `*.js` rule for build artifacts, which
//   previously swallowed this file. `client/public/` is source, not output, so it
//   is negated below. Without that exception every fresh clone builds an app that
//   cannot reach its own API.
window.APP_CONFIG = {
  API_BASE_URL: '/api',
};
