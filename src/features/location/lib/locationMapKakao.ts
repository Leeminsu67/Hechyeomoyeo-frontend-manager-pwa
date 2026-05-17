import type { LocationPingPayload } from "../types/location.types";
import { getLocationStatusLabel, resolveWorkerLocationStatus } from "./locationFormat";

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

function markerColor(location: LocationPingPayload) {
  const status = resolveWorkerLocationStatus(location);
  if (status === "permissionDenied") return "#7A1C1C";
  if (status === "consentMissing") return "#6C757D";
  if (status === "missing") return "#7A4A10";
  return "#1A5C24";
}

export function createLocationOverlayContent(location: LocationPingPayload) {
  const element = document.createElement("button");
  element.type = "button";
  element.style.cssText = [
    "min-width:96px",
    "max-width:150px",
    "padding:6px 8px",
    "border-radius:8px",
    "border:1px solid rgba(0,0,0,0.12)",
    "box-shadow:0 4px 12px rgba(0,0,0,0.16)",
    "background:#FFFFFF",
    "font-size:12px",
    "font-weight:700",
    "color:#212529",
    "cursor:pointer",
  ].join(";");

  const row = document.createElement("div");
  row.style.cssText = "display:flex;align-items:center;gap:6px;";

  const dot = document.createElement("span");
  dot.style.cssText = `width:8px;height:8px;border-radius:999px;background:${markerColor(location)};flex-shrink:0;`;

  const name = document.createElement("span");
  name.style.cssText = "overflow:hidden;text-overflow:ellipsis;white-space:nowrap;";
  name.textContent = location.workerName;

  const status = document.createElement("span");
  status.style.cssText = "font-size:10px;color:#6C757D;white-space:nowrap;";
  status.textContent = getLocationStatusLabel(location);

  row.append(dot, name, status);
  element.append(row);
  return element;
}
