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
import { useActivityStore, REACTION_EMOJIS } from '../../store/activityStore';
import { useUserStore } from '../../store/userStore';
import { ThemeColors } from '../../constants/colors';
import { useTheme, useThemedStyles } from '../../theme/ThemeProvider';
import { Header } from '../../components/ui/Header';
import { CircleDoseEvent, MemberRelation } from '../../types/careCircle';
import { MedicationLog } from '../../types/log';

export default function CareCircleScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const user = useUserStore((s) => s.profile);
  const {
    circles,
    createCircle,
    addMemberToCircle,
    getActiveCircle,
    getGenerateQRPayload,
    syncStatus,
    myUid,
    circleFeed,
    sendRemoteCheer,
    initSync,
  } = useCareCircleStore();

  const medicines = useMedicineStore((s) => s.medicines);
  const logs = useMedicineStore((s) => s.logs);
  const reactions = useActivityStore((s) => s.reactions);
  const sendCheer = useActivityStore((s) => s.sendCheer);

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

  const medicineNameById = new Map(medicines.map((m) => [m.id, m.name]));
  const memberNameById = new Map(
    (activeCircle?.members || []).map((m) => [m.id, m.id === 'user_self' ? 'You' : m.name])
  );

  const activityMeta = (status: string): { icon: keyof typeof Ionicons.glyphMap; text: string } => {
    switch (status) {
      case 'taken':
        return { icon: 'checkmark-circle', text: 'took' };
      case 'skipped':
        return { icon: 'close-circle-outline', text: 'skipped' };
      case 'snoozed':
        return { icon: 'time-outline', text: 'snoozed' };
      default:
        return { icon: 'ellipse-outline', text: status };
    }
  };

  // Live sync indicator
  const syncColor =
    syncStatus === 'online'
      ? colors.success
      : syncStatus === 'connecting'
        ? colors.warning
        : syncStatus === 'error'
          ? colors.danger
          : colors.textMuted;
  const syncLabel =
    syncStatus === 'online'
      ? 'Live sync on · updates across devices'
      : syncStatus === 'connecting'
        ? 'Connecting to live sync…'
        : syncStatus === 'error'
          ? 'Sync issue · tap to retry'
          : 'Local only · add Firebase keys to sync across devices';

  // ── Activity feed: local dose logs merged with live cloud events ──────────
  type FeedItem =
    | { kind: 'local'; key: string; log: MedicationLog; remote?: CircleDoseEvent }
    | { kind: 'remote'; key: string; event: CircleDoseEvent };

  const normalizeMemberId = (id: string) => (id === 'user_self' && myUid ? myUid : id);
  const eventKey = (medicineId: string, memberId: string, dateStr: string, timeStr: string) =>
    `${medicineId}|${memberId}|${dateStr}|${timeStr}`;
  const itemTime = (item: FeedItem) =>
    item.kind === 'local' ? item.log.actionTime : item.event.actionTime;

  const remoteByKey = new Map(
    circleFeed.map((e) => [eventKey(e.medicineId, e.memberId, e.dateStr, e.timeStr), e])
  );

  const localItems: FeedItem[] = logs.slice(0, 40).map((log) => {
    const dateStr = log.scheduledTime.slice(0, 10);
    const timeStr = log.scheduledTime.slice(11, 16);
    const key = eventKey(log.medicineId, normalizeMemberId(log.memberId), dateStr, timeStr);
    return { kind: 'local', key, log, remote: remoteByKey.get(key) };
  });

  const localKeys = new Set(localItems.map((i) => i.key));
  const remoteOnlyItems: FeedItem[] = circleFeed
    .filter((e) => !localKeys.has(eventKey(e.medicineId, e.memberId, e.dateStr, e.timeStr)))
    .map((e) => ({ kind: 'remote', key: e.id, event: e }));

  const feedItems = [...localItems, ...remoteOnlyItems]
    .sort((a, b) => itemTime(b).localeCompare(itemTime(a)))
    .slice(0, 15);

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
            <Ionicons name="qr-code-outline" size={18} color={colors.onPrimary} />
            <Text style={styles.scanBtnText}>Scan QR</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Live sync status */}
        <TouchableOpacity
          style={styles.syncPill}
          activeOpacity={syncStatus === 'error' ? 0.7 : 1}
          onPress={() => {
            if (syncStatus === 'error') void initSync();
          }}
        >
          <View style={[styles.syncDot, { backgroundColor: syncColor }]} />
          <Text style={styles.syncText}>{syncLabel}</Text>
          {syncStatus === 'error' && <Ionicons name="refresh" size={14} color={colors.danger} />}
        </TouchableOpacity>

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
                <Ionicons name="add" size={16} color={colors.primary} />
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
                    color={colors.primaryDark}
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
            <Ionicons name="people-circle-outline" size={60} color={colors.primary} />
            <Text style={styles.emptyOnboardingTitle}>Start Your Care Circle</Text>
            <Text style={styles.emptyOnboardingSub}>
              Connect with family, children, or elderly parents to coordinate and monitor medications collaboratively.
            </Text>
            <View style={styles.emptyOnboardingActions}>
              <TouchableOpacity
                style={styles.createFirstCircleBtn}
                onPress={() => setShowCreateModal(true)}
              >
                <Ionicons name="add-circle-outline" size={18} color={colors.onPrimary} />
                <Text style={styles.createFirstCircleBtnText}>Create Care Circle</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.scanFirstCircleBtn}
                onPress={() => router.push('/care-circle/scan')}
              >
                <Ionicons name="qr-code-outline" size={18} color={colors.primary} />
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
            <Ionicons name="person-add-outline" size={16} color={colors.primary} />
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
                <Ionicons name="medkit-outline" size={16} color={colors.primary} />
                <Text style={styles.addMedToMemberBtnText}>+ Med</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Circle Activity Feed */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>Circle Activity</Text>
            <Text style={styles.sectionSubtitle}>Recent dose wins across your circle</Text>
          </View>
        </View>

        {feedItems.length === 0 ? (
          <View style={styles.emptyActivity}>
            <Ionicons name="chatbubbles-outline" size={36} color={colors.textMuted} />
            <Text style={styles.emptyActivityText}>
              No activity yet — log a dose and cheer each other on.
            </Text>
          </View>
        ) : (
          <View style={styles.activityList}>
            {feedItems.map((item) => {
              const isLocal = item.kind === 'local';
              const meta = activityMeta(isLocal ? item.log.status : item.event.status);
              const memberLabel = isLocal
                ? memberNameById.get(item.log.memberId) || 'Someone'
                : item.event.memberName;
              const medLabel = isLocal
                ? medicineNameById.get(item.log.medicineId) || 'a medicine'
                : item.event.medicineName;
              const actionTime = isLocal ? item.log.actionTime : item.event.actionTime;
              const remoteEventId = isLocal ? item.remote?.id : item.event.id;
              const localLogId = isLocal ? item.log.id : undefined;
              const remoteCheers = isLocal ? item.remote?.cheers : item.event.cheers;
              const myCheer = myUid ? remoteCheers?.[myUid] : undefined;

              const cheerCounts: Record<string, number> = {};
              if (localLogId) {
                Object.entries(reactions[localLogId] || {}).forEach(([emoji, count]) => {
                  cheerCounts[emoji] = (cheerCounts[emoji] || 0) + count;
                });
              }
              Object.values(remoteCheers || {}).forEach((emoji) => {
                cheerCounts[emoji] = (cheerCounts[emoji] || 0) + 1;
              });

              // Mirrored events cheer through Firestore; local-only ones stay on device.
              const handleCheer = (emoji: string) => {
                if (remoteEventId) return sendRemoteCheer(remoteEventId, emoji);
                if (localLogId) return sendCheer(localLogId, emoji);
              };

              return (
                <View key={item.key} style={styles.activityCard}>
                  <Ionicons name={meta.icon} size={20} color={colors.primary} />
                  <View style={styles.activityBody}>
                    <Text style={styles.activityText} numberOfLines={2}>
                      <Text style={styles.activityName}>{memberLabel}</Text> {meta.text} {medLabel}
                    </Text>
                    <View style={styles.activityMetaRow}>
                      <Text style={styles.activityTime}>
                        {new Date(actionTime).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </Text>
                      {!isLocal && (
                        <View style={styles.liveTag}>
                          <Ionicons name="cloud-done-outline" size={11} color={colors.success} />
                          <Text style={styles.liveTagText}>LIVE</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.cheerRow}>
                      {REACTION_EMOJIS.map((emoji) => (
                        <TouchableOpacity
                          key={emoji}
                          style={[styles.cheerBtn, myCheer === emoji && styles.cheerBtnActive]}
                          onPress={() => handleCheer(emoji)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.cheerEmoji}>{emoji}</Text>
                          {(cheerCounts[emoji] || 0) > 0 && (
                            <Text style={styles.cheerCount}>{cheerCounts[emoji]}</Text>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

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
            <Ionicons name="add" size={16} color={colors.primary} />
            <Text style={styles.addMemberBtnText}>Schedule Med</Text>
          </TouchableOpacity>
        </View>

        {circleMedicines.length === 0 ? (
          <View style={styles.emptyCircleMeds}>
            <Ionicons name="heart-circle-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyCircleMedsTitle}>No Loved Ones' Meds Scheduled</Text>
            <Text style={styles.emptyCircleMedsSub}>
              Assign and monitor prescriptions for your loved ones with automatic reminder alerts.
            </Text>
            <TouchableOpacity
              style={styles.addMedBtn}
              onPress={() => router.push('/medicine/add')}
            >
              <Ionicons name="add" size={16} color={colors.onPrimary} />
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
                        <Ionicons name="medkit" size={18} color={colors.primary} />
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
              placeholderTextColor={colors.textMuted}
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
              placeholderTextColor={colors.textMuted}
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

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  scanBtnText: {
    color: colors.onPrimary,
    fontWeight: '700',
    fontSize: 13,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 110,
    gap: 22,
  },
  syncPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  syncDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  syncText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  qrCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    shadowColor: colors.cardShadow,
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
    color: colors.textPrimary,
  },
  qrSub: {
    fontSize: 13,
    color: colors.primaryDark,
    fontWeight: '600',
    marginTop: 2,
  },
  newCircleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  newCircleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
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
    borderColor: colors.surfaceBorder,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  qrInstructions: {
    fontSize: 12,
    color: colors.textSecondary,
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
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
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
    color: colors.primary,
  },
  membersList: {
    gap: 10,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
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
    color: colors.textPrimary,
  },
  ownerBadge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ownerBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  memberRelation: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  addMedToMemberBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addMedToMemberBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  emptyActivity: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    gap: 8,
  },
  emptyActivityText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  activityList: {
    gap: 10,
  },
  activityCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    gap: 12,
  },
  activityBody: {
    flex: 1,
    gap: 3,
  },
  activityText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  activityName: {
    fontWeight: '800',
    color: colors.textPrimary,
  },
  activityTime: {
    fontSize: 11,
    color: colors.textMuted,
  },
  activityMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  liveTagText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: colors.success,
  },
  cheerRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  cheerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  cheerBtnActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  cheerEmoji: {
    fontSize: 14,
  },
  cheerCount: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  emptyCircleMeds: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    gap: 8,
  },
  emptyCircleMedsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptyCircleMedsSub: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  addMedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 8,
  },
  addMedBtnText: {
    color: colors.onPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  circleMedsList: {
    gap: 10,
  },
  circleMedCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
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
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleMedName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  circleMedDosage: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  forMemberBadge: {
    backgroundColor: colors.accentLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  forMemberBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
  },
  circleMedFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
  },
  circleMedTimes: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  circleMedSound: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalBox: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modalSub: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  modalInput: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  relationLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
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
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  relationChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  relationChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  relationChipTextActive: {
    color: colors.onPrimary,
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
    color: colors.textSecondary,
    fontWeight: '600',
  },
  modalConfirmBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  modalConfirmText: {
    color: colors.onPrimary,
    fontWeight: '700',
  },
  emptyCircleOnboarding: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    gap: 10,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  emptyOnboardingTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  emptyOnboardingSub: {
    fontSize: 13,
    color: colors.textSecondary,
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
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createFirstCircleBtnText: {
    color: colors.onPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  scanFirstCircleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primarySoft,
    paddingVertical: 12,
    borderRadius: 12,
  },
  scanFirstCircleBtnText: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: '700',
  },
});
