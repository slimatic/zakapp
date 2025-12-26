/**
 * Push Notifications Utility
 * 
 * Handles push notification subscription, permission requests,
 * and notification display for Zakat reminders.
 */

/**
 * Check if notifications are supported
 */
export function isNotificationSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Request notification permission from user
 * @returns Promise resolving to permission status
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    console.warn('⚠️ Notifications not supported in this browser');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    console.warn('⚠️ Notification permission denied');
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    console.log(`🔔 Notification permission: ${permission}`);
    return permission;
  } catch (error) {
    console.error('❌ Failed to request notification permission:', error);
    return 'denied';
  }
}

/**
 * Subscribe to push notifications
 * @param vapidPublicKey - VAPID public key from server
 */
export async function subscribeToPushNotifications(
  vapidPublicKey: string
): Promise<PushSubscription | null> {
  try {
    if (!isNotificationSupported()) {
      throw new Error('Push notifications not supported');
    }

    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    const registration = await navigator.serviceWorker.ready;

    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Subscribe to push notifications
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as BufferSource,
      });

      console.log('✅ Subscribed to push notifications');
    } else {
      console.log('✅ Already subscribed to push notifications');
    }

    return subscription;
  } catch (error) {
    console.error('❌ Failed to subscribe to push notifications:', error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  try {
    if (!isNotificationSupported()) {
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      console.log('✅ Unsubscribed from push notifications');
      return true;
    }

    return false;
  } catch (error) {
    console.error('❌ Failed to unsubscribe from push notifications:', error);
    return false;
  }
}

/**
 * Display a local notification
 */
export async function showNotification(
  title: string,
  options?: NotificationOptions
): Promise<void> {
  try {
    if (!isNotificationSupported()) {
      throw new Error('Notifications not supported');
    }

    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    const registration = await navigator.serviceWorker.ready;

    await registration.showNotification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      ...options,
    } as any); // TypeScript strict mode - notification actions are experimental

    console.log('✅ Notification displayed:', title);
  } catch (error) {
    console.error('❌ Failed to show notification:', error);
  }
}

/**
 * Show Zakat reminder notification
 */
export async function showZakatReminder(message: string): Promise<void> {
  await showNotification('Zakat Reminder', {
    body: message,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'zakat-reminder',
    requireInteraction: true,
    actions: [
      {
        action: 'calculate',
        title: 'Calculate Now',
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
      },
    ],
    data: {
      url: '/zakat/calculator',
    },
  } as any);
}

/**
 * Show asset update reminder notification
 */
export async function showAssetUpdateReminder(daysUntilZakat: number): Promise<void> {
  await showNotification('Update Your Assets', {
    body: `${daysUntilZakat} days until your Zakat due date. Update your assets to get an accurate calculation.`,
    icon: '/icons/icon-192x192.png',
    tag: 'asset-update',
    actions: [
      {
        action: 'update',
        title: 'Update Assets',
      },
      {
        action: 'dismiss',
        title: 'Later',
      },
    ],
    data: {
      url: '/assets',
    },
  } as any);
}

/**
 * Handle notification click events
 */
export function setupNotificationHandlers(): void {
  if (!isNotificationSupported()) {
    return;
  }

  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
      const { action, url } = event.data;

      if (action === 'calculate' || action === 'update') {
        window.location.href = url;
      }

      console.log('🔔 Notification clicked:', action);
    }
  });
}

/**
 * Convert VAPID key from base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Schedule Zakat reminder notification
 * @param daysBeforeDue - Number of days before Zakat is due
 */
export function scheduleZakatReminder(daysBeforeDue: number): void {
  // This would typically be handled by the server sending push notifications
  // For now, we'll use a simple setTimeout for demo purposes

  const millisecondsUntilReminder = daysBeforeDue * 24 * 60 * 60 * 1000;

  if (millisecondsUntilReminder > 0 && millisecondsUntilReminder < 30 * 24 * 60 * 60 * 1000) {
    setTimeout(() => {
      showZakatReminder(
        `Your Zakat calculation is due in ${daysBeforeDue} days. Don't forget to update your assets!`
      );
    }, millisecondsUntilReminder);

    console.log(`⏰ Zakat reminder scheduled for ${daysBeforeDue} days from now`);
  }
}
