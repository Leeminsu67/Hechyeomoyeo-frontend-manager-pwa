import type {
  LocationPingPayload,
  LocationSocketStatus,
  WorkerLocationStatus,
} from "../types/location.types";
import { getLocationLastReceivedAt } from "./locationState";
import {
  LOCATION_ADMIN_DELAYED_MESSAGE,
  LOCATION_DELAYED_MS,
  LOCATION_INTERRUPTION_SUSPECTED_MS,
  LOCATION_LONG_MISSING_MS,
} from "./locationPolicy";

export {
  LOCATION_ADMIN_DELAYED_MESSAGE,
  LOCATION_DELAYED_MS,
  LOCATION_HISTORY_GAP_MS,
  LOCATION_INTERRUPTION_SUSPECTED_MS,
  LOCATION_LONG_MISSING_MS,
  LOCATION_MANAGER_FIRST_ALERT_MS,
  LOCATION_MANAGER_REPEAT_ALERT_MS,
  LOCATION_WORKER_CHECK_REQUEST_MESSAGE,
  LOCATION_WORKER_START_NOTICE,
} from "./locationPolicy";

export const LOCATION_STALE_MS = LOCATION_DELAYED_MS;

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

function normalizeStatusText(value: string | null | undefined) {
  return value?.trim().replace(/[-_\s]/g, "").toLowerCase() ?? "";
}

function isPermissionOff(location: LocationPingPayload) {
  const status = normalizeStatusText(location.locationPermissionStatus);
  const consent = normalizeStatusText(location.locationConsentStatus);
  const reason = normalizeStatusText(location.reason);

  return [status, consent, reason].some((value) =>
    [
      "denied",
      "blocked",
      "permissiondenied",
      "permissionoff",
      "consentmissing",
      "notauthorized",
    ].includes(value),
  );
}

function isNetworkPending(location: LocationPingPayload) {
  const status = normalizeStatusText(location.status);
  const reason = normalizeStatusText(location.reason);

  return [status, reason].some((value) =>
    ["networkpending", "networkunsent", "offlinepending"].includes(value),
  );
}

function isWorkEnded(location: LocationPingPayload) {
  const status = normalizeStatusText(location.attendanceStatus);
  return ["ended", "workended", "finished", "checkedout", "leave"].includes(status);
}

export function getLocationSilenceMs(location: LocationPingPayload) {
  const last = getLocationLastReceivedAt(location);
  if (!last) return null;

  const lastTime = new Date(last).getTime();
  if (Number.isNaN(lastTime)) return null;

  return Math.max(0, Date.now() - lastTime);
}

export function formatLocationDuration(durationMs: number) {
  const totalMinutes = Math.max(0, Math.floor(durationMs / 60_000));
  if (totalMinutes < 60) return `${totalMinutes}분`;

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? `${hours}시간 ${minutes}분` : `${hours}시간`;
}

export function resolveWorkerLocationStatus(
  location: LocationPingPayload,
): WorkerLocationStatus {
  const explicitStatus = location.locationSharingStatus;

  if (explicitStatus) return explicitStatus;
  if (isWorkEnded(location)) return "ended";
  if (isPermissionOff(location)) {
    return "permissionDenied";
  }
  if (isNetworkPending(location)) {
    return "networkPending";
  }

  const silenceMs = getLocationSilenceMs(location);
  if (silenceMs == null) {
    return "interruptionSuspected";
  }

  if (silenceMs >= LOCATION_LONG_MISSING_MS) return "longMissing";
  if (silenceMs >= LOCATION_INTERRUPTION_SUSPECTED_MS) {
    return "interruptionSuspected";
  }
  if (silenceMs >= LOCATION_DELAYED_MS || location.isStale === true) {
    return "delayed";
  }
  return "online";
}

export function getWorkerLocationStatusLabel(status: WorkerLocationStatus) {
  const labels: Record<WorkerLocationStatus, string> = {
    online: "정상 수신",
    delayed: "수신 지연",
    interruptionSuspected: "중단 의심",
    longMissing: "장기 미수신",
    permissionDenied: "위치 권한 꺼짐",
    networkPending: "네트워크 대기",
    ended: "근무 종료",
  };
  return labels[status];
}

export function getLocationStatusLabel(location: LocationPingPayload) {
  return getWorkerLocationStatusLabel(resolveWorkerLocationStatus(location));
}

export function getLocationStatusDescription(location: LocationPingPayload) {
  const status = resolveWorkerLocationStatus(location);
  if (status === "permissionDenied") {
    return "근무자의 위치 권한이 꺼져 있어 위치 정보를 받을 수 없습니다.";
  }
  if (status === "networkPending") {
    return "네트워크 미전송 상태입니다. 연결이 복구되면 위치 기록이 업로드될 수 있습니다.";
  }
  if (status === "ended") {
    return "근무가 종료되어 위치 수신을 마쳤습니다.";
  }
  if (
    status === "delayed" ||
    status === "interruptionSuspected" ||
    status === "longMissing"
  ) {
    return LOCATION_ADMIN_DELAYED_MESSAGE;
  }
  return "위치가 정상적으로 공유되고 있습니다.";
}

export function getLocationStatusClass(location: LocationPingPayload) {
  const status = resolveWorkerLocationStatus(location);
  if (status === "permissionDenied") {
    return "bg-danger/25 text-danger-foreground border-danger/40";
  }
  if (status === "longMissing" || status === "interruptionSuspected") {
    return "bg-danger/15 text-danger-foreground border-danger/40";
  }
  if (status === "delayed") {
    return "bg-secondary/30 text-secondary-foreground border-secondary/50";
  }
  if (status === "networkPending" || status === "ended") {
    return "bg-muted text-muted-foreground border-border";
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
