"use client";

import { useEffect } from "react";
import { ModalPortal } from "./ModalPortal";
import { cn } from "@/lib/utils";

interface BaseModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** 패널 최대 너비. 예: "max-w-lg", "max-w-2xl", "max-w-4xl" */
  maxWidth?: string;
  /** 패널 div에 추가할 클래스. max-h, overflow, bg 재정의 등 */
  panelClassName?: string;
  /** 백드롭 클릭 시 닫기 여부 (기본값: true) */
  closeOnBackdrop?: boolean;
  /** z-index 클래스 (기본값: "z-50"). 중첩 모달 시 "z-[60]" 등 사용 */
  zIndex?: string;
  /** 외부 패딩 클래스 (기본값: "p-4"). 넓은 모달은 "p-3 sm:p-6" */
  padding?: string;
}

export function BaseModal({
  open,
  onClose,
  children,
  maxWidth = "max-w-lg",
  panelClassName,
  closeOnBackdrop = true,
  zIndex = "z-50",
  padding = "p-4",
}: BaseModalProps) {
  // ESC 키로 닫기
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // 배경 스크롤 잠금
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <ModalPortal>
      <div
        className={cn("fixed inset-0 flex items-center justify-center", zIndex, padding)}
        onClick={closeOnBackdrop ? (e) => e.target === e.currentTarget && onClose() : undefined}
      >
        {/* 백드롭 */}
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={closeOnBackdrop ? onClose : undefined}
        />
        {/* 패널 */}
        <div
          className={cn(
            "relative bg-surface rounded-2xl shadow-card-hover w-full border border-border animate-slide-up",
            maxWidth,
            panelClassName
          )}
        >
          {children}
        </div>
      </div>
    </ModalPortal>
  );
}
