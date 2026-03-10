import apiClient from "@/lib/axios";
import type { LoginResponse } from "@/types/auth";

// ── 회원가입 API 페이로드 ──────────────────────────────────────
export interface RegisterCompanyPayload {
  loginId: string;
  password: string;
  name: string;
  phone: string;
  address: string;
  email?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  companyName: string;
  businessRegistrationNumber: string;
  companyAddress: string;
}

// ── 아이디 중복 확인 ──────────────────────────────────────────
export interface CheckIdResponse {
  available: boolean;
  message: string;
}

export const checkLoginId = async (
  loginId: string
): Promise<CheckIdResponse> => {
  const { data } = await apiClient.get<CheckIdResponse>("/auth/check-id", {
    params: { loginId },
  });
  return data;
};

// ── 이메일 인증 ───────────────────────────────────────────────
export const requestEmailVerification = async (
  email: string
): Promise<void> => {
  await apiClient.post("/auth/email/send-code", { email });
};

export const verifyEmailCode = async (
  email: string,
  code: string
): Promise<{ verified: boolean }> => {
  const { data } = await apiClient.post<{ verified: boolean }>(
    "/auth/email/verify",
    { email, code }
  );
  return data;
};

// ── 휴대폰 인증 ───────────────────────────────────────────────
export const requestPhoneVerification = async (
  phone: string
): Promise<void> => {
  await apiClient.post("/auth/phone/send-code", { phone });
};

export const verifyPhoneCode = async (
  phone: string,
  code: string
): Promise<{ verified: boolean }> => {
  const { data } = await apiClient.post<{ verified: boolean }>(
    "/auth/phone/verify",
    { phone, code }
  );
  return data;
};

// ── 회사 + 오너 회원가입 ──────────────────────────────────────
export const registerCompany = async (
  payload: RegisterCompanyPayload
): Promise<LoginResponse> => {
  const { data } = await apiClient.post<LoginResponse>(
    "/auth/company/register",
    payload
  );
  return data;
};
