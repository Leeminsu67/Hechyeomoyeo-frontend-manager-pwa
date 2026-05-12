"use client";

import { useState } from "react";
import {
  Bell,
  BellOff,
  User,
  Building2,
  FileText,
  Shield,
  LogOut,
  ChevronRight,
  Info,
  Lock,
  Hammer,
  BadgeCheck,
  Loader2,
  MapPin,
  Pencil,
  Smartphone,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { ROLE, ROLE_META } from "@/types/user";
import type { RoleValue } from "@/types/user";
import { cn } from "@/lib/utils";
import { useLogout } from "@/features/auth/hooks/useLogout";
import { usePushNotifications } from "@/features/notifications/hooks/usePushNotifications";
import { PhoneUpdateVerificationModal } from "./PhoneUpdateVerificationModal";
import { PasswordChangeModal } from "./PasswordChangeModal";
import { CompanyEditModal } from "./CompanyEditModal";
import { useCompany } from "../hooks/useCompany";

const PASSWORD_PHONE_VERIFICATION_VALID_MS = 10 * 60 * 1000;

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
  loading,
}: {
  icon: React.ElementType;
  label: string;
  description?: string;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
  badge?: string;
  loading?: boolean;
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
            danger ? "text-danger-foreground" : "text-muted-foreground",
            loading && "animate-spin",
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

function StatusPill({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "success" | "danger" | "muted";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        tone === "success" &&
          "border-success/50 bg-success/15 text-success-foreground",
        tone === "danger" &&
          "border-danger/50 bg-danger/15 text-danger-foreground",
        tone === "muted" &&
          "border-border bg-muted text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function SettingsPage() {
  const { user } = useAuthStore();
  const [phoneVerificationOpen, setPhoneVerificationOpen] = useState(false);
  const [passwordChangeOpen, setPasswordChangeOpen] = useState(false);
  const [companyEditOpen, setCompanyEditOpen] = useState(false);
  const [phoneVerifiedAt, setPhoneVerifiedAt] = useState<number | null>(null);
  const [openPasswordAfterPhoneVerification, setOpenPasswordAfterPhoneVerification] =
    useState(false);
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const {
    permission: pushPermission,
    isSupported: isPushSupported,
    registered: isPushRegistered,
    isLoading: isPushLoading,
    isUpdating: isPushUpdating,
    enable: enablePush,
    disable: disablePush,
  } = usePushNotifications();

  const roleMeta = user?.role !== undefined
    ? ROLE_META[Number(user.role) as RoleValue]
    : null;
  const canManageCompany =
    user?.role !== undefined && Number(user.role) <= ROLE.OWNER;
  const { data: company, isLoading: isCompanyLoading } = useCompany(
    user?.companyId,
    canManageCompany,
  );

  const roleColor =
    roleMeta?.color === "primary"
      ? "#0B8CE0"
      : roleMeta?.color === "secondary"
      ? "#E67700"
      : "#2F9E44";

  const isPushDenied = pushPermission === "denied";
  const isPushEnabled = isPushRegistered;
  const isPushDisabled =
    isPushLoading ||
    isPushUpdating ||
    (!isPushRegistered && (!isPushSupported || isPushDenied));
  const PushActionIcon = isPushUpdating
    ? Loader2
    : isPushEnabled
    ? BellOff
    : Bell;
  const pushActionLabel = isPushEnabled ? "알림 끄기" : "알림 켜기";
  const pushActionDescription = isPushLoading
    ? "알림 지원 여부를 확인하고 있습니다"
    : !isPushSupported
    ? "현재 브라우저에서는 Web Push를 사용할 수 없습니다"
    : isPushDenied
    ? isPushRegistered
      ? "저장된 알림 토큰을 비활성화합니다"
      : "브라우저 설정에서 알림 권한을 허용해야 합니다"
    : isPushEnabled
    ? "현재 기기의 알림 토큰을 비활성화합니다"
    : "알림 권한을 허용하고 현재 기기를 등록합니다";
  const pushStatus = isPushLoading ? (
    <StatusPill tone="muted">확인 중</StatusPill>
  ) : !isPushSupported ? (
    <StatusPill tone="muted">미지원</StatusPill>
  ) : isPushDenied ? (
    <StatusPill tone="danger">차단됨</StatusPill>
  ) : isPushEnabled ? (
    <StatusPill tone="success">켜짐</StatusPill>
  ) : (
    <StatusPill tone="muted">꺼짐</StatusPill>
  );

  const handlePushToggle = () => {
    if (isPushEnabled) {
      void disablePush();
      return;
    }

    void enablePush();
  };

  const phoneVerificationValid =
    phoneVerifiedAt !== null &&
    Date.now() - phoneVerifiedAt < PASSWORD_PHONE_VERIFICATION_VALID_MS;

  const handlePasswordChangeClick = () => {
    if (phoneVerificationValid) {
      setPasswordChangeOpen(true);
      return;
    }

    setOpenPasswordAfterPhoneVerification(true);
    setPhoneVerificationOpen(true);
  };

  const handlePhoneVerificationClose = () => {
    setPhoneVerificationOpen(false);
    setOpenPasswordAfterPhoneVerification(false);
  };

  const handlePhoneVerified = () => {
    setPhoneVerifiedAt(Date.now());

    if (openPasswordAfterPhoneVerification) {
      setPasswordChangeOpen(true);
    }
  };

  const handlePasswordChanged = () => {
    setPhoneVerifiedAt(null);
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

      {canManageCompany && (
        <Section title="회사 정보">
          <InfoItem
            icon={Building2}
            label="회사명"
            value={isCompanyLoading ? "불러오는 중" : company?.companyName ?? "—"}
            accent="#0B8CE0"
          />
          <InfoItem
            icon={Building2}
            label="회사 코드"
            value={
              <span className="font-mono text-sm tracking-widest">
                {company?.companyCode ?? user?.companyCode ?? "—"}
              </span>
            }
            accent="#2F9E44"
          />
          <InfoItem
            icon={MapPin}
            label="회사 주소"
            value={isCompanyLoading ? "불러오는 중" : company?.companyAddress ?? "—"}
            accent="#E67700"
          />
          <InfoItem
            icon={FileText}
            label="사업자 등록번호"
            value={
              isCompanyLoading
                ? "불러오는 중"
                : company?.businessRegistrationNumber?.trim() || "미등록"
            }
            accent="#495057"
          />
          <ActionItem
            icon={Pencil}
            label="회사 정보 수정"
            description="회사명, 주소, 사업자 등록번호를 수정합니다"
            onClick={() => setCompanyEditOpen(true)}
            disabled={isCompanyLoading || !company}
          />
        </Section>
      )}

      {/* 알림 */}
      <Section title="알림">
        <InfoItem
          icon={Bell}
          label="Web Push"
          value={pushStatus}
        />
        <ActionItem
          icon={PushActionIcon}
          label={pushActionLabel}
          description={pushActionDescription}
          onClick={handlePushToggle}
          disabled={isPushDisabled}
          loading={isPushUpdating}
        />
        <InfoItem
          icon={Smartphone}
          label="모바일 Safari"
          value="홈 화면에 추가된 PWA에서 푸시가 동작합니다"
        />
      </Section>

      {/* 보안 */}
      <Section title="보안">
        <ActionItem
          icon={Smartphone}
          label="휴대폰 인증"
          description={
            phoneVerifiedAt
              ? "최근 휴대폰 인증 상태가 반영되었습니다"
              : "SMS 인증으로 계정 휴대폰 인증 상태를 반영합니다"
          }
          onClick={() => setPhoneVerificationOpen(true)}
        />
        <ActionItem
          icon={Lock}
          label="비밀번호 변경"
          description={
            phoneVerificationValid
              ? "휴대폰 인증 완료 상태입니다"
              : "휴대폰 인증 후 현재 비밀번호를 새 비밀번호로 변경합니다"
          }
          onClick={handlePasswordChangeClick}
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
          description={
            isLoggingOut
              ? "현재 기기의 알림 토큰을 해제하고 있습니다"
              : "현재 기기에서 로그아웃합니다"
          }
          onClick={() => logout()}
          disabled={isLoggingOut}
          loading={isLoggingOut}
          danger
        />
      </Section>

      <PhoneUpdateVerificationModal
        open={phoneVerificationOpen}
        onClose={handlePhoneVerificationClose}
        onVerified={handlePhoneVerified}
      />
      <PasswordChangeModal
        open={passwordChangeOpen}
        onClose={() => setPasswordChangeOpen(false)}
        onChanged={handlePasswordChanged}
      />
      <CompanyEditModal
        open={companyEditOpen}
        company={company ?? null}
        onClose={() => setCompanyEditOpen(false)}
      />
    </div>
  );
}
