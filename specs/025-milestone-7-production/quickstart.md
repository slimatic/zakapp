# Quickstart: Run Locally (Docker Compose) and Deploy to k8s (Production)

## Docker Compose (Local, Developer)
Prerequisites: Docker, Docker Compose v2+, Node 18+, Git

1. Clone repository and build images:

```bash
git clone <repo-url>
cd zakapp
# Build images
docker compose build
# Start local compose
docker compose up -d
# Wait for services to be healthy
docker compose logs -f
```

2. Access the app locally at `http://localhost:3000` (configurable via `docker-compose.yml`).

3. Running tests locally:

```bash
npm ci
npm test
npm --prefix client test
npm --prefix server test
# run e2e
npm run test:e2e
```

## Kubernetes (Production-grade, Staging → Production)

**Assumptions**: A k8s cluster is available (managed or self-hosted). Helm or kustomize preferred for templating.

1. Build and publish signed images via CI using `cosign` signing:
- CI job: build → run tests → docker push → cosign sign

2. Deploy to staging via Helm:

```bash
helm repo add zakapp-chart https://example.com/helm
helm upgrade --install zakapp ./chart -f values.staging.yaml
```

3. For production: Use canary or blue/green deployments with a pipeline that promotes artifacts after smoke tests.

## Notes
- Local compose files are authoritative for developers per the Constitution (Docker-native requirement).
- Production manifests must be maintained under `/deploy/` or `charts/` and documented in `docs/` and `quickstart.md`.

---
*End of quickstart.*