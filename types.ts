
export type LeaveTime = '1 Day' | 'First Half' | 'Second Half' | '2 Hours' | '4 Hours' | '1 Hour' | 'Other' | string;
export type LeaveReason = 'Fever' | 'Headache' | 'Stomach' | 'Unwell' | 'Body Pain' | 'Other' | string;
export type SubmissionStatus = 'Pending' | 'Approved' | 'Rejected';
export type UserRole = 'super_admin' | 'admin' | 'user';

export interface Submission {
  id: string;
  studentName: string;
  email: string;
  date: string;
  reason: LeaveReason;
  leaveTime: LeaveTime;
  submittedAt: string;
  status: SubmissionStatus;
  rejectionReason?: string;
}

export interface DashboardStats {
  total: number;
  pending: number;
  approved: number;
  campusTotal: number;
}
