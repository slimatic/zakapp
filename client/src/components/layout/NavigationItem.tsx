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
import { NavLink } from 'react-router-dom';

interface NavigationItemProps {
  name: string;
  href: string;
  icon?: React.ReactNode;
  isActive: boolean;
  className?: string;
}

/**
 * NavigationItem component - Reusable navigation link with active state
 * 
 * Features:
 * - Uses React Router's NavLink for navigation
 * - Active state styling (green background and text)
 * - Hover state styling
 * - Optional icon support
 * - ARIA-compliant with aria-current attribute
 * - Minimum 44x44px touch target for accessibility
 * 
 * @param name - Display text for the navigation item
 * @param href - Route path
 * @param icon - Optional icon to display before text
 * @param isActive - Whether this navigation item is currently active
 * @param className - Optional additional CSS classes
 */
export const NavigationItem: React.FC<NavigationItemProps> = ({
  name,
  href,
  icon,
  isActive,
  className = '',
}) => {
  return (
    <NavLink
      to={href}
      className={`
        inline-flex items-center justify-center gap-2
        px-3 py-2 md:px-4 lg:px-5 rounded-md
        text-sm md:text-base font-medium
        transition-colors duration-150
        min-h-[44px] md:min-h-[48px] min-w-[44px]
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600
        ${
          isActive
            ? 'bg-green-100 text-green-700'
            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
        }
        ${className}
      `}
      aria-current={isActive ? 'page' : undefined}
    >
      {icon && (
        <span className="flex-shrink-0 hidden md:inline-flex w-5 h-5 lg:w-6 lg:h-6" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="truncate">{name}</span>
    </NavLink>
  );
};
