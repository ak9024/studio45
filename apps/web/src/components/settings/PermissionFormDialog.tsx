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
import { type Permission, type CreatePermissionRequest, type UpdatePermissionRequest } from "@/types/api.types"
import { adminService } from "@/services/api"
import { toast } from "sonner"

interface PermissionFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  permission?: Permission | null
  onSuccess: () => void
}

export function PermissionFormDialog({ open, onOpenChange, permission, onSuccess }: PermissionFormDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    resource: '',
    action: '',
    description: '',
  })
  const [loading, setLoading] = useState(false)

  const isEditMode = !!permission

  useEffect(() => {
    if (permission) {
      setFormData({
        name: permission.name || '',
        resource: permission.resource || '',
        action: permission.action || '',
        description: permission.description || '',
      })
    } else {
      setFormData({
        name: '',
        resource: '',
        action: '',
        description: '',
      })
    }
  }, [permission])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Permission name is required')
      return
    }

    if (!formData.resource.trim()) {
      toast.error('Resource is required')
      return
    }

    if (!formData.action.trim()) {
      toast.error('Action is required')
      return
    }

    if (!formData.description.trim()) {
      toast.error('Permission description is required')
      return
    }

    setLoading(true)

    try {
      if (isEditMode && permission) {
        const updateData: UpdatePermissionRequest = {
          name: formData.name,
          resource: formData.resource,
          action: formData.action,
          description: formData.description,
        }

        const response = await adminService.updatePermission(permission.id, updateData)
        
        if (response.success || response) {
          toast.success('Permission updated successfully')
          onSuccess()
          onOpenChange(false)
        } else {
          toast.error('Failed to update permission')
        }
      } else {
        const createData: CreatePermissionRequest = {
          name: formData.name,
          resource: formData.resource,
          action: formData.action,
          description: formData.description,
        }

        const response = await adminService.createPermission(createData)
        
        if (response.success || response) {
          toast.success('Permission created successfully')
          onSuccess()
          onOpenChange(false)
        } else {
          toast.error('Failed to create permission')
        }
      }
    } catch (error: any) {
      console.error('Error saving permission:', error)
      toast.error(error.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} permission`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Permission' : 'Create New Permission'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the permission information below.'
              : 'Create a new permission with a name and description.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Permission Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Create Users, Edit Posts, View Analytics"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="resource">Resource *</Label>
              <Input
                id="resource"
                value={formData.resource}
                onChange={(e) => setFormData(prev => ({ ...prev, resource: e.target.value }))}
                placeholder="e.g., users, posts, analytics"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="action">Action *</Label>
              <Input
                id="action"
                value={formData.action}
                onChange={(e) => setFormData(prev => ({ ...prev, action: e.target.value }))}
                placeholder="e.g., create, read, update, delete"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what this permission allows..."
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
                : isEditMode ? 'Update Permission' : 'Create Permission'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}