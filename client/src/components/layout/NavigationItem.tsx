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
        px-4 py-2 rounded-md
        text-sm font-medium
        transition-colors duration-150
        min-h-[44px] min-w-[44px]
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
        <span className="flex-shrink-0" aria-hidden="true">
          {icon}
        </span>
      )}
      <span>{name}</span>
    </NavLink>
  );
};
