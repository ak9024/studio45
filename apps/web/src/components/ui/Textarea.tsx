import { type TextareaHTMLAttributes, forwardRef, useState } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', label, error, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    
    const baseClasses = 'block w-full px-3 py-2 border rounded-lg shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm resize-y min-h-[100px]';
    const errorClasses = error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600';
    const bgClasses = 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500';
    
    const classes = `${baseClasses} ${errorClasses} ${bgClasses} ${className}`;
    
    return (
      <div className="w-full">
        {label && (
          <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
            isFocused || props.value ? 'text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'
          }`}>
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={classes}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';