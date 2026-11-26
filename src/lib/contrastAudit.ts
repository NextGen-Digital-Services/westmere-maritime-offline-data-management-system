/**
 * WCAG AA Contrast Audit Utility for SeaSync
 *
 * Implements the WCAG 2.1 relative luminance and contrast ratio calculation:
 * https://www.w3.org/WAI/GL/wiki/Relative_luminance
 * https://www.w3.org/TR/WCAG21/#contrast-minimum
 */

export interface ContrastResult {
  fgColor: string;
  bgColor: string;
  ratio: number;
  formattedRatio: string;
  normalTextAA: boolean; // >= 4.5
  largeTextAA: boolean;  // >= 3.0
  uiComponentAA: boolean;// >= 3.0
}

/**
 * Parses #RGB, #RRGGBB, or rgb(...) into normalized [r, g, b] where each is 0..1
 */
export function parseColor(color: string): [number, number, number] {
  const clean = color.trim().toLowerCase();

  // #RRGGBB or #RGB
  if (clean.startsWith('#')) {
    let hex = clean.slice(1);
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }
    if (hex.length >= 6) {
      const r = parseInt(hex.substring(0, 2), 16) / 255;
      const g = parseInt(hex.substring(2, 4), 16) / 255;
      const b = parseInt(hex.substring(4, 6), 16) / 255;
      return [r, g, b];
    }
  }

  // rgb(r, g, b)
  const rgbMatch = clean.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
  if (rgbMatch) {
    return [
      parseInt(rgbMatch[1], 10) / 255,
      parseInt(rgbMatch[2], 10) / 255,
      parseInt(rgbMatch[3], 10) / 255
    ];
  }

  return [0, 0, 0];
}

/**
 * Calculates relative luminance for [r, g, b] (0..1)
 */
export function getRelativeLuminance(r: number, g: number, b: number): number {
  const transform = (c: number) => {
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * transform(r) + 0.7152 * transform(g) + 0.0722 * transform(b);
}

/**
 * Calculates contrast ratio between two hex or rgb colors
 */
export function calculateContrastRatio(fg: string, bg: string): ContrastResult {
  const [r1, g1, b1] = parseColor(fg);
  const [r2, g2, b2] = parseColor(bg);

  const lum1 = getRelativeLuminance(r1, g1, b1);
  const lum2 = getRelativeLuminance(r2, g2, b2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  const ratio = (lighter + 0.05) / (darker + 0.05);
  const roundedRatio = Math.round(ratio * 100) / 100;

  return {
    fgColor: fg,
    bgColor: bg,
    ratio: roundedRatio,
    formattedRatio: `${roundedRatio.toFixed(2)}:1`,
    normalTextAA: roundedRatio >= 4.5,
    largeTextAA: roundedRatio >= 3.0,
    uiComponentAA: roundedRatio >= 3.0
  };
}

/**
 * Audits predefined SeaSync UI token combinations
 */
export const SEASYNC_LIGHT_THEME_PAIRS = [
  // Primary text on surfaces
  { name: 'Primary Text on Main Bg', fg: '#0B1B33', bg: '#F6F3EC' },
  { name: 'Primary Text on Card Surface', fg: '#0B1B33', bg: '#FFFFFF' },
  { name: 'Secondary Text on Card Surface', fg: '#3B4B66', bg: '#FFFFFF' },
  { name: 'Muted Text on Card Surface', fg: '#5B6B85', bg: '#FFFFFF' },

  // Status Badges (Text on pill background)
  { name: 'Draft Status Pill', fg: '#3B4B66', bg: '#E4E9F0' },
  { name: 'Pending Status Pill', fg: '#8C3D00', bg: '#FFE9D6' },
  { name: 'Syncing Status Pill', fg: '#0D47A1', bg: '#DCE8FF' },
  { name: 'Synced Status Pill', fg: '#0A5C36', bg: '#D2F3E1' },
  { name: 'Conflict Status Pill', fg: '#941B1F', bg: '#FCE0E1' },

  // Brand and Action Buttons
  { name: 'White Text on Deep Navy', fg: '#FFFFFF', bg: '#0A2540' },
  { name: 'White Text on Ocean Blue', fg: '#FFFFFF', bg: '#1565C0' },
  { name: 'White Text on Teal Pill', fg: '#FFFFFF', bg: '#007A7A' },
  { name: 'White Text on Coral Red', fg: '#FFFFFF', bg: '#C92A2A' },

  // Form Controls
  { name: 'Input Text on Input Bg', fg: '#0B1B33', bg: '#FFFFFF' },
  { name: 'Input Label on Card Surface', fg: '#0B1B33', bg: '#FFFFFF' },
  { name: 'Input Helper on Card Surface', fg: '#3B4B66', bg: '#FFFFFF' }
];

export function runSeaSyncThemeAudit(): {
  total: number;
  passedAA: number;
  results: Array<ContrastResult & { name: string }>;
} {
  const results = SEASYNC_LIGHT_THEME_PAIRS.map(pair => {
    const res = calculateContrastRatio(pair.fg, pair.bg);
    return {
      ...res,
      name: pair.name
    };
  });

  const passedAA = results.filter(r => r.normalTextAA).length;

  return {
    total: results.length,
    passedAA,
    results
  };
}
