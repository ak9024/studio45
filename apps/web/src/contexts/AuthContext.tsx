import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { authService, ApiError } from '../services/auth.service';
import type { LoginRequest, RegisterRequest, LoginResponse } from '../services/auth.service';
import { profileService } from '../services/profile.service';
import type { ProfileUpdateRequest } from '../services/profile.service';
import { AuthContext } from './auth-context';
import type { AuthContextType } from './auth-context';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<LoginResponse['user'] | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeAuth = () => {
      const storedToken = authService.getStoredToken();
      const storedUser = authService.getStoredUser();

      if (storedToken && authService.isAuthenticated()) {
        setToken(storedToken);
        setUser(storedUser);
      } else {
        authService.removeToken();
      }

      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginRequest) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await authService.login(credentials);
      
      // Fetch full profile after successful login
      const profile = await profileService.getProfile(response.token);
      
      // Store token and full profile data
      authService.storeToken(response.token);
      authService.storeUser(profile);
      
      setToken(response.token);
      setUser(profile);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterRequest) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await authService.register(userData);
      
      // Fetch full profile after successful registration
      const profile = await profileService.getProfile(response.token);
      
      // Store token and full profile data
      authService.storeToken(response.token);
      authService.storeUser(profile);
      
      setToken(response.token);
      setUser(profile);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.removeToken();
    setToken(null);
    setUser(null);
    setError(null);
  };

  const updateProfile = async (profileData: ProfileUpdateRequest) => {
    if (!token) {
      throw new Error('No authentication token available');
    }

    try {
      setIsLoading(true);
      setError(null);

      const updatedProfile = await profileService.updateProfile(token, profileData);
      
      // Update stored user data and state
      authService.storeUser(updatedProfile);
      setUser(updatedProfile);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const hasRole = (role: string): boolean => {
    return user?.roles?.includes(role) ?? false;
  };

  const hasAnyRole = (roles: string[]): boolean => {
    if (!user?.roles) return false;
    return roles.some(role => user.roles.includes(role));
  };

  const hasAllRoles = (roles: string[]): boolean => {
    if (!user?.roles) return false;
    return roles.every(role => user.roles.includes(role));
  };

  const isAdmin = hasRole('admin');

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token && !!user,
    login,
    register,
    updateProfile,
    logout,
    error,
    clearError,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

