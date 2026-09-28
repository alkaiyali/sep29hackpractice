import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMedicineStore } from '../../store/medicineStore';
import { DEFAULT_REFILL_THRESHOLD } from '../../store/medicineStore';
import { getPrecautions } from '../../services/precautions';
import { checkInteractions } from '../../services/interactions';
import { useCareCircleStore } from '../../store/careCircleStore';
import { ThemeColors } from '../../constants/colors';
import { useTheme, useThemedStyles } from '../../theme/ThemeProvider';
import {
  DosageUnit,
  MedicineForm,
  MedicineInstruction,
  ReminderSettings,
} from '../../types/medicine';
import { MedicineFormPicker } from '../../components/medicine/MedicineFormPicker';
import { PhotoPicker } from '../../components/medicine/PhotoPicker';
import { AlarmSettingsView } from '../../components/medicine/AlarmSettingsView';
import { Button } from '../../components/ui/Button';

const DOSAGE_UNITS: DosageUnit[] = [
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

const INSTRUCTIONS: { key: MedicineInstruction; label: string }[] = [
  { key: 'before_meal', label: 'Before Meal' },
  { key: 'with_meal', label: 'With Meal' },
  { key: 'after_meal', label: 'After Meal' },
  { key: 'empty_stomach', label: 'Empty Stomach' },
  { key: 'before_bed', label: 'Before Bed' },
  { key: 'anytime', label: 'Anytime' },
];

const PRESET_TIMES = ['08:00', '12:00', '18:00', '21:00'];

export default function AddMedicineScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const addMedicine = useMedicineStore((s) => s.addMedicine);
  const existingMedicines = useMedicineStore((s) => s.medicines);
  const activeCircle = useCareCircleStore((s) => s.getActiveCircle());
  const scanned = useLocalSearchParams<{
    scannedName?: string;
    scannedDosage?: string;
    scannedUnit?: string;
    scannedInstruction?: string;
    scannedPhoto?: string;
  }>();

  const initialUnit: DosageUnit = DOSAGE_UNITS.includes(scanned.scannedUnit as DosageUnit)
    ? (scanned.scannedUnit as DosageUnit)
    : 'mg';
  const initialInstruction: MedicineInstruction = INSTRUCTIONS.some(
    (i) => i.key === scanned.scannedInstruction
  )
    ? (scanned.scannedInstruction as MedicineInstruction)
    : 'after_meal';

  // Form States
  const [name, setName] = useState(scanned.scannedName || '');
  const [dosage, setDosage] = useState(scanned.scannedDosage || '500');
  const [dosageUnit, setDosageUnit] = useState<DosageUnit>(initialUnit);
  const [form, setForm] = useState<MedicineForm>('pill');
  const [instruction, setInstruction] = useState<MedicineInstruction>(initialInstruction);
  const [notes, setNotes] = useState('');
  const [photoUri, setPhotoUri] = useState<string | undefined>(scanned.scannedPhoto || undefined);
  const [selectedTimes, setSelectedTimes] = useState<string[]>(['08:00']);
  const [customTimeInput, setCustomTimeInput] = useState('');
  const [forMemberId, setForMemberId] = useState<string>('user_self');
  const [saving, setSaving] = useState(false);

  // Supply / refill tracking (optional)
  const [inventoryCount, setInventoryCount] = useState('');
  const [refillThreshold, setRefillThreshold] = useState(String(DEFAULT_REFILL_THRESHOLD));
  const [pharmacyPhone, setPharmacyPhone] = useState('');

  // Reminder / Alarm Settings
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>({
    soundEnabled: true,
    soundName: 'default',
    vibrationEnabled: true,
    vibrationPattern: 'medium',
    snoozeMinutes: 10,
  });

  const namePrecautions = getPrecautions(name);

  const togglePresetTime = (time: string) => {
    if (selectedTimes.includes(time)) {
      if (selectedTimes.length > 1) {
        setSelectedTimes(selectedTimes.filter((t) => t !== time));
      } else {
        Alert.alert('Schedule Required', 'Please keep at least one alarm time.');
      }
    } else {
      setSelectedTimes([...selectedTimes, time].sort());
    }
  };

  const addCustomTime = () => {
    const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!regex.test(customTimeInput.trim())) {
      Alert.alert('Invalid Time', 'Please enter time in HH:mm 24-hour format (e.g. 14:30 or 09:15)');
      return;
    }
    const formatted = customTimeInput.trim().padStart(5, '0');
    if (!selectedTimes.includes(formatted)) {
      setSelectedTimes([...selectedTimes, formatted].sort());
    }
    setCustomTimeInput('');
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Missing Field', 'Please enter the medicine name.');
      return;
    }

    const numDosage = parseFloat(dosage);
    if (isNaN(numDosage) || numDosage <= 0) {
      Alert.alert('Invalid Dosage', 'Please enter a valid numeric dosage.');
      return;
    }

    // Drug-drug interaction screen before saving
    const conflicts = checkInteractions(
      name.trim(),
      existingMedicines.map((m) => m.name)
    );
    if (conflicts.length > 0) {
      const majors = conflicts.filter((c) => c.severity === 'major');
      Alert.alert(
        majors.length > 0 ? '⛔ Major Interaction Risk' : '⚠️ Possible Interaction',
        conflicts.map((c) => `• ${c.medicines.join(' + ')}: ${c.message}`).join('\n\n') +
          '\n\nThis check is educational, not medical advice. Confirm with your doctor or pharmacist.',
        [
          { text: 'Review', style: 'cancel' },
          { text: 'Save Anyway', style: majors.length > 0 ? 'destructive' : 'default', onPress: () => persist() },
        ]
      );
      return;
    }

    await persist();
  };

  const persist = async () => {
    const numDosage = parseFloat(dosage);
    if (isNaN(numDosage) || numDosage <= 0) {
      Alert.alert('Invalid Dosage', 'Please enter a valid numeric dosage.');
      return;
    }

    try {
      setSaving(true);

      const parsedCount = parseInt(inventoryCount.trim(), 10);
      const parsedThreshold = parseInt(refillThreshold.trim(), 10);
      const hasInventory = !isNaN(parsedCount) && parsedCount > 0;

      await addMedicine({
        name: name.trim(),
        dosage: numDosage,
        dosageUnit,
        form,
        instruction,
        optionalNotes: notes.trim() || undefined,
        photoUri,
        scheduleTimes: selectedTimes,
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // Daily
        reminderSettings,
        forMemberId,
        inventoryCount: hasInventory ? parsedCount : undefined,
        refillThreshold: hasInventory
          ? isNaN(parsedThreshold) || parsedThreshold < 0
            ? DEFAULT_REFILL_THRESHOLD
            : parsedThreshold
          : undefined,
        pharmacyPhone: pharmacyPhone.trim() || undefined,
      });

      router.back();
    } catch (err) {
      console.warn('Error saving medicine:', err);
      Alert.alert('Save Error', 'Could not save medicine. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Modal Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn} hitSlop={10}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Medicine</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveHeaderBtn}>
          <Text style={styles.saveHeaderText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Scan shortcut */}
        <TouchableOpacity
          style={styles.scanShortcut}
          onPress={() => router.push('/medicine/scan-label')}
          activeOpacity={0.8}
        >
          <Ionicons name="scan-outline" size={20} color={colors.primary} />
          <View style={styles.scanShortcutTextCol}>
            <Text style={styles.scanShortcutTitle}>Scan prescription label</Text>
            <Text style={styles.scanShortcutSub}>Auto-fill name, strength & directions</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.primary} />
        </TouchableOpacity>

        {/* Recipient Selection */}
        <View style={styles.formGroup}>
          <Text style={styles.groupLabel}>Who is this medicine for?</Text>
          <View style={styles.memberPickerRow}>
            <TouchableOpacity
              style={[styles.memberChip, forMemberId === 'user_self' && styles.memberChipSelected]}
              onPress={() => setForMemberId('user_self')}
            >
              <Ionicons
                name="person"
                size={14}
                color={forMemberId === 'user_self' ? colors.onPrimary : colors.primary}
              />
              <Text
                style={[
                  styles.memberChipText,
                  forMemberId === 'user_self' && styles.memberChipTextSelected,
                ]}
              >
                Myself
              </Text>
            </TouchableOpacity>

            {activeCircle?.members
              .filter((m) => m.id !== 'user_self')
              .map((member) => {
                const isSelected = forMemberId === member.id;
                return (
                  <TouchableOpacity
                    key={member.id}
                    style={[styles.memberChip, isSelected && styles.memberChipSelected]}
                    onPress={() => setForMemberId(member.id)}
                  >
                    <Ionicons
                      name="people"
                      size={14}
                      color={isSelected ? colors.onPrimary : member.avatarColor}
                    />
                    <Text
                      style={[styles.memberChipText, isSelected && styles.memberChipTextSelected]}
                    >
                      {member.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
          </View>
        </View>

        {/* 1. Medicine Name */}
        <View style={styles.formGroup}>
          <Text style={styles.groupLabel}>Medicine Name *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Amoxicillin, Lipitor, Vitamin C"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
          />
          {namePrecautions.length > 0 && (
            <View style={styles.cautionBox}>
              <Text style={styles.cautionTitle}>Cautions for this medicine</Text>
              {namePrecautions.map((p) => (
                <Text key={p.label} style={styles.cautionLine}>
                  {p.icon} <Text style={styles.cautionLabel}>{p.label}:</Text> {p.detail}
                </Text>
              ))}
            </View>
          )}
        </View>

        {/* 2. Dosage & Unit */}
        <View style={styles.formGroup}>
          <Text style={styles.groupLabel}>Dosage & Unit *</Text>
          <View style={styles.dosageRow}>
            <TextInput
              style={[styles.textInput, styles.dosageInput]}
              placeholder="e.g. 500"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={dosage}
              onChangeText={setDosage}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.unitScroll}
            >
              {DOSAGE_UNITS.map((unit) => {
                const isSelected = dosageUnit === unit;
                return (
                  <TouchableOpacity
                    key={unit}
                    style={[styles.unitChip, isSelected && styles.unitChipSelected]}
                    onPress={() => setDosageUnit(unit)}
                  >
                    <Text
                      style={[
                        styles.unitChipText,
                        isSelected && styles.unitChipTextSelected,
                      ]}
                    >
                      {unit}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>

        {/* 3. Medicine Form */}
        <View style={styles.formGroup}>
          <Text style={styles.groupLabel}>Medicine Form</Text>
          <MedicineFormPicker selectedForm={form} onSelectForm={setForm} />
        </View>

        {/* 4. Instructions */}
        <View style={styles.formGroup}>
          <Text style={styles.groupLabel}>Instruction / Intake Guidance</Text>
          <View style={styles.instructionGrid}>
            {INSTRUCTIONS.map((item) => {
              const isSelected = instruction === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.instructionChip, isSelected && styles.instructionChipSelected]}
                  onPress={() => setInstruction(item.key)}
                >
                  <Text
                    style={[
                      styles.instructionChipText,
                      isSelected && styles.instructionChipTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 5. Optional Notes */}
        <View style={styles.formGroup}>
          <Text style={styles.groupLabel}>Optional Notes</Text>
          <TextInput
            style={[styles.textInput, styles.multilineInput]}
            placeholder="e.g. Take with a full glass of water. Avoid milk or dairy products within 2 hours."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        {/* 5b. Supply & Refill Tracker */}
        <View style={styles.formGroup}>
          <Text style={styles.groupLabel}>Supply & Refill Tracker (optional)</Text>
          <View style={styles.supplyRow}>
            <View style={styles.supplyField}>
              <Text style={styles.fieldHint}>Doses left in supply</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 30"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={inventoryCount}
                onChangeText={setInventoryCount}
              />
            </View>
            <View style={styles.supplyField}>
              <Text style={styles.fieldHint}>Alert at or below</Text>
              <TextInput
                style={styles.textInput}
                placeholder="3"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={refillThreshold}
                onChangeText={setRefillThreshold}
              />
            </View>
          </View>
          <TextInput
            style={styles.textInput}
            placeholder="Pharmacy phone (enables one-tap refill call)"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
            value={pharmacyPhone}
            onChangeText={setPharmacyPhone}
          />
          <Text style={styles.fieldHint}>
            Every dose you mark as taken decrements the count, and Meddy alerts you when it is time
            to request a refill.
          </Text>
        </View>

        {/* 6. Add Photo (Camera or Gallery) */}
        <View style={styles.formGroup}>
          <Text style={styles.groupLabel}>Medicine Photo (Bottle or Pill)</Text>
          <PhotoPicker photoUri={photoUri} onPhotoSelected={setPhotoUri} />
        </View>

        {/* 7. Schedule for Alarm */}
        <View style={styles.formGroup}>
          <Text style={styles.groupLabel}>Schedule for Alarm (Daily Times)</Text>
          <View style={styles.timesContainer}>
            <View style={styles.presetTimesRow}>
              {PRESET_TIMES.map((time) => {
                const isSelected = selectedTimes.includes(time);
                return (
                  <TouchableOpacity
                    key={time}
                    style={[styles.timeChip, isSelected && styles.timeChipSelected]}
                    onPress={() => togglePresetTime(time)}
                  >
                    <Ionicons
                      name="time-outline"
                      size={14}
                      color={isSelected ? colors.onPrimary : colors.primary}
                    />
                    <Text
                      style={[
                        styles.timeChipText,
                        isSelected && styles.timeChipTextSelected,
                      ]}
                    >
                      {time}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Custom time input */}
            <View style={styles.customTimeRow}>
              <TextInput
                style={[styles.textInput, styles.customTimeInput]}
                placeholder="Custom time (e.g. 14:30)"
                placeholderTextColor={colors.textMuted}
                value={customTimeInput}
                onChangeText={setCustomTimeInput}
              />
              <TouchableOpacity style={styles.addTimeBtn} onPress={addCustomTime}>
                <Ionicons name="add" size={20} color={colors.onPrimary} />
                <Text style={styles.addTimeBtnText}>Add</Text>
              </TouchableOpacity>
            </View>

            {/* Display active alarm times */}
            <View style={styles.activeTimesRow}>
              <Text style={styles.activeTimesLabel}>Active Alarms:</Text>
              {selectedTimes.map((t) => (
                <View key={t} style={styles.activeTimeBadge}>
                  <Text style={styles.activeTimeBadgeText}>{t}</Text>
                  <TouchableOpacity
                    onPress={() => setSelectedTimes(selectedTimes.filter((item) => item !== t))}
                    hitSlop={6}
                  >
                    <Ionicons name="close-circle" size={14} color={colors.primaryDark} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* 8. Reminder Settings (Sound, Vibration, Snooze) */}
        <View style={styles.formGroup}>
          <Text style={styles.groupLabel}>Reminder & Alarm Customization</Text>
          <AlarmSettingsView settings={reminderSettings} onChange={setReminderSettings} />
        </View>

        {/* Submit Button */}
        <View style={styles.submitContainer}>
          <Button
            title={saving ? 'Scheduling Alarms...' : 'Save & Set Reminders'}
            onPress={handleSave}
            loading={saving}
            size="lg"
            variant="primary"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
  },
  closeBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  saveHeaderBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.primarySoft,
  },
  saveHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
    gap: 20,
  },
  scanShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.primarySoft,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  scanShortcutTextCol: {
    flex: 1,
  },
  scanShortcutTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  scanShortcutSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  formGroup: {
    gap: 8,
  },
  groupLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  supplyRow: {
    flexDirection: 'row',
    gap: 10,
  },
  supplyField: {
    flex: 1,
    gap: 4,
  },
  fieldHint: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  cautionBox: {
    backgroundColor: colors.warningLight,
    borderRadius: 14,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  cautionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.warning,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  cautionLine: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  cautionLabel: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  memberPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  memberChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  memberChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  memberChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  memberChipTextSelected: {
    color: colors.onPrimary,
  },
  dosageRow: {
    gap: 10,
  },
  dosageInput: {
    width: '100%',
  },
  unitScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  unitChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  unitChipSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  unitChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  unitChipTextSelected: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  instructionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  instructionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  instructionChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  instructionChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  instructionChipTextSelected: {
    color: colors.onPrimary,
  },
  timesContainer: {
    gap: 10,
  },
  presetTimesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  timeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  timeChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timeChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  timeChipTextSelected: {
    color: colors.onPrimary,
  },
  customTimeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  customTimeInput: {
    flex: 1,
  },
  addTimeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    borderRadius: 14,
    gap: 4,
  },
  addTimeBtnText: {
    color: colors.onPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
  activeTimesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  activeTimesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeTimeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  submitContainer: {
    marginTop: 10,
  },
});
