import type { Metadata } from "next";
import { ShieldCheck, Users, BarChart3 } from "lucide-react";
import { SignupForm } from "@/features/auth/components/signup/SignupForm";
import { AuthPageBackground } from "@/components/shared/AuthPageBackground";
import { AuthBranding } from "@/components/shared/AuthBranding";

export const metadata: Metadata = {
  title: "회원가입 | 헤쳐모여",
  description: "헤쳐모여 관리자 계정을 만들고 현장 관리를 시작하세요.",
};

const FEATURES = [
  { icon: ShieldCheck, label: "안전한 본인 인증 가입", color: "bg-primary/20 text-primary-500" },
  { icon: Users, label: "팀원 초대 및 출결 관리", color: "bg-success/20 text-success-foreground" },
  { icon: BarChart3, label: "실시간 현장 현황 모니터링", color: "bg-secondary/30 text-secondary-foreground" },
];

export default function SignupPage() {
  return (
    <div className="relative min-h-screen w-full bg-background overflow-hidden flex items-center justify-center p-4 py-10">
      <AuthPageBackground patternId="signup-grid" />

      <div className="relative w-full max-w-5xl mx-auto flex flex-col items-center xl:flex-row xl:items-start gap-10 xl:gap-16 animate-slide-up">

        {/* 브랜딩 */}
        <div className="w-full flex-1 xl:sticky xl:top-10">
          <AuthBranding
            collapseAt="xl"
            headline={
              <>
                현장 관리를
                <br />
                <span className="text-primary-500">지금 시작</span>하세요.
              </>
            }
            description="간단한 가입으로 팀 전체의 출결, 스케줄, 현장을 한 곳에서 관리하세요."
            features={FEATURES}
            footerLink={{
              question: "이미 계정이 있으신가요?",
              href: "/login",
              label: "로그인하기",
            }}
          />
        </div>

        {/* 회원가입 폼 */}
        <div className="w-full xl:max-w-[520px] shrink-0">
          <SignupForm />
          <p className="mt-4 text-center text-xs text-text-secondary/60">
            © 2026 mingdev · v1.0.0
          </p>
        </div>

      </div>
    </div>
  );
}
