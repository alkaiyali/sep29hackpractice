import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TodayDoseItem } from '../../store/medicineStore';
import { ThemeColors } from '../../constants/colors';
import { useTheme, useThemedStyles } from '../../theme/ThemeProvider';
import { Badge } from '../ui/Badge';

interface TodayDoseCardProps {
  item: TodayDoseItem;
  memberName?: string;
  onTake: () => void;
  onSnooze: () => void;
  onSkip: () => void;
  onPressCard?: () => void;
}

export const TodayDoseCard: React.FC<TodayDoseCardProps> = ({
  item,
  memberName,
  onTake,
  onSnooze,
  onSkip,
  onPressCard,
}) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { medicine, timeStr, status } = item;
  const isMissed = status === 'missed';

  const getFormIconName = (form: string): keyof typeof Ionicons.glyphMap => {
    switch (form) {
      case 'liquid':
        return 'water-outline';
      case 'inhaler':
        return 'cloud-outline';
      case 'injection':
        return 'eyedrop-outline';
      case 'drops':
        return 'color-fill-outline';
      default:
        return 'medkit-outline';
    }
  };

  const formatDisplayTime = (time: string) => {
    const [hStr, mStr] = time.split(':');
    const h = parseInt(hStr, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    return `${displayH}:${mStr} ${ampm}`;
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'taken':
        return <Badge label="✓ Taken" variant="success" />;
      case 'snoozed':
        return <Badge label="⏰ Snoozed" variant="warning" />;
      case 'skipped':
        return <Badge label="✕ Skipped" variant="neutral" />;
      case 'missed':
        return <Badge label="⚠ Missed" variant="danger" />;
      default:
        return <Badge label="Scheduled" variant="primary" />;
    }
  };

  const isCompleted = status === 'taken' || status === 'skipped';

  const railColor =
    status === 'taken'
      ? colors.success
      : status === 'missed'
      ? colors.danger
      : status === 'snoozed'
      ? colors.warning
      : status === 'skipped'
      ? colors.textMuted
      : colors.primary;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPressCard}
      style={[
        styles.card,
        isCompleted && styles.completedCard,
        isMissed && styles.missedCard,
      ]}
    >
      <View style={[styles.rail, { backgroundColor: railColor }]} />
      <View style={styles.headerRow}>
        <View style={styles.timeBadgeContainer}>
          <Ionicons name="time-outline" size={14} color={colors.primaryDark} />
          <Text style={styles.timeText}>{formatDisplayTime(timeStr)}</Text>
        </View>

        <View style={styles.statusAndMember}>
          {memberName && (
            <View style={styles.memberTag}>
              <Ionicons name="people-outline" size={12} color={colors.accent} />
              <Text style={styles.memberNameText}>{memberName}</Text>
            </View>
          )}
          {getStatusBadge()}
        </View>
      </View>

      <View style={styles.bodyRow}>
        {medicine.photoUri ? (
          <Image source={{ uri: medicine.photoUri }} style={styles.medicinePhoto} />
        ) : (
          <View style={styles.iconCircle}>
            <Ionicons name={getFormIconName(medicine.form)} size={24} color={colors.primary} />
          </View>
        )}

        <View style={styles.detailsCol}>
          <Text style={[styles.nameText, isCompleted && styles.completedText]}>
            {medicine.name}
          </Text>
          <Text style={styles.dosageText}>
            {medicine.dosage} {medicine.dosageUnit} • {medicine.form.toUpperCase()}
          </Text>
          <Text style={styles.instructionText}>
            📌 {medicine.instruction.replace(/_/g, ' ')}
          </Text>
        </View>
      </View>

      {/* Action buttons if not yet taken */}
      {!isCompleted ? (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.takeBtn]}
            onPress={onTake}
            activeOpacity={0.7}
          >
            <Ionicons name="checkmark-circle" size={18} color={colors.onPrimary} />
            <Text style={styles.takeBtnText}>Take</Text>
          </TouchableOpacity>

          {!isMissed && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.snoozeBtn]}
              onPress={onSnooze}
              activeOpacity={0.7}
            >
              <Ionicons name="time" size={16} color={colors.warning} />
              <Text style={styles.snoozeBtnText}>Snooze ({medicine.reminderSettings.snoozeMinutes}m)</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actionBtn, styles.skipBtn]}
            onPress={onSkip}
            activeOpacity={0.7}
          >
            <Text style={styles.skipBtnText}>Skip</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.completedFooter}>
          <Ionicons
            name={status === 'taken' ? 'checkmark-circle-outline' : 'close-circle-outline'}
            size={16}
            color={status === 'taken' ? colors.success : colors.textMuted}
          />
          <Text style={styles.completedFooterText}>
            {status === 'taken' ? 'Dose recorded successfully' : 'Dose marked as skipped'}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 16,
    paddingLeft: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  rail: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  completedCard: {
    backgroundColor: colors.surfaceSubtle,
    opacity: 0.75,
  },
  missedCard: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerLight,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  timeBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    gap: 5,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  statusAndMember: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  memberNameText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.accent,
  },
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  medicinePhoto: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.surfaceSubtle,
  },
  detailsCol: {
    flex: 1,
  },
  nameText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  completedText: {
    color: colors.textSecondary,
  },
  dosageText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryDark,
    marginBottom: 3,
  },
  instructionText: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  takeBtn: {
    backgroundColor: colors.primary,
    flex: 2,
    gap: 6,
  },
  takeBtnText: {
    color: colors.onPrimary,
    fontWeight: '800',
    fontSize: 14,
  },
  snoozeBtn: {
    backgroundColor: colors.warningLight,
    flex: 2,
    gap: 4,
  },
  snoozeBtnText: {
    color: colors.warning,
    fontWeight: '600',
    fontSize: 13,
  },
  skipBtn: {
    backgroundColor: colors.surfaceSubtle,
    flex: 1,
  },
  skipBtnText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  completedFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
  },
  completedFooterText: {
    fontSize: 12,
    color: colors.textMuted,
  },
});
