import { useState, useCallback, useMemo, useEffect } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow'
import type { Node, Edge, NodeTypes } from 'reactflow'
import 'reactflow/dist/style.css'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Users, 
  Search, 
  RefreshCw,
  Filter,
  Layout
} from 'lucide-react'

import { RoleNode, UserNode } from './flow-nodes'
import type { Role, User } from '@/types/api.types'

interface UserRoleFlowDesignerProps {
  roles: Role[]
  users: User[]
  loading: boolean
  onRefresh: () => void
}

export function UserRoleFlowDesigner({
  roles,
  users,
  loading,
  onRefresh
}: UserRoleFlowDesignerProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState<string | null>(null)

  // Custom node types
  const nodeTypes: NodeTypes = useMemo(() => ({
    roleNode: RoleNode,
    userNode: UserNode,
  }), [])

  // Filter users based on search and selected role
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = searchTerm === '' || 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.company?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesRole = !selectedRole || user.roles.includes(selectedRole)
      
      return matchesSearch && matchesRole
    })
  }, [users, searchTerm, selectedRole])

  // Generate flow visualization
  const generateFlowData = useCallback(() => {
    const newNodes: Node[] = []
    const newEdges: Edge[] = []

    // Create role nodes on the right side
    roles.forEach((role, index) => {
      const userCount = users.filter(user => user.roles.includes(role.name)).length
      
      newNodes.push({
        id: `role-${role.id}`,
        type: 'roleNode',
        position: { x: 600, y: 100 + index * 180 },
        data: { 
          role, 
          userCount,
          isHighlighted: selectedRole === role.name
        },
      })
    })

    // Create user nodes on the left side
    filteredUsers.forEach((user, index) => {
      newNodes.push({
        id: `user-${user.id}`,
        type: 'userNode',
        position: { x: 50, y: 100 + index * 120 },
        data: { 
          user,
          showDetails: filteredUsers.length <= 10 // Show details only when not too many users
        },
      })

      // Create edges from users to their roles
      user.roles.forEach(roleName => {
        const role = roles.find(r => r.name === roleName)
        if (role) {
          newEdges.push({
            id: `user-${user.id}-role-${role.id}`,
            source: `user-${user.id}`,
            target: `role-${role.id}`,
            type: 'smoothstep',
            animated: selectedRole === roleName,
            style: { 
              strokeWidth: selectedRole === roleName ? 3 : 2,
              stroke: selectedRole === roleName ? '#8b5cf6' : '#6b7280'
            },
            markerEnd: { type: MarkerType.ArrowClosed },
          })
        }
      })
    })

    setNodes(newNodes)
    setEdges(newEdges)
  }, [roles, filteredUsers, selectedRole])

  useEffect(() => {
    generateFlowData()
  }, [generateFlowData])

  const handleLayoutNodes = () => {
    // Re-generate layout with better spacing
    generateFlowData()
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedRole(null)
  }

  const getStats = () => {
    const totalConnections = edges.length
    const usersWithRoles = filteredUsers.filter(user => user.roles.length > 0).length
    const usersWithoutRoles = filteredUsers.filter(user => user.roles.length === 0).length
    
    return { totalConnections, usersWithRoles, usersWithoutRoles }
  }

  const stats = getStats()

  if (loading) {
    return (
      <Card className="h-[600px]">
        <CardContent className="flex items-center justify-center h-full">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading user role assignments...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-[700px]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Role Assignment Flow
            </CardTitle>
            <CardDescription>
              Visual mapping of users to their assigned roles
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline">{stats.totalConnections} connections</Badge>
            <Badge variant="default">{stats.usersWithRoles} assigned</Badge>
            <Badge variant="secondary">{stats.usersWithoutRoles} unassigned</Badge>
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search users by name, email, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <select
            value={selectedRole || ''}
            onChange={(e) => setSelectedRole(e.target.value || null)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Roles</option>
            {roles.map(role => (
              <option key={role.id} value={role.name}>
                {role.name}
              </option>
            ))}
          </select>

          <Button variant="outline" size="sm" onClick={clearFilters}>
            <Filter className="h-4 w-4" />
            Clear
          </Button>
          
          <Button variant="outline" size="sm" onClick={handleLayoutNodes}>
            <Layout className="h-4 w-4" />
          </Button>
        </div>

        {filteredUsers.length !== users.length && (
          <div className="text-sm text-gray-500">
            Showing {filteredUsers.length} of {users.length} users
            {selectedRole && ` with role "${selectedRole}"`}
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0 h-[580px]">
        {filteredUsers.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p>No users found matching your criteria</p>
              <Button variant="outline" className="mt-2" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={{
              type: 'smoothstep',
              markerEnd: { type: MarkerType.ArrowClosed },
            }}
            fitView
            className="bg-gray-50"
            panOnDrag={true}
            zoomOnDoubleClick={true}
          >
            <Background color="#e5e7eb" gap={20} />
            <Controls showInteractive={false} />
            <MiniMap 
              nodeColor={(node) => {
                switch (node.type) {
                  case 'roleNode': return '#3b82f6'
                  case 'userNode': return '#8b5cf6'
                  default: return '#6b7280'
                }
              }}
              className="bg-white border border-gray-200"
            />
          </ReactFlow>
        )}
      </CardContent>
    </Card>
  )
}