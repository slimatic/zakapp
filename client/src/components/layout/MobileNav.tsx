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

import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { NavigationItem } from './NavigationItem';
import { NavigationItemType } from './Navigation';

interface MobileNavProps {
  items: NavigationItemType[];
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ items, isOpen: controlledIsOpen, onOpenChange }) => {
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
  const menuRef = useRef<HTMLDivElement>(null);

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
    <div className="md:hidden">
      {/* Hamburger Menu Button */}
      <button
        onClick={toggleMenu}
        className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-600 w-12 h-12"
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
        aria-label="Toggle navigation menu"
      >
        {/* Hamburger icon (3 horizontal lines) */}
        <svg
          className="h-6 w-6"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          {isOpen ? (
            // X icon when menu is open
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            // Hamburger icon when menu is closed
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
            ref={menuRef}
            id="mobile-menu"
            className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl z-[60] transform transition-transform duration-300 ease-in-out"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
          >
            <div className="h-full flex flex-col">
              {/* Menu Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
                <button
                  onClick={closeMenu}
                  className="p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-600"
                  aria-label="Close menu"
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
              <nav className="flex-1 overflow-y-auto p-4" aria-label="Mobile navigation menu">
                <ul className="space-y-2">
                  {items.map((item) => (
                    <li key={item.href}>
                      <NavigationItem
                        name={item.name}
                        href={item.href}
                        icon={item.icon}
                        isActive={isActive(item.href)}
                        className="w-full justify-start px-4 py-3"
                      />
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
