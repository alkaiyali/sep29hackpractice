import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { ThemeColors } from '../../constants/colors';
import { useTheme, useThemedStyles } from '../../theme/ThemeProvider';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const getContainerStyle = (): ViewStyle[] => {
    const list: ViewStyle[] = [styles.base];

    switch (size) {
      case 'sm':
        list.push(styles.sizeSm);
        break;
      case 'lg':
        list.push(styles.sizeLg);
        break;
      default:
        list.push(styles.sizeMd);
    }

    switch (variant) {
      case 'secondary':
        list.push(styles.secondary);
        break;
      case 'outline':
        list.push(styles.outline);
        break;
      case 'danger':
        list.push(styles.danger);
        break;
      case 'ghost':
        list.push(styles.ghost);
        break;
      default:
        list.push(styles.primary);
    }

    if (disabled || loading) {
      list.push(styles.disabled);
    }

    if (style) {
      list.push(style);
    }

    return list;
  };

  const getTextStyle = (): TextStyle[] => {
    const list: TextStyle[] = [styles.baseText];

    switch (size) {
      case 'sm':
        list.push(styles.textSm);
        break;
      case 'lg':
        list.push(styles.textLg);
        break;
      default:
        list.push(styles.textMd);
    }

    switch (variant) {
      case 'outline':
      case 'ghost':
        list.push(styles.textOutline);
        break;
      case 'secondary':
        list.push(styles.textSecondary);
        break;
      case 'danger':
        list.push(styles.textDanger);
        break;
      default:
        list.push(styles.textPrimary);
    }

    if (textStyle) {
      list.push(textStyle);
    }

    return list;
  };

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      style={getContainerStyle()}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? colors.primary : colors.onPrimary}
        />
      ) : (
        <>
          {icon}
          <Text style={getTextStyle()}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    gap: 8,
  },
  sizeSm: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    minHeight: 36,
  },
  sizeMd: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    minHeight: 48,
  },
  sizeLg: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    minHeight: 56,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.primarySoft,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  danger: {
    backgroundColor: colors.danger,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
  baseText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  textSm: {
    fontSize: 13,
  },
  textMd: {
    fontSize: 15,
  },
  textLg: {
    fontSize: 17,
  },
  textPrimary: {
    color: colors.onPrimary,
  },
  textSecondary: {
    color: colors.primaryDark,
  },
  textOutline: {
    color: colors.primary,
  },
  textDanger: {
    color: colors.onPrimary,
  },
});
