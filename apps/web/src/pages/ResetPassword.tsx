import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Layout } from '../components/Layout/Layout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { SuccessCard } from '../components/ui/SuccessCard';
import { Confetti } from '../components/ui/Confetti';
import { authService, ApiError } from '../services/auth.service';
import { ArrowLeft, AlertCircle, Shield, Smartphone, Clock } from 'lucide-react';

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [passwordValue, setPasswordValue] = useState('');
  const { register, handleSubmit, formState: { errors }, watch } = useForm<ResetPasswordForm>();
  const brandTitle = import.meta.env.VITE_APP_TITLE || 'Studio 45';
  const brandInitial = brandTitle.charAt(0).toUpperCase();

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
        <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-red-50/30 to-orange-50/30 dark:from-gray-900 dark:to-gray-800">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center animate-fade-in-up">
              <Link to="/" className="inline-flex items-center space-x-2 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">{brandInitial}</span>
                </div>
                <span className="font-semibold text-2xl text-gray-900 dark:text-white">
                  {brandTitle}
                </span>
              </Link>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 py-8 px-6 shadow-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
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
        <Confetti active={true} duration={4000} />
        <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-green-50/30 to-emerald-50/30 dark:from-gray-900 dark:to-gray-800">
          <div className="max-w-lg w-full space-y-8">
            <div className="text-center animate-fade-in-up">
              <Link to="/" className="inline-flex items-center space-x-2 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">{brandInitial}</span>
                </div>
                <span className="font-semibold text-2xl text-gray-900 dark:text-white">
                  {brandTitle}
                </span>
              </Link>
            </div>
            
            <SuccessCard
              title="🎉 Password Reset Complete!"
              description="Your password has been successfully updated. Your account is now secure and ready to use."
            >
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div className="flex flex-col items-center space-y-2 p-3 bg-white/50 dark:bg-gray-700/50 rounded-lg">
                    <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Secure</span>
                  </div>
                  <div className="flex flex-col items-center space-y-2 p-3 bg-white/50 dark:bg-gray-700/50 rounded-lg">
                    <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Instant</span>
                  </div>
                  <div className="flex flex-col items-center space-y-2 p-3 bg-white/50 dark:bg-gray-700/50 rounded-lg">
                    <Smartphone className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Ready</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Link to="/login" className="block">
                    <Button className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold py-3 shadow-lg hover:shadow-xl transition-all duration-200">
                      Continue to Login
                    </Button>
                  </Link>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Link to="/dashboard">
                      <Button variant="secondary" className="w-full text-sm">
                        Go to Dashboard
                      </Button>
                    </Link>
                    <Link to="/profile">
                      <Button variant="ghost" className="w-full text-sm">
                        Update Profile
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200/50 dark:border-blue-700/50">
                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">💡 Security Tips</h4>
                  <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• Keep your password secure and don't share it</li>
                    <li>• Consider enabling two-factor authentication</li>
                    <li>• Sign out from shared devices</li>
                  </ul>
                </div>
              </div>
            </SuccessCard>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showHeader={false}>
      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center animate-fade-in-up">
            <Link to="/" className="inline-flex items-center space-x-2 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">{brandInitial}</span>
              </div>
              <span className="font-semibold text-2xl text-gray-900 dark:text-white">
                {brandTitle}
              </span>
            </Link>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Set New Password
            </h2>
            <p className="mt-3 text-base text-gray-600 dark:text-gray-400">
              Choose a strong password to secure your account.
            </p>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 py-8 px-6 shadow-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
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