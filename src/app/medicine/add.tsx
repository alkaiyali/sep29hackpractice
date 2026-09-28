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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMedicineStore } from '../../store/medicineStore';
import { useCareCircleStore } from '../../store/careCircleStore';
import { Colors } from '../../constants/colors';
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
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const addMedicine = useMedicineStore((s) => s.addMedicine);
  const activeCircle = useCareCircleStore((s) => s.getActiveCircle());

  // Form States
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('500');
  const [dosageUnit, setDosageUnit] = useState<DosageUnit>('mg');
  const [form, setForm] = useState<MedicineForm>('pill');
  const [instruction, setInstruction] = useState<MedicineInstruction>('after_meal');
  const [notes, setNotes] = useState('');
  const [photoUri, setPhotoUri] = useState<string | undefined>(undefined);
  const [selectedTimes, setSelectedTimes] = useState<string[]>(['08:00']);
  const [customTimeInput, setCustomTimeInput] = useState('');
  const [forMemberId, setForMemberId] = useState<string>('user_self');
  const [saving, setSaving] = useState(false);

  // Reminder / Alarm Settings
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>({
    soundEnabled: true,
    soundName: 'default',
    vibrationEnabled: true,
    vibrationPattern: 'medium',
    snoozeMinutes: 10,
  });

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

    try {
      setSaving(true);
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
          <Ionicons name="close" size={24} color={Colors.light.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Medicine</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveHeaderBtn}>
          <Text style={styles.saveHeaderText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
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
                color={forMemberId === 'user_self' ? '#FFFFFF' : Colors.light.primary}
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
                      color={isSelected ? '#FFFFFF' : member.avatarColor}
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
            placeholderTextColor={Colors.light.textMuted}
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* 2. Dosage & Unit */}
        <View style={styles.formGroup}>
          <Text style={styles.groupLabel}>Dosage & Unit *</Text>
          <View style={styles.dosageRow}>
            <TextInput
              style={[styles.textInput, styles.dosageInput]}
              placeholder="e.g. 500"
              placeholderTextColor={Colors.light.textMuted}
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
            placeholderTextColor={Colors.light.textMuted}
            multiline
            numberOfLines={3}
            value={notes}
            onChangeText={setNotes}
          />
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
                      color={isSelected ? '#FFFFFF' : Colors.light.primary}
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
                placeholderTextColor={Colors.light.textMuted}
                value={customTimeInput}
                onChangeText={setCustomTimeInput}
              />
              <TouchableOpacity style={styles.addTimeBtn} onPress={addCustomTime}>
                <Ionicons name="add" size={20} color="#FFFFFF" />
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
                    <Ionicons name="close-circle" size={14} color={Colors.light.primaryDark} />
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.surfaceBorder,
    backgroundColor: '#FFFFFF',
  },
  closeBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.light.textPrimary,
  },
  saveHeaderBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.light.primarySoft,
  },
  saveHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.primaryDark,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
    gap: 20,
  },
  formGroup: {
    gap: 8,
  },
  groupLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.textPrimary,
  },
  textInput: {
    backgroundColor: Colors.light.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.light.textPrimary,
    borderWidth: 1,
    borderColor: Colors.light.surfaceBorder,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
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
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.surfaceBorder,
  },
  memberChipSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  memberChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  memberChipTextSelected: {
    color: '#FFFFFF',
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
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.surfaceBorder,
  },
  unitChipSelected: {
    backgroundColor: Colors.light.primarySoft,
    borderColor: Colors.light.primary,
  },
  unitChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  unitChipTextSelected: {
    color: Colors.light.primaryDark,
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
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.surfaceBorder,
  },
  instructionChipSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  instructionChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  instructionChipTextSelected: {
    color: '#FFFFFF',
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
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.surfaceBorder,
  },
  timeChipSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  timeChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  timeChipTextSelected: {
    color: '#FFFFFF',
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
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 16,
    borderRadius: 14,
    gap: 4,
  },
  addTimeBtnText: {
    color: '#FFFFFF',
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
    color: Colors.light.textSecondary,
  },
  activeTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.light.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeTimeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.primaryDark,
  },
  submitContainer: {
    marginTop: 10,
  },
});
