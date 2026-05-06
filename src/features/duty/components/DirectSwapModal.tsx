"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, CalendarDays, X } from "lucide-react";
import { BaseModal } from "@/components/shared/BaseModal";
import { SelectDropdown } from "@/components/shared/SelectDropdown";
import { cn } from "@/lib/utils";
import { useCreateDirectSwapRequest } from "../hooks/useSwapRequests";
import type { CalendarScheduleItem, ScheduleWorker } from "@/types/schedule";

interface DirectSwapOption {
  value: string;
  scheduleId: string;
  user: ScheduleWorker;
  scheduleDate: string;
  zoneName: string;
}

function toDirectSwapOptions(schedules: CalendarScheduleItem[]): DirectSwapOption[] {
  return schedules.flatMap((schedule) => {
    if (!schedule.scheduleId || schedule.status !== 0) return [];
    return schedule.zone.workers.map((worker) => ({
      value: `${schedule.scheduleId}:${worker.id}`,
      scheduleId: schedule.scheduleId!,
      user: worker,
      scheduleDate: schedule.scheduleDate,
      zoneName: schedule.zone.name,
    }));
  });
}

function OptionPreview({
  option,
  title,
}: {
  option: DirectSwapOption | undefined;
  title: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 min-h-[112px]">
      <p className="text-xs font-bold text-muted-foreground mb-2">{title}</p>
      {option ? (
        <div className="space-y-2">
          <div>
            <p className="text-sm font-bold text-text-strong">{option.user.name}</p>
            <p className="text-xs text-muted-foreground font-mono">
              {option.user.loginId}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-surface border border-border text-text">
              <CalendarDays className="w-3 h-3 text-muted-foreground" />
              {option.scheduleDate}
            </span>
            <span className="px-2 py-1 rounded-lg bg-surface border border-border text-text">
              {option.zoneName}
            </span>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">스케줄을 선택해주세요.</p>
      )}
    </div>
  );
}

export function DirectSwapModal({
  open,
  onClose,
  siteId,
  schedules,
}: {
  open: boolean;
  onClose: () => void;
  siteId: string;
  schedules: CalendarScheduleItem[];
}) {
  const [firstValue, setFirstValue] = useState<string | null>(null);
  const [secondValue, setSecondValue] = useState<string | null>(null);
  const [error, setError] = useState("");
  const { mutate, isPending } = useCreateDirectSwapRequest(siteId);

  const options = useMemo(() => toDirectSwapOptions(schedules), [schedules]);
  const first = options.find((option) => option.value === firstValue);
  const secondOptions = useMemo(
    () =>
      options.filter(
        (option) =>
          !first ||
          (option.scheduleId !== first.scheduleId && option.user.id !== first.user.id),
      ),
    [first, options],
  );
  const second = secondOptions.find((option) => option.value === secondValue);

  useEffect(() => {
    if (!open) {
      setFirstValue(null);
      setSecondValue(null);
      setError("");
    }
  }, [open]);

  useEffect(() => {
    if (secondValue && !second) {
      setSecondValue(null);
    }
  }, [second, secondValue]);

  const handleSubmit = () => {
    if (!first || !second) {
      setError("교환할 두 스케줄을 모두 선택해주세요.");
      return;
    }

    mutate(
      {
        requesterUserId: first.user.id,
        requesterScheduleId: first.scheduleId,
        targetUserId: second.user.id,
        targetScheduleId: second.scheduleId,
      },
      { onSuccess: onClose },
    );
  };

  const renderOption = (option: DirectSwapOption | null) => {
    if (!option) return <span>선택 없음</span>;
    return (
      <span className="flex flex-col gap-0.5">
        <span className="font-semibold text-text-strong">
          {option.user.name} · {option.scheduleDate}
        </span>
        <span className="text-xs text-muted-foreground">
          {option.zoneName} · {option.user.loginId}
        </span>
      </span>
    );
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      maxWidth="max-w-2xl"
      panelClassName="flex flex-col max-h-[90vh]"
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/15 text-primary-foreground">
            <ArrowLeftRight className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-text-strong">관리자 직접 교환</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              현재 선택한 월의 예정 스케줄 중 두 건을 교환합니다
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        {options.length < 2 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center">
            <CalendarDays className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm font-semibold text-text-strong">
              직접 교환할 수 있는 스케줄이 부족합니다.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              현재 월에 worker가 배정된 예정 스케줄이 2건 이상 필요합니다.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-center">
              <OptionPreview option={first} title="첫 번째 스케줄" />
              <div className="hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-primary/15 text-primary-foreground">
                <ArrowLeftRight className="w-4 h-4" />
              </div>
              <OptionPreview option={second} title="두 번째 스케줄" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text">
                  첫 번째 스케줄
                </label>
                <SelectDropdown
                  options={options.map((option) => ({
                    value: option.value,
                    label: `${option.user.name} · ${option.scheduleDate}`,
                  }))}
                  value={firstValue}
                  onChange={(value) => {
                    setFirstValue(value);
                    setError("");
                  }}
                  renderOption={(option) =>
                    renderOption(
                      option
                        ? options.find((item) => item.value === option.value) ?? null
                        : null,
                    )
                  }
                  align="left"
                  minWidth="100%"
                  className="w-full"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text">
                  두 번째 스케줄
                </label>
                <SelectDropdown
                  options={secondOptions.map((option) => ({
                    value: option.value,
                    label: `${option.user.name} · ${option.scheduleDate}`,
                  }))}
                  value={secondValue}
                  onChange={(value) => {
                    setSecondValue(value);
                    setError("");
                  }}
                  renderOption={(option) =>
                    renderOption(
                      option
                        ? secondOptions.find((item) => item.value === option.value) ?? null
                        : null,
                    )
                  }
                  align="left"
                  minWidth="100%"
                  className="w-full"
                  disabled={!first}
                />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground leading-relaxed">
              지난 날짜, 출퇴근 기록이 있는 스케줄, 완료/취소 스케줄, 처리 중인 교환
              요청이 있는 스케줄은 백엔드 정책에 따라 거절될 수 있습니다.
            </div>
          </>
        )}

        {error && (
          <p className="text-xs font-medium text-danger-foreground">{error}</p>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2.5 text-sm font-medium text-text border border-border rounded-xl hover:bg-muted transition-colors"
        >
          취소
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || options.length < 2}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-300 transition-colors shadow-field",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          <ArrowLeftRight className="w-4 h-4" />
          {isPending ? "처리 중..." : "교환 처리"}
        </button>
      </div>
    </BaseModal>
  );
}
