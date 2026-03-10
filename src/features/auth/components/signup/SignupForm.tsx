"use client";

import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Step1Identity } from "./Step1Identity";
import { Step2Verification } from "./Step2Verification";
import { Step3Company } from "./Step3Company";
import { Step4Complete } from "./Step4Complete";
import { useSignupForm } from "@/features/auth/hooks/useSignupForm";

// ── 단계 메타데이터 ───────────────────────────────────────────
const STEP_META = [
  { label: "기본 정보", desc: "가입 유형과 계정 정보를 입력해주세요." },
  { label: "본인 확인", desc: "이메일과 휴대폰 인증을 완료해주세요." },
  { label: "기업 정보", desc: "사업자 정보를 입력해주세요." },
  { label: "완료", desc: "가입이 완료되었습니다!" },
];

// ── 서버 에러 메시지 추출 ─────────────────────────────────────
function extractError(err: unknown): string | null {
  if (!err) return null;
  const axiosErr = err as { response?: { data?: { message?: string } } };
  const fallback = err instanceof Error ? err.message : "오류가 발생했습니다.";
  return axiosErr?.response?.data?.message ?? fallback;
}

// ── 스텝 인디케이터 ───────────────────────────────────────────
interface StepIndicatorProps {
  currentStep: number;
  accountType: "personal" | "company";
}

function StepIndicator({ currentStep, accountType }: StepIndicatorProps) {
  const skipped = accountType === "personal" && currentStep !== 4;

  return (
    <div className="w-full space-y-3">
      {/* 프로그레스 바 */}
      <Progress
        value={currentStep === 4 ? 100 : ((currentStep - 1) / 3) * 100}
        className="h-1.5"
      />

      {/* 스텝 원형 + 라벨 */}
      <div className="flex items-start justify-between relative">
        {/* 연결선 (배경) */}
        <div className="absolute top-4 left-[12.5%] right-[12.5%] h-px bg-border -z-0" />

        {STEP_META.map((meta, idx) => {
          const stepNum = idx + 1;
          const isDone = currentStep > stepNum;
          const isActive = currentStep === stepNum;
          const isSkipped = stepNum === 3 && skipped;

          return (
            <div
              key={stepNum}
              className="flex flex-col items-center gap-1.5 z-10 flex-1"
            >
              {/* 원 */}
              <div
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300",
                  isDone
                    ? "bg-success border-success/60 text-success-foreground"
                    : isActive
                    ? "bg-primary border-primary-300 text-primary-foreground shadow-field"
                    : isSkipped
                    ? "bg-muted border-border/40 text-muted-foreground opacity-50"
                    : "bg-surface border-border text-muted-foreground"
                )}
              >
                {isDone ? (
                  <CheckCircle2 size={14} strokeWidth={2.5} />
                ) : (
                  <span>{stepNum}</span>
                )}
              </div>

              {/* 라벨 */}
              <div className="text-center">
                <p
                  className={cn(
                    "text-[10px] font-semibold leading-none",
                    isActive
                      ? "text-primary-500"
                      : isDone
                      ? "text-success-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {meta.label}
                </p>
                {isSkipped && (
                  <p className="text-[9px] text-muted-foreground/60 mt-0.5">건너뜀</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── 메인 SignupForm ───────────────────────────────────────────
export function SignupForm() {
  const {
    step,
    accountType,
    completionData,
    isPending,
    error,
    handleStep1Next,
    handleStep2Next,
    handleStep3Next,
    handleBack,
  } = useSignupForm();

  const serverError = step >= 2 ? extractError(error) : null;
  const currentMeta = STEP_META[step - 1];

  return (
    <div className="w-full max-w-lg mx-auto space-y-5 animate-slide-up">

      {/* 스텝 인디케이터 (완료 화면에서는 숨김) */}
      {step < 4 && (
        <StepIndicator currentStep={step} accountType={accountType} />
      )}

      {/* 카드 */}
      <Card className="border-border/60 shadow-card-hover bg-surface/95 backdrop-blur-sm overflow-hidden">
        {/* 상단 컬러 바 */}
        <div className="h-1 w-full bg-gradient-to-r from-primary via-primary-300 to-secondary" />

        {step < 4 && (
          <CardHeader className="pb-4 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-widest uppercase text-primary-400">
                STEP {step} / {accountType === "company" ? 3 : 2}
              </span>
            </div>
            <CardTitle className="text-xl font-black text-text-strong">
              {currentMeta.label}
            </CardTitle>
            <CardDescription>{currentMeta.desc}</CardDescription>
          </CardHeader>
        )}

        <CardContent className={step < 4 ? "pt-0" : "pt-6"}>
          {step === 1 && <Step1Identity onNext={handleStep1Next} />}

          {step === 2 && (
            <Step2Verification
              accountType={accountType}
              onNext={handleStep2Next}
              onBack={handleBack}
              isPending={isPending}
              serverError={serverError}
            />
          )}

          {step === 3 && (
            <Step3Company
              onNext={handleStep3Next}
              onBack={handleBack}
              isPending={isPending}
              serverError={serverError}
            />
          )}

          {step === 4 && completionData && (
            <Step4Complete data={completionData} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
