import type {
  LocationPingPayload,
  WorkerLocationStatus,
} from "../types/location.types";
import {
  getLocationStatusLabel,
  resolveWorkerLocationStatus,
} from "./locationFormat";

export interface KakaoLocationSDK {
  maps: {
    load: (callback: () => void) => void;
    Map: new (
      container: HTMLElement,
      options: { center: KakaoLatLng; level: number },
    ) => KakaoMap;
    LatLng: new (lat: number, lng: number) => KakaoLatLng;
    CustomOverlay: new (options: {
      position: KakaoLatLng;
      content: HTMLElement;
      yAnchor?: number;
      map?: KakaoMap;
    }) => KakaoCustomOverlay;
  };
}

export interface KakaoCustomOverlay {
  setMap(map: KakaoMap | null): void;
}

export const DEFAULT_LOCATION_CENTER = { lat: 37.5665, lng: 126.978 };

export const getKakaoLocation = (): KakaoLocationSDK | undefined =>
  (window as Window & { kakao?: KakaoLocationSDK }).kakao;

function markerDotClass(status: WorkerLocationStatus) {
  if (status === "permissionDenied") return "bg-danger";
  if (status === "interruptionSuspected" || status === "longMissing") {
    return "bg-danger";
  }
  if (status === "delayed") return "bg-secondary";
  if (status === "networkPending" || status === "ended") return "bg-muted";
  return "bg-success";
}

export function createLocationOverlayContent(location: LocationPingPayload) {
  const currentStatus = resolveWorkerLocationStatus(location);
  const element = document.createElement("button");
  element.type = "button";
  element.className =
    "min-w-[96px] max-w-[150px] cursor-pointer rounded-lg border border-border bg-surface px-2 py-1.5 text-xs font-bold text-text-strong shadow-card";

  const row = document.createElement("div");
  row.className = "flex items-center gap-1.5";

  const dot = document.createElement("span");
  dot.className = `h-2 w-2 shrink-0 rounded-full ${markerDotClass(
    currentStatus,
  )}`;

  const name = document.createElement("span");
  name.className = "truncate";
  name.textContent = location.workerName;

  const status = document.createElement("span");
  status.className = "whitespace-nowrap text-[10px] text-muted-foreground";
  status.textContent = getLocationStatusLabel(location);

  row.append(dot, name, status);
  element.append(row);
  return element;
}
