import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { type Role, type Permission, type AssignPermissionsRequest } from "@/types/api.types"
import { adminService } from "@/services/api"
import { toast } from "sonner"
import { Shield, Key } from "lucide-react"

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

  useEffect(() => {
    if (open && role) {
      loadData()
    }
  }, [open, role])

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
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
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
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="text-sm font-medium">
                Select Permissions ({selectedPermissions.length} of {permissions.length} selected)
              </div>
              
              {permissions.length === 0 ? (
                <Card>
                  <CardContent className="py-6">
                    <div className="text-center text-muted-foreground">
                      No permissions available. Create some permissions first.
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-3 max-h-96 overflow-y-auto">
                  {permissions.map((permission) => (
                    <Card key={permission.id} className="p-3">
                      <div className="flex items-start space-x-3">
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
                            className="flex items-center gap-2 font-medium cursor-pointer"
                          >
                            <Key className="h-4 w-4 text-muted-foreground" />
                            {permission.name}
                          </Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs font-mono">
                              {permission.resource}
                            </Badge>
                            <Badge variant="secondary" className="text-xs font-mono">
                              {permission.action}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {permission.description}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
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
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}