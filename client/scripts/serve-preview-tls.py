#!/usr/bin/env python3
"""
TLS front for the local ZakApp preview.

WHY THIS EXISTS
    Browsers expose `crypto.subtle` only in a secure context. On
    http://100.115.164.6:4173 (the Tailscale IP, not localhost) it is undefined,
    so ZakApp cannot derive the vault key and sign-in is impossible. That is a
    browser rule, not a ZakApp bug.

    Tailscale Serve / `tailscale cert` would be the clean fix, but this tailnet
    has neither enabled and the account cannot obtain TLS certs:
        "your Tailscale account does not support getting TLS certs"

    So terminate TLS here instead. The traffic is ALREADY encrypted end to end by
    Tailscale's WireGuard; this layer exists only to satisfy the browser's secure
    context requirement, which is why a self-signed cert is sufficient.

    Listen on 8443 rather than 443 on purpose: port 443 would need CAP_NET_BIND_SERVICE
    or root, and nothing else in this repo expects TLS here. The plain :4173 preview
    stays exactly as it is because eleven verification scripts hardcode
    http://localhost:4173.

    The certificate carries the MagicDNS name, the tailnet FQDN and the IP as SANs,
    so whichever hostname the browser is given, the name matches. It still will not
    chain to a public CA - that is expected for a self-signed cert, and the browser
    asks for a one-time trust confirmation.

Run:  python3 scripts/serve-preview-tls.py
"""
from __future__ import annotations

import http.server
import ipaddress
import socketserver
import ssl
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
CERT_DIR = HERE / ".tls"
CERT = CERT_DIR / "preview.crt"
KEY = CERT_DIR / "preview.key"

UPSTREAM_HOST = "127.0.0.1"
UPSTREAM_PORT = 4173
LISTEN_PORT = 8443

# SANs: every name the browser might be pointed at.
DNS_NAMES = ["localhost", "chuwi-ubuntu", "chuwi-ubuntu.tail7ffff.ts.net"]
IP_NAMES = ["127.0.0.1", "100.115.164.6", "192.168.86.240"]


def ensure_cert() -> None:
    """Generate a self-signed cert once, with the right SANs."""
    if CERT.exists() and KEY.exists():
        return
    CERT_DIR.mkdir(parents=True, exist_ok=True)

    san_parts = [f"DNS:{n}" for n in DNS_NAMES] + [f"IP:{n}" for n in IP_NAMES]
    # Modern OpenSSL takes SANs via -addext; the SAN is what the browser checks.
    cmd = [
        "openssl", "req", "-x509", "-newkey", "rsa:2048", "-nodes",
        "-keyout", str(KEY), "-out", str(CERT),
        "-days", "825", "-subj", "/CN=chuwi-ubuntu.tail7ffff.ts.net",
        "-addext", "subjectAltName=" + ",".join(san_parts),
        "-addext", "basicConstraints=CA:FALSE",
        "-addext", "keyUsage=digitalSignature,keyEncipherment",
        "-addext", "extendedKeyUsage=serverAuth",
    ]
    subprocess.run(cmd, check=True, capture_output=True)
    KEY.chmod(0o600)
    print(f"generated self-signed cert -> {CERT}")


class Proxy(http.server.BaseHTTPRequestHandler):
    """
    Terminate TLS, forward to the plain vite preview over the loopback.

    ponytail: minimal forwarding - no WebSocket upgrade and no chunked-request
    handling. The preview serves a built SPA over GET/POST, which this covers.
    Add upgrade handling only if HMR or a websocket feature is ever served here.
    """

    protocol_version = "HTTP/1.1"

    def log_message(self, format, *args):  # quieter than the default
        sys.stderr.write("tls-front %s\n" % (format % args))

    def _forward(self, body: bytes | None = None) -> None:
        import http.client

        conn = http.client.HTTPConnection(UPSTREAM_HOST, UPSTREAM_PORT, timeout=30)
        try:
            headers = {k: v for k, v in self.headers.items() if k.lower() != "host"}
            # Tell the upstream the host the browser used; vite accepts any Host.
            headers["Host"] = self.headers.get("Host", f"{UPSTREAM_HOST}:{UPSTREAM_PORT}")
            conn.request(self.command, self.path, body=body, headers=headers)
            resp = conn.getresponse()
            payload = resp.read()

            self.send_response(resp.status)
            for k, v in resp.getheaders():
                # Length/encoding are recomputed below.
                if k.lower() in ("transfer-encoding", "connection", "content-length"):
                    continue
                self.send_header(k, v)
            self.send_header("Content-Length", str(len(payload)))
            self.send_header("Connection", "close")
            self.end_headers()
            self.wfile.write(payload)
        finally:
            conn.close()

    def do_GET(self):
        self._forward()

    def do_HEAD(self):
        self._forward()

    def do_POST(self):
        length = int(self.headers.get("Content-Length") or 0)
        self._forward(self.rfile.read(length) if length else b"")


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


def main() -> int:
    ensure_cert()

    ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    ctx.load_cert_chain(certfile=str(CERT), keyfile=str(KEY))
    # The preview proxy is HTTP on the loopback; ALPN must not negotiate h2.
    ctx.set_alpn_protocols(["http/1.1"])

    with Server(("0.0.0.0", LISTEN_PORT), Proxy) as httpd:
        httpd.socket = ctx.wrap_socket(httpd.socket, server_side=True)
        print(f"TLS front listening on https://0.0.0.0:{LISTEN_PORT} -> http://{UPSTREAM_HOST}:{UPSTREAM_PORT}")
        print(f"  open: https://chuwi-ubuntu.tail7ffff.ts.net:{LISTEN_PORT}/login")
        print(f"  or:   https://100.115.164.6:{LISTEN_PORT}/login")
        httpd.serve_forever()
    return 0


if __name__ == "__main__":
    sys.exit(main())
