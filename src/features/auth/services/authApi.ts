import apiClient from "@/lib/axios";
import type { LoginResponse } from "@/types/auth";

// ── 회원가입 유형 ─────────────────────────────────────────────
export type RegisterType = "PERSONAL" | "BUSINESS";

// ── 회원가입 API 페이로드 ──────────────────────────────────────
export interface RegisterPayload {
  type: RegisterType;
  loginId: string;
  password: string;
  name: string;
  phone: string;
  phoneVerificationId: string;
  address: string;
  email?: string;
  emailVerified?: boolean;
  // 기업 회원가입 시 필수
  companyName?: string;
  businessRegistrationNumber?: string;
  companyAddress?: string;
}

export type PhoneVerificationPurpose = "register" | "phoneUpdate";

export interface PhoneVerificationPayload {
  phone: string;
  idToken: string;
  purpose: PhoneVerificationPurpose;
}

export interface PhoneVerificationResult {
  phoneVerificationId: string;
  phoneNumber: string;
  purpose: PhoneVerificationPurpose;
  expiresAt: string;
}

// ── 아이디 중복 확인 ──────────────────────────────────────────
export interface CheckIdResponse {
  available: boolean;
}

export const checkLoginId = async (
  loginId: string
): Promise<CheckIdResponse> => {
  const { data } = await apiClient.get<{ data: { checkId: boolean } }>(
    "/auth/check/id",
    { params: { loginId } }
  );
  // checkId: true = 사용 가능, false = 중복
  return { available: data.data.checkId };
};

// ── 이메일 인증 ───────────────────────────────────────────────
export const requestEmailVerification = async (
  email: string
): Promise<void> => {
  await apiClient.post("/auth/email/send-verification", { email });
};

export const verifyEmailCode = async (token: string): Promise<void> => {
  await apiClient.get("/auth/email/verify", { params: { token } });
};

// ── 회원가입 (개인 / 기업 통합) ───────────────────────────────
export const register = async (
  payload: RegisterPayload
): Promise<LoginResponse> => {
  const { data } = await apiClient.post<LoginResponse>(
    "/auth/register",
    payload
  );
  return data;
};

// ── Firebase 휴대폰 인증 결과 서버 검증 ───────────────────────
export const verifyFirebasePhone = async (
  payload: PhoneVerificationPayload
): Promise<PhoneVerificationResult> => {
  const { data } = await apiClient.post<{ data: PhoneVerificationResult }>(
    "/auth/phone/verify",
    payload
  );
  return data.data;
};

// ── 로그인 사용자 휴대폰 인증 상태 반영 ───────────────────────
export const verifyCurrentUserPhone = async (
  phoneVerificationId: string
): Promise<void> => {
  await apiClient.post("/auth/phone/me/verify", { phoneVerificationId });
};
