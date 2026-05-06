"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, Loader2, Phone, Send, X } from "lucide-react";
import { BaseModal } from "@/components/shared/BaseModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useFirebasePhone } from "@/features/auth/hooks/useFirebasePhone";
import { verifyCurrentUserPhone } from "@/features/auth/services/authApi";

const RECAPTCHA_CONTAINER_ID = "phone-update-recaptcha-container";
const PHONE_CODE_TTL_SECONDS = 300;

function formatPhone(val: string) {
  const d = val.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function extractError(err: unknown): string | null {
  if (!err) return null;
  const axiosErr = err as { response?: { data?: { message?: string } } };
  return axiosErr.response?.data?.message ?? null;
}

interface PhoneUpdateVerificationModalProps {
  open: boolean;
  onClose: () => void;
  onVerified: () => void;
}

export function PhoneUpdateVerificationModal({
  open,
  onClose,
  onVerified,
}: PhoneUpdateVerificationModalProps) {
  const firebasePhone = useFirebasePhone();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [timer, setTimer] = useState(0);
  const [localError, setLocalError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const expirePhoneCode = firebasePhone.expireCode;

  const applyVerification = useMutation({
    mutationFn: (phoneVerificationId: string) =>
      verifyCurrentUserPhone(phoneVerificationId),
  });

  const phoneSent =
    Boolean(firebasePhone.targetPhone) &&
    (firebasePhone.status === "sent" ||
      firebasePhone.status === "verifying" ||
      firebasePhone.status === "verified" ||
      firebasePhone.status === "error");
  const isWorking =
    firebasePhone.status === "sending" ||
    firebasePhone.status === "verifying" ||
    applyVerification.isPending;
  const error =
    localError ?? firebasePhone.error ?? extractError(applyVerification.error);

  const resetState = () => {
    setPhone("");
    setCode("");
    setTimer(0);
    setLocalError(null);
    firebasePhone.reset();
    applyVerification.reset();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleClose = () => {
    if (isWorking) return;
    resetState();
    onClose();
  };

  useEffect(() => {
    if (!open) resetState();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    // resetState는 Firebase verifier까지 초기화하므로 open 변화에만 묶습니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (firebasePhone.status !== "sent") return;

    if (timerRef.current) clearInterval(timerRef.current);
    setTimer(PHONE_CODE_TTL_SECONDS);
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          setCode("");
          expirePhoneCode();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

  }, [firebasePhone.status, expirePhoneCode]);

  useEffect(() => {
    if (
      firebasePhone.status === "idle" ||
      firebasePhone.status === "sending" ||
      firebasePhone.status === "verified"
    ) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [firebasePhone.status]);

  const handlePhoneChange = (value: string) => {
    const nextPhone = formatPhone(value);
    if (firebasePhone.targetPhone && nextPhone !== firebasePhone.targetPhone) {
      firebasePhone.reset();
      applyVerification.reset();
      setCode("");
      setTimer(0);
    }
    setLocalError(null);
    setPhone(nextPhone);
  };

  const handleSendPhone = async () => {
    if (!/^010-\d{4}-\d{4}$/.test(phone)) {
      setLocalError("올바른 휴대폰 번호를 입력해주세요.");
      return;
    }

    setLocalError(null);
    setCode("");
    setTimer(0);
    applyVerification.reset();
    await firebasePhone.sendCode(phone, RECAPTCHA_CONTAINER_ID, "normal");
  };

  const handleVerifyPhone = async () => {
    if (code.length !== 6) {
      setLocalError("6자리 인증번호를 입력해주세요.");
      return;
    }
    if (!firebasePhone.verification && timer === 0) {
      setCode("");
      expirePhoneCode();
      return;
    }

    setLocalError(null);
    const verification =
      firebasePhone.verification ??
      (await firebasePhone.confirmCode({
        code,
        phone,
        purpose: "phoneUpdate",
      }));

    if (!verification) return;

    try {
      await applyVerification.mutateAsync(verification.phoneVerificationId);
    } catch {
      return;
    }

    toast.success("휴대폰 인증 상태가 반영되었습니다.");
    onVerified();
    resetState();
    onClose();
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
          <h2 className="text-lg font-bold text-text-strong">휴대폰 인증</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            계정의 휴대폰 인증 상태를 갱신합니다
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

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleVerifyPhone();
        }}
        className="space-y-5 px-5 py-5"
      >
        <div id={RECAPTCHA_CONTAINER_ID} />

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text">휴대폰 번호</label>
          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="tel"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="010-0000-0000"
                disabled={isWorking || firebasePhone.status === "verified"}
                className={cn(
                  "pl-9",
                  firebasePhone.status === "verified" &&
                    "border-success ring-1 ring-success/40"
                )}
              />
              {firebasePhone.status === "verified" && (
                <CheckCircle2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-success-foreground" />
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-11 shrink-0 px-3 text-xs"
              onClick={handleSendPhone}
              disabled={
                isWorking ||
                firebasePhone.status === "verified" ||
                (phoneSent && timer > 0)
              }
            >
              {firebasePhone.status === "sending" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : phoneSent && timer > 0 ? (
                formatTime(timer)
              ) : phoneSent ? (
                "인증번호 재발송"
              ) : (
                "인증번호 발송"
              )}
            </Button>
          </div>
        </div>

        {phoneSent && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text">인증번호</label>
            <div className="flex gap-2">
              <Input
                inputMode="numeric"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="6자리"
                disabled={
                  isWorking || Boolean(firebasePhone.verification) || timer === 0
                }
                className="text-center font-mono tracking-[0.35em]"
              />
              <Button
                type="submit"
                className="h-11 shrink-0 px-4"
                disabled={
                  isWorking || (!firebasePhone.verification && code.length !== 6)
                }
              >
                {isWorking ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : firebasePhone.verification ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    반영
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    확인
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-danger/40 bg-danger/20 px-3 py-2 text-sm text-danger-foreground">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </form>
    </BaseModal>
  );
}
