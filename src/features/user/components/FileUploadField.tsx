"use client";

import { useRef, useState } from "react";
import { Upload, X, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadFieldProps {
  label: string;
  existingUrl?: string;
  value?: File | null;
  onChange: (file: File | null) => void;
  onPreviewClick?: (url: string) => void;
  disabled?: boolean;
  accept?: string;
}

export function FileUploadField({
  label,
  existingUrl,
  value,
  onChange,
  onPreviewClick,
  disabled = false,
  accept = "image/*",
}: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  const handleFile = (file: File) => {
    if (file.type.startsWith("image/")) {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      const url = URL.createObjectURL(file);
      setObjectUrl(url);
      onChange(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleClear = () => {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    setObjectUrl(null);
    onChange(null);
  };

  const previewUrl = objectUrl ?? existingUrl;

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-text">{label}</label>

      {previewUrl ? (
        <div className="relative group rounded-lg overflow-hidden border border-border w-full h-36 bg-muted">
          <img
            src={previewUrl}
            alt={label}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            {onPreviewClick && (
              <button
                type="button"
                onClick={() => onPreviewClick(previewUrl)}
                className="p-2 bg-white/90 rounded-full text-text hover:bg-white transition-colors"
                aria-label="크게 보기"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            )}
            {!disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="p-2 bg-white/90 rounded-full text-danger-foreground hover:bg-white transition-colors"
                aria-label="삭제"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div
          onClick={() => !disabled && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed h-36 transition-colors",
            disabled
              ? "cursor-not-allowed opacity-50 border-border"
              : "cursor-pointer border-primary hover:border-primary-400 hover:bg-primary-50",
            dragOver && "border-primary-400 bg-primary-50"
          )}
        >
          <Upload className="w-6 h-6 text-primary-500" />
          <p className="text-xs text-muted-foreground text-center leading-5">
            클릭하거나 드래그하여 업로드
            <br />
            <span className="text-primary-500 font-medium">
              JPG, PNG 이미지
            </span>
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
