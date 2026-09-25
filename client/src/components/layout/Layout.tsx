/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { usePrivacy } from '../../contexts/PrivacyContext';
import { Link } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { MobileNav } from './MobileNav';
import { SyncIndicator } from '../SyncIndicator';
import { ThemeToggle } from './ThemeToggle';
import { Logo } from '../common/Logo';
import { Footer } from './Footer';
import {
  LayoutDashboard,
  Wallet,
  CreditCard,
  Moon,
  Calculator,
  Banknote,
  BarChart3,
  BookOpen,
  Settings,
  Wrench,
  KeyRound,
  type LucideIcon
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

const MAIN_NAV: NavItem[] = [
  { name: 'nav.dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'nav.assets', href: '/assets', icon: Wallet },
  { name: 'nav.liabilities', href: '/liabilities', icon: CreditCard },
  { name: 'nav.hawl', href: '/nisab-records', icon: Moon },
  { name: 'nav.calculator', href: '/calculator', icon: Calculator },
  { name: 'nav.payments', href: '/payments', icon: Banknote },
  { name: 'nav.analytics', href: '/analytics', icon: BarChart3 }
];

const LEARN_NAV: NavItem[] = [
  { name: 'nav.knowledgeHub', href: '/learn', icon: BookOpen }
];

const YOU_NAV: NavItem[] = [
  { name: 'nav.settings', href: '/settings', icon: Settings },
  { name: 'nav.diagnostics', href: '/diagnostics', icon: Wrench },
  { name: 'nav.admin', href: '/admin', icon: KeyRound }
];

const MOBILE_TABS: NavItem[] = [
  { name: 'nav.home', href: '/dashboard', icon: LayoutDashboard },
  { name: 'nav.assets', href: '/assets', icon: Wallet },
  { name: 'nav.hawl', href: '/nisab-records', icon: Moon },
  { name: 'nav.pay', href: '/payments', icon: Banknote }
];

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { t: tCommon } = useTranslation('common');
  const { user, logout } = useAuth();
  const { privacyMode, togglePrivacyMode } = usePrivacy();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getUserInitials = (u: any): string => {
    if (!u) return '?';
    const name = u.firstName || u.username || u.email?.split('@')[0] || 'User';
    const words = name.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleLogout = async () => {
    await logout();
  };

  // Close the user menu when clicking outside.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-border bg-card">
        <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
          <Link to="/dashboard" className="flex min-h-11 items-center gap-2.5" aria-label={tCommon('a11y.brandHome')}>
            <Logo className="h-8 w-8" />
            <span className="font-heading text-lg font-semibold text-secondary">ZakApp</span>
            <span
              className="font-arabic text-xl leading-none text-foreground/80 translate-y-[1px]"
              aria-hidden="true"
            >
              زكاة
            </span>
          </Link>

          <div className="flex-1" />

          <ThemeToggle />

          <button
            type="button"
            onClick={togglePrivacyMode}
            className={`flex h-11 w-11 items-center justify-center rounded-md transition-colors ${
              privacyMode ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent'
            }`}
            aria-label={privacyMode ? tCommon('a11y.showAmounts') : tCommon('a11y.hideAmounts')}
            title={privacyMode ? tCommon('a11y.showAmounts') : tCommon('a11y.hideAmountsForPrivacy')}
          >
            {privacyMode ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            )}
          </button>

          <div className="hidden sm:block">
            <SyncIndicator />
          </div>

          {/* Mobile menu trigger (sidebar is hidden below lg) */}
          <div className="lg:hidden">
            <MobileNav
              items={[...MAIN_NAV, ...LEARN_NAV, ...YOU_NAV].map(({ name, href, icon: Icon }) => ({
                name: tCommon(name),
                href,
                icon: <Icon className="h-5 w-5" />
              }))}
              isOpen={isMobileMenuOpen}
              onOpenChange={setIsMobileMenuOpen}
            />
          </div>

          {/* User menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsOpen(!isOpen)}
              onKeyDown={handleKeyDown}
              className="flex min-h-11 items-center gap-2 rounded-full px-1 text-sm transition-colors hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              id="user-menu-button"
              aria-expanded={isOpen}
              aria-haspopup="true"
              aria-label={`User menu for ${user?.firstName || user?.username || user?.email}`}
            >
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground"
                aria-hidden="true"
              >
                {getUserInitials(user)}
              </span>
              <svg
                className={`hidden h-4 w-4 text-muted-foreground transition-transform sm:block ${isOpen ? 'rotate-180' : ''}`}
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            {isOpen && (
              <div
                className="absolute end-0 z-50 mt-2 w-52 rounded-lg border border-border bg-popover py-1 shadow-elev-3 focus:outline-none"
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="user-menu-button"
              >
                <div className="border-b border-border px-4 py-2">
                  <p className="truncate text-sm font-medium text-foreground">
                    {user?.firstName || user?.username || user?.email?.split('@')[0]}
                  </p>
                  {user?.email && (
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  )}
                </div>

                <Link
                  to="/settings"
                  className="block px-4 py-2 text-sm text-foreground hover:bg-accent focus:bg-accent"
                  role="menuitem"
                  onClick={() => setIsOpen(false)}
                >
                  {tCommon('nav.settings')}
                </Link>

                {user?.isAdmin && (
                  <Link
                    to="/admin"
                    className="block px-4 py-2 text-sm text-foreground hover:bg-accent focus:bg-accent"
                    role="menuitem"
                    onClick={() => setIsOpen(false)}
                  >
                    {tCommon('nav.adminDashboard')}
                  </Link>
                )}

                <div className="my-1 border-t border-border" />

                <button
                  onClick={() => {
                    setIsOpen(false);
                    handleLogout();
                  }}
                  className="block w-full px-4 py-2 text-start text-sm text-foreground hover:bg-accent focus:bg-accent"
                  role="menuitem"
                >
                  {tCommon('nav.logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Shell: sidebar + page ─────────────────────────────────────────── */}
      <div className="mx-auto flex w-full max-w-[1400px]">
        <Sidebar
          mainNav={MAIN_NAV}
          learnNav={LEARN_NAV}
          youNav={YOU_NAV}
        />

        <main
          id="main-content"
          className="min-w-0 flex-1 px-4 pb-24 pt-5 sm:px-6 lg:pb-8"
          role="main"
        >
          {children}
          <Footer />
        </main>
      </div>

      <BottomNav
        items={MOBILE_TABS.map(({ name, href, icon: Icon }) => ({
          name: tCommon(name),
          href,
          icon: <Icon className="h-6 w-6" />
        }))}
        onMoreClick={() => setIsMobileMenuOpen(true)}
      />
    </div>
  );
};
