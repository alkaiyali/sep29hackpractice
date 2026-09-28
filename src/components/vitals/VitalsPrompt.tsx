import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors } from '../../constants/colors';
import { useTheme, useThemedStyles } from '../../theme/ThemeProvider';
import { isValidVitals } from '../../types/vitals';
import { useVitalsStore } from '../../store/vitalsStore';

interface VitalsPromptProps {
  visible: boolean;
  medicineName?: string;
  memberId?: string;
  medicineId?: string;
  onClose: () => void;
}

export const VitalsPrompt: React.FC<VitalsPromptProps> = ({
  visible,
  medicineName,
  memberId = 'user_self',
  medicineId,
  onClose,
}) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const addVital = useVitalsStore((s) => s.addVital);

  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [glucose, setGlucose] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setSystolic('');
    setDiastolic('');
    setGlucose('');
    setSaving(false);
  };

  const handleSave = async () => {
    const parse = (v: string): number | undefined => {
      const n = parseFloat(v.trim());
      return v.trim() === '' || isNaN(n) ? undefined : n;
    };
    const input = { systolic: parse(systolic), diastolic: parse(diastolic), glucose: parse(glucose) };
    const error = isValidVitals(input);
    if (error) {
      Alert.alert('Check readings', error);
      return;
    }
    setSaving(true);
    await addVital(input, memberId, medicineId);
    reset();
    onClose();
  };

  const handleSkip = () => {
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleSkip}>
      <View style={styles.overlay}>
        <View style={styles.box}>
          <View style={styles.titleRow}>
            <View style={styles.iconBg}>
              <Ionicons name="heart-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.titleCol}>
              <Text style={styles.title}>Log vitals? (optional)</Text>
              <Text style={styles.subtitle}>
                {medicineName
                  ? `Taken with ${medicineName} — add today's numbers.`
                  : 'Add today’s blood pressure or glucose.'}
              </Text>
            </View>
          </View>

          <View style={styles.bpRow}>
            <View style={styles.bpField}>
              <Text style={styles.fieldLabel}>Systolic</Text>
              <TextInput
                style={styles.input}
                placeholder="120"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={systolic}
                onChangeText={setSystolic}
              />
            </View>
            <Text style={styles.slash}>/</Text>
            <View style={styles.bpField}>
              <Text style={styles.fieldLabel}>Diastolic</Text>
              <TextInput
                style={styles.input}
                placeholder="80"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={diastolic}
                onChangeText={setDiastolic}
              />
            </View>
            <Text style={styles.unit}>mmHg</Text>
          </View>

          <View style={styles.glucoseRow}>
            <View style={styles.glucoseField}>
              <Text style={styles.fieldLabel}>Blood glucose (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="100"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={glucose}
                onChangeText={setGlucose}
              />
            </View>
            <Text style={styles.unit}>mg/dL</Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.skipBtn} onPress={handleSkip} activeOpacity={0.7}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}
            >
              <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save vitals'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'flex-end',
    },
    box: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 26,
      borderTopRightRadius: 26,
      padding: 20,
      paddingBottom: 28,
      gap: 14,
      borderTopWidth: 1,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    iconBg: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    titleCol: {
      flex: 1,
    },
    title: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    subtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    bpRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 8,
    },
    bpField: {
      flex: 1,
      gap: 4,
    },
    glucoseRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 8,
    },
    glucoseField: {
      flex: 1,
      gap: 4,
    },
    fieldLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    input: {
      backgroundColor: colors.surfaceSubtle,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    slash: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.textMuted,
      paddingBottom: 10,
    },
    unit: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textMuted,
      paddingBottom: 14,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: 12,
      marginTop: 4,
    },
    skipBtn: {
      paddingVertical: 10,
      paddingHorizontal: 16,
    },
    skipText: {
      color: colors.textSecondary,
      fontWeight: '600',
      fontSize: 14,
    },
    saveBtn: {
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 22,
      borderRadius: 14,
    },
    saveText: {
      color: colors.onPrimary,
      fontWeight: '800',
      fontSize: 14,
    },
  });
