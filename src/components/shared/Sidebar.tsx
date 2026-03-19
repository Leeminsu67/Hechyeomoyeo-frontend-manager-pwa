'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  MapPin,
  ClipboardList,
  Clock,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const navItems = [
  { href: '/dashboard', label: '대시보드', icon: LayoutDashboard },
  { href: '/user', label: '인력 관리', icon: Users },
  { href: '/site', label: '현장 관리', icon: MapPin },
  { href: '/duty', label: '당직 관리', icon: ClipboardList },
  { href: '/attendance', label: '출결 관리', icon: Clock },
  { href: '/settings', label: '설정', icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col h-screen bg-white border-r border-[#DEE2E6]',
        'transition-all duration-300 ease-in-out flex-shrink-0',
        collapsed ? 'w-[68px]' : 'w-[240px]'
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          'flex items-center h-16 border-b border-[#DEE2E6] flex-shrink-0 overflow-hidden',
          'transition-all duration-300',
          collapsed ? 'justify-center px-3' : 'px-5'
        )}
      >
        {collapsed ? (
          <div className="w-8 h-8 rounded-lg bg-[#A5D8FF] flex items-center justify-center flex-shrink-0">
            <span className="font-black text-[#1C4E6E] text-sm">헤</span>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#A5D8FF] flex items-center justify-center flex-shrink-0">
              <span className="font-black text-[#1C4E6E] text-sm">헤</span>
            </div>
            <span className="font-bold text-[#212529] text-base tracking-tight whitespace-nowrap">
              헤쳐모여
            </span>
          </div>
        )}
      </div>

      {/* Collapse toggle — 로고와 첫 메뉴 사이 */}
      <div className={cn('px-2 pt-3 pb-1 flex-shrink-0', collapsed && 'flex justify-center')}>
        <button
          onClick={onToggle}
          className={cn(
            'flex items-center gap-2 rounded-lg px-3 py-2',
            'text-sm text-[#868E96] hover:bg-[#F1F3F5] hover:text-[#495057]',
            'transition-colors duration-150',
            collapsed ? 'w-auto' : 'w-full'
          )}
          title={collapsed ? '펼치기' : '접기'}
        >
          {collapsed ? (
            <PanelLeftOpen size={16} />
          ) : (
            <>
              <PanelLeftClose size={16} />
              <span className="whitespace-nowrap">접기</span>
            </>
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden">
        <ul className="space-y-0.5 px-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/');
            return (
              <li key={href}>
                <Link
                  href={href}
                  title={collapsed ? label : undefined}
                  className={cn(
                    'relative flex items-center gap-3 rounded-lg px-3 py-2.5',
                    'text-sm font-medium transition-all duration-150 group overflow-hidden',
                    isActive
                      ? 'bg-[#A5D8FF]/25 text-[#1C4E6E] font-semibold'
                      : 'text-[#495057] hover:bg-[#F1F3F5] hover:text-[#212529]',
                    collapsed && 'justify-center px-2.5'
                  )}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#74BFFF] rounded-r-full" />
                  )}
                  <Icon
                    size={18}
                    className={cn(
                      'flex-shrink-0 transition-colors',
                      isActive
                        ? 'text-[#0B8CE0]'
                        : 'text-[#868E96] group-hover:text-[#495057]'
                    )}
                  />
                  {!collapsed && (
                    <span className="truncate transition-all duration-200">{label}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

    </aside>
  );
}
