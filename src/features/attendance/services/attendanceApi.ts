import apiClient from "@/lib/axios";
import type {
  AttendanceListResponse,
  AttendanceSummaryResponse,
  SiteSummariesResponse,
  MonthlyReportResponse,
  AlertListResponse,
  AttendanceAlert,
  AttendanceRecord,
  UpdateAttendanceDto,
  ManualCheckInDto,
  ManualCheckOutDto,
} from "@/types/attendance";

// ─── 전체 현장 출결 요약 (단일 호출) ────────────────────────────────────────

export const getSiteSummaries = async (
  date: string
): Promise<SiteSummariesResponse> => {
  const response = await apiClient.get("/attendance/site-summaries", {
    params: { date },
  });
  return response.data;
};

// ─── 현장별 출결 현황 요약 (단일 현장) ──────────────────────────────────────

export const getAttendanceSummary = async (
  siteId: string,
  date: string
): Promise<AttendanceSummaryResponse> => {
  const response = await apiClient.get("/attendance/status-summary", {
    params: { siteId, startDate: date, endDate: date },
  });
  return response.data;
};

// ─── 출퇴근 기록 조회 ────────────────────────────────────────────────────────

export const getAttendances = async (
  siteId: string,
  date: string
): Promise<AttendanceListResponse> => {
  const response = await apiClient.get("/attendance", {
    params: { siteId, date },
  });
  return response.data;
};

// ─── 월간 리포트 ─────────────────────────────────────────────────────────────

export const getMonthlyReport = async (
  siteId: string,
  month: string
): Promise<MonthlyReportResponse> => {
  const response = await apiClient.get("/attendance/report", {
    params: { siteId, month },
  });
  return response.data;
};

// ─── 이상 알림 목록 ──────────────────────────────────────────────────────────

export const getAlerts = async (siteId: string): Promise<AlertListResponse> => {
  const response = await apiClient.get("/attendance/alerts", {
    params: { siteId },
  });
  return response.data;
};

// ─── 알림 읽음 처리 ──────────────────────────────────────────────────────────

export const markAlertRead = async (id: string): Promise<AttendanceAlert> => {
  const response = await apiClient.patch(`/attendance/alerts/${id}/read`);
  return response.data.data.alert;
};

// ─── 수동 출근 입력 ─────────────────────────────────────────────────────────

export const manualCheckIn = async (dto: ManualCheckInDto): Promise<AttendanceRecord> => {
  const response = await apiClient.post("/attendance/check-in", dto);
  return response.data.data;
};

// ─── 수동 퇴근 입력 ─────────────────────────────────────────────────────────

export const manualCheckOut = async (dto: ManualCheckOutDto): Promise<AttendanceRecord> => {
  const response = await apiClient.post("/attendance/check-out", dto);
  return response.data.data;
};

// ─── 사유 처리 (출결 상태 변경) ──────────────────────────────────────────────

export const updateAttendance = async ({
  id,
  dto,
}: {
  id: string;
  dto: UpdateAttendanceDto;
}): Promise<AttendanceRecord> => {
  const response = await apiClient.patch(`/attendance/${id}`, dto);
  return response.data.data.attendance;
};
