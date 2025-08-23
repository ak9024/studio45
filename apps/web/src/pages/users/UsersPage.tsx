import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { type User } from "@/types/api.types"
import { adminService } from "@/services/api"
import { toast } from "sonner"
import { UserFormDialog } from "@/components/users/UserFormDialog"
import { UsersDataTable } from "@/components/users/UsersDataTable"

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await adminService.getUsers()
      if (response) {
        // Handle the actual API format: {total: 2, users: [...]}
        const users = (response as any)?.users || (response.data as any)?.users || response.data?.data || []
        setUsers(users)
      } else {
        toast.error('Failed to load users - no response')
      }
    } catch (error: any) {
      console.error('Error loading users:', error)
      toast.error(error.response?.data?.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      const response = await adminService.deleteUser(userId)
      if (response.success) {
        setUsers(users.filter(user => user.id !== userId))
        toast.success('User deleted successfully')
      } else {
        toast.error(response.message || 'Failed to delete user')
      }
    } catch (error: any) {
      console.error('Error deleting user:', error)
      toast.error(error.response?.data?.message || 'Failed to delete user')
    }
  }

  const handleAddUser = () => {
    setSelectedUser(null)
    setDialogOpen(true)
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setDialogOpen(true)
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setSelectedUser(null)
  }

  const handleDialogSuccess = () => {
    loadUsers()
  }


  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Users</h2>
            <p className="text-muted-foreground">
              Manage and view all users in your system.
            </p>
          </div>
          <Button onClick={handleAddUser}>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
          </CardHeader>
          <CardContent>
            <UsersDataTable
              users={users}
              loading={loading}
              onEditUser={handleEditUser}
              onDeleteUser={handleDeleteUser}
            />
          </CardContent>
        </Card>

        <UserFormDialog
          open={dialogOpen}
          onOpenChange={handleDialogClose}
          user={selectedUser}
          onSuccess={handleDialogSuccess}
        />
      </div>
    </DashboardLayout>
  )
}