"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/store/useAuthStore";
import {
  decodeJwtPayload,
  getAuthUserFromAccessToken,
} from "@/features/auth/lib/token";
import {
  register,
  type RegisterPayload,
} from "@/features/auth/services/authApi";

// ── 공개 타입 ─────────────────────────────────────────────────
export type AccountType = "personal" | "company";
export type SignupStep = 1 | 2 | 3 | 4;

export interface Step1Data {
  accountType: AccountType;
  name: string;
  loginId: string;
  password: string;
}

export interface Step2Data {
  email: string;
  phone: string;
  address: string;
  emailVerified: boolean;
  phoneVerificationId: string;
}

export interface Step3Data {
  companyName: string;
  businessRegistrationNumber: string; // "XXX-XX-XXXXX" 형식
  companyAddress: string;
}

export interface CompletionData {
  companyCode: string;
  loginId: string;
  companyName?: string;
}

// ── 훅 ───────────────────────────────────────────────────────
export function useSignupForm() {
  const [step, setStep] = useState<SignupStep>(1);
  const [accountType, setAccountType] = useState<AccountType>("company");
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [step2Data, setStep2Data] = useState<Step2Data | null>(null);
  const [completionData, setCompletionData] = useState<CompletionData | null>(
    null
  );

  const { setAuth } = useAuthStore();

  const mutation = useMutation({
    mutationFn: (payload: RegisterPayload) => register(payload),
    onSuccess: (response: { data: { accessToken: string } }) => {
      const { accessToken } = response.data;
      const decoded = decodeJwtPayload(accessToken);
      const user = getAuthUserFromAccessToken(accessToken);

      setAuth({ user, accessToken });
      setCompletionData({
        companyCode: decoded.companyCode,
        loginId: decoded.loginId,
      });
      setStep(4);
    },
  });

  // ── 단계별 핸들러 ─────────────────────────────────────────
  const handleStep1Next = (data: Step1Data) => {
    setStep1Data(data);
    setAccountType(data.accountType);
    setStep(2);
  };

  const handleStep2Next = (data: Step2Data) => {
    setStep2Data(data);
    if (accountType === "company") {
      setStep(3);
    } else {
      // 개인: 회사 단계 건너뜀 → 바로 제출
      if (!step1Data) return;
      const payload = buildPersonalPayload(step1Data, data);
      mutation.mutate(payload);
    }
  };

  const handleStep3Next = (data: Step3Data) => {
    if (!step1Data || !step2Data) return;
    setCompletionData((prev) => ({ ...prev!, companyName: data.companyName }));
    const payload = buildPayload(step1Data, step2Data, data);
    mutation.mutate(payload);
  };

  const handleBack = () => {
    setStep((prev) => {
      if (prev === 2) return 1;
      if (prev === 3) return 2;
      return prev;
    });
  };

  return {
    step,
    accountType,
    completionData,
    isPending: mutation.isPending,
    error: mutation.error,
    handleStep1Next,
    handleStep2Next,
    handleStep3Next,
    handleBack,
  };
}

// ── 헬퍼 ─────────────────────────────────────────────────────
function buildPersonalPayload(s1: Step1Data, s2: Step2Data): RegisterPayload {
  return {
    type: "PERSONAL",
    loginId: s1.loginId,
    password: s1.password,
    name: s1.name,
    phone: s2.phone,
    phoneVerificationId: s2.phoneVerificationId,
    address: s2.address,
    email: s2.email || undefined,
    emailVerified: s2.emailVerified,
  };
}

function buildPayload(
  s1: Step1Data,
  s2: Step2Data,
  s3: Step3Data
): RegisterPayload {
  return {
    type: "BUSINESS",
    loginId: s1.loginId,
    password: s1.password,
    name: s1.name,
    phone: s2.phone,
    phoneVerificationId: s2.phoneVerificationId,
    address: s2.address,
    email: s2.email || undefined,
    emailVerified: s2.emailVerified,
    companyName: s3.companyName,
    businessRegistrationNumber: s3.businessRegistrationNumber.replace(/-/g, ""),
    companyAddress: s3.companyAddress,
  };
}
