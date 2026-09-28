import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';

export const cameraService = {
  async takePhotoWithCamera(): Promise<string | null> {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Camera Permission Needed',
            'Camera access is required to take photos of medicine. Would you like to select from your photo library instead?',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Choose from Gallery',
                onPress: () => cameraService.pickPhotoFromGallery(),
              },
            ]
          );
          return null;
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        return result.assets[0].uri;
      }
      return null;
    } catch (err) {
      console.warn('[cameraService] Camera capture unavailable or threw error:', err);
      // Fallback to gallery picker on simulator / web / devices without active camera
      Alert.alert(
        'Camera Unavailable',
        'Camera is not accessible on this device. Opening photo gallery instead.',
        [{ text: 'OK' }]
      );
      return await cameraService.pickPhotoFromGallery();
    }
  },

  async pickPhotoFromGallery(): Promise<string | null> {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Photo Library Permission Needed',
            'Please enable photo library access in device settings to attach medicine photos.'
          );
          return null;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        return result.assets[0].uri;
      }
      return null;
    } catch (err) {
      console.warn('[cameraService] Error picking image from gallery:', err);
      return null;
    }
  },
};
