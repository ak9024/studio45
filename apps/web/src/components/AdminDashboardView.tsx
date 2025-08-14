import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from './Layout/Layout';
import { Button } from './ui/Button';
import { useAuth } from '../hooks/useAuth';
import { adminService, ApiError } from '../services/admin.service';
import type { UserManagement } from '../services/admin.service';

export const AdminDashboardView = () => {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserManagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    adminUsers: 0,
    newUsersToday: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await adminService.getUsers(token);
      setUsers(response.users);
      
      // Calculate statistics
      const totalUsers = response.users.length;
      const adminUsers = response.users.filter(user => user.roles.includes('admin')).length;
      const today = new Date().toDateString();
      const newUsersToday = response.users.filter(user => 
        new Date(user.created_at).toDateString() === today
      ).length;

      setStats({
        totalUsers,
        activeUsers: totalUsers, // Assuming all users are active for now
        adminUsers,
        newUsersToday,
      });
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const goToAdminPanel = () => {
    navigate('/admin');
  };

  const goToProfile = () => {
    navigate('/profile/edit');
  };

  const getRoleDistribution = () => {
    const roleCount: Record<string, number> = {};
    users.forEach(user => {
      user.roles.forEach(role => {
        roleCount[role] = (roleCount[role] || 0) + 1;
      });
    });
    return Object.entries(roleCount).map(([role, count]) => ({ role, count }));
  };

  const getRecentUsers = () => {
    return users
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  };

  if (loading) {
    return (
      <Layout showHeader={false}>
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showHeader={false}>
      <div className="min-h-screen bg-gray-900">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Admin Header */}
            <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 mb-8 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 px-8 py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center text-gray-900 text-2xl font-bold border-2 border-yellow-400">
                      👑
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-white mb-1">
                        Admin Dashboard
                      </h1>
                      <p className="text-purple-100 text-base flex items-center gap-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-400 text-gray-900">
                          ADMIN
                        </span>
                        Welcome back, {user?.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={goToProfile}
                      className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                    >
                      Profile
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
              <div className="px-8 py-4 bg-gradient-to-r from-purple-900/50 to-indigo-900/50">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-gray-300">System Online</span>
                    </div>
                    <div className="text-gray-300">
                      Admin since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                  <div className="text-gray-400">
                    Last activity: Just now
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Users */}
              <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-indigo-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-indigo-100 text-sm font-medium uppercase tracking-wider">
                      Total Users
                    </p>
                    <p className="text-3xl font-bold mt-2">
                      {stats.totalUsers}
                    </p>
                    <p className="text-indigo-100 text-xs mt-1">
                      Registered users
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Active Users */}
              <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium uppercase tracking-wider">
                      Active Users
                    </p>
                    <p className="text-3xl font-bold mt-2">
                      {stats.activeUsers}
                    </p>
                    <p className="text-green-100 text-xs mt-1">
                      Online recently
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Admin Users */}
              <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium uppercase tracking-wider">
                      Administrators
                    </p>
                    <p className="text-3xl font-bold mt-2">
                      {stats.adminUsers}
                    </p>
                    <p className="text-purple-100 text-xs mt-1">
                      Admin privileges
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* New Users Today */}
              <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-yellow-400">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-100 text-sm font-medium uppercase tracking-wider">
                      New Today
                    </p>
                    <p className="text-3xl font-bold mt-2">
                      {stats.newUsersToday}
                    </p>
                    <p className="text-yellow-100 text-xs mt-1">
                      Registrations
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Quick Actions */}
              <div className="lg:col-span-1">
                <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 p-6 mb-6">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <span className="text-yellow-400">⚡</span>
                    Quick Actions
                  </h3>
                  <div className="space-y-3">
                    <Button
                      onClick={goToAdminPanel}
                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                    >
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                        Manage Users
                      </span>
                    </Button>
                    <Button
                      onClick={() => navigate('/admin')}
                      className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                    >
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        System Analytics
                      </span>
                    </Button>
                    <Button
                      onClick={loadDashboardData}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                    >
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh Data
                      </span>
                    </Button>
                  </div>
                </div>

                {/* Role Distribution */}
                <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <span className="text-blue-400">📊</span>
                    Role Distribution
                  </h3>
                  <div className="space-y-3">
                    {getRoleDistribution().map(({ role, count }) => (
                      <div key={role} className="flex items-center justify-between">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          role === 'admin'
                            ? 'bg-red-900 text-red-200'
                            : role === 'moderator'
                            ? 'bg-yellow-900 text-yellow-200'
                            : role === 'premium'
                            ? 'bg-purple-900 text-purple-200'
                            : 'bg-green-900 text-green-200'
                        }`}>
                          {role}
                        </span>
                        <span className="text-gray-300 font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="lg:col-span-2">
                <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 p-6">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <span className="text-green-400">📈</span>
                    Recent User Activity
                  </h3>
                  <div className="overflow-hidden">
                    <div className="space-y-4">
                      {getRecentUsers().map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg border border-gray-600 hover:bg-gray-650 transition-colors">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-white font-medium">{user.name}</p>
                              <p className="text-gray-400 text-sm">{user.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex gap-1 mb-1">
                              {user.roles.map((role) => (
                                <span
                                  key={role}
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                    role === 'admin'
                                      ? 'bg-red-900 text-red-200'
                                      : role === 'moderator'
                                      ? 'bg-yellow-900 text-yellow-200'
                                      : role === 'premium'
                                      ? 'bg-purple-900 text-purple-200'
                                      : 'bg-green-900 text-green-200'
                                  }`}
                                >
                                  {role}
                                </span>
                              ))}
                            </div>
                            <p className="text-gray-400 text-xs">
                              Joined {new Date(user.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {getRecentUsers().length === 0 && (
                      <div className="text-center py-8 text-gray-400">
                        <div className="text-4xl mb-2">👥</div>
                        <p>No users found</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};