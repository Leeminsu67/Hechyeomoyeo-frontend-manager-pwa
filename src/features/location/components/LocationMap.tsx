"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { LocationPingPayload } from "../types/location.types";
import {
  formatLocationTime,
  getAttendanceStatusLabel,
  getLocationStatusLabel,
} from "../lib/locationFormat";
import { hasLocationCoordinates } from "../lib/locationState";
import {
  createLocationOverlayContent,
  DEFAULT_LOCATION_CENTER,
  getKakaoLocation,
  type KakaoCustomOverlay,
} from "../lib/locationMapKakao";
import { LocationCoordinateFallback } from "./LocationCoordinateFallback";

export function LocationMap({
  locations,
  selectedLocation,
  center,
  onSelectLocation,
}: {
  locations: LocationPingPayload[];
  selectedLocation: LocationPingPayload | null;
  center?: { latitude: number; longitude: number } | null;
  onSelectLocation: (location: LocationPingPayload) => void;
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const overlaysRef = useRef<KakaoCustomOverlay[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;

  const markerLocations = useMemo(
    () => locations.filter(hasLocationCoordinates),
    [locations],
  );
  const listOnlyCount = locations.length - markerLocations.length;
  const mapCenter = useMemo(() => {
    const firstMarker = markerLocations[0];
    if (firstMarker) {
      return { latitude: firstMarker.latitude, longitude: firstMarker.longitude };
    }
    if (center) return center;

    const zoneCenter = locations.find(
      (location) =>
        typeof location.zone?.latitude === "number" &&
        typeof location.zone?.longitude === "number",
    )?.zone;
    if (zoneCenter?.latitude != null && zoneCenter.longitude != null) {
      return { latitude: zoneCenter.latitude, longitude: zoneCenter.longitude };
    }

    return {
      latitude: DEFAULT_LOCATION_CENTER.lat,
      longitude: DEFAULT_LOCATION_CENTER.lng,
    };
  }, [center, locations, markerLocations]);

  useEffect(() => {
    if (!kakaoKey) return;
    const kakao = getKakaoLocation();
    if (kakao?.maps) {
      kakao.maps.load(() => setIsLoaded(true));
      return;
    }

    const existing = document.getElementById("kakao-maps-sdk");
    if (existing) {
      existing.addEventListener("load", () => {
        getKakaoLocation()?.maps.load(() => setIsLoaded(true));
      });
      return;
    }

    const script = document.createElement("script");
    script.id = "kakao-maps-sdk";
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoKey}&libraries=services&autoload=false`;
    script.onload = () => getKakaoLocation()?.maps.load(() => setIsLoaded(true));
    document.head.appendChild(script);
  }, [kakaoKey]);

  useEffect(() => {
    if (!isLoaded || !mapContainerRef.current) return;
    const kakao = getKakaoLocation();
    if (!kakao) return;

    const centerLatLng = new kakao.maps.LatLng(
      mapCenter.latitude,
      mapCenter.longitude,
    );
    if (!mapRef.current) {
      mapRef.current = new kakao.maps.Map(mapContainerRef.current, {
        center: centerLatLng,
        level: markerLocations.length > 1 ? 6 : 4,
      });
    } else {
      mapRef.current.setCenter(centerLatLng);
    }

    overlaysRef.current.forEach((overlay) => overlay.setMap(null));
    overlaysRef.current = markerLocations.map((location) => {
      const latlng = new kakao.maps.LatLng(
        location.latitude,
        location.longitude,
      );
      const content = createLocationOverlayContent(location);
      content.onclick = () => onSelectLocation(location);
      return new kakao.maps.CustomOverlay({
        position: latlng,
        content,
        yAnchor: 1,
        map: mapRef.current ?? undefined,
      });
    });

    return () => {
      overlaysRef.current.forEach((overlay) => overlay.setMap(null));
      overlaysRef.current = [];
    };
  }, [
    isLoaded,
    mapCenter.latitude,
    mapCenter.longitude,
    markerLocations,
    onSelectLocation,
  ]);

  if (!kakaoKey) {
    return (
      <LocationCoordinateFallback
        locations={markerLocations}
        selectedLocation={selectedLocation}
        onSelect={onSelectLocation}
      />
    );
  }

  return (
    <div className="relative h-[420px] overflow-hidden rounded-lg border border-border bg-muted/30">
      <div ref={mapContainerRef} className="h-full w-full" />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/40">
          <p className="text-sm font-semibold text-muted-foreground">지도 로딩 중</p>
        </div>
      )}
      {markerLocations.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="rounded-lg bg-surface/95 px-4 py-3 text-sm font-semibold text-muted-foreground shadow-card">
            표시할 위치 마커가 없습니다.
          </p>
        </div>
      )}
      {selectedLocation && (
        <div className="absolute right-3 top-3 w-[min(320px,calc(100%-24px))] rounded-lg border border-border bg-surface/95 p-3 text-xs shadow-card">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-text-strong">
                {selectedLocation.workerName}
              </p>
              <p className="mt-0.5 text-muted-foreground">
                {getAttendanceStatusLabel(selectedLocation.attendanceStatus)}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
              {getLocationStatusLabel(selectedLocation)}
            </span>
          </div>
          <dl className="grid grid-cols-[86px_1fr] gap-x-2 gap-y-1 text-muted-foreground">
            <dt>기록 시각</dt>
            <dd className="text-text">{formatLocationTime(selectedLocation.recordedAt)}</dd>
            <dt>수신 시각</dt>
            <dd className="text-text">
              {formatLocationTime(
                selectedLocation.lastReceivedAt ?? selectedLocation.receivedAt,
              )}
            </dd>
            <dt>정확도</dt>
            <dd className="text-text">
              {selectedLocation.accuracy == null
                ? "-"
                : `${Math.round(selectedLocation.accuracy)}m`}
            </dd>
            <dt>배터리</dt>
            <dd className="text-text">
              {selectedLocation.battery == null
                ? "-"
                : `${Math.round(selectedLocation.battery)}%`}
            </dd>
          </dl>
        </div>
      )}
      <div className="absolute bottom-3 left-3 rounded-lg bg-surface/95 px-3 py-2 text-xs text-muted-foreground shadow-card">
        {selectedLocation
          ? getLocationStatusLabel(selectedLocation)
          : `${markerLocations.length}명 표시 중${
              listOnlyCount > 0 ? ` · 목록만 ${listOnlyCount}명` : ""
            }`}
      </div>
    </div>
  );
}
