/**
 * Drug-drug interaction warning engine (offline, educational).
 * Curated high-risk pair rules checked when a medicine is added.
 * General information only — never a substitute for pharmacist review.
 */

export type InteractionSeverity = 'major' | 'moderate';

export interface InteractionWarning {
  severity: InteractionSeverity;
  medicines: [string, string];
  message: string;
}

interface InteractionRule {
  a: RegExp;
  b: RegExp;
  severity: InteractionSeverity;
  message: string;
}

const RULES: InteractionRule[] = [
  {
    a: /warfarin|coumadin/i,
    b: /aspirin|ibuprofen|naproxen|diclofenac|celecoxib|ketorolac/i,
    severity: 'major',
    message: 'Warfarin plus NSAIDs/aspirin sharply raises bleeding risk. Ask your doctor before combining.',
  },
  {
    a: /sildenafil|tadalafil|vardenafil|avanafil/i,
    b: /nitroglycerin|isosorbide/i,
    severity: 'major',
    message: 'ED medicines with nitrates can cause a dangerous blood-pressure drop. Never combine.',
  },
  {
    a: /methotrexate/i,
    b: /ibuprofen|naproxen|diclofenac|aspirin/i,
    severity: 'major',
    message: 'NSAIDs can raise methotrexate to toxic levels. Use only with oncologist approval.',
  },
  {
    a: /apixaban|rivaroxaban|edoxaban|dabigatran|clopidogrel/i,
    b: /ibuprofen|naproxen|diclofenac|aspirin|celecoxib/i,
    severity: 'moderate',
    message: 'Blood thinner plus NSAID/aspirin increases bleeding risk. Confirm with your doctor.',
  },
  {
    a: /lisinopril|enalapril|ramipril|losartan|valsartan/i,
    b: /spironolactone|amiloride|potassium/i,
    severity: 'moderate',
    message: 'ACE inhibitor/ARB plus potassium-raising drugs can push potassium dangerously high.',
  },
  {
    a: /simvastatin|lovastatin|atorvastatin/i,
    b: /clarithromycin|erythromycin|itraconazole|ketoconazole/i,
    severity: 'moderate',
    message: 'These antibiotics/antifungals raise statin levels and muscle-injury risk. Tell your prescriber.',
  },
  {
    a: /levothyroxine|synthroid/i,
    b: /calcium|iron|omeprazole|esomeprazole/i,
    severity: 'moderate',
    message: 'Calcium, iron and PPIs block thyroid-hormone absorption. Separate doses by 4 hours.',
  },
  {
    a: /sertraline|fluoxetine|escitalopram|paroxetine|citalopram/i,
    b: /ibuprofen|naproxen|diclofenac|aspirin/i,
    severity: 'moderate',
    message: 'SSRIs plus NSAIDs raise stomach-bleeding risk. Use the lowest dose for the shortest time.',
  },
  {
    a: /insulin|glipizide|glyburide|glimepiride/i,
    b: /metoprolol|atenolol|propranolol/i,
    severity: 'moderate',
    message: 'Beta blockers can mask low-blood-sugar warning signs. Monitor glucose closely.',
  },
  {
    a: /lithium/i,
    b: /ibuprofen|naproxen|hydrochlorothiazide|furosemide/i,
    severity: 'moderate',
    message: 'NSAIDs and diuretics can raise lithium to toxic levels. Levels should be rechecked.',
  },
];

function norm(name: string): string {
  return name.trim().toLowerCase();
}

/** Check a candidate medicine name against already-tracked medicines. */
export function checkInteractions(candidate: string, existingNames: string[]): InteractionWarning[] {
  const cand = norm(candidate);
  if (!cand) return [];
  const found: InteractionWarning[] = [];
  const seen = new Set<string>();

  for (const raw of existingNames) {
    const other = norm(raw);
    if (!other || other === cand) continue;
    for (const rule of RULES) {
      const hit =
        (rule.a.test(cand) && rule.b.test(other)) ||
        (rule.a.test(other) && rule.b.test(cand));
      if (!hit) continue;
      const key = [rule.message, other].join('|');
      if (seen.has(key)) continue;
      seen.add(key);
      found.push({
        severity: rule.severity,
        medicines: [candidate.trim(), raw.trim()],
        message: rule.message,
      });
    }
  }

  return found.sort((x, y) => (x.severity === y.severity ? 0 : x.severity === 'major' ? -1 : 1));
}
