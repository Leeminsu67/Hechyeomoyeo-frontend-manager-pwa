import { NextRequest, NextResponse } from "next/server";

// 인증 없이 접근 가능한 공개 경로
const PUBLIC_PATHS = ["/login", "/signup"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 공개 경로는 통과
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
  if (isPublicPath) {
    return NextResponse.next();
  }

  // 로그인 여부 확인: setAuth 시 심어두는 auth_flag 쿠키
  const authFlag = request.cookies.get("auth_flag");

  if (!authFlag) {
    const loginUrl = new URL("/login", request.url);
    // 로그인 후 원래 페이지로 돌아올 수 있도록 redirect 파라미터 추가
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * 다음 경로를 제외한 모든 경로에 미들웨어 적용:
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화)
     * - favicon.ico, manifest.json 등 공개 파일
     * - api 라우트
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|api).*)",
  ],
};
