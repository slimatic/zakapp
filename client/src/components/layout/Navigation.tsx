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
import { useLocation } from 'react-router-dom';
import { NavigationItem } from './NavigationItem';

export interface NavigationItemType {
  name: string;
  href: string;
  icon?: React.ReactNode;
}

interface NavigationProps {
  items: NavigationItemType[];
  className?: string;
}

/**
 * Navigation component for desktop horizontal navigation
 * 
 * Features:
 * - Displays navigation items in a horizontal flex layout
 * - Automatically detects active route using React Router
 * - Responsive design with Tailwind CSS
 * - ARIA-compliant navigation landmark
 * 
 * @param items - Array of navigation items with name, href, and optional icon
 * @param className - Optional additional CSS classes
 */
export const Navigation: React.FC<NavigationProps> = ({ items, className = '' }) => {
  const location = useLocation();

  /**
   * Determines if a navigation item is currently active
   * Handles both exact matches and nested routes (e.g., /tracking/*)
   */
  const isActive = (href: string): boolean => {
    // Exact match for most routes
    if (location.pathname === href) {
      return true;
    }
    
    // Handle nested routes (e.g., /tracking/analytics should highlight /tracking)
    // Only match if the current path starts with the href and has a trailing slash or segment
    if (href !== '/' && location.pathname.startsWith(href + '/')) {
      return true;
    }
    
    return false;
  };

  return (
    <nav 
      className={`hidden md:flex items-center space-x-4 md:space-x-6 lg:space-x-8 ${className}`}
      aria-label="Main navigation"
    >
      {items.map((item) => (
        <NavigationItem
          key={item.href}
          name={item.name}
          href={item.href}
          icon={item.icon}
          isActive={isActive(item.href)}
        />
      ))}
    </nav>
  );
};
