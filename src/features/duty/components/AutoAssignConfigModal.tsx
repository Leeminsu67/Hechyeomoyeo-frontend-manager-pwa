"use client";

import { useEffect, useState } from "react";
import { CalendarCheck, Loader2, X } from "lucide-react";
import { BaseModal } from "@/components/shared/BaseModal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const REST_DAY_OPTIONS = [1, 2, 3, 4, 5, 6] as const;

export function AutoAssignConfigModal({
  open,
  year,
  month,
  defaultRestDaysPerWeek,
  isSubmitting,
  onClose,
  onConfirm,
}: {
  open: boolean;
  year: number;
  month: number;
  defaultRestDaysPerWeek: number;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (restDaysPerWeek: number) => void;
}) {
  const [restDaysPerWeek, setRestDaysPerWeek] = useState(
    defaultRestDaysPerWeek,
  );

  useEffect(() => {
    if (open) {
      setRestDaysPerWeek(defaultRestDaysPerWeek);
    }
  }, [defaultRestDaysPerWeek, open]);

  return (
    <BaseModal
      open={open}
      onClose={isSubmitting ? () => undefined : onClose}
      maxWidth="max-w-md"
      panelClassName="overflow-hidden"
      closeOnBackdrop={!isSubmitting}
    >
      <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <p className="text-xs font-bold text-muted-foreground">
            근무 자동 배정
          </p>
          <h2 className="mt-1 text-lg font-bold text-text-strong">
            {year}년 {month}월 배정 설정
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-text disabled:opacity-50"
          aria-label="닫기"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4 px-5 py-5">
        <div>
          <p className="text-sm font-bold text-text-strong">주 휴무일 수</p>
          <p className="mt-1 text-xs text-muted-foreground">
            선택한 휴무일 수를 기준으로 주간 배정 가능 일수가 계산됩니다.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {REST_DAY_OPTIONS.map((day) => {
            const selected = day === restDaysPerWeek;
            return (
              <button
                key={day}
                type="button"
                disabled={isSubmitting}
                onClick={() => setRestDaysPerWeek(day)}
                className={cn(
                  "min-h-11 rounded-lg border px-3 py-2 text-sm font-bold transition-colors disabled:opacity-50",
                  selected
                    ? "border-primary bg-primary text-primary-foreground shadow-field"
                    : "border-border bg-surface text-text hover:border-primary/50 hover:bg-primary/5",
                )}
              >
                주 휴무 {day}일
              </button>
            );
          })}
        </div>

        <div className="rounded-lg border border-border bg-muted px-4 py-3 text-xs text-muted-foreground">
          기존 근무는 유지하고, 비어 있는 슬롯만 자동 배정합니다.
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-border px-5 py-4 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting}
          onClick={onClose}
          className="w-full sm:w-auto"
        >
          취소
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={isSubmitting}
          onClick={() => onConfirm(restDaysPerWeek)}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? (
            <Loader2 className="animate-spin" />
          ) : (
            <CalendarCheck />
          )}
          자동 배정 실행
        </Button>
      </div>
    </BaseModal>
  );
}
