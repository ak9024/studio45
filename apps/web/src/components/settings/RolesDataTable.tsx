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
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
  Shield, 
  ArrowUpDown, 
  Copy,
  Key
} from "lucide-react"
import { type Role, type Permission } from "@/types/api.types"
import { adminService } from "@/services/api"
import { toast } from "sonner"

interface RoleWithPermissionCount extends Role {
  permissionCount: number
  permissions: Permission[]
}

interface RolesDataTableProps {
  roles: Role[]
  loading: boolean
  onEditRole: (role: Role) => void
  onDeleteRole: (roleId: string) => void
  onManagePermissions: (role: Role) => void
  onDuplicateRole?: (role: Role) => void
}

export function RolesDataTable({ 
  roles, 
  loading, 
  onEditRole, 
  onDeleteRole, 
  onManagePermissions,
  onDuplicateRole
}: RolesDataTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<keyof Role | 'permissionCount' | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [rolesWithPermissions, setRolesWithPermissions] = useState<RoleWithPermissionCount[]>([])
  const [loadingPermissions, setLoadingPermissions] = useState(false)

  // Load permissions for roles
  useEffect(() => {
    if (roles.length > 0) {
      loadRolePermissions()
    }
  }, [roles])

  const loadRolePermissions = async () => {
    setLoadingPermissions(true)
    try {
      const rolesWithPerms = await Promise.all(
        roles.map(async (role) => {
          try {
            const response = await adminService.getRolePermissions(role.id)
            const permissions = (response as any)?.permissions || 
                               (response as any).data?.permissions || 
                               (response as any).data || 
                               response || []
            return {
              ...role,
              permissions: Array.isArray(permissions) ? permissions : [],
              permissionCount: Array.isArray(permissions) ? permissions.length : 0
            }
          } catch (error) {
            console.error(`Error loading permissions for role ${role.id}:`, error)
            return {
              ...role,
              permissions: [],
              permissionCount: 0
            }
          }
        })
      )
      setRolesWithPermissions(rolesWithPerms)
    } catch (error) {
      console.error('Error loading role permissions:', error)
    } finally {
      setLoadingPermissions(false)
    }
  }

  const filteredRoles = rolesWithPermissions.filter(role => 
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const sortedRoles = [...filteredRoles].sort((a, b) => {
    if (!sortField) return 0
    
    let aValue: any = a[sortField as keyof RoleWithPermissionCount]
    let bValue: any = b[sortField as keyof RoleWithPermissionCount]
    
    // Handle permission count sorting
    if (sortField === 'permissionCount') {
      aValue = a.permissionCount
      bValue = b.permissionCount
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
    }
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    }
    
    return 0
  })

  const handleSort = (field: keyof Role | 'permissionCount') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }


  const handleDuplicateRole = async (role: Role) => {
    if (onDuplicateRole) {
      onDuplicateRole(role)
    } else {
      toast.info('Duplicate functionality not implemented')
    }
  }

  const SortableHeader = ({ field, children }: { field: keyof Role | 'permissionCount'; children: React.ReactNode }) => (
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
            placeholder="Search roles..."
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
        <div className="text-sm text-muted-foreground">
          {roles.length} role{roles.length !== 1 ? 's' : ''} total
          {searchTerm && (
            <span>, {filteredRoles.length} matching search</span>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search roles..."
            className="pl-10 w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>


      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">
                <SortableHeader field="name">Name</SortableHeader>
              </TableHead>
              <TableHead>
                <SortableHeader field="description">Description</SortableHeader>
              </TableHead>
              <TableHead className="w-[150px]">
                <SortableHeader field="permissionCount">Permissions</SortableHeader>
              </TableHead>
              <TableHead>
                <SortableHeader field="created_at">Created</SortableHeader>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedRoles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  {searchTerm ? 'No roles found matching your search.' : 'No roles found.'}
                </TableCell>
              </TableRow>
            ) : (
              sortedRoles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span>{role.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[300px] truncate text-sm text-muted-foreground">
                      {role.description}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {loadingPermissions ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                      ) : (
                        <>
                          <Badge variant="secondary" className="text-xs">
                            <Key className="mr-1 h-3 w-3" />
                            {role.permissionCount}
                          </Badge>
                          {role.permissions.length > 0 && (
                            <div className="flex gap-1 max-w-[200px] overflow-hidden">
                              {role.permissions.slice(0, 3).map((perm) => (
                                <Badge key={perm.id} variant="outline" className="text-xs">
                                  {perm.action}
                                </Badge>
                              ))}
                              {role.permissions.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{role.permissions.length - 3}
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
                      {new Date(role.created_at).toLocaleDateString()}
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
                        <DropdownMenuItem onClick={() => onEditRole(role)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Role
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onManagePermissions(role)}>
                          <Shield className="mr-2 h-4 w-4" />
                          Manage Permissions
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicateRole(role)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate Role
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600" 
                          onClick={() => onDeleteRole(role.id)}
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