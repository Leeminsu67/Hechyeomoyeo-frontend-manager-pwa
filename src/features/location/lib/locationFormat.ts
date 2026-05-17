import type {
  LocationPingPayload,
  LocationSocketStatus,
  WorkerLocationStatus,
} from "../types/location.types";
import { getLocationLastReceivedAt } from "./locationState";

export const LOCATION_STALE_MS = 10 * 60 * 1000;

export function formatLocationTime(value: string | null | undefined) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

export function resolveWorkerLocationStatus(
  location: LocationPingPayload,
): WorkerLocationStatus {
  if (location.isOutOfZone === true) return "outOfZone";

  const last = getLocationLastReceivedAt(location);
  if (!last) return "missing";

  const lastTime = new Date(last).getTime();
  if (Number.isNaN(lastTime)) return "missing";
  if (Date.now() - lastTime > LOCATION_STALE_MS) return "missing";
  if (location.isStale === true) return "missing";
  if (location.accuracyStatus === "low") return "lowAccuracy";

  return "online";
}

export function getLocationStatusLabel(location: LocationPingPayload) {
  const status = resolveWorkerLocationStatus(location);
  if (status === "outOfZone") return "구역 이탈";
  if (status === "missing") return "미수신";
  if (status === "lowAccuracy") return "정확도 낮음";
  return "정상";
}

export function getLocationStatusClass(location: LocationPingPayload) {
  const status = resolveWorkerLocationStatus(location);
  if (status === "outOfZone") {
    return "bg-danger/25 text-danger-foreground border-danger/40";
  }
  if (status === "missing") {
    return "bg-muted text-muted-foreground border-border";
  }
  if (status === "lowAccuracy") {
    return "bg-secondary/30 text-secondary-foreground border-secondary/50";
  }
  return "bg-success/20 text-success-foreground border-success/40";
}

export function getAttendanceStatusLabel(status: string | null) {
  if (!status) return "-";
  const labels: Record<string, string> = {
    present: "출근 중",
    late: "지각",
    earlyLeave: "조퇴",
    absent: "결근",
    excused: "사유 처리",
  };
  return labels[status] ?? status;
}

export function getAssignmentTypeLabel(type: string | null) {
  if (!type) return "배정 정보 없음";
  const labels: Record<string, string> = {
    siteSupervisor: "현장 관리자",
    regularWorker: "일반 인력",
    substituteWorker: "대체 인력",
  };
  return labels[type] ?? type;
}

export function getSocketStatusLabel(status: LocationSocketStatus) {
  if (status === "connected") return "연결됨";
  if (status === "connecting") return "연결 중";
  if (status === "auth-error") return "인증 오류";
  if (status === "connect-error") return "연결 실패";
  if (status === "disconnected") return "연결 끊김";
  return "대기";
}

export function toDatetimeLocalValue(date: Date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export function fromDatetimeLocalValue(value: string) {
  return new Date(value).toISOString();
}
