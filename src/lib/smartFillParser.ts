import { type FormTemplate, type FormField } from '../forms/types';

export interface ParsedFieldResult {
  fieldId: string;
  fieldLabel: string;
  foundValue: any;
  currentValue: any;
  confidence: 'High' | 'Medium' | 'Low';
  applied: boolean;
  rawMatchedLine: string;
}

export interface SmartFillResult {
  mappedFields: ParsedFieldResult[];
  unmappedLines: string[];
}

const ALIASES: Record<string, string[]> = {
  // Navigation & Positional
  reportDate: ['date', 'report date', 'log date', 'ops date', 'timestamp'],
  voyageNumber: ['voyage', 'voyage number', 'voy', 'current voyage'],
  coordinates: ['coordinates', 'position', 'pos', 'fix', 'noon coordinates', 'noon position', 'lat lon', 'gps'],
  course: ['course', 'true course', 'cog', 'heading', 'steer'],
  speedOverGround: ['speed', 'sog', 'speed over ground', 'spd', 'vessel speed'],
  distanceRun24h: ['distance', 'distance run', 'distance run 24h', 'dist run', 'dist 24h'],
  distanceToGo: ['distance to go', 'dtg', 'rem distance'],
  weatherCondition: ['weather', 'weather condition', 'weather and visibility', 'visibility', 'vis', 'sky'],
  windForceBeaufort: ['wind', 'wind force', 'beaufort', 'bf', 'wind speed'],
  seaState: ['sea', 'sea state', 'waves', 'swell'],
  
  // Fuel & Engine
  robHfoMetricTons: ['rob hfo', 'rob vlsfo', 'vlsfo', 'hfo', 'fuel oil', 'heavy fuel', 'rob fuel'],
  robMdoMetricTons: ['rob mdo', 'rob lsmgo', 'lsmgo', 'mdo', 'marine diesel', 'diesel'],
  robFreshWaterTons: ['rob fresh water', 'rob fw', 'fresh water', 'fw', 'water'],
  robLubOilLiters: ['rob lub oil', 'lub oil', 'cylinder oil', 'me lub oil'],
  mainEngineRpm: ['main engine rpm', 'me rpm', 'engine rpm', 'rpm'],
  meShaftPowerKw: ['shaft power', 'power kw', 'me power'],
  gen1LoadKw: ['gen 1 load', 'dg 1', 'generator 1', 'dg1 load'],
  gen2LoadKw: ['gen 2 load', 'dg 2', 'generator 2', 'dg2 load'],
  
  // Operations & Remarks
  remarks: ['remarks', 'notes', 'comments', 'master remarks', 'officer remarks', 'summary'],
  reportTitle: ['report subject / title', 'report subject', 'report title', 'subject', 'title'],
  bodyText: ['report narrative body', 'report text', 'narrative', 'body text', 'body', 'text', 'message'],
  navStatus: ['nav status', 'navigational status', 'status', 'condition'],
  securityLevel: ['security level', 'marsec', 'isps', 'security']
};

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function parseCoordinates(raw: string): string | null {
  // Pattern: 54.2150 N, 003.4510 E or 54°12.9'N 003°27.1'E
  const cleaned = raw.replace(/[°'"]/g, ' ').replace(/\s+/g, ' ').trim();
  const match = cleaned.match(/(\d+(?:\.\d+)?)\s*([NSns])[,\s]+(\d+(?:\.\d+)?)\s*([EWew])/);
  if (match) {
    const latVal = match[1];
    const latHem = match[2].toUpperCase();
    const lonVal = match[3];
    const lonHem = match[4].toUpperCase();
    return `${latVal} ${latHem}, ${lonVal} ${lonHem}`;
  }
  return null;
}

export function parseFieldValue(field: FormField, rawVal: string): any {
  const trimmed = rawVal.trim();

  if (field.type === 'coordinates') {
    const coord = parseCoordinates(trimmed);
    return coord || trimmed;
  }

  if (field.type === 'number') {
    // Strip trailing units: "14.8 kts" -> 14.8, "242 deg" -> 242, "642.5 MT" -> 642.5
    const numMatch = trimmed.match(/^[-+]?[0-9]*\.?[0-9]+/);
    if (numMatch) {
      return parseFloat(numMatch[0]);
    }
    return undefined;
  }

  if (field.type === 'checkbox') {
    const lower = trimmed.toLowerCase();
    return ['true', 'yes', '1', 'checked', 'passed', 'completed', 'ok', 'satisfactory'].includes(lower);
  }

  if (field.type === 'select' && field.options) {
    const lower = trimmed.toLowerCase();
    const exact = field.options.find(opt => opt.value.toLowerCase() === lower || opt.label.toLowerCase() === lower);
    if (exact) return exact.value;
    const partial = field.options.find(opt => opt.label.toLowerCase().includes(lower) || lower.includes(opt.value.toLowerCase()));
    if (partial) return partial.value;
  }

  return trimmed;
}

export function smartFillParse(
  text: string,
  template: FormTemplate,
  currentData: Record<string, any> = {}
): SmartFillResult {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const mappedFields: ParsedFieldResult[] = [];
  const unmappedLines: string[] = [];

  // Extract all fields from template
  const allFields: FormField[] = [];
  template.sections.forEach(s => allFields.push(...s.fields));

  const matchedFieldIds = new Set<string>();

  for (const line of lines) {
    // Split by ":", "=", or "-"
    const splitIndex = line.search(/[:=-]/);
    if (splitIndex === -1) {
      unmappedLines.push(line);
      continue;
    }

    const rawKey = line.slice(0, splitIndex).trim();
    const rawVal = line.slice(splitIndex + 1).trim();

    if (!rawKey || !rawVal) {
      unmappedLines.push(line);
      continue;
    }

    const normKey = normalizeText(rawKey);
    let matchedField: FormField | undefined;
    let confidence: 'High' | 'Medium' | 'Low' = 'Low';

    // 1. Try exact label or ID match
    matchedField = allFields.find(f => {
      const normFieldLabel = normalizeText(f.label);
      const normFieldId = normalizeText(f.id);
      return normKey === normFieldLabel || normKey === normFieldId;
    });

    if (matchedField) {
      confidence = 'High';
    } else {
      // 2. Try alias dictionary
      for (const [fieldId, aliasList] of Object.entries(ALIASES)) {
        if (aliasList.some(a => normalizeText(a) === normKey)) {
          matchedField = allFields.find(f => f.id === fieldId);
          if (matchedField) {
            confidence = 'High';
            break;
          }
        }
      }
    }

    // 3. Try partial fuzzy containment
    if (!matchedField) {
      matchedField = allFields.find(f => {
        const normLabel = normalizeText(f.label);
        return normLabel.includes(normKey) || normKey.includes(normLabel);
      });
      if (matchedField) {
        confidence = 'Medium';
      }
    }

    if (matchedField && !matchedFieldIds.has(matchedField.id)) {
      matchedFieldIds.add(matchedField.id);
      const parsedVal = parseFieldValue(matchedField, rawVal);

      if (parsedVal !== undefined && parsedVal !== '') {
        mappedFields.push({
          fieldId: matchedField.id,
          fieldLabel: matchedField.label,
          foundValue: parsedVal,
          currentValue: currentData[matchedField.id],
          confidence,
          applied: true,
          rawMatchedLine: line
        });
        continue;
      }
    }

    unmappedLines.push(line);
  }

  return { mappedFields, unmappedLines };
}
