import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  LeaveRequestListParams,
  ManualClockOutRequestListParams,
  ProcessApprovalDto,
} from "@/types/approval";
import { ADMIN_DASHBOARD_KEYS } from "@/features/dashboard/hooks/useAdminDashboard";
import {
  approveLeaveRequest,
  approveManualClockOutRequest,
  getLeaveRequest,
  getLeaveRequests,
  getManualClockOutRequest,
  getManualClockOutRequests,
  rejectLeaveRequest,
  rejectManualClockOutRequest,
} from "../services/approvalApi";

export const APPROVAL_KEYS = {
  all: ["approvals"] as const,
  leave: {
    all: ["approvals", "leave"] as const,
    list: (params: LeaveRequestListParams) =>
      ["approvals", "leave", "list", params] as const,
    detail: (id: string) => ["approvals", "leave", "detail", id] as const,
  },
  manualClockOut: {
    all: ["approvals", "manual-clock-out"] as const,
    list: (params: ManualClockOutRequestListParams) =>
      ["approvals", "manual-clock-out", "list", params] as const,
    detail: (id: string) =>
      ["approvals", "manual-clock-out", "detail", id] as const,
  },
};

type ApiError = {
  response?: {
    data?: {
      message?: string;
    };
  };
};

function invalidateApprovalQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  id: string,
  kind: "leave" | "manual-clock-out",
) {
  if (kind === "leave") {
    queryClient.invalidateQueries({ queryKey: APPROVAL_KEYS.leave.all });
    queryClient.invalidateQueries({ queryKey: APPROVAL_KEYS.leave.detail(id) });
  } else {
    queryClient.invalidateQueries({ queryKey: APPROVAL_KEYS.manualClockOut.all });
    queryClient.invalidateQueries({
      queryKey: APPROVAL_KEYS.manualClockOut.detail(id),
    });
  }

  queryClient.invalidateQueries({ queryKey: ADMIN_DASHBOARD_KEYS.all });
}

export function useLeaveRequestList(
  params: LeaveRequestListParams,
  enabled = true,
) {
  return useQuery({
    queryKey: APPROVAL_KEYS.leave.list(params),
    queryFn: () => getLeaveRequests(params),
    enabled,
    placeholderData: (prev) => prev,
  });
}

export function useLeaveRequest(id: string | null) {
  return useQuery({
    queryKey: APPROVAL_KEYS.leave.detail(id ?? ""),
    queryFn: () => getLeaveRequest(id ?? ""),
    enabled: !!id,
  });
}

export function useApproveLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: ProcessApprovalDto }) =>
      approveLeaveRequest(id, dto),
    onSuccess: (_data, variables) => {
      invalidateApprovalQueries(queryClient, variables.id, "leave");
      toast.success("휴가 신청을 승인했습니다.");
    },
    onError: (error: ApiError) => {
      toast.error(error.response?.data?.message ?? "휴가 승인에 실패했습니다.");
    },
  });
}

export function useRejectLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: ProcessApprovalDto }) =>
      rejectLeaveRequest(id, dto),
    onSuccess: (_data, variables) => {
      invalidateApprovalQueries(queryClient, variables.id, "leave");
      toast.success("휴가 신청을 반려했습니다.");
    },
    onError: (error: ApiError) => {
      toast.error(error.response?.data?.message ?? "휴가 반려에 실패했습니다.");
    },
  });
}

export function useManualClockOutRequestList(
  params: ManualClockOutRequestListParams,
  enabled = true,
) {
  return useQuery({
    queryKey: APPROVAL_KEYS.manualClockOut.list(params),
    queryFn: () => getManualClockOutRequests(params),
    enabled,
    placeholderData: (prev) => prev,
  });
}

export function useManualClockOutRequest(id: string | null) {
  return useQuery({
    queryKey: APPROVAL_KEYS.manualClockOut.detail(id ?? ""),
    queryFn: () => getManualClockOutRequest(id ?? ""),
    enabled: !!id,
  });
}

export function useApproveManualClockOutRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: ProcessApprovalDto }) =>
      approveManualClockOutRequest(id, dto),
    onSuccess: (_data, variables) => {
      invalidateApprovalQueries(queryClient, variables.id, "manual-clock-out");
      toast.success("퇴근 보정 신청을 승인했습니다.");
    },
    onError: (error: ApiError) => {
      toast.error(
        error.response?.data?.message ?? "퇴근 보정 승인에 실패했습니다.",
      );
    },
  });
}

export function useRejectManualClockOutRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: ProcessApprovalDto }) =>
      rejectManualClockOutRequest(id, dto),
    onSuccess: (_data, variables) => {
      invalidateApprovalQueries(queryClient, variables.id, "manual-clock-out");
      toast.success("퇴근 보정 신청을 반려했습니다.");
    },
    onError: (error: ApiError) => {
      toast.error(
        error.response?.data?.message ?? "퇴근 보정 반려에 실패했습니다.",
      );
    },
  });
}
