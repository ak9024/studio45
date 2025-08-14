import { Check } from 'lucide-react';

export interface WizardStepConfig {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  isOptional?: boolean;
}

interface WizardProgressProps {
  steps: WizardStepConfig[];
  currentStepIndex: number;
  onStepClick?: (stepIndex: number) => void;
  allowNavigation?: boolean;
}

export const WizardProgress = ({
  steps,
  currentStepIndex,
  onStepClick,
  allowNavigation = true
}: WizardProgressProps) => {
  const handleStepClick = (stepIndex: number) => {
    if (!allowNavigation || !onStepClick) return;
    
    // Only allow navigation to completed steps or current step
    const targetStep = steps[stepIndex];
    const canNavigate = stepIndex <= currentStepIndex || targetStep.isCompleted;
    
    if (canNavigate) {
      onStepClick(stepIndex);
    }
  };

  return (
    <div className="w-full">
      {/* Mobile Progress Bar */}
      <div className="block md:hidden mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Step {currentStepIndex + 1} of {steps.length}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-500">
            {Math.round(((currentStepIndex + 1) / steps.length) * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
        <div className="mt-2">
          <h3 className="font-medium text-gray-900 dark:text-gray-100">
            {steps[currentStepIndex]?.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {steps[currentStepIndex]?.description}
          </p>
        </div>
      </div>

      {/* Desktop Step Indicator */}
      <div className="hidden md:block">
        <nav aria-label="Progress">
          <ol className="flex items-center">
            {steps.map((step, stepIndex) => {
              const isCurrent = stepIndex === currentStepIndex;
              const isCompleted = step.isCompleted;
              const isUpcoming = stepIndex > currentStepIndex && !isCompleted;
              const canNavigate = stepIndex <= currentStepIndex || isCompleted;

              return (
                <li
                  key={step.id}
                  className={`relative ${
                    stepIndex !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''
                  } flex-1`}
                >
                  {/* Connector Line */}
                  {stepIndex !== steps.length - 1 && (
                    <div
                      className="absolute top-4 right-0 left-8 h-0.5 transition-colors duration-300"
                      style={{
                        backgroundColor: isCompleted || stepIndex < currentStepIndex
                          ? '#3b82f6'
                          : '#e5e7eb'
                      }}
                      aria-hidden="true"
                    />
                  )}

                  <button
                    onClick={() => handleStepClick(stepIndex)}
                    disabled={!allowNavigation || !canNavigate}
                    className={`
                      relative flex items-center group w-full text-left transition-all duration-200
                      ${canNavigate && allowNavigation ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}
                      ${!canNavigate ? 'opacity-50' : ''}
                    `}
                    aria-current={isCurrent ? 'step' : undefined}
                  >
                    {/* Step Circle */}
                    <div
                      className={`
                        flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300
                        ${isCompleted
                          ? 'border-blue-500 bg-blue-500 text-white'
                          : isCurrent
                          ? 'border-blue-500 bg-white dark:bg-gray-800 text-blue-500'
                          : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                        }
                        ${canNavigate && allowNavigation ? 'group-hover:scale-110' : ''}
                      `}
                    >
                      {isCompleted ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <span className="text-sm font-semibold">
                          {stepIndex + 1}
                        </span>
                      )}
                    </div>

                    {/* Step Content */}
                    <div className="ml-4 min-w-0 flex-1">
                      <div className="flex items-center">
                        <span
                          className={`
                            text-sm font-medium transition-colors duration-200
                            ${isCurrent
                              ? 'text-blue-600 dark:text-blue-400'
                              : isCompleted
                              ? 'text-gray-900 dark:text-gray-100'
                              : 'text-gray-500 dark:text-gray-400'
                            }
                          `}
                        >
                          {step.title}
                        </span>
                        {step.isOptional && (
                          <span className="ml-2 text-xs text-gray-400 dark:text-gray-500 italic">
                            (optional)
                          </span>
                        )}
                      </div>
                      <p
                        className={`
                          text-xs mt-1 transition-colors duration-200
                          ${isCurrent
                            ? 'text-blue-500 dark:text-blue-400'
                            : 'text-gray-500 dark:text-gray-400'
                          }
                        `}
                      >
                        {step.description}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>
    </div>
  );
};