import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { ThemeColors } from '../../constants/colors';
import { useTheme, useThemedStyles } from '../../theme/ThemeProvider';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'primary', style }) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
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

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
    backgroundColor: colors.primaryLight,
  },
  primaryText: {
    color: colors.primaryDark,
  },
  successBg: {
    backgroundColor: colors.successLight,
  },
  successText: {
    color: colors.success,
  },
  warningBg: {
    backgroundColor: colors.warningLight,
  },
  warningText: {
    color: colors.warning,
  },
  dangerBg: {
    backgroundColor: colors.dangerLight,
  },
  dangerText: {
    color: colors.danger,
  },
  neutralBg: {
    backgroundColor: colors.surfaceSubtle,
  },
  neutralText: {
    color: colors.textSecondary,
  },
});
