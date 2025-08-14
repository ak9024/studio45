import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Layout } from '../components/Layout/Layout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { authService, ApiError } from '../services/auth.service';
import { useToast } from '../contexts/ToastContext';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';

interface ForgotPasswordForm {
  email: string;
}

export const ForgotPassword = () => {
  const { showError, showSuccess } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string>('');
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordForm>();
  const brandTitle = import.meta.env.VITE_APP_TITLE;
  const brandInitial = brandTitle.charAt(0).toUpperCase();

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true);
    setError(null);

    try {
      await authService.requestPasswordReset(data.email);
      setSubmittedEmail(data.email);
      setIsSuccess(true);
      showSuccess('Reset Email Sent', `Password reset instructions have been sent to ${data.email}`);
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Something went wrong. Please try again.';
      setError(errorMessage);
      showError('Error Sending Reset Email', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <Layout showHeader={false}>
        <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <Link to="/" className="inline-flex items-center space-x-2 mb-8">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold">{brandInitial}</span>
                </div>
                <span className="font-semibold text-2xl text-gray-900 dark:text-white">
                  {brandTitle}
                </span>
              </Link>
            </div>
            
            <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow-xl rounded-2xl border border-gray-200 dark:border-gray-700">
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Check your email
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    We've sent password reset instructions to:
                  </p>
                  <p className="text-sm font-medium text-primary-600 dark:text-primary-400">
                    {submittedEmail}
                  </p>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Mail className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
                    <div className="text-left">
                      <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                        Didn't receive the email?
                      </p>
                      <ul className="text-xs text-gray-600 dark:text-gray-400 mt-1 space-y-1">
                        <li>• Check your spam/junk folder</li>
                        <li>• Make sure you entered the correct email</li>
                        <li>• Wait a few minutes and try again</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      setIsSuccess(false);
                      setSubmittedEmail('');
                      setError(null);
                    }}
                  >
                    Try different email
                  </Button>
                  
                  <Link to="/login">
                    <Button variant="secondary" className="w-full">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to login
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showHeader={false}>
      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <Link to="/" className="inline-flex items-center space-x-2 mb-8">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold">{brandInitial}</span>
              </div>
              <span className="font-semibold text-2xl text-gray-900 dark:text-white">
                {brandTitle}
              </span>
            </Link>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Forgot your password?
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              No worries! Enter your email address and we'll send you instructions to reset your password.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow-xl rounded-2xl border border-gray-200 dark:border-gray-700">
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              </div>
            )}
            
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <Input
                  label="Email address"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your email"
                  error={errors.email?.message}
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                />
              </div>
              
              <div>
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  isLoading={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Send reset instructions'}
                </Button>
              </div>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Remember your password?{' '}
                <Link 
                  to="/login" 
                  className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 transition-colors duration-200"
                >
                  Back to login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
