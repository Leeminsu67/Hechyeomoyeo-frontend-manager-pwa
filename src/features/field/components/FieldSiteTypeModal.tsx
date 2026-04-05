"use client";

import { useState, useEffect } from "react";
import {
  X,
  Palette,
  Pencil,
  Trash2,
  Plus,
  Check,
  Tag,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useFieldSiteTypeList,
  useCreateFieldSiteType,
  useUpdateFieldSiteType,
  useDeleteFieldSiteType,
} from "../hooks/useFieldSiteTypes";
import type { FieldSiteType } from "@/types/field";
import { ModalPortal } from "@/components/shared/ModalPortal";

// ─── Preset Palette ───────────────────────────────────────────────────────────

const PRESET_COLORS = [
  { hex: "#A5D8FF", label: "스카이블루" },
  { hex: "#74C0FC", label: "코발트" },
  { hex: "#B2F2BB", label: "민트그린" },
  { hex: "#63E6BE", label: "터쿼이즈" },
  { hex: "#FFD8A8", label: "살구" },
  { hex: "#FFA94D", label: "앰버" },
  { hex: "#FFC9C9", label: "로즈핑크" },
  { hex: "#F783AC", label: "핑크" },
  { hex: "#E5DBFF", label: "라벤더" },
  { hex: "#DA77F2", label: "바이올렛" },
  { hex: "#FFF3BF", label: "옐로우" },
  { hex: "#C0EB75", label: "라임" },
  { hex: "#C5F6FA", label: "아이스" },
  { hex: "#FFD6E7", label: "블러쉬" },
  { hex: "#D3F9D8", label: "애플그린" },
  { hex: "#DEE2E6", label: "실버그레이" },
] as const;

// ─── Color Picker ─────────────────────────────────────────────────────────────

function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (hex: string) => void;
}) {
  const [customHex, setCustomHex] = useState("");
  const isPreset = PRESET_COLORS.some((c) => c.hex === value);

  const handleCustom = (raw: string) => {
    setCustomHex(raw);
    const cleaned = raw.startsWith("#") ? raw : `#${raw}`;
    if (/^#[0-9A-Fa-f]{6}$/.test(cleaned)) {
      onChange(cleaned);
    }
  };

  return (
    <div className="space-y-3">
      {/* Preset grid */}
      <div className="grid grid-cols-8 gap-1.5">
        {PRESET_COLORS.map((c) => (
          <button
            key={c.hex}
            type="button"
            title={c.label}
            onClick={() => { onChange(c.hex); setCustomHex(""); }}
            className={cn(
              "relative w-full aspect-square rounded-lg transition-all duration-150 focus:outline-none",
              "hover:scale-110 hover:shadow-md",
              value === c.hex && "ring-2 ring-offset-1 ring-text scale-110 shadow-md"
            )}
            style={{ backgroundColor: c.hex }}
          >
            {value === c.hex && (
              <Check className="absolute inset-0 m-auto w-3 h-3 text-gray-700/70" />
            )}
          </button>
        ))}
      </div>

      {/* Custom hex */}
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-lg border border-border shrink-0 transition-colors duration-200"
          style={{ backgroundColor: value }}
        />
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-mono select-none">
            #
          </span>
          <input
            value={customHex}
            onChange={(e) => handleCustom(e.target.value.replace("#", ""))}
            placeholder={value.replace("#", "")}
            maxLength={6}
            className="w-full pl-7 pr-3 py-2 border border-border rounded-xl text-sm font-mono bg-surface text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors placeholder:text-muted-foreground/50"
          />
        </div>
        {!isPreset && value && /^#[0-9A-Fa-f]{6}$/.test(value) && (
          <span className="text-xs text-muted-foreground font-medium px-2 py-1 bg-muted rounded-lg shrink-0">
            커스텀
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Type List Item ───────────────────────────────────────────────────────────

function TypeListItem({
  type,
  isEditing,
  onEdit,
  onDelete,
}: {
  type: FieldSiteType;
  isEditing: boolean;
  onEdit: (t: FieldSiteType) => void;
  onDelete: (id: number) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { mutate: del, isPending } = useDeleteFieldSiteType();

  const handleDelete = () => {
    del(type.id, { onSuccess: () => setConfirmDelete(false) });
  };

  return (
    <div
      className={cn(
        "group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors",
        isEditing ? "bg-primary/8 ring-1 ring-primary/30" : "hover:bg-muted/60"
      )}
    >
      {/* Color swatch */}
      <span
        className="w-6 h-6 rounded-lg shrink-0 shadow-sm border border-black/5"
        style={{ backgroundColor: type.color }}
      />

      {/* Name */}
      <span
        className={cn(
          "flex-1 text-sm font-medium truncate",
          isEditing ? "text-primary-foreground" : "text-text"
        )}
      >
        {type.name}
      </span>

      {/* Actions */}
      {!confirmDelete ? (
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            type="button"
            onClick={() => onEdit(type)}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              isEditing
                ? "bg-primary/20 text-primary-foreground"
                : "hover:bg-primary/10 text-muted-foreground hover:text-primary-foreground"
            )}
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="p-1.5 rounded-lg hover:bg-danger/10 text-muted-foreground hover:text-danger-foreground transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setConfirmDelete(false)}
            className="px-2 py-1 text-xs font-medium border border-border rounded-lg hover:bg-muted transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="px-2 py-1 text-xs font-semibold bg-danger/80 text-danger-foreground rounded-lg hover:bg-danger transition-colors disabled:opacity-50"
          >
            {isPending ? "…" : "삭제"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

interface FieldSiteTypeModalProps {
  open: boolean;
  onClose: () => void;
}

export function FieldSiteTypeModal({ open, onClose }: FieldSiteTypeModalProps) {
  const { data, isLoading } = useFieldSiteTypeList();
  const { mutate: createType, isPending: creating } = useCreateFieldSiteType();
  const { mutate: updateType, isPending: updating } = useUpdateFieldSiteType();

  const types: FieldSiteType[] = data?.data?.siteTypes ?? [];

  // ─ Form state ─────────────────────────────────────────────────────────
  const [editTarget, setEditTarget] = useState<FieldSiteType | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0].hex);
  const [nameError, setNameError] = useState("");

  const isEdit = !!editTarget;
  const isPending = creating || updating;

  const resetForm = () => {
    setEditTarget(null);
    setName("");
    setColor(PRESET_COLORS[0].hex);
    setNameError("");
  };

  useEffect(() => {
    if (!open) resetForm();
  }, [open]);

  const handleEdit = (type: FieldSiteType) => {
    if (editTarget?.id === type.id) {
      resetForm();
      return;
    }
    setEditTarget(type);
    setName(type.name);
    setColor(type.color);
    setNameError("");
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      setNameError("타입 이름을 입력해주세요.");
      return;
    }

    if (isEdit && editTarget) {
      updateType(
        { id: editTarget.id, dto: { name: name.trim(), color } },
        { onSuccess: resetForm }
      );
    } else {
      createType(
        { name: name.trim(), color },
        { onSuccess: resetForm }
      );
    }
  };

  if (!open) return null;

  return (
    <ModalPortal>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-surface rounded-2xl shadow-card-hover w-full max-w-2xl border border-border animate-slide-up max-h-[88vh] flex flex-col">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-primary/15 rounded-xl">
              <Palette className="w-5 h-5 text-primary-foreground" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-text-strong">현장 타입 관리</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                색상으로 외근 현장을 시각적으로 분류합니다
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

        {/* ── Body: 2-column ── */}
        <div className="flex flex-col sm:flex-row flex-1 min-h-0 overflow-hidden">

          {/* Left — Type List */}
          <div className="sm:w-[48%] border-b sm:border-b-0 sm:border-r border-border flex flex-col min-h-0">
            <div className="px-4 py-3 border-b border-border shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-text-strong">등록된 타입</span>
                <span className="text-xs text-muted-foreground">({types.length})</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {isLoading ? (
                <div className="space-y-2 p-1">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                      <div className="w-6 h-6 rounded-lg bg-muted animate-pulse shrink-0" />
                      <div className="flex-1 h-4 bg-muted rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : types.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 gap-3 text-muted-foreground">
                  <div className="p-3 bg-muted rounded-xl">
                    <Tag className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-center">
                    등록된 타입이 없습니다.
                    <br />
                    오른쪽에서 새 타입을 만들어보세요.
                  </p>
                </div>
              ) : (
                types.map((type) => (
                  <TypeListItem
                    key={type.id}
                    type={type}
                    isEditing={editTarget?.id === type.id}
                    onEdit={handleEdit}
                    onDelete={() => {}}
                  />
                ))
              )}
            </div>
          </div>

          {/* Right — Form */}
          <div className="sm:flex-1 flex flex-col min-h-0">
            <div className="px-4 py-3 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                {isEdit ? (
                  <>
                    <Pencil className="w-4 h-4 text-primary-foreground" />
                    <span className="text-sm font-semibold text-text-strong">타입 수정</span>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="ml-auto text-xs text-muted-foreground hover:text-text border border-border rounded-lg px-2 py-0.5 hover:bg-muted transition-colors"
                    >
                      취소
                    </button>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-primary-foreground" />
                    <span className="text-sm font-semibold text-text-strong">새 타입 등록</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {/* Live Preview */}
              <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl border border-border/60">
                <span
                  className="w-8 h-8 rounded-xl shrink-0 shadow-sm border border-black/5 transition-colors duration-200"
                  style={{ backgroundColor: color }}
                />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">미리보기</p>
                  <p className="text-sm font-semibold text-text-strong truncate mt-0.5">
                    {name.trim() || "타입 이름을 입력하세요"}
                  </p>
                </div>
                <span
                  className="ml-auto inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border shrink-0"
                  style={{
                    backgroundColor: color + "33",
                    borderColor: color + "88",
                    color: "#333",
                  }}
                >
                  {name.trim() || "미리보기"}
                </span>
              </div>

              {/* Name Input */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text">
                  타입 이름 <span className="text-danger-foreground">*</span>
                </label>
                <input
                  value={name}
                  onChange={(e) => { setName(e.target.value); if (nameError) setNameError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  placeholder="예: 수처리시설, 아파트, 산업단지"
                  className={cn(
                    "w-full px-3 py-2.5 border rounded-xl text-sm bg-surface text-text placeholder:text-muted-foreground focus:outline-none focus:ring-1 transition-colors",
                    nameError
                      ? "border-danger/60 focus:border-danger focus:ring-danger/30"
                      : "border-border focus:border-primary focus:ring-primary/30"
                  )}
                />
                {nameError && <p className="text-xs text-danger-foreground">{nameError}</p>}
              </div>

              {/* Color Picker */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-text flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5" />
                  대표 색상 <span className="text-danger-foreground">*</span>
                </label>
                <ColorPicker value={color} onChange={setColor} />
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-border shrink-0">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary-300 transition-colors shadow-field disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <>
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    {isEdit ? "수정 중…" : "등록 중…"}
                  </>
                ) : isEdit ? (
                  <>
                    <Check className="w-4 h-4" />
                    타입 수정 완료
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    타입 등록
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}
