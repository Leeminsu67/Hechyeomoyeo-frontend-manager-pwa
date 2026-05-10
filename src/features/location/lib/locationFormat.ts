import type { LocationPingPayload, LocationSocketStatus } from "../types/location.types";

export function formatLocationTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

export function getLocationStatusLabel(location: LocationPingPayload) {
  if (location.isOutOfZone === true) return "현장 이탈";
  if (location.isStale) return "위치 미수신";
  return "정상";
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
