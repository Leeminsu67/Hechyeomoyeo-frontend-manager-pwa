"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/axios";
import { useAuthStore } from "@/store/useAuthStore";
import { getAuthClientType } from "@/features/auth/lib/clientType";
import { getAuthUserFromAccessToken } from "@/features/auth/lib/token";
import type { LoginDto, LoginResponse } from "@/types/auth";
import { syncFcmTokenIfGranted } from "@/features/notifications/services/pushNotificationRegistration";

type LoginCredentials = Omit<LoginDto, "clientType">;

async function loginApi(dto: LoginCredentials): Promise<LoginResponse> {
  const clientType = getAuthClientType();
  const { data } = await apiClient.post<LoginResponse>(
    "/auth/login",
    { ...dto, clientType },
    { skipAuthRefresh: true, withCredentials: true }
  );
  return data;
}

export function useLogin() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  return useMutation({
    mutationFn: loginApi,
    onSuccess: (response) => {
      const clientType = getAuthClientType();
      const { accessToken } = response.data;
      const user = getAuthUserFromAccessToken(accessToken);

      setAuth({ user, accessToken, clientType });
      void syncFcmTokenIfGranted(user.role).catch(() => undefined);

      // 대시보드로 이동
      router.push("/dashboard");
    },
  });
}
