import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TodayDoseItem } from '../../store/medicineStore';
import { Colors } from '../../constants/colors';
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
  const { medicine, timeStr, status } = item;

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
      default:
        return <Badge label="Scheduled" variant="primary" />;
    }
  };

  const isCompleted = status === 'taken' || status === 'skipped';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPressCard}
      style={[
        styles.card,
        isCompleted && styles.completedCard,
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.timeBadgeContainer}>
          <Ionicons name="time-outline" size={14} color={Colors.light.primaryDark} />
          <Text style={styles.timeText}>{formatDisplayTime(timeStr)}</Text>
        </View>

        <View style={styles.statusAndMember}>
          {memberName && (
            <View style={styles.memberTag}>
              <Ionicons name="people-outline" size={12} color={Colors.light.accent} />
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
            <Ionicons name={getFormIconName(medicine.form)} size={24} color={Colors.light.primary} />
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
            <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
            <Text style={styles.takeBtnText}>Take</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.snoozeBtn]}
            onPress={onSnooze}
            activeOpacity={0.7}
          >
            <Ionicons name="time" size={16} color={Colors.light.warning} />
            <Text style={styles.snoozeBtnText}>Snooze ({medicine.reminderSettings.snoozeMinutes}m)</Text>
          </TouchableOpacity>

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
            color={status === 'taken' ? Colors.light.success : Colors.light.textMuted}
          />
          <Text style={styles.completedFooterText}>
            {status === 'taken' ? 'Dose recorded successfully' : 'Dose marked as skipped'}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.surfaceBorder,
    shadowColor: Colors.light.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  completedCard: {
    backgroundColor: '#FAFDFB',
    borderColor: '#E6F4EA',
    opacity: 0.9,
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
    backgroundColor: Colors.light.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 5,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.primaryDark,
  },
  statusAndMember: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.accentLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  memberNameText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.accent,
  },
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.light.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medicinePhoto: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.light.surfaceSubtle,
  },
  detailsCol: {
    flex: 1,
  },
  nameText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.light.textPrimary,
    marginBottom: 2,
  },
  completedText: {
    color: Colors.light.textSecondary,
  },
  dosageText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.primaryDark,
    marginBottom: 3,
  },
  instructionText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textTransform: 'capitalize',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.surfaceBorder,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  takeBtn: {
    backgroundColor: Colors.light.primary,
    flex: 2,
    gap: 6,
  },
  takeBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  snoozeBtn: {
    backgroundColor: Colors.light.warningLight,
    flex: 2,
    gap: 4,
  },
  snoozeBtnText: {
    color: Colors.light.warning,
    fontWeight: '600',
    fontSize: 13,
  },
  skipBtn: {
    backgroundColor: Colors.light.surfaceSubtle,
    flex: 1,
  },
  skipBtnText: {
    color: Colors.light.textSecondary,
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
    borderTopColor: '#EEF2F6',
  },
  completedFooterText: {
    fontSize: 12,
    color: Colors.light.textMuted,
  },
});
