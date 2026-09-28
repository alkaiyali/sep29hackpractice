export type MemberRelation =
  | 'Self'
  | 'Parent'
  | 'Child'
  | 'Spouse'
  | 'Grandparent'
  | 'Sibling'
  | 'Friend'
  | 'Caregiver'
  | 'Other';

export interface CareCircleMember {
  id: string;
  /** Firebase uid for members who joined from their own device. */
  uid?: string;
  name: string;
  relation: MemberRelation;
  avatarColor: string;
  avatarUri?: string;
  isOwner: boolean;
  joinedAt: string;
}

export interface CareCircle {
  id: string;
  name: string;
  inviteCode: string;
  createdById: string;
  members: CareCircleMember[];
  createdAt: string;
}

export interface CareCircleInvitePayload {
  version: '1.0';
  circleId: string;
  circleName: string;
  inviterName: string;
  inviteCode: string;
  timestamp: number;
}

/** Cloud link health for the Care Circle, surfaced in the UI. */
export type CircleSyncStatus = 'local' | 'connecting' | 'online' | 'error';

/**
 * A single logged dose mirrored through Firestore so every device in the
 * circle sees the same status. Keyed by a deterministic id (see circleSync).
 */
export interface CircleDoseEvent {
  id: string;
  circleId: string;
  medicineId: string;
  medicineName: string;
  /** Canonical member id: uid for device members, generated id for loved ones. */
  memberId: string;
  memberName: string;
  dateStr: string; // YYYY-MM-DD
  timeStr: string; // HH:mm
  status: 'taken' | 'skipped' | 'snoozed';
  actionTime: string; // ISO timestamp of the action
  actorUid?: string;
  actorName?: string;
  /** uid → emoji, at most one cheer per member. */
  cheers?: Record<string, string>;
}
