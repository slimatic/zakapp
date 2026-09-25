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
import { useTranslation } from 'react-i18next';
import { NavLink, useLocation } from 'react-router-dom';
import { NavigationItemType } from './Navigation';

interface BottomNavProps {
  items: NavigationItemType[];
  onMoreClick?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ items, onMoreClick }) => {
    const { t } = useTranslation('common');
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
      className="fixed bottom-0 inset-x-0 bg-card border-t border-border z-40 block md:hidden [box-shadow:var(--elev-2)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label={t('a11y.bottomNavigation')}
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
                className="flex flex-col items-center justify-center min-w-[60px] h-12 px-1 py-1 rounded-lg text-muted-foreground hover:text-foreground transition-all active:scale-95"
                aria-label={t('a11y.openMoreMenu')}
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
                  ? 'text-secondary font-bold'
                  : 'text-muted-foreground hover:text-foreground'
                }
                focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
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
