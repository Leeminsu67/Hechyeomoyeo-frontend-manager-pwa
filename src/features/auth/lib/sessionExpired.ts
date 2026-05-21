export const SESSION_EXPIRED_MESSAGE =
  "다른 기기에서 로그인되었거나 세션이 만료되었습니다.";

export const SESSION_EXPIRED_REASON_PARAM = "reason";
export const SESSION_EXPIRED_REASON_VALUE = "session-expired";

export function getSessionExpiredLoginPath() {
  const params = new URLSearchParams({
    [SESSION_EXPIRED_REASON_PARAM]: SESSION_EXPIRED_REASON_VALUE,
  });

  return `/login?${params.toString()}`;
}
