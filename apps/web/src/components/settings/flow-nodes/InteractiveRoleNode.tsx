import { Handle, Position, type NodeProps } from 'reactflow'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, Users, Key } from 'lucide-react'
import { type Role } from '@/types/api.types'

interface RoleNodeData {
  label: string
  entity: Role
  connections: string[]
  statistics: {
    userCount?: number
    permissionCount?: number
  }
  isHighlighted?: boolean
  isSelected?: boolean
}

export function InteractiveRoleNode({ data, selected }: NodeProps<RoleNodeData>) {
  const role = data.entity
  const { userCount = 0, permissionCount = 0 } = data.statistics
  
  return (
    <div className="relative">
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-green-500"
        style={{ borderRadius: '50%' }}
      />
      
      <Card 
        className={`
          min-w-[220px] p-4 transition-all duration-300 cursor-pointer transform
          ${selected || data.isSelected ? 'ring-2 ring-green-500 shadow-lg scale-105' : 'shadow-md hover:shadow-lg hover:scale-102'}
          ${data.isHighlighted ? 'bg-green-50 border-green-300 shadow-green-100' : 'bg-white border-gray-200 hover:border-green-200'}
        `}
      >
        <div className="flex items-center gap-3">
          <div className={`
            p-2 rounded-lg flex-shrink-0
            ${data.isHighlighted ? 'bg-green-100' : 'bg-green-50'}
          `}>
            <Shield className="h-5 w-5 text-green-600" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm text-gray-900 truncate">
              {role.name}
            </div>
            <div className="text-xs text-gray-500 line-clamp-2">
              {role.description}
            </div>
          </div>
        </div>
        
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge 
              variant={userCount > 0 ? "default" : "secondary"} 
              className="text-xs px-2 py-1"
            >
              <Users className="h-3 w-3 mr-1" />
              {userCount}
            </Badge>
            
            <Badge 
              variant={permissionCount > 0 ? "default" : "secondary"} 
              className="text-xs px-2 py-1"
            >
              <Key className="h-3 w-3 mr-1" />
              {permissionCount}
            </Badge>
          </div>
          
          <div className="text-xs text-gray-400">
            Role
          </div>
        </div>
        
        {/* Status indicators */}
        <div className="mt-2 flex items-center gap-1">
          <div className={`
            w-2 h-2 rounded-full 
            ${userCount > 0 ? 'bg-blue-400' : 'bg-gray-300'}
          `} title={`${userCount} users assigned`} />
          <div className={`
            w-2 h-2 rounded-full 
            ${permissionCount > 0 ? 'bg-orange-400' : 'bg-gray-300'}
          `} title={`${permissionCount} permissions granted`} />
        </div>
        
        {/* Connection indicator */}
        {data.connections.length > 0 && (
          <div className="absolute -top-1 -right-1">
            <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </div>
        )}
      </Card>
      
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-green-500"
        style={{ borderRadius: '50%' }}
      />
    </div>
  )
}