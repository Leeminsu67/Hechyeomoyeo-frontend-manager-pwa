"use client";

import { useEffect, useState } from "react";
import { BaseModal } from "@/components/shared/BaseModal";
import { X, MapPin, Tag, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreateSite, useUpdateSite, useUpdateSiteType } from "../hooks/useSites";
import { useSiteTypeList } from "../hooks/useSiteTypes";
import { SelectDropdown } from "@/components/shared/SelectDropdown";
import type { SiteItem, SiteType } from "@/types/site";

// ─── Modal ────────────────────────────────────────────────────────────────────

interface SiteFormModalProps {
  open: boolean;
  onClose: () => void;
  editTarget?: SiteItem | null;
}

export function SiteFormModal({ open, onClose, editTarget }: SiteFormModalProps) {
  const isEdit = !!editTarget;
  const [name, setName] = useState("");
  const [siteTypeId, setSiteTypeId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [nameError, setNameError] = useState("");
  const [dateError, setDateError] = useState("");

  const { data: siteTypeData } = useSiteTypeList();
  const { mutate: createSite, isPending: creating } = useCreateSite();
  const { mutate: updateSite, isPending: updating } = useUpdateSite();
  const { mutate: updateType, isPending: updatingType } = useUpdateSiteType();

  const siteTypes = siteTypeData?.data?.siteTypes ?? [];
  const isPending = creating || updating || updatingType;

  useEffect(() => {
    if (open) {
      setName(editTarget?.name ?? "");
      setSiteTypeId(editTarget?.siteType?.id ?? null);
      setStartDate(editTarget?.operationStartDate?.slice(0, 10) ?? "");
      setEndDate(editTarget?.operationEndDate?.slice(0, 10) ?? "");
      setNameError("");
      setDateError("");
    }
  }, [open, editTarget]);

  const validate = () => {
    let valid = true;
    if (!name.trim()) {
      setNameError("현장 이름을 입력해주세요.");
      valid = false;
    }
    if (!startDate || !endDate) {
      setDateError("운영 기간을 입력해주세요.");
      valid = false;
    } else if (startDate > endDate) {
      setDateError("종료일은 시작일 이후여야 합니다.");
      valid = false;
    } else {
      setDateError("");
    }
    return valid;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    if (isEdit && editTarget) {
      // 이름 업데이트
      updateSite(
        { id: editTarget.id, dto: { name: name.trim() } },
        {
          onSuccess: () => {
            // 타입 변경이 있을 경우 추가 요청
            const prevTypeId = editTarget.siteType?.id ?? null;
            if (siteTypeId !== prevTypeId && siteTypeId !== null) {
              updateType({ siteId: editTarget.id, siteTypeId });
            }
            onClose();
          },
        }
      );
    } else {
      createSite(
        { name: name.trim(), operationStartDate: startDate, operationEndDate: endDate },
        {
          onSuccess: (newSite) => {
            // 생성 후 타입 적용
            if (siteTypeId !== null && newSite?.id) {
              updateType({ siteId: newSite.id, siteTypeId });
            }
            onClose();
          },
        }
      );
    }
  };

  return (
    <BaseModal open={open} onClose={onClose} maxWidth="max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-primary/15 rounded-xl">
              <MapPin className="w-5 h-5 text-primary-foreground" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-text-strong">
                {isEdit ? "현장 수정" : "새 현장 등록"}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isEdit ? "현장 정보를 수정합니다" : "새로운 사업지를 등록합니다"}
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

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* 현장 이름 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text">
              현장 이름 <span className="text-danger-foreground">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="예: 광안리 해수욕장, 해운대 경비초소"
              className={cn(
                "w-full px-3 py-2.5 border rounded-xl text-sm bg-surface text-text placeholder:text-muted-foreground focus:outline-none focus:ring-1 transition-colors",
                nameError
                  ? "border-danger/60 focus:border-danger focus:ring-danger/30"
                  : "border-border focus:border-primary focus:ring-primary/30"
              )}
            />
            {nameError && (
              <p className="text-xs text-danger-foreground">{nameError}</p>
            )}
          </div>

          {/* 사업 타입 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              사업 타입
            </label>
            <SelectDropdown
              options={siteTypes.map((t: SiteType) => ({
                value: t.id,
                label: t.name,
                color: t.color,
              }))}
              value={siteTypeId}
              onChange={setSiteTypeId}
              nullLabel="없음"
              placeholder="타입 선택 (선택사항)"
              align="left"
              minWidth="100%"
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              색상으로 현장을 시각적으로 구분합니다
            </p>
          </div>

          {/* 운영 기간 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              운영 기간 <span className="text-danger-foreground">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (dateError) setDateError("");
                }}
                className={cn(
                  "flex-1 px-3 py-2.5 border rounded-xl text-sm bg-surface text-text focus:outline-none focus:ring-1 transition-colors",
                  dateError
                    ? "border-danger/60 focus:border-danger focus:ring-danger/30"
                    : "border-border focus:border-primary focus:ring-primary/30"
                )}
              />
              <span className="text-sm text-muted-foreground shrink-0">~</span>
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  if (dateError) setDateError("");
                }}
                className={cn(
                  "flex-1 px-3 py-2.5 border rounded-xl text-sm bg-surface text-text focus:outline-none focus:ring-1 transition-colors",
                  dateError
                    ? "border-danger/60 focus:border-danger focus:ring-danger/30"
                    : "border-border focus:border-primary focus:ring-primary/30"
                )}
              />
            </div>
            {dateError && (
              <p className="text-xs text-danger-foreground">{dateError}</p>
            )}
          </div>

          {/* Preview */}
          {name.trim() && (
            <div className="p-3 bg-muted/50 rounded-xl border border-border/60">
              <p className="text-xs text-muted-foreground mb-2">미리보기</p>
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-10 rounded-full shrink-0"
                  style={{
                    backgroundColor:
                      siteTypes.find((t) => t.id === siteTypeId)?.color ?? "#DEE2E6",
                  }}
                />
                <div>
                  <p className="text-sm font-semibold text-text-strong">{name}</p>
                  {siteTypeId && (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-0.5"
                      style={{
                        backgroundColor:
                          (siteTypes.find((t) => t.id === siteTypeId)?.color ?? "#A5D8FF") + "33",
                        color:
                          siteTypes.find((t) => t.id === siteTypeId)?.color ?? "#1C4E6E",
                      }}
                    >
                      {siteTypes.find((t) => t.id === siteTypeId)?.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
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
            ) : (
              isEdit ? "수정 완료" : "현장 등록"
            )}
          </button>
        </div>
    </BaseModal>
  );
}
