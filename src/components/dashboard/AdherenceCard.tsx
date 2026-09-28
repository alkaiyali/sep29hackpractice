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

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.leftCol}>
          <Text style={styles.label}>Today's Adherence</Text>
          <Text style={styles.percentageText}>{percentage}%</Text>
          <Text style={styles.fractionText}>
            {taken} of {totalDue} {totalDue === 1 ? 'dose' : 'doses'} completed
          </Text>
          {missed > 0 && (
            <Text style={styles.missedText}>⚠ {missed} missed</Text>
          )}
        </View>

        <View style={styles.streakBadge}>
          <Ionicons name="flame" size={24} color="#F59E0B" />
          <View>
            <Text style={styles.streakNum}>{streakDays} Days</Text>
            <Text style={styles.streakLabel}>Streak</Text>
          </View>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarTrack}>
        <View style={[styles.progressBarFill, { width: `${Math.min(percentage, 100)}%` }]} />
      </View>

      {/* Motivational message */}
      <View style={styles.messageRow}>
        <Ionicons
          name={percentage === 100 ? 'sparkles' : 'shield-checkmark-outline'}
          size={16}
          color={colors.primary}
        />
        <Text style={styles.messageText}>
          {percentage === 100
            ? 'Awesome job! All doses taken today.'
            : missed > 0
            ? `${missed} ${missed === 1 ? 'dose' : 'doses'} missed — review your history.`
            : percentage > 50
            ? 'Great momentum! You are on track for today.'
            : 'Keep it up! Your health is your best investment.'}
        </Text>
      </View>

      {onPressHistory && (
        <TouchableOpacity style={styles.historyBtn} onPress={onPressHistory} activeOpacity={0.7}>
          <Ionicons name="calendar-outline" size={15} color={colors.primary} />
          <Text style={styles.historyBtnText}>View History & Calendar</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  leftCol: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  percentageText: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.primaryDark,
    letterSpacing: -0.5,
    marginVertical: 2,
  },
  fractionText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    gap: 8,
  },
  streakNum: {
    fontSize: 15,
    fontWeight: '700',
    color: '#92400E',
  },
  streakLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#B45309',
    textTransform: 'uppercase',
  },
  progressBarTrack: {
    height: 10,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 5,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  messageText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  missedText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.danger,
    marginTop: 4,
  },
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
  },
  historyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
});
