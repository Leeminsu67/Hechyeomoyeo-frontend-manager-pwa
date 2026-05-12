"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  X,
} from "lucide-react";
import { BaseModal } from "@/components/shared/BaseModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { changeMyPassword } from "../services/accountApi";

function validatePassword(password: string) {
  if (password.length < 6) return "비밀번호는 최소 6자 이상이어야 합니다.";
  if (!/[a-zA-Z]/.test(password)) return "비밀번호는 영문을 포함해야 합니다.";
  if (!/\d/.test(password)) return "비밀번호는 숫자를 포함해야 합니다.";
  if (!/[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/'`~;]/.test(password)) {
    return "비밀번호는 특수문자를 포함해야 합니다.";
  }
  return null;
}

function extractError(err: unknown): string {
  const axiosErr = err as { response?: { data?: { message?: string } } };
  return axiosErr.response?.data?.message ?? "비밀번호 변경에 실패했습니다.";
}

function PasswordInput({
  label,
  value,
  onChange,
  autoComplete,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  error?: string | null;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-text">{label}</span>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          className={cn("pl-9 pr-10", error && "border-danger")}
        />
        <button
          type="button"
          onClick={() => setVisible((next) => !next)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-text"
          aria-label={visible ? "비밀번호 숨기기" : "비밀번호 보기"}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="text-xs font-medium text-danger-foreground">{error}</p>}
    </label>
  );
}

export function PasswordChangeModal({
  open,
  onClose,
  onChanged,
}: {
  open: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const changePasswordMutation = useMutation({
    mutationFn: changeMyPassword,
    onSuccess: (response) => {
      toast.success(response.message ?? "비밀번호가 변경되었습니다.");
      onChanged();
      resetState();
      onClose();
    },
  });

  const resetState = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setLocalError(null);
    changePasswordMutation.reset();
  };

  const isWorking = changePasswordMutation.isPending;
  const newPasswordError = newPassword ? validatePassword(newPassword) : null;
  const confirmError =
    confirmPassword && newPassword !== confirmPassword
      ? "새 비밀번호가 일치하지 않습니다."
      : null;
  const serverError = changePasswordMutation.error
    ? extractError(changePasswordMutation.error)
    : null;
  const error = localError ?? serverError;

  useEffect(() => {
    if (!open) resetState();
    // resetState는 mutation 상태까지 초기화하므로 open 변화에만 묶습니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleClose = () => {
    if (isWorking) return;
    resetState();
    onClose();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!currentPassword) {
      setLocalError("현재 비밀번호를 입력해주세요.");
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setLocalError(passwordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setLocalError("새 비밀번호가 일치하지 않습니다.");
      return;
    }

    setLocalError(null);
    changePasswordMutation.mutate({
      currentPassword,
      newPassword,
    });
  };

  return (
    <BaseModal
      open={open}
      onClose={handleClose}
      closeOnBackdrop={!isWorking}
      maxWidth="max-w-md"
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="text-lg font-bold text-text-strong">비밀번호 변경</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            휴대폰 인증을 완료한 뒤 현재 비밀번호를 새 비밀번호로 변경합니다
          </p>
        </div>
        <button
          type="button"
          onClick={handleClose}
          disabled={isWorking}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-text"
          aria-label="닫기"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
        <div className="flex items-start gap-2 rounded-lg border border-success/40 bg-success/15 px-3 py-2 text-sm text-success-foreground">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>휴대폰 인증이 완료되었습니다.</span>
        </div>

        <PasswordInput
          label="현재 비밀번호"
          value={currentPassword}
          onChange={(value) => {
            setLocalError(null);
            setCurrentPassword(value);
          }}
          autoComplete="current-password"
        />
        <PasswordInput
          label="새 비밀번호"
          value={newPassword}
          onChange={(value) => {
            setLocalError(null);
            setNewPassword(value);
          }}
          autoComplete="new-password"
          error={newPasswordError}
        />
        <PasswordInput
          label="새 비밀번호 확인"
          value={confirmPassword}
          onChange={(value) => {
            setLocalError(null);
            setConfirmPassword(value);
          }}
          autoComplete="new-password"
          error={confirmError}
        />

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-danger/40 bg-danger/20 px-3 py-2 text-sm text-danger-foreground">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isWorking}
          >
            취소
          </Button>
          <Button
            type="submit"
            disabled={
              isWorking ||
              !currentPassword ||
              !newPassword ||
              !confirmPassword ||
              Boolean(newPasswordError) ||
              Boolean(confirmError)
            }
          >
            {isWorking ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
            변경
          </Button>
        </div>
      </form>
    </BaseModal>
  );
}
