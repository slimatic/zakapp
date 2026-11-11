/**
 * Express 5 types widen route params to `string | string[]` (a path can repeat
 * a name). Every route in this app uses single-value params, so narrow once
 * here instead of casting at each call site.
 */
export function param(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}
