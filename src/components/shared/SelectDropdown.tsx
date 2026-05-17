"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SelectOption<T extends string | number = string | number> {
  value: T;
  label: string;
  color?: string;
}

interface SelectDropdownProps<T extends string | number> {
  options: SelectOption<T>[];
  value: T | null;
  onChange: (value: T | null) => void;

  /** 목록 상단에 표시할 "없음" 옵션 레이블 (null 값 선택용) */
  nullLabel?: string;

  /** 트리거 버튼 텍스트 커스텀 렌더링 */
  renderLabel?: (selected: SelectOption<T> | undefined) => React.ReactNode;

  /** 드롭다운 옵션 커스텀 렌더링 */
  renderOption?: (
    option: SelectOption<T> | null,
    isSelected: boolean
  ) => React.ReactNode;

  placeholder?: string;

  /** 트리거 스타일 변형: default(테두리), ghost(투명 인라인) */
  variant?: "default" | "ghost";

  /** 드롭다운 정렬 방향 */
  align?: "left" | "right";

  /** 드롭다운 최소 너비 (CSS 값) */
  minWidth?: string;

  className?: string;
  disabled?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SelectDropdown<T extends string | number>({
  options,
  value,
  onChange,
  nullLabel,
  renderLabel,
  renderOption,
  placeholder = "선택",
  variant = "default",
  align = "right",
  minWidth = "120px",
  className,
  disabled = false,
}: SelectDropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value) ?? undefined;

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // 기본 트리거 레이블
  const defaultLabel = (sel: SelectOption<T> | undefined): React.ReactNode => {
    if (!sel && nullLabel) return <span className="text-muted-foreground">{nullLabel}</span>;
    if (!sel) return <span className="text-muted-foreground">{placeholder}</span>;
    return (
      <span className="flex items-center gap-2">
        {sel.color && (
          <span
            className="w-3 h-3 rounded-sm shrink-0"
            style={{ backgroundColor: sel.color }}
          />
        )}
        {sel.label}
      </span>
    );
  };

  // 기본 옵션 렌더링
  const defaultOption = (
    option: SelectOption<T> | null,
    isSelected: boolean
  ): React.ReactNode => (
    <span className="flex items-center gap-2 w-full">
      {option?.color && (
        <span
          className="w-3 h-3 rounded-sm shrink-0"
          style={{ backgroundColor: option.color }}
        />
      )}
      <span className="min-w-0 flex-1 truncate">
        {option?.label ?? nullLabel ?? placeholder}
      </span>
      {isSelected && <Check className="w-3 h-3 shrink-0" />}
    </span>
  );

  const labelFn = renderLabel ?? defaultLabel;
  const optionFn = renderOption ?? defaultOption;

  // 트리거 버튼 스타일
  const triggerClass =
    variant === "ghost"
      ? cn(
          "flex items-center gap-0.5 bg-transparent text-text-strong font-bold text-lg",
          "hover:text-primary-foreground transition-colors focus:outline-none cursor-pointer",
          disabled && "opacity-50 cursor-not-allowed"
        )
      : cn(
          "flex min-w-0 items-center gap-1.5 px-3 py-2 bg-surface border border-border rounded-lg",
          "text-sm font-medium text-text hover:border-primary/50 transition-colors w-full",
          disabled && "opacity-50 cursor-not-allowed"
        );

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => !disabled && setOpen((v) => !v)}
        className={triggerClass}
        disabled={disabled}
      >
        <span
          className={variant === "default" ? "min-w-0 flex-1 truncate text-left" : undefined}
        >
          {labelFn(selected)}
        </span>
        <ChevronDown
          className={cn(
            "text-muted-foreground transition-transform shrink-0",
            variant === "ghost" ? "w-4 h-4" : "w-4 h-4",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div
          className={cn(
            "absolute top-full mt-1 bg-surface border border-border rounded-lg",
            "shadow-card-hover z-50 max-h-[320px] overflow-y-auto animate-slide-up",
            align === "right" ? "right-0" : "left-0"
          )}
          style={{ minWidth, maxWidth: "calc(100vw - 32px)" }}
        >
          {/* null 옵션 */}
          {nullLabel !== undefined && (
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
              className={cn(
                "w-full min-w-0 px-4 py-2 text-sm text-left hover:bg-muted transition-colors",
                value === null && "bg-primary/10 font-semibold text-primary-foreground"
              )}
            >
              {optionFn(null, value === null)}
            </button>
          )}

          {/* 일반 옵션 목록 */}
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={String(option.value)}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={cn(
                  "w-full min-w-0 px-4 py-2 text-sm text-left hover:bg-muted transition-colors",
                  isSelected && "bg-primary/10 font-semibold text-primary-foreground"
                )}
              >
                {optionFn(option, isSelected)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
