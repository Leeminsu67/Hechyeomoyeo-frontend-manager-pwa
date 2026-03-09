// JWT Access Token Payload (백엔드 issueToken 기반)
export interface JwtPayload {
  sub: string;       // user.id
  loginId: string;
  companyId: string;
  companyCode: string;
  role: string;
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
export interface LoginResponse {
  data: {
    accessToken: string;
    refreshToken: string;
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
}
