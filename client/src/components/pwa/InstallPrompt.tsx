import React, { useState, useEffect } from 'react';
import { XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

/**
 * PWA Installation Prompt Component
 * 
 * Displays a custom install prompt when the browser's beforeinstallprompt event fires.
 * Provides better UX than the default browser install banner.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if running as TWA (Trusted Web Activity) on Android
    if (document.referrer.includes('android-app://')) {
      setIsInstalled(true);
      return;
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the default mini-infobar from appearing on mobile
      e.preventDefault();

      // Save the event for later use
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Show the custom install prompt after a short delay
      setTimeout(() => {
        // Check if user hasn't dismissed it before (using localStorage)
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        if (!dismissed) {
          setShowPrompt(true);
        }
      }, 3000); // Show after 3 seconds
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      console.log('✅ PWA installed successfully');
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);

      // Track installation analytics
      if (window.gtag) {
        window.gtag('event', 'pwa_install', {
          event_category: 'engagement',
          event_label: 'PWA Installation',
        });
      }
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Show the install prompt
    await deferredPrompt.prompt();

    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`🔔 User install choice: ${outcome}`);

    // Track user choice
    if (window.gtag) {
      window.gtag('event', 'pwa_install_prompt_response', {
        event_category: 'engagement',
        event_label: outcome,
      });
    }

    // Clear the deferred prompt
    setDeferredPrompt(null);
    setShowPrompt(false);

    if (outcome === 'accepted') {
      console.log('✅ User accepted the install prompt');
    } else {
      console.log('❌ User dismissed the install prompt');
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);

    // Remember dismissal for 7 days
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);
    localStorage.setItem('pwa-install-dismissed', expiryDate.toISOString());

    // Track dismissal
    if (window.gtag) {
      window.gtag('event', 'pwa_install_prompt_dismissed', {
        event_category: 'engagement',
      });
    }
  };

  // Don't show if already installed or no prompt available
  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-primary-100 p-5 z-50 animate-slide-up ring-1 ring-black/5">
      {/* Close button */}
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
        aria-label="Dismiss install prompt"
      >
        <XMarkIcon className="w-5 h-5" />
      </button>

      {/* Content */}
      <div className="flex items-start gap-4 mb-5">
        <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl flex items-center justify-center shadow-inner border border-primary-200/50">
          <ArrowDownTrayIcon className="w-7 h-7 text-primary-700" />
        </div>

        <div className="flex-1 pt-0.5">
          <h3 className="font-heading font-bold text-gray-900 mb-1 text-lg">
            Install ZakApp
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Get quick access to your local vault and unlock full <span className="font-medium text-primary-700">offline functionality</span>.
          </p>
        </div>
      </div>

      {/* Features */}
      <ul className="space-y-2 mb-6 text-sm text-gray-600">
        <li className="flex items-center gap-2.5">
          <div className="bg-green-100/50 p-0.5 rounded-full">
            <span className="text-green-600 text-xs font-bold px-0.5">✓</span>
          </div>
          <span>Work offline with cached data</span>
        </li>
        <li className="flex items-center gap-2.5">
          <div className="bg-green-100/50 p-0.5 rounded-full">
            <span className="text-green-600 text-xs font-bold px-0.5">✓</span>
          </div>
          <span>Instant loading (no wait times)</span>
        </li>
        <li className="flex items-center gap-2.5">
          <div className="bg-green-100/50 p-0.5 rounded-full">
            <span className="text-green-600 text-xs font-bold px-0.5">✓</span>
          </div>
          <span>Secure home screen access</span>
        </li>
      </ul>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleInstallClick}
          className="flex-1 px-4 py-2.5 bg-primary-700 text-white font-medium rounded-lg hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all shadow-md shadow-primary-700/20 hover:scale-[1.02]"
        >
          Install App
        </button>

        <button
          onClick={handleDismiss}
          className="px-4 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2 transition-colors"
        >
          Not Now
        </button>
      </div>
    </div>
  );
};

// Add to global Window interface for TypeScript
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export default InstallPrompt;
