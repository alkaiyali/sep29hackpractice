import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CareCircle } from '../../types/careCircle';
import { ThemeColors } from '../../constants/colors';
import { useTheme, useThemedStyles } from '../../theme/ThemeProvider';

interface CareCircleSummaryProps {
  circle?: CareCircle;
  onPressCircle: () => void;
  onPressQR: () => void;
}

export const CareCircleSummary: React.FC<CareCircleSummaryProps> = ({
  circle,
  onPressCircle,
  onPressQR,
}) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  if (!circle) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.textGroup}>
          <Text style={styles.emptyTitle}>No Care Circle Connected</Text>
          <Text style={styles.emptySub}>Create or scan a QR code to monitor loved ones.</Text>
        </View>
        <TouchableOpacity style={styles.joinBtn} onPress={onPressQR}>
          <Ionicons name="qr-code-outline" size={16} color="#FFFFFF" />
          <Text style={styles.joinBtnText}>Scan QR</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <View style={styles.circleIconBg}>
            <Ionicons name="people" size={18} color={colors.primaryDark} />
          </View>
          <View>
            <Text style={styles.circleName}>{circle.name}</Text>
            <Text style={styles.circleCount}>{circle.members.length} members connected</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.qrIconBtn} onPress={onPressQR} hitSlop={8}>
          <Ionicons name="qr-code" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity activeOpacity={0.8} style={styles.membersRow} onPress={onPressCircle}>
        <View style={styles.avatarStack}>
          {circle.members.map((member, index) => (
            <View
              key={member.id}
              style={[
                styles.avatarCircle,
                { backgroundColor: member.avatarColor, zIndex: 10 - index, marginLeft: index === 0 ? 0 : -10 },
              ]}
            >
              <Text style={styles.avatarInitial}>{member.name.charAt(0).toUpperCase()}</Text>
            </View>
          ))}
        </View>

        <View style={styles.viewCircleAction}>
          <Text style={styles.viewCircleText}>Manage Circle</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.primary} />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  emptyContainer: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  textGroup: {
    flex: 1,
    marginRight: 10,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptySub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  joinBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  circleIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  circleCount: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  qrIconBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
  },
  membersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  viewCircleAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewCircleText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
});
