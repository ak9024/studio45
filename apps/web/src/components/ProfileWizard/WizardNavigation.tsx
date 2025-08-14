import { ChevronLeft, ChevronRight, Save, Check } from 'lucide-react';
import { Button } from '../ui/Button';

interface WizardNavigationProps {
  currentStep: number;
  totalSteps: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  canProceed: boolean;
  isLoading: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSave?: () => void;
  onFinish?: () => void;
  showSave?: boolean;
  saveLabel?: string;
  nextLabel?: string;
  previousLabel?: string;
  finishLabel?: string;
}

export const WizardNavigation = ({
  currentStep,
  totalSteps,
  isFirstStep,
  isLastStep,
  canProceed,
  isLoading,
  onPrevious,
  onNext,
  onSave,
  onFinish,
  showSave = true,
  saveLabel = 'Save Draft',
  nextLabel = 'Continue',
  previousLabel = 'Back',
  finishLabel = 'Complete Profile'
}: WizardNavigationProps) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && canProceed && !isLoading) {
      e.preventDefault();
      if (isLastStep && onFinish) {
        onFinish();
      } else {
        onNext();
      }
    }
  };

  return (
    <div 
      className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-gray-200 dark:border-gray-700"
      onKeyDown={handleKeyDown}
    >
      {/* Left Side - Previous Button */}
      <div className="flex items-center gap-3">
        {!isFirstStep && (
          <Button
            type="button"
            variant="outline"
            onClick={onPrevious}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            {previousLabel}
          </Button>
        )}
        
        {/* Save Draft Button */}
        {showSave && onSave && !isLastStep && (
          <Button
            type="button"
            variant="ghost"
            onClick={onSave}
            disabled={isLoading}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <Save className="w-4 h-4" />
            {saveLabel}
          </Button>
        )}
      </div>

      {/* Center - Step Counter */}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <span className="font-medium text-gray-900 dark:text-gray-100">
          Step {currentStep + 1}
        </span>
        <span>of</span>
        <span>{totalSteps}</span>
      </div>

      {/* Right Side - Next/Finish Button */}
      <div className="flex items-center gap-3">
        {isLastStep ? (
          <Button
            type="button"
            onClick={onFinish}
            disabled={!canProceed || isLoading}
            className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                {finishLabel}
              </>
            )}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={onNext}
            disabled={!canProceed || isLoading}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Loading...
              </>
            ) : (
              <>
                {nextLabel}
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </Button>
        )}
      </div>

      {/* Keyboard Shortcut Hint */}
      <div className="hidden sm:block absolute bottom-4 right-4 text-xs text-gray-400 dark:text-gray-500">
        Press <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Enter</kbd> to {isLastStep ? 'finish' : 'continue'}
      </div>
    </div>
  );
};