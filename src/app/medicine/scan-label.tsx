import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors } from '../../constants/colors';
import { useTheme, useThemedStyles } from '../../theme/ThemeProvider';
import { cameraService } from '../../services/camera';
import { extractLabelText, parseLabel, ParsedLabel } from '../../services/labelOcr';
import { DosageUnit, MedicineInstruction } from '../../types/medicine';

const UNITS: DosageUnit[] = ['mg', 'mcg', 'ml', 'tablets', 'capsules', 'drops', 'puffs', 'units', 'IU'];
const INSTRUCTIONS: { key: MedicineInstruction; label: string }[] = [
  { key: 'before_meal', label: 'Before Meal' },
  { key: 'with_meal', label: 'With Meal' },
  { key: 'after_meal', label: 'After Meal' },
  { key: 'empty_stomach', label: 'Empty Stomach' },
  { key: 'before_bed', label: 'Before Bed' },
  { key: 'anytime', label: 'Anytime' },
];

type Phase = 'capture' | 'extracting' | 'confirm';

export default function ScanLabelScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>('capture');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedLabel | null>(null);

  // Confirm-form state
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [unit, setUnit] = useState<DosageUnit>('mg');
  const [instruction, setInstruction] = useState<MedicineInstruction>('anytime');

  const handleCapture = async (fromGallery: boolean) => {
    const uri = fromGallery
      ? await cameraService.pickPhotoFromGallery()
      : await cameraService.takePhotoWithCamera();
    if (!uri) return;
    setPhotoUri(uri);
    setPhase('extracting');
    try {
      const lines = await extractLabelText(uri);
      const result = parseLabel(lines);
      setParsed(result);
      setName(result.name);
      setDosage(result.dosage);
      setUnit(result.dosageUnit);
      setInstruction(result.instruction);
      setPhase('confirm');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not read the label.';
      Alert.alert('Scan Issue', `${message}\n\nYou can enter the details manually instead.`, [
        { text: 'Retake', style: 'cancel', onPress: () => setPhase('capture') },
        { text: 'Enter Manually', onPress: () => router.back() },
      ]);
      setPhase('capture');
    }
  };

  const handleUseDetails = () => {
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please confirm the medicine name before continuing.');
      return;
    }
    router.replace({
      pathname: '/medicine/add',
      params: {
        scannedName: name.trim(),
        scannedDosage: dosage.trim(),
        scannedUnit: unit,
        scannedInstruction: instruction,
        scannedPhoto: photoUri || '',
      },
    });
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn} hitSlop={10}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Label</Text>
        <View style={styles.stepPill}>
          <Text style={styles.stepText}>
            {phase === 'capture' ? '1 · Capture' : phase === 'extracting' ? '2 · Reading' : '3 · Confirm'}
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.helper}>
          Point at the prescription bottle and capture the label. Meddy reads the name, strength
          and directions — you confirm before anything is saved. Needs internet; manual entry
          always works as fallback.
        </Text>

        {phase === 'capture' && (
          <View style={styles.captureRow}>
            <TouchableOpacity style={styles.captureBtn} onPress={() => handleCapture(false)} activeOpacity={0.8}>
              <Ionicons name="camera-outline" size={26} color={colors.onPrimary} />
              <Text style={styles.captureBtnText}>Photograph Label</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.galleryBtn} onPress={() => handleCapture(true)} activeOpacity={0.8}>
              <Ionicons name="images-outline" size={22} color={colors.primary} />
              <Text style={styles.galleryBtnText}>Use Gallery</Text>
            </TouchableOpacity>
          </View>
        )}

        {phase === 'extracting' && (
          <View style={styles.statusCard}>
            {photoUri && <Image source={{ uri: photoUri }} style={styles.preview} />}
            <ActivityIndicator size="large" color={colors.primary} style={styles.spinner} />
            <Text style={styles.statusText}>Reading label…</Text>
          </View>
        )}

        {phase === 'confirm' && (
          <View style={styles.confirmCol}>
            {photoUri && <Image source={{ uri: photoUri }} style={styles.preview} />}

            <Text style={styles.groupLabel}>Medicine Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Confirm medicine name"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.groupLabel}>Strength</Text>
            <View style={styles.doseRow}>
              <TextInput
                style={[styles.input, styles.doseInput]}
                value={dosage}
                onChangeText={setDosage}
                placeholder="e.g. 500"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.unitRow}>
                {UNITS.map((u) => (
                  <TouchableOpacity
                    key={u}
                    style={[styles.unitChip, unit === u && styles.unitChipActive]}
                    onPress={() => setUnit(u)}
                  >
                    <Text style={[styles.unitText, unit === u && styles.unitTextActive]}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <Text style={styles.groupLabel}>Directions</Text>
            <View style={styles.instructionGrid}>
              {INSTRUCTIONS.map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.instrChip, instruction === item.key && styles.instrChipActive]}
                  onPress={() => setInstruction(item.key)}
                >
                  <Text style={[styles.instrText, instruction === item.key && styles.instrTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {parsed && parsed.rawLines.length > 0 && (
              <View style={styles.rawBox}>
                <Text style={styles.rawTitle}>Detected text</Text>
                {parsed.rawLines.slice(0, 8).map((line, i) => (
                  <Text key={i} style={styles.rawLine}>
                    {line}
                  </Text>
                ))}
              </View>
            )}

            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={styles.retakeBtn}
                onPress={() => setPhase('capture')}
                activeOpacity={0.7}
              >
                <Text style={styles.retakeText}>Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.useBtn} onPress={handleUseDetails} activeOpacity={0.8}>
                <Text style={styles.useBtnText}>Use These Details</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
      fontWeight: '800',
      color: colors.textPrimary,
    },
    stepPill: {
      backgroundColor: colors.primarySoft,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
    },
    stepText: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.primaryDark,
    },
    content: {
      padding: 20,
      paddingBottom: 60,
      gap: 16,
    },
    helper: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 19,
    },
    captureRow: {
      gap: 12,
    },
    captureBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: 18,
    },
    captureBtnText: {
      color: colors.onPrimary,
      fontWeight: '800',
      fontSize: 16,
    },
    galleryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.surface,
      paddingVertical: 14,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    galleryBtnText: {
      color: colors.primary,
      fontWeight: '700',
      fontSize: 14,
    },
    statusCard: {
      backgroundColor: colors.surface,
      borderRadius: 22,
      padding: 20,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      gap: 12,
    },
    preview: {
      width: '100%',
      height: 220,
      borderRadius: 16,
      backgroundColor: colors.surfaceSubtle,
    },
    spinner: {
      marginTop: 8,
    },
    statusText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    confirmCol: {
      gap: 10,
    },
    groupLabel: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.textPrimary,
      marginTop: 6,
    },
    input: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.textPrimary,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    doseRow: {
      gap: 8,
    },
    doseInput: {
      width: '100%',
    },
    unitRow: {
      gap: 8,
      paddingVertical: 4,
    },
    unitChip: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 10,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    unitChipActive: {
      backgroundColor: colors.primarySoft,
      borderColor: colors.primary,
    },
    unitText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    unitTextActive: {
      color: colors.primaryDark,
      fontWeight: '800',
    },
    instructionGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    instrChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    instrChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    instrText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    instrTextActive: {
      color: colors.onPrimary,
    },
    rawBox: {
      backgroundColor: colors.surfaceSubtle,
      borderRadius: 14,
      padding: 12,
      gap: 3,
      marginTop: 6,
    },
    rawTitle: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginBottom: 2,
    },
    rawLine: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    confirmActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
    },
    retakeBtn: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      backgroundColor: colors.surface,
    },
    retakeText: {
      color: colors.textSecondary,
      fontWeight: '700',
      fontSize: 14,
    },
    useBtn: {
      flex: 2,
      alignItems: 'center',
      paddingVertical: 14,
      borderRadius: 14,
      backgroundColor: colors.primary,
    },
    useBtnText: {
      color: colors.onPrimary,
      fontWeight: '800',
      fontSize: 14,
    },
  });
