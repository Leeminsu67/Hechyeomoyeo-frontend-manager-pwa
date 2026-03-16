"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface ImageViewModalProps {
  url: string | null;
  onClose: () => void;
}

export function ImageViewModal({ url, onClose }: ImageViewModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (url) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKey);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [url, onClose]);

  if (!url) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 animate-fade-in"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 rounded-full text-white transition-colors z-10"
        onClick={onClose}
        aria-label="닫기"
      >
        <X className="w-6 h-6" />
      </button>
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-w-4xl max-h-[90vh] p-4"
      >
        <img
          src={url}
          alt="원본 이미지"
          className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
        />
      </div>
    </div>
  );
}
