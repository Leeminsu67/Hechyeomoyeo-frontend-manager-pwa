"use client";

import { useEffect, useState } from "react";
import { X, MapPin, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreateFieldSite, useUpdateFieldSite } from "../hooks/useFieldSites";
import { KakaoMapPicker } from "./KakaoMapPicker";
import type { FieldSite } from "@/types/field";
import { BaseModal } from "@/components/shared/BaseModal";

interface FieldSiteFormModalProps {
  open: boolean;
  onClose: () => void;
  editTarget?: FieldSite | null;
  onCreated?: (site: FieldSite) => void;
}

export function FieldSiteFormModal({
  open,
  onClose,
  editTarget,
  onCreated,
}: FieldSiteFormModalProps) {
  const isEdit = !!editTarget;

  const [title, setTitle] = useState("");
  const [titleError, setTitleError] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [address, setAddress] = useState("");
  const [showMap, setShowMap] = useState(false);

  const { mutate: createSite, isPending: creating } = useCreateFieldSite();
  const { mutate: updateSite, isPending: updating } = useUpdateFieldSite();

  const isPending = creating || updating;

  useEffect(() => {
    if (open) {
      setTitle(editTarget?.title ?? "");
      setLatitude(editTarget?.latitude ?? null);
      setLongitude(editTarget?.longitude ?? null);
      setAddress("");
      setTitleError("");
      setShowMap(!!(editTarget?.latitude && editTarget?.longitude));
    }
  }, [open, editTarget]);

  const validate = () => {
    if (!title.trim()) {
      setTitleError("현장 이름을 입력해주세요.");
      return false;
    }
    return true;
  };

  const handleLocationChange = (lat: number, lng: number, addr: string) => {
    setLatitude(lat);
    setLongitude(lng);
    if (addr) setAddress(addr);
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const dto = {
      title: title.trim(),
      ...(latitude !== null && { latitude }),
      ...(longitude !== null && { longitude }),
    };

    if (isEdit && editTarget) {
      updateSite({ id: editTarget.id, dto }, { onSuccess: onClose });
    } else {
      createSite(dto, {
        onSuccess: (data) => {
          onCreated?.(data?.data?.fieldSite);
          onClose();
        },
      });
    }
  };

  return (
    <BaseModal open={open} onClose={onClose} maxWidth="max-w-lg" panelClassName="flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-primary/15 rounded-xl">
              <MapPin className="w-5 h-5 text-primary-foreground" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-text-strong">
                {isEdit ? "외근 현장 수정" : "외근 현장 등록"}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isEdit
                  ? "현장 정보를 수정합니다"
                  : "새로운 외근 현장을 등록합니다"}
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
        <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text">
              현장 이름 <span className="text-danger-foreground">*</span>
            </label>
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (titleError) setTitleError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && !showMap && handleSubmit()}
              placeholder="예: 경남 김해 삼방화인아파트 물탱크"
              className={cn(
                "w-full px-3 py-2.5 border rounded-xl text-sm bg-surface text-text placeholder:text-muted-foreground focus:outline-none focus:ring-1 transition-colors",
                titleError
                  ? "border-danger/60 focus:border-danger focus:ring-danger/30"
                  : "border-border focus:border-primary focus:ring-primary/30"
              )}
            />
            {titleError && (
              <p className="text-xs text-danger-foreground">{titleError}</p>
            )}
          </div>

          {/* Map Toggle */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-text flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5" />
                위치 (선택)
              </label>
              <button
                type="button"
                onClick={() => setShowMap((v) => !v)}
                className={cn(
                  "text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors",
                  showMap
                    ? "bg-primary/10 text-primary-foreground border-primary/30"
                    : "bg-muted text-muted-foreground border-border hover:border-primary/30"
                )}
              >
                {showMap ? "지도 닫기" : "지도로 위치 선택"}
              </button>
            </div>

            {latitude !== null && longitude !== null && !showMap && (
              <div className="flex items-center gap-2 px-3 py-2 bg-success/20 border border-success/40 rounded-xl">
                <MapPin className="w-4 h-4 text-success-foreground shrink-0" />
                <p className="text-xs text-text">
                  위치 설정됨: {latitude.toFixed(6)}, {longitude.toFixed(6)}
                </p>
              </div>
            )}

            {showMap && (
              <KakaoMapPicker
                initialLat={latitude ?? undefined}
                initialLng={longitude ?? undefined}
                initialAddress={address}
                onLocationChange={handleLocationChange}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border shrink-0">
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
              "현장 등록"
            )}
          </button>
        </div>
    </BaseModal>
  );
}
