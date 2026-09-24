import { describe, it, expect } from 'vitest';
import { PDF_THEME, hex } from '../pdfTheme';
describe('pdfTheme', () => {
  it('matches the verified Nur values', () => {
    const got = Object.fromEntries(Object.entries(PDF_THEME).map(([k,v]) => [k, hex(v as any)]));
    expect(got).toEqual({
      brand:'#1c3b30', brandDeep:'#142a22', ink:'#1f2937', inkSoft:'#646a78',
      accent:'#b35309', success:'#1b794a', danger:'#b5372c',
      surface:'#f2efe8', surface2:'#faf9f4', border:'#e6e1d6', white:'#ffffff',
    });
  });
});
