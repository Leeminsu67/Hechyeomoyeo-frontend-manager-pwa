export type AuthClientType = "admin_pwa_pc" | "admin_pwa_mobile";

// JWT Access Token Payload (백엔드 issueToken 기반)
export interface JwtPayload {
  sub: string; // user.id
  loginId: string;
  companyId: string;
  companyCode: string;
  role: string;
  hasManagePermission?: boolean; // ADMIN 전용: 인력 추가/수정/삭제 권한
  iat?: number;
  exp?: number;
}

// 로그인 요청 DTO
export interface LoginDto {
  loginId: string;
  password: string;
  companyCode: string;
  clientType: AuthClientType;
}

// 토큰 응답
// refreshToken은 웹 클라이언트에서 직접 저장하지 않고 httpOnly 쿠키만 사용한다.
export interface TokenResponse {
  data: {
    accessToken: string;
    refreshToken?: string;
  };
  message?: string;
}

export type LoginResponse = TokenResponse;

// Zustand 스토어에 저장할 유저 정보
export interface AuthUser {
  id: string;
  loginId: string;
  companyId: string;
  companyCode: string;
  role: string;
  hasManagePermission?: boolean; // ADMIN 전용: 인력 관리 권한
}
