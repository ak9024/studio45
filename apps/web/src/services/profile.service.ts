export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  company: string | null;
  roles: string[];
  created_at: string;
  updated_at: string;
}

export interface ProfileUpdateRequest {
  name?: string;
  phone?: string | null;
  company?: string | null;
  roles?: string[];
}

import { ApiError } from './auth.service';

const API_BASE_URL = import.meta.env.VITE_API_HOST || 'http://localhost:8080/api/v1';

class ProfileService {
  async getProfile(token: string): Promise<UserProfile> {
    try {
      const response = await fetch(`${API_BASE_URL}/protected/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.error || errorData.message || 'Failed to fetch profile',
          response.status
        );
      }

      const profile: UserProfile = await response.json();
      return profile;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(
        'Network error. Please check your connection.',
        0
      );
    }
  }

  async updateProfile(token: string, profileData: ProfileUpdateRequest): Promise<UserProfile> {
    try {
      const response = await fetch(`${API_BASE_URL}/protected/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.error || errorData.message || 'Failed to update profile',
          response.status
        );
      }

      const updatedProfile: UserProfile = await response.json();
      return updatedProfile;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(
        'Network error. Please check your connection.',
        0
      );
    }
  }
}

export const profileService = new ProfileService();