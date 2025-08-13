import { type ReactNode } from 'react';
import { CheckCircle } from 'lucide-react';

interface SuccessCardProps {
  title: string;
  description: string;
  children?: ReactNode;
}

export const SuccessCard = ({ title, description, children }: SuccessCardProps) => {
  return (
    <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow-xl rounded-2xl border border-gray-200 dark:border-gray-700 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-900/10 dark:to-emerald-900/10" />
      
      <div className="relative text-center space-y-6">
        <div className="relative">
          <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 rounded-full flex items-center justify-center mx-auto shadow-lg animate-pulse-soft">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center animate-scale-in">
              <CheckCircle className="w-10 h-10 text-white animate-bounce-in" />
            </div>
          </div>
          
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full animate-ping opacity-75" />
          <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-gradient-to-br from-emerald-400 to-green-400 rounded-full animate-ping opacity-50" style={{ animationDelay: '0.5s' }} />
        </div>
        
        <div className="space-y-3">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white animate-fade-in-up">
            {title}
          </h2>
          <p className="text-base text-gray-600 dark:text-gray-400 max-w-sm mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {description}
          </p>
        </div>
        
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200/50 dark:border-green-700/50 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center justify-center space-x-2 text-green-700 dark:text-green-300">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Password successfully updated</span>
          </div>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
            Your account is now secure with your new password
          </p>
        </div>
        
        {children && (
          <div className="animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            {children}
          </div>
        )}
      </div>
    </div>
  );
};