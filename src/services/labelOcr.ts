import { Platform } from 'react-native';
import { DosageUnit, MedicineInstruction } from '../types/medicine';

export interface ParsedLabel {
  name: string;
  dosage: string;
  dosageUnit: DosageUnit;
  instruction: MedicineInstruction;
  rawLines: string[];
}

const OCR_ENDPOINT = 'https://api.ocr.space/parse/image';
// Free demo key — rate-limited. Works offline? No: label scanning needs internet.
const OCR_API_KEY = 'helloworld';

const VALID_UNITS: DosageUnit[] = [
  'mg',
  'mcg',
  'ml',
  'tablets',
  'capsules',
  'drops',
  'puffs',
  'units',
  'IU',
];

async function uriToBase64(uri: string): Promise<string> {
  if (Platform.OS === 'web') {
    const res = await fetch(uri);
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        const comma = dataUrl.indexOf(',');
        resolve(comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl);
      };
      reader.onerror = () => reject(new Error('Could not read photo.'));
      reader.readAsDataURL(blob);
    });
  }
  const LegacyFS = await import('expo-file-system/legacy');
  return await LegacyFS.readAsStringAsync(uri, {
    encoding: LegacyFS.EncodingType.Base64,
  });
}

export async function extractLabelText(photoUri: string): Promise<string[]> {
  const base64 = await uriToBase64(photoUri);
  // Free tier caps uploads around ~1MB
  if (base64.length > 1_400_000) {
    throw new Error('Photo is too large to upload. Retake with a closer crop.');
  }

  const form = new FormData();
  form.append('apikey', OCR_API_KEY);
  form.append('base64Image', `data:image/jpeg;base64,${base64}`);
  form.append('OCREngine', '2');
  form.append('scale', 'true');

  const res = await fetch(OCR_ENDPOINT, { method: 'POST', body: form });
  if (!res.ok) {
    throw new Error(`OCR service responded with ${res.status}. Check your connection.`);
  }
  const json = await res.json();
  if (json.IsErroredOnProcessing) {
    const msg = Array.isArray(json.ErrorMessage)
      ? json.ErrorMessage.join(' ')
      : json.ErrorMessage || 'OCR failed to read this photo.';
    throw new Error(msg);
  }
  const text: string = json?.ParsedResults?.[0]?.ParsedText || '';
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length === 0) {
    throw new Error('No text found. Try better lighting and a straight-on angle.');
  }
  return lines;
}

const SKIP_LINE = /rx\b|take\b|daily|refill|pharmacy|doctor|directions|qty|discard|store|patient|prescription|warning|keep out|date|tablet count/i;

function guessUnit(raw: string): DosageUnit {
  const u = raw.toLowerCase();
  if (u.startsWith('mcg') || u === 'µg') return 'mcg';
  if (u.startsWith('mg')) return 'mg';
  if (u.startsWith('ml')) return 'ml';
  if (u.startsWith('tablet')) return 'tablets';
  if (u.startsWith('capsule')) return 'capsules';
  if (u.startsWith('drop')) return 'drops';
  if (u.startsWith('puff')) return 'puffs';
  if (u.startsWith('unit')) return 'units';
  if (u === 'iu') return 'IU';
  if (u === 'g') return 'mg';
  return 'mg';
}

function guessInstruction(fullText: string): MedicineInstruction {
  const t = fullText.toLowerCase();
  if (/empty stomach|on an empty stomach/.test(t)) return 'empty_stomach';
  if (/with food|with meal|after meal|after eating/.test(t)) return 'after_meal';
  if (/before meal|before eating/.test(t)) return 'before_meal';
  if (/bedtime|at night|before sleep/.test(t)) return 'before_bed';
  return 'anytime';
}

export function parseLabel(lines: string[]): ParsedLabel {
  const fullText = lines.join('\n');

  let dosage = '';
  let dosageUnit: DosageUnit = 'mg';
  const doseMatch = fullText.match(/(\d+(?:\.\d+)?)\s*(mcg|µg|mg|ml|tablets?|capsules?|drops?|puffs?|units?|iu|g)\b/i);
  if (doseMatch) {
    dosage = doseMatch[1];
    dosageUnit = guessUnit(doseMatch[2]);
    if (!VALID_UNITS.includes(dosageUnit)) dosageUnit = 'mg';
  }

  // Medicine name: longest alpha-heavy line that isn't directions boilerplate
  let name = '';
  let best = 0;
  for (const line of lines) {
    if (SKIP_LINE.test(line)) continue;
    const letters = (line.match(/[A-Za-z]/g) || []).length;
    if (letters >= 4 && line.length > best && line.length <= 60) {
      best = line.length;
      name = line;
    }
  }
  // Strip trailing dosage fragment if the regex caught it inside the name line
  name = name.replace(/\s+\d+(?:\.\d+)?\s*(mcg|µg|mg|ml|tablets?|capsules?|drops?|puffs?|units?|iu|g)\b.*/i, '').trim();

  return {
    name,
    dosage,
    dosageUnit,
    instruction: guessInstruction(fullText),
    rawLines: lines,
  };
}
