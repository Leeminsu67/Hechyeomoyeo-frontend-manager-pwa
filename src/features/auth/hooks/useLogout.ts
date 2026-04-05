"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/axios";
import { useAuthStore } from "@/store/useAuthStore";

async function logoutApi(): Promise<void> {
  // refreshToken은 httpOnly 쿠키로 자동 전송
  await apiClient.post("/auth/logout");
}

export function useLogout() {
  const router = useRouter();
  const { clearAuth } = useAuthStore();

  return useMutation({
    mutationFn: logoutApi,
    onSettled: () => {
      // 서버 응답 성공/실패 무관하게 로컬 상태 정리 후 로그인 페이지로 이동
      clearAuth();
      router.replace("/login");
    },
  });
}
