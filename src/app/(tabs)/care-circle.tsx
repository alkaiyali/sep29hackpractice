import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useCareCircleStore } from '../../store/careCircleStore';
import { useMedicineStore } from '../../store/medicineStore';
import { useUserStore } from '../../store/userStore';
import { Colors } from '../../constants/colors';
import { Header } from '../../components/ui/Header';
import { MemberRelation } from '../../types/careCircle';

export default function CareCircleScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const user = useUserStore((s) => s.profile);
  const {
    circles,
    createCircle,
    addMemberToCircle,
    getActiveCircle,
    getGenerateQRPayload,
  } = useCareCircleStore();

  const medicines = useMedicineStore((s) => s.medicines);

  const activeCircle = getActiveCircle();
  const qrPayload = activeCircle ? getGenerateQRPayload(activeCircle.id) : '';

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCircleName, setNewCircleName] = useState('');

  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [memberRelation, setMemberRelation] = useState<MemberRelation>('Parent');

  const handleCreateCircle = async () => {
    if (!newCircleName.trim()) {
      Alert.alert('Required', 'Please enter a name for your Care Circle.');
      return;
    }

    await createCircle(newCircleName.trim(), user.name);
    setNewCircleName('');
    setShowCreateModal(false);
    Alert.alert('Success', 'Care Circle created! Share your QR code for others to join.');
  };

  const handleAddMember = async () => {
    if (!memberName.trim()) {
      Alert.alert('Required', 'Please enter the member name.');
      return;
    }

    if (activeCircle) {
      await addMemberToCircle(activeCircle.id, memberName.trim(), memberRelation);
      setMemberName('');
      setShowAddMemberModal(false);
      Alert.alert('Member Added', `${memberName} is now in your Care Circle.`);
    }
  };

  // Filter medicines that are assigned to Care Circle members (excluding "user_self")
  const circleMedicines = medicines.filter(
    (m) => m.forMemberId !== 'user_self' && m.forMemberId !== user.id
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <Header
        title="Care Circle"
        subtitle="Coordinate care & reminders with loved ones"
        rightAction={
          <TouchableOpacity
            style={styles.scanBtn}
            onPress={() => router.push('/care-circle/scan')}
            activeOpacity={0.7}
          >
            <Ionicons name="qr-code-outline" size={18} color="#FFFFFF" />
            <Text style={styles.scanBtnText}>Scan QR</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Active Circle Card with QR Code */}
        {activeCircle ? (
          <View style={styles.qrCard}>
            <View style={styles.qrHeader}>
              <View style={styles.qrTitleCol}>
                <Text style={styles.qrCircleName}>{activeCircle.name}</Text>
                <Text style={styles.qrSub}>Invite Code: {activeCircle.inviteCode}</Text>
              </View>
              <TouchableOpacity
                style={styles.newCircleBtn}
                onPress={() => setShowCreateModal(true)}
              >
                <Ionicons name="add" size={16} color={Colors.light.primary} />
                <Text style={styles.newCircleBtnText}>New Circle</Text>
              </TouchableOpacity>
            </View>

            {/* QR Code Container */}
            <View style={styles.qrCodeWrapper}>
              {qrPayload ? (
                <View style={styles.qrCodeBorder}>
                  <QRCode
                    value={qrPayload}
                    size={160}
                    color={Colors.light.primaryDark}
                    backgroundColor="#FFFFFF"
                  />
                </View>
              ) : null}
              <Text style={styles.qrInstructions}>
                Have family members or caregivers scan this QR code to join your Care Circle instantly.
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.emptyCircleOnboarding}>
            <Ionicons name="people-circle-outline" size={60} color={Colors.light.primary} />
            <Text style={styles.emptyOnboardingTitle}>Start Your Care Circle</Text>
            <Text style={styles.emptyOnboardingSub}>
              Connect with family, children, or elderly parents to coordinate and monitor medications collaboratively.
            </Text>
            <View style={styles.emptyOnboardingActions}>
              <TouchableOpacity
                style={styles.createFirstCircleBtn}
                onPress={() => setShowCreateModal(true)}
              >
                <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
                <Text style={styles.createFirstCircleBtnText}>Create Care Circle</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.scanFirstCircleBtn}
                onPress={() => router.push('/care-circle/scan')}
              >
                <Ionicons name="qr-code-outline" size={18} color={Colors.light.primary} />
                <Text style={styles.scanFirstCircleBtnText}>Join via QR</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Members Roster Section */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>Circle Members</Text>
            <Text style={styles.sectionSubtitle}>
              {activeCircle ? `${activeCircle.members.length} members connected` : '0 members'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addMemberBtn}
            onPress={() => setShowAddMemberModal(true)}
          >
            <Ionicons name="person-add-outline" size={16} color={Colors.light.primary} />
            <Text style={styles.addMemberBtnText}>Add Member</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.membersList}>
          {activeCircle?.members.map((member) => (
            <View key={member.id} style={styles.memberCard}>
              <View style={[styles.avatar, { backgroundColor: member.avatarColor }]}>
                <Text style={styles.avatarText}>{member.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.memberInfo}>
                <View style={styles.memberNameRow}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  {member.isOwner && <View style={styles.ownerBadge}><Text style={styles.ownerBadgeText}>Owner</Text></View>}
                </View>
                <Text style={styles.memberRelation}>
                  {member.relation} • {member.id === 'user_self' ? 'You' : 'Connected'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.addMedToMemberBtn}
                onPress={() => router.push('/medicine/add')}
              >
                <Ionicons name="medkit-outline" size={16} color={Colors.light.primary} />
                <Text style={styles.addMedToMemberBtnText}>+ Med</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Loved Ones' Medicine Section */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>Loved Ones' Medicines</Text>
            <Text style={styles.sectionSubtitle}>Medications tracked for circle members</Text>
          </View>
          <TouchableOpacity
            style={styles.addMemberBtn}
            onPress={() => router.push('/medicine/add')}
          >
            <Ionicons name="add" size={16} color={Colors.light.primary} />
            <Text style={styles.addMemberBtnText}>Schedule Med</Text>
          </TouchableOpacity>
        </View>

        {circleMedicines.length === 0 ? (
          <View style={styles.emptyCircleMeds}>
            <Ionicons name="heart-circle-outline" size={48} color={Colors.light.textMuted} />
            <Text style={styles.emptyCircleMedsTitle}>No Loved Ones' Meds Scheduled</Text>
            <Text style={styles.emptyCircleMedsSub}>
              Assign and monitor prescriptions for your loved ones with automatic reminder alerts.
            </Text>
            <TouchableOpacity
              style={styles.addMedBtn}
              onPress={() => router.push('/medicine/add')}
            >
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text style={styles.addMedBtnText}>Add Medicine for Loved One</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.circleMedsList}>
            {circleMedicines.map((med) => {
              const member = activeCircle?.members.find((m) => m.id === med.forMemberId);
              return (
                <View key={med.id} style={styles.circleMedCard}>
                  <View style={styles.circleMedHeader}>
                    <View style={styles.circleMedLeft}>
                      <View style={styles.pillIconBg}>
                        <Ionicons name="medkit" size={18} color={Colors.light.primary} />
                      </View>
                      <View>
                        <Text style={styles.circleMedName}>{med.name}</Text>
                        <Text style={styles.circleMedDosage}>
                          {med.dosage} {med.dosageUnit} • {med.instruction.replace(/_/g, ' ')}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.forMemberBadge}>
                      <Text style={styles.forMemberBadgeText}>
                        For: {member ? member.name : 'Loved One'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.circleMedFooter}>
                    <Text style={styles.circleMedTimes}>⏰ Times: {med.scheduleTimes.join(', ')}</Text>
                    <Text style={styles.circleMedSound}>🔔 Sound: {med.reminderSettings.soundName}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Modal: Create Circle */}
      <Modal visible={showCreateModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Create a New Care Circle</Text>
            <Text style={styles.modalSub}>Give your circle a name (e.g. "Family Care Group")</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Circle Name"
              placeholderTextColor={Colors.light.textMuted}
              value={newCircleName}
              onChangeText={setNewCircleName}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleCreateCircle}
              >
                <Text style={styles.modalConfirmText}>Create & Generate QR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Add Member */}
      <Modal visible={showAddMemberModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Add Member to Circle</Text>
            <Text style={styles.modalSub}>Add someone you care for or monitor</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Member Name"
              placeholderTextColor={Colors.light.textMuted}
              value={memberName}
              onChangeText={setMemberName}
            />

            <Text style={styles.relationLabel}>Relationship</Text>
            <View style={styles.relationRow}>
              {(['Parent', 'Child', 'Spouse', 'Grandparent', 'Other'] as MemberRelation[]).map(
                (rel) => (
                  <TouchableOpacity
                    key={rel}
                    style={[
                      styles.relationChip,
                      memberRelation === rel && styles.relationChipActive,
                    ]}
                    onPress={() => setMemberRelation(rel)}
                  >
                    <Text
                      style={[
                        styles.relationChipText,
                        memberRelation === rel && styles.relationChipTextActive,
                      ]}
                    >
                      {rel}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowAddMemberModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleAddMember}
              >
                <Text style={styles.modalConfirmText}>Add Member</Text>
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
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  scanBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 110,
    gap: 22,
  },
  qrCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.light.surfaceBorder,
    shadowColor: Colors.light.textPrimary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  qrHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  qrTitleCol: {
    flex: 1,
  },
  qrCircleName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.light.textPrimary,
  },
  qrSub: {
    fontSize: 13,
    color: Colors.light.primaryDark,
    fontWeight: '600',
    marginTop: 2,
  },
  newCircleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  newCircleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.primaryDark,
  },
  qrCodeWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCodeBorder: {
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.surfaceBorder,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  qrInstructions: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  addMemberBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  addMemberBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  membersList: {
    gap: 10,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.surfaceBorder,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 18,
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.textPrimary,
  },
  ownerBadge: {
    backgroundColor: Colors.light.primarySoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ownerBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.primaryDark,
  },
  memberRelation: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  addMedToMemberBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.light.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addMedToMemberBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.primaryDark,
  },
  emptyCircleMeds: {
    backgroundColor: Colors.light.surface,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.surfaceBorder,
    gap: 8,
  },
  emptyCircleMedsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.textPrimary,
  },
  emptyCircleMedsSub: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  addMedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 8,
  },
  addMedBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  circleMedsList: {
    gap: 10,
  },
  circleMedCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.surfaceBorder,
    gap: 8,
  },
  circleMedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  circleMedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  pillIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.light.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleMedName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.textPrimary,
  },
  circleMedDosage: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textTransform: 'capitalize',
  },
  forMemberBadge: {
    backgroundColor: Colors.light.accentLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  forMemberBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.accent,
  },
  circleMedFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.light.surfaceBorder,
  },
  circleMedTimes: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.primaryDark,
  },
  circleMedSound: {
    fontSize: 11,
    color: Colors.light.textSecondary,
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
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.light.textPrimary,
  },
  modalSub: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  modalInput: {
    backgroundColor: Colors.light.surfaceSubtle,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.light.textPrimary,
    borderWidth: 1,
    borderColor: Colors.light.surfaceBorder,
  },
  relationLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.textPrimary,
    marginTop: 4,
  },
  relationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  relationChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.light.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.light.surfaceBorder,
  },
  relationChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  relationChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  relationChipTextActive: {
    color: '#FFFFFF',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
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
  emptyCircleOnboarding: {
    backgroundColor: Colors.light.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.surfaceBorder,
    gap: 10,
    shadowColor: Colors.light.textPrimary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  emptyOnboardingTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.light.textPrimary,
  },
  emptyOnboardingSub: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  emptyOnboardingActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    width: '100%',
  },
  createFirstCircleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.light.primary,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createFirstCircleBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  scanFirstCircleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.light.primarySoft,
    paddingVertical: 12,
    borderRadius: 12,
  },
  scanFirstCircleBtnText: {
    color: Colors.light.primaryDark,
    fontSize: 13,
    fontWeight: '700',
  },
});
