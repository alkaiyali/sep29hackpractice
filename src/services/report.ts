import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { DailyAdherenceSummary, MedicationLog } from '../types/log';
import { Medicine } from '../types/medicine';
import { UserProfile } from '../types/user';
import { VitalLog } from '../types/vitals';

export interface ReportData {
  profile: UserProfile;
  medicines: Medicine[];
  summaries: DailyAdherenceSummary[]; // chronological, oldest → newest
  logs: MedicationLog[]; // raw logs (any order)
  vitals?: VitalLog[];
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatTimeStr(timeStr: string): string {
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 || 12;
  return `${displayH}:${mStr} ${ampm}`;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const STATUS_LABEL: Record<MedicationLog['status'], string> = {
  taken: '✓ Taken',
  skipped: '✕ Skipped',
  snoozed: '⏰ Snoozed',
};

export function buildReportHtml({ profile, medicines, summaries, logs, vitals = [] }: ReportData): string {
  const generatedAt = new Date().toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const totalDue = summaries.reduce((sum, s) => sum + s.totalDue, 0);
  const totalTaken = summaries.reduce((sum, s) => sum + s.taken, 0);
  const totalMissed = summaries.reduce((sum, s) => sum + s.missed, 0);
  const overallPct = totalDue > 0 ? Math.round((totalTaken / totalDue) * 100) : 0;

  const daysCovered = summaries.length;
  const periodStart = summaries[0]?.date ?? '—';
  const periodEnd = summaries[summaries.length - 1]?.date ?? '—';

  const medicineNameById = new Map(medicines.map((m) => [m.id, m.name]));

  const activeMedicines = medicines
    .map((med) => {
      const medSummaries = summaries.filter((s) =>
        // Include days the medicine existed
        s.date >= med.createdAt.split('T')[0]
      );
      const due = medSummaries.reduce((sum, s) => sum + s.totalDue, 0);
      const taken = medSummaries.reduce((sum, s) => sum + s.taken, 0);
      const pct = due > 0 ? Math.round((taken / due) * 100) : null;
      return { med, pct };
    })
    .sort((a, b) => a.med.name.localeCompare(b.med.name));

  const recentLogs = [...logs]
    .sort((a, b) => b.actionTime.localeCompare(a.actionTime))
    .slice(0, 30);

  const medRows = activeMedicines
    .map(
      ({ med, pct }) => `
        <tr>
          <td>${escapeHtml(med.name)}</td>
          <td>${med.dosage} ${escapeHtml(med.dosageUnit)}</td>
          <td>${med.scheduleTimes.map(formatTimeStr).join(', ')}</td>
          <td>${escapeHtml(med.instruction.replace(/_/g, ' '))}</td>
          <td class="num">${pct == null ? '—' : `${pct}%`}</td>
        </tr>`
    )
    .join('');

  const logRows = recentLogs
    .map(
      (log) => `
        <tr>
          <td>${formatDateTime(log.actionTime)}</td>
          <td>${escapeHtml(medicineNameById.get(log.medicineId) ?? 'Unknown medicine')}</td>
          <td>${STATUS_LABEL[log.status]}</td>
        </tr>`
    )
    .join('');

  const allergies =
    profile.allergies.length > 0 ? profile.allergies.map(escapeHtml).join(', ') : 'None recorded';

  const vitalRows = [...vitals]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 14)
    .map((v) => {
      const reading =
        v.systolic != null && v.diastolic != null
          ? `${v.systolic}/${v.diastolic} mmHg`
          : v.systolic != null
          ? `${v.systolic} mmHg sys`
          : v.diastolic != null
          ? `${v.diastolic} mmHg dia`
          : '—';
      const glucose = v.glucose != null ? `${v.glucose} mg/dL` : '—';
      return `
        <tr>
          <td>${escapeHtml(v.date)}</td>
          <td>${reading}</td>
          <td>${glucose}</td>
        </tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  body { font-family: -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0F172A; padding: 32px; font-size: 12px; }
  h1 { color: #0D9488; font-size: 22px; margin: 0 0 2px 0; }
  h2 { font-size: 14px; margin: 26px 0 8px 0; color: #0F766E; border-bottom: 2px solid #CCFBF1; padding-bottom: 4px; }
  .sub { color: #475569; font-size: 12px; margin-bottom: 18px; }
  .grid { display: flex; gap: 12px; margin: 16px 0; }
  .stat { flex: 1; background: #F0FDFA; border: 1px solid #CCFBF1; border-radius: 10px; padding: 12px; text-align: center; }
  .stat .value { font-size: 22px; font-weight: 800; color: #0F766E; }
  .stat .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; margin-top: 6px; }
  th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.4px; color: #475569; border-bottom: 1.5px solid #E2E8F0; padding: 6px 6px; }
  td { padding: 7px 6px; border-bottom: 1px solid #F1F5F9; }
  td.num { text-align: right; font-weight: 700; }
  .meta { margin-top: 4px; line-height: 1.6; }
  .footer { margin-top: 28px; color: #94A3B8; font-size: 10px; border-top: 1px solid #E2E8F0; padding-top: 10px; }
</style>
</head>
<body>
  <h1>Meddy — Medication Adherence Report</h1>
  <div class="sub">Generated ${escapeHtml(generatedAt)} · Reporting period: ${periodStart} → ${periodEnd} (${daysCovered} days)</div>

  <div class="meta">
    <strong>Patient:</strong> ${escapeHtml(profile.name || 'Not set')} &nbsp;·&nbsp;
    <strong>Blood type:</strong> ${escapeHtml(profile.bloodType || 'Not set')} &nbsp;·&nbsp;
    <strong>Known allergies:</strong> ${allergies}<br/>
    <strong>Emergency contact:</strong> ${escapeHtml(profile.emergencyContactName || 'Not set')} ${escapeHtml(profile.emergencyContactPhone || '')}
  </div>

  <div class="grid">
    <div class="stat"><div class="value">${overallPct}%</div><div class="label">Overall adherence</div></div>
    <div class="stat"><div class="value">${totalTaken}/${totalDue}</div><div class="label">Doses taken / due</div></div>
    <div class="stat"><div class="value">${totalMissed}</div><div class="label">Missed doses</div></div>
    <div class="stat"><div class="value">${activeMedicines.length}</div><div class="label">Tracked medicines</div></div>
  </div>

  <h2>Medications</h2>
  <table>
    <thead><tr><th>Medicine</th><th>Dosage</th><th>Schedule</th><th>Instruction</th><th class="num">Adherence</th></tr></thead>
    <tbody>${medRows || '<tr><td colspan="5">No medicines recorded.</td></tr>'}</tbody>
  </table>

  <h2>Recent Dose Activity (latest 30)</h2>
  <table>
    <thead><tr><th>Action time</th><th>Medicine</th><th>Status</th></tr></thead>
    <tbody>${logRows || '<tr><td colspan="3">No dose activity recorded.</td></tr>'}</tbody>
  </table>

  <h2>Vitals (latest 14)</h2>
  <table>
    <thead><tr><th>Date</th><th>Blood pressure</th><th>Glucose</th></tr></thead>
    <tbody>${vitalRows || '<tr><td colspan="3">No vitals recorded.</td></tr>'}</tbody>
  </table>

  <div class="footer">
    This report was generated by Meddy from self-reported dose logs stored on the patient's device.
    It is intended to support, not replace, clinical judgment.
  </div>
</body>
</html>`;
}

export async function exportDoctorReport(data: ReportData): Promise<void> {
  const html = buildReportHtml(data);

  if (Platform.OS === 'web') {
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      win.print();
    }
    return;
  }

  const { uri } = await Print.printToFileAsync({ html });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Share Meddy Adherence Report',
      UTI: 'com.adobe.pdf',
    });
  } else {
    await Print.printAsync({ html });
  }
}
