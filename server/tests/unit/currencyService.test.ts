/**
 * CurrencyService — the exchange rates used in zakat calculations.
 *
 * WHY THIS FILE EXISTS
 *
 * This service is injected into ZakatEngine. It previously computed rates from a
 * hardcoded table commented "for demo purposes", which shipped to production:
 *
 *   USD -> EGP   30.90   (actual 52.04  — 68% low)
 *   USD -> TRY   27.50   (actual 48.79  — 77% low)
 *   USD -> INR   83.20   (actual 96.04  — 15% low)
 *   USD -> IDR   15750   (actual 17790  — 13% low)
 *
 * An understated conversion understates the user's wealth in base currency, and
 * nisab is compared in base currency — so a user could be told they owe nothing
 * while above the threshold. This is a correctness bug in the religious
 * calculation, not a cosmetic one.
 *
 * The tests below are deliberately offline and deterministic: the provider is
 * mocked, because a test that depends on today's live rate would be flaky and
 * would assert nothing about OUR logic. The live provider is exercised separately
 * as a smoke check that is allowed to skip when the network is unavailable.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const getMock = vi.fn();

vi.mock('axios', () => ({
  default: { get: (...args: unknown[]) => getMock(...args) },
}));

const { CurrencyService } = await import('../../src/services/currencyService');

/** A realistic provider payload. */
function providerPayload(rates: Record<string, number>) {
  return {
    data: {
      result: 'success',
      base_code: 'USD',
      time_last_update_utc: 'Mon, 21 Sep 2026 00:02:31 +0000',
      rates: { USD: 1, ...rates },
    },
  };
}

const LIVE = {
  EUR: 0.871295,
  GBP: 0.747411,
  EGP: 52.042641,
  TRY: 48.794548,
  INR: 96.03698,
  IDR: 17790.472955,
  SAR: 3.75,
  AED: 3.6725,
};

beforeEach(() => {
  getMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('rates come from the provider, not a frozen table', () => {
  it('returns the live rate for a supported currency', async () => {
    getMock.mockResolvedValue(providerPayload(LIVE));
    const cs = new CurrencyService();
    expect(await cs.getExchangeRate('USD', 'EGP')).toBeCloseTo(52.042641, 6);
  });

  it('does NOT return the stale hardcoded values', async () => {
    getMock.mockResolvedValue(providerPayload(LIVE));
    const cs = new CurrencyService();

    // The exact numbers that were hardcoded in production.
    const stale: Record<string, number> = {
      EUR: 0.85, GBP: 0.73, EGP: 30.9, TRY: 27.5, INR: 83.2, IDR: 15750,
    };

    for (const [code, oldRate] of Object.entries(stale)) {
      const actual = await cs.getExchangeRate('USD', code);
      expect(actual).not.toBe(oldRate);
      // Guard the direction too: the stale table was low across the board, and a
      // low conversion is the direction that can hide a zakat obligation.
      expect(actual).toBeGreaterThan(oldRate);
    }
  });

  it('actually calls the provider', async () => {
    getMock.mockResolvedValue(providerPayload(LIVE));
    const cs = new CurrencyService();
    await cs.getExchangeRate('USD', 'EUR');

    expect(getMock).toHaveBeenCalledTimes(1);
    const [url] = getMock.mock.calls[0];
    expect(String(url)).toMatch(/\/USD$/);
  });

  it('caches the rate table instead of re-fetching per pair', async () => {
    getMock.mockResolvedValue(providerPayload(LIVE));
    const cs = new CurrencyService();

    await cs.getExchangeRate('USD', 'EUR');
    await cs.getExchangeRate('USD', 'GBP');
    await cs.getExchangeRate('USD', 'EGP');

    // One fetch, three conversions.
    expect(getMock).toHaveBeenCalledTimes(1);
  });
});

describe('identity and cross rates are arithmetically sound', () => {
  it('returns exactly 1 for the same currency, without calling the provider', async () => {
    const cs = new CurrencyService();
    expect(await cs.getExchangeRate('USD', 'USD')).toBe(1);
    expect(await cs.getExchangeRate('EGP', 'EGP')).toBe(1);
    expect(getMock).not.toHaveBeenCalled();
  });

  it('inverts correctly in both directions', async () => {
    getMock.mockResolvedValue(providerPayload(LIVE));
    const cs = new CurrencyService();

    const forward = await cs.getExchangeRate('USD', 'EGP');
    const backward = await cs.getExchangeRate('EGP', 'USD');
    expect(forward * backward).toBeCloseTo(1, 9);
  });

  it('cross-rates through the provider base', async () => {
    getMock.mockResolvedValue(providerPayload(LIVE));
    const cs = new CurrencyService();

    // EGP -> TRY = (TRY per USD) / (EGP per USD)
    const cross = await cs.getExchangeRate('EGP', 'TRY');
    expect(cross).toBeCloseTo(LIVE.TRY / LIVE.EGP, 9);
  });

  it('converts an amount consistently with the rate', async () => {
    getMock.mockResolvedValue(providerPayload(LIVE));
    const cs = new CurrencyService();

    const converted = await cs.convertAmount(1000, 'USD', 'EGP');
    expect(converted).toBeCloseTo(1000 * 52.042641, 4);
  });
});

describe('a broken provider degrades loudly, never silently to parity', () => {
  it('never returns 1.0 as a last resort for mismatched currencies', async () => {
    // The old code returned 1.0 here, which asserts 1 TRY = 1 USD — understating
    // wealth by a factor of ~49 and producing a meaningless nisab comparison.
    getMock.mockRejectedValue(new Error('network down'));
    const cs = new CurrencyService();

    const rate = await cs.getExchangeRate('TRY', 'IDR');
    expect(rate).not.toBe(1);
    expect(Number.isFinite(rate)).toBe(true);
    expect(rate).toBeGreaterThan(0);
  });

  it('falls back to the built-in table when the provider is unreachable', async () => {
    getMock.mockRejectedValue(new Error('network down'));
    const cs = new CurrencyService();

    // USD->EGP has a known fallback of 30.00; assert it is used and is NOT 1.
    const rate = await cs.getExchangeRate('USD', 'EGP');
    expect(rate).toBe(30.0);
    expect(rate).not.toBe(1);
  });

  it('uses the fallback rather than throwing when only the provider fails', async () => {
    getMock.mockRejectedValue(new Error('timeout'));
    const cs = new CurrencyService();
    await expect(cs.getExchangeRate('USD', 'IDR')).resolves.toBeGreaterThan(1);
  });

  it('treats an unusable provider payload as a failure, not as valid rates', async () => {
    getMock.mockResolvedValue({ data: { result: 'error', rates: null } });
    const cs = new CurrencyService();

    // Must not explode, and must not treat {} as a real table.
    const rate = await cs.getExchangeRate('USD', 'EGP');
    expect(rate).toBe(30.0);
  });

  it('rejects a payload that is missing the base currency', async () => {
    getMock.mockResolvedValue({ data: { result: 'success', base_code: 'USD', rates: { EUR: 0.9 } } });
    const cs = new CurrencyService();
    // USD absent from rates -> unusable -> fallback path.
    const rate = await cs.getExchangeRate('USD', 'EGP');
    expect(rate).toBe(30.0);
  });
});

describe('provenance is reported so callers can disclose degraded rates', () => {
  it('reports live when the provider answered', async () => {
    getMock.mockResolvedValue(providerPayload(LIVE));
    const cs = new CurrencyService();
    await cs.getExchangeRate('USD', 'EUR');
    expect(cs.getRateSource()).toBe('live');
  });

  it('does not claim live when nothing has been fetched', () => {
    const cs = new CurrencyService();
    expect(cs.getRateSource()).toBe('unknown');
  });

  it('does not claim live once the provider has failed', async () => {
    getMock.mockRejectedValue(new Error('down'));
    const cs = new CurrencyService();
    await cs.getExchangeRate('USD', 'EUR');
    expect(cs.getRateSource()).not.toBe('live');
  });
});

describe('the timeout is bounded so a slow provider cannot hang a request', () => {
  it('passes a timeout to the HTTP call', async () => {
    getMock.mockResolvedValue(providerPayload(LIVE));
    const cs = new CurrencyService();
    await cs.getExchangeRate('USD', 'EUR');

    const [, options] = getMock.mock.calls[0];
    expect(options?.timeout).toBeGreaterThan(0);
    expect(options?.timeout).toBeLessThanOrEqual(30000);
  });
});
