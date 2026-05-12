export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELED";
export type ApprovalStatusFilter = "PENDING" | "APPROVED" | "REJECTED" | "all";
export type ApprovalTab = "leave" | "manual-clock-out";

export interface ApprovalUserSummary {
  id: string;
  loginId: string;
  name: string;
  role?: number;
}

export interface LeaveRequestItem {
  id: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: ApprovalStatus;
  processorComment: string | null;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
  requester: ApprovalUserSummary | null;
  processor: ApprovalUserSummary | null;
}

export interface LeaveRequestListParams {
  page: number;
  take: number;
  status?: Exclude<ApprovalStatusFilter, "all">;
  includeSupervisedSites?: boolean;
}

export interface LeaveRequestListResponse {
  data: {
    leaveRequests: LeaveRequestItem[];
    total: number;
  };
}

export interface ManualClockOutSiteSummary {
  id: string;
  name: string;
}

export interface ManualClockOutZoneSummary {
  id: string;
  name: string;
  site?: ManualClockOutSiteSummary | null;
}

export interface ManualClockOutScheduleSummary {
  id: string;
  scheduleDate?: string;
  zone?: ManualClockOutZoneSummary | null;
}

export interface ManualClockOutAttendanceSummary {
  id: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  status?: string;
  schedule?: ManualClockOutScheduleSummary | null;
}

export interface ManualClockOutRequestItem {
  id: string;
  requestedCheckOutTime: string;
  reason: string;
  status: ApprovalStatus;
  processorComment: string | null;
  processedAt: string | null;
  createdAt?: string;
  updatedAt?: string;
  attendance: ManualClockOutAttendanceSummary | null;
  requester: ApprovalUserSummary | null;
  processor: ApprovalUserSummary | null;
}

export interface ManualClockOutRequestListParams {
  status?: Exclude<ApprovalStatusFilter, "all">;
}

export interface ProcessApprovalDto {
  comment?: string;
}
