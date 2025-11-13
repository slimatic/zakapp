import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { SkipLink } from '../common/SkipLink';
import { BottomNav } from './BottomNav';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await logout();
  };

  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/dashboard',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    { 
      name: 'Assets', 
      href: '/assets',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    },
    { 
      name: 'Nisab Records', 
      href: '/nisab-records',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      )
    },
    { 
      name: 'Profile', 
      href: '/profile',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
  ];

  const isActive = (href: string) => {
    // For nisab-records route, also highlight when on nisab-year-records
    if (href === '/nisab-records') {
      return location.pathname === '/nisab-records' || location.pathname.startsWith('/nisab-year-records');
    }
    return location.pathname === href;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard navigation for dropdown
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Skip Link for keyboard navigation */}
      <SkipLink />
      
      {/* Navigation */}
      <nav className="bg-white shadow-lg" role="navigation" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/dashboard" className="flex items-center" aria-label="ZakApp Home">
                  <div className="h-8 w-8 bg-green-600 rounded-full flex items-center justify-center" aria-hidden="true">
                    <span className="text-white font-bold">Z</span>
                  </div>
                  <span className="ml-2 text-xl font-bold text-gray-900">ZakApp</span>
                </Link>
              </div>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4" role="list">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        isActive(item.href)
                          ? 'bg-green-100 text-green-700'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                      aria-current={isActive(item.href) ? 'page' : undefined}
                      role="listitem"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex-shrink-0" ref={dropdownRef}>
                <div className="relative">
                  <button
                    onClick={() => setIsOpen(!isOpen)}
                    onKeyDown={handleKeyDown}
                    className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600"
                    id="user-menu-button"
                    aria-expanded={isOpen}
                    aria-haspopup="true"
                    aria-label={`User menu for ${user?.username}`}
                  >
                    <span className="text-gray-700 text-sm mr-2">
                      Welcome, {user?.username}!
                    </span>
                    <svg 
                      className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>

                  {isOpen && (
                    <div
                      className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                      role="menu"
                      aria-orientation="vertical"
                      aria-labelledby="user-menu-button"
                    >
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100"
                        role="menuitem"
                        onClick={() => setIsOpen(false)}
                        tabIndex={0}
                      >
                        Profile
                      </Link>
                      <Link
                        to="/settings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100"
                        role="menuitem"
                        onClick={() => setIsOpen(false)}
                        tabIndex={0}
                      >
                        Settings
                      </Link>
                      <button
                        onClick={() => {
                          setIsOpen(false);
                          handleLogout();
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100"
                        role="menuitem"
                        tabIndex={0}
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3" role="list">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive(item.href)
                    ? 'bg-green-100 text-green-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
                aria-current={isActive(item.href) ? 'page' : undefined}
                role="listitem"
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main id="main-content" className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 pb-20 md:pb-6" role="main">
        <div className="px-4 py-6 sm:px-0">
          {children}
        </div>
      </main>

      {/* Bottom Navigation (Mobile Only) */}
      <BottomNav items={navigation} />
    </div>
  );
};