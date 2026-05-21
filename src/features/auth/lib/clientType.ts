import type { AuthClientType } from "@/types/auth";

export const AUTH_FLAG_COOKIE_NAME = "auth_flag";

const MOBILE_AUTH_FLAG_MAX_AGE = 60 * 60 * 24 * 7;

type NavigatorWithHints = Navigator & {
  standalone?: boolean;
  userAgentData?: {
    mobile?: boolean;
  };
};

function safeMatchMedia(query: string) {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia(query).matches;
}

function isStandalonePwa() {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }

  const navigatorWithHints = navigator as NavigatorWithHints;

  return (
    safeMatchMedia("(display-mode: standalone)") ||
    navigatorWithHints.standalone === true
  );
}

export function isMobilePwaClient() {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }

  const navigatorWithHints = navigator as NavigatorWithHints;
  const touchPoints = navigator.maxTouchPoints ?? 0;
  const hasTouch = touchPoints > 0;
  const hasCoarsePointer = safeMatchMedia("(pointer: coarse)");
  const hasNoHover = safeMatchMedia("(hover: none)");
  const isNarrowViewport = safeMatchMedia("(max-width: 767px)");
  const isTabletViewport = safeMatchMedia("(max-width: 1024px)");
  const isStandalone = isStandalonePwa();
  const clientHintMobile = navigatorWithHints.userAgentData?.mobile === true;
  const mobileUserAgent =
    /android|iphone|ipad|ipod|mobile|tablet/i.test(navigator.userAgent) ||
    (/macintosh/i.test(navigator.userAgent) && touchPoints > 1);

  return (
    clientHintMobile ||
    (hasCoarsePointer && hasNoHover && (isNarrowViewport || isStandalone)) ||
    (hasTouch && isNarrowViewport) ||
    (isStandalone && hasTouch && (isTabletViewport || mobileUserAgent))
  );
}

export function getAuthClientType(): AuthClientType {
  return isMobilePwaClient() ? "admin_pwa_mobile" : "admin_pwa_pc";
}

export function getAuthFlagMaxAge(clientType: AuthClientType) {
  return clientType === "admin_pwa_mobile"
    ? MOBILE_AUTH_FLAG_MAX_AGE
    : undefined;
}

export function hasAuthFlagCookie() {
  if (typeof document === "undefined") return false;

  return document.cookie
    .split(";")
    .map((cookie) => cookie.trim())
    .some((cookie) => cookie.startsWith(`${AUTH_FLAG_COOKIE_NAME}=`));
}
