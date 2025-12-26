import React, { createContext, useContext, useEffect, useReducer } from 'react';
import toast from 'react-hot-toast';
import type { User } from '../types';
import { getDb, resetDb, closeDb } from '../db';
import { cryptoService } from '../services/CryptoService';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'CLEAR_ERROR' };

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: any) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

const LOCAL_USER_ID = 'local-user-profile';

const SESSION_STORAGE_KEY = 'zakapp_session_v1';

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Restore session from sessionStorage on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedSession = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (storedSession) {
          console.log('AuthContext: Found stored session, attempting restore...');
          const { user, jwk } = JSON.parse(storedSession);

          if (user && jwk) {
            await cryptoService.restoreSessionKey(jwk);
            dispatch({ type: 'LOGIN_SUCCESS', payload: user });
          }
        }
      } catch (error) {
        console.error('AuthContext: Session restore failed', error);
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    restoreSession();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    console.log('AuthContext: Attempting login for', email);
    dispatch({ type: 'LOGIN_START' });
    try {
      // 1. Authenticate with Backend API First
      const { apiService: api } = await import('../services/api');
      const apiResult = await api.login({ email, password });

      if (!apiResult.success || !apiResult.user) {
        throw new Error(apiResult.message || 'Login failed');
      }

      // Check if we have a local user ID (for offline support)
      // Open DB tentatively (might need password if not open, but we don't have key yet?)
      // Actually we just want to know if it exists. getDb() without password might fail if it's encrypted?
      // But we need to use CloseDb first to ensure we aren't using a stale connection.
      await closeDb();
      const db = await getDb(password); // Try opening with password immediately?
      // Wait, we haven't derived the key yet! We can't use `password` as key directly if we use PBKDF2 in cryptoService.
      // But RxDB adapter uses `password` passed to it. AND our `index.ts` does NOT derive key, it expects valid key.
      // Wait. `cryptoService.deriveKey` sets the GLOBAL key for the app logic (encryption-crypto-js wrapper?).
      // In `db/index.ts`, `wrappedKeyEncryptionCryptoJsStorage` is used.
      // It usually grabs the key from the `password` field passed to `createRxDatabase`.
      // BUT `cryptoService` manages the actual Cryptography logic for fields?
      // Let's stick to the existing flow:

      // We need the SALT locally to derive the key.
      // But we can't read the SALT from the DB if the DB is encrypted and we don't have the key!
      // Catch-22?
      // No, `user_settings` schema usually has `salt` as potentially unencrypted or we use a global predictable key for the meta-doc?
      // Or we rely on API to give us the salt (Scenario B).

      // Let's assume we rely on API for salt OR the DB is accessible enough to read the user doc.
      // If we used `resetDb` before, we wiped it. So we ALWAYS used API salt.
      // NOW, we want to use Local Salt if available.

      let userDoc = await db.user_settings.findOne(LOCAL_USER_ID).exec(); // This might fail if key is wrong?

      let salt: string;

      // Scenario A: Local User Exists (Offline or Sync)
      if (userDoc) {
        const security = userDoc.get('securityProfile');
        if (!security || !security.salt) {
          // Fallback: Try to use backend salt if local is corrupted?
          if (apiResult.user.profile?.salt) {
            salt = apiResult.user.profile.salt;
            console.log('Using backend salt for corrupted local profile');
          } else {
            throw new Error('User profile corrupted. No security data and no backend salt.');
          }
        } else {
          salt = security.salt;
        }
      }
      // Scenario B: Fresh Device (No local user)
      else {
        // We MUST rely on the backend providing the salt
        // user.profile is typed as generic object-like in API response
        // apiResult.user.profile.salt should exist if registered with new flow
        const remoteProfile = apiResult.user.profile as any;

        if (remoteProfile && remoteProfile.salt) {
          salt = remoteProfile.salt;
          console.log('Fresh Device Login: Retrieved salt from backend');
        } else {
          throw new Error('Account sync unavailable: Security salt missing from server. Please export/import your key manually.');
        }
      }

      // 2. Derive Key
      console.log('AuthContext: Deriving key...');
      await cryptoService.deriveKey(password, salt);
      console.log('AuthContext: Key derived successfully');

      // 3. Initialize DB with Correct Key
      // We opened it tentatively above. Now we ensure it's open with the derived key logic (if cryptoService affects it).
      // Actually `getDb(password)` passes the password to RxDB.
      // If `cryptoService.deriveKey` is what actually sets the encryption key for the plugin...
      // We should close and re-open to be sure.
      await closeDb();
      await getDb(password);
      const encryptedDb = await getDb();

      // If Scenario B (Fresh Device), create the local user record now
      if (!userDoc) {
        await encryptedDb.user_settings.insert({
          id: LOCAL_USER_ID,
          profileName: apiResult.user.username || 'My Profile',
          isSetupCompleted: true,
          securityProfile: {
            salt: salt,
            verifier: 'TODO-HASH-OF-KEY'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        userDoc = await encryptedDb.user_settings.findOne(LOCAL_USER_ID).exec();
      }

      const user: User = {
        id: userDoc.get('id'),
        username: userDoc.get('profileName') || 'Local User',
        email: 'local@device', // Placeholder
        firstName: '',
        lastName: '',
      };

      // 2. Persist Session (Key + User) -> SessionStorage
      const jwk = await cryptoService.exportSessionKey();
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ user, jwk }));

      // 3. Ensure DB remains open
      // Use the password directly as the encryption key
      await closeDb(); // Ensure clean slate
      await getDb(password);

      console.log('AuthContext: Dispatching LOGIN_SUCCESS');
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
      return true;

    } catch (error) {
      console.error('AuthContext: Login error', error);
      dispatch({ type: 'LOGIN_FAILURE', payload: error instanceof Error ? error.message : 'Login failed' });
      return false;
    }
  };

  const register = async (userData: any): Promise<boolean> => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const db = await getDb();

      // Check if already exists
      const existing = await db.user_settings.findOne(LOCAL_USER_ID).exec();
      if (existing) {
        console.warn('AuthContext: Overwriting existing local user.');
        await existing.remove();
      }

      // 1. Generate Security Params
      const salt = (await import('../services/CryptoService')).CryptoService.generateSalt();

      // 2. Derive Key immediately
      await cryptoService.deriveKey(userData.password, salt);

      // Register with backend, passing the salt
      const { apiService: api } = await import('../services/api');
      const apiResult = await api.register({
        ...userData,
        salt: salt // Send salt to backend for multi-device sync
      });

      if (!apiResult.success) {
        throw new Error(apiResult.message);
      }

      // 3. Initialize Database with Encryption Key
      // We must reset if it was opened without password pending registration
      // For registration, we WANT to wipe old data to be safe.
      await resetDb();
      await getDb(userData.password);

      // 4. Create User Profile
      // Now that DB is open with password, we can insert.
      const encryptedDb = await getDb(); // Gets the already opened instance

      await encryptedDb.user_settings.insert({
        id: LOCAL_USER_ID,
        profileName: userData.username || 'My Profile',
        isSetupCompleted: true,
        securityProfile: {
          salt: salt,
          verifier: 'TODO-HASH-OF-KEY' // Future enhancement
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      const user: User = {
        id: LOCAL_USER_ID,
        username: userData.username,
        email: userData.email,
        firstName: '',
        lastName: ''
      };

      // 4. Persist Session
      const jwk = await cryptoService.exportSessionKey();
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ user, jwk }));

      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
      return true;
    } catch (error) {
      console.error('REGISTRATION ERROR:', error);
      alert('REGISTRATION ERROR: ' + (error instanceof Error ? error.message : String(error)));
      toast.error('Registration failed');
      dispatch({ type: 'LOGIN_FAILURE', payload: error instanceof Error ? error.message : 'Registration failed' });
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      cryptoService.clearSession();
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      await closeDb(); // Close connection but keep data!
    } finally {
      dispatch({ type: 'LOGOUT' });
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};