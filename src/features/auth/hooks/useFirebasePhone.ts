"use client";

import { useRef, useState, useCallback } from "react";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase";
import {
  verifyFirebasePhone,
  type PhoneVerificationPurpose,
  type PhoneVerificationResult,
} from "@/features/auth/services/authApi";

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
  targetPhone: string | null;
  verification: PhoneVerificationResult | null;
  sendCode: (
    phone: string,
    containerId: string,
    recaptchaSize?: "invisible" | "normal"
  ) => Promise<void>;
  confirmCode: (params: {
    code: string;
    phone: string;
    purpose: PhoneVerificationPurpose;
  }) => Promise<PhoneVerificationResult | null>;
  expireCode: () => void;
  reset: () => void;
}

export function useFirebasePhone(): UseFirebasePhoneReturn {
  const [status, setStatus] = useState<PhoneVerifyStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [targetPhone, setTargetPhone] = useState<string | null>(null);
  const [verification, setVerification] =
    useState<PhoneVerificationResult | null>(null);
  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);
  const targetPhoneRef = useRef<string | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setTargetPhone(null);
    setVerification(null);
    confirmationRef.current = null;
    targetPhoneRef.current = null;
    if (recaptchaRef.current) {
      recaptchaRef.current.clear();
      recaptchaRef.current = null;
    }
  }, []);

  const expireCode = useCallback(() => {
    confirmationRef.current = null;
    setVerification(null);
    setError("인증 시간이 만료되었습니다. 인증번호를 재발송해주세요.");
    setStatus("error");
  }, []);

  // SMS 발송
  const sendCode = useCallback(
    async (
      phone: string,
      containerId: string,
      recaptchaSize: "invisible" | "normal" = "normal"
    ) => {
      setError(null);
      setStatus("sending");
      setVerification(null);
      confirmationRef.current = null;
      setTargetPhone(phone);
      targetPhoneRef.current = phone;

      try {
        if (recaptchaRef.current) {
          recaptchaRef.current.clear();
        }
        recaptchaRef.current = new RecaptchaVerifier(
          firebaseAuth,
          containerId,
          { size: recaptchaSize }
        );

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
        setTargetPhone(null);
        targetPhoneRef.current = null;

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
        } else if (code === "auth/invalid-app-credential") {
          setError(
            "Firebase 앱 인증에 실패했습니다. reCAPTCHA를 완료한 뒤 다시 시도해주세요."
          );
        } else if (code === "auth/quota-exceeded") {
          setError("SMS 발송 한도를 초과했습니다. 잠시 후 다시 시도해주세요.");
        } else if (code === "auth/operation-not-allowed") {
          setError("Firebase 전화 인증 제공자가 비활성화되어 있습니다.");
        } else {
          setError("인증 문자 발송에 실패했습니다. 다시 시도해주세요.");
        }
        setStatus("error");
      }
    },
    []
  );

  // 인증번호 확인 → Firebase ID Token을 백엔드에 검증 요청
  const confirmCode = useCallback(
    async ({
      code,
      phone,
      purpose,
    }: {
      code: string;
      phone: string;
      purpose: PhoneVerificationPurpose;
    }): Promise<PhoneVerificationResult | null> => {
      if (!confirmationRef.current || !targetPhoneRef.current) {
        setError("먼저 인증 문자를 요청해주세요.");
        return null;
      }

      if (toE164(phone) !== toE164(targetPhoneRef.current)) {
        setError("인증 요청한 번호와 현재 입력 번호가 다릅니다. 다시 요청해주세요.");
        setVerification(null);
        setStatus("error");
        return null;
      }

      setError(null);
      setStatus("verifying");

      try {
        const result = await confirmationRef.current.confirm(code);
        const idToken = await result.user.getIdToken();
        const verified = await verifyFirebasePhone({ phone, idToken, purpose });

        setVerification(verified);
        setStatus("verified");
        return verified;
      } catch (err) {
        console.error("[Firebase Phone] confirmCode error:", err);
        const code = (err as { code?: string }).code ?? "";
        const message = (err as { response?: { data?: { message?: string } } })
          ?.response?.data?.message;
        if (code === "auth/invalid-verification-code") {
          setError("인증번호가 올바르지 않습니다.");
        } else if (code === "auth/code-expired") {
          setError("인증번호가 만료되었습니다. 다시 요청해주세요.");
        } else {
          setError(message ?? "인증 확인 중 오류가 발생했습니다.");
        }
        setVerification(null);
        setStatus("error");
        return null;
      }
    },
    []
  );

  return {
    status,
    error,
    targetPhone,
    verification,
    sendCode,
    confirmCode,
    expireCode,
    reset,
  };
}
