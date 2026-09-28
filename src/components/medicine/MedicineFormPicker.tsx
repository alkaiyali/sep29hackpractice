import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MedicineForm } from '../../types/medicine';
import { Colors } from '../../constants/colors';

interface MedicineFormPickerProps {
  selectedForm: MedicineForm;
  onSelectForm: (form: MedicineForm) => void;
}

interface FormOption {
  key: MedicineForm;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const FORMS: FormOption[] = [
  { key: 'pill', label: 'Tablet / Pill', icon: 'medkit-outline' },
  { key: 'capsule', label: 'Capsule', icon: 'ellipse-outline' },
  { key: 'liquid', label: 'Liquid / Syrup', icon: 'water-outline' },
  { key: 'injection', label: 'Injection', icon: 'eyedrop-outline' },
  { key: 'inhaler', label: 'Inhaler', icon: 'cloud-outline' },
  { key: 'drops', label: 'Eye/Ear Drops', icon: 'color-fill-outline' },
  { key: 'topical', label: 'Cream / Topical', icon: 'bandage-outline' },
];

export const MedicineFormPicker: React.FC<MedicineFormPickerProps> = ({
  selectedForm,
  onSelectForm,
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {FORMS.map((item) => {
        const isSelected = selectedForm === item.key;
        return (
          <TouchableOpacity
            key={item.key}
            activeOpacity={0.7}
            style={[styles.itemCard, isSelected && styles.selectedItemCard]}
            onPress={() => onSelectForm(item.key)}
          >
            <View style={[styles.iconCircle, isSelected && styles.selectedIconCircle]}>
              <Ionicons
                name={item.icon}
                size={22}
                color={isSelected ? '#FFFFFF' : Colors.light.primary}
              />
            </View>
            <Text style={[styles.itemLabel, isSelected && styles.selectedItemLabel]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 6,
    gap: 10,
  },
  itemCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: Colors.light.surfaceSubtle,
    borderWidth: 1.5,
    borderColor: 'transparent',
    minWidth: 95,
  },
  selectedItemCard: {
    backgroundColor: Colors.light.primarySoft,
    borderColor: Colors.light.primary,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  selectedIconCircle: {
    backgroundColor: Colors.light.primary,
  },
  itemLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  selectedItemLabel: {
    color: Colors.light.primaryDark,
    fontWeight: '700',
  },
});
