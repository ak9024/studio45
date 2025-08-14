import { useState, useEffect } from 'react';
import { User, Upload, Camera } from 'lucide-react';
import { Input } from '../../ui/Input';

interface PersonalStepProps {
  formData: {
    name: string;
    avatar?: string;
  };
  errors: {
    name?: string;
  };
  onChange: (field: string, value: string) => void;
  onValidationChange: (isValid: boolean) => void;
}

export const PersonalStep = ({
  formData,
  errors,
  onChange,
  onValidationChange
}: PersonalStepProps) => {
  const [nameValue, setNameValue] = useState(formData.name || '');
  const [nameError, setNameError] = useState<string | undefined>(errors.name);

  useEffect(() => {
    setNameValue(formData.name || '');
  }, [formData.name]);

  useEffect(() => {
    setNameError(errors.name);
  }, [errors.name]);

  const validateName = (value: string): string | undefined => {
    const trimmedValue = value.trim();
    
    if (!trimmedValue) {
      return 'Full name is required';
    }
    if (trimmedValue.length < 2) {
      return 'Name must be at least 2 characters long';
    }
    if (trimmedValue.length > 100) {
      return 'Name must be less than 100 characters';
    }
    if (!/^[a-zA-Z\s\-']+$/.test(trimmedValue)) {
      return 'Name can only contain letters, spaces, hyphens, and apostrophes';
    }
    
    return undefined;
  };

  const handleNameChange = (value: string) => {
    setNameValue(value);
    const error = validateName(value);
    setNameError(error);
    
    // Notify parent of validation status
    onValidationChange(!error);
    
    // Update parent form data
    onChange('name', value);
  };

  const generateInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Avatar Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-8 mb-8">
        <div className="text-center">
          <div className="relative inline-block mb-6">
            {/* Avatar Display */}
            <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-xl">
              {formData.avatar ? (
                <img 
                  src={formData.avatar} 
                  alt="Profile" 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span>{nameValue ? generateInitials(nameValue) : <User className="w-12 h-12" />}</span>
              )}
            </div>
            
            {/* Upload Button */}
            <button
              type="button"
              className="absolute bottom-2 right-2 w-10 h-10 bg-white dark:bg-gray-800 rounded-full shadow-lg border-2 border-gray-200 dark:border-gray-600 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
              title="Upload profile picture"
            >
              <Camera className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-500" />
            </button>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Profile Picture
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Add a photo to personalize your profile (optional)
          </p>
          
          {/* Future: File upload functionality */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-400">
            <Upload className="w-4 h-4" />
            Coming soon - Photo upload
          </div>
        </div>
      </div>

      {/* Name Input Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
            <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Personal Information
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Tell us your name as you'd like it to appear
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="name"
              type="text"
              value={nameValue}
              onChange={(e) => handleNameChange(e.target.value)}
              error={nameError}
              placeholder="Enter your full name"
              className="text-lg"
              maxLength={100}
              autoFocus
              aria-describedby="name-help name-requirements"
            />
            
            <div className="mt-2 space-y-1">
              <p id="name-help" className="text-sm text-gray-600 dark:text-gray-400">
                This will be displayed throughout the application
              </p>
              
              {/* Real-time validation feedback */}
              <div id="name-requirements" className="text-xs space-y-1">
                <div className={`flex items-center gap-2 ${nameValue.length >= 2 ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${nameValue.length >= 2 ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                  At least 2 characters
                </div>
                <div className={`flex items-center gap-2 ${nameValue.length <= 100 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${nameValue.length <= 100 ? 'bg-green-500' : 'bg-red-500'}`} />
                  Maximum 100 characters ({nameValue.length}/100)
                </div>
                <div className={`flex items-center gap-2 ${/^[a-zA-Z\s\-']*$/.test(nameValue) ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${/^[a-zA-Z\s\-']*$/.test(nameValue) ? 'bg-green-500' : 'bg-red-500'}`} />
                  Letters, spaces, hyphens and apostrophes only
                </div>
              </div>
            </div>
          </div>

          {/* Preview Section */}
          {nameValue && !nameError && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                  <span className="text-green-600 dark:text-green-400 text-sm font-semibold">
                    {generateInitials(nameValue)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    Preview: Hello, {nameValue}!
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    This is how your name will appear to others
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tips Section */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
          💡 Quick Tips
        </h4>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>• Use your real name for better recognition</li>
          <li>• You can update this anytime from your settings</li>
          <li>• Consider how colleagues and clients will see your name</li>
        </ul>
      </div>
    </div>
  );
};