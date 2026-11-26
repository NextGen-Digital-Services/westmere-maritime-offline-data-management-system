import { describe, it, expect } from 'vitest';
import { smartFillParse, parseCoordinates, parseFieldValue } from '../lib/smartFillParser';
import { MARINE_TEMPLATES } from '../forms/schemas/marineSchemas';

describe('Smart Fill Offline Rule-Based Parser', () => {
  const noonTemplate = MARINE_TEMPLATES.noon_report;

  it('parses basic Key: Value pairs', () => {
    const raw = `
Voyage Number: VOY-2026-99
True Course: 242
Speed Over Ground (SOG): 14.8
`;
    const result = smartFillParse(raw, noonTemplate);
    expect(result.mappedFields).toHaveLength(3);

    const voyageField = result.mappedFields.find(f => f.fieldId === 'voyageNumber');
    expect(voyageField?.foundValue).toBe('VOY-2026-99');
    expect(voyageField?.confidence).toBe('High');

    const courseField = result.mappedFields.find(f => f.fieldId === 'course');
    expect(courseField?.foundValue).toBe(242);

    const sogField = result.mappedFields.find(f => f.fieldId === 'speedOverGround');
    expect(sogField?.foundValue).toBe(14.8);
  });

  it('supports Key = Value and Key - Value delimiters', () => {
    const raw = `
voyage = VOY-ALPHA-12
course - 180
sog = 12.4
`;
    const result = smartFillParse(raw, noonTemplate);
    const voyage = result.mappedFields.find(f => f.fieldId === 'voyageNumber');
    const course = result.mappedFields.find(f => f.fieldId === 'course');
    const speed = result.mappedFields.find(f => f.fieldId === 'speedOverGround');

    expect(voyage?.foundValue).toBe('VOY-ALPHA-12');
    expect(course?.foundValue).toBe(180);
    expect(speed?.foundValue).toBe(12.4);
  });

  it('resolves maritime aliases (sog, dist run, rob hfo, lat/lon)', () => {
    const raw = `
sog: 15.2 kts
dist run: 320.5 NM
rob vlsfo: 480.2 MT
`;
    const result = smartFillParse(raw, noonTemplate);
    const sog = result.mappedFields.find(f => f.fieldId === 'speedOverGround');
    const dist = result.mappedFields.find(f => f.fieldId === 'distanceRun24h');
    const robHfo = result.mappedFields.find(f => f.fieldId === 'robHfoMetricTons');

    expect(sog?.foundValue).toBe(15.2);
    expect(dist?.foundValue).toBe(320.5);
    expect(robHfo?.foundValue).toBe(480.2);
  });

  it('strips units from numeric fields cleanly', () => {
    const raw = `
course: 095 deg
distance to go: 1420.0 NM
wind force: 6 BF
`;
    const result = smartFillParse(raw, noonTemplate);
    const course = result.mappedFields.find(f => f.fieldId === 'course');
    const dtg = result.mappedFields.find(f => f.fieldId === 'distanceToGo');
    const wind = result.mappedFields.find(f => f.fieldId === 'windForceBeaufort');

    expect(course?.foundValue).toBe(95);
    expect(dtg?.foundValue).toBe(1420);
    expect(wind?.foundValue).toBe(6);
  });

  it('parses GPS coordinate formats accurately', () => {
    const parsed1 = parseCoordinates('54.2150 N, 003.4510 E');
    expect(parsed1).toBe('54.2150 N, 003.4510 E');

    const parsed2 = parseCoordinates('12.5 N 045.2 E');
    expect(parsed2).toBe('12.5 N, 045.2 E');
  });

  it('preserves unmapped lines for user review and append to remarks', () => {
    const raw = `
Voyage Number: VOY-2026-99
All crew completed life boat drill at 14:00 UTC.
No anomalies detected on main propulsion bearings.
speed: 13.5
`;
    const result = smartFillParse(raw, noonTemplate);
    expect(result.mappedFields).toHaveLength(2);
    expect(result.unmappedLines).toContain('All crew completed life boat drill at 14:00 UTC.');
    expect(result.unmappedLines).toContain('No anomalies detected on main propulsion bearings.');
  });

  it('supports Free Text Report template', () => {
    const freeTextTemplate = MARINE_TEMPLATES.free_text;
    expect(freeTextTemplate).toBeDefined();

    const raw = `
Title: Mid-Atlantic Engine Log
Report Date: 2026-11-26
Report Text: Continuous engine telemetry recorded under stormy conditions.
`;
    const result = smartFillParse(raw, freeTextTemplate);
    const titleField = result.mappedFields.find(f => f.fieldId === 'reportTitle');
    const textField = result.mappedFields.find(f => f.fieldId === 'bodyText');

    expect(titleField?.foundValue).toBe('Mid-Atlantic Engine Log');
    expect(textField?.foundValue).toContain('Continuous engine telemetry');
  });
});
