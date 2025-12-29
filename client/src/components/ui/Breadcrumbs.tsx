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
import { Link } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

/**
 * Breadcrumbs component - Hierarchical navigation breadcrumbs
 * 
 * Features:
 * - Displays navigation path (e.g., Home > Assets > Details)
 * - Last item (current page) is not a link
 * - Separator: ">" icon between items
 * - ARIA-compliant with proper navigation landmark
 * - Responsive: Hidden on mobile (<768px), visible on tablet+
 * - Keyboard accessible
 * 
 * @param items - Array of breadcrumb items with label and optional href
 */
export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <nav
      className="hidden md:flex items-center space-x-2 text-sm mb-4"
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center space-x-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center">
              {/* Separator (not for first item) */}
              {index > 0 && (
                <svg
                  className="w-4 h-4 text-gray-400 mx-2"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              )}

              {/* Breadcrumb Item */}
              {isLast ? (
                // Last item (current page) - not a link
                <span
                  className="font-medium text-gray-900"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : item.href ? (
                // Intermediate item - link
                <Link
                  to={item.href}
                  className="text-gray-600 hover:text-gray-900 hover:underline focus:outline-none focus:ring-2 focus:ring-green-600 rounded px-1"
                >
                  {item.label}
                </Link>
              ) : (
                // Item without href - plain text
                <span className="text-gray-600">{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
