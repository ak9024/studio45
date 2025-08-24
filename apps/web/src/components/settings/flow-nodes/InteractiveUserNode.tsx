import { Handle, Position, type NodeProps } from 'reactflow'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, Shield } from 'lucide-react'
import { type User as UserType } from '@/types/api.types'

interface UserNodeData {
  label: string
  entity: UserType
  connections: string[]
  statistics: {
    roleCount?: number
  }
  isHighlighted?: boolean
  isSelected?: boolean
}

export function InteractiveUserNode({ data, selected }: NodeProps<UserNodeData>) {
  const user = data.entity
  const { roleCount = 0 } = data.statistics
  
  return (
    <div className="relative">
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-blue-500"
        style={{ borderRadius: '50%' }}
      />
      
      <Card 
        className={`
          min-w-[200px] p-4 transition-all duration-300 cursor-pointer transform
          ${selected || data.isSelected ? 'ring-2 ring-blue-500 shadow-lg scale-105' : 'shadow-md hover:shadow-lg hover:scale-102'}
          ${data.isHighlighted ? 'bg-blue-50 border-blue-300 shadow-blue-100' : 'bg-white border-gray-200 hover:border-blue-200'}
        `}
      >
        <div className="flex items-center gap-3">
          <div className={`
            p-2 rounded-lg flex-shrink-0
            ${data.isHighlighted ? 'bg-blue-100' : 'bg-blue-50'}
          `}>
            <User className="h-5 w-5 text-blue-600" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm text-gray-900 truncate">
              {user.name}
            </div>
            <div className="text-xs text-gray-500 truncate">
              {user.email}
            </div>
            {user.company && (
              <div className="text-xs text-gray-400 truncate">
                {user.company}
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge 
              variant={roleCount > 0 ? "default" : "secondary"} 
              className="text-xs px-2 py-1"
            >
              <Shield className="h-3 w-3 mr-1" />
              {roleCount} role{roleCount !== 1 ? 's' : ''}
            </Badge>
          </div>
          
          <div className="text-xs text-gray-400">
            User
          </div>
        </div>
        
        {/* Connection indicator */}
        {data.connections.length > 0 && (
          <div className="absolute -top-1 -right-1">
            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </div>
        )}
      </Card>
      
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-blue-500"
        style={{ borderRadius: '50%' }}
      />
    </div>
  )
}