import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useMedicineStore } from '../store/medicineStore';
import { useCareCircleStore } from '../store/careCircleStore';
import { useUserStore } from '../store/userStore';
import { notificationService } from '../services/notifications';

export default function RootLayout() {
  const loadMedicines = useMedicineStore((s) => s.loadData);
  const loadCircles = useCareCircleStore((s) => s.loadData);
  const loadUser = useUserStore((s) => s.loadData);

  useEffect(() => {
    // Rehydrate stores and register notification channels
    const initApp = async () => {
      await Promise.all([loadMedicines(), loadCircles(), loadUser()]);
      await notificationService.requestPermissions();
      await notificationService.registerNotificationCategories();
    };

    initApp();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#F8FAFC' },
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
          name="care-circle/scan"
          options={{
            presentation: 'fullScreenModal',
            headerShown: false,
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
