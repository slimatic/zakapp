import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { NavigationItemType } from './Navigation';

interface BottomNavProps {
  items: NavigationItemType[];
}

/**
 * BottomNav component for mobile bottom navigation bar
 * 
 * Features:
 * - Fixed bottom position (sticky bottom nav bar)
 * - Only visible on mobile (<768px): `block md:hidden`
 * - 4 icon buttons matching main navigation items
 * - Active state with colored icon and label
 * - Safe area insets for iOS notch (env(safe-area-inset-bottom))
 * - 48x48px minimum touch targets
 * - Keyboard accessible with proper ARIA
 * 
 * @param items - Array of navigation items (max 4-5 recommended)
 */
export const BottomNav: React.FC<BottomNavProps> = ({ items }) => {
  const location = useLocation();

  /**
   * Determines if a navigation item is currently active
   */
  const isActive = (href: string): boolean => {
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
          const active = isActive(item.href);
          
          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) => `
                flex flex-col items-center justify-center
                min-w-[64px] h-12
                px-2 py-1
                rounded-lg
                transition-colors duration-150
                ${isActive || active
                  ? 'text-green-600 bg-green-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }
                focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2
              `.trim()}
              aria-label={item.name}
              aria-current={active ? 'page' : undefined}
            >
              {/* Icon */}
              {item.icon && (
                <span className="w-6 h-6 flex items-center justify-center" aria-hidden="true">
                  {item.icon}
                </span>
              )}
              
              {/* Label (small text below icon) */}
              <span className="text-xs font-medium mt-1 truncate max-w-[60px]">
                {item.name}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
