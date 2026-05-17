"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useScheduleSiteOptions } from "@/features/duty/hooks/useSchedules";
import { useSite } from "@/features/site/hooks/useSites";
import { ROLE } from "@/types/user";
import type { LocationPingPayload } from "../types/location.types";
import { resolveWorkerLocationStatus } from "../lib/locationFormat";
import {
  getInitialSiteId,
  getLocationKey,
  isSameLocationIdentity,
  upsertLocation,
} from "../lib/locationState";
import { useAdminLocationSocket } from "../hooks/useAdminLocationSocket";
import { useSiteLatestLocations } from "../hooks/useSiteLatestLocations";
import { LocationConnectionStatus } from "./LocationConnectionStatus";
import { LocationHistoryModal } from "./LocationHistoryModal";
import { LocationMap } from "./LocationMap";
import { LocationPageHeader } from "./LocationPageHeader";
import { LocationStatusList } from "./LocationStatusList";

function getHttpStatus(error: unknown) {
  if (typeof error !== "object" || error === null) return null;
  const response = (error as { response?: { status?: number } }).response;
  return response?.status ?? null;
}

function toMapCenter(
  value: { latitude?: number | null; longitude?: number | null } | null | undefined,
) {
  if (
    typeof value?.latitude === "number" &&
    Number.isFinite(value.latitude) &&
    typeof value.longitude === "number" &&
    Number.isFinite(value.longitude)
  ) {
    return { latitude: value.latitude, longitude: value.longitude };
  }
  return null;
}

export function LocationPage({ initialSiteId }: { initialSiteId?: string }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const role = useAuthStore((state) => state.user?.role);
  const currentRole = Number(role);
  const canAccessRealtime =
    Number.isFinite(currentRole) && currentRole <= ROLE.MANAGER;
  const canViewHistory =
    Number.isFinite(currentRole) && currentRole <= ROLE.HR_MANAGER;
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [locations, setLocations] = useState<LocationPingPayload[]>([]);
  const [selectedLocation, setSelectedLocation] =
    useState<LocationPingPayload | null>(null);
  const [historyTarget, setHistoryTarget] =
    useState<LocationPingPayload | null>(null);
  const [statusTick, setStatusTick] = useState(0);

  const { data: siteOptionsData, isLoading: sitesLoading } =
    useScheduleSiteOptions(canAccessRealtime);
  const { data: selectedSiteDetail } = useSite(
    canAccessRealtime ? selectedSiteId ?? "" : "",
  );
  const sites = useMemo(
    () => siteOptionsData?.data.sites ?? [],
    [siteOptionsData],
  );
  const selectedSite = sites.find((site) => site.id === selectedSiteId) ?? null;
  const {
    data: latestLocations,
    isLoading: latestLoading,
    isError: latestError,
    error: latestErrorObject,
    refetch: refetchLatest,
  } = useSiteLatestLocations(selectedSiteId, canAccessRealtime);
  const latestForbidden = getHttpStatus(latestErrorObject) === 403;

  const summary = useMemo(() => {
    void statusTick;

    const counts = {
      total: locations.length,
      online: 0,
      missing: 0,
      permissionDenied: 0,
      consentMissing: 0,
    };

    for (const location of locations) {
      const status = resolveWorkerLocationStatus(location);
      if (status === "online") counts.online += 1;
      if (status === "missing") counts.missing += 1;
      if (status === "permissionDenied") counts.permissionDenied += 1;
      if (status === "consentMissing") counts.consentMissing += 1;
    }

    return counts;
  }, [locations, statusTick]);

  const mapCenter = useMemo(() => {
    const siteCenter = toMapCenter(selectedSiteDetail);
    if (siteCenter) return siteCenter;

    const zoneCenter = locations.find(
      (location) =>
        typeof location.zone?.latitude === "number" &&
        typeof location.zone?.longitude === "number",
    )?.zone;
    return toMapCenter(zoneCenter);
  }, [locations, selectedSiteDetail]);

  useEffect(() => {
    if (sites.length === 0 || selectedSiteId) return;
    setSelectedSiteId(getInitialSiteId(sites, initialSiteId));
  }, [initialSiteId, selectedSiteId, sites]);

  useEffect(() => {
    setLocations([]);
    setSelectedLocation(null);
    setHistoryTarget(null);
  }, [selectedSiteId]);

  useEffect(() => {
    if (!latestLocations) return;
    setLocations(latestLocations);
    setSelectedLocation((prev) => {
      if (!prev) return null;
      const prevKey = getLocationKey(prev);
      return (
        latestLocations.find(
          (location) =>
            getLocationKey(location) === prevKey ||
            isSameLocationIdentity(location, prev),
        ) ??
        null
      );
    });
  }, [latestLocations]);

  useEffect(() => {
    if (!selectedSiteId || !canAccessRealtime) return;

    const handleFocusRefresh = () => {
      if (document.visibilityState === "hidden") return;
      void refetchLatest();
    };

    window.addEventListener("focus", handleFocusRefresh);
    document.addEventListener("visibilitychange", handleFocusRefresh);

    return () => {
      window.removeEventListener("focus", handleFocusRefresh);
      document.removeEventListener("visibilitychange", handleFocusRefresh);
    };
  }, [canAccessRealtime, refetchLatest, selectedSiteId]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setStatusTick((tick) => tick + 1);
    }, 60_000);

    return () => window.clearInterval(timer);
  }, []);

  const handlePing = useCallback((payload: LocationPingPayload) => {
    setLocations((prev) => upsertLocation(prev, payload));
    setSelectedLocation((prev) =>
      prev &&
      (getLocationKey(prev) === getLocationKey(payload) ||
        isSameLocationIdentity(prev, payload))
        ? payload
        : prev,
    );
  }, []);

  const socketDebug = useAdminLocationSocket({
    accessToken: canAccessRealtime ? accessToken : null,
    selectedSiteId,
    onPing: handlePing,
  });

  const handleSiteSelect = (siteId: string) => {
    setSelectedSiteId(siteId);
  };

  if (!canAccessRealtime) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto flex max-w-screen-md flex-col items-center px-4 py-24 text-center">
          <div className="rounded-lg border border-border bg-surface px-6 py-8 shadow-card">
            <h1 className="text-xl font-bold text-text-strong">
              관리자 권한이 필요합니다.
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              일반 인력 계정은 실시간 위치 화면에 접근할 수 없습니다.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-screen-2xl px-4 py-6 sm:px-6 lg:px-8">
        <LocationPageHeader
          sites={sites}
          selectedSiteId={selectedSiteId}
          sitesLoading={sitesLoading}
          latestLoading={latestLoading}
          onSelectSite={handleSiteSelect}
          onRefresh={() => {
            void refetchLatest();
          }}
        />

        <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-lg border border-border bg-surface p-4 shadow-card">
            <p className="text-xs font-semibold text-muted-foreground">선택 현장</p>
            <p className="mt-1 text-lg font-bold text-text-strong">
              {selectedSite?.name ?? "현장을 선택해주세요"}
            </p>
          </div>
          <LocationConnectionStatus debug={socketDebug} summary={summary} />
        </div>

        {latestError && (
          <div className="mb-4 rounded-lg border border-danger/50 bg-danger/10 px-4 py-3 text-sm font-semibold text-danger-foreground">
            {latestForbidden
              ? "접근 권한이 없는 현장입니다."
              : "초기 위치 목록을 불러오지 못했습니다."}
          </div>
        )}

        {!sitesLoading && sites.length === 0 && (
          <div className="mb-4 rounded-lg border border-border bg-surface px-4 py-6 text-center text-sm font-semibold text-muted-foreground shadow-card">
            접근 가능한 현장이 없습니다.
          </div>
        )}

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
          <LocationMap
            locations={locations}
            selectedLocation={selectedLocation}
            center={mapCenter}
            onSelectLocation={setSelectedLocation}
          />
          <LocationStatusList
            locations={locations}
            selectedLocation={selectedLocation}
            canViewHistory={canViewHistory}
            onSelect={setSelectedLocation}
            onOpenHistory={setHistoryTarget}
          />
        </div>
      </div>

      {canViewHistory && (
        <LocationHistoryModal
          siteId={selectedSiteId}
          location={historyTarget}
          onClose={() => setHistoryTarget(null)}
        />
      )}
    </div>
  );
}
