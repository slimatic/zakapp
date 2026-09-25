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
import { Link, useLocation } from 'react-router-dom';
import { type LucideIcon } from 'lucide-react';

export interface SidebarNavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

export interface SidebarProps {
  mainNav: SidebarNavItem[];
  learnNav: SidebarNavItem[];
  youNav: SidebarNavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ mainNav, learnNav, youNav }) => {
  const { t } = useTranslation('common');
  const location = useLocation();

  const isActive = (href: string): boolean => {
    if (href === '/nisab-records') {
      return location.pathname === '/nisab-records' || location.pathname.startsWith('/nisab-year-records');
    }
    return location.pathname === href;
  };

  const renderNavList = (items: SidebarNavItem[]) =>
    items.map(({ name, href, icon: Icon }) => {
      const active = isActive(href);
      return (
        <Link
          key={href}
          to={href}
          aria-current={active ? 'page' : undefined}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            active
              ? 'bg-secondary text-secondary-foreground'
              : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground'
          }`}
        >
          <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
          <span className="truncate">{t(name)}</span>
        </Link>
      );
    });

  return (
    <nav
      className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 overflow-y-auto border-e border-border bg-card px-3 py-4 lg:block"
      aria-label={t('a11y.mainNavigation')}
    >
      <div className="space-y-1">{renderNavList(mainNav)}</div>

      <p className="px-3 pb-1 pt-5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {t('nav.learn')}
      </p>
      <div className="space-y-1">{renderNavList(learnNav)}</div>

      <p className="px-3 pb-1 pt-5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {t('nav.you')}
      </p>
      <div className="space-y-1">{renderNavList(youNav)}</div>
    </nav>
  );
};
