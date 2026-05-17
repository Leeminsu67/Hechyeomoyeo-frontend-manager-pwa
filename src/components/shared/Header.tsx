'use client';

import { Menu, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { ROLE_META, RoleValue } from '@/types/user';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';
import { canUsePushNotifications } from '@/features/notifications/lib/pushNotificationEligibility';

interface HeaderProps {
  onMobileMenuOpen: () => void;
}

export function Header({ onMobileMenuOpen }: HeaderProps) {
  const { user } = useAuthStore();
  const { mutate: logout, isPending } = useLogout();

  const roleLabel = user?.role != null ? (ROLE_META[Number(user.role) as RoleValue]?.label ?? String(user.role)) : '-';
  const initials = (user?.loginId ?? '?').slice(0, 1).toUpperCase();
  const canViewNotifications = canUsePushNotifications(user?.role);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-white border-b border-border flex-shrink-0">
      {/* Left: Hamburger (mobile) */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuOpen}
          className="lg:hidden p-2 rounded-lg hover:bg-muted text-text transition-colors duration-150 active:scale-95"
          aria-label="메뉴 열기"
        >
          <Menu size={20} />
        </button>

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <span className="font-black text-primary-foreground text-xs">헤</span>
          </div>
          <span className="font-bold text-text-strong text-sm tracking-tight">헤쳐모여</span>
        </div>
      </div>

      {/* Right: User info */}
      <div className="flex items-center gap-2">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-primary/40 flex items-center justify-center flex-shrink-0 border border-primary/60">
          <span className="text-xs font-bold text-primary-foreground">{initials}</span>
        </div>

        {/* Name + Role */}
        <div className="hidden lg:flex flex-col items-end leading-tight mr-1">
          <span className="text-sm font-semibold text-text-strong">
            {user?.loginId ?? '-'}
          </span>
          <span className="text-xs text-muted-foreground">{roleLabel}</span>
        </div>

        {/* Divider */}
        <div className="hidden lg:block w-px h-5 bg-border" />

        {/* Notifications */}
        {canViewNotifications && <NotificationBell />}

        {/* Logout */}
        <button
          onClick={() => logout()}
          disabled={isPending}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground hover:text-danger-foreground hover:bg-danger/30 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="로그아웃"
          title="로그아웃"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
