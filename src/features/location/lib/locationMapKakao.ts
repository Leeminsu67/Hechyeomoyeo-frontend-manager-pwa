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
    "flex cursor-pointer flex-col items-center border-0 bg-transparent p-0 text-xs font-bold text-text-strong";

  const card = document.createElement("span");
  card.className =
    "block min-w-[96px] max-w-[150px] rounded-lg border border-border bg-surface px-2 py-1.5 shadow-card";

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

  const tail = document.createElement("span");
  tail.style.cssText = [
    "position:relative",
    "display:block",
    "width:16px",
    "height:10px",
    "margin-top:-1px",
  ].join(";");

  const tailBorder = document.createElement("span");
  tailBorder.style.cssText = [
    "position:absolute",
    "left:0",
    "top:0",
    "width:0",
    "height:0",
    "border-left:8px solid transparent",
    "border-right:8px solid transparent",
    "border-top:10px solid rgba(0,0,0,0.16)",
  ].join(";");

  const tailFill = document.createElement("span");
  tailFill.style.cssText = [
    "position:absolute",
    "left:1px",
    "top:0",
    "width:0",
    "height:0",
    "border-left:7px solid transparent",
    "border-right:7px solid transparent",
    "border-top:9px solid #FFFFFF",
  ].join(";");

  row.append(dot, name, status);
  card.append(row);
  tail.append(tailBorder, tailFill);
  element.append(card, tail);
  return element;
}
