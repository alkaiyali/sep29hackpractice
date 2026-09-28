import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useMedicineStore, nearestScheduleTime } from '../store/medicineStore';
import { useCareCircleStore } from '../store/careCircleStore';
import { useUserStore } from '../store/userStore';
import { useActivityStore } from '../store/activityStore';
import { useVitalsStore } from '../store/vitalsStore';
import { useSoundStore } from '../store/soundStore';
import { notificationService } from '../services/notifications';
import { ThemeProvider, useTheme } from '../theme/ThemeProvider';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <RootNavigator />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const { colors, scheme } = useTheme();

  const loadMedicines = useMedicineStore((s) => s.loadData);
  const loadCircles = useCareCircleStore((s) => s.loadData);
  const initCircleSync = useCareCircleStore((s) => s.initSync);
  const loadUser = useUserStore((s) => s.loadData);
  const loadActivity = useActivityStore((s) => s.loadData);
  const loadVitals = useVitalsStore((s) => s.loadData);
  const loadSounds = useSoundStore((s) => s.loadData);

  useEffect(() => {
    // Rehydrate stores and register notification channels
    const initApp = async () => {
      await Promise.all([loadMedicines(), loadCircles(), loadUser(), loadActivity(), loadVitals(), loadSounds()]);
      await notificationService.requestPermissions();
      await notificationService.registerNotificationCategories();
      // Link Care Circles to Firestore when credentials are configured
      await initCircleSync();
    };

    initApp();
  }, [loadMedicines, loadCircles, initCircleSync, loadUser, loadActivity, loadVitals, loadSounds]);

  // Handle notification action buttons (Take / Snooze from the shade).
  // No-ops in Expo Go, where notifications are unavailable.
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let cancelled = false;

    void notificationService
      .addResponseListener(async (response) => {
        const actionId = response.actionIdentifier;
        if (actionId !== 'ACTION_TAKE' && actionId !== 'ACTION_SNOOZE') return;

        const data = response.notification.request.content.data as {
          medicineId?: string;
          forMemberId?: string;
          timeStr?: string;
        };
        if (!data?.medicineId) return;

        const store = useMedicineStore.getState();
        const medicine = store.medicines.find((m) => m.id === data.medicineId);
        if (!medicine) return;

        const memberId = data.forMemberId || medicine.forMemberId || 'user_self';
        const timeStr = data.timeStr || nearestScheduleTime(medicine.scheduleTimes);
        await store.logDose(
          medicine.id,
          memberId,
          timeStr,
          actionId === 'ACTION_TAKE' ? 'taken' : 'snoozed'
        );
      })
      .then((off) => {
        if (cancelled) off();
        else unsubscribe = off;
      });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="medicine/add"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="medicine/scan-label"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="care-circle/scan"
          options={{
            presentation: 'fullScreenModal',
            headerShown: false,
          }}
        />
        <Stack.Screen name="history" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
