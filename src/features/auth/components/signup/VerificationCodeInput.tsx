"use client";

import { AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatTime } from "@/features/auth/hooks/useVerificationField";

interface VerificationCodeInputProps {
  code: string;
  timer?: number;
  loading: boolean;
  error?: string;
  onCodeChange: (v: string) => void;
  onVerify: () => void;
  onResend: () => void;
}

export function VerificationCodeInput({
  code,
  timer,
  loading,
  error,
  onCodeChange,
  onVerify,
  onResend,
}: VerificationCodeInputProps) {
  return (
    <div className="mt-2 space-y-2 animate-slide-up">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            maxLength={6}
            placeholder="인증번호 6자리"
            value={code}
            onChange={(e) => onCodeChange(e.target.value.replace(/\D/g, ""))}
            className="font-mono tracking-widest text-center"
          />
          {timer !== undefined && timer > 0 && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-secondary flex items-center gap-1">
              <Clock size={12} />
              {formatTime(timer)}
            </span>
          )}
        </div>
        <Button
          type="button"
          size="sm"
          className="shrink-0 h-11 px-4"
          onClick={onVerify}
          disabled={loading || timer === 0}
        >
          확인
        </Button>
      </div>

      {timer !== undefined && timer === 0 && (
        <p className="text-xs text-danger-foreground flex items-center gap-1">
          <Clock size={12} />
          인증 시간이 만료되었습니다.{" "}
          <button type="button" className="underline" onClick={onResend}>
            재발송
          </button>
        </p>
      )}

      {error && (
        <p className="text-xs text-danger-foreground flex items-center gap-1">
          <AlertCircle size={12} />
          {error}
        </p>
      )}
    </div>
  );
}
