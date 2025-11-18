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
