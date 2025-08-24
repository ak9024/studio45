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
import { Textarea } from "@/components/ui/textarea"
import { type Role, type CreateRoleRequest, type UpdateRoleRequest } from "@/types/api.types"
import { adminService } from "@/services/api"
import { toast } from "sonner"

interface RoleFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role?: Role | null
  onSuccess: () => void
}

export function RoleFormDialog({ open, onOpenChange, role, onSuccess }: RoleFormDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })
  const [loading, setLoading] = useState(false)

  const isEditMode = !!role

  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name || '',
        description: role.description || '',
      })
    } else {
      setFormData({
        name: '',
        description: '',
      })
    }
  }, [role])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Role name is required')
      return
    }

    if (!formData.description.trim()) {
      toast.error('Role description is required')
      return
    }

    setLoading(true)

    try {
      if (isEditMode && role) {
        const updateData: UpdateRoleRequest = {
          name: formData.name,
          description: formData.description,
        }

        const response = await adminService.updateRole(role.id, updateData)
        
        if (response.success || response) {
          toast.success('Role updated successfully')
          onSuccess()
          onOpenChange(false)
        } else {
          toast.error('Failed to update role')
        }
      } else {
        const createData: CreateRoleRequest = {
          name: formData.name,
          description: formData.description,
        }

        const response = await adminService.createRole(createData)
        
        if (response.success || response) {
          toast.success('Role created successfully')
          onSuccess()
          onOpenChange(false)
        } else {
          toast.error('Failed to create role')
        }
      }
    } catch (error: any) {
      console.error('Error saving role:', error)
      toast.error(error.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} role`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Role' : 'Create New Role'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the role information below.'
              : 'Create a new role with a name and description.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Role Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., editor, manager, viewer"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what this role can do..."
              rows={3}
              required
            />
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
                : isEditMode ? 'Update Role' : 'Create Role'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}