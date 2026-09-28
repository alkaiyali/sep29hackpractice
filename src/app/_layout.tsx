import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useMedicineStore } from '../store/medicineStore';
import { useCareCircleStore } from '../store/careCircleStore';
import { useUserStore } from '../store/userStore';
import { useActivityStore } from '../store/activityStore';
import { useVitalsStore } from '../store/vitalsStore';
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
  const loadUser = useUserStore((s) => s.loadData);
  const loadActivity = useActivityStore((s) => s.loadData);
  const loadVitals = useVitalsStore((s) => s.loadData);

  useEffect(() => {
    // Rehydrate stores and register notification channels
    const initApp = async () => {
      await Promise.all([loadMedicines(), loadCircles(), loadUser(), loadActivity(), loadVitals()]);
      await notificationService.requestPermissions();
      await notificationService.registerNotificationCategories();
    };

    initApp();
  }, [loadMedicines, loadCircles, loadUser, loadActivity, loadVitals]);

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
