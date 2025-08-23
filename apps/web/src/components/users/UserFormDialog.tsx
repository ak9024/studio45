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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { type User, type CreateUserRequest, type UpdateUserRequest, type Role } from "@/types/api.types"
import { adminService } from "@/services/api"
import { toast } from "sonner"

interface UserFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: User | null
  onSuccess: () => void
}

export function UserFormDialog({ open, onOpenChange, user, onSuccess }: UserFormDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    company: '',
    roles: [] as string[],
  })
  const [loading, setLoading] = useState(false)
  const [roles, setRoles] = useState<Role[]>([])
  const [loadingRoles, setLoadingRoles] = useState(false)

  const isEditMode = !!user

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '',
        phone: user.phone || '',
        company: user.company || '',
        roles: user.roles || [],
      })
    } else {
      setFormData({
        name: '',
        email: '',
        password: '',
        phone: '',
        company: '',
        roles: [],
      })
    }
  }, [user])

  useEffect(() => {
    if (open) {
      loadRoles()
    }
  }, [open])

  const loadRoles = async () => {
    try {
      setLoadingRoles(true)
      const response = await adminService.getRoles()
      if (response) {
        // Handle the actual API format, similar to users API
        const rolesData = (response as any)?.roles || response.data || response
        if (Array.isArray(rolesData)) {
          setRoles(rolesData)
        } else {
          console.warn('Roles API returned unexpected format:', response)
          setRoles([])
        }
      } else {
        setRoles([])
      }
    } catch (error) {
      console.error('Error loading roles:', error)
      toast.error('Failed to load roles. Some features may be limited.')
      setRoles([])
    } finally {
      setLoadingRoles(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error('Name and email are required')
      return
    }

    if (!isEditMode && !formData.password.trim()) {
      toast.error('Password is required for new users')
      return
    }

    setLoading(true)

    try {
      if (isEditMode && user) {
        const updateData: UpdateUserRequest = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone || undefined,
          company: formData.company || undefined,
        }

        const response = await adminService.updateUser(user.id, updateData)
        
        if (response.success || response) {
          if (JSON.stringify(formData.roles) !== JSON.stringify(user.roles)) {
            await adminService.updateUserRoles(user.id, { roles: formData.roles })
          }
          toast.success('User updated successfully')
          onSuccess()
          onOpenChange(false)
        } else {
          toast.error('Failed to update user')
        }
      } else {
        const createData: CreateUserRequest = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone || undefined,
          company: formData.company || undefined,
          roles: formData.roles,
        }

        const response = await adminService.createUser(createData)
        
        if (response.success || response) {
          toast.success('User created successfully')
          onSuccess()
          onOpenChange(false)
        } else {
          toast.error('Failed to create user')
        }
      }
    } catch (error: any) {
      console.error('Error saving user:', error)
      toast.error(error.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} user`)
    } finally {
      setLoading(false)
    }
  }

  const handleRoleToggle = (roleValue: string) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(roleValue)
        ? prev.roles.filter(r => r !== roleValue)
        : [...prev.roles, roleValue]
    }))
  }

  const removeRole = (roleValue: string) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.filter(r => r !== roleValue)
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit User' : 'Add New User'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update user information and roles.'
              : 'Create a new user account with roles and permissions.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter full name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
                required
              />
            </div>
          </div>

          {!isEditMode && (
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Enter password"
                required
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter phone number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                placeholder="Enter company name"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Roles</Label>
            <div className="space-y-3">
              {formData.roles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.roles.map((role) => (
                    <Badge key={role} variant="secondary" className="flex items-center gap-1">
                      {role}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-destructive"
                        onClick={() => removeRole(role)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
              
              <Select onValueChange={handleRoleToggle}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingRoles ? "Loading roles..." : "Select roles..."} />
                </SelectTrigger>
                <SelectContent>
                  {loadingRoles ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      Loading roles...
                    </div>
                  ) : roles.length > 0 ? (
                    roles.map((role) => (
                      <SelectItem
                        key={role.id}
                        value={role.name}
                        disabled={formData.roles.includes(role.name)}
                      >
                        {role.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No roles available
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
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
            <Button type="submit" disabled={loading}>
              {loading
                ? isEditMode ? 'Updating...' : 'Creating...'
                : isEditMode ? 'Update User' : 'Create User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}