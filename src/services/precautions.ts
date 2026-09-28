/**
 * Food, beverage & timing precaution engine (offline, educational).
 * Matches medicine names against a curated rule base and returns
 * cautionary badges. This is general information, not medical advice.
 */

export interface Precaution {
  icon: string;
  label: string;
  detail: string;
}

interface PrecautionRule {
  match: RegExp;
  precautions: Precaution[];
}

const RULES: PrecautionRule[] = [
  {
    match: /atorvastatin|rosuvastatin|simvastatin|pravastatin|lovastatin|fluvastatin|pitavastatin/i,
    precautions: [
      {
        icon: '🍊',
        label: 'Avoid grapefruit',
        detail: 'Grapefruit juice can raise statin levels in your blood. Ask your doctor about safe alternatives.',
      },
    ],
  },
  {
    match: /doxycycline|tetracycline|minocycline|demeclocycline/i,
    precautions: [
      {
        icon: '🥛',
        label: 'No dairy/antacids 2h',
        detail: 'Dairy, antacids, calcium and iron block absorption. Take on an empty stomach with water.',
      },
      { icon: '☀️', label: 'Sun sensitivity', detail: 'This medicine can cause sunburn easily. Use sunscreen outdoors.' },
    ],
  },
  {
    match: /warfarin|coumadin/i,
    precautions: [
      {
        icon: '🥬',
        label: 'Steady vitamin K',
        detail: 'Keep leafy-green intake consistent — sudden changes affect how warfarin works.',
      },
      {
        icon: '🩸',
        label: 'Bleeding risk',
        detail: 'Avoid NSAIDs (ibuprofen, naproxen) and tell any doctor or dentist you take warfarin.',
      },
    ],
  },
  {
    match: /apixaban|rivaroxaban|edoxaban|dabigatran|clopidogrel|heparin/i,
    precautions: [
      {
        icon: '🩸',
        label: 'Bleeding risk',
        detail: 'Blood thinners plus NSAIDs or alcohol raise bleeding risk. Report unusual bruising.',
      },
    ],
  },
  {
    match: /ibuprofen|naproxen|diclofenac|celecoxib|ketorolac|meloxicam/i,
    precautions: [
      {
        icon: '🍽️',
        label: 'Take with food',
        detail: 'NSAIDs can irritate the stomach. Take with food and a full glass of water.',
      },
    ],
  },
  {
    match: /metformin/i,
    precautions: [
      {
        icon: '🍽️',
        label: 'Take with food',
        detail: 'Taking metformin with meals reduces stomach upset.',
      },
      {
        icon: '🚫',
        label: 'Limit alcohol',
        detail: 'Heavy drinking while on metformin raises the risk of lactic acidosis.',
      },
    ],
  },
  {
    match: /insulin|glipizide|glyburide|glimepiride/i,
    precautions: [
      {
        icon: '🍬',
        label: 'Hypoglycemia risk',
        detail: 'Skipping meals can drop blood sugar. Carry a fast-acting sugar source.',
      },
    ],
  },
  {
    match: /levothyroxine|synthroid|euthyrox/i,
    precautions: [
      {
        icon: '⏰',
        label: 'Empty stomach + wait',
        detail: 'Take 30–60 minutes before breakfast. Keep 4h away from calcium and iron.',
      },
    ],
  },
  {
    match: /lisinopril|enalapril|ramipril|losartan|valsartan|olmesartan/i,
    precautions: [
      {
        icon: '🧂',
        label: 'Skip potassium salt',
        detail: 'Avoid potassium supplements and salt substitutes unless your doctor approves.',
      },
    ],
  },
  {
    match: /amoxicillin|penicillin|azithromycin|cephalexin|ciprofloxacin|metronidazole/i,
    precautions: [
      {
        icon: '💊',
        label: 'Finish the course',
        detail: 'Stopping antibiotics early lets the infection return, stronger.',
      },
    ],
  },
  {
    match: /metronidazole/i,
    precautions: [
      {
        icon: '🚫',
        label: 'No alcohol',
        detail: 'Alcohol with metronidazole causes severe nausea and flushing — avoid until 48h after the last dose.',
      },
    ],
  },
  {
    match: /prednisone|prednisolone|dexamethasone/i,
    precautions: [
      {
        icon: '🌅',
        label: 'Morning + food',
        detail: 'Take steroids with breakfast. Never stop suddenly — tapering needs a doctor plan.',
      },
    ],
  },
  {
    match: /sertraline|fluoxetine|escitalopram|paroxetine|citalopram|venlafaxine/i,
    precautions: [
      {
        icon: '🚫',
        label: 'Avoid alcohol',
        detail: 'Alcohol worsens side effects of antidepressants and the condition being treated.',
      },
    ],
  },
  {
    match: /alendronate|risedronate|ibandronate/i,
    precautions: [
      {
        icon: '🧍',
        label: 'Stay upright 30 min',
        detail: 'Take with a full glass of water first thing in the morning and stay upright for 30 minutes.',
      },
    ],
  },
];

export function getPrecautions(medicineName: string): Precaution[] {
  const name = medicineName.trim();
  if (!name) return [];
  const out: Precaution[] = [];
  for (const rule of RULES) {
    if (rule.match.test(name)) {
      for (const p of rule.precautions) {
        if (!out.some((e) => e.label === p.label)) out.push(p);
      }
    }
  }
  return out;
}
