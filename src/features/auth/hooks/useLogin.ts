"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/axios";
import { useAuthStore } from "@/store/useAuthStore";
import type { LoginDto, LoginResponse, JwtPayload, AuthUser } from "@/types/auth";
import { syncFcmTokenIfGranted } from "@/features/notifications/services/pushNotificationRegistration";

async function loginApi(dto: LoginDto): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>("/auth/login", dto);
  return data;
}

export function useLogin() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  return useMutation({
    mutationFn: loginApi,
    onSuccess: (response) => {
      const { accessToken } = response.data;

      // JWT 디코드하여 유저 정보 추출
      const parts = accessToken.split(".");
      if (parts.length !== 3) throw new Error("유효하지 않은 토큰 형식입니다.");

      const payload = JSON.parse(
        atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
      ) as JwtPayload;

      const user: AuthUser = {
        id: payload.sub,
        loginId: payload.loginId,
        companyId: payload.companyId,
        companyCode: payload.companyCode,
        role: payload.role,
        hasManagePermission: payload.hasManagePermission,
      };

      setAuth({ user, accessToken });
      void syncFcmTokenIfGranted().catch(() => undefined);

      // 대시보드로 이동
      router.push("/dashboard");
    },
  });
}
