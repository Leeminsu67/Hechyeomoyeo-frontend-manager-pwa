"use client";

import { useEffect, useState } from "react";
import { Bell, NotebookPen, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BaseModal } from "@/components/shared/BaseModal";
import type { LocationMemo, LocationPingPayload } from "../types/location.types";
import {
  formatLocationTime,
  getLocationStatusLabel,
  LOCATION_WORKER_CHECK_REQUEST_MESSAGE,
} from "../lib/locationFormat";
import {
  useCreateLocationMemo,
  useNotifyLocationWorker,
} from "../hooks/useSiteLatestLocations";

export function LocationActionModal({
  location,
  onClose,
}: {
  location: LocationPingPayload | null;
  onClose: () => void;
}) {
  const notifyWorker = useNotifyLocationWorker();
  const createMemo = useCreateLocationMemo();
  const [memo, setMemo] = useState("");
  const [savedMemos, setSavedMemos] = useState<LocationMemo[]>([]);
  const attendanceId = location?.attendanceId ?? null;
  const isSubmittingMemo = createMemo.isPending;
  const isSendingNotification = notifyWorker.isPending;

  useEffect(() => {
    setMemo("");
    setSavedMemos([]);
  }, [location?.attendanceId]);

  if (!location) return null;

  const handleNotifyWorker = async () => {
    if (!attendanceId) return;

    await notifyWorker.mutateAsync({
      attendanceId,
      dto: {
        type: "LOCATION_CHECK_REQUEST",
        message: LOCATION_WORKER_CHECK_REQUEST_MESSAGE,
      },
    });
  };

  const handleCreateMemo = async () => {
    if (!attendanceId) return;

    const savedMemo = await createMemo.mutateAsync({
      attendanceId,
      dto: { memo: memo.trim() },
    });
    if (savedMemo) {
      setSavedMemos((prev) => [savedMemo, ...prev]);
    }
    setMemo("");
  };

  return (
    <BaseModal
      open={!!location}
      onClose={onClose}
      maxWidth="max-w-lg"
      panelClassName="overflow-hidden"
    >
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        <div className="min-w-0">
          <h2 className="truncate text-base font-bold text-text-strong">
            {location.workerName} 위치 조치
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {getLocationStatusLabel(location)}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
          aria-label="위치 조치 닫기"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-4 p-4">
        {!attendanceId && (
          <div className="rounded-lg border border-secondary/50 bg-secondary/10 px-3 py-2 text-xs leading-5 text-secondary-foreground">
            근무 식별자가 없어 알림 발송과 메모 저장을 사용할 수 없습니다.
          </div>
        )}

        <section className="rounded-lg border border-border p-3">
          <div className="flex items-start gap-2">
            <Bell className="mt-0.5 h-4 w-4 shrink-0 text-primary-foreground" />
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-text-strong">
                근무자 알림 발송
              </h3>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {LOCATION_WORKER_CHECK_REQUEST_MESSAGE}
              </p>
              <Button
                type="button"
                className="mt-3 w-full sm:w-auto"
                disabled={!attendanceId || isSendingNotification}
                onClick={() => {
                  void handleNotifyWorker();
                }}
              >
                <Bell className="h-4 w-4" />
                알림 발송
              </Button>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-border p-3">
          <div className="flex items-start gap-2">
            <NotebookPen className="mt-0.5 h-4 w-4 shrink-0 text-primary-foreground" />
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-text-strong">관리자 메모</h3>
              <textarea
                value={memo}
                onChange={(event) => setMemo(event.target.value)}
                placeholder="확인 내용을 입력하세요."
                className="mt-2 min-h-28 w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
              />
              <Button
                type="button"
                variant="outline"
                className="mt-3 w-full sm:w-auto"
                disabled={!attendanceId || !memo.trim() || isSubmittingMemo}
                onClick={() => {
                  void handleCreateMemo();
                }}
              >
                <NotebookPen className="h-4 w-4" />
                메모 저장
              </Button>
            </div>
          </div>
        </section>

        {savedMemos.length > 0 && (
          <section className="rounded-lg border border-border p-3">
            <h3 className="text-sm font-bold text-text-strong">저장된 메모</h3>
            <div className="mt-2 space-y-2">
              {savedMemos.map((item, index) => (
                <div
                  key={item.id ?? `${item.createdAt ?? "memo"}-${index}`}
                  className="rounded-lg bg-muted px-3 py-2"
                >
                  <p className="text-xs font-semibold text-muted-foreground">
                    {item.author ?? "관리자"} ·{" "}
                    {formatLocationTime(item.createdAt)}
                  </p>
                  <p className="mt-1 text-sm leading-5 text-text">{item.memo}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </BaseModal>
  );
}
