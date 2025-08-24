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
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalUsers, setTotalUsers] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  
  // Sorting state
  const [sortField, setSortField] = useState<string>('created_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    loadUsers()
  }, [currentPage, pageSize, sortField, sortDirection])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await adminService.getUsers({ 
        page: currentPage, 
        limit: pageSize,
        sort_field: sortField,
        sort_desc: sortDirection === 'desc'
      })
      
      if (response) {
        // Handle paginated API response
        let users, total, page, limit, totalPages
        
        // Check different possible response structures
        const data = (response as any)?.data || response
        
        if (data.users && typeof data.total === 'number') {
          // Direct pagination format: {users: [...], total: 4, page: 1, limit: 10, total_pages: 1}
          users = data.users
          total = data.total
          page = data.page || currentPage
          limit = data.limit || pageSize
          totalPages = data.total_pages || Math.ceil(total / limit)
        } else if (Array.isArray(data.data)) {
          // Nested format: {data: {data: [...], total: 4, ...}}
          users = data.data
          total = data.total || users.length
          page = data.page || currentPage
          limit = data.limit || pageSize
          totalPages = data.total_pages || Math.ceil(total / limit)
        } else {
          // Fallback for legacy format
          users = Array.isArray(data) ? data : []
          total = users.length
          page = 1
          limit = users.length
          totalPages = 1
        }
        
        setUsers(users)
        setTotalUsers(total)
        setCurrentPage(page)
        setPageSize(limit)
        setTotalPages(totalPages)
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
        toast.success('User deleted successfully')
        
        // If this is the only item on the current page and we're not on page 1,
        // go to the previous page
        if (users.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1)
        } else {
          // Reload current page
          loadUsers()
        }
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

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1) // Reset to first page when page size changes
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle sort direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // Set new field and default to ascending
      setSortField(field)
      setSortDirection('asc')
    }
    // Reset to first page when sorting changes
    setCurrentPage(1)
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
              currentPage={currentPage}
              totalPages={totalPages}
              totalUsers={totalUsers}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
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