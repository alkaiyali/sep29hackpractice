import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CareCircle } from '../../types/careCircle';
import { Colors } from '../../constants/colors';

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
            <Ionicons name="people" size={18} color={Colors.light.primaryDark} />
          </View>
          <View>
            <Text style={styles.circleName}>{circle.name}</Text>
            <Text style={styles.circleCount}>{circle.members.length} members connected</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.qrIconBtn} onPress={onPressQR} hitSlop={8}>
          <Ionicons name="qr-code" size={20} color={Colors.light.primary} />
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
          <Ionicons name="chevron-forward" size={16} color={Colors.light.primary} />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.surface,
    borderRadius: 18,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.light.surfaceBorder,
  },
  emptyContainer: {
    backgroundColor: Colors.light.surface,
    borderRadius: 18,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.light.surfaceBorder,
  },
  textGroup: {
    flex: 1,
    marginRight: 10,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.textPrimary,
  },
  emptySub: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.primary,
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
    backgroundColor: Colors.light.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.textPrimary,
  },
  circleCount: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  qrIconBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: Colors.light.primarySoft,
  },
  membersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.light.surfaceBorder,
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
    color: Colors.light.primary,
  },
});
