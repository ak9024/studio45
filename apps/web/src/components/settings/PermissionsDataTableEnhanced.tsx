import { useState, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  MoreHorizontal, 
  Search, 
  Edit, 
  Trash2, 
  Key, 
  ArrowUpDown, 
  Shield, 
  Users,
  Filter,
  ChevronDown,
  CheckSquare,
  Square
} from "lucide-react"
import { type Permission, type Role } from "@/types/api.types"
import { adminService } from "@/services/api"
import { toast } from "sonner"

interface PermissionWithRoleUsage extends Permission {
  usedByRoles: Role[]
  roleCount: number
}

interface PermissionsDataTableProps {
  permissions: Permission[]
  loading: boolean
  onEditPermission: (permission: Permission) => void
  onDeletePermission: (permissionId: string) => void
  onBulkDelete?: (permissionIds: string[]) => void
}

export function PermissionsDataTable({ 
  permissions, 
  loading, 
  onEditPermission, 
  onDeletePermission,
  onBulkDelete
}: PermissionsDataTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<keyof Permission | 'roleCount' | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [permissionsWithRoles, setPermissionsWithRoles] = useState<PermissionWithRoleUsage[]>([])
  const [loadingRoles, setLoadingRoles] = useState(false)
  const [resourceFilter, setResourceFilter] = useState<string>('')
  const [actionFilter, setActionFilter] = useState<string>('')
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [showBulkActions, setShowBulkActions] = useState(false)

  // Load role usage information for permissions
  useEffect(() => {
    if (permissions.length > 0) {
      loadPermissionRoleUsage()
    }
  }, [permissions])

  const loadPermissionRoleUsage = async () => {
    setLoadingRoles(true)
    try {
      // First, load all roles
      const rolesResponse = await adminService.getRoles()
      const allRoles = (rolesResponse as any)?.roles || 
                      (rolesResponse as any).data?.roles || 
                      (rolesResponse as any).data || 
                      rolesResponse || []
      
      const rolesList = Array.isArray(allRoles) ? allRoles : []

      // Then load permissions for each role to determine usage
      const rolePermissionsMap = new Map<string, Permission[]>()
      
      await Promise.all(
        rolesList.map(async (role: Role) => {
          try {
            const response = await adminService.getRolePermissions(role.id)
            const rolePermissions = (response as any)?.permissions || 
                                   (response as any).data?.permissions || 
                                   (response as any).data || 
                                   response || []
            rolePermissionsMap.set(role.id, Array.isArray(rolePermissions) ? rolePermissions : [])
          } catch (error) {
            console.error(`Error loading permissions for role ${role.id}:`, error)
            rolePermissionsMap.set(role.id, [])
          }
        })
      )

      // Build permissions with role usage
      const permissionsWithRoleUsage = permissions.map(permission => {
        const usedByRoles: Role[] = []
        
        rolesList.forEach((role: Role) => {
          const rolePerms = rolePermissionsMap.get(role.id) || []
          if (rolePerms.some(p => p.id === permission.id)) {
            usedByRoles.push(role)
          }
        })

        return {
          ...permission,
          usedByRoles,
          roleCount: usedByRoles.length
        }
      })

      setPermissionsWithRoles(permissionsWithRoleUsage)
    } catch (error) {
      console.error('Error loading permission role usage:', error)
      toast.error('Failed to load role usage information')
    } finally {
      setLoadingRoles(false)
    }
  }

  // Get unique values for filters
  const uniqueResources = [...new Set(permissions.map(p => p.resource))].sort()
  const uniqueActions = [...new Set(permissions.map(p => p.action))].sort()

  const filteredPermissions = permissionsWithRoles.filter(permission => {
    const matchesSearch = searchTerm === '' || 
      permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesResource = resourceFilter === '' || permission.resource === resourceFilter
    const matchesAction = actionFilter === '' || permission.action === actionFilter
    
    return matchesSearch && matchesResource && matchesAction
  })

  const sortedPermissions = [...filteredPermissions].sort((a, b) => {
    if (!sortField) return 0
    
    let aValue: any = a[sortField as keyof PermissionWithRoleUsage]
    let bValue: any = b[sortField as keyof PermissionWithRoleUsage]
    
    // Handle role count sorting
    if (sortField === 'roleCount') {
      aValue = a.roleCount
      bValue = b.roleCount
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
    }
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    }
    
    return 0
  })

  const handleSort = (field: keyof Permission | 'roleCount') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Bulk operations
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPermissions(sortedPermissions.map(perm => perm.id))
    } else {
      setSelectedPermissions([])
    }
  }

  const handleSelectPermission = (permissionId: string, checked: boolean) => {
    if (checked) {
      setSelectedPermissions(prev => [...prev, permissionId])
    } else {
      setSelectedPermissions(prev => prev.filter(id => id !== permissionId))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedPermissions.length === 0) return
    if (confirm(`Are you sure you want to delete ${selectedPermissions.length} permissions?`)) {
      await confirmBulkDelete()
    }
  }

  const confirmBulkDelete = async () => {
    if (onBulkDelete && selectedPermissions.length > 0) {
      await onBulkDelete(selectedPermissions)
      setSelectedPermissions([])
      setShowBulkActions(false)
    }
  }

  const SortableHeader = ({ field, children }: { field: keyof Permission | 'roleCount'; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      onClick={() => handleSort(field)}
      className="h-auto p-0 font-medium text-muted-foreground hover:text-foreground"
    >
      {children}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  )

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search permissions..."
            className="pl-10 w-64"
            disabled
          />
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            {permissions.length} permission{permissions.length !== 1 ? 's' : ''} total
            {(searchTerm || resourceFilter || actionFilter) && (
              <span>, {filteredPermissions.length} matching filters</span>
            )}
          </div>
          <Button
            variant={showBulkActions ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setShowBulkActions(!showBulkActions)
              setSelectedPermissions([])
            }}
          >
            {showBulkActions ? <CheckSquare className="mr-2 h-4 w-4" /> : <Square className="mr-2 h-4 w-4" />}
            Bulk Actions
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {/* Resource Filter */}
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

          {/* Action Filter */}
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

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search permissions..."
              className="pl-10 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              {selectedPermissions.length === 0 ? (
                "Select permissions to perform bulk actions"
              ) : (
                <span>
                  <strong>{selectedPermissions.length}</strong> permission{selectedPermissions.length !== 1 ? 's' : ''} selected
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={selectedPermissions.length === 0}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Selected
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedPermissions([])}
                disabled={selectedPermissions.length === 0}
              >
                Clear Selection
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {showBulkActions && (
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={selectedPermissions.length === sortedPermissions.length && sortedPermissions.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </TableHead>
              )}
              <TableHead className="w-[180px]">
                <SortableHeader field="name">Name</SortableHeader>
              </TableHead>
              <TableHead className="w-[120px]">
                <SortableHeader field="resource">Resource</SortableHeader>
              </TableHead>
              <TableHead className="w-[120px]">
                <SortableHeader field="action">Action</SortableHeader>
              </TableHead>
              <TableHead>
                <SortableHeader field="description">Description</SortableHeader>
              </TableHead>
              <TableHead className="w-[150px]">
                <SortableHeader field="roleCount">Used by Roles</SortableHeader>
              </TableHead>
              <TableHead>
                <SortableHeader field="created_at">Created</SortableHeader>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPermissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showBulkActions ? 8 : 7} className="h-24 text-center">
                  {searchTerm || resourceFilter || actionFilter ? 'No permissions found matching your filters.' : 'No permissions found.'}
                </TableCell>
              </TableRow>
            ) : (
              sortedPermissions.map((permission) => (
                <TableRow key={permission.id}>
                  {showBulkActions && (
                    <TableCell>
                      <Checkbox
                        checked={selectedPermissions.includes(permission.id)}
                        onChange={(e) => handleSelectPermission(permission.id, e.target.checked)}
                      />
                    </TableCell>
                  )}
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      <Key className="h-4 w-4 text-muted-foreground" />
                      <span>{permission.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {permission.resource}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-mono">
                      {permission.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[250px] truncate text-sm text-muted-foreground">
                      {permission.description}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {loadingRoles ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                      ) : (
                        <>
                          <Badge variant={permission.roleCount > 0 ? "default" : "secondary"} className="text-xs">
                            <Users className="mr-1 h-3 w-3" />
                            {permission.roleCount}
                          </Badge>
                          {permission.usedByRoles.length > 0 && (
                            <div className="flex gap-1 max-w-[150px] overflow-hidden">
                              {permission.usedByRoles.slice(0, 2).map((role) => (
                                <Badge key={role.id} variant="outline" className="text-xs">
                                  <Shield className="mr-1 h-2 w-2" />
                                  {role.name}
                                </Badge>
                              ))}
                              {permission.usedByRoles.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{permission.usedByRoles.length - 2}
                                </Badge>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {new Date(permission.created_at).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onEditPermission(permission)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Permission
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600" 
                          onClick={() => onDeletePermission(permission.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

    </div>
  )
}