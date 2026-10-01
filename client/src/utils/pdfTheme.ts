/**
 * Shared palette for every generated PDF, derived from the Nur (light) theme
 * tokens in index.css so a report matches the app's brand.
 *
 * WHY NUR, AND NOT THE USER'S ACTIVE THEME
 * A PDF is a printed or forwarded artifact, not a screen. Emitting the Qamar
 * (dark) palette would print a dark page - wasted ink on paper, and it reads as
 * broken rather than theme-aware. White paper, brand ink - the same choice the
 * app already makes for the logo. This is a deliberate, documented decision, not
 * an oversight: do not "fix" it by following the active theme.
 *
 * Values are the hsl() tokens converted to RGB, with contrast on white verified:
 *   brand        #1c3b30  12.23:1   (secondary  159 36% 17%)
 *   brand deep   #142a22  -         (brand text on a brand-tinted surface)
 *   ink          #1f2937  14.68:1   (foreground 215 28% 17%)
 *   ink soft     #646a78   5.42:1   (muted-foreground 220 9% 43%)
 *   accent       #b35309   5.05:1   (primary / warn 26 90% 37%) - rationed
 *   success      #1b794a   5.41:1
 *   danger       #b5372c   5.92:1
 *   surface      #f2efe8  (muted)      border     #e6e1d6
 *   surface-2    #faf9f4  (zebra stripe)
 *
 * Every one of these clears WCAG AA for body text. The previous literals did not:
 * the table heads used green-500 (2.28:1), blue-500 (3.68:1), violet-500 (4.23:1)
 * and teal-500 (2.49:1), and setTextColor(128) was 3.95:1. On screen those sat
 * behind white bold text so they read as "fine"; the greys carried body copy and
 * were genuinely below AA.
 */

/** RGB triple as jspdf expects it. */
export type Rgb = [number, number, number];

/** Convert the app's `H S% L%` token format to RGB. */
export function hslToRgb(h: number, s: number, l: number): Rgb {
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;
  const seg = Math.floor(h / 60) % 6;
  const [r1, g1, b1] = [
    [c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x],
  ][seg];
  const to255 = (v: number) => Math.round((v + m) * 255);
  return [to255(r1), to255(g1), to255(b1)];
}

export const PDF_THEME = {
  brand: hslToRgb(159, 36, 17),
  brandDeep: hslToRgb(159, 36, 12),
  ink: hslToRgb(215, 28, 17),
  inkSoft: hslToRgb(220, 9, 43),
  accent: hslToRgb(26, 90, 37),
  success: hslToRgb(150, 64, 29),
  danger: hslToRgb(5, 61, 44),
  surface: hslToRgb(42, 29, 93),
  surface2: hslToRgb(42, 40, 97),
  border: hslToRgb(41, 24, 87),
  white: [255, 255, 255] as Rgb,
} as const;

/** `#rrggbb` for jsPDF APIs that only take a CSS string. */
export const hex = (rgb: Rgb): string =>
  `#${rgb.map((v) => v.toString(16).padStart(2, '0')).join('')}`;

/**
 * Table styling shared by every table in every report, so the documents agree
 * with each other. `headStyles` is the brand band; body rows zebra on surface-2.
 */
export const TABLE_STYLES = {
  theme: 'grid' as const,
  headStyles: {
    fillColor: PDF_THEME.brand,
    textColor: PDF_THEME.white,
    fontStyle: 'bold' as const,
  },
  bodyStyles: { textColor: PDF_THEME.ink },
  alternateRowStyles: { fillColor: PDF_THEME.surface2 },
  styles: { fontSize: 10, lineColor: PDF_THEME.border, lineWidth: 0.1 },
};
