'use client';

import { Menu, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';

const roleLabels: Record<string, string> = {
  OWNER: '대표',
  HR_MANAGER: '인사관리자',
  ADMIN: '관리자',
  USER: '일반',
};

interface HeaderProps {
  onMobileMenuOpen: () => void;
}

export function Header({ onMobileMenuOpen }: HeaderProps) {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();

  const roleLabel = roleLabels[user?.role ?? ''] ?? (user?.role ?? '');
  const initials = (user?.loginId ?? '?').slice(0, 1).toUpperCase();

  const handleLogout = () => {
    clearAuth();
    router.replace('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-white border-b border-[#DEE2E6] flex-shrink-0">
      {/* Left: Hamburger (mobile) */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuOpen}
          className="lg:hidden p-2 rounded-lg hover:bg-[#F1F3F5] text-[#495057] transition-colors duration-150 active:scale-95"
          aria-label="메뉴 열기"
        >
          <Menu size={20} />
        </button>

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#A5D8FF] flex items-center justify-center">
            <span className="font-black text-[#1C4E6E] text-xs">헤</span>
          </div>
          <span className="font-bold text-[#212529] text-sm tracking-tight">헤쳐모여</span>
        </div>
      </div>

      {/* Right: User info */}
      <div className="flex items-center gap-2">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-[#A5D8FF]/40 flex items-center justify-center flex-shrink-0 border border-[#A5D8FF]/60">
          <span className="text-xs font-bold text-[#1C4E6E]">{initials}</span>
        </div>

        {/* Name + Role */}
        <div className="hidden sm:flex flex-col items-end leading-tight mr-1">
          <span className="text-sm font-semibold text-[#212529]">
            {user?.loginId ?? '-'}
          </span>
          <span className="text-xs text-[#868E96]">{roleLabel}</span>
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-5 bg-[#DEE2E6]" />

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="hidden sm:flex p-2 rounded-lg text-[#868E96] hover:text-[#7A1C1C] hover:bg-[#FFC9C9]/30 transition-colors duration-150"
          title="로그아웃"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
