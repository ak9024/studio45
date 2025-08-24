import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Shield, Users, Database, Plus, RotateCcw } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { type Role, type Permission } from "@/types/api.types"
import { adminService } from "@/services/api"
import { toast } from "sonner"
import { RolesDataTable } from "@/components/settings/RolesDataTable"
import { RoleFormDialog } from "@/components/settings/RoleFormDialog"
import { PermissionsDataTable } from "@/components/settings/PermissionsDataTable"
import { PermissionFormDialog } from "@/components/settings/PermissionFormDialog"
import { RolePermissionsDialog } from "@/components/settings/RolePermissionsDialog"

export function SettingsPage() {
  const { user } = useAuth()
  
  // Roles state
  const [roles, setRoles] = useState<Role[]>([])
  const [rolesLoading, setRolesLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
  const [rolePermissionsDialogOpen, setRolePermissionsDialogOpen] = useState(false)
  
  // Permissions state
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [permissionsLoading, setPermissionsLoading] = useState(false)
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null)
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false)

  useEffect(() => {
    loadRoles()
    loadPermissions()
  }, [])

  const loadRoles = async () => {
    try {
      setRolesLoading(true)
      const response = await adminService.getRoles()
      console.log('Roles API response:', response) // Debug log
      
      let rolesData: Role[] = []
      if (response) {
        // Try multiple possible response formats (matching working patterns)
        const data = (response as any)?.roles || 
                     (response as any).data?.roles || 
                     (response as any).data || 
                     response
        
        if (Array.isArray(data)) {
          rolesData = data
        } else {
          console.warn('Unexpected roles response format:', response)
        }
      }
      
      setRoles(rolesData)
    } catch (error: any) {
      console.error('Error loading roles:', error)
      toast.error('Failed to load roles')
      setRoles([])
    } finally {
      setRolesLoading(false)
    }
  }

  const loadPermissions = async () => {
    try {
      setPermissionsLoading(true)
      const response = await adminService.getPermissions()
      console.log('Permissions API response:', response) // Debug log
      
      let permissionsData: Permission[] = []
      if (response) {
        // Try multiple possible response formats (matching working patterns)
        const data = (response as any)?.permissions || 
                     (response as any).data?.permissions || 
                     (response as any).data || 
                     response
        
        if (Array.isArray(data)) {
          permissionsData = data
        } else {
          console.warn('Unexpected permissions response format:', response)
        }
      }
      
      setPermissions(permissionsData)
    } catch (error: any) {
      console.error('Error loading permissions:', error)
      toast.error('Failed to load permissions')
      setPermissions([])
    } finally {
      setPermissionsLoading(false)
    }
  }

  // Role handlers
  const handleAddRole = () => {
    setSelectedRole(null)
    setRoleDialogOpen(true)
  }

  const handleEditRole = (role: Role) => {
    setSelectedRole(role)
    setRoleDialogOpen(true)
  }

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role? This action cannot be undone.')) return

    try {
      const response = await adminService.deleteRole(roleId)
      if (response.success || response) {
        setRoles(roles.filter(role => role.id !== roleId))
        toast.success('Role deleted successfully')
      } else {
        toast.error('Failed to delete role')
      }
    } catch (error: any) {
      console.error('Error deleting role:', error)
      toast.error(error.response?.data?.message || 'Failed to delete role')
    }
  }

  const handleManagePermissions = (role: Role) => {
    setSelectedRole(role)
    setRolePermissionsDialogOpen(true)
  }

  // Permission handlers
  const handleAddPermission = () => {
    setSelectedPermission(null)
    setPermissionDialogOpen(true)
  }

  const handleEditPermission = (permission: Permission) => {
    setSelectedPermission(permission)
    setPermissionDialogOpen(true)
  }

  const handleDeletePermission = async (permissionId: string) => {
    if (!confirm('Are you sure you want to delete this permission? This action cannot be undone.')) return

    try {
      const response = await adminService.deletePermission(permissionId)
      if (response.success || response) {
        setPermissions(permissions.filter(permission => permission.id !== permissionId))
        toast.success('Permission deleted successfully')
      } else {
        toast.error('Failed to delete permission')
      }
    } catch (error: any) {
      console.error('Error deleting permission:', error)
      toast.error(error.response?.data?.message || 'Failed to delete permission')
    }
  }

  // Dialog handlers
  const handleRoleDialogClose = () => {
    setRoleDialogOpen(false)
    setSelectedRole(null)
  }

  const handlePermissionDialogClose = () => {
    setPermissionDialogOpen(false)
    setSelectedPermission(null)
  }

  const handleRolePermissionsDialogClose = () => {
    setRolePermissionsDialogOpen(false)
    setSelectedRole(null)
  }

  const handleRoleSuccess = () => {
    loadRoles()
  }

  const handlePermissionSuccess = () => {
    loadPermissions()
  }

  const handleRolePermissionsSuccess = () => {
    // No need to reload anything, the dialog handles its own state
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Admin Settings</h2>
            <p className="text-muted-foreground">
              Configure system-wide settings and manage application preferences.
            </p>
          </div>
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            <Shield className="mr-1 h-3 w-3" />
            Admin Only
          </Badge>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">
              <Settings className="mr-2 h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="mr-2 h-4 w-4" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="mr-2 h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="system">
              <Database className="mr-2 h-4 w-4" />
              System
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Application Configuration</CardTitle>
                  <CardDescription>
                    Configure global application settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">App Title:</span> {import.meta.env.VITE_APP_TITLE || 'Studio45'}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Environment:</span> {import.meta.env.MODE || 'development'}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">API URL:</span> {import.meta.env.VITE_API_URL || 'Not configured'}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                  <CardDescription>
                    Current system information and status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Status:</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Online
                      </Badge>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Admin User:</span> {user?.name} ({user?.email})
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Roles:</span> {user?.roles?.join(', ')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management Settings</CardTitle>
                <CardDescription>
                  Configure user registration, roles, and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    User management features are available through the Users page. 
                    Additional user settings and bulk operations will be added here.
                  </div>
                  <div className="space-y-2">
                    <div className="font-medium">Available Roles:</div>
                    <div className="flex gap-2 flex-wrap">
                      <Badge>admin</Badge>
                      <Badge variant="secondary">user</Badge>
                      <Badge variant="secondary">crew</Badge>
                      <Badge variant="secondary">extra</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            {/* Roles Management */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Roles Management
                    </CardTitle>
                    <CardDescription>
                      Create and manage user roles in the system
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadRoles}
                      disabled={rolesLoading}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Refresh
                    </Button>
                    <Button onClick={handleAddRole} size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Role
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <RolesDataTable
                  roles={roles}
                  loading={rolesLoading}
                  onEditRole={handleEditRole}
                  onDeleteRole={handleDeleteRole}
                  onManagePermissions={handleManagePermissions}
                />
              </CardContent>
            </Card>

            {/* Permissions Management */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Permissions Management
                    </CardTitle>
                    <CardDescription>
                      Create and manage system permissions
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadPermissions}
                      disabled={permissionsLoading}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Refresh
                    </Button>
                    <Button onClick={handleAddPermission} size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Permission
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <PermissionsDataTable
                  permissions={permissions}
                  loading={permissionsLoading}
                  onEditPermission={handleEditPermission}
                  onDeletePermission={handleDeletePermission}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Configuration</CardTitle>
                <CardDescription>
                  Database, API, and system-level settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    System configuration and maintenance tools will be available here.
                  </div>
                  <div className="space-y-2">
                    <div className="font-medium">System Information:</div>
                    <div className="text-sm space-y-1">
                      <div>Built with React + TypeScript</div>
                      <div>UI Components: shadcn/ui</div>
                      <div>Styling: Tailwind CSS</div>
                      <div>Build Tool: Vite</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog Components */}
        <RoleFormDialog
          open={roleDialogOpen}
          onOpenChange={handleRoleDialogClose}
          role={selectedRole}
          onSuccess={handleRoleSuccess}
        />

        <PermissionFormDialog
          open={permissionDialogOpen}
          onOpenChange={handlePermissionDialogClose}
          permission={selectedPermission}
          onSuccess={handlePermissionSuccess}
        />

        <RolePermissionsDialog
          open={rolePermissionsDialogOpen}
          onOpenChange={handleRolePermissionsDialogClose}
          role={selectedRole}
          onSuccess={handleRolePermissionsSuccess}
        />
      </div>
    </DashboardLayout>
  )
}