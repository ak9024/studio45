import { useState, useEffect, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { type Role, type Permission, type AssignPermissionsRequest } from "@/types/api.types"
import { adminService } from "@/services/api"
import { toast } from "sonner"
import { 
  Shield, 
  Key, 
  Search, 
  ChevronDown, 
  ChevronRight, 
  Filter,
  Zap,
  Database,
  Users,
  Settings,
  FileText,
  Mail
} from "lucide-react"

interface RolePermissionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: Role | null
  onSuccess: () => void
}

export function RolePermissionsDialog({ open, onOpenChange, role, onSuccess }: RolePermissionsDialogProps) {
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedResource, setSelectedResource] = useState<string>('')
  const [selectedAction, setSelectedAction] = useState<string>('')
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const [showPermissionTemplates, setShowPermissionTemplates] = useState(false)

  useEffect(() => {
    if (open && role) {
      loadData()
      // Reset filters and expand all groups by default
      setSearchTerm('')
      setSelectedResource('')
      setSelectedAction('')
      setShowPermissionTemplates(false)
    }
  }, [open, role])

  // Group permissions by resource
  const groupedPermissions = useMemo(() => {
    const filtered = permissions.filter(permission => {
      const matchesSearch = searchTerm === '' || 
        permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        permission.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
        permission.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        permission.description.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesResource = selectedResource === '' || permission.resource === selectedResource
      const matchesAction = selectedAction === '' || permission.action === selectedAction
      
      return matchesSearch && matchesResource && matchesAction
    })

    const groups = filtered.reduce((acc, permission) => {
      const resource = permission.resource
      if (!acc[resource]) {
        acc[resource] = []
      }
      acc[resource].push(permission)
      return acc
    }, {} as Record<string, Permission[]>)

    // Sort permissions within each group
    Object.keys(groups).forEach(resource => {
      groups[resource].sort((a, b) => a.action.localeCompare(b.action))
    })

    return groups
  }, [permissions, searchTerm, selectedResource, selectedAction])

  // Get unique values for filters
  const uniqueResources = useMemo(() => 
    [...new Set(permissions.map(p => p.resource))].sort(), [permissions])
  
  const uniqueActions = useMemo(() => 
    [...new Set(permissions.map(p => p.action))].sort(), [permissions])

  // Initialize expanded groups when permissions load
  useEffect(() => {
    const initialExpanded = Object.keys(groupedPermissions).reduce((acc, resource) => {
      acc[resource] = true // Expand all by default
      return acc
    }, {} as Record<string, boolean>)
    setExpandedGroups(initialExpanded)
  }, [groupedPermissions])

  // Permission templates for quick selection
  const permissionTemplates = [
    {
      name: 'Read Only',
      description: 'View-only access to all resources',
      permissions: permissions.filter(p => p.action === 'read')
    },
    {
      name: 'Editor',
      description: 'Read and write access to content',
      permissions: permissions.filter(p => ['read', 'write', 'update'].includes(p.action))
    },
    {
      name: 'Administrator',
      description: 'Full access to all resources',
      permissions: permissions
    },
    {
      name: 'User Manager',
      description: 'Manage users and basic operations',
      permissions: permissions.filter(p => 
        p.resource === 'users' || 
        (p.resource === 'dashboard' && p.action === 'read')
      )
    }
  ]

  const loadData = async () => {
    if (!role) return

    try {
      setLoadingData(true)
      
      // Load all permissions and current role permissions in parallel
      const [permissionsResponse, rolePermissionsResponse] = await Promise.all([
        adminService.getPermissions(),
        adminService.getRolePermissions(role.id)
      ])

      console.log('Permissions response in dialog:', permissionsResponse) // Debug log
      console.log('Role permissions response in dialog:', rolePermissionsResponse) // Debug log

      // Handle permissions response (using flexible parsing)
      let allPermissions: Permission[] = []
      if (permissionsResponse) {
        const data = (permissionsResponse as any)?.permissions || 
                     (permissionsResponse as any).data?.permissions || 
                     (permissionsResponse as any).data || 
                     permissionsResponse
        
        if (Array.isArray(data)) {
          allPermissions = data
        } else {
          console.warn('Unexpected permissions response format in dialog:', permissionsResponse)
        }
      }
      setPermissions(allPermissions)

      // Handle role permissions response (using flexible parsing)
      let rolePermissions: Permission[] = []
      if (rolePermissionsResponse) {
        const data = (rolePermissionsResponse as any)?.permissions || 
                     (rolePermissionsResponse as any).data?.permissions || 
                     (rolePermissionsResponse as any).data || 
                     rolePermissionsResponse
        
        if (Array.isArray(data)) {
          rolePermissions = data
        } else {
          console.warn('Unexpected role permissions response format in dialog:', rolePermissionsResponse)
        }
      }

      // Set selected permissions based on current role permissions
      const selectedIds = rolePermissions.map(p => p.id)
      setSelectedPermissions(selectedIds)
      
    } catch (error: any) {
      console.error('Error loading permissions:', error)
      toast.error('Failed to load permissions')
      setPermissions([])
      setSelectedPermissions([])
    } finally {
      setLoadingData(false)
    }
  }

  const handlePermissionToggle = (permissionId: string, checked: boolean) => {
    if (checked) {
      setSelectedPermissions(prev => [...prev, permissionId])
    } else {
      setSelectedPermissions(prev => prev.filter(id => id !== permissionId))
    }
  }

  const handleGroupToggle = (resource: string, checked: boolean) => {
    const groupPermissions = groupedPermissions[resource] || []
    const groupPermissionIds = groupPermissions.map(p => p.id)
    
    if (checked) {
      // Add all permissions in this group
      setSelectedPermissions(prev => {
        const newSelected = [...prev]
        groupPermissionIds.forEach(id => {
          if (!newSelected.includes(id)) {
            newSelected.push(id)
          }
        })
        return newSelected
      })
    } else {
      // Remove all permissions in this group
      setSelectedPermissions(prev => 
        prev.filter(id => !groupPermissionIds.includes(id))
      )
    }
  }

  const handleTemplateApply = (templatePermissions: Permission[]) => {
    const templateIds = templatePermissions.map(p => p.id)
    setSelectedPermissions(templateIds)
    setShowPermissionTemplates(false)
    toast.success(`Applied template with ${templateIds.length} permissions`)
  }

  const toggleGroupExpansion = (resource: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [resource]: !prev[resource]
    }))
  }

  const isGroupSelected = (resource: string) => {
    const groupPermissions = groupedPermissions[resource] || []
    if (groupPermissions.length === 0) return false
    
    const selectedInGroup = groupPermissions.filter(p => selectedPermissions.includes(p.id)).length
    return selectedInGroup === groupPermissions.length
  }


  // Get resource icon
  const getResourceIcon = (resource: string) => {
    const iconMap: Record<string, any> = {
      users: Users,
      dashboard: Settings,
      admin: Shield,
      database: Database,
      email: Mail,
      content: FileText,
      system: Zap
    }
    const IconComponent = iconMap[resource.toLowerCase()] || Key
    return <IconComponent className="h-4 w-4" />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!role) return

    setLoading(true)

    try {
      const data: AssignPermissionsRequest = {
        permission_ids: selectedPermissions
      }

      const response = await adminService.updateRolePermissions(role.id, data)
      
      if (response.success || response) {
        toast.success('Role permissions updated successfully')
        onSuccess()
        onOpenChange(false)
      } else {
        toast.error('Failed to update role permissions')
      }
    } catch (error: any) {
      console.error('Error updating role permissions:', error)
      toast.error(error.response?.data?.message || 'Failed to update role permissions')
    } finally {
      setLoading(false)
    }
  }

  if (!role) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Manage Permissions for "{role.name}"
          </DialogTitle>
          <DialogDescription>
            Select the permissions that users with the "{role.name}" role should have.
          </DialogDescription>
        </DialogHeader>

        {loadingData ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-hidden flex flex-col">
            {/* Header with stats and templates */}
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">
                Select Permissions ({selectedPermissions.length} of {permissions.length} selected)
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPermissionTemplates(!showPermissionTemplates)}
              >
                <Zap className="mr-2 h-4 w-4" />
                Templates
              </Button>
            </div>

            {/* Permission Templates */}
            {showPermissionTemplates && (
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Permission Templates</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-2">
                    {permissionTemplates.map((template) => (
                      <Button
                        key={template.name}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-auto p-3 flex flex-col items-start"
                        onClick={() => handleTemplateApply(template.permissions)}
                      >
                        <div className="font-medium text-sm">{template.name}</div>
                        <div className="text-xs text-muted-foreground text-left">
                          {template.description}
                        </div>
                        <Badge variant="secondary" className="text-xs mt-1">
                          {template.permissions.length} permissions
                        </Badge>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Search and Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search permissions..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Resource {selectedResource && `(${selectedResource})`}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Filter by Resource</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSelectedResource('')}>
                    All Resources
                  </DropdownMenuItem>
                  {uniqueResources.map(resource => (
                    <DropdownMenuItem key={resource} onClick={() => setSelectedResource(resource)}>
                      {getResourceIcon(resource)}
                      <span className="ml-2">{resource}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Action {selectedAction && `(${selectedAction})`}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Filter by Action</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSelectedAction('')}>
                    All Actions
                  </DropdownMenuItem>
                  {uniqueActions.map(action => (
                    <DropdownMenuItem key={action} onClick={() => setSelectedAction(action)}>
                      {action}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
              
            {permissions.length === 0 ? (
              <Card>
                <CardContent className="py-6">
                  <div className="text-center text-muted-foreground">
                    No permissions available. Create some permissions first.
                  </div>
                </CardContent>
              </Card>
            ) : Object.keys(groupedPermissions).length === 0 ? (
              <Card>
                <CardContent className="py-6">
                  <div className="text-center text-muted-foreground">
                    No permissions match your search criteria.
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="flex-1 overflow-auto max-h-[400px]">
                  <div className="space-y-3">
                    {Object.entries(groupedPermissions).map(([resource, resourcePermissions]) => (
                      <Card key={resource}>
                        <Collapsible
                          open={expandedGroups[resource]}
                          onOpenChange={() => toggleGroupExpansion(resource)}
                        >
                          <CollapsibleTrigger asChild>
                            <CardHeader className="pb-3 cursor-pointer hover:bg-gray-50">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Checkbox
                                    checked={isGroupSelected(resource)}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                                      handleGroupToggle(resource, e.target.checked)
                                    }
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  {getResourceIcon(resource)}
                                  <div>
                                    <CardTitle className="text-sm font-medium capitalize">
                                      {resource}
                                    </CardTitle>
                                    <p className="text-xs text-muted-foreground">
                                      {resourcePermissions.length} permission{resourcePermissions.length !== 1 ? 's' : ''}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {resourcePermissions.filter(p => selectedPermissions.includes(p.id)).length} selected
                                  </Badge>
                                  {expandedGroups[resource] ? 
                                    <ChevronDown className="h-4 w-4" /> : 
                                    <ChevronRight className="h-4 w-4" />
                                  }
                                </div>
                              </div>
                            </CardHeader>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <CardContent className="pt-0">
                              <div className="space-y-2">
                                {resourcePermissions.map((permission) => (
                                  <div key={permission.id} className="flex items-start space-x-3 p-2 rounded hover:bg-gray-50">
                                    <Checkbox
                                      id={`permission-${permission.id}`}
                                      checked={selectedPermissions.includes(permission.id)}
                                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                                        handlePermissionToggle(permission.id, e.target.checked)
                                      }
                                    />
                                    <div className="flex-1 min-w-0">
                                      <Label 
                                        htmlFor={`permission-${permission.id}`}
                                        className="flex items-center gap-2 font-medium cursor-pointer text-sm"
                                      >
                                        <Key className="h-3 w-3 text-muted-foreground" />
                                        {permission.name}
                                      </Label>
                                      <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="secondary" className="text-xs font-mono">
                                          {permission.action}
                                        </Badge>
                                      </div>
                                      <div className="text-xs text-muted-foreground mt-1">
                                        {permission.description}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </CollapsibleContent>
                        </Collapsible>
                      </Card>
                    ))}
                  </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                {Object.keys(groupedPermissions).length} resource group{Object.keys(groupedPermissions).length !== 1 ? 's' : ''} • 
                {permissions.filter(p => 
                  (searchTerm === '' || 
                   p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   p.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   p.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   p.description.toLowerCase().includes(searchTerm.toLowerCase())) &&
                  (selectedResource === '' || p.resource === selectedResource) &&
                  (selectedAction === '' || p.action === selectedAction)
                ).length} permission{permissions.length !== 1 ? 's' : ''} shown
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading || permissions.length === 0}
                >
                  {loading ? 'Updating...' : 'Update Permissions'}
                </Button>
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}