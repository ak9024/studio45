import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, Plus, RotateCcw, Database, Mail } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { type Role, type Permission, type EmailTemplate } from "@/types/api.types"
import { adminService } from "@/services/api"
import { toast } from "sonner"
import { RolesDataTable } from "@/components/settings/RolesDataTable"
import { RoleFormDialog } from "@/components/settings/RoleFormDialog"
import { PermissionsDataTable } from "@/components/settings/PermissionsDataTable"
import { PermissionFormDialog } from "@/components/settings/PermissionFormDialog"
import { RolePermissionsDialog } from "@/components/settings/RolePermissionsDialog"
import { EmailTemplatesDataTable } from "@/components/settings/EmailTemplatesDataTable"
import { EmailTemplateFormDialog } from "@/components/settings/EmailTemplateFormDialog"
import { EmailTemplatePreviewDialog } from "@/components/settings/EmailTemplatePreviewDialog"
import { EmailTemplateTestDialog } from "@/components/settings/EmailTemplateTestDialog"
import { TemplateVariablesInfo } from "@/components/settings/TemplateVariablesInfo"

export function SettingsPage() {
  useAuth()
  
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

  // Email Templates state
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([])
  const [emailTemplatesLoading, setEmailTemplatesLoading] = useState(false)
  const [selectedEmailTemplate, setSelectedEmailTemplate] = useState<EmailTemplate | null>(null)
  const [emailTemplateDialogOpen, setEmailTemplateDialogOpen] = useState(false)
  const [emailTemplatePreviewDialogOpen, setEmailTemplatePreviewDialogOpen] = useState(false)
  const [emailTemplateTestDialogOpen, setEmailTemplateTestDialogOpen] = useState(false)


  useEffect(() => {
    loadRoles()
    loadPermissions()
    loadEmailTemplates()
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

  const loadEmailTemplates = async () => {
    try {
      setEmailTemplatesLoading(true)
      const response = await adminService.getEmailTemplates()
      console.log('Email Templates API response:', response) // Debug log
      
      let templatesData: EmailTemplate[] = []
      if (response) {
        // Try multiple possible response formats (matching working patterns)
        const data = (response as any)?.templates || 
                     (response as any).data?.templates || 
                     (response as any).data || 
                     response
        
        if (Array.isArray(data)) {
          templatesData = data
        } else {
          console.warn('Unexpected email templates response format:', response)
        }
      }
      
      setEmailTemplates(templatesData)
    } catch (error: any) {
      console.error('Error loading email templates:', error)
      toast.error('Failed to load email templates')
      setEmailTemplates([])
    } finally {
      setEmailTemplatesLoading(false)
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

  // Email Template handlers
  const handleAddEmailTemplate = () => {
    setSelectedEmailTemplate(null)
    setEmailTemplateDialogOpen(true)
  }

  const handleEditEmailTemplate = (template: EmailTemplate) => {
    setSelectedEmailTemplate(template)
    setEmailTemplateDialogOpen(true)
  }

  const handleDeleteEmailTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this email template? This action cannot be undone.')) return

    try {
      const response = await adminService.deleteEmailTemplate(templateId)
      
      // Handle different possible response formats
      const responseAny = response as any
      
      // Check for success message or successful response structure
      if ((responseAny && responseAny.message) || 
          (response && response.success) || 
          (response && response.data) || 
          response) {
        setEmailTemplates(emailTemplates.filter(template => template.id !== templateId))
        toast.success('Email template deleted successfully')
      } else {
        toast.error('Failed to delete email template')
      }
    } catch (error: any) {
      console.error('Error deleting email template:', error)
      toast.error(error.response?.data?.message || 'Failed to delete email template')
    }
  }

  const handlePreviewEmailTemplate = (template: EmailTemplate) => {
    setSelectedEmailTemplate(template)
    setEmailTemplatePreviewDialogOpen(true)
  }

  const handleTestEmailTemplate = (template: EmailTemplate) => {
    setSelectedEmailTemplate(template)
    setEmailTemplateTestDialogOpen(true)
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

  const handleEmailTemplateDialogClose = () => {
    setEmailTemplateDialogOpen(false)
    setSelectedEmailTemplate(null)
  }

  const handleEmailTemplatePreviewDialogClose = () => {
    setEmailTemplatePreviewDialogOpen(false)
    setSelectedEmailTemplate(null)
  }

  const handleEmailTemplateTestDialogClose = () => {
    setEmailTemplateTestDialogOpen(false)
    setSelectedEmailTemplate(null)
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

  const handleEmailTemplateSuccess = () => {
    loadEmailTemplates()
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

        <Tabs defaultValue="security" className="space-y-4">
          <TabsList>
            <TabsTrigger value="security">
              <Shield className="mr-2 h-4 w-4" />
              RBAC
            </TabsTrigger>
            <TabsTrigger value="email">
              <Mail className="mr-2 h-4 w-4" />
              Email Templates
            </TabsTrigger>
          </TabsList>


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


          <TabsContent value="email" className="space-y-6">
            {/* Email Templates Management */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Email Templates
                    </CardTitle>
                    <CardDescription>
                      Manage and customize email templates for your application
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadEmailTemplates}
                      disabled={emailTemplatesLoading}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Refresh
                    </Button>
                    <Button onClick={handleAddEmailTemplate} size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Template
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <EmailTemplatesDataTable
                  templates={emailTemplates}
                  loading={emailTemplatesLoading}
                  onEditTemplate={handleEditEmailTemplate}
                  onDeleteTemplate={handleDeleteEmailTemplate}
                  onPreviewTemplate={handlePreviewEmailTemplate}
                  onTestTemplate={handleTestEmailTemplate}
                />
              </CardContent>
            </Card>

            {/* Template Variables Documentation */}
            <TemplateVariablesInfo />
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

        <EmailTemplateFormDialog
          open={emailTemplateDialogOpen}
          onOpenChange={handleEmailTemplateDialogClose}
          template={selectedEmailTemplate}
          onSuccess={handleEmailTemplateSuccess}
          onPreviewTemplate={handlePreviewEmailTemplate}
          onEditTemplate={handleEditEmailTemplate}
        />

        <EmailTemplatePreviewDialog
          open={emailTemplatePreviewDialogOpen}
          onOpenChange={handleEmailTemplatePreviewDialogClose}
          template={selectedEmailTemplate}
        />

        <EmailTemplateTestDialog
          open={emailTemplateTestDialogOpen}
          onOpenChange={handleEmailTemplateTestDialogClose}
          template={selectedEmailTemplate}
        />
      </div>
    </DashboardLayout>
  )
}