import type { TokenResponse } from "@/types/auth";

function buildApiUrl(path: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
  return `${baseUrl}${path}`;
}

export async function refreshAuthSession(
  signal?: AbortSignal
): Promise<TokenResponse> {
  const response = await fetch(buildApiUrl("/auth/refresh"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    signal,
  });

  if (!response.ok) {
    throw new Error("세션 갱신에 실패했습니다.");
  }

  return (await response.json()) as TokenResponse;
}
