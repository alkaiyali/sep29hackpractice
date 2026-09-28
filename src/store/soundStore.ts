import { create } from 'zustand';
import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';
import { safeStorage, StorageKeys } from '../services/storage';
import { audioHapticsService } from '../services/audioHaptics';

export interface CustomSound {
  id: string;
  name: string;
  uri: string; // file:// copy inside app storage (or session blob: on web)
  importedAt: string;
}

/** soundName prefix marking a user-imported sound. */
export const CUSTOM_SOUND_PREFIX = 'custom:';

export function customSoundRef(id: string): string {
  return `${CUSTOM_SOUND_PREFIX}${id}`;
}

export function customSoundIdOf(soundName: string): string | null {
  return soundName.startsWith(CUSTOM_SOUND_PREFIX)
    ? soundName.slice(CUSTOM_SOUND_PREFIX.length)
    : null;
}

const SUPPORTED_EXTENSIONS = ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'caf', 'aif', 'aiff'];

interface SoundState {
  customSounds: CustomSound[];
  isLoaded: boolean;
  importing: boolean;

  loadData: () => Promise<void>;
  importSound: () => Promise<CustomSound | null>;
  previewSound: (soundName: string) => Promise<void>;
  deleteSound: (id: string) => Promise<void>;
  resolveUri: (soundName: string) => string | null;
}

export const useSoundStore = create<SoundState>((set, get) => ({
  customSounds: [],
  isLoaded: false,
  importing: false,

  loadData: async () => {
    const saved = await safeStorage.getItem<CustomSound[]>(StorageKeys.CUSTOM_SOUNDS, []);
    // Drop entries whose files no longer exist (native only)
    if (Platform.OS !== 'web' && saved.length > 0) {
      const LegacyFS = await import('expo-file-system/legacy');
      const alive: CustomSound[] = [];
      for (const s of saved) {
        try {
          const info = await LegacyFS.getInfoAsync(s.uri);
          if (info.exists) alive.push(s);
        } catch {
          // treat as missing
        }
      }
      if (alive.length !== saved.length) {
        set({ customSounds: alive, isLoaded: true });
        await safeStorage.setItem(StorageKeys.CUSTOM_SOUNDS, alive);
        return;
      }
    }
    set({ customSounds: saved, isLoaded: true });
  },

  importSound: async () => {
    set({ importing: true });
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });
      if (picked.canceled || !picked.assets || picked.assets.length === 0) return null;

      const asset = picked.assets[0];
      const ext = (asset.name?.split('.').pop() || 'mp3').toLowerCase();
      if (!SUPPORTED_EXTENSIONS.includes(ext)) {
        throw new Error(`.${ext} is not a supported audio format. Try MP3, WAV, or M4A.`);
      }

      const id = `snd_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const fileName = `${id}.${ext}`;
      let uri = asset.uri;

      // Copy into app storage so it survives cache clears (native only)
      if (Platform.OS !== 'web') {
        const LegacyFS = await import('expo-file-system/legacy');
        if (!LegacyFS.documentDirectory) {
          throw new Error('App storage is unavailable on this device.');
        }
        const dir = `${LegacyFS.documentDirectory}sounds/`;
        const dirInfo = await LegacyFS.getInfoAsync(dir);
        if (!dirInfo.exists) {
          await LegacyFS.makeDirectoryAsync(dir, { intermediates: true });
        }
        const dest = `${dir}${fileName}`;
        await LegacyFS.copyAsync({ from: asset.uri, to: dest });
        uri = dest;
      }

      const sound: CustomSound = {
        id,
        name: asset.name?.replace(/\.[^.]+$/, '') || 'Custom sound',
        uri,
        importedAt: new Date().toISOString(),
      };

      const updated = [sound, ...get().customSounds].slice(0, 20);
      set({ customSounds: updated });
      await safeStorage.setItem(StorageKeys.CUSTOM_SOUNDS, updated);

      // Instant preview so the user hears what they picked
      await audioHapticsService.playCustomFile(uri);
      return sound;
    } catch (err) {
      console.warn('[soundStore] Import failed:', err);
      throw err instanceof Error ? err : new Error('Could not import that audio file.');
    } finally {
      set({ importing: false });
    }
  },

  previewSound: async (soundName) => {
    const id = customSoundIdOf(soundName);
    if (id) {
      const found = get().customSounds.find((s) => s.id === id);
      if (found) {
        await audioHapticsService.playCustomFile(found.uri);
        return;
      }
    }
    await audioHapticsService.playAlarmSound(soundName, true);
  },

  deleteSound: async (id) => {
    const target = get().customSounds.find((s) => s.id === id);
    const updated = get().customSounds.filter((s) => s.id !== id);
    set({ customSounds: updated });
    await safeStorage.setItem(StorageKeys.CUSTOM_SOUNDS, updated);
    // Best-effort file cleanup; the registry entry is already gone
    if (target && Platform.OS !== 'web' && target.uri.startsWith('file://')) {
      try {
        const LegacyFS = await import('expo-file-system/legacy');
        await LegacyFS.deleteAsync(target.uri, { idempotent: true });
      } catch {
        // ignore cleanup failures
      }
    }
  },

  resolveUri: (soundName) => {
    const id = customSoundIdOf(soundName);
    if (!id) return null;
    return get().customSounds.find((s) => s.id === id)?.uri || null;
  },
}));
