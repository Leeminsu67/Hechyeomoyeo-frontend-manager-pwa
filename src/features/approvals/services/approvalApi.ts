import apiClient from "@/lib/axios";
import type {
  LeaveRequestItem,
  LeaveRequestListParams,
  LeaveRequestListResponse,
  ManualClockOutRequestItem,
  ManualClockOutRequestListParams,
  ProcessApprovalDto,
} from "@/types/approval";

interface ApiEnvelope<T> {
  data?: T;
}

interface LeaveRequestListPayload {
  leaveRequests?: LeaveRequestItem[];
  total?: number;
}

interface LeaveRequestDetailPayload {
  leaveRequest?: LeaveRequestItem;
}

function normalizeLeaveRequestList(payload: unknown): LeaveRequestListResponse {
  const envelope = payload as ApiEnvelope<LeaveRequestListPayload>;
  const data = envelope.data ?? {};
  const leaveRequests = data.leaveRequests ?? [];

  return {
    data: {
      leaveRequests,
      total: data.total ?? leaveRequests.length,
    },
  };
}

function normalizeLeaveRequest(payload: unknown): LeaveRequestItem {
  const envelope = payload as ApiEnvelope<LeaveRequestDetailPayload | LeaveRequestItem>;
  const data = envelope.data;

  if (data && "leaveRequest" in data && data.leaveRequest) {
    return data.leaveRequest;
  }

  return data as LeaveRequestItem;
}

function normalizeManualClockOutList(payload: unknown): ManualClockOutRequestItem[] {
  const envelope = payload as ApiEnvelope<ManualClockOutRequestItem[]>;
  return envelope.data ?? [];
}

function normalizeManualClockOutRequest(payload: unknown): ManualClockOutRequestItem {
  const envelope = payload as ApiEnvelope<ManualClockOutRequestItem>;
  return envelope.data as ManualClockOutRequestItem;
}

export const getLeaveRequests = async (
  params: LeaveRequestListParams,
): Promise<LeaveRequestListResponse> => {
  const response = await apiClient.get("/leave-requests", {
    params: {
      ...params,
      includeSupervisedSites: true,
    },
  });

  return normalizeLeaveRequestList(response.data);
};

export const getLeaveRequest = async (
  id: string,
): Promise<LeaveRequestItem> => {
  const response = await apiClient.get(`/leave-requests/${id}`);
  return normalizeLeaveRequest(response.data);
};

export const approveLeaveRequest = async (
  id: string,
  dto: ProcessApprovalDto,
): Promise<LeaveRequestItem> => {
  const response = await apiClient.patch(`/leave-requests/${id}/approve`, dto);
  return normalizeLeaveRequest(response.data);
};

export const rejectLeaveRequest = async (
  id: string,
  dto: ProcessApprovalDto,
): Promise<LeaveRequestItem> => {
  const response = await apiClient.patch(`/leave-requests/${id}/reject`, dto);
  return normalizeLeaveRequest(response.data);
};

export const getManualClockOutRequests = async (
  params: ManualClockOutRequestListParams,
): Promise<ManualClockOutRequestItem[]> => {
  const response = await apiClient.get("/manual-clock-out-requests", {
    params,
  });

  return normalizeManualClockOutList(response.data);
};

export const getManualClockOutRequest = async (
  id: string,
): Promise<ManualClockOutRequestItem> => {
  const response = await apiClient.get(`/manual-clock-out-requests/${id}`);
  return normalizeManualClockOutRequest(response.data);
};

export const approveManualClockOutRequest = async (
  id: string,
  dto: ProcessApprovalDto,
): Promise<ManualClockOutRequestItem> => {
  const response = await apiClient.patch(
    `/manual-clock-out-requests/${id}/approve`,
    dto,
  );
  return normalizeManualClockOutRequest(response.data);
};

export const rejectManualClockOutRequest = async (
  id: string,
  dto: ProcessApprovalDto,
): Promise<ManualClockOutRequestItem> => {
  const response = await apiClient.patch(
    `/manual-clock-out-requests/${id}/reject`,
    dto,
  );
  return normalizeManualClockOutRequest(response.data);
};
