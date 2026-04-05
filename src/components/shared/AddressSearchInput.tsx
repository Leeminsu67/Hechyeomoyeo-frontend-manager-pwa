"use client";

import { useState, useRef } from "react";
import DaumPostcode, { Address } from "react-daum-postcode";
import { MapPin, X, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AddressSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  detailValue?: string;
  onDetailChange?: (value: string) => void;
  detailRequired?: boolean;
  detailError?: string;
  detailPlaceholder?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function AddressSearchInput({
  value,
  onChange,
  detailValue,
  onDetailChange,
  detailRequired,
  detailError,
  detailPlaceholder = "상세주소 입력 (동/호수 등)",
  placeholder = "주소 검색",
  className,
  disabled,
}: AddressSearchInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleComplete = (data: Address) => {
    const fullAddress =
      data.userSelectedType === "R" ? data.roadAddress : data.jibunAddress;
    onChange(fullAddress);
    setIsOpen(false);
  };

  const handleInputClick = () => {
    if (!disabled) setIsOpen(true);
  };

  const handleClose = () => setIsOpen(false);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    onDetailChange?.("");
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="flex flex-col">
      {/* 주소 입력 필드 */}
      <div className="relative">
        <MapPin
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10"
        />
        <Input
          readOnly
          value={value}
          placeholder={placeholder}
          className={cn(
            "pl-8 pr-10 cursor-pointer",
            isOpen && "border-primary ring-1 ring-primary/40",
            className
          )}
          onClick={handleInputClick}
          disabled={disabled}
        />
        {value && !disabled ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-text transition-colors"
            aria-label="주소 초기화"
          >
            <X size={14} />
          </button>
        ) : (
          !disabled && (
            <Search
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
          )
        )}
      </div>

      {/* 우편번호 검색 패널 (인라인) */}
      {isOpen && (
        <div className="mt-[10px] animate-slide-up">
          <div className="rounded-xl border border-primary/30 bg-surface overflow-hidden shadow-lg">
            {/* 패널 헤더 */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-primary/10 border-b border-primary/20">
              <span className="text-xs font-semibold text-primary-500 flex items-center gap-1.5">
                <Search size={12} />
                주소 검색
              </span>
              <button
                type="button"
                onClick={handleClose}
                className="p-1 rounded-md hover:bg-primary/20 transition-colors text-muted-foreground hover:text-text"
                aria-label="검색 닫기"
              >
                <X size={14} />
              </button>
            </div>

            {/* Daum 우편번호 컴포넌트 */}
            <DaumPostcode
              onComplete={handleComplete}
              autoClose={false}
              style={{
                width: "100%",
                height: 380,
                display: "block",
              }}
            />
          </div>
        </div>
      )}

      {/* 상세주소 입력 */}
      {value && !isOpen && onDetailChange !== undefined && (
        <div className="mt-[10px] animate-slide-up space-y-1.5">
          <div className="relative">
            <MapPin
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10"
            />
            <Input
              value={detailValue ?? ""}
              onChange={(e) => onDetailChange(e.target.value)}
              placeholder={detailPlaceholder}
              disabled={disabled}
              className={cn(
                "pl-8",
                detailError && "border-danger focus-visible:ring-danger/30"
              )}
            />
            {detailRequired && !detailError && !detailValue && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-danger-foreground/70 pointer-events-none">
                필수
              </span>
            )}
          </div>
          {detailError && (
            <p className="text-xs text-danger-foreground">{detailError}</p>
          )}
        </div>
      )}
    </div>
  );
}
