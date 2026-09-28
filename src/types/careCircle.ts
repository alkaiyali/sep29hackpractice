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
