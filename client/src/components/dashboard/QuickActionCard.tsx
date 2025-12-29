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

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: 'default' | 'primary';
}

/**
 * QuickActionCard component - Actionable card for common tasks
 * 
 * Features:
 * - Card design with elevated shadow and hover effect
 * - Icon + title + description layout
 * - Can be a link (href) or button (onClick)
 * - Responsive sizing
 * - Minimum 88px height for comfortable touch targets
 * - Primary variant for call-to-action emphasis
 * 
 * @param title - Action title (e.g., "Add Asset")
 * @param description - Brief description of the action
 * @param icon - Icon to display (React element)
 * @param href - Optional route to navigate to
 * @param onClick - Optional click handler (for buttons)
 * @param variant - Visual style variant ('default' or 'primary')
 */
export const QuickActionCard: React.FC<QuickActionCardProps> = ({
  title,
  description,
  icon,
  href,
  onClick,
  variant = 'default',
}) => {
  const baseClasses = `
    flex flex-col items-start gap-3 p-6 rounded-lg shadow-md
    transition-shadow duration-200 hover:shadow-lg
    min-h-[88px] w-full
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600
  `;

  const variantClasses = variant === 'primary'
    ? 'bg-green-50 border-2 border-green-200 hover:border-green-300'
    : 'bg-white border border-gray-200 hover:border-gray-300';

  const content = (
    <>
      {/* Icon */}
      <div className="flex-shrink-0 text-green-600" aria-hidden="true">
        {icon}
      </div>

      {/* Text Content */}
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          {title}
        </h3>
        <p className="text-sm text-gray-600">
          {description}
        </p>
      </div>

      {/* Arrow indicator */}
      <div className="self-end text-gray-400">
        <svg
          className="w-5 h-5"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </>
  );

  // Render as Link if href provided
  if (href) {
    return (
      <Link
        to={href}
        className={`${baseClasses} ${variantClasses}`}
      >
        {content}
      </Link>
    );
  }

  // Render as button if onClick provided
  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variantClasses} text-left`}
      type="button"
    >
      {content}
    </button>
  );
};
