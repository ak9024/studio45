import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { adminService, ApiError } from '../services/admin.service';
import type { UserManagement } from '../services/admin.service';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../contexts/ToastContext';

const AVAILABLE_ROLES = ['user', 'admin', 'moderator', 'premium'];

interface EditingUser {
  id: string;
  roles: string[];
}

export function AdminDashboard() {
  const { token } = useAuth();
  const { showError, showSuccess } = useToast();
  const [users, setUsers] = useState<UserManagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<EditingUser | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);
      const response = await adminService.getUsers(token);
      setUsers(response.users);
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to load users';
      setError(errorMessage);
      showError('Error Loading Users', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEditRoles = (user: UserManagement) => {
    setEditingUser({
      id: user.id,
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

  const handleSaveRoles = async () => {
    if (!editingUser || !token) return;

    try {
      const updatedUser = await adminService.updateUserRoles(
        token,
        editingUser.id,
        editingUser.roles
      );
      
      setUsers(users.map(user => 
        user.id === updatedUser.id ? updatedUser : user
      ));
      setEditingUser(null);
      showSuccess('Roles Updated', 'User roles have been successfully updated.');
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to update user roles';
      setError(errorMessage);
      showError('Error Updating Roles', errorMessage);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!token) return;

    try {
      await adminService.deleteUser(token, userId);
      setUsers(users.filter(user => user.id !== userId));
      setDeleteConfirm(null);
      showSuccess('User Deleted', 'User has been successfully deleted.');
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to delete user';
      setError(errorMessage);
      showError('Error Deleting User', errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Manage users and their roles</p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-400">
              <p className="text-red-700">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700 underline"
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="p-6">
            <div className="mb-4">
              <Button onClick={loadUsers} className="mb-4">
                Refresh Users
              </Button>
              <p className="text-sm text-gray-600">Total users: {users.length}</p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Roles
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                                  ? 'bg-red-100 text-red-800'
                                  : role === 'moderator'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : role === 'premium'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-green-100 text-green-800'
                              }`}
                            >
                              {role}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEditRoles(user)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit Roles
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(user.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Edit Roles Modal */}
        {editingUser && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Edit User Roles</h3>
              
              <div className="space-y-3 mb-6">
                {AVAILABLE_ROLES.map((role) => (
                  <label key={role} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingUser.roles.includes(role)}
                      onChange={() => handleRoleToggle(role)}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700 capitalize">{role}</span>
                  </label>
                ))}
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  onClick={() => setEditingUser(null)}
                  className="bg-gray-500 hover:bg-gray-600"
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveRoles}>
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Confirm Delete</h3>
              <p className="text-gray-600 mb-6">
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