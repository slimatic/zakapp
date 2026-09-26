/**
 * Guard: the PDF report module must not ship unverified fiqh claims.
 *
 * `generateMethodologyReport` was deleted rather than wired up. It was
 * reachable from nowhere, yet it asserted a fixed "Standard Used: Silver
 * Standard" and a "Default: Hanafi" regardless of the user's actual madhab
 * setting — an invented rule-set presented as the basis of a calculation.
 * It was in the shipped bundle and would have been one `<Button>` away from
 * being a document that misdescribes its own arithmetic.
 *
 * Two rules, both cheap to keep:
 *   1. It stays deleted. Reintroducing a methodology PDF requires wiring it to
 *      live settings and a test, which is a deliberate act, not an accident.
 *   2. The module never hardcodes a nisab standard, a madhab default, or an
 *      unattributed "(Opinion)" label. Any such claim must come from the user's
 *      settings or a retrieved source.
 *
 * Scope note: this checks ReportGenerator.ts only. The same rule applies to any
 * future report/export surface.
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const SRC = path.resolve(__dirname, '../../utils/ReportGenerator.ts');
const code = fs
  .readFileSync(SRC, 'utf8')
  // Strip comments: prose explaining why a claim is absent must not trip the check.
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .split('\n')
  .filter((l) => !l.trim().startsWith('//'))
  .join('\n');

describe('ReportGenerator must not assert unverified fiqh claims', () => {
  it('does not reintroduce the deleted methodology report', () => {
    expect(code).not.toContain('generateMethodologyReport');
  });

  it('hardcodes no nisab standard', () => {
    // A fixed standard here contradicts the user's setting.
    expect(code).not.toMatch(/Silver Standard/);
    expect(code).not.toMatch(/Gold Standard/);
  });

  it('hardcodes no madhab default', () => {
    expect(code).not.toMatch(/Default:\s*(Hanafi|Shafii|Shafi'i|Maliki|Hanbali)/i);
  });

  it('attributes no unattributed scholarly opinion', () => {
    // "(Majority Opinion)" with no source is a citation that cannot be checked.
    expect(code).not.toMatch(/\((Majority|Minority|Precautionary)\s+Opinion\)/i);
  });

  it('still generates the reports that ARE reachable', () => {
    // Guards against the deletion taking the live methods with it.
    expect(code).toContain('generateHawlStatement');
    expect(code).toContain('generatePaymentSummary');
  });
});
