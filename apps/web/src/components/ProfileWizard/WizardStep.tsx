import { ReactNode, useEffect, useState } from 'react';

interface WizardStepProps {
  children: ReactNode;
  title: string;
  description?: string;
  isActive: boolean;
  direction?: 'forward' | 'backward' | 'none';
  className?: string;
}

export const WizardStep = ({
  children,
  title,
  description,
  isActive,
  direction = 'none',
  className = ''
}: WizardStepProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(isActive);

  useEffect(() => {
    if (isActive) {
      setShouldRender(true);
      // Small delay to ensure the component is rendered before animation starts
      const timer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      // Keep rendering during exit animation
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isActive]);

  if (!shouldRender) {
    return null;
  }

  const getAnimationClasses = () => {
    if (!isVisible) {
      // Exit animation
      switch (direction) {
        case 'forward':
          return 'transform -translate-x-full opacity-0';
        case 'backward':
          return 'transform translate-x-full opacity-0';
        default:
          return 'transform scale-95 opacity-0';
      }
    }
    
    // Enter animation
    return 'transform translate-x-0 scale-100 opacity-100';
  };

  return (
    <div
      className={`
        w-full transition-all duration-300 ease-out
        ${getAnimationClasses()}
        ${className}
      `}
    >
      {/* Step Header */}
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {title}
        </h2>
        {description && (
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
            {description}
          </p>
        )}
      </div>

      {/* Step Content */}
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
};