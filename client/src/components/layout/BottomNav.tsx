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
import { MoreHorizontal } from 'lucide-react';

export interface BottomNavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

interface BottomNavProps {
  items: BottomNavItem[];
  onMoreClick?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ items, onMoreClick }) => {
  const { t } = useTranslation('common');
  const location = useLocation();

  const isActive = (href: string): boolean => {
    if (location.pathname === href) {
      return true;
    }
    if (href !== '/' && location.pathname.startsWith(href + '/')) {
      return true;
    }
    if (href === '/nisab-records' && location.pathname.startsWith('/nisab-year-records')) {
      return true;
    }
    return false;
  };

  return (
    <nav
      className="fixed bottom-0 inset-x-0 bg-card border-t border-border z-40 block lg:hidden [box-shadow:var(--elev-2)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label={t('a11y.bottomNavigation')}
    >
      <div className="flex justify-around items-center h-16 px-2">
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive: navActive }) =>
                `flex flex-col items-center justify-center min-w-[60px] h-12 px-1 py-1 rounded-lg transition-all duration-200 ${
                  navActive || active
                    ? 'text-secondary font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                } focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2`
              }
              aria-label={item.name}
              aria-current={active ? 'page' : undefined}
            >
              <span
                className={`w-6 h-6 flex items-center justify-center transition-transform ${active ? 'scale-110' : ''}`}
                aria-hidden="true"
              >
                {item.icon}
              </span>
              <span className={`text-[10px] font-medium mt-1 truncate max-w-[56px] ${active ? 'font-bold' : ''}`}>
                {item.name}
              </span>
            </NavLink>
          );
        })}
        <button
          onClick={onMoreClick}
          className="flex flex-col items-center justify-center min-w-[60px] h-12 px-1 py-1 rounded-lg text-muted-foreground hover:text-foreground transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label={t('a11y.openMoreMenu')}
        >
          <span className="w-6 h-6 flex items-center justify-center" aria-hidden="true">
            <MoreHorizontal className="h-6 w-6" />
          </span>
          <span className="text-[10px] font-medium mt-1 truncate max-w-[56px]">{t('nav.more')}</span>
        </button>
      </div>
    </nav>
  );
};
