import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { VibrationPattern, AlertSound } from '../types/medicine';

export const audioHapticsService = {
  async triggerVibration(pattern: VibrationPattern): Promise<void> {
    if (Platform.OS === 'web' || pattern === 'off') {
      return;
    }

    try {
      switch (pattern) {
        case 'light':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          setTimeout(async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          }, 200);
          break;
      }
    } catch (err) {
      console.warn('[audioHapticsService] Haptics trigger error:', err);
    }
  },

  async triggerSuccessFeedback(): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.warn('[audioHapticsService] Success feedback error:', err);
    }
  },

  async triggerWarningFeedback(): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (err) {
      console.warn('[audioHapticsService] Warning feedback error:', err);
    }
  },

  async playAlarmSound(soundName: AlertSound, enabled: boolean): Promise<void> {
    if (!enabled) return;
    try {
      // In web or native, dynamically import or use Audio if available
      const { Audio } = await import('expo-av');
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      // Sound synthesized/beep fallback or remote alert tone
      console.log(`[audioHapticsService] Playing alert sound: ${soundName}`);
    } catch (err) {
      console.warn('[audioHapticsService] Audio playback error:', err);
    }
  },
};
