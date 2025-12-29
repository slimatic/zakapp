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

/**
 * Privacy Context
 * 
 * Global privacy mode management for hiding sensitive financial data
 * Persists preference to localStorage for consistent experience
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface PrivacyContextType {
  privacyMode: boolean;
  togglePrivacyMode: () => void;
  setPrivacyMode: (enabled: boolean) => void;
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined);

const STORAGE_KEY = 'zakapp_privacy_mode';

interface PrivacyProviderProps {
  children: ReactNode;
}

export const PrivacyProvider: React.FC<PrivacyProviderProps> = ({ children }) => {
  // Initialize from localStorage, default to false (privacy off)
  const [privacyMode, setPrivacyModeState] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === 'true';
    } catch {
      return false;
    }
  });

  // Persist to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(privacyMode));
    } catch (error) {
      console.warn('Failed to persist privacy mode:', error);
    }
  }, [privacyMode]);

  const togglePrivacyMode = () => {
    setPrivacyModeState(prev => !prev);
  };

  const setPrivacyMode = (enabled: boolean) => {
    setPrivacyModeState(enabled);
  };

  return (
    <PrivacyContext.Provider value={{ privacyMode, togglePrivacyMode, setPrivacyMode }}>
      {children}
    </PrivacyContext.Provider>
  );
};

/**
 * Hook to access privacy mode state
 */
export const usePrivacy = (): PrivacyContextType => {
  const context = useContext(PrivacyContext);
  if (!context) {
    throw new Error('usePrivacy must be used within a PrivacyProvider');
  }
  return context;
};

/**
 * Hook to get masked currency value based on privacy mode
 */
export const useMaskedCurrency = () => {
  const { privacyMode } = usePrivacy();
  
  return (value: string): string => {
    if (!privacyMode) return value;
    // Replace all digits with bullets, keep currency symbols and formatting
    return value.replace(/\d/g, '•');
  };
};
