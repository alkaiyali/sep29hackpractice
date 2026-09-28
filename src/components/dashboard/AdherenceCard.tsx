import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors } from '../../constants/colors';
import { useTheme, useThemedStyles } from '../../theme/ThemeProvider';
import { DailyAdherenceSummary } from '../../types/log';

interface AdherenceCardProps {
  summary: DailyAdherenceSummary;
  streakDays: number;
  onPressHistory?: () => void;
}

export const AdherenceCard: React.FC<AdherenceCardProps> = ({ summary, streakDays, onPressHistory }) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { taken, totalDue, percentage, missed } = summary;
  const isEmpty = totalDue === 0;

  return (
    <View style={styles.hero}>
      <View style={styles.topRow}>
        <View style={styles.leftCol}>
          <View style={styles.labelRow}>
            <Ionicons name="pulse" size={13} color={colors.heroSub} />
            <Text style={styles.label}>Today's Adherence</Text>
          </View>
          <Text style={styles.percentageText}>{isEmpty ? '—' : `${percentage}%`}</Text>
          <Text style={styles.fractionText}>
            {isEmpty
              ? 'No doses scheduled today'
              : `${taken} of ${totalDue} ${totalDue === 1 ? 'dose' : 'doses'} · ${missed > 0 ? `${missed} missed` : 'on track'}`}
          </Text>
        </View>

        <View style={styles.streakPill}>
          <Ionicons name="flame" size={18} color="#FBBF24" />
          <Text style={styles.streakNum}>{streakDays}</Text>
          <Text style={styles.streakLabel}>day streak</Text>
        </View>
      </View>

      {/* Progress track */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.min(percentage, 100)}%` }]} />
      </View>

      {/* Motivational message */}
      <View style={styles.messageRow}>
        <Ionicons
          name={percentage === 100 ? 'sparkles' : missed > 0 ? 'warning-outline' : 'shield-checkmark-outline'}
          size={15}
          color={colors.heroSub}
        />
        <Text style={styles.messageText} numberOfLines={2}>
          {isEmpty
            ? 'Add your first medicine to start your streak.'
            : percentage === 100
            ? 'Perfect day — every dose taken.'
            : missed > 0
            ? `${missed} ${missed === 1 ? 'dose' : 'doses'} missed — tap history to review.`
            : percentage > 50
            ? 'Great momentum — finish strong today.'
            : 'Small steps count. Take your next dose.'}
        </Text>
      </View>

      {onPressHistory && (
        <TouchableOpacity style={styles.historyBtn} onPress={onPressHistory} activeOpacity={0.7}>
          <Ionicons name="calendar-outline" size={15} color={colors.heroText} />
          <Text style={styles.historyBtnText}>History & Calendar</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.heroText} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  hero: {
    backgroundColor: colors.hero,
    borderRadius: 26,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.heroBorder,
    shadowColor: colors.glow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  leftCol: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.heroSub,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  percentageText: {
    fontSize: 46,
    fontWeight: '900',
    color: colors.heroText,
    letterSpacing: -1.5,
    marginTop: 4,
    lineHeight: 50,
  },
  fractionText: {
    fontSize: 13,
    color: colors.heroSub,
    fontWeight: '600',
    marginTop: 2,
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.heroTrack,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    gap: 5,
  },
  streakNum: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.heroText,
  },
  streakLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.heroSub,
  },
  progressTrack: {
    height: 10,
    backgroundColor: colors.heroTrack,
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.heroFill,
    borderRadius: 999,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  messageText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.heroSub,
    lineHeight: 18,
  },
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.heroTrack,
  },
  historyBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.heroText,
    letterSpacing: 0.2,
  },
});
