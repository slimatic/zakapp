/**
 * Zakatability tri-state — the user's answer to "is this zakatable?".
 *
 * `null` is a real answer: "I don't know / let my school decide". It is NOT the
 * same as `true`. The app previously wrote `true` whenever the user had not been
 * asked, which silently overrode the methodology for every asset.
 */
export type ZakatEligibility = true | false | null;

/**
 * Normalise whatever the storage layer holds into the tri-state.
 *
 * - `true` / `false`  a deliberate answer, preserved
 * - `null`            the deliberate "use the methodology" answer
 * - `undefined`       legacy rows written before the user was ever asked; the
 *                     question was never put, so defer to the methodology
 * - a string          older rows stored "true"/"false"/"null" as text
 */
export function normalizeZakatEligibility(value: unknown): ZakatEligibility {
  if (value === true || value === false) return value;
  if (value === null) return null;
  if (value === undefined) return null;
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    if (v === 'true') return true;
    if (v === 'false') return false;
    if (v === 'null' || v === '') return null;
  }
  // Anything unrecognised is treated as "not answered" rather than assumed.
  return null;
}
