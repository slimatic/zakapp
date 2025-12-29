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

import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { NavigationItemType } from './Navigation';

interface BottomNavProps {
  items: NavigationItemType[];
  onMoreClick?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ items, onMoreClick }) => {
  const location = useLocation();

  const isActive = (item: NavigationItemType): boolean => {
    const href = item.href;
    if (item.name === 'More') return false;

    if (location.pathname === href) {
      return true;
    }
    // Handle nested routes (e.g., /nisab-records/*)
    if (href !== '/' && location.pathname.startsWith(href + '/')) {
      return true;
    }
    // Handle /nisab-records alias
    if (href === '/nisab-records' && location.pathname.startsWith('/nisab-year-records')) {
      return true;
    }
    return false;
  };

  return (
    <nav
      className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 shadow-lg z-40 block md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Bottom navigation"
    >
      <div className="flex justify-around items-center h-16 px-2">
        {items.map((item) => {
          const active = isActive(item);
          const isMore = item.name === 'More';

          const content = (
            <>
              {item.icon && (
                <span className={`w-6 h-6 flex items-center justify-center transition-transform ${active ? 'scale-110' : ''}`} aria-hidden="true">
                  {item.icon}
                </span>
              )}
              <span className={`text-[10px] font-medium mt-1 truncate max-w-[56px] ${active ? 'font-bold' : ''}`}>
                {item.name}
              </span>
            </>
          );

          if (isMore) {
            return (
              <button
                key="more-button"
                onClick={onMoreClick}
                className="flex flex-col items-center justify-center min-w-[60px] h-12 px-1 py-1 rounded-lg text-gray-500 hover:text-gray-900 transition-all active:scale-95"
                aria-label="Open more menu"
              >
                {content}
              </button>
            );
          }

          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive: navActive }) => `
                flex flex-col items-center justify-center
                min-w-[60px] h-12
                px-1 py-1
                rounded-lg
                transition-all duration-200
                ${navActive || active
                  ? 'text-primary-600 bg-primary-50/50'
                  : 'text-gray-500 hover:text-gray-900'
                }
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
              `.trim()}
              aria-label={item.name}
              aria-current={active ? 'page' : undefined}
            >
              {content}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
