/**
 * Background Sync Utility
 * 
 * Handles queuing failed API requests and syncing when connection is restored.
 * Uses IndexedDB to persist pending requests across sessions.
 */

// Type declarations for Background Sync API
interface SyncManager {
  getTags(): Promise<string[]>;
  register(tag: string): Promise<void>;
}

interface ServiceWorkerRegistration {
  readonly sync: SyncManager;
}

interface PendingRequest {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: any;
  timestamp: number;
  retryCount: number;
}

const DB_NAME = 'zakapp-sync';
const DB_VERSION = 1;
const STORE_NAME = 'pending-requests';
const MAX_RETRIES = 3;

/**
 * Initialize IndexedDB for storing pending requests
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        objectStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

/**
 * Queue a failed request for background sync
 * @param url - Request URL
 * @param options - Fetch options (method, headers, body)
 */
export async function queueRequest(
  url: string,
  options: RequestInit
): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const pendingRequest: PendingRequest = {
      id: `${Date.now()}-${Math.random()}`,
      url,
      method: options.method || 'GET',
      headers: (options.headers as Record<string, string>) || {},
      body: options.body ? JSON.parse(options.body as string) : undefined,
      timestamp: Date.now(),
      retryCount: 0,
    };

    store.add(pendingRequest);

    await new Promise((resolve, reject) => {
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    });

    console.log('📥 Request queued for background sync:', url);

    // Register background sync if supported
    if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('sync-requests');
      console.log('🔄 Background sync registered');
    }
  } catch (error) {
    console.error('❌ Failed to queue request:', error);
    throw error;
  }
}

/**
 * Get all pending requests from IndexedDB
 */
export async function getPendingRequests(): Promise<PendingRequest[]> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('❌ Failed to get pending requests:', error);
    return [];
  }
}

/**
 * Sync all pending requests
 * Called when connection is restored
 */
export async function syncPendingRequests(): Promise<void> {
  const pendingRequests = await getPendingRequests();

  if (pendingRequests.length === 0) {
    console.log('✅ No pending requests to sync');
    return;
  }

  console.log(`🔄 Syncing ${pendingRequests.length} pending requests...`);

  for (const request of pendingRequests) {
    try {
      // Attempt to send the request
      const response = await fetch(request.url, {
        method: request.method,
        headers: request.headers,
        body: request.body ? JSON.stringify(request.body) : undefined,
      });

      if (response.ok) {
        // Request succeeded - remove from queue
        await removePendingRequest(request.id);
        console.log(`✅ Synced request: ${request.url}`);
      } else {
        // Request failed - increment retry count
        await incrementRetryCount(request.id);
        
        if (request.retryCount >= MAX_RETRIES) {
          // Max retries exceeded - remove and log error
          await removePendingRequest(request.id);
          console.error(`❌ Max retries exceeded for: ${request.url}`);
        }
      }
    } catch (error) {
      // Network error - increment retry count
      await incrementRetryCount(request.id);
      console.error(`❌ Failed to sync request: ${request.url}`, error);
    }
  }

  console.log('✅ Background sync complete');
}

/**
 * Remove a pending request from IndexedDB
 */
async function removePendingRequest(id: string): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    store.delete(id);

    await new Promise((resolve, reject) => {
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error('❌ Failed to remove pending request:', error);
  }
}

/**
 * Increment retry count for a pending request
 */
async function incrementRetryCount(id: string): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const request = store.get(id);
    request.onsuccess = () => {
      const data = request.result;
      if (data) {
        data.retryCount += 1;
        store.put(data);
      }
    };

    await new Promise((resolve, reject) => {
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error('❌ Failed to increment retry count:', error);
  }
}

/**
 * Clear all pending requests
 * Useful for testing or manual cleanup
 */
export async function clearPendingRequests(): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    store.clear();

    await new Promise((resolve, reject) => {
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    });

    console.log('✅ All pending requests cleared');
  } catch (error) {
    console.error('❌ Failed to clear pending requests:', error);
  }
}

/**
 * Monitor online/offline status and trigger sync when online
 */
export function initializeBackgroundSync(): void {
  // Sync when coming back online
  window.addEventListener('online', () => {
    console.log('🌐 Connection restored - syncing pending requests...');
    syncPendingRequests();
  });

  // Log when going offline
  window.addEventListener('offline', () => {
    console.log('⚠️ Connection lost - requests will be queued');
  });

  // Sync on page load if online
  if (navigator.onLine) {
    syncPendingRequests();
  }
}

/**
 * Enhanced fetch wrapper that automatically queues failed requests
 */
export async function fetchWithSync(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok && !navigator.onLine) {
      // Queue request if offline
      await queueRequest(url, options);
      throw new Error('Offline - request queued for sync');
    }
    
    return response;
  } catch (error) {
    if (!navigator.onLine) {
      // Queue request if offline
      await queueRequest(url, options);
      throw new Error('Offline - request queued for sync');
    }
    
    throw error;
  }
}
