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
