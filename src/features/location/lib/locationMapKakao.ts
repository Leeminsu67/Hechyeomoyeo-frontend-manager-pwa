import type { LocationPingPayload } from "../types/location.types";

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
  if (location.isOutOfZone === true) return "#7A1C1C";
  if (location.isStale) return "#7A4A10";
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
  element.innerHTML = `
    <div style="display:flex;align-items:center;gap:6px;">
      <span style="width:8px;height:8px;border-radius:999px;background:${markerColor(location)};flex-shrink:0;"></span>
      <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${location.userName}</span>
    </div>
  `;
  return element;
}
