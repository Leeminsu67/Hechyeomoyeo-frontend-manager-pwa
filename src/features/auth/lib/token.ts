import type { AuthUser, JwtPayload } from "@/types/auth";

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "="
  );
  const decoded = atob(padded);

  try {
    return decodeURIComponent(
      Array.from(decoded)
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join("")
    );
  } catch {
    return decoded;
  }
}

export function decodeJwtPayload(accessToken: string): JwtPayload {
  const parts = accessToken.split(".");
  if (parts.length !== 3) {
    throw new Error("유효하지 않은 토큰 형식입니다.");
  }

  return JSON.parse(decodeBase64Url(parts[1])) as JwtPayload;
}

export function getAuthUserFromAccessToken(accessToken: string): AuthUser {
  const payload = decodeJwtPayload(accessToken);

  return {
    id: payload.sub,
    loginId: payload.loginId,
    companyId: payload.companyId,
    companyCode: payload.companyCode,
    role: payload.role,
    hasManagePermission: payload.hasManagePermission,
  };
}
