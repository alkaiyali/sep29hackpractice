import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMedicineStore, DEFAULT_REFILL_THRESHOLD } from '../../store/medicineStore';
import { useCareCircleStore } from '../../store/careCircleStore';
import { ThemeColors } from '../../constants/colors';
import { useTheme, useThemedStyles } from '../../theme/ThemeProvider';
import { Medicine } from '../../types/medicine';
import { Header } from '../../components/ui/Header';

export default function MedicinesScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { medicines, deleteMedicine } = useMedicineStore();
  const activeCircle = useCareCircleStore((s) => s.getActiveCircle());

  const [filterMemberId, setFilterMemberId] = useState<string>('all');

  const getFormIcon = (form: string): keyof typeof Ionicons.glyphMap => {
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

  const getMemberLabel = (memberId: string) => {
    if (memberId === 'user_self') return 'Myself';
    const found = activeCircle?.members.find((m) => m.id === memberId);
    return found ? found.name : 'Care Circle Member';
  };

  const filteredMedicines = medicines.filter((m) => {
    if (filterMemberId === 'all') return true;
    return m.forMemberId === filterMemberId;
  });

  const handleDelete = (med: Medicine) => {
    Alert.alert(
      'Delete Medicine',
      `Are you sure you want to stop tracking ${med.name}? All scheduled alarms will be removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMedicine(med.id),
        },
      ]
    );
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <Header
        title="Medication Cabinet"
        subtitle={`${medicines.length} total active medicines`}
        rightAction={
          <TouchableOpacity
            style={styles.addHeaderBtn}
            onPress={() => router.push('/medicine/add')}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addHeaderBtnText}>Add</Text>
          </TouchableOpacity>
        }
      />

      {/* Member Filter Chips */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterChip, filterMemberId === 'all' && styles.filterChipActive]}
            onPress={() => setFilterMemberId('all')}
          >
            <Text style={[styles.filterChipText, filterMemberId === 'all' && styles.filterChipTextActive]}>
              All ({medicines.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filterMemberId === 'user_self' && styles.filterChipActive]}
            onPress={() => setFilterMemberId('user_self')}
          >
            <Text style={[styles.filterChipText, filterMemberId === 'user_self' && styles.filterChipTextActive]}>
              Myself
            </Text>
          </TouchableOpacity>

          {activeCircle?.members
            .filter((m) => m.id !== 'user_self')
            .map((m) => (
              <TouchableOpacity
                key={m.id}
                style={[styles.filterChip, filterMemberId === m.id && styles.filterChipActive]}
                onPress={() => setFilterMemberId(m.id)}
              >
                <Text style={[styles.filterChipText, filterMemberId === m.id && styles.filterChipTextActive]}>
                  {m.name}
                </Text>
              </TouchableOpacity>
            ))}
        </ScrollView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
        {filteredMedicines.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="medkit-outline" size={56} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No Medicines in this Category</Text>
            <Text style={styles.emptySub}>Tap "+ Add" to create a new medication schedule.</Text>
          </View>
        ) : (
          filteredMedicines.map((med) => (
            <View key={med.id} style={styles.medicineCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  {med.photoUri ? (
                    <Image source={{ uri: med.photoUri }} style={styles.cardPhoto} />
                  ) : (
                    <View style={styles.cardIconBg}>
                      <Ionicons name={getFormIcon(med.form)} size={24} color={colors.primary} />
                    </View>
                  )}
                  <View style={styles.titleCol}>
                    <Text style={styles.medicineName}>{med.name}</Text>
                    <Text style={styles.medicineSub}>
                      {med.dosage} {med.dosageUnit} • {med.form}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => handleDelete(med)}
                  style={styles.deleteBtn}
                  hitSlop={8}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                </TouchableOpacity>
              </View>

              {/* Instructions and Notes */}
              <View style={styles.metaRow}>
                <View style={styles.tag}>
                  <Ionicons name="information-circle-outline" size={13} color={colors.primaryDark} />
                  <Text style={styles.tagText}>{med.instruction.replace(/_/g, ' ')}</Text>
                </View>
                <View style={styles.memberTag}>
                  <Ionicons name="person-outline" size={12} color={colors.accent} />
                  <Text style={styles.memberTagText}>{getMemberLabel(med.forMemberId)}</Text>
                </View>
                {med.inventoryCount != null &&
                  (() => {
                    const isLow =
                      med.inventoryCount <= (med.refillThreshold ?? DEFAULT_REFILL_THRESHOLD);
                    return (
                      <View style={[styles.stockTag, isLow && styles.stockTagLow]}>
                        <Ionicons
                          name="cube-outline"
                          size={12}
                          color={isLow ? colors.danger : colors.primaryDark}
                        />
                        <Text style={[styles.stockTagText, isLow && styles.stockTagTextLow]}>
                          {med.inventoryCount} left{isLow ? ' · Refill soon' : ''}
                        </Text>
                      </View>
                    );
                  })()}
              </View>

              {med.optionalNotes ? (
                <Text style={styles.notesText} numberOfLines={2}>
                  📝 {med.optionalNotes}
                </Text>
              ) : null}

              {/* Schedules & Alarms Info */}
              <View style={styles.alarmInfoBox}>
                <View style={styles.alarmTimesRow}>
                  <Ionicons name="alarm-outline" size={15} color={colors.primary} />
                  <Text style={styles.alarmTimesLabel}>Alarm Times:</Text>
                  <Text style={styles.alarmTimesValues}>{med.scheduleTimes.join(', ')}</Text>
                </View>

                <View style={styles.alarmDetailsRow}>
                  <Text style={styles.alarmDetailItem}>
                    🔔 Sound: {med.reminderSettings.soundEnabled ? med.reminderSettings.soundName : 'Off'}
                  </Text>
                  <Text style={styles.alarmDetailItem}>
                    📳 Vibration: {med.reminderSettings.vibrationEnabled ? med.reminderSettings.vibrationPattern : 'Off'}
                  </Text>
                  <Text style={styles.alarmDetailItem}>
                    ⏰ Snooze: {med.reminderSettings.snoozeMinutes}m
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 80 }]}
        activeOpacity={0.85}
        onPress={() => router.push('/medicine/add')}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  addHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
  },
  addHeaderBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  filterBar: {
    paddingVertical: 10,
    backgroundColor: colors.background,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 110,
    gap: 14,
  },
  medicineCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  cardIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardPhoto: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.surfaceSubtle,
  },
  titleCol: {
    flex: 1,
  },
  medicineName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  medicineSub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  deleteBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: colors.dangerLight,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryDark,
    textTransform: 'capitalize',
  },
  memberTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentLight,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  memberTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
  },
  stockTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  stockTagLow: {
    backgroundColor: colors.dangerLight,
  },
  stockTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  stockTagTextLow: {
    color: colors.danger,
  },
  notesText: {
    fontSize: 12,
    color: colors.textSecondary,
    backgroundColor: colors.surfaceSubtle,
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  alarmInfoBox: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 12,
    padding: 10,
    gap: 6,
  },
  alarmTimesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  alarmTimesLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  alarmTimesValues: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  alarmDetailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
  },
  alarmDetailItem: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptySub: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
});
