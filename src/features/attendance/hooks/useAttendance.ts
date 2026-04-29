import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getSiteSummaries,
  getAttendanceSummary,
  getAttendances,
  getMonthlyReport,
  getAlerts,
  markAlertRead,
  updateAttendance,
  manualCheckIn,
  manualCheckOut,
} from "../services/attendanceApi";
import type { UpdateAttendanceDto, ManualCheckInDto, ManualCheckOutDto } from "@/types/attendance";

export const ATTENDANCE_KEYS = {
  all: ["attendance"] as const,
  summary: (siteId: string, date: string) =>
    ["attendance", "summary", siteId, date] as const,
  list: (siteId: string, date: string) =>
    ["attendance", "list", siteId, date] as const,
  report: (siteId: string, month: string) =>
    ["attendance", "report", siteId, month] as const,
  alerts: (siteId: string) => ["attendance", "alerts", siteId] as const,
};

// ─── 전체 현장 출결 요약 (단일 호출) ────────────────────────────────────────

export function useSiteSummaries(date: string) {
  return useQuery({
    queryKey: ["attendance", "site-summaries", date] as const,
    queryFn: () => getSiteSummaries(date),
    enabled: !!date,
  });
}

// ─── 현장별 출결 현황 요약 ───────────────────────────────────────────────────

export function useAttendanceSummary(siteId: string, date: string) {
  return useQuery({
    queryKey: ATTENDANCE_KEYS.summary(siteId, date),
    queryFn: () => getAttendanceSummary(siteId, date),
    enabled: !!siteId && !!date,
  });
}

// ─── 출퇴근 기록 조회 ────────────────────────────────────────────────────────

export function useAttendanceList(siteId: string, date: string) {
  return useQuery({
    queryKey: ATTENDANCE_KEYS.list(siteId, date),
    queryFn: () => getAttendances(siteId, date),
    enabled: !!siteId && !!date,
  });
}

// ─── 월간 리포트 ─────────────────────────────────────────────────────────────

export function useMonthlyReport(siteId: string, month: string) {
  return useQuery({
    queryKey: ATTENDANCE_KEYS.report(siteId, month),
    queryFn: () => getMonthlyReport(siteId, month),
    enabled: !!siteId && !!month,
  });
}

// ─── 이상 알림 목록 ──────────────────────────────────────────────────────────

export function useAlerts(siteId: string) {
  return useQuery({
    queryKey: ATTENDANCE_KEYS.alerts(siteId),
    queryFn: () => getAlerts(siteId),
    enabled: !!siteId,
  });
}

// ─── 알림 읽음 처리 ──────────────────────────────────────────────────────────

export function useMarkAlertRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markAlertRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ATTENDANCE_KEYS.all });
    },
    onError: () => {
      toast.error("알림 읽음 처리에 실패했습니다.");
    },
  });
}

// ─── 사유 처리 ───────────────────────────────────────────────────────────────

export function useUpdateAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateAttendanceDto }) =>
      updateAttendance({ id, dto }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ATTENDANCE_KEYS.all });
      toast.success("사유 처리가 완료되었습니다.");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      const msg = error?.response?.data?.message;
      toast.error(msg ?? "사유 처리에 실패했습니다.");
    },
  });
}

// ─── 수동 출근 입력 ──────────────────────────────────────────────────────────

export function useManualCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: ManualCheckInDto) => manualCheckIn(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ATTENDANCE_KEYS.all });
      toast.success("출근이 입력되었습니다.");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      const msg = error?.response?.data?.message;
      toast.error(msg ?? "출근 입력에 실패했습니다.");
    },
  });
}

// ─── 수동 퇴근 입력 ──────────────────────────────────────────────────────────

export function useManualCheckOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: ManualCheckOutDto) => manualCheckOut(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ATTENDANCE_KEYS.all });
      toast.success("퇴근이 입력되었습니다.");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      const msg = error?.response?.data?.message;
      toast.error(msg ?? "퇴근 입력에 실패했습니다.");
    },
  });
}
