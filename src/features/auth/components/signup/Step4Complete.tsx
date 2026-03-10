"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Copy,
  Check,
  LayoutDashboard,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CompletionData } from "@/features/auth/hooks/useSignupForm";

interface Step4Props {
  data: CompletionData;
}

export function Step4Complete({ data }: Step4Props) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data.companyCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // 클립보드 미지원 환경 대비
      const el = document.createElement("textarea");
      el.value = data.companyCode;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="flex flex-col items-center text-center gap-6 py-2 animate-slide-up">

      {/* 성공 아이콘 */}
      <div className="relative">
        <div className="h-20 w-20 rounded-full bg-success/30 flex items-center justify-center">
          <div className="h-14 w-14 rounded-full bg-success/50 flex items-center justify-center">
            <CheckCircle2 size={36} className="text-success-foreground" strokeWidth={2} />
          </div>
        </div>
        {/* 파티클 장식 */}
        <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-secondary animate-bounce" style={{ animationDelay: "0s" }} />
        <div className="absolute -bottom-1 -left-2 h-3 w-3 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0.2s" }} />
        <div className="absolute top-2 -left-3 h-2 w-2 rounded-full bg-danger animate-bounce" style={{ animationDelay: "0.4s" }} />
      </div>

      {/* 축하 메시지 */}
      <div className="space-y-1">
        <h2 className="text-2xl font-black text-text-strong">
          🎉 가입이 완료되었습니다!
        </h2>
        {data.companyName && (
          <p className="text-sm text-text-secondary">
            <strong className="text-text">{data.companyName}</strong>의 관리자 계정이 생성되었습니다.
          </p>
        )}
        <p className="text-sm text-text-secondary">
          아이디: <strong className="text-text font-mono">{data.loginId}</strong>
        </p>
      </div>

      {/* ── 회사 코드 박스 ──────────────────────────────── */}
      <div className="w-full space-y-3">
        <p className="text-xs font-semibold tracking-widest uppercase text-text-secondary">
          발급된 회사 코드
        </p>

        {/* 코드 디스플레이 */}
        <div className="relative group">
          <div className="rounded-2xl border-2 border-primary bg-primary/10 p-6 shadow-field">
            <p className="font-mono text-3xl sm:text-4xl font-black tracking-[0.2em] text-primary-500 break-all">
              {data.companyCode}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 h-9 w-9 text-muted-foreground hover:text-primary-500 hover:bg-primary/20"
            onClick={handleCopy}
            title="클립보드에 복사"
          >
            {copied ? (
              <Check size={16} className="text-success-foreground" />
            ) : (
              <Copy size={16} />
            )}
          </Button>
        </div>

        {copied && (
          <p className="text-xs text-success-foreground font-medium animate-fade-in">
            ✓ 클립보드에 복사되었습니다.
          </p>
        )}
      </div>

      {/* ── 강력 경고 박스 ────────────────────────────── */}
      <div className="w-full rounded-xl border-2 border-secondary bg-secondary/20 px-4 py-4 text-left space-y-2">
        <div className="flex items-center gap-2 text-secondary-foreground font-bold text-sm">
          <TriangleAlert size={18} strokeWidth={2.5} />
          반드시 메모해두세요!
        </div>
        <ul className="text-xs text-text-secondary space-y-1.5 pl-1">
          <li className="flex items-start gap-1.5">
            <span className="text-danger-foreground font-bold mt-0.5">•</span>
            <span>
              이 코드가 없으면 <strong className="text-text">직원들이 로그인할 수 없습니다.</strong>
            </span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-danger-foreground font-bold mt-0.5">•</span>
            <span>코드는 다시 확인할 수 없으니 지금 즉시 안전한 곳에 보관하세요.</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-danger-foreground font-bold mt-0.5">•</span>
            <span>회사 코드는 직원 초대 시 반드시 필요합니다.</span>
          </li>
        </ul>
      </div>

      {/* 대시보드 이동 버튼 */}
      <Button
        className="w-full h-12 text-base font-bold gap-2 mt-1"
        onClick={() => router.push("/dashboard")}
      >
        <LayoutDashboard size={18} />
        대시보드로 이동하기
      </Button>

      <p className="text-xs text-muted-foreground">
        위 코드를 반드시 메모한 후 이동하세요.
      </p>
    </div>
  );
}
