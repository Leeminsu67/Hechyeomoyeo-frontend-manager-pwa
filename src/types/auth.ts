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
}

// 로그인 응답
// refreshToken은 백엔드가 body와 httpOnly 쿠키 모두로 반환하지만,
// 웹 클라이언트는 httpOnly 쿠키만 사용 (localStorage 저장 금지)
export interface LoginResponse {
  data: {
    accessToken: string;
    refreshToken: string; // 웹에서는 사용하지 않음 (httpOnly 쿠키로 관리)
  };
  message: string;
}

// Zustand 스토어에 저장할 유저 정보
export interface AuthUser {
  id: string;
  loginId: string;
  companyId: string;
  companyCode: string;
  role: string;
  hasManagePermission?: boolean; // ADMIN 전용: 인력 관리 권한
}
