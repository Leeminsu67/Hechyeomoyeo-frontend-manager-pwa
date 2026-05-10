"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { LocationPingPayload } from "../types/location.types";
import { getLocationStatusLabel } from "../lib/locationFormat";
import {
  createLocationOverlayContent,
  DEFAULT_LOCATION_CENTER,
  getKakaoLocation,
  type KakaoCustomOverlay,
} from "../lib/locationMapKakao";
import { LocationCoordinateFallback } from "./LocationCoordinateFallback";

export function LocationMap({
  locations,
  selectedUserId,
  onSelectLocation,
}: {
  locations: LocationPingPayload[];
  selectedUserId: string | null;
  onSelectLocation: (location: LocationPingPayload) => void;
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const overlaysRef = useRef<KakaoCustomOverlay[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;

  const center = useMemo(
    () =>
      locations[0] ?? {
        latitude: DEFAULT_LOCATION_CENTER.lat,
        longitude: DEFAULT_LOCATION_CENTER.lng,
      },
    [locations],
  );

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

    const centerLatLng = new kakao.maps.LatLng(center.latitude, center.longitude);
    if (!mapRef.current) {
      mapRef.current = new kakao.maps.Map(mapContainerRef.current, {
        center: centerLatLng,
        level: locations.length > 1 ? 6 : 4,
      });
    } else {
      mapRef.current.setCenter(centerLatLng);
    }

    overlaysRef.current.forEach((overlay) => overlay.setMap(null));
    overlaysRef.current = locations.map((location) => {
      const latlng = new kakao.maps.LatLng(location.latitude, location.longitude);
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
  }, [center.latitude, center.longitude, isLoaded, locations, onSelectLocation]);

  if (!kakaoKey) {
    return (
      <LocationCoordinateFallback
        locations={locations}
        selectedUserId={selectedUserId}
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
      {locations.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="rounded-lg bg-surface/95 px-4 py-3 text-sm font-semibold text-muted-foreground shadow-card">
            표시할 위치 마커가 없습니다.
          </p>
        </div>
      )}
      <div className="absolute bottom-3 left-3 rounded-lg bg-surface/95 px-3 py-2 text-xs text-muted-foreground shadow-card">
        {selectedUserId
          ? getLocationStatusLabel(
              locations.find((item) => item.userId === selectedUserId) ?? locations[0],
            )
          : `${locations.length}명 표시 중`}
      </div>
    </div>
  );
}
