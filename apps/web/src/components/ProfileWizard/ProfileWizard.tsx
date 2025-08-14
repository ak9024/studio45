import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { WizardProgress } from './WizardProgress';
import type { WizardStepConfig } from './WizardProgress';
import { WizardStep } from './WizardStep';
import { WizardNavigation } from './WizardNavigation';
import { PersonalStep } from './steps/PersonalStep';
import { ContactStep } from './steps/ContactStep';
import { AccountStep } from './steps/AccountStep';
import { ReviewStep } from './steps/ReviewStep';
import { Button } from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../contexts/ToastContext';
import type { ProfileUpdateRequest } from '../../services/profile.service';

interface WizardFormData {
  name: string;
  phone: string;
  company: string;
  location?: string;
  avatar?: string;
}

interface WizardErrors {
  name?: string;
  phone?: string;
  company?: string;
  location?: string;
}

export const ProfileWizard = () => {
  const navigate = useNavigate();
  const { user, updateProfile, isLoading } = useAuth();
  const { showSuccess, showError } = useToast();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'backward' | 'none'>('none');
  const [formData, setFormData] = useState<WizardFormData>({
    name: user?.name || '',
    phone: user?.phone || '',
    company: user?.company || '',
    location: '',
    avatar: undefined,
  });
  const [errors, setErrors] = useState<WizardErrors>({});
  const [stepValidation, setStepValidation] = useState<boolean[]>([false, true, true, true]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Define wizard steps
  const steps: WizardStepConfig[] = [
    {
      id: 'personal',
      title: 'Personal Info',
      description: 'Your name and basic details',
      isCompleted: stepValidation[0] && formData.name.trim().length > 0,
    },
    {
      id: 'contact',
      title: 'Contact Details',
      description: 'Phone and company information',
      isCompleted: true, // Optional step is always completed
      isOptional: true,
    },
    {
      id: 'account',
      title: 'Account Info',
      description: 'Review your account settings',
      isCompleted: true, // Read-only step is always completed
    },
    {
      id: 'review',
      title: 'Review',
      description: 'Confirm and complete your profile',
      isCompleted: stepValidation[3],
    },
  ];

  // Track if form data has changed from original user data
  useEffect(() => {
    const hasChanges = 
      formData.name !== (user?.name || '') ||
      formData.phone !== (user?.phone || '') ||
      formData.company !== (user?.company || '');
    
    setHasUnsavedChanges(hasChanges);
  }, [formData, user]);

  // Handle form field changes
  const handleFieldChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear related errors
    if (errors[field as keyof WizardErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  // Handle step validation changes
  const handleStepValidation = useCallback((stepIndex: number, isValid: boolean) => {
    setStepValidation(prev => {
      const newValidation = [...prev];
      newValidation[stepIndex] = isValid;
      return newValidation;
    });
  }, []);

  // Navigation functions
  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex < 0 || stepIndex >= steps.length) return;
    
    const newDirection = stepIndex > currentStep ? 'forward' : 'backward';
    setDirection(newDirection);
    setCurrentStep(stepIndex);
  }, [currentStep, steps.length]);

  const goToNextStep = useCallback(() => {
    if (currentStep < steps.length - 1 && stepValidation[currentStep]) {
      goToStep(currentStep + 1);
    }
  }, [currentStep, stepValidation, goToStep, steps.length]);

  const goToPreviousStep = useCallback(() => {
    if (currentStep > 0) {
      goToStep(currentStep - 1);
    }
  }, [currentStep, goToStep]);

  // Save draft functionality
  const saveDraft = useCallback(async () => {
    if (!hasUnsavedChanges) return;

    try {
      const updates: ProfileUpdateRequest = {};
      
      if (formData.name !== user?.name) {
        updates.name = formData.name.trim();
      }
      if (formData.phone !== user?.phone) {
        updates.phone = formData.phone.trim() || null;
      }
      if (formData.company !== user?.company) {
        updates.company = formData.company.trim() || null;
      }

      if (Object.keys(updates).length > 0) {
        await updateProfile(updates);
        showSuccess('Draft Saved', 'Your changes have been saved automatically.');
        setHasUnsavedChanges(false);
      }
    } catch (error: any) {
      showError('Save Failed', error.message || 'Failed to save your changes.');
    }
  }, [formData, user, hasUnsavedChanges, updateProfile, showSuccess, showError]);

  // Complete profile
  const completeProfile = useCallback(async () => {
    if (!stepValidation[0]) {
      showError('Incomplete Profile', 'Please complete the required fields.');
      return;
    }

    try {
      const updates: ProfileUpdateRequest = {};
      
      if (formData.name !== user?.name) {
        updates.name = formData.name.trim();
      }
      if (formData.phone !== user?.phone) {
        updates.phone = formData.phone.trim() || null;
      }
      if (formData.company !== user?.company) {
        updates.company = formData.company.trim() || null;
      }

      if (Object.keys(updates).length > 0) {
        await updateProfile(updates);
      }

      showSuccess('Profile Completed!', 'Your profile has been successfully updated.');
      
      // Navigate back to dashboard after a brief delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
      
    } catch (error: any) {
      showError('Update Failed', error.message || 'Failed to complete your profile.');
    }
  }, [formData, user, stepValidation, updateProfile, showSuccess, showError, navigate]);

  // Render current step component
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <PersonalStep
            formData={formData}
            errors={errors}
            onChange={handleFieldChange}
            onValidationChange={(isValid) => handleStepValidation(0, isValid)}
          />
        );
      case 1:
        return (
          <ContactStep
            formData={formData}
            errors={errors}
            onChange={handleFieldChange}
            onValidationChange={(isValid) => handleStepValidation(1, isValid)}
          />
        );
      case 2:
        return (
          <AccountStep
            onValidationChange={(isValid) => handleStepValidation(2, isValid)}
          />
        );
      case 3:
        return (
          <ReviewStep
            formData={formData}
            onValidationChange={(isValid) => handleStepValidation(3, isValid)}
            onEditStep={goToStep}
          />
        );
      default:
        return null;
    }
  };

  // Auto-save every 30 seconds if there are unsaved changes
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const autoSaveInterval = setInterval(() => {
      saveDraft();
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [hasUnsavedChanges, saveDraft]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
              
              {hasUnsavedChanges && (
                <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                  Unsaved changes
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {hasUnsavedChanges && (
                <Button
                  variant="outline"
                  onClick={saveDraft}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Draft
                </Button>
              )}
              
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {user?.name || 'User'}'s Profile
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Indicator */}
        <div className="mb-8">
          <WizardProgress
            steps={steps}
            currentStepIndex={currentStep}
            onStepClick={goToStep}
            allowNavigation={true}
          />
        </div>

        {/* Step Content */}
        <div className="mb-8">
          <WizardStep
            title={steps[currentStep]?.title}
            description={steps[currentStep]?.description}
            isActive={true}
            direction={direction}
          >
            {renderCurrentStep()}
          </WizardStep>
        </div>

        {/* Navigation */}
        <WizardNavigation
          currentStep={currentStep}
          totalSteps={steps.length}
          isFirstStep={currentStep === 0}
          isLastStep={currentStep === steps.length - 1}
          canProceed={stepValidation[currentStep]}
          isLoading={isLoading}
          onPrevious={goToPreviousStep}
          onNext={goToNextStep}
          onSave={saveDraft}
          onFinish={completeProfile}
          showSave={hasUnsavedChanges}
        />
      </div>
    </div>
  );
};