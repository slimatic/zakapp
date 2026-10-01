/**
 * #511 — a validation error must not echo the submitted password back.
 *
 * The `value` field on a validation detail exists to make errors debuggable,
 * which is fine for `firstName` or `amount`. For a credential it meant the
 * plaintext password travelled back over the wire and landed wherever responses
 * are retained: browser devtools, error reporting, reverse-proxy access logs.
 *
 * The leak was in `handleValidationErrors`, which reads `error.value` from
 * express-validator — that field IS populated with the raw submitted value, and
 * both /register and /login go through it. `validateSchema` (the zod path) never
 * leaked, because zod v3 does not attach the received input to an issue.
 *
 * These drive the real middleware stack with real request bodies rather than
 * asserting on the shape of a helper, because the defect was in the wiring.
 *
 * The values below are deliberately placeholder-shaped. The repo's
 * check-no-committed-credentials guard flags a credential-shaped NAME bound to a
 * literal VALUE, and that guard is right: it exists because a real password once
 * reached this public repository. Its allowlist is matched rather than a fixture
 * entry added, so nothing here pretends to be a meaningful secret.
 */
import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { body } from 'express-validator';
import {
  validateUserRegistration,
  handleValidationErrors,
} from '../../middleware/ValidationMiddleware';

/** Too weak to pass the policy, so the error path runs. Placeholder, not a secret. */
const SUBMITTED_PASSWORD = 'placeholder-password-abc123';

/** The real middleware order used by POST /api/auth/register. */
const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.post(
    '/register',
    validateUserRegistration,
    handleValidationErrors,
    (_req, res) => res.status(200).json({ success: true })
  );

  // A minimal chain, to assert the behaviour is general and not keyed to one route.
  app.post(
    '/simple',
    body('apiKey').isLength({ min: 100 }).withMessage('API key too short'),
    handleValidationErrors,
    (_req: express.Request, res: express.Response) => res.status(200).json({ success: true })
  );
  return app;
};

describe('#511 validation errors do not echo credentials', () => {
  it('redacts the submitted password on a real registration validation failure', async () => {
    const res = await request(buildApp())
      .post('/register')
      .send({ email: 'user@example.com', password: 'placeholder-pw' })
      .expect(400);

    // The whole response, not just the field we expect to be wrong.
    expect(JSON.stringify(res.body)).not.toContain('placeholder-pw');

    const detail = res.body.error.details.find((d: any) => d.field === 'password');
    expect(detail).toBeDefined();
    expect(detail.value).toBe('[redacted]');
    // The message must survive — the user still needs to know what was wrong.
    expect(detail.message).toBeTruthy();
  });

  it('does not leak a password that fails a policy rule', async () => {
    const res = await request(buildApp())
      .post('/register')
      .send({ email: 'user@example.com', password: SUBMITTED_PASSWORD })
      .expect(400);

    expect(JSON.stringify(res.body)).not.toContain(SUBMITTED_PASSWORD);
  });

  it('still echoes non-credential values, so errors stay debuggable', async () => {
    const res = await request(buildApp())
      .post('/register')
      .send({ email: 'not-an-email', password: 'placeholder-password-xyz789' })
      .expect(400);

    const detail = res.body.error.details.find((d: any) => d.field === 'email');
    expect(detail).toBeDefined();
    // The value that caused the failure is still useful for a non-credential.
    expect(JSON.stringify(res.body)).toContain('not-an-email');
  });

  it('redacts any field whose name marks it a credential', async () => {
    const res = await request(buildApp())
      .post('/simple')
      .send({ apiKey: 'placeholder-api-key-value' })
      .expect(400);

    expect(JSON.stringify(res.body)).not.toContain('placeholder-api-key-value');
    expect(res.body.error.details[0].value).toBe('[redacted]');
  });
});
