import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { adminService, ApiError } from '../services/admin.service';
import type { UserManagement, Role, UpdateUserRequest } from '../services/admin.service';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../contexts/ToastContext';
import { UserPermissionsViewer } from '../components/UserPermissionsViewer';

interface EditingUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  roles: string[];
}

interface FilterState {
  search: string;
  roleFilter: string;
  sortBy: 'name' | 'email' | 'created_at';
  sortOrder: 'asc' | 'desc';
}

export function AdminDashboard() {
  const { token } = useAuth();
  const { showError, showSuccess } = useToast();
  const [users, setUsers] = useState<UserManagement[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserManagement[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<EditingUser | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [permissionsViewer, setPermissionsViewer] = useState<{ userId: string; userName: string } | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkRoles, setBulkRoles] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    roleFilter: '',
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [users, filters]);

  const loadData = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);
      const [usersResponse, rolesResponse] = await Promise.all([
        adminService.getUsers(token),
        adminService.getAllRoles(token).catch(() => ({ roles: [] })), // Fallback if roles endpoint fails
      ]);
      setUsers(usersResponse.users);
      setRoles(rolesResponse.roles);
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to load data';
      setError(errorMessage);
      showError('Error Loading Data', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...users];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.company?.toLowerCase().includes(searchLower)
      );
    }

    // Role filter
    if (filters.roleFilter) {
      filtered = filtered.filter(user => user.roles.includes(filters.roleFilter));
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: string | Date;
      let bValue: string | Date;

      switch (filters.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'email':
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
      }

      if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredUsers(filtered);
  };

  const handleEditUser = (user: UserManagement) => {
    setEditingUser({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      company: user.company,
      roles: [...user.roles],
    });
  };

  const handleRoleToggle = (role: string) => {
    if (!editingUser) return;

    const newRoles = editingUser.roles.includes(role)
      ? editingUser.roles.filter(r => r !== role)
      : [...editingUser.roles, role];

    setEditingUser({
      ...editingUser,
      roles: newRoles,
    });
  };

  const handleUserFieldChange = (field: keyof EditingUser, value: string | null) => {
    if (!editingUser) return;
    
    setEditingUser({
      ...editingUser,
      [field]: value,
    });
  };

  const handleSaveUser = async () => {
    if (!editingUser || !token) return;

    try {
      // Update user profile and roles separately
      const profileData: UpdateUserRequest = {
        name: editingUser.name,
        email: editingUser.email,
        phone: editingUser.phone,
        company: editingUser.company,
      };

      const [updatedProfile, updatedRoles] = await Promise.all([
        adminService.updateUserProfile(token, editingUser.id, profileData),
        adminService.updateUserRoles(token, editingUser.id, editingUser.roles),
      ]);
      
      // Merge the results (roles response should have the most up-to-date info)
      const updatedUser = { ...updatedProfile, roles: updatedRoles.roles };
      
      setUsers(users.map(user => 
        user.id === updatedUser.id ? updatedUser : user
      ));
      setEditingUser(null);
      showSuccess('User Updated', 'User information has been successfully updated.');
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to update user';
      setError(errorMessage);
      showError('Error Updating User', errorMessage);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!token) return;

    try {
      await adminService.deleteUser(token, userId);
      setUsers(users.filter(user => user.id !== userId));
      setDeleteConfirm(null);
      setSelectedUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
      showSuccess('User Deleted', 'User has been successfully deleted.');
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to delete user';
      setError(errorMessage);
      showError('Error Deleting User', errorMessage);
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(userId);
      } else {
        newSet.delete(userId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(new Set(filteredUsers.map(user => user.id)));
    } else {
      setSelectedUsers(new Set());
    }
  };

  const handleBulkDelete = async () => {
    if (!token || selectedUsers.size === 0) return;

    try {
      const userIds = Array.from(selectedUsers);
      const result = await adminService.bulkDeleteUsers(token, userIds);
      
      setUsers(users.filter(user => !selectedUsers.has(user.id)));
      setSelectedUsers(new Set());
      setShowBulkActions(false);
      showSuccess('Users Deleted', `${result.deletedCount} users have been successfully deleted.`);
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to delete users';
      setError(errorMessage);
      showError('Error Deleting Users', errorMessage);
    }
  };

  const handleBulkUpdateRoles = async () => {
    if (!token || selectedUsers.size === 0 || bulkRoles.length === 0) return;

    try {
      const userIds = Array.from(selectedUsers);
      const result = await adminService.bulkUpdateRoles(token, userIds, bulkRoles);
      
      // Refresh the user list to get updated roles
      await loadData();
      setSelectedUsers(new Set());
      setShowBulkActions(false);
      setBulkRoles([]);
      showSuccess('Roles Updated', `${result.updatedCount} users have been successfully updated.`);
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to update user roles';
      setError(errorMessage);
      showError('Error Updating Roles', errorMessage);
    }
  };

  const handleBulkRoleToggle = (role: string) => {
    setBulkRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const getAvailableRoles = () => {
    if (roles.length > 0) {
      return roles.map(role => role.name);
    }
    // Fallback to hardcoded roles if API doesn't provide them
    return ['user', 'admin', 'moderator', 'premium'];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                    Admin Management Panel
                  </h1>
                  <p className="text-purple-100 text-base flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-400 text-gray-900">
                      ADMIN
                    </span>
                    Complete user and role management system
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="px-8 py-4 bg-gradient-to-r from-purple-900/50 to-indigo-900/50">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-gray-300">Management Console Online</span>
                </div>
              </div>
              <div className="text-gray-400">
                Enhanced user administration
              </div>
            </div>
          </div>
        </div>

        {/* Header with Statistics */}
        <div className="mb-8">
          
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
            {/* Total Users */}
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-indigo-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100 text-sm font-medium uppercase tracking-wider">
                    Total Users
                  </p>
                  <p className="text-3xl font-bold mt-2">
                    {users.length}
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

            {/* Available Roles */}
            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium uppercase tracking-wider">
                    Available Roles
                  </p>
                  <p className="text-3xl font-bold mt-2">
                    {getAvailableRoles().length}
                  </p>
                  <p className="text-green-100 text-xs mt-1">
                    System roles
                  </p>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Selected Users */}
            <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium uppercase tracking-wider">
                    Selected
                  </p>
                  <p className="text-3xl font-bold mt-2">
                    {selectedUsers.size}
                  </p>
                  <p className="text-purple-100 text-xs mt-1">
                    For bulk actions
                  </p>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Filtered Results */}
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-yellow-400">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium uppercase tracking-wider">
                    Filtered
                  </p>
                  <p className="text-3xl font-bold mt-2">
                    {filteredUsers.length}
                  </p>
                  <p className="text-yellow-100 text-xs mt-1">
                    Search results
                  </p>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 shadow-2xl rounded-2xl border border-gray-700">
          {error && (
            <div className="p-4 bg-red-900/30 border-l-4 border-red-400">
              <p className="text-red-200">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-300 hover:text-red-100 underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Controls Section */}
          <div className="p-6 border-b border-gray-600">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="flex-1">
                  <Input
                    type="text"
                    placeholder="Search users by name, email, or company..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="w-full"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={filters.roleFilter}
                    onChange={(e) => setFilters(prev => ({ ...prev, roleFilter: e.target.value }))}
                    className="px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-700 text-white"
                  >
                    <option value="">All Roles</option>
                    {getAvailableRoles().map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                  <select
                    value={`${filters.sortBy}-${filters.sortOrder}`}
                    onChange={(e) => {
                      const [sortBy, sortOrder] = e.target.value.split('-') as [typeof filters.sortBy, typeof filters.sortOrder];
                      setFilters(prev => ({ ...prev, sortBy, sortOrder }));
                    }}
                    className="px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-700 text-white"
                  >
                    <option value="created_at-desc">Newest First</option>
                    <option value="created_at-asc">Oldest First</option>
                    <option value="name-asc">Name A-Z</option>
                    <option value="name-desc">Name Z-A</option>
                    <option value="email-asc">Email A-Z</option>
                    <option value="email-desc">Email Z-A</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button onClick={loadData} className="bg-gray-600 hover:bg-gray-700">
                  Refresh
                </Button>
                {selectedUsers.size > 0 && (
                  <Button
                    onClick={() => setShowBulkActions(true)}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Bulk Actions ({selectedUsers.size})
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-600">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={filteredUsers.length > 0 && selectedUsers.size === filteredUsers.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Roles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-600">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className={selectedUsers.has(user.id) ? 'bg-purple-900/30' : 'hover:bg-gray-700/50'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(user.id)}
                        onChange={(e) => handleSelectUser(user.id, e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-white">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-300">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <div>{user.phone || 'No phone'}</div>
                      <div>{user.company || 'No company'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((role) => (
                          <span
                            key={role}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
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
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setPermissionsViewer({ userId: user.id, userName: user.name })}
                          className="text-green-400 hover:text-green-300"
                        >
                          Permissions
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(user.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400">
                  <div className="text-4xl mb-4">👥</div>
                  <p className="text-lg text-white">No users found</p>
                  <p className="text-sm">Try adjusting your search or filter criteria</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Edit User Modal */}
        {editingUser && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-75 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-6 border border-gray-600 w-full max-w-2xl shadow-2xl rounded-2xl bg-gray-800">
              <h3 className="text-xl font-bold text-white mb-6">Edit User</h3>
              
              {/* User Profile Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Name *
                  </label>
                  <Input
                    type="text"
                    value={editingUser.name}
                    onChange={(e) => handleUserFieldChange('name', e.target.value)}
                    className="w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Email *
                  </label>
                  <Input
                    type="email"
                    value={editingUser.email}
                    onChange={(e) => handleUserFieldChange('email', e.target.value)}
                    className="w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Phone
                  </label>
                  <Input
                    type="tel"
                    value={editingUser.phone || ''}
                    onChange={(e) => handleUserFieldChange('phone', e.target.value || null)}
                    className="w-full"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Company
                  </label>
                  <Input
                    type="text"
                    value={editingUser.company || ''}
                    onChange={(e) => handleUserFieldChange('company', e.target.value || null)}
                    className="w-full"
                    placeholder="Optional"
                  />
                </div>
              </div>

              {/* Roles Section */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-white mb-3">Roles</h4>
                <div className="grid grid-cols-2 gap-3">
                  {getAvailableRoles().map((role) => (
                    <label key={role} className="flex items-center p-3 border border-gray-600 rounded-lg hover:bg-gray-700">
                      <input
                        type="checkbox"
                        checked={editingUser.roles.includes(role)}
                        onChange={() => handleRoleToggle(role)}
                        className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-200 capitalize">{role}</span>
                        {roles.find(r => r.name === role)?.description && (
                          <p className="text-xs text-gray-400">
                            {roles.find(r => r.name === role)?.description}
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  onClick={() => setEditingUser(null)}
                  className="bg-gray-500 hover:bg-gray-600"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveUser}
                  disabled={!editingUser.name.trim() || !editingUser.email.trim()}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Actions Modal */}
        {showBulkActions && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-75 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-6 border border-gray-600 w-full max-w-md shadow-2xl rounded-2xl bg-gray-800">
              <h3 className="text-lg font-bold text-white mb-4">
                Bulk Actions ({selectedUsers.size} users)
              </h3>
              
              <div className="space-y-4">
                {/* Bulk Role Assignment */}
                <div>
                  <h4 className="font-semibold text-white mb-2">Assign Roles</h4>
                  <div className="space-y-2">
                    {getAvailableRoles().map((role) => (
                      <label key={role} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={bulkRoles.includes(role)}
                          onChange={() => handleBulkRoleToggle(role)}
                          className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-200 capitalize">{role}</span>
                      </label>
                    ))}
                  </div>
                  <Button
                    onClick={handleBulkUpdateRoles}
                    disabled={bulkRoles.length === 0}
                    className="mt-3 w-full"
                  >
                    Update Roles
                  </Button>
                </div>

                <hr />

                {/* Bulk Delete */}
                <div>
                  <h4 className="font-semibold text-white mb-2">Danger Zone</h4>
                  <Button
                    onClick={handleBulkDelete}
                    className="w-full bg-red-600 hover:bg-red-700"
                  >
                    Delete Selected Users
                  </Button>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <Button
                  onClick={() => {
                    setShowBulkActions(false);
                    setBulkRoles([]);
                  }}
                  className="bg-gray-500 hover:bg-gray-600"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Permissions Viewer */}
        {permissionsViewer && (
          <UserPermissionsViewer
            userId={permissionsViewer.userId}
            userName={permissionsViewer.userName}
            onClose={() => setPermissionsViewer(null)}
          />
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-75 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border border-gray-600 w-96 shadow-2xl rounded-2xl bg-gray-800">
              <h3 className="text-lg font-bold text-white mb-4">Confirm Delete</h3>
              <p className="text-gray-300 mb-6">
                Are you sure you want to delete this user? This action cannot be undone.
              </p>

              <div className="flex justify-end space-x-3">
                <Button
                  onClick={() => setDeleteConfirm(null)}
                  className="bg-gray-500 hover:bg-gray-600"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleDeleteUser(deleteConfirm)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete User
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}