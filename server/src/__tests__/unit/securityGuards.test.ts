/**
 * Regression tests for the guards added with the first CodeQL triage:
 * log-injection line collapsing, currency validation before the request path,
 * and HTML escaping in verification emails.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { Logger } from '../../utils/logger';
import { PreciousMetalsApiClient } from '../../config/preciousMetalsApi';
import { EmailService } from '../../services/EmailService';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('security guards', () => {
  it('collapses CR/LF in log messages so a fragment cannot forge a line', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    new Logger('Test').error('first line\n[INFO] forged second line');

    const line = String(spy.mock.calls[0][0]);
    expect(line).not.toContain('\n');
    expect(line).toContain('[INFO] forged second line');
  });

  it('rejects a currency that is not three letters before it reaches the API', async () => {
    const client = new PreciousMetalsApiClient({ apiKey: 'test-only' });
    await expect(client.fetchCurrentPrices('US/../evil')).rejects.toThrow('Invalid currency code');
  });

  it('escapes HTML metacharacters in the verification-email username', () => {
    const escapeHtml = (EmailService as any).escapeHtml.bind(EmailService);
    expect(escapeHtml(`<script>alert("x")</script>&'`)).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;&amp;&#039;'
    );
  });
});
