"use client";

import { useRef, useState, useCallback } from "react";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase";
import apiClient from "@/lib/axios";

// 010-1234-5678 → +821012345678
function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) {
    return `+82${digits.slice(1)}`;
  }
  return `+${digits}`;
}

export type PhoneVerifyStatus =
  | "idle"
  | "sending"
  | "sent"
  | "verifying"
  | "verified"
  | "error";

export interface UseFirebasePhoneReturn {
  status: PhoneVerifyStatus;
  error: string | null;
  sendCode: (phone: string, containerId: string) => Promise<void>;
  confirmCode: (code: string) => Promise<void>;
  reset: () => void;
}

export function useFirebasePhone(): UseFirebasePhoneReturn {
  const [status, setStatus] = useState<PhoneVerifyStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    confirmationRef.current = null;
    if (recaptchaRef.current) {
      recaptchaRef.current.clear();
      recaptchaRef.current = null;
    }
  }, []);

  // SMS 발송
  const sendCode = useCallback(
    async (phone: string, containerId: string) => {
      setError(null);
      setStatus("sending");

      try {
        // RecaptchaVerifier가 없으면 새로 생성, 있으면 재사용
        if (!recaptchaRef.current) {
          recaptchaRef.current = new RecaptchaVerifier(
            firebaseAuth,
            containerId,
            { size: "invisible" }
          );
        }

        const e164 = toE164(phone);
        const confirmation = await signInWithPhoneNumber(
          firebaseAuth,
          e164,
          recaptchaRef.current
        );
        confirmationRef.current = confirmation;
        setStatus("sent");
      } catch (err) {
        console.error("[Firebase Phone] sendCode error:", err);

        // reCAPTCHA 오염 시 초기화해서 다음 재시도에서 새로 생성되도록 함
        if (recaptchaRef.current) {
          recaptchaRef.current.clear();
          recaptchaRef.current = null;
        }

        const code = (err as { code?: string }).code ?? "";
        if (code === "auth/invalid-phone-number") {
          setError("올바른 휴대폰 번호를 입력해주세요.");
        } else if (code === "auth/too-many-requests") {
          setError("요청이 너무 많습니다. 잠시 후 다시 시도해주세요.");
        } else {
          setError("인증 문자 발송에 실패했습니다. 다시 시도해주세요.");
        }
        setStatus("error");
      }
    },
    []
  );

  // 인증번호 확인 → 백엔드에 idToken 전송
  const confirmCode = useCallback(async (code: string) => {
    if (!confirmationRef.current) {
      setError("먼저 인증 문자를 요청해주세요.");
      return;
    }

    setError(null);
    setStatus("verifying");

    try {
      const result = await confirmationRef.current.confirm(code);
      const idToken = await result.user.getIdToken();

      // 백엔드 검증
      await apiClient.post("/auth/phone/verify", { idToken });

      setStatus("verified");
    } catch (err) {
      console.error("[Firebase Phone] confirmCode error:", err);
      const code = (err as { code?: string }).code ?? "";
      if (code === "auth/invalid-verification-code") {
        setError("인증번호가 올바르지 않습니다.");
      } else if (code === "auth/code-expired") {
        setError("인증번호가 만료되었습니다. 다시 요청해주세요.");
      } else {
        setError("인증 확인 중 오류가 발생했습니다.");
      }
      setStatus("error");
    }
  }, []);

  return { status, error, sendCode, confirmCode, reset };
}
