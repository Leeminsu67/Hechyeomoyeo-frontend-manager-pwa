import type { ScheduleStatus } from "./schedule";

export type SwapRequestStatus =
  | "pending"
  | "target_accepted"
  | "approved"
  | "rejected"
  | "cancelled";

export interface SwapRequestUser {
  id: string;
  loginId: string;
  name: string;
}

export interface SwapRequestSchedule {
  id: string;
  scheduleDate: string;
  status: ScheduleStatus;
  zone: {
    id: string;
    name: string;
  };
  site: {
    id: string;
    name: string;
  };
}

export interface SwapRequestItem {
  id: string;
  status: SwapRequestStatus;
  createdAt: string;
  updatedAt: string;
  requester: SwapRequestUser;
  targetUser: SwapRequestUser;
  requesterSchedule: SwapRequestSchedule;
  targetSchedule: SwapRequestSchedule;
  reviewedBy: SwapRequestUser | null;
}

export interface SwapRequestListParams {
  page: number;
  take: number;
  status?: SwapRequestStatus;
  startDate?: string;
  endDate?: string;
}

export interface SwapRequestListResponse {
  data: {
    swapRequests: SwapRequestItem[];
    total: number;
  };
}

export interface DirectSwapRequestDto {
  requesterUserId: string;
  requesterScheduleId: string;
  targetUserId: string;
  targetScheduleId: string;
}
