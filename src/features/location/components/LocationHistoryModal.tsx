"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModalPortal } from "@/components/shared/ModalPortal";
import type { LocationPingPayload } from "../types/location.types";
import { useLocationHistory } from "../hooks/useSiteLatestLocations";
import {
  formatLocationTime,
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
} from "../lib/locationFormat";

export function LocationHistoryModal({
  siteId,
  location,
  onClose,
}: {
  siteId: string | null;
  location: LocationPingPayload | null;
  onClose: () => void;
}) {
  const now = useMemo(() => new Date(), []);
  const yesterday = useMemo(() => new Date(now.getTime() - 24 * 60 * 60 * 1000), [now]);
  const [from, setFrom] = useState(() => toDatetimeLocalValue(yesterday));
  const [to, setTo] = useState(() => toDatetimeLocalValue(now));

  const params =
    siteId && location
      ? {
          siteId,
          userId: location.userId,
          from: fromDatetimeLocalValue(from),
          to: fromDatetimeLocalValue(to),
        }
      : null;
  const { data = [], isLoading, isError, refetch } = useLocationHistory(
    params,
    !!location,
  );

  if (!location) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-black/30" onClick={onClose} />
        <section className="absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col overflow-hidden rounded-t-2xl border border-border bg-surface shadow-card sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:w-[560px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg">
          <div className="flex h-16 items-center justify-between border-b border-border px-4">
            <div>
              <h2 className="text-base font-bold text-text-strong">
                {location.userName} 위치 이력
              </h2>
              <p className="text-xs text-muted-foreground">최근 24시간 기준</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
              aria-label="위치 이력 닫기"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2 border-b border-border p-4 sm:grid-cols-[1fr_1fr_auto]">
            <input
              type="datetime-local"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              className="h-11 rounded-lg border border-border bg-surface px-3 text-sm"
            />
            <input
              type="datetime-local"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              className="h-11 rounded-lg border border-border bg-surface px-3 text-sm"
            />
            <Button type="button" variant="outline" onClick={() => refetch()}>
              조회
            </Button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="h-14 animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
            ) : isError ? (
              <p className="py-12 text-center text-sm font-semibold text-danger-foreground">
                위치 이력을 불러오지 못했습니다.
              </p>
            ) : data.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                조회된 위치 이력이 없습니다.
              </p>
            ) : (
              <div className="space-y-2">
                {data.map((item) => (
                  <div
                    key={`${item.userId}-${item.recordedAt}`}
                    className="rounded-lg border border-border px-3 py-2"
                  >
                    <p className="text-sm font-bold text-text-strong">
                      {formatLocationTime(item.recordedAt)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.latitude.toFixed(6)}, {item.longitude.toFixed(6)}
                      {item.accuracy != null && ` · 정확도 ${Math.round(item.accuracy)}m`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </ModalPortal>
  );
}
