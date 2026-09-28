import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMedicineStore, TodayDoseItem } from '../store/medicineStore';
import { DailyAdherenceSummary, DoseDisplayStatus } from '../types/log';
import { ThemeColors } from '../constants/colors';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';
import { Header } from '../components/ui/Header';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const HISTORY_WINDOW_DAYS = 120;

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const getDoseHistory = useMedicineStore((s) => s.getDoseHistory);
  const getDosesForDate = useMedicineStore((s) => s.getDosesForDate);
  const medicines = useMedicineStore((s) => s.medicines);
  const logs = useMedicineStore((s) => s.logs);

  const today = new Date();
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  const [monthCursor, setMonthCursor] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const windowStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - (HISTORY_WINDOW_DAYS - 1));
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);

  // medicines/logs in deps so the aggregate refreshes when data changes
  const historyMap = useMemo(() => {
    const map: Record<string, DailyAdherenceSummary> = {};
    getDoseHistory(HISTORY_WINDOW_DAYS).forEach((summary) => {
      map[summary.date] = summary;
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getDoseHistory, medicines, logs]);

  const year = monthCursor.getFullYear();
  const month = monthCursor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = new Date(year, month, 1).getDay();

  const monthLabel = monthCursor.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const canGoPrev = new Date(year, month, 1) > windowStart;
  const canGoNext =
    new Date(year, month + 1, 1) <= new Date(today.getFullYear(), today.getMonth(), 1);

  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const monthSummary = useMemo(() => {
    let due = 0;
    let taken = 0;
    let missed = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const s = historyMap[toDateStr(year, month, d)];
      if (s) {
        due += s.totalDue;
        taken += s.taken;
        missed += s.missed;
      }
    }
    return { due, taken, missed, pct: due > 0 ? Math.round((taken / due) * 100) : null };
  }, [historyMap, year, month, daysInMonth]);

  const selectedDoses: TodayDoseItem[] = useMemo(
    () => getDosesForDate(new Date(`${selectedDate}T12:00:00`)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedDate, getDosesForDate, medicines, logs]
  );

  const getDotColor = (dateStr: string): string => {
    const s = historyMap[dateStr];
    if (!s || s.totalDue === 0) return 'transparent';
    if (s.missed > 0) return colors.danger;
    if (s.percentage === 100) return colors.success;
    return colors.warning;
  };

  const formatActionTime = (iso: string): string =>
    new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  const statusMeta = (status: DoseDisplayStatus): { label: string; color: string; bg: string } => {
    switch (status) {
      case 'taken':
        return { label: '✓ Taken', color: colors.success, bg: colors.successLight };
      case 'snoozed':
        return { label: '⏰ Snoozed', color: colors.warning, bg: colors.warningLight };
      case 'skipped':
        return { label: '✕ Skipped', color: colors.textSecondary, bg: colors.surfaceSubtle };
      case 'missed':
        return { label: '⚠ Missed', color: colors.danger, bg: colors.dangerLight };
      default:
        return { label: 'Scheduled', color: colors.primaryDark, bg: colors.primaryLight };
    }
  };

  const selectedDateLabel =
    selectedDate === todayStr
      ? 'Today'
      : new Date(`${selectedDate}T12:00:00`).toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
        });

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <Header
        title="History & Adherence"
        subtitle="Your compliance calendar"
        onBack={() => router.back()}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Calendar Card */}
        <View style={styles.monthCard}>
          <View style={styles.monthNavRow}>
            <TouchableOpacity
              style={[styles.navBtn, !canGoPrev && styles.navBtnDisabled]}
              disabled={!canGoPrev}
              onPress={() => setMonthCursor(new Date(year, month - 1, 1))}
              hitSlop={8}
            >
              <Ionicons name="chevron-back" size={20} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.monthLabel}>{monthLabel}</Text>
            <TouchableOpacity
              style={[styles.navBtn, !canGoNext && styles.navBtnDisabled]}
              disabled={!canGoNext}
              onPress={() => setMonthCursor(new Date(year, month + 1, 1))}
              hitSlop={8}
            >
              <Ionicons name="chevron-forward" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {monthSummary.pct != null ? (
            <Text style={styles.monthStat}>
              {monthSummary.pct}% adherence this month · {monthSummary.taken}/{monthSummary.due}{' '}
              doses
              {monthSummary.missed > 0 ? ` · ${monthSummary.missed} missed` : ''}
            </Text>
          ) : (
            <Text style={styles.monthStat}>No doses scheduled this month</Text>
          )}

          <View style={styles.weekdayRow}>
            {WEEKDAY_LABELS.map((label, index) => (
              <Text key={`${label}-${index}`} style={styles.weekdayLabel}>
                {label}
              </Text>
            ))}
          </View>

          <View style={styles.grid}>
            {cells.map((day, index) => {
              if (day == null) {
                return <View key={`empty-${index}`} style={styles.dayCell} />;
              }
              const dateStr = toDateStr(year, month, day);
              const isFuture = dateStr > todayStr;
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;
              return (
                <TouchableOpacity
                  key={dateStr}
                  style={[styles.dayCell, isSelected && styles.dayCellSelected]}
                  disabled={isFuture}
                  onPress={() => setSelectedDate(dateStr)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dayNumber,
                      isFuture && styles.dayNumberFuture,
                      isToday && styles.dayNumberToday,
                      isSelected && styles.dayNumberSelected,
                    ]}
                  >
                    {day}
                  </Text>
                  <View
                    style={[
                      styles.dayDot,
                      { backgroundColor: isFuture ? 'transparent' : getDotColor(dateStr) },
                    ]}
                  />
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
              <Text style={styles.legendText}>All taken</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
              <Text style={styles.legendText}>Partial</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
              <Text style={styles.legendText}>Missed</Text>
            </View>
          </View>
        </View>

        {/* Selected Day Details */}
        <Text style={styles.sectionTitle}>{selectedDateLabel}</Text>

        {selectedDoses.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="calendar-clear-outline" size={36} color={colors.textMuted} />
            <Text style={styles.emptyText}>No doses scheduled on this day.</Text>
          </View>
        ) : (
          selectedDoses.map((dose) => {
            const meta = statusMeta(dose.status);
            let detail = 'Scheduled';
            if (dose.status === 'taken' && dose.actionTime) {
              detail = `Taken at ${formatActionTime(dose.actionTime)}`;
            } else if (dose.status === 'snoozed' && dose.actionTime) {
              detail = `Snoozed at ${formatActionTime(dose.actionTime)}`;
            } else if (dose.status === 'skipped') {
              detail = 'Marked as skipped';
            } else if (dose.status === 'missed') {
              detail = 'No dose recorded';
            }

            return (
              <View key={dose.id} style={styles.doseRow}>
                <View style={styles.doseTimeCol}>
                  <Text style={styles.doseTime}>{dose.timeStr}</Text>
                  <Text style={styles.doseDetail}>{detail}</Text>
                </View>
                <View style={styles.doseRightCol}>
                  <Text style={styles.doseName} numberOfLines={1}>
                    {dose.medicine.name}
                  </Text>
                  <View style={[styles.statusChip, { backgroundColor: meta.bg }]}>
                    <Text style={[styles.statusChipText, { color: meta.color }]}>{meta.label}</Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: 20,
      paddingBottom: 60,
      gap: 14,
    },
    monthCard: {
      backgroundColor: colors.surface,
      borderRadius: 26,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    monthNavRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    navBtn: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    navBtnDisabled: {
      opacity: 0.35,
    },
    monthLabel: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    monthStat: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 12,
    },
    weekdayRow: {
      flexDirection: 'row',
      marginBottom: 4,
    },
    weekdayLabel: {
      flex: 1,
      textAlign: 'center',
      fontSize: 11,
      fontWeight: '700',
      color: colors.textMuted,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    dayCell: {
      width: `${100 / 7}%`,
      alignItems: 'center',
      paddingVertical: 5,
      borderRadius: 10,
    },
    dayCellSelected: {
      backgroundColor: colors.primarySoft,
    },
    dayNumber: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    dayNumberFuture: {
      color: colors.textMuted,
      opacity: 0.5,
    },
    dayNumberToday: {
      color: colors.primary,
      fontWeight: '800',
    },
    dayNumberSelected: {
      color: colors.primaryDark,
      fontWeight: '800',
    },
    dayDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginTop: 3,
    },
    legendRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 16,
      marginTop: 12,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: colors.surfaceBorder,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    legendText: {
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    sectionTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: colors.textPrimary,
      marginTop: 8,
    },
    emptyCard: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 28,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      gap: 8,
    },
    emptyText: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    doseRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      gap: 12,
    },
    doseTimeCol: {
      width: 118,
    },
    doseTime: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.primaryDark,
    },
    doseDetail: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 2,
    },
    doseRightCol: {
      flex: 1,
      alignItems: 'flex-end',
      gap: 5,
    },
    doseName: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    statusChip: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    statusChipText: {
      fontSize: 11,
      fontWeight: '700',
    },
  });
