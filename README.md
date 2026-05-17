# 헤쳐모여 — 현장 관리직 PWA

현장 관리자를 위한 모바일 우선 관리 플랫폼. 직원 출결, 당직 스케줄, 실시간 현황을 하나의 앱에서 관리합니다.

---

## 기술 스택

| 분류         | 기술                    |
| ------------ | ----------------------- |
| Framework    | Next.js 14 (App Router) |
| Language     | TypeScript              |
| Styling      | Tailwind CSS, shadcn/ui |
| Server State | TanStack Query v5       |
| Global State | Zustand v5 (persist)    |
| API Client   | Axios                   |
| Form         | React Hook Form + Zod   |
| Runtime      | Node.js                 |

---

## 시작하기

### 환경 변수 설정

`.env.local` 파일을 루트에 생성합니다.

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=
NEXT_PUBLIC_KAKAO_MAP_KEY=
```

### 의존성 설치 및 실행

```bash
npm install
npm run dev
```

`http://localhost:3001` (또는 기본 3000)에서 확인할 수 있습니다.

### 빌드

```bash
npm run build
npm run start
```

---

## 프로젝트 구조

```
src/
├── app/
│   ├── layout.tsx              # Root Layout (QueryProvider 주입)
│   ├── page.tsx                # / → /login 리다이렉트
│   ├── globals.css             # 전역 스타일 (파스텔 테마, 한국어 폰트)
│   └── (auth)/
│       └── login/
│           └── page.tsx        # 로그인 페이지 (Server Component)
│
├── components/
│   └── ui/                     # Atoms — shadcn/ui 기반 컴포넌트
│       ├── button.tsx
│       ├── card.tsx
│       ├── form.tsx
│       ├── input.tsx
│       └── label.tsx
│
├── features/
│   └── auth/                   # 인증 Feature
│       ├── components/
│       │   └── LoginForm.tsx   # 로그인 폼 (react-hook-form + zod)
│       └── hooks/
│           └── useLogin.ts     # useMutation 훅 (JWT 디코드 + 스토어 저장)
│
├── lib/
│   ├── axios.ts                # Axios 인스턴스 (인터셉터 포함)
│   └── utils.ts                # cn() 유틸리티
│
├── providers/
│   └── QueryProvider.tsx       # TanStack Query 클라이언트 프로바이더
│
├── store/
│   └── useAuthStore.ts         # Zustand 인증 스토어 (localStorage persist)
│
└── types/
    └── auth.ts                 # 인증 관련 TypeScript 타입 정의
```

---

## 컴포넌트 계층

```
Atoms       src/components/ui/          shadcn/ui 기반. 비즈니스 로직 없음.
Shared      src/components/shared/      도메인 독립적 재사용 컴포넌트. (예정)
Features    src/features/{name}/        특정 기능에 종속. TanStack Query, Zustand 결합 가능.
```

---

## 인증 흐름

```
1. POST /auth/login  { loginId, password, companyCode }
       ↓
2. 응답: { data: { accessToken, refreshToken }, message }
       ↓
3. accessToken을 base64 디코드 → JWT payload 추출
   payload: { sub, loginId, companyId, companyCode, role }
       ↓
4. useAuthStore.setAuth() → localStorage("auth-storage")에 persist
       ↓
5. router.push("/dashboard")
```

### Axios 인터셉터 동작

- **요청**: `localStorage`에서 `accessToken` 읽어 `Authorization: Bearer {token}` 헤더 자동 주입
- **응답 401**: `auth-storage` 삭제 후 `/login`으로 자동 리다이렉트

---

## 디자인 시스템 — Trust & Safety Pastel

현장 작업자의 높은 접근성을 위한 파스텔 톤 테마.

| 토큰         | 색상      | 용도                    |
| ------------ | --------- | ----------------------- |
| `primary`    | `#A5D8FF` | 버튼, 헤더, 포인트 컬러 |
| `secondary`  | `#FFD8A8` | 당직 스케줄, 강조 영역  |
| `success`    | `#B2F2BB` | 정상 출근, 완료 상태    |
| `danger`     | `#FFC9C9` | 결근, 에러, 긴급 알림   |
| `background` | `#F8F9FA` | 전체 페이지 배경        |
| `text`       | `#495057` | 본문 텍스트             |

**UI 원칙**

- 버튼 최소 높이 44px (모바일 터치 기준)
- 복잡한 입력 대신 선택(Selection) 위주의 UI

---

## 코딩 원칙

1. **Server Components First** — 인터랙션이 필요한 경우에만 `'use client'` 선언
2. **서버 데이터** → TanStack Query (`useQuery`, `useMutation`)
3. **UI/Auth 상태** → Zustand
4. **모든 API 요청** → `src/lib/axios.ts` 인스턴스 사용
5. **타입 안전성** — `any` 사용 금지, 폼 유효성은 Zod
6. **컴포넌트 150줄 초과 시** 서브 컴포넌트로 분리

---

## 백엔드 연동

Nest.js 백엔드와 연동됩니다. API Base URL은 `NEXT_PUBLIC_API_URL` 환경 변수로 제어합니다.

| 엔드포인트    | 메서드 | 설명                                  |
| ------------- | ------ | ------------------------------------- |
| `/auth/login` | POST   | 로그인 (회사코드 + 아이디 + 비밀번호) |
