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

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, NavLink } from 'react-router-dom';

export interface MobileNavItem {
  name: string;
  href: string;
  icon?: React.ReactNode;
}

interface MobileNavProps {
  items: MobileNavItem[];
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ items, isOpen: controlledIsOpen, onOpenChange }) => {
  const { t } = useTranslation('common');
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const setIsOpen = (open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open);
    } else {
      setInternalIsOpen(open);
    }
  };

  const location = useLocation();

  /**
   * Determines if a navigation item is currently active
   */
  const isActive = (href: string): boolean => {
    if (location.pathname === href) {
      return true;
    }
    if (href !== '/' && location.pathname.startsWith(href + '/')) {
      return true;
    }
    return false;
  };

  /**
   * Toggle menu open/closed
   */
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  /**
   * Close menu
   */
  const closeMenu = () => {
    setIsOpen(false);
  };

  /**
   * Handle Escape key press to close menu
   */
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        closeMenu();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  /**
   * Close menu when route changes (user navigated)
   */
  useEffect(() => {
    closeMenu();
  }, [location.pathname]);

  /**
   * Prevent body scroll when menu is open
   */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <div className="lg:hidden">
      {/* Hamburger Menu Button */}
      <button
        onClick={toggleMenu}
        className="inline-flex items-center justify-center p-2 rounded-md text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring w-12 h-12"
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
        aria-label={t('a11y.toggleNavMenu')}
      >
        <svg
          className="h-6 w-6"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          {isOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Mobile Menu Overlay and Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
            onClick={closeMenu}
            aria-hidden="true"
            data-testid="mobile-nav-backdrop"
          />

          {/* Slide-in Menu Panel */}
          <div
            id="mobile-menu"
            className="fixed inset-y-0 start-0 w-64 bg-card shadow-elev-3 z-[60] transform transition-transform duration-300 ease-in-out"
            role="dialog"
            aria-modal="true"
            aria-label={t('a11y.mobileNavigation')}
          >
            <div className="h-full flex flex-col">
              {/* Menu Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="text-lg font-semibold text-secondary">{t('nav.menu')}</h2>
                <button
                  onClick={closeMenu}
                  className="p-2 rounded-md text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
                  aria-label={t('a11y.closeMenu')}
                >
                  <svg
                    className="h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Navigation Items */}
              <nav className="flex-1 overflow-y-auto p-4" aria-label={t('a11y.mobileNavMenu')}>
                <ul className="space-y-2">
                  {items.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <li key={item.href}>
                        <NavLink
                          to={item.href}
                          className={({ isActive: navActive }) =>
                            `inline-flex items-center justify-start gap-2 px-4 py-3 rounded-md text-sm font-medium transition-colors duration-150 min-h-[44px] min-w-[44px] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring w-full ${
                              navActive || active
                                ? 'bg-accent text-accent-foreground'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`
                          }
                          aria-current={active ? 'page' : undefined}
                          onClick={closeMenu}
                        >
                          <span className="flex-shrink-0 inline-flex w-5 h-5" aria-hidden="true">
                            {item.icon}
                          </span>
                          <span className="truncate">{item.name}</span>
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
