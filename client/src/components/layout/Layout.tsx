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
import { useAuth } from '../../contexts/AuthContext';
import { usePrivacy } from '../../contexts/PrivacyContext';
import { Link, useLocation } from 'react-router-dom';
import { SkipLink } from '../common/SkipLink';
import { MobileNav } from './MobileNav';
import { BottomNav } from './BottomNav';
import { SyncIndicator } from '../SyncIndicator';
import { Logo } from '../common/Logo';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { privacyMode, togglePrivacyMode } = usePrivacy();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Helper function to get user initials for avatar
  const getUserInitials = (user: any): string => {
    if (!user) return '?';

    const name = user.firstName || user.username || user.email?.split('@')[0] || 'User';

    // Get first two initials (e.g., "John Test" → "JT", "johntest" → "JT")
    const words = name.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    // Single word: take first two characters
    return name.substring(0, 2).toUpperCase();
  };

  const handleLogout = async () => {
    await logout();
  };

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      name: 'Assets',
      href: '/assets',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    },
    {
      name: 'Liabilities',
      href: '/liabilities',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      name: 'Nisab',
      href: '/nisab-records',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      )
    },
    {
      name: 'Payments',
      href: '/payments',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a1 1 0 11-2 0 1 1 0 012 0z" />
        </svg>
      )
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      name: 'Ilm Hub',
      href: '/learn',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
  ];

  const desktopGroups = [
    { name: 'Dashboard', href: '/dashboard' },
    {
      name: 'Wealth',
      items: [
        { name: 'Assets', href: '/assets' },
        { name: 'Liabilities', href: '/liabilities' },
      ]
    },
    {
      name: 'Records',
      items: [
        { name: 'Nisab Records', href: '/nisab-records' },
        { name: 'Payments', href: '/payments' },
      ]
    },
    { name: 'Analytics', href: '/analytics' },
    { name: 'Ilm Hub', href: '/learn' },
  ];

  const bottomNavItems = [
    navigation[0], // Dashboard
    navigation[1], // Assets
    navigation[3], // Nisab
    navigation[6], // Ilm Hub (index 6 after adding analytics index 5 and ilm hub index 6... wait previous analytics was 5, ilm is 6)
  ];

  /* 
   * CAUTION: 'navigation' array indices:
   * 0: Dashboard
   * 1: Assets
   * 2: Liabilities
   * 3: Nisab
   * 4: Payments
   * 5: Analytics
   * 6: Ilm Hub
   */
  // Re-define bottomNavItems to be safe with indices
  const bottomNavReordered = [
    navigation[0], // Dashboard
    navigation[1], // Assets
    navigation[3], // Nisab
    navigation[6], // Ilm Hub
  ];

  const isActive = (href: string) => {
    // For nisab-records route, also highlight when on nisab-year-records
    if (href === '/nisab-records') {
      return location.pathname === '/nisab-records' || location.pathname.startsWith('/nisab-year-records');
    }
    return location.pathname === href;
  };

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard navigation for dropdown
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Skip Link for keyboard navigation - positioned absolutely at top */}
      <SkipLink />

      {/* Navigation */}
      <nav className="bg-white shadow-lg" role="navigation" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/dashboard" className="flex items-center gap-2" aria-label="ZakApp Home">
                  <Logo className="h-8 w-8" />
                  <span className="text-xl font-bold text-gray-900">ZakApp</span>
                </Link>
              </div>
              <div className="hidden md:block">
                <ul className="ml-10 flex items-center space-x-1 lg:space-x-4">
                  {desktopGroups.map((group) => (
                    <li key={group.name} className="relative group">
                      {group.items ? (
                        <div className="relative">
                          <button
                            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${group.items.some(item => isActive(item.href))
                              ? 'bg-primary-50 text-primary-700'
                              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                              }`}
                          >
                            {group.name}
                            <svg className="ml-1 h-4 w-4 text-gray-400 group-hover:text-gray-500 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>

                          {/* Dropdown Menu */}
                          <div className="absolute left-0 mt-0 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                            {group.items.map((item) => (
                              <Link
                                key={item.href}
                                to={item.href}
                                className={`block px-4 py-2 text-sm ${isActive(item.href)
                                  ? 'bg-primary-50 text-primary-700'
                                  : 'text-gray-700 hover:bg-gray-100'
                                  }`}
                              >
                                {item.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <Link
                          to={group.href || '#'}
                          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive(group.href || '')
                            ? 'bg-primary-50 text-primary-700'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            }`}
                          aria-current={isActive(group.href || '') ? 'page' : undefined}
                        >
                          {group.name}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Sync Status Indicator */}
              <SyncIndicator />

              {/* Privacy Toggle - Global */}
              <button
                type="button"
                onClick={togglePrivacyMode}
                className={`p-2 rounded-md transition-colors ${privacyMode ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}
                aria-label={privacyMode ? 'Show amounts' : 'Hide amounts'}
                title={privacyMode ? 'Show amounts' : 'Hide amounts for privacy'}
              >
                {privacyMode ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                )}
              </button>

              {/* Mobile Navigation Hamburger (md:hidden) */}
              <div className="md:hidden mr-2">
                <MobileNav
                  items={navigation}
                  isOpen={isMobileMenuOpen}
                  onOpenChange={setIsMobileMenuOpen}
                />
              </div>

              {/* User Dropdown Menu */}
              <div className="flex-shrink-0" ref={dropdownRef}>
                <div className="relative">
                  <button
                    onClick={() => setIsOpen(!isOpen)}
                    onKeyDown={handleKeyDown}
                    className="flex items-center gap-2 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 p-1 hover:bg-gray-50 transition-colors"
                    id="user-menu-button"
                    aria-expanded={isOpen}
                    aria-haspopup="true"
                    aria-label={`User menu for ${user?.firstName || user?.username || user?.email}`}
                  >
                    {/* User Avatar with Initials */}
                    <div
                      className="h-8 w-8 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white font-semibold text-sm shadow-sm"
                      aria-hidden="true"
                    >
                      {getUserInitials(user)}
                    </div>

                    {/* User Name - Hidden on Mobile, Visible on Desktop */}
                    <span className="hidden md:inline text-gray-700 text-sm font-medium">
                      {user?.firstName || user?.username || user?.email?.split('@')[0]}
                    </span>

                    {/* Screen Reader Only - Always announce full name */}
                    <span className="sr-only">
                      {user?.firstName || user?.username || user?.email?.split('@')[0]}
                    </span>

                    {/* Dropdown Chevron */}
                    <svg
                      className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>

                  {isOpen && (
                    <div
                      className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                      role="menu"
                      aria-orientation="vertical"
                      aria-labelledby="user-menu-button"
                    >
                      {/* Profile link extracted to Settings */}
                      <Link
                        to="/settings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100"
                        role="menuitem"
                        onClick={() => setIsOpen(false)}
                        tabIndex={0}
                      >
                        Settings
                      </Link>
                      <button
                        onClick={() => {
                          setIsOpen(false);
                          handleLogout();
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100"
                        role="menuitem"
                        tabIndex={0}
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main id="main-content" className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 pb-20 md:pb-6" role="main">
        <div className="px-4 py-6 sm:px-0">
          {children}
        </div>

        {/* Powered By Footer */}
        <footer className="mt-8 pt-6 border-t border-gray-100 flex flex-col items-center justify-center pb-4 gap-2">
          <a
            href="https://rstlabs.io"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span>Made with ❤️ by</span>
            <span className="font-semibold">RST Labs</span>
          </a>
          <div className="text-[10px] text-gray-300 font-mono">
            {__APP_VERSION__} ({__COMMIT_HASH__})
          </div>
        </footer>
      </main>

      <BottomNav
        items={[
          ...bottomNavReordered,
          {
            name: 'More',
            href: '#',
            icon: (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )
          }
        ]}
        onMoreClick={() => setIsMobileMenuOpen(true)}
      />
    </div>
  );
};