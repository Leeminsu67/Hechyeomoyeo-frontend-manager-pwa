import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/components/LoginForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HardHat, Shield, BarChart3, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "로그인 | 헤쳐모여",
  description: "헤쳐모여 관리자 전용 대시보드 로그인 페이지",
};

const FEATURE_ITEMS = [
  {
    icon: Users,
    label: "직원 출결 관리",
    color: "bg-primary/30 text-primary-500",
  },
  {
    icon: BarChart3,
    label: "실시간 현황 모니터링",
    color: "bg-secondary/40 text-secondary-foreground",
  },
  {
    icon: Shield,
    label: "당직 스케줄 관리",
    color: "bg-success/40 text-success-foreground",
  },
];

export default function LoginPage() {
  return (
    <div className="relative min-h-screen w-full bg-background overflow-hidden flex items-center justify-center p-4">
      {/* ── 배경 장식 ─────────────────────────────────── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        {/* 좌상단 큰 원 */}
        <div className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-primary/20 blur-3xl" />
        {/* 우하단 원 */}
        <div className="absolute -bottom-24 -right-24 w-[360px] h-[360px] rounded-full bg-secondary/25 blur-3xl" />
        {/* 중앙 우측 작은 원 */}
        <div className="absolute top-1/2 right-1/4 w-[180px] h-[180px] rounded-full bg-success/20 blur-2xl" />

        {/* 그리드 패턴 */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.03]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="#495057"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* 우측 헬멧 아이콘 장식 */}
        <div className="absolute top-12 right-12 opacity-[0.06] animate-float hidden lg:block">
          <HardHat size={120} strokeWidth={1} className="text-text-strong" />
        </div>
      </div>

      {/* ── 메인 컨테이너 ─────────────────────────────── */}
      <div className="relative w-full max-w-4xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-16 animate-slide-up">
        {/* ── 왼쪽: 브랜딩 영역 ─────────────────────── */}
        <div className="flex-1 text-center lg:text-left space-y-6">
          {/* 로고 */}
          <div className="inline-flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center shadow-field">
              <HardHat
                size={22}
                className="text-primary-foreground"
                strokeWidth={2}
              />
            </div>
            <div>
              <p className="text-[11px] font-bold tracking-[0.2em] text-text-secondary uppercase">
                Field Manager
              </p>
              <p className="text-lg font-black text-text-strong leading-tight">
                헤쳐모여
              </p>
            </div>
          </div>

          {/* 헤드카피 */}
          <div className="space-y-2">
            <h1 className="text-3xl lg:text-4xl font-black text-text-strong leading-tight">
              현장을 한눈에,
              <br />
              <span className="text-primary-500">스마트하게</span> 관리하세요.
            </h1>
            <p className="text-text-secondary text-base leading-relaxed max-w-sm mx-auto lg:mx-0">
              출결 관리부터 당직 스케줄까지 현장 관리 업무 전체를 하나의
              플랫폼에서.
            </p>
          </div>

          {/* 기능 배지들 */}
          <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
            {FEATURE_ITEMS.map(({ icon: Icon, label, color }) => (
              <span
                key={label}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${color}`}
              >
                <Icon size={12} strokeWidth={2.5} />
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* ── 오른쪽: 로그인 카드 ───────────────────── */}
        <div className="w-full max-w-[400px]">
          <Card className="border-border/60 shadow-card-hover backdrop-blur-sm bg-surface/95">
            <CardHeader className="pb-4 space-y-1">
              {/* 상단 컬러 바 */}
              <div className="h-1 w-full rounded-full bg-gradient-to-r from-primary via-primary-300 to-secondary -mx-0 mb-3 -mt-0.5 rounded-t-xl overflow-hidden" />
              <CardTitle className="text-xl font-black text-text-strong">
                관리자 로그인
              </CardTitle>
              <CardDescription className="text-text-secondary text-sm">
                회사 코드와 계정 정보를 입력해주세요.
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-0">
              <LoginForm />

              {/* 구분선 + 안내 */}
              <div className="mt-6 pt-5 border-t border-border/50">
                <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                  <Shield
                    size={14}
                    className="mt-0.5 shrink-0 text-primary-500"
                  />
                  <p className="text-xs text-text-secondary leading-relaxed">
                    본 시스템은{" "}
                    <strong className="text-text">등록된 현장 관리직원</strong>
                    만 이용 가능합니다. 계정 문의는 회사 담당자에게
                    연락해주세요.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 버전 표기 */}
          <p className="mt-4 text-center text-xs text-text-secondary/60">
            © 2026 mingdev · v1.0.0
          </p>
        </div>
      </div>
    </div>
  );
}
