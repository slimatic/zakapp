/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 */

/**
 * Chart palette - single source of truth for categorical series colours.
 *
 * Why this exists: six chart components each defined their own colour array,
 * and every one of them used the stock recharts palette (teal, cyan, indigo,
 * violet, pink). Two problems with that:
 *
 *   1. Indigo/violet/pink is the most recognisable "AI-generated dashboard"
 *      fingerprint, and it has nothing to do with this product's palette.
 *   2. They were literal hex, so they did not respond to the theme - the same
 *      saturated colours rendered on both the cream (Nur) and navy (Qamar)
 *      surfaces, where several of them lost contrast entirely.
 *
 * The values live in index.css as --chart-1..6 (one ramp per theme). These
 * helpers just wrap them in `hsl(var(--x))` so recharts, which needs a CSS
 * colour string, picks up the current theme at paint time.
 */

/** Categorical series colours, in priority order. */
export const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--chart-6))'
] as const;

/** Axis tick / label colour. */
export const CHART_AXIS_COLOR = 'hsl(var(--chart-axis))';

/** Grid line colour. */
export const CHART_GRID_COLOR = 'hsl(var(--chart-grid))';

/**
 * Colour for series `i`, wrapping around if there are more series than hues.
 * Prefer this over indexing CHART_COLORS directly so a 7th category cannot
 * render as `undefined`.
 */
export function chartColor(index: number): string {
  const n = CHART_COLORS.length;
  return CHART_COLORS[((index % n) + n) % n];
}

/**
 * A ramp of `count` colours for a multi-series chart.
 */
export function chartRamp(count: number): string[] {
  return Array.from({ length: count }, (_, i) => chartColor(i));
}
