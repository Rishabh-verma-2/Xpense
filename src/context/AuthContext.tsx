import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { secureStorage } from '../storage/secureStorage';
import { authApi } from '../services/api';
import { signInWithGoogleAndFirebase } from '../services/googleAuthService';

export interface UserProfile {
  id: string;
  email: string;
  phoneNumber?: string;
  name: string;
  currency: string;
  avatar?: string;
  createdAt?: string;
}

interface AuthContextValue {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (name: string, email: string, phone: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<UserProfile>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUserProfileName: (name: string) => Promise<void>;
  updateAvatar: (base64OrUrl: string) => Promise<string>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const TOKEN_KEY = 'xpense_token';
const USER_KEY = 'xpense_user';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore stored session on mount
  useEffect(() => {
    (async () => {
      try {
        const storedToken = await secureStorage.getItem(TOKEN_KEY);
        const storedUserJson = await secureStorage.getItem(USER_KEY);

        let parsedUser: UserProfile | null = null;
        if (storedUserJson) {
          try {
            parsedUser = JSON.parse(storedUserJson);
            setUser(parsedUser);
          } catch {
            // invalid json
          }
        }

        if (storedToken) {
          setToken(storedToken);

          // Verify token and sync latest user profile from backend
          try {
            const res = await authApi.me();
            if (res.success && res.data) {
              const backendUser = res.data;
              // Preserve local avatar if backend returned empty but local has one
              const mergedUser: UserProfile = {
                ...parsedUser,
                ...backendUser,
                avatar: backendUser.avatar || parsedUser?.avatar || '',
              };
              setUser(mergedUser);
              await secureStorage.setItem(USER_KEY, JSON.stringify(mergedUser));
            }
          } catch (e) {
            console.log('Session verification failed, using cached user if available');
          }
        }
      } catch (err) {
        console.error('Error restoring auth state', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    const res = await authApi.login({ identifier, password });
    if (res.success && res.data) {
      const { user: userData, token: jwtToken } = res.data;
      setUser(userData);
      setToken(jwtToken);
      await secureStorage.setItem(TOKEN_KEY, jwtToken);
      await secureStorage.setItem(USER_KEY, JSON.stringify(userData));
    } else {
      throw new Error(res.message || 'Login failed');
    }
  }, []);

  const register = useCallback(async (name: string, email: string, phone: string, password: string) => {
    const res = await authApi.register({ name, email, phone, password });
    if (res.success && res.data) {
      const { user: userData, token: jwtToken } = res.data;
      setUser(userData);
      setToken(jwtToken);
      await secureStorage.setItem(TOKEN_KEY, jwtToken);
      await secureStorage.setItem(USER_KEY, JSON.stringify(userData));
    } else {
      throw new Error(res.message || 'Registration failed');
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    // 1. Open Google Account Picker -> Get ID Token -> Create Firebase Credential -> Firebase Sign-in -> Save to AsyncStorage
    const session = await signInWithGoogleAndFirebase();

    // 2. Sync session with MongoDB Atlas Backend
    try {
      const res = await authApi.googleAuth({
        idToken: session.idToken,
        accessToken: session.accessToken,
        email: session.email,
        name: session.name,
      });

      if (res.success && res.data) {
        const { user: userData, token: jwtToken } = res.data;
        setUser(userData);
        setToken(jwtToken);
        await secureStorage.setItem(TOKEN_KEY, jwtToken);
        await secureStorage.setItem(USER_KEY, JSON.stringify(userData));
        return userData;
      }
    } catch (e) {
      console.warn('⚠️ MongoDB Atlas sync warning, using Firebase session local user:', e);
    }

    // Local fallback user profile from Firebase session
    const firebaseUserProfile: UserProfile = {
      id: session.uid,
      email: session.email,
      name: session.name,
      currency: 'INR',
    };

    setUser(firebaseUserProfile);
    setToken(`fb_token_${session.uid}`);
    await secureStorage.setItem(TOKEN_KEY, `fb_token_${session.uid}`);
    await secureStorage.setItem(USER_KEY, JSON.stringify(firebaseUserProfile));
    return firebaseUserProfile;
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    setToken(null);
    try {
      await secureStorage.deleteItem(TOKEN_KEY);
      await secureStorage.deleteItem(USER_KEY);
    } catch (e) {
      console.error('Error clearing secure store on logout', e);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await authApi.me();
      if (res.success && res.data) {
        setUser((prev) => {
          const merged: UserProfile = {
            ...prev,
            ...res.data,
            avatar: res.data.avatar || prev?.avatar || '',
          };
          secureStorage.setItem(USER_KEY, JSON.stringify(merged)).catch(console.error);
          return merged;
        });
      }
    } catch (e) {
      console.error('Failed to refresh user profile', e);
    }
  }, []);

  const updateUserProfileName = useCallback(async (newName: string) => {
    setUser((prev) => {
      if (!prev) return null;
      const updatedUser = { ...prev, name: newName };
      secureStorage.setItem(USER_KEY, JSON.stringify(updatedUser)).catch(console.error);
      return updatedUser;
    });

    try {
      await authApi.updateProfile({ name: newName });
    } catch (e) {
      console.warn('Backend name sync warning:', e);
    }
  }, []);

  const updateAvatar = useCallback(async (base64OrUrl: string) => {
    let finalAvatarUrl = base64OrUrl;

    try {
      const res = await authApi.uploadAvatar({ imageBase64: base64OrUrl });
      if (res.success && res.data?.avatar !== undefined) {
        finalAvatarUrl = res.data.avatar;
      }
    } catch (e: any) {
      console.warn('Remote avatar upload fallback to local URI:', e?.message || e);
    }

    setUser((prev) => {
      if (!prev) return null;
      const updatedUser = { ...prev, avatar: finalAvatarUrl };
      secureStorage.setItem(USER_KEY, JSON.stringify(updatedUser)).catch(console.error);
      return updatedUser;
    });

    return finalAvatarUrl;
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    const res = await authApi.changePassword({ currentPassword, newPassword });
    if (!res.success) {
      throw new Error(res.message || 'Failed to update password');
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        loginWithGoogle,
        logout,
        refreshUser,
        updateUserProfileName,
        updateAvatar,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
