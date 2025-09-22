import React, { useState } from 'react';
import { Menu, X, Calculator, Moon, Sun, LogOut, User } from 'lucide-react';

type AppView = 'dashboard' | 'assets' | 'calculate' | 'history';

interface HeaderProps {
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  currentView?: AppView;
  onNavigate?: (view: AppView) => void;
  // Optional props for demo mode
  user?: { username: string };
  isAuthenticated?: boolean;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  isDarkMode = false, 
  onToggleDarkMode,
  currentView = 'dashboard',
  onNavigate,
  user: propUser,
  isAuthenticated: propIsAuthenticated,
  onLogout: propOnLogout
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Try to use auth context, fallback to props for demo mode
  let user, isAuthenticated, logout;
  try {
    const { useAuth } = require('../auth');
    const auth = useAuth();
    user = propUser || auth.user;
    isAuthenticated = propIsAuthenticated !== undefined ? propIsAuthenticated : auth.isAuthenticated;
    logout = propOnLogout || auth.logout;
  } catch {
    // Auth context not available, use props
    user = propUser;
    isAuthenticated = propIsAuthenticated || false;
    logout = propOnLogout || (() => {});
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleNavigation = (view: AppView) => {
    onNavigate?.(view);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
  };

  if (!isAuthenticated) {
    return null; // Don't show header when not authenticated
  }

  return (
    <header className="sticky top-0 z-50 glass border-b border-neutral-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-8 h-8 bg-primary-600 rounded-lg">
              <Calculator className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-neutral-900 leading-none">zakapp</h1>
              <p className="text-xs text-neutral-600 leading-none">Zakat Calculator</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => handleNavigation('dashboard')}
              className={`font-medium transition-colors ${
                currentView === 'dashboard' 
                  ? 'text-primary-600' 
                  : 'text-neutral-700 hover:text-primary-600'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => handleNavigation('calculate')}
              className={`font-medium transition-colors ${
                currentView === 'calculate' 
                  ? 'text-primary-600' 
                  : 'text-neutral-700 hover:text-primary-600'
              }`}
            >
              Calculate
            </button>
            <button
              onClick={() => handleNavigation('assets')}
              className={`font-medium transition-colors ${
                currentView === 'assets' 
                  ? 'text-primary-600' 
                  : 'text-neutral-700 hover:text-primary-600'
              }`}
            >
              Assets
            </button>
            <button
              onClick={() => handleNavigation('history')}
              className={`font-medium transition-colors ${
                currentView === 'history' 
                  ? 'text-primary-600' 
                  : 'text-neutral-700 hover:text-primary-600'
              }`}
            >
              History
            </button>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center space-x-4">
            {/* Dark Mode Toggle */}
            {onToggleDarkMode && (
              <button
                onClick={onToggleDarkMode}
                className="p-2 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>
            )}

            {/* User Menu */}
            <div className="hidden sm:flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-sm text-neutral-600">
                <User className="w-4 h-4" />
                <span>Hello, {user?.username}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 text-sm text-neutral-600 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden animate-fade-in">
            <div className="px-2 pt-2 pb-3 space-y-1 border-t border-neutral-200/50 bg-white/50 backdrop-blur-sm">
              <button
                onClick={() => handleNavigation('dashboard')}
                className={`block w-full text-left px-3 py-2 rounded-lg font-medium transition-colors ${
                  currentView === 'dashboard'
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-neutral-700 hover:text-primary-600 hover:bg-neutral-100'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => handleNavigation('calculate')}
                className={`block w-full text-left px-3 py-2 rounded-lg font-medium transition-colors ${
                  currentView === 'calculate'
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-neutral-700 hover:text-primary-600 hover:bg-neutral-100'
                }`}
              >
                Calculate Zakat
              </button>
              <button
                onClick={() => handleNavigation('assets')}
                className={`block w-full text-left px-3 py-2 rounded-lg font-medium transition-colors ${
                  currentView === 'assets'
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-neutral-700 hover:text-primary-600 hover:bg-neutral-100'
                }`}
              >
                Manage Assets
              </button>
              <button
                onClick={() => handleNavigation('history')}
                className={`block w-full text-left px-3 py-2 rounded-lg font-medium transition-colors ${
                  currentView === 'history'
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-neutral-700 hover:text-primary-600 hover:bg-neutral-100'
                }`}
              >
                History
              </button>
              <div className="pt-2 border-t border-neutral-200/50">
                <div className="px-3 py-2 text-sm text-neutral-600">
                  Logged in as {user?.username}
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};