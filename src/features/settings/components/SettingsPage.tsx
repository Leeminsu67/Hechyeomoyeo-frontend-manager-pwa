"use client";

import { useRouter } from "next/navigation";
import {
  User,
  Building2,
  Shield,
  LogOut,
  ChevronRight,
  Info,
  Lock,
  Hammer,
  BadgeCheck,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { ROLE_META } from "@/types/user";
import type { RoleValue } from "@/types/user";
import { cn } from "@/lib/utils";

// ─── Section Wrapper ──────────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-1">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">
        {title}
      </p>
      <div className="bg-surface border border-border rounded-2xl overflow-hidden divide-y divide-border/60">
        {children}
      </div>
    </section>
  );
}

// ─── Row: 정보 표시용 ─────────────────────────────────────────────────────────

function InfoItem({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span
        className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
        style={{ backgroundColor: accent ? accent + "22" : undefined }}
        {...(!accent && { className: "flex items-center justify-center w-8 h-8 rounded-lg bg-muted shrink-0" })}
      >
        <Icon className="w-4 h-4" style={{ color: accent ?? "#868E96" }} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="text-sm font-semibold text-text-strong mt-0.5">{value}</div>
      </div>
    </div>
  );
}

// ─── Row: 액션 버튼용 ─────────────────────────────────────────────────────────

function ActionItem({
  icon: Icon,
  label,
  description,
  onClick,
  danger,
  disabled,
  badge,
}: {
  icon: React.ElementType;
  label: string;
  description?: string;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors",
        danger
          ? "hover:bg-danger/5 active:bg-danger/10"
          : "hover:bg-muted/60 active:bg-muted",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <span
        className={cn(
          "flex items-center justify-center w-8 h-8 rounded-lg shrink-0",
          danger ? "bg-danger/10" : "bg-muted"
        )}
      >
        <Icon
          className={cn(
            "w-4 h-4",
            danger ? "text-danger-foreground" : "text-muted-foreground"
          )}
        />
      </span>
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-semibold",
            danger ? "text-danger-foreground" : "text-text-strong"
          )}
        >
          {label}
        </p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {badge && (
        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-secondary/60 shrink-0">
          <Hammer className="w-2.5 h-2.5" />
          {badge}
        </span>
      )}
      {!badge && !danger && (
        <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
      )}
    </button>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function SettingsPage() {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();

  const roleMeta = user?.role !== undefined
    ? ROLE_META[Number(user.role) as RoleValue]
    : null;

  const roleColor =
    roleMeta?.color === "primary"
      ? "#0B8CE0"
      : roleMeta?.color === "secondary"
      ? "#E67700"
      : "#2F9E44";

  const handleLogout = () => {
    clearAuth();
    router.replace("/login");
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6">

      {/* 페이지 헤더 */}
      <div className="mb-2">
        <h1 className="text-xl font-bold text-text-strong">설정</h1>
        <p className="text-sm text-muted-foreground mt-0.5">계정 및 앱 환경설정</p>
      </div>

      {/* 내 계정 */}
      <Section title="내 계정">
        <InfoItem
          icon={User}
          label="아이디"
          value={
            <span className="font-mono text-sm">{user?.loginId ?? "—"}</span>
          }
          accent="#0B8CE0"
        />
        <InfoItem
          icon={BadgeCheck}
          label="역할"
          value={
            roleMeta ? (
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border"
                style={{
                  backgroundColor: roleColor + "22",
                  borderColor: roleColor + "55",
                  color: roleColor,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: roleColor }}
                />
                {roleMeta.label}
              </span>
            ) : (
              "—"
            )
          }
          accent={roleColor}
        />
        <InfoItem
          icon={Building2}
          label="회사 코드"
          value={
            <span className="font-mono text-sm tracking-widest">
              {user?.companyCode ?? "—"}
            </span>
          }
          accent="#2F9E44"
        />
      </Section>

      {/* 보안 */}
      <Section title="보안">
        <ActionItem
          icon={Lock}
          label="비밀번호 변경"
          description="현재 비밀번호를 새 비밀번호로 변경합니다"
          disabled
          badge="준비중"
        />
        <ActionItem
          icon={Shield}
          label="로그인 이력"
          description="최근 로그인 기록을 확인합니다"
          disabled
          badge="준비중"
        />
      </Section>

      {/* 앱 정보 */}
      <Section title="앱 정보">
        <InfoItem
          icon={Info}
          label="서비스명"
          value="헤쳐모여 관리자 앱"
          accent="#868E96"
        />
        <InfoItem
          icon={Info}
          label="버전"
          value={<span className="font-mono text-sm">v0.1.0</span>}
          accent="#868E96"
        />
      </Section>

      {/* 로그아웃 */}
      <Section title="계정">
        <ActionItem
          icon={LogOut}
          label="로그아웃"
          description="현재 기기에서 로그아웃합니다"
          onClick={handleLogout}
          danger
        />
      </Section>
    </div>
  );
}
