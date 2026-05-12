// 백엔드 Role enum 숫자값과 1:1 매핑
// 0: serviceAdmin, 1: owner, 2: HRManager, 3: manager, 4: worekr(worker)
export const ROLE = {
  SERVICE_ADMIN: 0,
  OWNER: 1,
  HR_MANAGER: 2,
  MANAGER: 3,
  WORKER: 4,
} as const;

export type RoleValue = (typeof ROLE)[keyof typeof ROLE];

// 역할 메타 정보 (UI 표시용)
export const ROLE_META: Record<
  RoleValue,
  {
    label: string;
    description: string;
    color: "primary" | "secondary" | "success";
  }
> = {
  [ROLE.SERVICE_ADMIN]: {
    label: "service admin",
    description: "시스템 전체 관리",
    color: "primary",
  },
  [ROLE.OWNER]: {
    label: "대표자",
    description: "회사 최고 권한자",
    color: "primary",
  },
  [ROLE.HR_MANAGER]: {
    label: "인력관리자",
    description: "인력 추가·수정·삭제",
    color: "primary",
  },
  [ROLE.MANAGER]: {
    label: "관리자",
    description: "현장 조회 전용",
    color: "secondary",
  },
  [ROLE.WORKER]: {
    label: "일반 인력",
    description: "현장 작업 대원",
    color: "success",
  },
};

export interface UserListItem {
  id: string;
  loginId: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  detailAddress?: string;
  role: RoleValue;
  bankName?: string;
  bankAccountEncrypted?: string; // 마스킹 처리하여 표시
  createdAt: string;
}

export interface UserDetail extends UserListItem {
  phoneVerified?: boolean;
  emailVerified?: boolean;
  isFirstLogin?: boolean;
  updatedAt?: string;
}

export interface UserListParams {
  page: number;
  take: number;
  name?: string;
  role?: RoleValue;
}

export interface UserListResponse {
  data: {
    users: UserListItem[];
    total: number;
  };
}

// POST /user — 백엔드 CreateUserDto와 1:1 매핑
export interface CreateUserDto {
  loginId: string;
  password: string;
  name: string;
  phone: string;
  address: string;
  detailAddress?: string;
  role: RoleValue;
  email?: string;
  bankName?: string;
  bankAccountEncrypted?: string;
  emailVerified?: boolean;
  phoneVerified: boolean;
}

// PATCH /user/:id — 백엔드 UpdateUserDto는 loginId/password/인증 상태를 받지 않는다.
export type UpdateUserDto = Partial<
  Pick<
    CreateUserDto,
    | "name"
    | "phone"
    | "address"
    | "detailAddress"
    | "role"
    | "email"
    | "bankName"
    | "bankAccountEncrypted"
  >
>;
