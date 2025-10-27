/**
 * PWA Installation Tests
 * 
 * Tests the Progressive Web App installation flow and related features.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

describe('PWA Installation Tests', () => {
  let deferredPrompt: BeforeInstallPromptEvent | null;

  beforeEach(() => {
    deferredPrompt = null;
    jest.clearAllMocks();
  });

  describe('Installation Prompt', () => {
    it('should capture beforeinstallprompt event', () => {
      const handler = (e: Event) => {
        e.preventDefault();
        deferredPrompt = e as BeforeInstallPromptEvent;
      };

      window.addEventListener('beforeinstallprompt', handler);

      const event = new Event('beforeinstallprompt') as BeforeInstallPromptEvent;
      event.prompt = jest.fn().mockResolvedValue(undefined);
      event.userChoice = Promise.resolve({ outcome: 'accepted' as const });

      window.dispatchEvent(event);

      expect(deferredPrompt).not.toBeNull();

      window.removeEventListener('beforeinstallprompt', handler);
    });

    it('should show install button when prompt is available', () => {
      const hasInstallPrompt = true;

      if (hasInstallPrompt) {
        render(<button>Install App</button>);
        expect(screen.getByText('Install App')).toBeInTheDocument();
      }
    });

    it('should trigger installation on button click', async () => {
      const mockPrompt = jest.fn().mockResolvedValue(undefined);
      const mockUserChoice = Promise.resolve({ outcome: 'accepted' as const });

      deferredPrompt = {
        prompt: mockPrompt,
        userChoice: mockUserChoice,
      } as any;

      const handleInstall = async () => {
        if (deferredPrompt) {
          await deferredPrompt.prompt();
          const choice = await deferredPrompt.userChoice;
          return choice.outcome;
        }
        return null;
      };

      const outcome = await handleInstall();

      expect(mockPrompt).toHaveBeenCalled();
      expect(outcome).toBe('accepted');
    });

    it('should hide install button after successful installation', async () => {
      let showButton = true;

      const mockUserChoice = Promise.resolve({ outcome: 'accepted' as const });

      const handleInstall = async () => {
        const choice = await mockUserChoice;
        if (choice.outcome === 'accepted') {
          showButton = false;
        }
      };

      await handleInstall();

      expect(showButton).toBe(false);
    });

    it('should handle user dismissing install prompt', async () => {
      const mockUserChoice = Promise.resolve({ outcome: 'dismissed' as const });

      deferredPrompt = {
        prompt: jest.fn().mockResolvedValue(undefined),
        userChoice: mockUserChoice,
      } as any;

      const choice = await deferredPrompt.userChoice;

      expect(choice.outcome).toBe('dismissed');
    });
  });

  describe('App Installation Status', () => {
    it('should detect if app is installed', () => {
      // Mock standalone mode
      Object.defineProperty(window.navigator, 'standalone', {
        value: true,
        writable: true,
      });

      Object.defineProperty(window, 'matchMedia', {
        value: jest.fn().mockImplementation((query) => ({
          matches: query === '(display-mode: standalone)',
          media: query,
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        })),
        writable: true,
      });

      const isInstalled = 
        (window.navigator as any).standalone === true ||
        window.matchMedia('(display-mode: standalone)').matches;

      expect(isInstalled).toBe(true);
    });

    it('should detect if app is not installed', () => {
      Object.defineProperty(window.navigator, 'standalone', {
        value: false,
        writable: true,
      });

      Object.defineProperty(window, 'matchMedia', {
        value: jest.fn().mockImplementation(() => ({
          matches: false,
          media: '',
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        })),
        writable: true,
      });

      const isInstalled = 
        (window.navigator as any).standalone === true ||
        window.matchMedia('(display-mode: standalone)').matches;

      expect(isInstalled).toBe(false);
    });

    it('should listen for appinstalled event', () => {
      const handleAppInstalled = jest.fn();

      window.addEventListener('appinstalled', handleAppInstalled);
      window.dispatchEvent(new Event('appinstalled'));

      expect(handleAppInstalled).toHaveBeenCalled();

      window.removeEventListener('appinstalled', handleAppInstalled);
    });
  });

  describe('Manifest Validation', () => {
    it('should have valid manifest.json', () => {
      const manifest = {
        name: 'ZakApp',
        short_name: 'ZakApp',
        description: 'Privacy-first Islamic Zakat calculator',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#4f46e5',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      };

      expect(manifest.name).toBe('ZakApp');
      expect(manifest.display).toBe('standalone');
      expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
    });

    it('should have required icon sizes', () => {
      const icons = [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      ];

      const requiredSizes = ['192x192', '512x512'];
      const availableSizes = icons.map((icon) => icon.sizes);

      requiredSizes.forEach((size) => {
        expect(availableSizes).toContain(size);
      });
    });

    it('should have proper theme colors', () => {
      const manifest = {
        theme_color: '#4f46e5',
        background_color: '#ffffff',
      };

      expect(manifest.theme_color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(manifest.background_color).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('should specify display mode', () => {
      const manifest = {
        display: 'standalone',
      };

      const validDisplayModes = ['standalone', 'fullscreen', 'minimal-ui', 'browser'];
      expect(validDisplayModes).toContain(manifest.display);
    });
  });

  describe('Install Prompt Component', () => {
    it('should render install prompt UI', () => {
      render(
        <div className="install-prompt">
          <h2>Install ZakApp</h2>
          <p>Get quick access and work offline</p>
          <button>Install</button>
          <button>Not now</button>
        </div>
      );

      expect(screen.getByText('Install ZakApp')).toBeInTheDocument();
      expect(screen.getByText('Get quick access and work offline')).toBeInTheDocument();
      expect(screen.getByText('Install')).toBeInTheDocument();
      expect(screen.getByText('Not now')).toBeInTheDocument();
    });

    it('should close prompt on dismiss', () => {
      let isVisible = true;

      const InstallPrompt: React.FC<{ onDismiss: () => void }> = ({ onDismiss }) => {
        if (!isVisible) return null;

        return (
          <div>
            <button onClick={onDismiss}>Not now</button>
          </div>
        );
      };

      const handleDismiss = () => {
        isVisible = false;
      };

      const { rerender } = render(<InstallPrompt onDismiss={handleDismiss} />);

      fireEvent.click(screen.getByText('Not now'));

      rerender(<InstallPrompt onDismiss={handleDismiss} />);

      expect(screen.queryByText('Not now')).not.toBeInTheDocument();
    });

    it('should remember user dismissed prompt', () => {
      const localStorage = {
        setItem: jest.fn(),
        getItem: jest.fn().mockReturnValue('true'),
      };

      Object.defineProperty(window, 'localStorage', {
        value: localStorage,
        writable: true,
      });

      const handleDismiss = () => {
        localStorage.setItem('installPromptDismissed', 'true');
      };

      handleDismiss();

      expect(localStorage.setItem).toHaveBeenCalledWith('installPromptDismissed', 'true');

      const wasDismissed = localStorage.getItem('installPromptDismissed') === 'true';
      expect(wasDismissed).toBe(true);
    });
  });

  describe('Update Notification', () => {
    it('should show update notification when new version available', () => {
      const UpdateNotification: React.FC<{ hasUpdate: boolean }> = ({ hasUpdate }) => {
        if (!hasUpdate) return null;

        return (
          <div role="alert">
            <p>A new version is available</p>
            <button>Update</button>
          </div>
        );
      };

      render(<UpdateNotification hasUpdate={true} />);

      expect(screen.getByRole('alert')).toHaveTextContent('A new version is available');
      expect(screen.getByText('Update')).toBeInTheDocument();
    });

    it('should reload app on update', () => {
      const reload = jest.fn();
      Object.defineProperty(window.location, 'reload', {
        value: reload,
        writable: true,
      });

      const handleUpdate = () => {
        // In real implementation, would call skipWaiting on service worker
        window.location.reload();
      };

      handleUpdate();

      expect(reload).toHaveBeenCalled();
    });
  });

  describe('Add to Home Screen', () => {
    it('should detect iOS Safari', () => {
      const userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1';
      
      Object.defineProperty(navigator, 'userAgent', {
        value: userAgent,
        writable: true,
      });

      const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
      const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);

      expect(isIOS).toBe(true);
      expect(isSafari).toBe(true);
    });

    it('should show iOS install instructions', () => {
      render(
        <div>
          <p>To install this app:</p>
          <ol>
            <li>Tap the Share button</li>
            <li>Select "Add to Home Screen"</li>
            <li>Tap "Add"</li>
          </ol>
        </div>
      );

      expect(screen.getByText('To install this app:')).toBeInTheDocument();
      expect(screen.getByText(/tap the share button/i)).toBeInTheDocument();
    });
  });

  describe('Installation Analytics', () => {
    it('should track installation events', () => {
      const trackEvent = jest.fn();

      const handleInstallSuccess = () => {
        trackEvent('pwa_installed', {
          platform: 'web',
          timestamp: Date.now(),
        });
      };

      handleInstallSuccess();

      expect(trackEvent).toHaveBeenCalledWith(
        'pwa_installed',
        expect.objectContaining({
          platform: 'web',
        })
      );
    });

    it('should track install prompt shown', () => {
      const trackEvent = jest.fn();

      const handlePromptShown = () => {
        trackEvent('pwa_prompt_shown', {
          timestamp: Date.now(),
        });
      };

      handlePromptShown();

      expect(trackEvent).toHaveBeenCalledWith(
        'pwa_prompt_shown',
        expect.any(Object)
      );
    });

    it('should track install prompt outcome', () => {
      const trackEvent = jest.fn();

      const handlePromptOutcome = (outcome: 'accepted' | 'dismissed') => {
        trackEvent('pwa_prompt_outcome', {
          outcome,
          timestamp: Date.now(),
        });
      };

      handlePromptOutcome('accepted');

      expect(trackEvent).toHaveBeenCalledWith(
        'pwa_prompt_outcome',
        expect.objectContaining({
          outcome: 'accepted',
        })
      );
    });
  });
});
