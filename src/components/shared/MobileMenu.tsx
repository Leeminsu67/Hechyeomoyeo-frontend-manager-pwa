'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import { navItems } from './Sidebar';
import { cn } from '@/lib/utils';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const pathname = usePathname();

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]',
          'transition-opacity duration-300 ease-in-out',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Full-screen panel */}
      <div
        className={cn(
          'fixed inset-0 z-50 bg-white flex flex-col',
          'transition-[opacity,transform] duration-[350ms] ease-[cubic-bezier(0.16,1,0.3,1)]',
          isOpen
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 -translate-y-3 pointer-events-none'
        )}
        role="dialog"
        aria-modal="true"
        aria-label="내비게이션 메뉴"
      >
        {/* Top bar */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="font-black text-primary-foreground text-sm">헤</span>
            </div>
            <span className="font-bold text-text-strong text-base tracking-tight">헤쳐모여</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted text-text transition-colors duration-150 active:scale-95"
            aria-label="메뉴 닫기"
          >
            <X size={22} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-4 px-4">
          <ul className="space-y-1">
            {navItems.map(({ href, label, icon: Icon }, index) => {
              const isActive = pathname === href || pathname.startsWith(href + '/');
              return (
                <li
                  key={href}
                  style={{
                    transitionDelay: isOpen ? `${60 + index * 35}ms` : '0ms',
                    opacity: isOpen ? 1 : 0,
                    transform: isOpen ? 'translateY(0)' : 'translateY(10px)',
                    transition: 'opacity 0.3s ease, transform 0.35s cubic-bezier(0.16,1,0.3,1)',
                  }}
                >
                  <Link
                    href={href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-4 rounded-xl px-4 py-3.5',
                      'text-[15px] font-medium transition-colors duration-150',
                      isActive
                        ? 'bg-primary/20 text-primary-foreground font-semibold'
                        : 'text-text hover:bg-muted active:bg-muted'
                    )}
                  >
                    <div
                      className={cn(
                        'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                        isActive ? 'bg-primary/40' : 'bg-muted'
                      )}
                    >
                      <Icon
                        size={18}
                        className={isActive ? 'text-primary-500' : 'text-muted-foreground'}
                      />
                    </div>
                    <span>{label}</span>
                    {isActive && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

      </div>
    </>
  );
}
