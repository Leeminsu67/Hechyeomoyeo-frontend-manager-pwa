"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";

// Kakao Maps 전역 타입은 KakaoMapPicker.tsx에 선언되어 있음

interface KakaoMapViewerProps {
  lat: number;
  lng: number;
  /** 지도 컨테이너 높이 (기본값: h-52) */
  className?: string;
}

export function KakaoMapViewer({ lat, lng, className = "h-52" }: KakaoMapViewerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const markerRef = useRef<KakaoMarker | null>(null);
  const geocoderRef = useRef<KakaoGeocoder | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [address, setAddress] = useState<string>("");

  const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;

  // ─ SDK 로드 ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!kakaoKey) return;

    if (window.kakao?.maps) {
      window.kakao.maps.load(() => setIsLoaded(true));
      return;
    }

    const existing = document.getElementById("kakao-maps-sdk");
    if (existing) {
      existing.addEventListener("load", () => {
        window.kakao.maps.load(() => setIsLoaded(true));
      });
      return;
    }

    const script = document.createElement("script");
    script.id = "kakao-maps-sdk";
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoKey}&libraries=services&autoload=false`;
    script.onload = () => {
      window.kakao.maps.load(() => setIsLoaded(true));
    };
    document.head.appendChild(script);
  }, [kakaoKey]);

  // ─ 지도 초기화 + 역지오코딩 ─────────────────────────────────────────────
  useEffect(() => {
    if (!isLoaded || !mapContainerRef.current) return;

    const latlng = new window.kakao.maps.LatLng(lat, lng);

    if (mapRef.current) {
      mapRef.current.setCenter(latlng);
      markerRef.current?.setPosition(latlng);
    } else {
      const map = new window.kakao.maps.Map(mapContainerRef.current, {
        center: latlng,
        level: 4,
      });
      mapRef.current = map;

      const marker = new window.kakao.maps.Marker({ position: latlng, map });
      markerRef.current = marker;

      geocoderRef.current = new window.kakao.maps.services.Geocoder();
    }

    // 좌표 → 주소 역지오코딩
    if (geocoderRef.current) {
      geocoderRef.current.coord2Address(lng, lat, (result, status) => {
        if (status === window.kakao.maps.services.Status.OK && result[0]) {
          const addr =
            result[0].road_address?.address_name ?? result[0].address.address_name;
          setAddress(addr);
        } else {
          setAddress("");
        }
      });
    }
  }, [isLoaded, lat, lng]);

  if (!kakaoKey) {
    return (
      <div
        className={`w-full ${className} bg-muted/40 border border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground`}
      >
        <MapPin className="w-5 h-5" />
        <p className="text-xs text-center px-4">
          <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-xs">
            NEXT_PUBLIC_KAKAO_MAP_KEY
          </code>{" "}
          환경변수가 필요합니다.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        ref={mapContainerRef}
        className={`w-full ${className} rounded-xl border border-border overflow-hidden bg-muted/30 relative`}
      >
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-xs">지도 로딩 중…</p>
            </div>
          </div>
        )}
      </div>
      {address && (
        <div className="flex items-start gap-2 px-3 py-2 bg-primary/10 border border-primary/20 rounded-xl">
          <MapPin className="w-3.5 h-3.5 text-primary-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-text leading-relaxed">{address}</p>
        </div>
      )}
    </div>
  );
}
