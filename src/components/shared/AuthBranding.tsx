import type { ReactNode } from "react";
import Link from "next/link";
import { HardHat, type LucideIcon } from "lucide-react";

export interface FeatureItem {
  icon: LucideIcon;
  label: string;
  /** 아이콘 컨테이너에 적용할 Tailwind bg + text 클래스 */
  color: string;
}

interface AuthBrandingProps {
  headline: ReactNode;
  description: string;
  features: FeatureItem[];
  /** 브랜딩 하단 링크 (ex. "로그인하기", "회원가입하기") */
  footerLink?: {
    question: string;
    href: string;
    label: string;
  };
  /**
   * 텍스트가 중앙 → 좌측으로 전환되는 Tailwind 브레이크포인트.
   * 로그인(좁은 카드): "lg" / 회원가입(넓은 카드): "xl"
   */
  collapseAt?: "lg" | "xl";
  /**
   * 기능 목록 표시 방식.
   * "pills": 가로 배지 스타일 (기본값) / "checklist": 세로 아이콘 리스트
   */
  featureVariant?: "pills" | "checklist";
}

export function AuthBranding({
  headline,
  description,
  features,
  footerLink,
  collapseAt = "xl",
  featureVariant = "pills",
}: AuthBrandingProps) {
  const isLg = collapseAt === "lg";

  return (
    <div
      className={[
        "space-y-6",
        "text-center",
        isLg ? "lg:text-left" : "xl:text-left",
      ].join(" ")}
    >
      {/* 로고 */}
      <div className="inline-flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center shadow-field">
          <HardHat size={22} className="text-primary-foreground" strokeWidth={2} />
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

      {/* 헤드라인 + 설명 */}
      <div className="space-y-2">
        <h1
          className={[
            "text-3xl font-black text-text-strong leading-tight",
            isLg ? "lg:text-4xl" : "xl:text-4xl",
          ].join(" ")}
        >
          {headline}
        </h1>
        <p
          className={[
            "text-text-secondary text-base leading-relaxed max-w-sm mx-auto",
            isLg ? "lg:mx-0" : "xl:mx-0",
          ].join(" ")}
        >
          {description}
        </p>
      </div>

      {/* 기능 목록 */}
      {featureVariant === "pills" ? (
        <div
          className={[
            "flex flex-wrap gap-2 justify-center",
            isLg ? "lg:justify-start" : "xl:justify-start",
          ].join(" ")}
        >
          {features.map(({ icon: Icon, label, color }) => (
            <span
              key={label}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${color}`}
            >
              <Icon size={12} strokeWidth={2.5} />
              {label}
            </span>
          ))}
        </div>
      ) : (
        <div
          className={[
            "space-y-3 text-left max-w-xs mx-auto",
            isLg ? "lg:mx-0" : "xl:mx-0",
          ].join(" ")}
        >
          {features.map(({ icon: Icon, label, color }) => (
            <div key={label} className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}
              >
                <Icon size={14} />
              </div>
              <span className="text-sm text-text font-medium">{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* 하단 링크 */}
      {footerLink && (
        <p className="text-sm text-text-secondary">
          {footerLink.question}{" "}
          <Link
            href={footerLink.href}
            className="font-bold text-primary-500 hover:text-primary-400 transition-colors underline underline-offset-2"
          >
            {footerLink.label}
          </Link>
        </p>
      )}
    </div>
  );
}
