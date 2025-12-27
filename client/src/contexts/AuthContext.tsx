import React, { createContext, useContext, useEffect, useReducer } from 'react';
import toast from 'react-hot-toast';
import type { User } from '../types';
import { getDb, resetDb, closeDb, forceResetDatabase } from '../db';
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

            // Initialize DB with the restored key so components can access data
            const keyString = await cryptoService.exportKeyString();
            console.log('AuthContext: Session restored. Key generated (len=' + keyString.length + ')');

            try {
              await getDb(keyString);
              console.log('AuthContext: DB opened successfully with restored key');
              dispatch({ type: 'LOGIN_SUCCESS', payload: user });
            } catch (dbError: any) {
              console.error('AuthContext: DB Open Failed during restore', dbError);

              // Handle Password Mismatch (DB1) - Nuclear Option
              if (dbError?.code === 'DB1' || (dbError?.message && dbError.message.includes('different password'))) {
                console.warn('AuthContext: Pasword mismatch detected (DB1). Nuking local DB to recover...');
                toast.loading('Resetting local database due to security update...', { duration: 3000 });

                // Force delete the old DB
                await forceResetDatabase();

                // Re-initialize with correct key
                await getDb(keyString);
                console.log('AuthContext: DB Re-initialized after nuke.');

                dispatch({ type: 'LOGIN_SUCCESS', payload: user });
              } else {
                throw new Error('Database Open Failed: ' + (dbError instanceof Error ? dbError.message : String(dbError)));
              }
            }
          }
        }
      } catch (error) {
        console.error('AuthContext: Session restore failed', error);
        const errorMsg = error instanceof Error ? error.message : String(error);
        toast.error('Session Restore Failed: ' + errorMsg);
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

      // Use the REAL user ID from the backend to lookup local settings
      const backendUserId = apiResult.user.id;
      let userDoc = await db.user_settings.findOne(backendUserId).exec();

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
        const remoteProfile = apiResult.user.profile as any;

        if (remoteProfile && remoteProfile.salt) {
          salt = remoteProfile.salt;
          console.log('Fresh Device Login: Retrieved salt from backend');
        } else {
          // Check if we can fallback to the DEFAULT/STATIC local user profile for data migration?
          // For now, assume fresh sync.
          if (apiResult.user.profile?.salt) {
            salt = apiResult.user.profile.salt;
          } else {
            throw new Error('Account sync unavailable: Security salt missing from server.');
          }
        }
      }

      // 2. Derive Key
      console.log('AuthContext: Deriving key...');
      await cryptoService.deriveKey(password, salt);
      console.log('AuthContext: Key derived successfully');

      // 3. Initialize DB with Correct Key (Key String, not Password)
      const keyString = await cryptoService.exportKeyString();
      let encryptedDb;

      try {
        encryptedDb = await getDb(keyString);
      } catch (dbError: any) {
        console.error('AuthContext: DB Open Failed during login', dbError);

        // Handle Password Mismatch (DB1) - Nuclear Option
        if (dbError?.code === 'DB1' || (dbError?.message && dbError.message.includes('different password'))) {
          console.warn('AuthContext: Password mismatch detected (DB1) during Login. Nuking local DB to recover...');
          toast.loading('Resetting local database due to security update...', { duration: 3000 });

          // Force delete the old DB
          await forceResetDatabase();

          // Re-initialize with correct key
          encryptedDb = await getDb(keyString);
          console.log('AuthContext: DB Re-initialized after nuke (Login).');
        } else {
          throw dbError;
        }
      }

      // If Scenario B (Fresh Device), create the local user record now
      if (!userDoc) {
        // We need to re-fetch the collection if we nuked the DB, as previous 'db' instance might be stale/closed?
        // simple `encryptedDb` reference should be good.
        await encryptedDb.user_settings.insert({
          id: backendUserId, // Use Real Backend ID
          profileName: apiResult.user.username || 'My Profile',
          email: apiResult.user.email || 'local@device',
          isSetupCompleted: true,
          securityProfile: {
            salt: salt,
            verifier: 'TODO-HASH-OF-KEY'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        userDoc = await encryptedDb.user_settings.findOne(backendUserId).exec();
      }

      const user: User = {
        id: userDoc.get('id'),
        username: userDoc.get('profileName') || 'Local User',
        email: userDoc.get('email') || 'local@device',
        firstName: '',
        lastName: '',
      };

      // 2. Persist Session (Key + User) -> SessionStorage
      const jwk = await cryptoService.exportSessionKey();
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ user, jwk }));

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

      if (!apiResult.user || !apiResult.user.id) {
        throw new Error('Registration successful but user ID missing from response');
      }

      const newUserId = apiResult.user.id;

      // 3. Initialize Database with Encryption Key (Derived Key String)
      const keyString = await cryptoService.exportKeyString();

      // Ensure we start with a clean slate (nuke any existing DB leftovers)
      // resetDb() only works if DB is open, so we use forceResetDatabase()
      await forceResetDatabase();

      await getDb(keyString);

      // 4. Create User Profile
      const encryptedDb = await getDb();

      await encryptedDb.user_settings.insert({
        id: newUserId, // Use Real Backend ID
        profileName: userData.username || 'My Profile',
        email: userData.email,
        isSetupCompleted: true,
        securityProfile: {
          salt: salt,
          verifier: 'TODO-HASH-OF-KEY'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      const user: User = {
        id: newUserId,
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