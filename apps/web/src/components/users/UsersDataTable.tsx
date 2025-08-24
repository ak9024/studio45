import { useState } from "react"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Search, Edit, Trash2, ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react"
import { type User } from "@/types/api.types"
import { Pagination } from "@/components/ui/pagination"

interface UsersDataTableProps {
  users: User[]
  loading: boolean
  onEditUser: (user: User) => void
  onDeleteUser: (userId: string) => void
  // Pagination props
  currentPage?: number
  totalPages?: number
  totalUsers?: number
  pageSize?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  // Sorting props
  sortField?: string
  sortDirection?: 'asc' | 'desc'
  onSort?: (field: string) => void
}

export function UsersDataTable({ 
  users, 
  loading, 
  onEditUser, 
  onDeleteUser,
  currentPage = 1,
  totalPages = 1,
  totalUsers = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  sortField = 'created_at',
  sortDirection = 'desc',
  onSort
}: UsersDataTableProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Handle search with pagination reset
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    // Reset to first page when searching if pagination is enabled
    if (onPageChange && value !== searchTerm) {
      onPageChange(1)
    }
  }

  // Use filtered users directly (no client-side sorting since we do server-side sorting)
  const displayUsers = filteredUsers

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'user': return 'bg-blue-100 text-blue-800'
      case 'crew': return 'bg-green-100 text-green-800'
      case 'extra': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const SortableHeader = ({ field, children }: { field: string; children: React.ReactNode }) => {
    const isActive = sortField === field
    const isAsc = isActive && sortDirection === 'asc'
    const isDesc = isActive && sortDirection === 'desc'
    
    return (
      <Button
        variant="ghost"
        onClick={() => onSort && onSort(field)}
        className={`h-auto p-0 font-medium justify-start ${
          isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
        }`}
        disabled={!onSort}
      >
        {children}
        <div className="ml-2 flex h-4 w-4 items-center justify-center">
          {isAsc && <ChevronUp className="h-3 w-3" />}
          {isDesc && <ChevronDown className="h-3 w-3" />}
          {!isActive && <ArrowUpDown className="h-3 w-3 opacity-50" />}
        </div>
      </Button>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search users..."
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
          {totalUsers > 0 ? (
            <>
              {totalUsers} user{totalUsers !== 1 ? 's' : ''} total
              {searchTerm && (
                <span>, {displayUsers.length} matching search on this page</span>
              )}
            </>
          ) : (
            <>
              {users.length} user{users.length !== 1 ? 's' : ''} on this page
              {searchTerm && (
                <span>, {displayUsers.length} matching search</span>
              )}
            </>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search users..."
            className="pl-10 w-64"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">
                <SortableHeader field="name">User</SortableHeader>
              </TableHead>
              <TableHead>
                <SortableHeader field="email">Email</SortableHeader>
              </TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>
                <SortableHeader field="created_at">Created</SortableHeader>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  {searchTerm ? 'No users found matching your search.' : 'No users found.'}
                </TableCell>
              </TableRow>
            ) : (
              displayUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} />
                        <AvatarFallback>
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{user.email}</div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {user.phone && (
                        <div className="text-sm text-muted-foreground">{user.phone}</div>
                      )}
                      {user.company && (
                        <div className="text-sm text-muted-foreground">{user.company}</div>
                      )}
                      {!user.phone && !user.company && (
                        <div className="text-sm text-muted-foreground">-</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {user.roles.map((role) => (
                        <Badge key={role} className={getRoleColor(role)}>
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
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
                        <DropdownMenuItem onClick={() => onEditUser(user)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600" 
                          onClick={() => onDeleteUser(user.id)}
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

      {/* Pagination */}
      {onPageChange && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalUsers}
          itemsPerPage={pageSize}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      )}
    </div>
  )
}