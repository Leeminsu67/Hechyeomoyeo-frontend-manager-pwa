import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/components/LoginForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Shield, BarChart3, Users } from "lucide-react";
import { AuthPageBackground } from "@/components/shared/AuthPageBackground";
import { AuthBranding } from "@/components/shared/AuthBranding";

export const metadata: Metadata = {
  title: "로그인 | 헤쳐모여",
  description: "헤쳐모여 관리자 전용 대시보드 로그인 페이지",
};

const FEATURES = [
  { icon: Users, label: "직원 출결 관리", color: "bg-primary/20 text-primary-500" },
  { icon: BarChart3, label: "실시간 현황 모니터링", color: "bg-secondary/30 text-secondary-foreground" },
  { icon: Shield, label: "당직 스케줄 관리", color: "bg-success/20 text-success-foreground" },
];

export default function LoginPage() {
  return (
    <div className="relative min-h-screen w-full bg-background overflow-hidden flex items-center justify-center p-4">
      <AuthPageBackground patternId="login-grid" />

      <div className="relative w-full max-w-4xl mx-auto flex flex-col items-center lg:flex-row lg:items-start gap-12 lg:gap-16 animate-slide-up">

        {/* 브랜딩 */}
        <div className="w-full flex-1">
          <AuthBranding
            collapseAt="lg"
            headline={
              <>
                현장을 한눈에,
                <br />
                <span className="text-primary-500">스마트하게</span> 관리하세요.
              </>
            }
            description="출결 관리부터 당직 스케줄까지 현장 관리 업무 전체를 하나의 플랫폼에서."
            features={FEATURES}
            footerLink={{
              question: "아직 계정이 없으신가요?",
              href: "/signup",
              label: "회원가입하기",
            }}
          />
        </div>

        {/* 로그인 카드 */}
        <div className="w-full max-w-[400px]">
          <Card className="border-border/60 shadow-card-hover backdrop-blur-sm bg-surface/95">
            <CardHeader className="pb-4 space-y-1">
              <div className="h-1 w-full bg-gradient-to-r from-primary via-primary-300 to-secondary mb-3 -mt-0.5 rounded-t-xl overflow-hidden" />
              <CardTitle className="text-xl font-black text-text-strong">
                관리자 로그인
              </CardTitle>
              <CardDescription className="text-text-secondary text-sm">
                회사 코드와 계정 정보를 입력해주세요.
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-0">
              <LoginForm />

              <div className="mt-6 pt-5 border-t border-border/50">
                <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                  <Shield size={14} className="mt-0.5 shrink-0 text-primary-500" />
                  <p className="text-xs text-text-secondary leading-relaxed">
                    본 시스템은{" "}
                    <strong className="text-text">등록된 현장 관리직원</strong>
                    만 이용 가능합니다. 계정 문의는 회사 담당자에게 연락해주세요.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <p className="mt-4 text-center text-xs text-text-secondary/60">
            © 2026 mingdev · v1.0.0
          </p>
        </div>

      </div>
    </div>
  );
}
