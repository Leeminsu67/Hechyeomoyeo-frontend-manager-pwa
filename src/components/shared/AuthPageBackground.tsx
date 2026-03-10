import { HardHat } from "lucide-react";

/**
 * 인증 페이지 공통 배경 — 블러 원형 + 그리드 패턴 + 헬멧 장식
 * patternId: 같은 페이지에 SVG <pattern> id 충돌 방지용
 */
interface AuthPageBackgroundProps {
  patternId?: string;
}

export function AuthPageBackground({
  patternId = "auth-grid",
}: AuthPageBackgroundProps) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* 블러 원형 */}
      <div className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 w-[360px] h-[360px] rounded-full bg-secondary/25 blur-3xl" />
      <div className="absolute top-1/2 right-1/4 w-[180px] h-[180px] rounded-full bg-success/20 blur-2xl" />

      {/* 그리드 패턴 */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.03]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id={patternId}
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
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>

      {/* 헬멧 장식 */}
      <div className="absolute top-12 right-12 opacity-[0.06] animate-float hidden lg:block">
        <HardHat size={120} strokeWidth={1} className="text-text-strong" />
      </div>
    </div>
  );
}
