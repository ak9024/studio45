import { useEffect } from 'react';
import { Mail, Shield, Users, Calendar, Settings } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';

interface AccountStepProps {
  onValidationChange: (isValid: boolean) => void;
}

export const AccountStep = ({ onValidationChange }: AccountStepProps) => {
  const { user } = useAuth();

  useEffect(() => {
    // This step is always valid since it's read-only
    onValidationChange(true);
  }, [onValidationChange]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAccountAge = () => {
    if (!user?.created_at) return 'Unknown';
    
    const created = new Date(user.created_at);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'}`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months === 1 ? '' : 's'}`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years} year${years === 1 ? '' : 's'}`;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Account Overview */}
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-8 mb-8">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Account Information
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Review your account details and security settings
          </p>
        </div>
      </div>

      {/* Account Details */}
      <div className="space-y-6">
        {/* Email Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Email Address</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Primary account identifier</p>
              </div>
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              Verified
            </span>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-3">
            <span className="text-lg font-mono text-gray-900 dark:text-gray-100">
              {user?.email}
            </span>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
            This email is used for login and important account notifications. 
            <button className="text-blue-600 dark:text-blue-400 hover:underline ml-1">
              Contact support to change
            </button>
          </p>
        </div>

        {/* Roles Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">User Roles</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Your access permissions</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {user?.roles && user.roles.length > 0 ? (
              user.roles.map((role, index) => (
                <span 
                  key={index} 
                  className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                >
                  {role}
                </span>
              ))
            ) : (
              <span className="text-gray-500 dark:text-gray-400 text-sm italic">
                No roles assigned
              </span>
            )}
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Roles determine what features and data you can access. 
            <button className="text-blue-600 dark:text-blue-400 hover:underline ml-1">
              Contact admin to modify roles
            </button>
          </p>
        </div>

        {/* Account Timeline */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Account Timeline</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Important account milestones</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {/* Account Created */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Account Created</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Welcome to the platform!</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {user?.created_at ? formatDate(user.created_at) : 'Unknown'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {getAccountAge()} ago
                </p>
              </div>
            </div>

            {/* Last Updated */}
            {user?.updated_at && user.updated_at !== user.created_at && (
              <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Profile Updated</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Latest changes saved</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {formatDate(user.updated_at)}
                  </p>
                </div>
              </div>
            )}

            {/* Current Session */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Current Session</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">You are currently logged in</p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Security Status */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Security Status</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Account protection overview</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                  Email Verified
                </span>
              </div>
              <p className="text-xs text-green-700 dark:text-green-300">
                Your email address has been confirmed
              </p>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Strong Authentication
                </span>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Secure password protection enabled
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Future Enhancements */}
      <div className="mt-8 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h4 className="font-medium text-gray-900 dark:text-gray-100">Coming Soon</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div>• Two-factor authentication</div>
          <div>• Session management</div>
          <div>• Privacy preferences</div>
          <div>• Account export</div>
        </div>
      </div>
    </div>
  );
};