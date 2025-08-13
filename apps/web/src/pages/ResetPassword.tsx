import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Layout } from '../components/Layout/Layout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { authService, ApiError } from '../services/auth.service';
import { ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

interface ResetPasswordForm {
  password: string;
  confirmPassword: string;
}

const getPasswordStrength = (password: string) => {
  let strength = 0;
  const checks = [
    /.{8,}/, // At least 8 characters
    /[a-z]/, // Lowercase letter
    /[A-Z]/, // Uppercase letter
    /[0-9]/, // Number
    /[^A-Za-z0-9]/ // Special character
  ];
  
  checks.forEach(check => {
    if (check.test(password)) strength++;
  });
  
  return strength;
};

const PasswordStrengthIndicator = ({ password }: { password: string }) => {
  const strength = getPasswordStrength(password);
  const getStrengthLabel = () => {
    if (strength === 0) return '';
    if (strength <= 2) return 'Weak';
    if (strength <= 3) return 'Fair';
    if (strength <= 4) return 'Good';
    return 'Strong';
  };
  
  const getStrengthColor = () => {
    if (strength <= 2) return 'bg-red-500';
    if (strength <= 3) return 'bg-yellow-500';
    if (strength <= 4) return 'bg-blue-500';
    return 'bg-green-500';
  };
  
  if (!password) return null;
  
  return (
    <div className="mt-1">
      <div className="flex items-center space-x-2">
        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1">
          <div 
            className={`h-1 rounded-full transition-all duration-300 ${getStrengthColor()}`}
            style={{ width: `${(strength / 5) * 100}%` }}
          />
        </div>
        <span className={`text-xs font-medium ${
          strength <= 2 ? 'text-red-600 dark:text-red-400' :
          strength <= 3 ? 'text-yellow-600 dark:text-yellow-400' :
          strength <= 4 ? 'text-blue-600 dark:text-blue-400' :
          'text-green-600 dark:text-green-400'
        }`}>
          {getStrengthLabel()}
        </span>
      </div>
    </div>
  );
};

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [passwordValue, setPasswordValue] = useState('');
  const { register, handleSubmit, formState: { errors }, watch } = useForm<ResetPasswordForm>();

  const watchedPassword = watch('password');

  useEffect(() => {
    const resetToken = searchParams.get('token');
    if (!resetToken) {
      setError('Invalid or missing reset token. Please request a new password reset.');
      return;
    }
    setToken(resetToken);
  }, [searchParams]);

  useEffect(() => {
    if (watchedPassword) {
      setPasswordValue(watchedPassword);
    }
  }, [watchedPassword]);

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) {
      setError('Invalid reset token. Please request a new password reset.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await authService.resetPassword(token, data.password);
      setIsSuccess(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (error && !token) {
    return (
      <Layout showHeader={false}>
        <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <Link to="/" className="inline-flex items-center space-x-2 mb-8">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold">S</span>
                </div>
                <span className="font-semibold text-2xl text-gray-900 dark:text-white">
                  Studio45
                </span>
              </Link>
            </div>
            
            <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow-xl rounded-2xl border border-gray-200 dark:border-gray-700">
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Invalid Link
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {error}
                  </p>
                </div>
                
                <div className="space-y-3">
                  <Link to="/forgot-password">
                    <Button className="w-full">
                      Request New Reset Link
                    </Button>
                  </Link>
                  
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

  if (isSuccess) {
    return (
      <Layout showHeader={false}>
        <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <Link to="/" className="inline-flex items-center space-x-2 mb-8">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold">S</span>
                </div>
                <span className="font-semibold text-2xl text-gray-900 dark:text-white">
                  Studio45
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
                    Password reset successful!
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Your password has been successfully updated. You can now sign in with your new password.
                  </p>
                </div>
                
                <Link to="/login">
                  <Button className="w-full">
                    Continue to login
                  </Button>
                </Link>
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
                <span className="text-white font-bold">S</span>
              </div>
              <span className="font-semibold text-2xl text-gray-900 dark:text-white">
                Studio45
              </span>
            </Link>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Set new password
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Please choose a new password for your account.
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
                  label="New Password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Enter your new password"
                  showPasswordToggle
                  error={errors.password?.message}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters'
                    },
                    validate: (value) => {
                      const strength = getPasswordStrength(value);
                      if (strength < 3) {
                        return 'Password should be stronger. Include uppercase, lowercase, numbers, and special characters.';
                      }
                      return true;
                    }
                  })}
                />
                <PasswordStrengthIndicator password={passwordValue} />
              </div>
              
              <div>
                <Input
                  label="Confirm New Password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Confirm your new password"
                  showPasswordToggle
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (value) => 
                      value === watchedPassword || 'Passwords do not match'
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
                  {isLoading ? 'Updating...' : 'Update password'}
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