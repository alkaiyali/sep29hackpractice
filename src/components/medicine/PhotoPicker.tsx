import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { cameraService } from '../../services/camera';

interface PhotoPickerProps {
  photoUri?: string;
  onPhotoSelected: (uri?: string) => void;
}

export const PhotoPicker: React.FC<PhotoPickerProps> = ({ photoUri, onPhotoSelected }) => {
  const handleTakePhoto = async () => {
    const uri = await cameraService.takePhotoWithCamera();
    if (uri) {
      onPhotoSelected(uri);
    }
  };

  const handlePickFromGallery = async () => {
    const uri = await cameraService.pickPhotoFromGallery();
    if (uri) {
      onPhotoSelected(uri);
    }
  };

  const handleRemovePhoto = () => {
    onPhotoSelected(undefined);
  };

  return (
    <View style={styles.container}>
      {photoUri ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: photoUri }} style={styles.previewImage} />
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={handleRemovePhoto}
            activeOpacity={0.8}
            hitSlop={8}
          >
            <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
            <Text style={styles.removeBtnText}>Remove</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={styles.pickerBtn}
            onPress={handleTakePhoto}
            activeOpacity={0.7}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="camera-outline" size={22} color={Colors.light.primary} />
            </View>
            <Text style={styles.pickerBtnText}>Take Photo</Text>
            <Text style={styles.pickerBtnSub}>Snap pill or bottle</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.pickerBtn}
            onPress={handlePickFromGallery}
            activeOpacity={0.7}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="images-outline" size={22} color={Colors.light.accent} />
            </View>
            <Text style={styles.pickerBtnText}>Use Gallery</Text>
            <Text style={styles.pickerBtnSub}>Choose from library</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pickerBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: Colors.light.surfaceSubtle,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.light.surfaceBorder,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  pickerBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.textPrimary,
  },
  pickerBtnSub: {
    fontSize: 11,
    color: Colors.light.textMuted,
    marginTop: 2,
  },
  previewContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    backgroundColor: Colors.light.surfaceSubtle,
  },
  removeBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(225, 29, 72, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  removeBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
