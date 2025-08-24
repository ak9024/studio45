import { useState, useCallback, useMemo, useEffect } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  MarkerType,
} from 'reactflow'
import type { Node, Edge, Connection, NodeTypes } from 'reactflow'
import 'reactflow/dist/style.css'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Workflow, 
  Layout, 
  RefreshCw,
  Users,
  Shield,
  Key
} from 'lucide-react'

import { RoleNode, PermissionNode, UserNode } from './flow-nodes'
import type { Role, Permission, User } from '@/types/api.types'

interface RolePermissionFlowDesignerProps {
  roles: Role[]
  permissions: Permission[]
  users: User[]
  loading: boolean
  onRefresh: () => void
}

export function RolePermissionFlowDesigner({
  roles,
  permissions, 
  users,
  loading,
  onRefresh
}: RolePermissionFlowDesignerProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedView, setSelectedView] = useState<'roles' | 'permissions' | 'users'>('roles')

  // Custom node types
  const nodeTypes: NodeTypes = useMemo(() => ({
    roleNode: RoleNode,
    permissionNode: PermissionNode,
    userNode: UserNode,
  }), [])

  // Generate nodes and edges based on selected view
  const generateFlowData = useCallback(() => {
    const newNodes: Node[] = []
    const newEdges: Edge[] = []

    if (selectedView === 'roles') {
      // Create role nodes
      roles.forEach((role, index) => {
        const userCount = users.filter(user => user.roles.includes(role.name)).length
        
        newNodes.push({
          id: `role-${role.id}`,
          type: 'roleNode',
          position: { x: 100 + (index % 3) * 250, y: 100 + Math.floor(index / 3) * 200 },
          data: { 
            role, 
            userCount,
            permissionCount: 0 // We'll calculate this when we have role-permission relationships
          },
        })
      })
    } 
    else if (selectedView === 'permissions') {
      // Create permission nodes grouped by resource
      const permissionsByResource = permissions.reduce((acc, permission) => {
        if (!acc[permission.resource]) acc[permission.resource] = []
        acc[permission.resource].push(permission)
        return acc
      }, {} as Record<string, Permission[]>)

      let yOffset = 100
      Object.entries(permissionsByResource).forEach(([, resourcePermissions]) => {
        resourcePermissions.forEach((permission, index) => {
          newNodes.push({
            id: `permission-${permission.id}`,
            type: 'permissionNode',
            position: { x: 100 + index * 200, y: yOffset },
            data: { 
              permission,
              roleCount: 0 // We'll calculate this when we have role-permission relationships
            },
          })
        })
        yOffset += 150
      })
    }
    else if (selectedView === 'users') {
      // Create user nodes
      users.forEach((user, index) => {
        newNodes.push({
          id: `user-${user.id}`,
          type: 'userNode',
          position: { x: 100 + (index % 4) * 280, y: 100 + Math.floor(index / 4) * 180 },
          data: { user },
        })
      })

      // Create edges from users to their roles (if roles are also shown)
      // For now, we'll keep it simple and just show users
    }

    setNodes(newNodes)
    setEdges(newEdges)
  }, [roles, permissions, users, selectedView])

  useEffect(() => {
    generateFlowData()
  }, [generateFlowData])

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const handleLayoutNodes = () => {
    // Simple auto-layout - arrange nodes in a grid
    setNodes((nodes) => 
      nodes.map((node, index) => ({
        ...node,
        position: {
          x: 100 + (index % 4) * 250,
          y: 100 + Math.floor(index / 4) * 200,
        },
      }))
    )
  }

  const getViewStats = () => {
    switch (selectedView) {
      case 'roles':
        return { count: roles.length, label: 'Roles', icon: Shield }
      case 'permissions':  
        return { count: permissions.length, label: 'Permissions', icon: Key }
      case 'users':
        return { count: users.length, label: 'Users', icon: Users }
    }
  }

  const stats = getViewStats()
  const IconComponent = stats.icon

  if (loading) {
    return (
      <Card className="h-[600px]">
        <CardContent className="flex items-center justify-center h-full">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading flow data...</span>
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
              <Workflow className="h-5 w-5" />
              Visual Role & Permission Designer
            </CardTitle>
            <CardDescription>
              Interactive visualization of roles, permissions, and user relationships
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <IconComponent className="h-3 w-3" />
              {stats.count} {stats.label}
            </Badge>
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Tabs value={selectedView} onValueChange={(value: any) => setSelectedView(value)}>
          <div className="flex items-center justify-between">
            <TabsList className="grid w-auto grid-cols-3">
              <TabsTrigger value="roles" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Roles
              </TabsTrigger>
              <TabsTrigger value="permissions" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                Permissions  
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Users
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={handleLayoutNodes}>
                <Layout className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Tabs>
      </CardHeader>

      <CardContent className="p-0 h-[580px]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          defaultEdgeOptions={{
            type: 'smoothstep',
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { strokeWidth: 2 },
          }}
          fitView
          className="bg-gray-50"
        >
          <Background color="#e5e7eb" gap={20} />
          <Controls 
            showInteractive={false}
            className="react-flow__controls"
          />
          <MiniMap 
            nodeColor={(node) => {
              switch (node.type) {
                case 'roleNode': return '#3b82f6'
                case 'permissionNode': return '#10b981'
                case 'userNode': return '#8b5cf6'
                default: return '#6b7280'
              }
            }}
            className="bg-white border border-gray-200"
          />
        </ReactFlow>
      </CardContent>
    </Card>
  )
}