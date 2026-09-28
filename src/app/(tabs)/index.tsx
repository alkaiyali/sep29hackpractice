import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMedicineStore } from '../../store/medicineStore';
import { useCareCircleStore } from '../../store/careCircleStore';
import { useUserStore } from '../../store/userStore';
import { ThemeColors } from '../../constants/colors';
import { useTheme, useThemedStyles } from '../../theme/ThemeProvider';
import { TodayDoseCard } from '../../components/dashboard/TodayDoseCard';
import { AdherenceCard } from '../../components/dashboard/AdherenceCard';
import { CareCircleSummary } from '../../components/dashboard/CareCircleSummary';

export default function DashboardScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const user = useUserStore((s) => s.profile);
  const { getTodayDoses, getTodayAdherence, getStreakDays, logDose, loadData, getLowSupplyMedicines } =
    useMedicineStore();
  const activeCircle = useCareCircleStore((s) => s.getActiveCircle());

  const todayDoses = getTodayDoses();
  const adherence = getTodayAdherence();
  const streak = getStreakDays();
  const lowSupply = getLowSupplyMedicines();

  const handleRefill = () => {
    if (lowSupply.length === 0) return;
    const withPhone = lowSupply.find((m) => m.pharmacyPhone);
    if (withPhone?.pharmacyPhone) {
      Alert.alert(
        'Request Refill',
        `Call the pharmacy for ${withPhone.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: `Call ${withPhone.pharmacyPhone}`,
            onPress: () => Linking.openURL(`tel:${withPhone.pharmacyPhone}`),
          },
        ]
      );
    } else {
      Alert.alert(
        'Low Supply',
        lowSupply
          .map((m) => `${m.name}: ${m.inventoryCount} ${m.inventoryCount === 1 ? 'dose' : 'doses'} left`)
          .join('\n') +
          '\n\nTip: add a pharmacy phone number when editing a medicine for one-tap refill calls.'
      );
    }
  };

  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getMemberName = (forMemberId: string) => {
    if (forMemberId === 'user_self' || forMemberId === user.id) return undefined;
    const member = activeCircle?.members.find((m) => m.id === forMemberId);
    return member ? member.name : undefined;
  };

  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.identityRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.name ? user.name.charAt(0).toUpperCase() : 'M'}
            </Text>
          </View>
          <View>
            <View style={styles.datePill}>
              <Text style={styles.dateLabel}>{todayFormatted}</Text>
            </View>
            <Text style={styles.greetingTitle}>
              {user.name ? `Hello, ${user.name.split(' ')[0]}` : 'Welcome to Meddy'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.notificationBell}
          onPress={() => router.push('/(tabs)/profile')}
          activeOpacity={0.7}
        >
          <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
          {user.notificationsEnabled && <View style={styles.notificationDot} />}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Low Supply Refill Banner */}
        {lowSupply.length > 0 && (
          <TouchableOpacity
            style={styles.lowSupplyBanner}
            onPress={handleRefill}
            activeOpacity={0.8}
          >
            <View style={styles.lowSupplyIconBg}>
              <Ionicons name="alert-circle" size={20} color={colors.danger} />
            </View>
            <View style={styles.lowSupplyTextCol}>
              <Text style={styles.lowSupplyTitle}>Low Supply — Time to Refill</Text>
              <Text style={styles.lowSupplyText} numberOfLines={2}>
                {lowSupply
                  .map((m) => `${m.name} (${m.inventoryCount} left)`)
                  .join(' · ')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.danger} />
          </TouchableOpacity>
        )}

        {/* Adherence Card */}
        <AdherenceCard
          summary={adherence}
          streakDays={streak}
          onPressHistory={() => router.push('/history')}
        />

        {/* Care Circle Summary */}
        <CareCircleSummary
          circle={activeCircle}
          onPressCircle={() => router.push('/(tabs)/care-circle')}
          onPressQR={() => router.push('/care-circle/scan')}
        />

        {/* Today's Medicine Timeline Section */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleGroup}>
            <Text style={styles.sectionTitle}>Today's Medicine Schedule</Text>
            <Text style={styles.sectionSubtitle}>
              {todayDoses.length} {todayDoses.length === 1 ? 'dose' : 'doses'} scheduled for today
            </Text>
          </View>
          <TouchableOpacity
            style={styles.seeAllBtn}
            onPress={() => router.push('/(tabs)/medicines')}
          >
            <Text style={styles.seeAllText}>All Meds</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {todayDoses.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="checkmark-done-circle-outline" size={54} color={colors.primary} />
            <Text style={styles.emptyTitle}>No Doses Remaining Today</Text>
            <Text style={styles.emptySubtitle}>
              You have no active medications scheduled for today, or all have been taken.
            </Text>
            <TouchableOpacity
              style={styles.emptyAddBtn}
              onPress={() => router.push('/medicine/add')}
            >
              <Ionicons name="add" size={18} color={colors.onPrimary} />
              <Text style={styles.emptyAddBtnText}>Add a Medicine</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.doseList}>
            {todayDoses.map((dose) => (
              <TodayDoseCard
                key={dose.id}
                item={dose}
                memberName={getMemberName(dose.medicine.forMemberId)}
                onTake={() =>
                  logDose(dose.medicine.id, dose.medicine.forMemberId, dose.timeStr, 'taken')
                }
                onSnooze={() =>
                  logDose(dose.medicine.id, dose.medicine.forMemberId, dose.timeStr, 'snoozed')
                }
                onSkip={() =>
                  logDose(dose.medicine.id, dose.medicine.forMemberId, dose.timeStr, 'skipped')
                }
                onPressCard={() => router.push('/(tabs)/medicines')}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button to Add Medicine */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 80 }]}
        activeOpacity={0.85}
        onPress={() => router.push('/medicine/add')}
      >
        <Ionicons name="add" size={28} color={colors.onPrimary} />
      </TouchableOpacity>
    </View>
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
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surfaceBorder,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.onPrimary,
  },
  datePill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 4,
  },
  dateLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.9,
  },
  greetingTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -0.6,
  },
  notificationBell: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  lowSupplyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerLight,
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.danger,
    gap: 10,
  },
  lowSupplyIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lowSupplyTextCol: {
    flex: 1,
  },
  lowSupplyTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.danger,
  },
  lowSupplyText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitleGroup: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  doseList: {
    paddingHorizontal: 20,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 26,
    padding: 28,
    marginHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderStyle: 'dashed',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    marginTop: 16,
  },
  emptyAddBtnText: {
    color: colors.onPrimary,
    fontWeight: '800',
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.glow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 6,
    zIndex: 99,
  },
});
