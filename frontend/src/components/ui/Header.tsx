import React, { useState } from 'react';
import { Menu, X, Calculator, Moon, Sun } from 'lucide-react';

interface HeaderProps {
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isDarkMode = false, onToggleDarkMode }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

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
            <a href="#dashboard" className="text-neutral-700 hover:text-primary-600 font-medium transition-colors">
              Dashboard
            </a>
            <a href="#calculate" className="text-neutral-700 hover:text-primary-600 font-medium transition-colors">
              Calculate
            </a>
            <a href="#assets" className="text-neutral-700 hover:text-primary-600 font-medium transition-colors">
              Assets
            </a>
            <a href="#history" className="text-neutral-700 hover:text-primary-600 font-medium transition-colors">
              History
            </a>
            <a href="#help" className="text-neutral-700 hover:text-primary-600 font-medium transition-colors">
              Help
            </a>
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

            {/* Get Started Button */}
            <button className="hidden sm:inline-flex btn-primary">
              Get Started
            </button>

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
              <a
                href="#dashboard"
                className="block px-3 py-2 rounded-lg text-neutral-700 hover:text-primary-600 hover:bg-neutral-100 font-medium transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Dashboard
              </a>
              <a
                href="#calculate"
                className="block px-3 py-2 rounded-lg text-neutral-700 hover:text-primary-600 hover:bg-neutral-100 font-medium transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Calculate Zakat
              </a>
              <a
                href="#assets"
                className="block px-3 py-2 rounded-lg text-neutral-700 hover:text-primary-600 hover:bg-neutral-100 font-medium transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Manage Assets
              </a>
              <a
                href="#history"
                className="block px-3 py-2 rounded-lg text-neutral-700 hover:text-primary-600 hover:bg-neutral-100 font-medium transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                History
              </a>
              <a
                href="#help"
                className="block px-3 py-2 rounded-lg text-neutral-700 hover:text-primary-600 hover:bg-neutral-100 font-medium transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Help & Guide
              </a>
              <div className="pt-2 border-t border-neutral-200/50">
                <button
                  className="w-full btn-primary"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};