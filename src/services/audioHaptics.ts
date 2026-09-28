import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { VibrationPattern, AlertSound } from '../types/medicine';

// Helper to generate a minimal valid PCM WAV data URI with smooth exponential decay
function generateChimeWavUri(frequency: number, durationSec: number = 1.0): string {
  const sampleRate = 22050;
  const numSamples = Math.floor(sampleRate * durationSec);
  const dataSize = numSamples * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // Write ASCII string helper
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // ByteRate
  view.setUint16(32, 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // Generate sine wave samples with envelope
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const envelope = Math.exp(-3.5 * (t / durationSec));
    const sample = Math.sin(2 * Math.PI * frequency * t) * envelope;
    const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * 28000)));
    view.setInt16(offset, intSample, true);
    offset += 2;
  }

  // Convert buffer to base64
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  // Use global btoa or Buffer fallback
  const base64 =
    typeof btoa !== 'undefined'
      ? btoa(binary)
      : Buffer.from(binary, 'binary').toString('base64');

  return 'data:audio/wav;base64,' + base64;
}

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

    // Frequencies corresponding to sound choices
    let frequency = 587.33; // D5 (default)
    let duration = 1.2;
    if (soundName === 'gentle') {
      frequency = 523.25; // C5 (warm gentle)
      duration = 1.4;
    } else if (soundName === 'bell') {
      frequency = 659.25; // E5 (hospital chime)
      duration = 1.0;
    } else if (soundName === 'medical_pulse') {
      frequency = 783.99; // G5 (bright clinical)
      duration = 0.8;
    } else if (soundName === 'radar') {
      frequency = 880.0; // A5 (high alert)
      duration = 0.6;
    }

    // Web Platform: use Web Audio API directly for zero latency
    if (Platform.OS === 'web') {
      try {
        const AudioContextClass =
          (window as any).AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const ctx = new AudioContextClass();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = soundName === 'radar' ? 'triangle' : 'sine';
          osc.frequency.setValueAtTime(frequency, ctx.currentTime);

          gain.gain.setValueAtTime(0.3, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start();
          osc.stop(ctx.currentTime + duration);
          return;
        }
      } catch (err) {
        console.warn('[audioHapticsService] Web Audio fallback to data URI:', err);
      }
    }

    // Native Platform (or Web Audio fallback): use expo-av with data URI
    try {
      const { Audio } = await import('expo-av');
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      const soundUri = generateChimeWavUri(frequency, duration);
      const { sound } = await Audio.Sound.createAsync(
        { uri: soundUri },
        { shouldPlay: true, volume: 1.0 }
      );

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (err) {
      console.warn('[audioHapticsService] Audio playback error:', err);
    }
  },
};
