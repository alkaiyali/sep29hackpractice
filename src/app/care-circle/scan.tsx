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
              To scan another caregiver's QR code on device, allow camera access. Alternatively, you can enter an invite code or test with a simulated QR scan.
            </Text>
            <View style={styles.permButtonsRow}>
              {Platform.OS !== 'web' && (
                <TouchableOpacity style={styles.grantBtn} onPress={requestPermission}>
                  <Text style={styles.grantBtnText}>Grant Camera Access</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.simulateBtn}
                onPress={() => {
                  const mockPayload = JSON.stringify({
                    version: '1.0',
                    circleId: `circle_shared_${Date.now()}`,
                    circleName: "Grandma's Care Circle",
                    inviterName: 'Sarah Rivera',
                    inviteCode: 'MEDDY-GMA-4102',
                    timestamp: Date.now(),
                  });
                  handleBarcodeScanned({ data: mockPayload });
                }}
              >
                <Ionicons name="flask-outline" size={16} color="#FFFFFF" />
                <Text style={styles.simulateBtnText}>Simulate QR Scan (Test)</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            enableTorch={torch}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
            onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          >
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
              <TouchableOpacity
                style={styles.testOverlayBtn}
                onPress={() => {
                  const mockPayload = JSON.stringify({
                    version: '1.0',
                    circleId: `circle_shared_${Date.now()}`,
                    circleName: "Family Health Circle",
                    inviterName: 'Caregiver',
                    inviteCode: 'MEDDY-TEST-9921',
                    timestamp: Date.now(),
                  });
                  handleBarcodeScanned({ data: mockPayload });
                }}
              >
                <Ionicons name="flask-outline" size={14} color="#FFFFFF" />
                <Text style={styles.testOverlayBtnText}>Test QR Join</Text>
              </TouchableOpacity>
            </View>
          </CameraView>
        )}
      </View>

      {/* Manual Code Fallback */}
      <View style={[styles.fallbackContainer, { paddingBottom: insets.bottom + 20 }]}>
        <Text style={styles.fallbackTitle}>Or Enter Invite Code Manually</Text>
        <View style={styles.manualInputRow}>
          <TextInput
            style={styles.manualInput}
            placeholder="e.g. MEDDY-RIV-8942"
            placeholderTextColor="#94A3B8"
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
    backgroundColor: '#0B1120',
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
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
  },
  grantBtn: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
  },
  grantBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  permButtonsRow: {
    flexDirection: 'column',
    gap: 10,
    marginTop: 8,
    width: '100%',
    alignItems: 'center',
  },
  simulateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0284C7',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    width: '100%',
  },
  simulateBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  testOverlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(2, 132, 199, 0.85)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
  },
  testOverlayBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
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
    borderColor: '#14B8A6',
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
    backgroundColor: '#111827',
    paddingHorizontal: 20,
    paddingTop: 18,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: 10,
  },
  fallbackTitle: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
  },
  manualInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  manualInput: {
    flex: 1,
    backgroundColor: '#1F2937',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: '#374151',
  },
  joinCodeBtn: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinCodeBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
