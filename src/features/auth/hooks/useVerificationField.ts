"use client";

import { useEffect, useState } from "react";

export const TIMER_SECONDS = 300; // 5분

export function formatTime(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

interface VerificationFieldState {
  sent: boolean;
  code: string;
  verified: boolean;
  timer: number;
  loading: boolean;
  error: string;
}

interface VerificationFieldActions {
  setCode: (v: string) => void;
  setError: (v: string) => void;
  setLoading: (v: boolean) => void;
  markSent: () => void;
  markVerified: () => void;
  reset: () => void;
}

export function useVerificationField(): [
  VerificationFieldState,
  VerificationFieldActions,
] {
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [verified, setVerified] = useState(false);
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const markSent = () => {
    setSent(true);
    setVerified(false);
    setTimer(TIMER_SECONDS);
  };

  const markVerified = () => {
    setVerified(true);
    setTimer(0);
  };

  const reset = () => {
    setSent(false);
    setCode("");
    setVerified(false);
    setTimer(0);
    setLoading(false);
    setError("");
  };

  return [
    { sent, code, verified, timer, loading, error },
    { setCode, setError, setLoading, markSent, markVerified, reset },
  ];
}

// API 호출 래퍼 - loading/error 상태를 자동으로 관리
export async function callVerification(
  fn: () => Promise<void>,
  setLoading: (v: boolean) => void,
  setError: (v: string) => void,
  fallbackMsg: string,
  onSuccess?: () => void,
  errorMapper?: (msg: string) => string,
) {
  setLoading(true);
  setError("");
  try {
    await fn();
    onSuccess?.();
  } catch (err: unknown) {
    const axiosErr = err as { response?: { data?: { message?: string } } };
    const msg = axiosErr?.response?.data?.message ?? "";
    setError(errorMapper ? errorMapper(msg) : msg || fallbackMsg);
  } finally {
    setLoading(false);
  }
}
