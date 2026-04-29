"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Search, MapPin, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Kakao Maps Global Type Declarations ──────────────────────────────────────

interface KakaoMapsSDK {
  maps: {
    load: (callback: () => void) => void;
    Map: new (container: HTMLElement, options: KakaoMapOptions) => KakaoMap;
    LatLng: new (lat: number, lng: number) => KakaoLatLng;
    Marker: new (options: {
      position: KakaoLatLng;
      map?: KakaoMap;
    }) => KakaoMarker;
    event: {
      addListener: (
        target: KakaoMap,
        type: string,
        handler: (event: KakaoMouseEvent) => void
      ) => void;
    };
    services: {
      Geocoder: new () => KakaoGeocoder;
      Status: { OK: string };
    };
  };
}

const getKakao = (): KakaoMapsSDK | undefined => (window as Window & { kakao?: KakaoMapsSDK }).kakao;

declare global {
  interface KakaoMapOptions {
    center: KakaoLatLng;
    level: number;
  }
  interface KakaoMap {
    setCenter(latlng: KakaoLatLng): void;
    setLevel(level: number): void;
  }
  interface KakaoLatLng {
    getLat(): number;
    getLng(): number;
  }
  interface KakaoMarker {
    setPosition(latlng: KakaoLatLng): void;
    setMap(map: KakaoMap | null): void;
  }
  interface KakaoMouseEvent {
    latLng: KakaoLatLng;
  }
  interface KakaoGeocoderResult {
    x: string;
    y: string;
    address_name: string;
  }
  interface KakaoRoadAddress {
    address_name: string;
  }
  interface KakaoAddress {
    address_name: string;
  }
  interface KakaoGeocoder {
    addressSearch(
      address: string,
      callback: (result: KakaoGeocoderResult[], status: string) => void
    ): void;
    coord2Address(
      lng: number,
      lat: number,
      callback: (
        result: Array<{ road_address: KakaoRoadAddress | null; address: KakaoAddress }>,
        status: string
      ) => void
    ): void;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

interface KakaoMapPickerProps {
  initialLat?: number;
  initialLng?: number;
  initialAddress?: string;
  onLocationChange: (lat: number, lng: number, address: string) => void;
}

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 }; // Seoul City Hall

export function KakaoMapPicker({
  initialLat,
  initialLng,
  initialAddress = "",
  onLocationChange,
}: KakaoMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const markerRef = useRef<KakaoMarker | null>(null);
  const geocoderRef = useRef<KakaoGeocoder | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialAddress);
  const [selectedAddress, setSelectedAddress] = useState(initialAddress);
  const [searchError, setSearchError] = useState("");

  const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;

  // ─ Load Kakao Maps SDK ──────────────────────────────────────────────────
  useEffect(() => {
    if (!kakaoKey) return;

    const kakao = getKakao();
    if (kakao?.maps) {
      kakao.maps.load(() => setIsLoaded(true));
      return;
    }

    const existingScript = document.getElementById("kakao-maps-sdk");
    if (existingScript) {
      existingScript.addEventListener("load", () => {
        getKakao()?.maps.load(() => setIsLoaded(true));
      });
      return;
    }

    const script = document.createElement("script");
    script.id = "kakao-maps-sdk";
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoKey}&libraries=services&autoload=false`;
    script.onload = () => {
      getKakao()?.maps.load(() => setIsLoaded(true));
    };
    document.head.appendChild(script);
  }, [kakaoKey]);

  // ─ Reverse geocode a lat/lng to a human-readable address ────────────────
  const reverseGeocode = useCallback(
    (lat: number, lng: number) => {
      if (!geocoderRef.current) return;
      const kakao = getKakao();
      geocoderRef.current.coord2Address(lng, lat, (result, status) => {
        if (status === kakao?.maps.services.Status.OK && result[0]) {
          const addr =
            result[0].road_address?.address_name ?? result[0].address.address_name;
          setSelectedAddress(addr);
          onLocationChange(lat, lng, addr);
        } else {
          setSelectedAddress("");
          onLocationChange(lat, lng, "");
        }
      });
    },
    [onLocationChange]
  );

  // ─ Initialize Map ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoaded || !mapContainerRef.current) return;
    const kakao = getKakao();
    if (!kakao) return;

    geocoderRef.current = new kakao.maps.services.Geocoder();

    const centerLat = initialLat ?? DEFAULT_CENTER.lat;
    const centerLng = initialLng ?? DEFAULT_CENTER.lng;
    const center = new kakao.maps.LatLng(centerLat, centerLng);

    const map = new kakao.maps.Map(mapContainerRef.current, {
      center,
      level: initialLat ? 4 : 7,
    });
    mapRef.current = map;

    const marker = new kakao.maps.Marker({ position: center, map });
    markerRef.current = marker;

    if (!initialLat) marker.setMap(null);

    kakao.maps.event.addListener(map, "click", (event: KakaoMouseEvent) => {
      const latlng = event.latLng;
      const lat = latlng.getLat();
      const lng = latlng.getLng();
      marker.setMap(map);
      marker.setPosition(latlng);
      map.setCenter(latlng);
      reverseGeocode(lat, lng);
    });
  }, [isLoaded, initialLat, initialLng, reverseGeocode]);

  // ─ Address Search ────────────────────────────────────────────────────────
  const handleSearch = useCallback(() => {
    if (!isLoaded || !searchQuery.trim() || !geocoderRef.current) return;
    setSearchError("");
    const kakao = getKakao();

    geocoderRef.current.addressSearch(searchQuery, (result, status) => {
      if (status === kakao?.maps.services.Status.OK && result[0]) {
        const lat = parseFloat(result[0].y);
        const lng = parseFloat(result[0].x);
        const addr = result[0].address_name;

        if (markerRef.current && mapRef.current && kakao) {
          const latlng = new kakao.maps.LatLng(lat, lng);
          markerRef.current.setMap(mapRef.current);
          markerRef.current.setPosition(latlng);
          mapRef.current.setCenter(latlng);
          mapRef.current.setLevel(4);
        }

        setSelectedAddress(addr);
        setSearchQuery(addr);
        onLocationChange(lat, lng, addr);
      } else {
        setSearchError("주소를 찾을 수 없습니다. 다시 입력해주세요.");
      }
    });
  }, [isLoaded, searchQuery, onLocationChange]);

  // ─ No API key ───────────────────────────────────────────────────────────
  if (!kakaoKey) {
    return (
      <div className="w-full h-52 bg-muted/40 border border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <div className="p-3 bg-muted rounded-xl">
          <MapPin className="w-6 h-6" />
        </div>
        <div className="text-center px-4">
          <p className="text-sm font-medium text-text">카카오맵 설정 필요</p>
          <p className="text-xs mt-1">
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
              NEXT_PUBLIC_KAKAO_MAP_KEY
            </code>{" "}
            환경변수를 설정해주세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Search Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (searchError) setSearchError("");
          }}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="주소 검색 (예: 경남 김해시 삼방동 123)"
          className={cn(
            "flex-1 px-3 py-2.5 border rounded-xl text-sm bg-surface text-text placeholder:text-muted-foreground focus:outline-none focus:ring-1 transition-colors",
            searchError
              ? "border-danger/60 focus:border-danger focus:ring-danger/30"
              : "border-border focus:border-primary focus:ring-primary/30"
          )}
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={!isLoaded}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          <Search className="w-4 h-4" />
          검색
        </button>
      </div>

      {searchError && (
        <div className="flex items-center gap-2 text-danger-foreground text-xs">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {searchError}
        </div>
      )}

      {/* Map Container */}
      <div
        ref={mapContainerRef}
        className="w-full h-60 rounded-xl border border-border overflow-hidden bg-muted/30 relative"
      >
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-xs">지도 로딩 중…</p>
            </div>
          </div>
        )}
      </div>

      {/* Selected Location */}
      {selectedAddress ? (
        <div className="flex items-start gap-2 px-3 py-2.5 bg-primary/10 border border-primary/20 rounded-xl">
          <MapPin className="w-4 h-4 text-primary-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-text leading-relaxed">{selectedAddress}</p>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          지도를 클릭하여 위치를 선택하세요. (필수)
        </p>
      )}
    </div>
  );
}
