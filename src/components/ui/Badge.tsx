import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../constants/colors';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'primary', style }) => {
  const getBadgeStyle = () => {
    switch (variant) {
      case 'success':
        return { container: styles.successBg, text: styles.successText };
      case 'warning':
        return { container: styles.warningBg, text: styles.warningText };
      case 'danger':
        return { container: styles.dangerBg, text: styles.dangerText };
      case 'neutral':
        return { container: styles.neutralBg, text: styles.neutralText };
      default:
        return { container: styles.primaryBg, text: styles.primaryText };
    }
  };

  const current = getBadgeStyle();

  return (
    <View style={[styles.badge, current.container, style]}>
      <Text style={[styles.badgeText, current.text]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  primaryBg: {
    backgroundColor: Colors.light.primaryLight,
  },
  primaryText: {
    color: Colors.light.primaryDark,
  },
  successBg: {
    backgroundColor: Colors.light.successLight,
  },
  successText: {
    color: Colors.light.success,
  },
  warningBg: {
    backgroundColor: Colors.light.warningLight,
  },
  warningText: {
    color: Colors.light.warning,
  },
  dangerBg: {
    backgroundColor: Colors.light.dangerLight,
  },
  dangerText: {
    color: Colors.light.danger,
  },
  neutralBg: {
    backgroundColor: Colors.light.surfaceSubtle,
  },
  neutralText: {
    color: Colors.light.textSecondary,
  },
});
