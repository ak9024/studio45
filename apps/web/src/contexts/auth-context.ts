import { createContext } from 'react';
import type { LoginRequest, RegisterRequest, LoginResponse } from '../services/auth.service';
import type { ProfileUpdateRequest } from '../services/profile.service';

export interface AuthContextType {
  user: LoginResponse['user'] | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  updateProfile: (profileData: ProfileUpdateRequest) => Promise<void>;
  logout: () => void;
  error: string | null;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);