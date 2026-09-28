import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ReminderSettings, AlertSound, VibrationPattern } from '../../types/medicine';
import { ThemeColors } from '../../constants/colors';
import { useTheme, useThemedStyles } from '../../theme/ThemeProvider';
import { audioHapticsService } from '../../services/audioHaptics';
import { useSoundStore, customSoundRef } from '../../store/soundStore';

interface AlarmSettingsViewProps {
  settings: ReminderSettings;
  onChange: (updated: ReminderSettings) => void;
}

const SOUNDS: { key: AlertSound; label: string }[] = [
  { key: 'default', label: 'Classic Chime' },
  { key: 'gentle', label: 'Gentle Bell' },
  { key: 'bell', label: 'Hospital Bell' },
  { key: 'medical_pulse', label: 'Medical Pulse' },
  { key: 'radar', label: 'Alert Radar' },
];

const VIBRATIONS: { key: VibrationPattern; label: string }[] = [
  { key: 'light', label: 'Light' },
  { key: 'medium', label: 'Medium' },
  { key: 'heavy', label: 'Heavy Alert' },
];

const SNOOZE_OPTIONS = [5, 10, 15, 30];

export const AlarmSettingsView: React.FC<AlarmSettingsViewProps> = ({
  settings,
  onChange,
}) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const toggleSound = (val: boolean) => {
    onChange({ ...settings, soundEnabled: val });
  };

  const customSounds = useSoundStore((s) => s.customSounds);
  const importing = useSoundStore((s) => s.importing);
  const importSound = useSoundStore((s) => s.importSound);
  const previewStoreSound = useSoundStore((s) => s.previewSound);
  const deleteSound = useSoundStore((s) => s.deleteSound);

  const setSound = (sound: string) => {
    onChange({ ...settings, soundName: sound });
    previewStoreSound(sound);
  };

  const handleImport = async () => {
    try {
      const sound = await importSound();
      if (sound) {
        onChange({ ...settings, soundName: customSoundRef(sound.id) });
      }
    } catch (err) {
      Alert.alert(
        'Import Failed',
        err instanceof Error ? err.message : 'Could not import that audio file.'
      );
    }
  };

  const handleDeleteCustom = (id: string, name: string) => {
    Alert.alert('Delete Sound?', `"${name}" will be removed. Medicines using it fall back to the default chime.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (settings.soundName === customSoundRef(id)) {
            onChange({ ...settings, soundName: 'default' });
          }
          await deleteSound(id);
        },
      },
    ]);
  };

  const toggleVibration = (val: boolean) => {
    onChange({ ...settings, vibrationEnabled: val });
    if (val) {
      audioHapticsService.triggerVibration(settings.vibrationPattern);
    }
  };

  const setVibration = (pattern: VibrationPattern) => {
    onChange({ ...settings, vibrationPattern: pattern });
    audioHapticsService.triggerVibration(pattern);
  };

  const setSnooze = (minutes: number) => {
    onChange({ ...settings, snoozeMinutes: minutes });
  };

  return (
    <View style={styles.container}>
      {/* 1. Sound Section */}
      <View style={styles.sectionBlock}>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <View style={styles.iconCircle}>
              <Ionicons
                name={settings.soundEnabled ? 'volume-high' : 'volume-mute'}
                size={18}
                color={colors.primary}
              />
            </View>
            <View>
              <Text style={styles.settingTitle}>Sound Alert</Text>
              <Text style={styles.settingSub}>Play audio chime when alarm triggers</Text>
            </View>
          </View>
          <Switch
            value={settings.soundEnabled}
            onValueChange={toggleSound}
            trackColor={{ false: colors.surfaceBorder, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        {settings.soundEnabled && (
          <View style={styles.chipsRow}>
            {SOUNDS.map((s) => {
              const isSelected = settings.soundName === s.key;
              return (
                <TouchableOpacity
                  key={s.key}
                  style={[styles.chip, isSelected && styles.selectedChip]}
                  onPress={() => setSound(s.key)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, isSelected && styles.selectedChipText]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
            {customSounds.map((s) => {
              const ref = customSoundRef(s.id);
              const isSelected = settings.soundName === ref;
              return (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.chip, styles.customChip, isSelected && styles.selectedChip]}
                  onPress={() => setSound(ref)}
                  onLongPress={() => handleDeleteCustom(s.id, s.name)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="musical-note"
                    size={12}
                    color={isSelected ? colors.onPrimary : colors.accent}
                  />
                  <Text style={[styles.chipText, isSelected && styles.selectedChipText]} numberOfLines={1}>
                    {s.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={[styles.chip, styles.importChip]}
              onPress={handleImport}
              disabled={importing}
              activeOpacity={0.7}
            >
              {importing ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <Ionicons name="add" size={14} color={colors.primary} />
                  <Text style={styles.importChipText}>Import audio</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
        {settings.soundEnabled && customSounds.length > 0 && (
          <Text style={styles.customHint}>Tap a custom sound to preview · long-press to delete</Text>
        )}
      </View>

      {/* 2. Vibration Section */}
      <View style={styles.sectionBlock}>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <View style={styles.iconCircle}>
              <Ionicons
                name={settings.vibrationEnabled ? 'phone-portrait' : 'phone-portrait-outline'}
                size={18}
                color={colors.accent}
              />
            </View>
            <View>
              <Text style={styles.settingTitle}>Vibration</Text>
              <Text style={styles.settingSub}>Tactile feedback for reminders</Text>
            </View>
          </View>
          <Switch
            value={settings.vibrationEnabled}
            onValueChange={toggleVibration}
            trackColor={{ false: colors.surfaceBorder, true: colors.accent }}
            thumbColor="#FFFFFF"
          />
        </View>

        {settings.vibrationEnabled && (
          <View style={styles.chipsRow}>
            {VIBRATIONS.map((v) => {
              const isSelected = settings.vibrationPattern === v.key;
              return (
                <TouchableOpacity
                  key={v.key}
                  style={[styles.chip, isSelected && styles.selectedAccentChip]}
                  onPress={() => setVibration(v.key)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, isSelected && styles.selectedChipText]}>
                    {v.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* 3. Snooze Interval */}
      <View style={styles.sectionBlock}>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <View style={styles.iconCircle}>
              <Ionicons name="timer-outline" size={18} color={colors.warning} />
            </View>
            <View>
              <Text style={styles.settingTitle}>Snooze Duration</Text>
              <Text style={styles.settingSub}>Minutes before repeating if snoozed</Text>
            </View>
          </View>
        </View>

        <View style={styles.chipsRow}>
          {SNOOZE_OPTIONS.map((min) => {
            const isSelected = settings.snoozeMinutes === min;
            return (
              <TouchableOpacity
                key={min}
                style={[styles.chip, isSelected && styles.selectedWarningChip]}
                onPress={() => setSnooze(min)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, isSelected && styles.selectedWarningText]}>
                  {min} Mins
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  container: {
    gap: 12,
  },
  sectionBlock: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  settingSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  selectedChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  selectedAccentChip: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  selectedWarningChip: {
    backgroundColor: colors.warningLight,
    borderColor: colors.warning,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  selectedChipText: {
    color: colors.onPrimary,
    fontWeight: '700',
  },
  customChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    maxWidth: 150,
  },
  importChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderStyle: 'dashed',
  },
  importChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  customHint: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 8,
  },
  selectedWarningText: {
    color: colors.warning,
    fontWeight: '700',
  },
});
