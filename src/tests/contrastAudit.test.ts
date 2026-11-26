import { describe, it, expect } from 'vitest';
import {
  calculateContrastRatio,
  getRelativeLuminance,
  parseColor,
  runSeaSyncThemeAudit,
  SEASYNC_LIGHT_THEME_PAIRS
} from '../lib/contrastAudit';

describe('WCAG AA Contrast Audit Utility', () => {
  it('correctly calculates relative luminance for black and white', () => {
    const lumWhite = getRelativeLuminance(1, 1, 1);
    const lumBlack = getRelativeLuminance(0, 0, 0);

    expect(lumWhite).toBeCloseTo(1, 3);
    expect(lumBlack).toBeCloseTo(0, 3);
  });

  it('correctly calculates 21:1 contrast ratio for black on white', () => {
    const res = calculateContrastRatio('#000000', '#FFFFFF');
    expect(res.ratio).toBe(21);
    expect(res.normalTextAA).toBe(true);
  });

  it('evaluates primary text on sand ivory surface as >= 4.5:1 (WCAG AA)', () => {
    // #0B1B33 on #F6F3EC
    const res = calculateContrastRatio('#0B1B33', '#F6F3EC');
    expect(res.ratio).toBeGreaterThanOrEqual(12.0);
    expect(res.normalTextAA).toBe(true);
  });

  it('evaluates secondary text on white card surface as >= 4.5:1', () => {
    // #3B4B66 on #FFFFFF
    const res = calculateContrastRatio('#3B4B66', '#FFFFFF');
    expect(res.ratio).toBeGreaterThanOrEqual(7.0);
    expect(res.normalTextAA).toBe(true);
  });

  it('evaluates muted text on white card surface as >= 4.5:1', () => {
    // #5B6B85 on #FFFFFF
    const res = calculateContrastRatio('#5B6B85', '#FFFFFF');
    expect(res.ratio).toBeGreaterThanOrEqual(4.5);
    expect(res.normalTextAA).toBe(true);
  });

  it('evaluates all SeaSync light theme color pairs and ensures all meet WCAG AA normal text threshold', () => {
    const audit = runSeaSyncThemeAudit();
    
    // Check that every single pair satisfies normalTextAA
    const failingPairs = audit.results.filter(r => !r.normalTextAA);
    expect(failingPairs).toHaveLength(0);
    expect(audit.passedAA).toBe(audit.total);
  });

  it('handles 3-digit hex and rgb() strings cleanly', () => {
    const parsed3 = parseColor('#FFF');
    expect(parsed3).toEqual([1, 1, 1]);

    const parsedRgb = parseColor('rgb(255, 255, 255)');
    expect(parsedRgb).toEqual([1, 1, 1]);
  });
});
