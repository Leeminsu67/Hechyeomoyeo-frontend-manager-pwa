"use client";

import { useState } from "react";
import { X, Plus, Pencil, Trash2, Palette, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useSiteTypeList,
  useCreateSiteType,
  useUpdateSiteType,
  useDeleteSiteType,
} from "../hooks/useSiteTypes";
import type { SiteType } from "@/types/site";

// ─── Preset Colors ────────────────────────────────────────────────────────────

const PRESET_COLORS = [
  "#A5D8FF", // 하늘 (Primary)
  "#FFD8A8", // 오렌지 (Secondary)
  "#B2F2BB", // 민트 (Success)
  "#FFC9C9", // 로즈 (Danger)
  "#D0BFFF", // 라벤더
  "#FFEC99", // 노랑
  "#99E9F2", // 청록
  "#F3D9FA", // 핑크
  "#C3FAE8", // 에메랄드
  "#74C0FC", // 파랑
  "#FF8787", // 빨강
  "#69DB7C", // 초록
  "#FFA94D", // 주황
  "#4DABF7", // 딥블루
  "#9775FA", // 보라
  "#F06595", // 딥핑크
];

// ─── Color Picker ─────────────────────────────────────────────────────────────

function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (c: string) => void;
}) {
  const [custom, setCustom] = useState(
    PRESET_COLORS.includes(value) ? "" : value
  );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-8 gap-2">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className={cn(
              "w-7 h-7 rounded-lg border-2 transition-all hover:scale-110",
              value === c ? "border-text-strong scale-110" : "border-transparent"
            )}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs text-muted-foreground whitespace-nowrap">직접 입력</label>
        <input
          type="color"
          value={custom || value}
          onChange={(e) => {
            setCustom(e.target.value);
            onChange(e.target.value);
          }}
          className="w-8 h-8 rounded cursor-pointer border border-border"
        />
        <input
          type="text"
          value={custom || value}
          onChange={(e) => {
            setCustom(e.target.value);
            if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
              onChange(e.target.value);
            }
          }}
          placeholder="#000000"
          className="flex-1 px-2 py-1.5 text-xs border border-border rounded-lg bg-surface text-text font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
        />
      </div>
    </div>
  );
}

// ─── Form Row ─────────────────────────────────────────────────────────────────

interface FormState {
  name: string;
  color: string;
}

const DEFAULT_FORM: FormState = { name: "", color: "#A5D8FF" };

function SiteTypeForm({
  initial,
  onSubmit,
  onCancel,
  isPending,
}: {
  initial?: FormState;
  onSubmit: (data: FormState) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState<FormState>(initial ?? DEFAULT_FORM);

  return (
    <div className="bg-muted/50 border border-border rounded-xl p-4 space-y-4 animate-slide-up">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-text">타입 이름</label>
        <input
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="예: 해수욕장, 경비, 청소"
          className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-text flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5" />
          대표 색상
        </label>
        <ColorPicker value={form.color} onChange={(c) => setForm((f) => ({ ...f, color: c }))} />
        <div className="flex items-center gap-2 mt-2">
          <div
            className="w-8 h-8 rounded-lg border border-border shadow-sm"
            style={{ backgroundColor: form.color }}
          />
          <span className="text-xs text-muted-foreground">미리보기</span>
          <span
            className="px-2.5 py-0.5 rounded-full text-xs font-semibold border"
            style={{
              backgroundColor: form.color + "33",
              borderColor: form.color + "88",
              color: form.color.replace(/^#/, "").length === 6
                ? `hsl(${parseInt(form.color.slice(1, 3), 16)}, 40%, 30%)`
                : "#333",
            }}
          >
            {form.name || "타입명"}
          </span>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-sm font-medium text-text border border-border rounded-lg hover:bg-muted transition-colors"
        >
          취소
        </button>
        <button
          type="button"
          onClick={() => onSubmit(form)}
          disabled={!form.name.trim() || isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Check className="w-3.5 h-3.5" />
          {isPending ? "저장 중…" : "저장"}
        </button>
      </div>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

interface SiteTypeModalProps {
  open: boolean;
  onClose: () => void;
}

export function SiteTypeModal({ open, onClose }: SiteTypeModalProps) {
  const { data, isLoading } = useSiteTypeList();
  const { mutate: create, isPending: creating } = useCreateSiteType();
  const { mutate: update, isPending: updating } = useUpdateSiteType();
  const { mutate: remove, isPending: removing } = useDeleteSiteType();

  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const siteTypes = data?.data?.siteTypes ?? [];

  const handleCreate = (form: FormState) => {
    create(form, {
      onSuccess: () => setShowAdd(false),
    });
  };

  const handleUpdate = (id: number, form: FormState) => {
    update({ id, dto: form }, { onSuccess: () => setEditId(null) });
  };

  const handleDelete = (id: number) => {
    remove(id, { onSuccess: () => setDeleteConfirm(null) });
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface rounded-2xl shadow-card-hover w-full max-w-lg border border-border animate-slide-up max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-text-strong">사업 타입 관리</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              색상과 이름을 설정하여 현장 구분에 활용합니다
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          ) : siteTypes.length === 0 && !showAdd ? (
            <div className="flex flex-col items-center gap-3 py-10 text-muted-foreground">
              <Palette className="w-10 h-10 opacity-30" />
              <p className="text-sm">등록된 사업 타입이 없습니다</p>
            </div>
          ) : (
            <>
              {siteTypes.map((st: SiteType) => (
                <div key={st.id}>
                  {editId === st.id ? (
                    <SiteTypeForm
                      initial={{ name: st.name, color: st.color }}
                      onSubmit={(form) => handleUpdate(st.id, form)}
                      onCancel={() => setEditId(null)}
                      isPending={updating}
                    />
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-3 bg-surface border border-border rounded-xl hover:border-primary/40 hover:shadow-field transition-all group">
                      <div
                        className="w-8 h-8 rounded-lg shrink-0 border border-black/10"
                        style={{ backgroundColor: st.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text-strong">{st.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{st.color}</p>
                      </div>
                      {deleteConfirm === st.id ? (
                        <div className="flex items-center gap-2 animate-slide-up">
                          <span className="text-xs text-danger-foreground">삭제할까요?</span>
                          <button
                            onClick={() => handleDelete(st.id)}
                            disabled={removing}
                            className="px-2 py-1 text-xs bg-danger text-danger-foreground rounded-lg hover:bg-danger/70 transition-colors font-medium"
                          >
                            {removing ? "…" : "확인"}
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="px-2 py-1 text-xs border border-border rounded-lg hover:bg-muted transition-colors"
                          >
                            취소
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditId(st.id)}
                            className="p-1.5 rounded-lg hover:bg-primary/15 transition-colors text-primary-foreground"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(st.id)}
                            className="p-1.5 rounded-lg hover:bg-danger/20 transition-colors text-danger-foreground"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {showAdd && (
            <SiteTypeForm
              onSubmit={handleCreate}
              onCancel={() => setShowAdd(false)}
              isPending={creating}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border">
          {!showAdd && (
            <button
              onClick={() => {
                setShowAdd(true);
                setEditId(null);
              }}
              className="flex items-center gap-2 w-full justify-center px-4 py-2.5 border-2 border-dashed border-primary/50 text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/10 hover:border-primary transition-colors"
            >
              <Plus className="w-4 h-4" />
              새 타입 추가
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
