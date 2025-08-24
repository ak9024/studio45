import { useState, useEffect, useMemo } from 'react'
import { adminService } from '@/services/api'
import { type Role, type Permission, type User } from '@/types/api.types'
import { toast } from 'sonner'

export interface RBACNode {
  id: string
  type: 'user' | 'role' | 'permission'
  position: { x: number; y: number }
  data: {
    label: string
    entity: User | Role | Permission
    connections: string[]
    statistics: {
      userCount?: number
      roleCount?: number
      permissionCount?: number
    }
  }
}

export interface RBACEdge {
  id: string
  source: string
  target: string
  type: 'user-role' | 'role-permission'
  label?: string
  animated?: boolean
  style?: {
    stroke?: string
    strokeWidth?: number
  }
}

export interface RBACData {
  nodes: RBACNode[]
  edges: RBACEdge[]
  statistics: {
    totalUsers: number
    totalRoles: number
    totalPermissions: number
    totalConnections: number
  }
}

export function useRBACData() {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [rolePermissions, setRolePermissions] = useState<Record<string, Permission[]>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load all RBAC data
  const loadRBACData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('🔍 Starting RBAC data load...')
      
      // Load users, roles, and permissions in parallel
      const [usersResponse, rolesResponse, permissionsResponse] = await Promise.all([
        adminService.getUsers(),
        adminService.getRoles(),
        adminService.getPermissions()
      ])

      console.log('📊 Raw API responses:', {
        users: usersResponse,
        roles: rolesResponse,
        permissions: permissionsResponse
      })

      // Process users
      const usersData = Array.isArray(usersResponse?.data) 
        ? usersResponse.data 
        : Array.isArray(usersResponse) 
        ? usersResponse 
        : []
      console.log('👥 Processed users data:', usersData.length, 'users')
      setUsers(usersData)

      // Process roles  
      const rolesData = (rolesResponse as any)?.roles || 
                       (rolesResponse as any)?.data?.roles || 
                       (rolesResponse as any)?.data || 
                       rolesResponse || []
      const rolesList = Array.isArray(rolesData) ? rolesData : []
      console.log('🛡️ Processed roles data:', rolesList.length, 'roles')
      setRoles(rolesList)

      // Process permissions
      const permissionsData = (permissionsResponse as any)?.permissions || 
                             (permissionsResponse as any)?.data?.permissions || 
                             (permissionsResponse as any)?.data || 
                             permissionsResponse || []
      const permissionsList = Array.isArray(permissionsData) ? permissionsData : []
      console.log('🔑 Processed permissions data:', permissionsList.length, 'permissions')
      setPermissions(permissionsList)

      // Load role-permission relationships
      const rolePermissionsMap: Record<string, Permission[]> = {}
      console.log('🔗 Loading role-permission relationships for', rolesList.length, 'roles...')
      
      await Promise.all(
        rolesList.map(async (role: Role) => {
          try {
            const response = await adminService.getRolePermissions(role.id)
            const rolePerms = (response as any)?.permissions || 
                             (response as any)?.data?.permissions || 
                             (response as any)?.data || 
                             response || []
            const rolePermsList = Array.isArray(rolePerms) ? rolePerms : []
            rolePermissionsMap[role.id] = rolePermsList
            console.log(`  ✅ Role "${role.name}" has ${rolePermsList.length} permissions`)
          } catch (error) {
            console.error(`❌ Error loading permissions for role ${role.id} (${role.name}):`, error)
            rolePermissionsMap[role.id] = []
          }
        })
      )
      setRolePermissions(rolePermissionsMap)
      
      console.log('✅ RBAC data load completed successfully!')
      console.log('📈 Final counts:', {
        users: usersData.length,
        roles: rolesList.length,
        permissions: permissionsList.length,
        rolePermissionMappings: Object.keys(rolePermissionsMap).length
      })

      // If no data found, generate some demo data for testing
      if (usersData.length === 0 && rolesList.length === 0 && permissionsList.length === 0) {
        console.log('🎭 No RBAC data found, creating demo data for testing...')
        
        // Create demo data
        const demoUsers = [
          { id: '1', name: 'John Doe', email: 'john@example.com', roles: ['admin', 'user'] },
          { id: '2', name: 'Jane Smith', email: 'jane@example.com', roles: ['user'] }
        ]
        
        const demoRoles = [
          { id: 'admin', name: 'Administrator', description: 'Full system access' },
          { id: 'user', name: 'User', description: 'Basic user access' }
        ]
        
        const demoPermissions = [
          { id: '1', name: 'Manage Users', resource: 'users', action: 'admin', description: 'Can manage all users' },
          { id: '2', name: 'View Dashboard', resource: 'dashboard', action: 'read', description: 'Can view dashboard' }
        ]
        
        setUsers(demoUsers as any[])
        setRoles(demoRoles as any[])
        setPermissions(demoPermissions as any[])
        setRolePermissions({
          'admin': demoPermissions,
          'user': [demoPermissions[1]]
        } as any)
        
        console.log('✅ Demo data created successfully')
      }

    } catch (err) {
      console.error('❌ Error loading RBAC data:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to load RBAC data'
      setError(errorMessage)
      toast.error(`Failed to load RBAC data: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    loadRBACData()
  }, [])

  // Transform data into diagram format
  const diagramData: RBACData = useMemo(() => {
    console.log('🎨 Computing diagram data from:', {
      users: users.length,
      roles: roles.length, 
      permissions: permissions.length,
      rolePermissions: Object.keys(rolePermissions).length
    })
    
    const nodes: RBACNode[] = []
    const edges: RBACEdge[] = []
    let nodeY = 100
    const spacing = 200

    // Create user nodes
    users.forEach((user, index) => {
      nodes.push({
        id: `user-${user.id}`,
        type: 'user',
        position: { x: 100, y: nodeY + (index * spacing) },
        data: {
          label: user.name,
          entity: user,
          connections: user.roles,
          statistics: {
            roleCount: user.roles.length
          }
        }
      })

      // Create user-role edges
      user.roles.forEach(roleId => {
        edges.push({
          id: `user-role-${user.id}-${roleId}`,
          source: `user-${user.id}`,
          target: `role-${roleId}`,
          type: 'user-role',
          label: 'assigned to',
          style: {
            stroke: '#3b82f6',
            strokeWidth: 2
          }
        })
      })
    })

    // Create role nodes
    roles.forEach((role, index) => {
      const usersWithRole = users.filter(user => user.roles.includes(role.id))
      const rolePerms = rolePermissions[role.id] || []
      
      nodes.push({
        id: `role-${role.id}`,
        type: 'role',
        position: { x: 500, y: nodeY + (index * spacing) },
        data: {
          label: role.name,
          entity: role,
          connections: [...usersWithRole.map(u => u.id), ...rolePerms.map(p => p.id)],
          statistics: {
            userCount: usersWithRole.length,
            permissionCount: rolePerms.length
          }
        }
      })

      // Create role-permission edges
      rolePerms.forEach(permission => {
        edges.push({
          id: `role-permission-${role.id}-${permission.id}`,
          source: `role-${role.id}`,
          target: `permission-${permission.id}`,
          type: 'role-permission',
          label: 'grants',
          style: {
            stroke: '#10b981',
            strokeWidth: 2
          }
        })
      })
    })

    // Create permission nodes
    permissions.forEach((permission, index) => {
      const rolesWithPermission = roles.filter(role => 
        (rolePermissions[role.id] || []).some(p => p.id === permission.id)
      )
      
      nodes.push({
        id: `permission-${permission.id}`,
        type: 'permission',
        position: { x: 900, y: nodeY + (index * spacing) },
        data: {
          label: `${permission.resource}:${permission.action}`,
          entity: permission,
          connections: rolesWithPermission.map(r => r.id),
          statistics: {
            roleCount: rolesWithPermission.length
          }
        }
      })
    })

    const result = {
      nodes,
      edges,
      statistics: {
        totalUsers: users.length,
        totalRoles: roles.length,
        totalPermissions: permissions.length,
        totalConnections: edges.length
      }
    }
    
    console.log('📊 Generated diagram data:', {
      nodes: result.nodes.length,
      edges: result.edges.length,
      statistics: result.statistics
    })
    
    return result
  }, [users, roles, permissions, rolePermissions])

  // Helper functions for filtering
  const getFilteredData = (filters: {
    entityType?: 'user' | 'role' | 'permission'
    searchTerm?: string
    roleId?: string
    resourceType?: string
  }) => {
    const { entityType, searchTerm = '', roleId, resourceType } = filters
    
    let filteredNodes = [...diagramData.nodes]
    let filteredEdges = [...diagramData.edges]

    // Filter by entity type
    if (entityType) {
      filteredNodes = filteredNodes.filter(node => node.type === entityType)
      filteredEdges = filteredEdges.filter(edge => 
        filteredNodes.some(n => n.id === edge.source) && 
        filteredNodes.some(n => n.id === edge.target)
      )
    }

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filteredNodes = filteredNodes.filter(node => 
        node.data.label.toLowerCase().includes(searchLower) ||
        (node.type === 'user' && (node.data.entity as User).email?.toLowerCase().includes(searchLower)) ||
        (node.type === 'permission' && (node.data.entity as Permission).description?.toLowerCase().includes(searchLower))
      )
      filteredEdges = filteredEdges.filter(edge => 
        filteredNodes.some(n => n.id === edge.source) && 
        filteredNodes.some(n => n.id === edge.target)
      )
    }

    // Filter by specific role
    if (roleId) {
      const connectedNodes = new Set([`role-${roleId}`])
      
      // Add connected users and permissions
      filteredEdges.forEach(edge => {
        if (edge.source === `role-${roleId}`) connectedNodes.add(edge.target)
        if (edge.target === `role-${roleId}`) connectedNodes.add(edge.source)
      })
      
      filteredNodes = filteredNodes.filter(node => connectedNodes.has(node.id))
      filteredEdges = filteredEdges.filter(edge => 
        connectedNodes.has(edge.source) && connectedNodes.has(edge.target)
      )
    }

    // Filter by resource type
    if (resourceType) {
      filteredNodes = filteredNodes.filter(node => 
        node.type !== 'permission' || 
        (node.data.entity as Permission).resource === resourceType
      )
      filteredEdges = filteredEdges.filter(edge => 
        filteredNodes.some(n => n.id === edge.source) && 
        filteredNodes.some(n => n.id === edge.target)
      )
    }

    return { nodes: filteredNodes, edges: filteredEdges }
  }

  // Get highlighted nodes for a specific entity
  const getHighlightedNodes = (nodeId: string) => {
    const highlightedNodes = new Set([nodeId])
    const highlightedEdges = new Set<string>()
    
    diagramData.edges.forEach(edge => {
      if (edge.source === nodeId) {
        highlightedNodes.add(edge.target)
        highlightedEdges.add(edge.id)
      }
      if (edge.target === nodeId) {
        highlightedNodes.add(edge.source)
        highlightedEdges.add(edge.id)
      }
    })
    
    return {
      nodes: Array.from(highlightedNodes),
      edges: Array.from(highlightedEdges)
    }
  }

  return {
    diagramData,
    loading,
    error,
    refetch: loadRBACData,
    getFilteredData,
    getHighlightedNodes,
    rawData: {
      users,
      roles,
      permissions,
      rolePermissions
    }
  }
}