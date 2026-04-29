"use client";

import { useState } from "react";
import { ShieldCheck, X } from "lucide-react";
import { BaseModal } from "@/components/shared/BaseModal";
import { useUpdateAttendance } from "../hooks/useAttendance";
import type { AttendanceRecord } from "@/types/attendance";

interface ExcuseModalProps {
  record: AttendanceRecord;
  onClose: () => void;
}

export function ExcuseModal({ record, onClose }: ExcuseModalProps) {
  const [memo, setMemo] = useState("");
  const { mutate, isPending } = useUpdateAttendance();

  const handleSubmit = () => {
    if (!memo.trim()) return;
    mutate(
      { id: record.id, dto: { status: "excused", memo: memo.trim() } },
      { onSuccess: onClose }
    );
  };

  return (
    <BaseModal open={true} onClose={onClose} maxWidth="max-w-md" closeOnBackdrop={false}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary-foreground" />
              <h2 className="text-lg font-bold text-text-strong">사유 처리</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4">
            <div className="bg-muted rounded-xl p-4 space-y-1.5">
              <p className="text-sm font-semibold text-text-strong">
                {record.user.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {record.schedule.zone.name} · {record.schedule.scheduleDate}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1.5">
                사유 입력 <span className="text-danger-foreground">*</span>
              </label>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="병가, 경조사, 관리자 승인 등 사유를 입력하세요"
                rows={3}
                className="w-full px-3.5 py-2.5 text-sm border border-border rounded-xl bg-surface resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-shadow"
              />
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              사유 처리 시 해당 출결 기록의 상태가{" "}
              <span className="font-semibold text-primary-foreground">
                사유인정
              </span>
              으로 변경됩니다.
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-6 pb-5">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-text rounded-lg transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={!memo.trim() || isPending}
              className="px-5 py-2 text-sm font-semibold text-white bg-primary-foreground rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {isPending ? "처리 중..." : "사유 처리"}
            </button>
          </div>
    </BaseModal>
  );
}
