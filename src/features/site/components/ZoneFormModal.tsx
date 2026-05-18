"use client";

import { useCallback, useEffect, useState } from "react";
import { BaseModal } from "@/components/shared/BaseModal";
import {
  X,
  LayoutGrid,
  Moon,
  Clock,
  AlignLeft,
  AlertCircle,
  Users,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { KakaoMapPicker } from "@/features/field/components/KakaoMapPicker";
import { useCreateZone, useUpdateZone } from "../hooks/useZones";
import type { SiteItem } from "@/types/site";
import type { ZoneItem } from "@/types/zone";

// ─── Field Wrapper ────────────────────────────────────────────────────────────

function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1 text-sm font-medium text-text">
        {label}
        {required && <span className="text-danger-foreground">*</span>}
      </label>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-xs text-danger-foreground">
          <AlertCircle className="w-3 h-3 shrink-0" />
          {error}
        </p>
      )}
      {!error && hint && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface ZoneFormModalProps {
  open: boolean;
  onClose: () => void;
  site: SiteItem;
  editTarget?: ZoneItem | null;
}

interface FormErrors {
  name?: string;
  latitude?: string;
  description?: string;
  workStartTime?: string;
  workEndTime?: string;
}

export function ZoneFormModal({
  open,
  onClose,
  site,
  editTarget,
}: ZoneFormModalProps) {
  const isEdit = !!editTarget;

  // ─ Form State ───────────────────────────────────────────────────────────
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [workStartTime, setWorkStartTime] = useState("");
  const [workEndTime, setWorkEndTime] = useState("");
  const [isOvernight, setIsOvernight] = useState(false);
  const [requiredWorkers, setRequiredWorkers] = useState(1);
  const [repeatWeekdays, setRepeatWeekdays] = useState<number[] | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  const { mutate: createZone, isPending: creating } = useCreateZone(site.id);
  const { mutate: updateZone, isPending: updating } = useUpdateZone(site.id);
  const isPending = creating || updating;
  const siteMapCenter =
    !isEdit &&
    typeof site.latitude === "number" &&
    typeof site.longitude === "number"
      ? { lat: site.latitude, lng: site.longitude }
      : null;

  // ─ 안정적인 location 콜백 ─────────────────────────────────────────────
  // 인라인 함수로 전달하면 KakaoMapPicker 내부의 reverseGeocode useCallback
  // 의존성이 매 렌더마다 바뀌어 map 초기화 effect가 반복 실행되는 버그 방지
  const handleLocationChange = useCallback(
    (lat: number, lng: number) => {
      setLatitude(lat);
      setLongitude(lng);
      setErrors((prev) => ({ ...prev, latitude: undefined }));
    },
    [] // setter는 안정적이므로 의존성 없음
  );

  // ─ Init / Reset ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      setName(editTarget?.name ?? "");
      setDescription(editTarget?.description ?? "");
      setLatitude(editTarget?.latitude ?? null);
      setLongitude(editTarget?.longitude ?? null);
      setWorkStartTime(editTarget?.workStartTime?.slice(0, 5) ?? "");
      setWorkEndTime(editTarget?.workEndTime?.slice(0, 5) ?? "");
      setIsOvernight(editTarget?.isOvernight ?? false);
      setRequiredWorkers(editTarget?.requiredWorkers ?? 1);
      setRepeatWeekdays(editTarget?.repeatWeekdays ?? null);
      setErrors({});
    }
  }, [open, editTarget]);

  // ─ Validation ───────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const next: FormErrors = {};

    if (!name.trim()) {
      next.name = "구역 이름을 입력해주세요.";
    }
    // description: DTO @IsNotEmpty() — 필수
    if (!description.trim()) {
      next.description = "구역 설명을 입력해주세요.";
    }
    // 위치: 지도에서 선택 필수
    if (latitude === null || longitude === null) {
      next.latitude = "지도에서 위치를 선택해주세요.";
    }
    // 시간: HH:MM 형식, 공백 불가
    if (!workStartTime) {
      next.workStartTime = "근무 시작 시간을 입력해주세요.";
    }
    if (!workEndTime) {
      next.workEndTime = "근무 종료 시간을 입력해주세요.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // ─ Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = () => {
    if (!validate()) return;

    // sortOrder는 미전송 — 백엔드가 @IsOptional()로 자동 계산
    const dto = {
      name: name.trim(),
      latitude: latitude!,
      longitude: longitude!,
      description: description.trim(),
      workStartTime,
      workEndTime,
      isOvernight,
      requiredWorkers,
      repeatWeekdays,
    };

    if (isEdit && editTarget) {
      updateZone({ id: editTarget.id, dto }, { onSuccess: onClose });
    } else {
      createZone(dto, { onSuccess: onClose });
    }
  };

  return (
    <BaseModal open={open} onClose={onClose} maxWidth="max-w-lg" panelClassName="flex flex-col max-h-[92vh]" zIndex="z-[60]">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/15 shrink-0">
              <LayoutGrid className="w-[18px] h-[18px] text-primary-foreground" />
            </span>
            <div>
              <h2 className="text-base font-bold text-text-strong">
                {isEdit ? "구역 수정" : "새 구역 추가"}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]">
                {site.name}
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
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* 구역 이름 */}
          <Field label="구역 이름" required error={errors.name}>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
              }}
              placeholder="예: A구역, 정문 구역, 1층 로비"
              className={cn(
                "w-full px-3 py-2.5 border rounded-xl text-sm bg-surface text-text placeholder:text-muted-foreground focus:outline-none focus:ring-1 transition-colors",
                errors.name
                  ? "border-danger/60 focus:border-danger focus:ring-danger/30"
                  : "border-border focus:border-primary focus:ring-primary/30"
              )}
            />
          </Field>

          {/* 설명 — DTO @IsNotEmpty() 필수 */}
          <Field label="구역 설명" required error={errors.description}>
            <div className="relative">
              <AlignLeft className="absolute left-3 top-3 w-4 h-4 text-muted-foreground pointer-events-none" />
              <textarea
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (errors.description)
                    setErrors((p) => ({ ...p, description: undefined }));
                }}
                placeholder="예: 정문 앞 경비 구역, 주차 출입 통제 담당"
                rows={2}
                className={cn(
                  "w-full pl-9 pr-3 py-2.5 border rounded-xl text-sm bg-surface text-text placeholder:text-muted-foreground focus:outline-none focus:ring-1 transition-colors resize-none",
                  errors.description
                    ? "border-danger/60 focus:border-danger focus:ring-danger/30"
                    : "border-border focus:border-primary focus:ring-primary/30"
                )}
              />
            </div>
          </Field>

          {/* 위치 (지도) — handleLocationChange를 useCallback으로 안정화 */}
          <Field
            label="구역 위치"
            required
            error={errors.latitude}
            hint={!errors.latitude ? "지도를 클릭하거나 주소 또는 장소명을 검색해 위치를 지정하세요." : undefined}
          >
            <KakaoMapPicker
              initialLat={editTarget?.latitude ?? undefined}
              initialLng={editTarget?.longitude ?? undefined}
              defaultCenterLat={siteMapCenter?.lat}
              defaultCenterLng={siteMapCenter?.lng}
              onLocationChange={handleLocationChange}
            />
          </Field>

          {/* 근무 시간 */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-sm font-medium text-text">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              근무 시간 <span className="text-danger-foreground">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={workStartTime}
                onChange={(e) => {
                  setWorkStartTime(e.target.value);
                  if (errors.workStartTime)
                    setErrors((p) => ({ ...p, workStartTime: undefined }));
                }}
                className={cn(
                  "flex-1 px-3 py-2.5 border rounded-xl text-sm bg-surface text-text focus:outline-none focus:ring-1 transition-colors",
                  errors.workStartTime
                    ? "border-danger/60 focus:border-danger focus:ring-danger/30"
                    : "border-border focus:border-primary focus:ring-primary/30"
                )}
              />
              <span className="text-sm text-muted-foreground font-medium shrink-0">~</span>
              <input
                type="time"
                value={workEndTime}
                onChange={(e) => {
                  setWorkEndTime(e.target.value);
                  if (errors.workEndTime)
                    setErrors((p) => ({ ...p, workEndTime: undefined }));
                }}
                className={cn(
                  "flex-1 px-3 py-2.5 border rounded-xl text-sm bg-surface text-text focus:outline-none focus:ring-1 transition-colors",
                  errors.workEndTime
                    ? "border-danger/60 focus:border-danger focus:ring-danger/30"
                    : "border-border focus:border-primary focus:ring-primary/30"
                )}
              />
            </div>
            {(errors.workStartTime || errors.workEndTime) && (
              <p className="flex items-center gap-1 text-xs text-danger-foreground">
                <AlertCircle className="w-3 h-3 shrink-0" />
                {errors.workStartTime ?? errors.workEndTime}
              </p>
            )}
          </div>

          {/* 야간 근무 */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/20">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary/20">
                <Moon className="w-4 h-4 text-secondary-foreground" />
              </span>
              <div>
                <p className="text-sm font-medium text-text-strong">야간 근무 (익일 종료)</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  종료 시간이 다음날 새벽인 경우 활성화
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isOvernight}
              onClick={() => setIsOvernight((p) => !p)}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30",
                isOvernight ? "bg-secondary" : "bg-muted"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-5 w-5 rounded-full bg-surface shadow-sm transition-transform duration-200",
                  isOvernight ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </div>

          {/* 하루 필요 인원 */}
          <Field
            label="하루 필요 인원"
            hint="이 구역에 하루 동안 필요한 최소 인원수입니다."
          >
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/15 shrink-0">
                <Users className="w-4 h-4 text-primary-foreground" />
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRequiredWorkers((p) => Math.max(1, p - 1))}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors text-text font-bold disabled:opacity-40"
                  disabled={requiredWorkers <= 1}
                >
                  −
                </button>
                <span className="w-10 text-center text-sm font-bold text-text-strong">
                  {requiredWorkers}명
                </span>
                <button
                  type="button"
                  onClick={() => setRequiredWorkers((p) => p + 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors text-text font-bold"
                >
                  +
                </button>
              </div>
            </div>
          </Field>

          {/* 운영 요일 */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-sm font-medium text-text">
                <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                운영 요일
              </label>
              <button
                type="button"
                onClick={() =>
                  setRepeatWeekdays(repeatWeekdays === null ? [1, 2, 3, 4, 5] : null)
                }
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors",
                  repeatWeekdays === null
                    ? "bg-primary/20 text-primary-foreground border-primary/30"
                    : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                )}
              >
                매일 운영
              </button>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {(["일", "월", "화", "수", "목", "금", "토"] as const).map((label, idx) => {
                const isActive =
                  repeatWeekdays === null || repeatWeekdays.includes(idx);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      if (repeatWeekdays === null) {
                        // 매일 → 특정 요일만: 클릭한 요일 제외한 나머지
                        setRepeatWeekdays(
                          [0, 1, 2, 3, 4, 5, 6].filter((d) => d !== idx)
                        );
                      } else {
                        const next = repeatWeekdays.includes(idx)
                          ? repeatWeekdays.filter((d) => d !== idx)
                          : [...repeatWeekdays, idx].sort((a, b) => a - b);
                        // 7개 모두 선택 시 null로 되돌림
                        setRepeatWeekdays(
                          next.length === 7
                            ? null
                            : next.length === 0
                            ? [idx]
                            : next
                        );
                      }
                    }}
                    className={cn(
                      "w-9 h-9 flex items-center justify-center rounded-full text-xs font-bold border transition-colors",
                      isActive
                        ? "bg-primary/20 text-primary-foreground border-primary/30"
                        : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {repeatWeekdays === null
                ? "모든 요일에 운영됩니다."
                : repeatWeekdays.length === 0
                ? "운영 요일을 1개 이상 선택해주세요."
                : `${["일", "월", "화", "수", "목", "금", "토"].filter((_, i) => repeatWeekdays.includes(i)).join(", ")}요일에 운영됩니다.`}
            </p>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border bg-muted/20 rounded-b-2xl shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-text border border-border rounded-xl hover:bg-muted transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary-300 transition-colors shadow-field disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                저장 중…
              </>
            ) : isEdit ? (
              "수정 완료"
            ) : (
              "구역 등록"
            )}
          </button>
        </div>
    </BaseModal>
  );
}
