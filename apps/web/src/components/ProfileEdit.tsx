import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { useAuth } from '../hooks/useAuth';
import type { ProfileUpdateRequest } from '../services/profile.service';

interface ProfileEditProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface FormErrors {
  name?: string;
  phone?: string;
  company?: string;
}

interface FormState {
  name: string;
  phone: string;
  company: string;
}

const formatPhoneNumber = (value: string): string => {
  const phoneRegex = /[^\d]/g;
  const phone = value.replace(phoneRegex, '');
  const phoneLength = phone.length;
  
  if (phoneLength < 4) return phone;
  if (phoneLength < 7) {
    return `(${phone.slice(0, 3)}) ${phone.slice(3)}`;
  }
  return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6, 10)}`;
};

export const ProfileEdit = ({ onClose, onSuccess }: ProfileEditProps) => {
  const { user, updateProfile, isLoading, error } = useAuth();
  const [formData, setFormData] = useState<FormState>({
    name: user?.name || '',
    phone: user?.phone || '',
    company: user?.company || '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const initialFormData = {
    name: user?.name || '',
    phone: user?.phone || '',
    company: user?.company || '',
  };

  useEffect(() => {
    // Focus on first input when modal opens
    nameInputRef.current?.focus();

    // Handle escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    // Handle save shortcut
    const handleSave = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSubmit(e as any);
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('keydown', handleSave);
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleSave);
    };
  }, []);

  useEffect(() => {
    // Check if form is dirty
    const hasChanges = 
      formData.name !== initialFormData.name ||
      formData.phone !== initialFormData.phone ||
      formData.company !== initialFormData.company;
    
    setIsDirty(hasChanges);
  }, [formData, initialFormData]);

  const handleInputChange = (field: keyof FormState, value: string) => {
    let processedValue = value;
    
    // Format phone number as user types
    if (field === 'phone') {
      processedValue = formatPhoneNumber(value);
    }
    
    setFormData(prev => ({ ...prev, [field]: processedValue }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Name must be less than 100 characters';
    }

    // Phone validation
    if (formData.phone?.trim()) {
      const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$|^\d{10}$/;
      const cleanPhone = formData.phone.replace(/[^\d]/g, '');
      if (!phoneRegex.test(formData.phone) && cleanPhone.length !== 10) {
        newErrors.phone = 'Please enter a valid 10-digit phone number';
      }
    }

    // Company validation
    if (formData.company && formData.company.trim().length > 255) {
      newErrors.company = 'Company name must be less than 255 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleClose = () => {
    if (isDirty && !showUnsavedWarning) {
      setShowUnsavedWarning(true);
      return;
    }
    onClose();
  };

  const handleConfirmClose = () => {
    setShowUnsavedWarning(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // Only send fields that have changed
      const updates: ProfileUpdateRequest = {};
      if (formData.name !== user?.name) updates.name = formData.name.trim();
      if (formData.phone !== user?.phone) {
        updates.phone = formData.phone.trim() || null;
      }
      if (formData.company !== user?.company) {
        updates.company = formData.company.trim() || null;
      }

      // If no changes, close the form
      if (Object.keys(updates).length === 0) {
        onClose();
        return;
      }

      await updateProfile(updates);
      setShowSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (error) {
      // Error is handled by the AuthContext
    }
  };

  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Success Animation Overlay */}
          {showSuccess && (
            <div className="absolute inset-0 bg-green-50 dark:bg-green-900/50 rounded-2xl flex items-center justify-center z-10">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-lg font-semibold text-green-800 dark:text-green-200">Profile Updated!</p>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-6 rounded-t-2xl">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Edit Profile
                  </h2>
                  <p className="text-blue-100 text-sm">
                    Update your personal information
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {isDirty && (
                  <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-md text-xs font-medium">
                    Unsaved changes
                  </div>
                )}
                <button
                  onClick={handleClose}
                  className="text-white/80 hover:text-white bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8">
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-800 dark:text-red-200 text-sm font-medium">
                  {error}
                </p>
              </div>
            )}

            {/* Personal Information Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Personal Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name *
                    <span className="text-xs text-gray-500 ml-1">(2-100 characters)</span>
                  </label>
                  <Input
                    ref={nameInputRef}
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    error={errors.name}
                    placeholder="Enter your full name"
                    aria-describedby="name-help"
                    maxLength={100}
                  />
                  <p id="name-help" className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Your display name across the platform
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Information Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Contact Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number
                    <span className="text-xs text-gray-500 ml-1">(optional)</span>
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    error={errors.phone}
                    placeholder="(555) 123-4567"
                    aria-describedby="phone-help"
                    maxLength={14}
                  />
                  <p id="phone-help" className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Format: (123) 456-7890
                  </p>
                </div>

                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Company
                    <span className="text-xs text-gray-500 ml-1">(optional)</span>
                  </label>
                  <Input
                    id="company"
                    type="text"
                    value={formData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    error={errors.company}
                    placeholder="Your company name"
                    aria-describedby="company-help"
                    maxLength={255}
                  />
                  <p id="company-help" className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Organization you work for
                  </p>
                </div>
              </div>
            </div>

            {/* Account Information Section (Read-only) */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Account Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                    <span className="text-xs text-gray-500 ml-1">(read-only)</span>
                  </label>
                  <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-300">
                    {user?.email}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Contact support to change email
                  </p>
                </div>

                {user?.roles && user.roles.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Roles
                      <span className="text-xs text-gray-500 ml-1">(read-only)</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {user.roles.map((role, index) => (
                        <span 
                          key={index} 
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Managed by administrators
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200 dark:border-gray-600">
              <Button
                type="button"
                variant="secondary"
                onClick={handleClose}
                className="sm:flex-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="sm:flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                disabled={isLoading || !isDirty}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </div>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>

            {/* Keyboard shortcuts hint */}
            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">Esc</kbd> to cancel • 
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs ml-1">⌘S</kbd> to save
            </div>
          </form>
        </div>
      </div>

      {/* Unsaved Changes Warning Modal */}
      {showUnsavedWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-60">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Unsaved Changes
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              You have unsaved changes that will be lost. Are you sure you want to continue?
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowUnsavedWarning(false)}
                variant="secondary"
                className="flex-1"
              >
                Keep Editing
              </Button>
              <Button
                onClick={handleConfirmClose}
                className="flex-1 bg-red-500 hover:bg-red-600"
              >
                Discard Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};