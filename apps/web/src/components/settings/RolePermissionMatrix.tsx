import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Grid, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Shield,
  ChevronDown,
  Check,
  X
} from "lucide-react"
import { type Role, type Permission } from "@/types/api.types"
import { adminService } from "@/services/api"
import { toast } from "sonner"

interface RolePermissionMatrixProps {
  roles: Role[]
  permissions: Permission[]
  loading: boolean
  onRefresh: () => void
}


export function RolePermissionMatrix({
  roles,
  permissions,
  loading,
  onRefresh
}: RolePermissionMatrixProps) {
  const [matrix, setMatrix] = useState<Record<string, boolean>>({})
  const [matrixLoading, setMatrixLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [resourceFilter, setResourceFilter] = useState<string>('')
  const [actionFilter, setActionFilter] = useState<string>('')
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [bulkMode, setBulkMode] = useState(false)

  // Load role-permission relationships
  useEffect(() => {
    if (roles.length > 0 && permissions.length > 0) {
      loadMatrix()
    }
  }, [roles, permissions])

  const loadMatrix = async () => {
    setMatrixLoading(true)
    const newMatrix: Record<string, boolean> = {}

    try {
      // Load permissions for each role
      const rolePermissions = await Promise.all(
        roles.map(async (role) => {
          try {
            const response = await adminService.getRolePermissions(role.id)
            const rolePerms = (response as any)?.permissions || 
                             (response as any).data?.permissions || 
                             (response as any).data || 
                             response || []
            return { roleId: role.id, permissions: Array.isArray(rolePerms) ? rolePerms : [] }
          } catch (error) {
            console.error(`Error loading permissions for role ${role.id}:`, error)
            return { roleId: role.id, permissions: [] }
          }
        })
      )

      // Build matrix
      roles.forEach(role => {
        permissions.forEach(permission => {
          const key = `${role.id}-${permission.id}`
          const rolePerms = rolePermissions.find(rp => rp.roleId === role.id)?.permissions || []
          newMatrix[key] = rolePerms.some(p => p.id === permission.id)
        })
      })

      setMatrix(newMatrix)
    } catch (error) {
      console.error('Error loading role-permission matrix:', error)
      toast.error('Failed to load role-permission matrix')
    } finally {
      setMatrixLoading(false)
    }
  }

  // Filter permissions
  const filteredPermissions = useMemo(() => {
    return permissions.filter(permission => {
      const matchesSearch = searchTerm === '' || 
        permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        permission.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
        permission.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        permission.description.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesResource = resourceFilter === '' || permission.resource === resourceFilter
      const matchesAction = actionFilter === '' || permission.action === actionFilter

      return matchesSearch && matchesResource && matchesAction
    })
  }, [permissions, searchTerm, resourceFilter, actionFilter])

  // Get unique resources and actions for filters
  const uniqueResources = useMemo(() => 
    [...new Set(permissions.map(p => p.resource))].sort(), [permissions]
  )
  const uniqueActions = useMemo(() => 
    [...new Set(permissions.map(p => p.action))].sort(), [permissions]
  )

  // Toggle permission for role
  const togglePermission = async (roleId: string, permissionId: string, currentValue: boolean) => {
    const key = `${roleId}-${permissionId}`
    const newValue = !currentValue

    // Optimistic update
    setMatrix(prev => ({ ...prev, [key]: newValue }))

    try {
      // Get current role permissions
      const response = await adminService.getRolePermissions(roleId)
      const currentPermissions = (response as any)?.permissions || 
                                (response as any).data?.permissions || 
                                (response as any).data || 
                                response || []
      
      const currentPermissionIds = Array.isArray(currentPermissions) 
        ? currentPermissions.map(p => p.id) 
        : []

      // Update permission list
      let newPermissionIds: string[]
      if (newValue) {
        newPermissionIds = [...currentPermissionIds, permissionId]
      } else {
        newPermissionIds = currentPermissionIds.filter(id => id !== permissionId)
      }

      // Update role permissions
      await adminService.updateRolePermissions(roleId, {
        permission_ids: newPermissionIds
      })

      toast.success(`Permission ${newValue ? 'added to' : 'removed from'} role`)
    } catch (error) {
      console.error('Error updating role permission:', error)
      // Revert optimistic update
      setMatrix(prev => ({ ...prev, [key]: currentValue }))
      toast.error('Failed to update permission')
    }
  }

  // Bulk operations
  const handleBulkAssign = async () => {
    if (selectedRoles.length === 0 || selectedPermissions.length === 0) {
      toast.error('Please select roles and permissions for bulk assignment')
      return
    }

    try {
      const updates = selectedRoles.map(async (roleId) => {
        // Get current permissions
        const response = await adminService.getRolePermissions(roleId)
        const currentPermissions = (response as any)?.permissions || 
                                  (response as any).data?.permissions || 
                                  (response as any).data || 
                                  response || []
        
        const currentPermissionIds = Array.isArray(currentPermissions) 
          ? currentPermissions.map(p => p.id) 
          : []

        // Add selected permissions
        const newPermissionIds = [...new Set([...currentPermissionIds, ...selectedPermissions])]

        return adminService.updateRolePermissions(roleId, {
          permission_ids: newPermissionIds
        })
      })

      await Promise.all(updates)

      // Update matrix optimistically
      const newMatrix = { ...matrix }
      selectedRoles.forEach(roleId => {
        selectedPermissions.forEach(permissionId => {
          newMatrix[`${roleId}-${permissionId}`] = true
        })
      })
      setMatrix(newMatrix)

      toast.success(`Assigned ${selectedPermissions.length} permissions to ${selectedRoles.length} roles`)
      setSelectedRoles([])
      setSelectedPermissions([])
    } catch (error) {
      console.error('Error in bulk assignment:', error)
      toast.error('Failed to assign permissions')
    }
  }

  const handleBulkRemove = async () => {
    if (selectedRoles.length === 0 || selectedPermissions.length === 0) {
      toast.error('Please select roles and permissions for bulk removal')
      return
    }

    try {
      const updates = selectedRoles.map(async (roleId) => {
        // Get current permissions
        const response = await adminService.getRolePermissions(roleId)
        const currentPermissions = (response as any)?.permissions || 
                                  (response as any).data?.permissions || 
                                  (response as any).data || 
                                  response || []
        
        const currentPermissionIds = Array.isArray(currentPermissions) 
          ? currentPermissions.map(p => p.id) 
          : []

        // Remove selected permissions
        const newPermissionIds = currentPermissionIds.filter(id => !selectedPermissions.includes(id))

        return adminService.updateRolePermissions(roleId, {
          permission_ids: newPermissionIds
        })
      })

      await Promise.all(updates)

      // Update matrix optimistically
      const newMatrix = { ...matrix }
      selectedRoles.forEach(roleId => {
        selectedPermissions.forEach(permissionId => {
          newMatrix[`${roleId}-${permissionId}`] = false
        })
      })
      setMatrix(newMatrix)

      toast.success(`Removed ${selectedPermissions.length} permissions from ${selectedRoles.length} roles`)
      setSelectedRoles([])
      setSelectedPermissions([])
    } catch (error) {
      console.error('Error in bulk removal:', error)
      toast.error('Failed to remove permissions')
    }
  }

  // Export matrix
  const exportMatrix = () => {
    const csvContent = [
      ['Role', ...filteredPermissions.map(p => `${p.name} (${p.resource}:${p.action})`)],
      ...roles.map(role => [
        role.name,
        ...filteredPermissions.map(permission => 
          matrix[`${role.id}-${permission.id}`] ? 'Yes' : 'No'
        )
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'role-permission-matrix.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading || matrixLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Grid className="h-5 w-5" />
            <CardTitle>Role-Permission Matrix</CardTitle>
          </div>
          <CardDescription>
            Interactive matrix view of role and permission assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Grid className="h-5 w-5" />
              <CardTitle>Role-Permission Matrix</CardTitle>
            </div>
            <CardDescription>
              Interactive matrix view of role and permission assignments
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBulkMode(!bulkMode)}
              className={bulkMode ? "bg-blue-50 text-blue-700" : ""}
            >
              Bulk Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportMatrix}
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search permissions..."
              className="pl-10 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Resource {resourceFilter && `(${resourceFilter})`}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Filter by Resource</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setResourceFilter('')}>
                All Resources
              </DropdownMenuItem>
              {uniqueResources.map(resource => (
                <DropdownMenuItem key={resource} onClick={() => setResourceFilter(resource)}>
                  {resource}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Action {actionFilter && `(${actionFilter})`}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Filter by Action</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setActionFilter('')}>
                All Actions
              </DropdownMenuItem>
              {uniqueActions.map(action => (
                <DropdownMenuItem key={action} onClick={() => setActionFilter(action)}>
                  {action}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {(searchTerm || resourceFilter || actionFilter) && (
            <Badge variant="secondary">
              {filteredPermissions.length} of {permissions.length} permissions shown
            </Badge>
          )}
        </div>

        {/* Bulk Actions */}
        {bulkMode && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <strong>Bulk Mode:</strong> Select roles and permissions, then use actions below
                  <div className="text-muted-foreground">
                    {selectedRoles.length} roles, {selectedPermissions.length} permissions selected
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleBulkAssign}
                    disabled={selectedRoles.length === 0 || selectedPermissions.length === 0}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Assign
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkRemove}
                    disabled={selectedRoles.length === 0 || selectedPermissions.length === 0}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedRoles([])
                      setSelectedPermissions([])
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Matrix Table */}
        <div className="border rounded-lg overflow-auto max-h-[600px]">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="sticky left-0 bg-background z-20 border-r min-w-[200px]">
                    Role
                    {bulkMode && (
                      <div className="mt-1">
                        <Checkbox
                          checked={selectedRoles.length === roles.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRoles(roles.map(r => r.id))
                            } else {
                              setSelectedRoles([])
                            }
                          }}
                        />
                      </div>
                    )}
                  </TableHead>
                  {filteredPermissions.map(permission => (
                    <TableHead key={permission.id} className="text-center min-w-[120px]">
                      <div className="space-y-1">
                        <div className="font-medium text-xs">{permission.name}</div>
                        <div className="flex gap-1 justify-center">
                          <Badge variant="outline" className="text-xs">
                            {permission.resource}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {permission.action}
                          </Badge>
                        </div>
                        {bulkMode && (
                          <Checkbox
                            checked={selectedPermissions.includes(permission.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPermissions(prev => [...prev, permission.id])
                              } else {
                                setSelectedPermissions(prev => prev.filter(id => id !== permission.id))
                              }
                            }}
                          />
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map(role => (
                  <TableRow key={role.id}>
                    <TableCell className="sticky left-0 bg-background border-r font-medium">
                      <div className="flex items-center gap-2">
                        {bulkMode && (
                          <Checkbox
                            checked={selectedRoles.includes(role.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedRoles(prev => [...prev, role.id])
                              } else {
                                setSelectedRoles(prev => prev.filter(id => id !== role.id))
                              }
                            }}
                          />
                        )}
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{role.name}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                            {role.description}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    {filteredPermissions.map(permission => {
                      const key = `${role.id}-${permission.id}`
                      const hasPermission = matrix[key] || false
                      
                      return (
                        <TableCell key={permission.id} className="text-center">
                          <Button
                            variant={hasPermission ? "default" : "outline"}
                            size="sm"
                            className={`h-8 w-8 p-0 ${
                              hasPermission 
                                ? "bg-green-600 hover:bg-green-700" 
                                : "hover:bg-gray-100"
                            }`}
                            onClick={() => togglePermission(role.id, permission.id, hasPermission)}
                          >
                            {hasPermission ? (
                              <Check className="h-4 w-4 text-white" />
                            ) : (
                              <X className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
        </div>

        {/* Summary */}
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <div>
            {roles.length} roles × {filteredPermissions.length} permissions
          </div>
          <div>
            Click matrix cells to toggle permissions • Use bulk mode for multiple operations
          </div>
        </div>
      </CardContent>
    </Card>
  )
}