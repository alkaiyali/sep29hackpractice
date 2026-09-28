import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useCareCircleStore } from '../../store/careCircleStore';
import { useUserStore } from '../../store/userStore';
import { Colors } from '../../constants/colors';

export default function ScanCareCircleScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torch, setTorch] = useState(false);
  const [manualCode, setManualCode] = useState('');

  const joinCircleFromQR = useCareCircleStore((s) => s.joinCircleFromQR);
  const userName = useUserStore((s) => s.profile.name);

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    const result = await joinCircleFromQR(data, userName);
    if (result.success) {
      Alert.alert('Joined!', result.message, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } else {
      Alert.alert('Scan Issue', result.message, [
        { text: 'Try Again', onPress: () => setScanned(false) },
        { text: 'Cancel', onPress: () => router.back(), style: 'cancel' },
      ]);
    }
  };

  const handleManualJoin = async () => {
    if (!manualCode.trim()) {
      Alert.alert('Code Required', 'Please enter an invite code or scan a QR.');
      return;
    }

    // Wrap in standard QR payload structure
    const payload = JSON.stringify({
      version: '1.0',
      circleId: `circle_code_${manualCode.trim()}`,
      circleName: `Care Circle (${manualCode.trim()})`,
      inviterName: 'Circle Admin',
      inviteCode: manualCode.trim(),
      timestamp: Date.now(),
    });

    const result = await joinCircleFromQR(payload, userName);
    if (result.success) {
      Alert.alert('Joined!', result.message, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } else {
      Alert.alert('Code Issue', result.message);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Care Circle QR</Text>
        <TouchableOpacity
          onPress={() => setTorch(!torch)}
          style={styles.torchBtn}
          hitSlop={10}
        >
          <Ionicons
            name={torch ? 'flash' : 'flash-off-outline'}
            size={22}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>

      {/* Camera Viewfinder */}
      <View style={styles.cameraContainer}>
        {Platform.OS === 'web' || !permission?.granted ? (
          <View style={styles.permissionBox}>
            <Ionicons name="camera-outline" size={48} color={Colors.light.textMuted} />
            <Text style={styles.permTitle}>Camera Access</Text>
            <Text style={styles.permSub}>
              To scan another caregiver's QR code on device, allow camera access. You can also enter an invite code manually below.
            </Text>
            {Platform.OS !== 'web' && (
              <TouchableOpacity style={styles.grantBtn} onPress={requestPermission}>
                <Text style={styles.grantBtnText}>Grant Camera Access</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              enableTorch={torch}
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
              onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            />
            {/* Overlay Viewfinder Target */}
            <View style={styles.overlay}>
              <View style={styles.targetFrame}>
                <View style={[styles.corner, styles.tl]} />
                <View style={[styles.corner, styles.tr]} />
                <View style={[styles.corner, styles.bl]} />
                <View style={[styles.corner, styles.br]} />
              </View>
              <Text style={styles.targetInstruction}>
                Align the Care Circle QR code within the frame
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Manual Code Fallback */}
      <View style={[styles.fallbackContainer, { paddingBottom: insets.bottom + 20 }]}>
        <Text style={styles.fallbackTitle}>Or Enter Invite Code Manually</Text>
        <View style={styles.manualInputRow}>
          <TextInput
            style={styles.manualInput}
            placeholder="e.g. MEDDY-4821-A"
            placeholderTextColor="#8E8E96"
            autoCapitalize="characters"
            value={manualCode}
            onChangeText={setManualCode}
          />
          <TouchableOpacity style={styles.joinCodeBtn} onPress={handleManualJoin}>
            <Text style={styles.joinCodeBtnText}>Join</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  closeBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  torchBtn: {
    padding: 4,
  },
  cameraContainer: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  permissionBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    gap: 12,
  },
  permTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  permSub: {
    fontSize: 13,
    color: '#8E8E96',
    textAlign: 'center',
    lineHeight: 18,
  },
  grantBtn: {
    backgroundColor: '#2DD4BF',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 8,
  },
  grantBtnText: {
    color: '#03211D',
    fontWeight: '800',
    fontSize: 14,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetFrame: {
    width: 240,
    height: 240,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: '#2DD4BF',
  },
  tl: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },
  tr: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },
  bl: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  br: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },
  targetInstruction: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 24,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  fallbackContainer: {
    backgroundColor: '#0E0E11',
    paddingHorizontal: 20,
    paddingTop: 18,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: 10,
  },
  fallbackTitle: {
    color: '#EDEDEF',
    fontSize: 13,
    fontWeight: '600',
  },
  manualInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  manualInput: {
    flex: 1,
    backgroundColor: '#17171C',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: '#26262C',
  },
  joinCodeBtn: {
    backgroundColor: '#2DD4BF',
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinCodeBtnText: {
    color: '#03211D',
    fontWeight: '800',
    fontSize: 14,
  },
});
