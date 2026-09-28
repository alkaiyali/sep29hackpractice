import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../../store/userStore';
import { Colors } from '../../constants/colors';
import { Header } from '../../components/ui/Header';
import { notificationService } from '../../services/notifications';
import { audioHapticsService } from '../../services/audioHaptics';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { profile, updateProfile, toggleNotifications, resetAllData } = useUserStore();

  const [testingAlarm, setTestingAlarm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(profile.name);
  const [editEmergency, setEditEmergency] = useState(profile.emergencyContactPhone || '');
  const [editBloodType, setEditBloodType] = useState(profile.bloodType || '');

  const handleTestAlarm = async () => {
    try {
      setTestingAlarm(true);
      await audioHapticsService.triggerVibration('heavy');
      await audioHapticsService.playAlarmSound('medical_pulse', true);
      await notificationService.triggerTestAlarm(
        '🔔 Meddy Alarm Test',
        'This is how your medicine reminder will sound and vibrate!'
      );
      Alert.alert(
        'Test Alarm Triggered',
        'Check your notification banner and feel the haptic feedback.'
      );
    } catch (err) {
      console.warn('Error testing alarm:', err);
    } finally {
      setTestingAlarm(false);
    }
  };

  const handleSaveProfile = async () => {
    await updateProfile({
      name: editName.trim(),
      emergencyContactPhone: editEmergency.trim(),
      bloodType: editBloodType.trim(),
    });
    setShowEditModal(false);
    Alert.alert('Saved', 'Profile details updated.');
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset All App Data',
      'This will clear all medicine records, dose logs, and circle memberships. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: async () => {
            await resetAllData();
            Alert.alert('Data Reset', 'All records have been reset to initial factory settings.');
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <Header title="Profile & Settings" subtitle="Personal health info & notification controls" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>
              {profile.name ? profile.name.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{profile.name || 'Add your name'}</Text>
            <Text style={styles.userRole}>Primary Account Holder</Text>
            <View style={styles.bloodTypeTag}>
              <Ionicons name="water" size={13} color={Colors.light.danger} />
              <Text style={styles.bloodTypeText}>Blood Type: {profile.bloodType || 'Not set'}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => {
              setEditName(profile.name);
              setEditEmergency(profile.emergencyContactPhone || '');
              setEditBloodType(profile.bloodType || '');
              setShowEditModal(true);
            }}
          >
            <Ionicons name="create-outline" size={18} color={Colors.light.primary} />
          </TouchableOpacity>
        </View>

        {/* Emergency Contact */}
        <View style={styles.sectionCard}>
          <View style={styles.cardTitleRow}>
            <View style={[styles.cardIconBg, { backgroundColor: Colors.light.dangerLight }]}>
              <Ionicons name="call-outline" size={18} color={Colors.light.danger} />
            </View>
            <Text style={styles.cardTitle}>Emergency Contact</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{profile.emergencyContactName || 'Not set'}</Text>
            <Text style={styles.infoValue}>{profile.emergencyContactPhone || 'Not set'}</Text>
          </View>
        </View>

        {/* Known Allergies */}
        <View style={styles.sectionCard}>
          <View style={styles.cardTitleRow}>
            <View style={[styles.cardIconBg, { backgroundColor: Colors.light.warningLight }]}>
              <Ionicons name="alert-circle-outline" size={18} color={Colors.light.warning} />
            </View>
            <Text style={styles.cardTitle}>Known Drug Allergies</Text>
          </View>
          {profile.allergies.length === 0 ? (
            <Text style={styles.noAllergiesText}>No known drug allergies recorded</Text>
          ) : (
            <View style={styles.allergyChipsRow}>
              {profile.allergies.map((allergy) => (
                <View key={allergy} style={styles.allergyChip}>
                  <Ionicons name="warning-outline" size={12} color={Colors.light.warning} />
                  <Text style={styles.allergyChipText}>{allergy}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Alarm & Notification Diagnostics */}
        <View style={styles.sectionCard}>
          <View style={styles.cardTitleRow}>
            <View style={styles.cardIconBg}>
              <Ionicons name="notifications" size={18} color={Colors.light.primary} />
            </View>
            <Text style={styles.cardTitle}>Alarm & Notifications</Text>
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleTitle}>Allow Scheduled Alarms</Text>
              <Text style={styles.toggleSub}>Receive alarms on lock screen when doses are due</Text>
            </View>
            <Switch
              value={profile.notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: Colors.light.surfaceBorder, true: Colors.light.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <TouchableOpacity
            style={styles.testAlarmBtn}
            onPress={handleTestAlarm}
            disabled={testingAlarm}
            activeOpacity={0.8}
          >
            <Ionicons name="volume-high-outline" size={18} color="#FFFFFF" />
            <Text style={styles.testAlarmBtnText}>
              {testingAlarm ? 'Firing Alarm...' : 'Test Alarm Sound & Vibration'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Reset / Danger Zone */}
        <View style={styles.dangerZone}>
          <TouchableOpacity
            style={styles.resetBtn}
            onPress={handleResetData}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh-outline" size={18} color={Colors.light.danger} />
            <Text style={styles.resetBtnText}>Reset App Data to Defaults</Text>
          </TouchableOpacity>
          <Text style={styles.versionText}>Meddy Health Companion • v1.0.0 (Expo SDK 54)</Text>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Edit Profile Information</Text>
            
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.modalInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Full Name"
              placeholderTextColor={Colors.light.textMuted}
            />

            <Text style={styles.inputLabel}>Emergency Contact Phone</Text>
            <TextInput
              style={styles.modalInput}
              value={editEmergency}
              onChangeText={setEditEmergency}
              placeholder="Emergency Phone Number"
              placeholderTextColor={Colors.light.textMuted}
              keyboardType="phone-pad"
            />

            <Text style={styles.inputLabel}>Blood Type</Text>
            <TextInput
              style={styles.modalInput}
              value={editBloodType}
              onChangeText={setEditBloodType}
              placeholder="e.g. O+, A-, B+"
              placeholderTextColor={Colors.light.textMuted}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleSaveProfile}
              >
                <Text style={styles.modalConfirmText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 110,
    gap: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.light.surfaceBorder,
    shadowColor: Colors.light.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    gap: 14,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.textPrimary,
  },
  userRole: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 1,
  },
  bloodTypeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  bloodTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.danger,
  },
  editBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: Colors.light.primarySoft,
  },
  sectionCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.surfaceBorder,
    gap: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardIconBg: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.light.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.textPrimary,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.light.surfaceSubtle,
    padding: 12,
    borderRadius: 12,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textPrimary,
  },
  infoValue: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontWeight: '600',
  },
  allergyChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  noAllergiesText: {
    fontSize: 13,
    color: Colors.light.textMuted,
    fontStyle: 'italic',
  },
  allergyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.light.warningLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  allergyChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.warning,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  toggleInfo: {
    flex: 1,
    marginRight: 12,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textPrimary,
  },
  toggleSub: {
    fontSize: 12,
    color: Colors.light.textMuted,
    marginTop: 2,
  },
  testAlarmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.light.primaryDark,
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 4,
  },
  testAlarmBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  dangerZone: {
    marginTop: 10,
    alignItems: 'center',
    gap: 12,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.light.dangerLight,
  },
  resetBtnText: {
    color: Colors.light.danger,
    fontWeight: '600',
    fontSize: 13,
  },
  versionText: {
    fontSize: 12,
    color: Colors.light.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    gap: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.light.textPrimary,
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  modalInput: {
    backgroundColor: Colors.light.surfaceSubtle,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.light.textPrimary,
    borderWidth: 1,
    borderColor: Colors.light.surfaceBorder,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  modalCancelText: {
    color: Colors.light.textSecondary,
    fontWeight: '600',
  },
  modalConfirmBtn: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
