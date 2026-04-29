"use client";

import { useState } from "react";
import { X, Wand2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { BaseModal } from "@/components/shared/BaseModal";
import { useAutoAssignSchedule } from "../hooks/useSchedules";
import type { CalendarScheduleParams } from "@/types/schedule";

const MONTH_NAMES = [
  "1월","2월","3월","4월","5월","6월",
  "7월","8월","9월","10월","11월","12월",
];

interface AutoAssignModalProps {
  open: boolean;
  onClose: () => void;
  siteId: string;
  year: number;
  month: number;
  calendarParams: CalendarScheduleParams;
}

export function AutoAssignModal({
  open,
  onClose,
  siteId,
  year,
  month,
  calendarParams,
}: AutoAssignModalProps) {
  const [restDaysPerWeek, setRestDaysPerWeek] = useState(1);

  const { mutate: autoAssign, isPending } = useAutoAssignSchedule(
    siteId,
    calendarParams,
  );

  const handleSubmit = () => {
    autoAssign({ year, month, restDaysPerWeek }, { onSuccess: onClose });
  };

  return (
    <BaseModal open={open} onClose={onClose} maxWidth="max-w-sm">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-secondary/20 shrink-0">
              <Wand2 className="w-[18px] h-[18px] text-secondary-foreground" />
            </span>
            <div>
              <h2 className="text-base font-bold text-text-strong">자동 당직 배치</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {year}년 {MONTH_NAMES[month - 1]}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="px-5 py-5 space-y-4">

          {/* 안내 */}
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-secondary/10 border border-secondary/30">
            <AlertCircle className="w-4 h-4 text-secondary-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-secondary-foreground leading-relaxed">
              이미 배정된 스케줄은 유지하고, 빈 날짜에만 자동으로 인력을 배치합니다.
              구역의 운영 요일과 필요 인원 기준으로 균등 분배됩니다.
            </p>
          </div>

          {/* 주당 휴무일수 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-text">
              주당 휴무일수
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setRestDaysPerWeek((p) => Math.max(1, p - 1))}
                disabled={restDaysPerWeek <= 1}
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-border hover:bg-muted transition-colors text-text font-bold text-lg disabled:opacity-40"
              >
                −
              </button>
              <div className="flex-1 text-center">
                <span className="text-2xl font-bold text-text-strong">
                  {restDaysPerWeek}
                </span>
                <span className="text-sm text-muted-foreground ml-1">일/주</span>
              </div>
              <button
                type="button"
                onClick={() => setRestDaysPerWeek((p) => Math.min(6, p + 1))}
                disabled={restDaysPerWeek >= 6}
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-border hover:bg-muted transition-colors text-text font-bold text-lg disabled:opacity-40"
              >
                +
              </button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              근무자당 주 {restDaysPerWeek}일 휴무가 보장됩니다.
            </p>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex justify-end gap-3 px-5 py-4 border-t border-border bg-muted/20 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-text border border-border rounded-xl hover:bg-muted transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-colors shadow-field disabled:opacity-50 disabled:cursor-not-allowed",
              "bg-secondary text-secondary-foreground hover:bg-secondary/80",
            )}
          >
            {isPending ? (
              <>
                <span className="w-4 h-4 border-2 border-secondary-foreground/30 border-t-secondary-foreground rounded-full animate-spin" />
                배치 중…
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                자동 배치 시작
              </>
            )}
          </button>
        </div>
    </BaseModal>
  );
}
