import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMedicineStore } from '../../store/medicineStore';
import { useCareCircleStore } from '../../store/careCircleStore';
import { useUserStore } from '../../store/userStore';
import { Colors } from '../../constants/colors';
import { TodayDoseCard } from '../../components/dashboard/TodayDoseCard';
import { AdherenceCard } from '../../components/dashboard/AdherenceCard';
import { CareCircleSummary } from '../../components/dashboard/CareCircleSummary';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const user = useUserStore((s) => s.profile);
  const { getTodayDoses, getTodayAdherence, getStreakDays, logDose, loadData } = useMedicineStore();
  const activeCircle = useCareCircleStore((s) => s.getActiveCircle());

  const todayDoses = getTodayDoses();
  const adherence = getTodayAdherence();
  const streak = getStreakDays();

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
        <View>
          <Text style={styles.dateLabel}>{todayFormatted}</Text>
          <Text style={styles.greetingTitle}>
            {user.name ? `Hello, ${user.name.split(' ')[0]} 👋` : 'Welcome to Meddy 👋'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.notificationBell}
          onPress={() => router.push('/(tabs)/profile')}
          activeOpacity={0.7}
        >
          <Ionicons name="notifications-outline" size={22} color={Colors.light.textPrimary} />
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
            tintColor={Colors.light.primary}
          />
        }
      >
        {/* Adherence Card */}
        <AdherenceCard summary={adherence} streakDays={streak} />

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
            <Ionicons name="chevron-forward" size={14} color={Colors.light.primary} />
          </TouchableOpacity>
        </View>

        {todayDoses.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="checkmark-done-circle-outline" size={54} color={Colors.light.primary} />
            <Text style={styles.emptyTitle}>No Doses Remaining Today</Text>
            <Text style={styles.emptySubtitle}>
              You have no active medications scheduled for today, or all have been taken.
            </Text>
            <TouchableOpacity
              style={styles.emptyAddBtn}
              onPress={() => router.push('/medicine/add')}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
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
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
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
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  greetingTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.light.textPrimary,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  notificationBell: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.surfaceBorder,
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
    backgroundColor: Colors.light.primary,
  },
  scrollContent: {
    paddingBottom: 100,
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
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  doseList: {
    paddingHorizontal: 20,
  },
  emptyCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 20,
    padding: 28,
    marginHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.surfaceBorder,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.light.textPrimary,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 16,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.light.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
    zIndex: 99,
  },
});
