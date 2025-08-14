import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from './Layout/Layout';
import { Button } from './ui/Button';
import { useAuth } from '../hooks/useAuth';

export const UserDashboardView = () => {
  const { user, logout, error, clearError } = useAuth();
  const navigate = useNavigate();
  const [successMessage, setSuccessMessage] = useState('');

  const handleLogout = () => {
    logout();
  };

  const handleEditProfile = () => {
    clearError();
    navigate('/profile/edit');
  };

  return (
    <Layout showHeader={false}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Professional Header Section */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 mb-8 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-white mb-1">
                        Welcome back, {user?.name}!
                      </h1>
                      <p className="text-blue-100 text-base">
                        {user?.roles && user.roles.length > 0 ? 
                          `${user.roles.join(', ')} at ${user?.company || 'Your Company'}` : 
                          'Ready to make today productive?'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={handleEditProfile}
                      className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                    >
                      Complete Profile
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={handleLogout}
                      className="bg-white text-gray-900 hover:bg-gray-100"
                    >
                      Logout
                    </Button>
                  </div>
                </div>
              </div>
              <div className="px-8 py-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-gray-600 dark:text-gray-400">Online</span>
                    </div>
                    {user?.created_at && (
                      <div className="text-gray-600 dark:text-gray-400">
                        Member since {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">
                    Last login: Today
                  </div>
                </div>
              </div>
            </div>

            {/* Success Message */}
            {successMessage && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-green-800 dark:text-green-200 text-sm font-medium">
                  {successMessage}
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex justify-between items-start">
                  <p className="text-red-800 dark:text-red-200 text-sm font-medium">
                    {error}
                  </p>
                  <button
                    onClick={clearError}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Professional Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Active Sessions Card */}
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium uppercase tracking-wider">
                      Active Sessions
                    </p>
                    <p className="text-3xl font-bold mt-2">
                      1
                    </p>
                    <p className="text-green-100 text-xs mt-1">
                      Current device
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Profile Completion */}
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium uppercase tracking-wider">
                      Profile
                    </p>
                    <p className="text-3xl font-bold mt-2">
                      {Math.round(((user?.name ? 1 : 0) + (user?.phone ? 1 : 0) + (user?.company ? 1 : 0) + (user?.email ? 1 : 0)) / 4 * 100)}%
                    </p>
                    <p className="text-blue-100 text-xs mt-1">
                      Complete
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Account Security */}
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium uppercase tracking-wider">
                      Security
                    </p>
                    <p className="text-3xl font-bold mt-2">
                      Strong
                    </p>
                    <p className="text-purple-100 text-xs mt-1">
                      Account protected
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Account Status */}
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium uppercase tracking-wider">
                      Status
                    </p>
                    <p className="text-3xl font-bold mt-2">
                      Active
                    </p>
                    <p className="text-orange-100 text-xs mt-1">
                      {user?.roles?.length || 0} role(s)
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Professional Profile Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Account Details Card */}
              <div className="lg:col-span-2">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Account Information
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Your personal and account details
                    </p>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                            Full Name
                          </span>
                          <span className="text-base font-medium text-gray-900 dark:text-white">
                            {user?.name || 'Not provided'}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                            Email Address
                          </span>
                          <span className="text-base font-medium text-gray-900 dark:text-white break-all">
                            {user?.email}
                          </span>
                        </div>
                        {user?.phone && (
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                              Phone Number
                            </span>
                            <span className="text-base font-medium text-gray-900 dark:text-white">
                              {user.phone}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-4">
                        {user?.company && (
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                              Company
                            </span>
                            <span className="text-base font-medium text-gray-900 dark:text-white">
                              {user.company}
                            </span>
                          </div>
                        )}
                        {user?.roles && user.roles.length > 0 && (
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                              Roles
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {user.roles.map((role, index) => (
                                <span 
                                  key={index} 
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                >
                                  {role}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                            User ID
                          </span>
                          <span className="text-sm font-mono text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                            {user?.id}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions & Stats */}
              <div className="space-y-6">
                {/* Profile Completion */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Profile Status
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Completion</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {Math.round(((user?.name ? 1 : 0) + (user?.phone ? 1 : 0) + (user?.company ? 1 : 0) + (user?.email ? 1 : 0)) / 4 * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.round(((user?.name ? 1 : 0) + (user?.phone ? 1 : 0) + (user?.company ? 1 : 0) + (user?.email ? 1 : 0)) / 4 * 100)}%` }}
                      ></div>
                    </div>
                    <Button
                      onClick={handleEditProfile}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                    >
                      Update Profile
                    </Button>
                  </div>
                </div>

                {/* Account Timeline */}
                {user?.created_at && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Account Timeline
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Account Created</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(user.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      {user?.updated_at && user.updated_at !== user.created_at && (
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">Last Updated</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(user.updated_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};