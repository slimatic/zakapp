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

import { useLocation, useNavigate } from 'react-router-dom';

/**
 * useNavigation custom hook - Wrapper for React Router navigation
 * 
 * Features:
 * - Provides current path from useLocation
 * - Provides navigate function from useNavigate
 * - Provides isActive function for route matching
 * - Handles nested routes (e.g., /tracking/*)
 * 
 * Usage:
 * ```tsx
 * const { currentPath, navigate, isActive } = useNavigation();
 * 
 * // Check if current route
 * if (isActive('/dashboard')) { ... }
 * 
 * // Navigate to route
 * navigate('/assets');
 * ```
 * 
 * @returns Navigation utilities object
 */
export const useNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  /**
   * Get current path
   */
  const currentPath = location.pathname;

  /**
   * Check if a path is currently active
   * Handles both exact matches and nested routes
   * 
   * @param path - Path to check (e.g., '/dashboard', '/tracking')
   * @returns True if the path is active
   */
  const isActive = (path: string): boolean => {
    // Exact match
    if (currentPath === path) {
      return true;
    }

    // Nested route match (e.g., /tracking/* should highlight /tracking)
    // Only match if not the root path and current path starts with path + '/'
    if (path !== '/' && currentPath.startsWith(path + '/')) {
      return true;
    }

    return false;
  };

  return {
    currentPath,
    navigate,
    isActive,
  };
};
