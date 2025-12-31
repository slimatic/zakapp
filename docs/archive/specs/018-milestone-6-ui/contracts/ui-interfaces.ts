// UI Interfaces for Milestone 6

export type ToastType = 'success' | 'error' | 'loading' | 'custom';

export interface ToastOptions {
  duration?: number;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  icon?: string;
}

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  options?: ToastOptions;
}

export interface PWAInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}
