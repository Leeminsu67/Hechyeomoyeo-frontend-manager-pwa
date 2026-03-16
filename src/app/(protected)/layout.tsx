"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * 보호된 라우트 레이아웃 (클라이언트 2중 가드)
 *
 * 1차 가드: middleware.ts — 쿠키(auth_flag) 기반, Edge에서 즉시 차단 (SSR)
 * 2차 가드: 이 컴포넌트 — Zustand 스토어 기반, localStorage hydration 완료 후 재확인
 *
 * 주의: Zustand persist는 클라이언트 마운트 후 localStorage를 비동기로 읽으므로
 * hydration 완료 전에는 isAuthenticated가 항상 false다. 완료를 기다린 뒤 체크한다.
 */
export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Zustand persist의 localStorage hydration 완료를 구독
    const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    // 이미 hydration이 끝난 경우 (빠른 내비게이션 등)
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
    }

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace("/login");
    }
  }, [hydrated, isAuthenticated, router]);

  // hydration 전 또는 미인증 상태면 아무것도 렌더하지 않음
  if (!hydrated || !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
