import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { adminService, ApiError } from '../services/admin.service';
import type { UserPermission } from '../services/admin.service';
import { Button } from './ui/Button';

interface UserPermissionsViewerProps {
  userId: string;
  userName: string;
  onClose: () => void;
}

export function UserPermissionsViewer({ userId, userName, onClose }: UserPermissionsViewerProps) {
  const { token } = useAuth();
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionToCheck, setPermissionToCheck] = useState('');
  const [checkResult, setCheckResult] = useState<{ hasPermission: boolean; source?: string } | null>(null);

  useEffect(() => {
    loadPermissions();
  }, [userId]);

  const loadPermissions = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);
      const response = await adminService.getUserPermissions(token, userId);
      setPermissions(response.permissions);
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to load permissions';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckPermission = async () => {
    if (!token || !permissionToCheck.trim()) return;

    try {
      const response = await adminService.checkUserPermission(token, userId, permissionToCheck.trim());
      setCheckResult(response);
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to check permission';
      setError(errorMessage);
    }
  };

  const groupPermissionsBySource = () => {
    const grouped: Record<string, UserPermission[]> = {};
    permissions.forEach(permission => {
      if (!grouped[permission.source]) {
        grouped[permission.source] = [];
      }
      grouped[permission.source].push(permission);
    });
    return grouped;
  };

  const getSourceIcon = (source: string) => {
    if (source === 'direct') return '👤';
    return '🏷️'; // Role-based permission
  };

  const getSourceLabel = (source: string) => {
    if (source === 'direct') return 'Direct Assignment';
    return `Role: ${source}`;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-75 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border border-gray-600 w-full max-w-4xl shadow-2xl rounded-2xl bg-gray-800">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border border-gray-600 w-full max-w-4xl shadow-2xl rounded-2xl bg-gray-800">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">
            Permissions for {userName}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-900/30 border-l-4 border-red-400">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Permission Checker */}
        <div className="mb-6 p-4 bg-gray-700 rounded-lg">
          <h4 className="text-lg font-semibold mb-3 text-white">Check Specific Permission</h4>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Permission Name
              </label>
              <input
                type="text"
                value={permissionToCheck}
                onChange={(e) => setPermissionToCheck(e.target.value)}
                className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-800 text-white"
                placeholder="e.g., users.edit, posts.delete"
              />
            </div>
            <Button
              onClick={handleCheckPermission}
              disabled={!permissionToCheck.trim()}
              className="px-4 py-2"
            >
              Check
            </Button>
          </div>
          
          {checkResult && (
            <div className={`mt-3 p-3 rounded-md ${
              checkResult.hasPermission 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-xl">
                  {checkResult.hasPermission ? '✅' : '❌'}
                </span>
                <span className={`font-medium ${
                  checkResult.hasPermission ? 'text-green-800' : 'text-red-800'
                }`}>
                  {checkResult.hasPermission ? 'Permission Granted' : 'Permission Denied'}
                </span>
                {checkResult.source && (
                  <span className="text-sm text-gray-600">
                    (via {checkResult.source})
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Permissions List */}
        <div className="space-y-6">
          <h4 className="text-lg font-semibold text-white">All Permissions ({permissions.length})</h4>
          
          {Object.keys(groupPermissionsBySource()).length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <div className="text-4xl mb-2">🔒</div>
              <p className="text-white">No permissions found for this user</p>
            </div>
          ) : (
            Object.entries(groupPermissionsBySource()).map(([source, sourcePermissions]) => (
              <div key={source} className="border border-gray-600 rounded-lg p-4 bg-gray-700">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-600">
                  <span className="text-xl">{getSourceIcon(source)}</span>
                  <h5 className="font-semibold text-white">
                    {getSourceLabel(source)}
                  </h5>
                  <span className="text-sm text-gray-400">
                    ({sourcePermissions.length} permissions)
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {sourcePermissions.map((permission, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded text-sm ${
                        permission.inherited
                          ? 'bg-blue-900/30 text-blue-200 border border-blue-600'
                          : 'bg-gray-600 text-gray-200 border border-gray-500'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {permission.inherited && (
                          <span className="text-xs">🔗</span>
                        )}
                        <span className="font-mono">{permission.permission}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Legend */}
        <div className="mt-6 p-4 bg-gray-700 rounded-lg">
          <h5 className="font-semibold mb-2 text-white">Legend</h5>
          <div className="space-y-1 text-sm text-gray-300">
            <div className="flex items-center gap-2">
              <span>👤</span>
              <span className="text-gray-300">Direct Assignment - Permissions assigned directly to the user</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🏷️</span>
              <span className="text-gray-300">Role-based - Permissions inherited from user roles</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🔗</span>
              <span className="text-gray-300">Inherited permission from role assignment</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button
            onClick={onClose}
            className="bg-gray-500 hover:bg-gray-600"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}