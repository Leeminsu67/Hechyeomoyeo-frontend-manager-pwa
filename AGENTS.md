# 프로젝트 가이드라인: 현장 관리직용 PWA (Admin Web/PWA)

이 파일은 Codex가 프로젝트의 기술 스택, 아키텍처, 그리고 디자인 시스템을 이해하기 위한 최종 지침서입니다.

## 🛠 1. 기술 스택 (Tech Stack)

- **Language**: TypeScript 5.x (strict mode 활성화 권장)
- **Framework**: Next.js 14.2.29 (App Router)
- **Runtime**: React 18.x
- **Styling**: Tailwind CSS 3.x, shadcn/ui
- **State Management**:
  - **Server State**: TanStack Query v5 (^5.56.2)
  - **Global Client State**: Zustand v5 (Auth, UI State)
- **Form**: React Hook Form + Zod (^3.23.8)
- **API Client**: Axios 1.x (Nest.js 연동)
- **Real-time**: Socket.io-client (당직 실시간 업데이트 등)
- **Map**: React-Kakao-Maps-SDK (현장 위치 지정)
- **PWA**: Serwist
- **Notification**: Firebase (^12.x), Sonner (토스트 UI)

## 📁 2. 디렉토리 구조 및 컴포넌트 위계

재사용성을 위해 컴포넌트를 3단계로 엄격히 분리한다.

### 2-1. Component Hierarchy

1. **Atoms (`src/components/ui`)**:
   - shadcn/ui 컴포넌트. 디자인 최소 단위.
   - 금지: API 호출, `useQuery`/`useMutation`, Zustand 스토어 구독, 조건부 데이터 변환
2. **Shared (`src/components/shared`)**:
   - 프로젝트 전반에서 재사용되는 도메인 독립적 컴포넌트.
   - 예: `DataTable`, `ModalWrapper`, `AddressSearch`, `StatusBadge`.
   - 데이터는 `props`로 주입받으며, 특정 API나 Zustand 스토어에 직접 의존하지 않는다.
3. **Features (`src/features/{feature-name}/components`)**:
   - 특정 기능(인증, 직원관리 등)에 종속된 컴포넌트.
   - TanStack Query 훅이나 Zustand 스토어와 결합 가능.

### 2-2. Other Folders

- `src/app`: App Router 페이지 및 레이아웃
- `src/store`: Zustand 스토어 (`useAuthStore.ts` 등)
- `src/hooks/queries`: TanStack Query 커스텀 훅 (`useQuery`, `useMutation` 래퍼)
- `src/hooks`: 일반 커스텀 훅 (`useDebounce`, `useIntersectionObserver` 등)
- `src/lib`: Axios 인스턴스 (`axios.ts`), 유틸리티
- `src/types`: TypeScript 인터페이스 정의

## 🎨 3. 디자인 시스템 (Theme: Trust & Safety Pastel)

현장 관리 업무의 복잡도를 낮추기 위해 다음 파스텔 톤 색상 체계를 사용한다.
**색상은 반드시 아래 Tailwind 토큰명을 사용하고 hex 하드코딩을 금지한다.**

- **Color Tokens** (`tailwind.config.ts` 기준):
  - `bg-primary` / `text-primary-foreground` — Soft Sky Blue, 메인 버튼·헤더
    - 쉐이드: `bg-primary-50` ~ `bg-primary-500`
  - `bg-secondary` / `text-secondary-foreground` — Pale Orange, 당직 스케줄·강조
  - `bg-success` / `text-success-foreground` — Mint Green, 정상 출근·완료
  - `bg-danger` / `text-danger-foreground` — Rose Pink, 결근·긴급 알림
  - `bg-background` — Off White, 전체 배경
  - `bg-surface` — White, 카드·모달 배경
  - `border-border` — 기본 테두리
  - `bg-muted` / `text-muted-foreground` — 비활성 영역
  - `text-DEFAULT` / `text-secondary` / `text-strong` — 본문 텍스트 계층

- **기타 토큰**:
  - **Font**: `font-sans` (Pretendard)
  - **Shadow**: `shadow-card`, `shadow-card-hover`, `shadow-field`
  - **Animation**: `animate-fade-in`, `animate-slide-up`, `animate-float`

- **Responsive Breakpoints** (Tailwind 기본):
  - `sm`: 640px+ / `md`: 768px+ / `lg`: 1024px+ / `xl`: 1280px+ / `2xl`: 1536px+

- **UI/UX Direction**:
  - 모바일(PWA) 사용성을 고려하여 버튼 크기는 충분히 크게(Minimum 44px) 설정.
  - 현장 작업자가 조작하기 쉽도록 복잡한 입력보다는 선택(Selection) 위주의 UI 설계.

## 📜 4. 코딩 원칙 (Coding Rules)

1. **Server Components First**: 모든 컴포넌트는 기본적으로 서버 컴포넌트로 작성한다.
   - `'use client'` 선언 조건: `useState`, `useEffect`, 이벤트 핸들러(`onClick` 등), 브라우저 전용 API 사용 시
   - `'use client'`는 파일 최상단에 선언한다.
2. **State Separation**:
   - 서버 데이터 fetching은 반드시 TanStack Query(`useQuery`, `useMutation`)를 사용한다.
   - 유저 인증 정보나 단순 UI 상태(사이드바 오픈 등)만 Zustand를 사용한다.
3. **API Integration**: 모든 요청은 `src/lib/axios.ts`의 인스턴스를 사용하며, `NEXT_PUBLIC_API_URL` 환경 변수를 참조한다.
4. **Reusability**:
   - 컴포넌트가 150줄(주석·공백 제외)을 넘어가면 Sub-component로 분리한다.
   - 비즈니스 로직은 컴포넌트에서 추출하여 `src/hooks/`로 관리한다.
5. **Type Safety**:
   - `any` 사용을 금지한다.
   - 폼 유효성 검사 및 API 응답 스키마 검증은 Zod를 사용한다.
6. **보안**:
   - `env` 파일에 있는 정보를 코드상에 절대 노출하지 않도록 한다.
   - 키값을 절대로 문자열로 노출하지 않고 env 파일 환경변수로 설정하여 관리한다.
7. **코드 범위**:
   - 이 레포지토리는 프론트엔드 전용이며, 백엔드 코드는 별도 레포에서 관리한다.
   - 프론트엔드 작업 중 백엔드 관련 파일을 절대 수정하지 않는다.
8. **모달 구현**:
   - 모든 모달 컴포넌트는 반드시 `<ModalPortal>` (`src/components/shared/ModalPortal.tsx`)로 감싸서 렌더링한다.
   - Portal 없이 `fixed` 포지셔닝만 사용할 경우 부모의 `transform`, `overflow: hidden` 등 CSS가 새로운 stacking context를 형성하여 배경 블러·중앙 정렬이 깨질 수 있다.
   - 모달 z-index는 `z-50`으로 통일하며, 백드롭은 `absolute inset-0`, 콘텐츠 패널은 `relative`로 작성한다.

## 🧭 5. LLM 작업 행동 원칙

이 섹션은 Codex가 프론트엔드 코드를 수정할 때 흔히 발생하는 과잉 구현, 임의 리팩터링, 불충분한 검증을 줄이기 위한 행동 기준이다.

### 5-1. 구현 전 판단

- 구현 전에 요구사항, 영향 범위, 검증 방법을 짧게 정리한다.
- 합리적인 가정으로 진행 가능한 경우에는 가정을 명시하고 진행한다.
- 요구사항 해석이 여러 갈래로 갈리거나, 잘못 구현했을 때 되돌리기 어려운 경우에는 먼저 질문한다.
- 더 단순한 해결책이 있으면 제안하고, 과한 구현이 예상되면 그 이유를 설명한다.

### 5-2. 단순함 우선

- 요청받은 기능만 구현하고, 추측성 기능을 추가하지 않는다.
- 한 번만 쓰이는 코드에는 별도 추상화를 만들지 않는다.
- 요청되지 않은 설정화, 범용화, 확장성을 추가하지 않는다.
- 컴포넌트, 훅, 유틸은 기존 프로젝트 패턴을 우선 따르며, 새 구조는 필요할 때만 만든다.
- 구현이 불필요하게 길어졌다면 더 작은 컴포넌트, 훅, 유틸로 나눌 수 있는지 검토한다.

### 5-3. 최소 변경 원칙

- 사용자 요청과 직접 관련된 파일과 코드만 수정한다.
- 주변 코드의 스타일, 주석, 포맷을 임의로 정리하지 않는다.
- 기존 스타일이 마음에 들지 않더라도 현재 파일의 패턴을 따른다.
- 관련 없는 죽은 코드나 개선점을 발견하면 삭제하지 않고 작업 결과에 메모로 남긴다.
- 내 변경으로 인해 사용되지 않게 된 import, 변수, 함수만 정리한다.

### 5-4. 목표 중심 검증

- 작업마다 성공 기준을 명확히 둔다.
- 버그 수정은 가능하면 재현 조건을 먼저 확인한 뒤 수정한다.
- 폼, API, 상태 관리, 권한, 라우팅 변경은 관련 테스트 또는 빌드/린트로 검증한다.
- 검증을 실행하지 못한 경우에는 그 이유와 남은 리스크를 작업 결과에 명시한다.

## 🚀 6. 개발 방향 및 원칙 요약

- 섹션 1~5에 정의된 기술 스택, 아키텍처, 디자인 시스템, 코딩 원칙, LLM 작업 행동 원칙을 준수하여 코드를 작성한다.
- 반응형 디자인은 선택이 아닌 필수이며, 모든 UI는 모바일(320px)부터 4K(2560px+)까지 정상 동작해야 한다.
  - 기본 설계는 **Mobile First**로 작성하고, `md:` / `lg:` / `xl:` / `2xl:` 순서로 확장한다.
- 새로운 기능 추가 시 컴포넌트 위계(Atoms → Shared → Features)를 반드시 검토한 후 적절한 위치에 배치한다.
- 개발 서버를 실행하고 테스트나 페이지 확인을 했다면 개발 서버를 종료한다.
