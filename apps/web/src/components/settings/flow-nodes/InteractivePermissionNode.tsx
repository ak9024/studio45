import { Handle, Position, type NodeProps } from 'reactflow'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Key, Shield, Database, Users, Settings, FileText, Mail, Zap } from 'lucide-react'
import { type Permission } from '@/types/api.types'

interface PermissionNodeData {
  label: string
  entity: Permission
  connections: string[]
  statistics: {
    roleCount?: number
  }
  isHighlighted?: boolean
  isSelected?: boolean
}

// Resource icon mapping
const getResourceIcon = (resource: string) => {
  const iconMap: Record<string, any> = {
    users: Users,
    dashboard: Settings,
    admin: Shield,
    database: Database,
    email: Mail,
    content: FileText,
    system: Zap
  }
  return iconMap[resource.toLowerCase()] || Key
}

// Action color mapping
const getActionColor = (action: string) => {
  const colorMap: Record<string, string> = {
    read: 'text-blue-600',
    write: 'text-green-600',
    update: 'text-yellow-600',
    delete: 'text-red-600',
    create: 'text-purple-600',
    admin: 'text-gray-900'
  }
  return colorMap[action.toLowerCase()] || 'text-gray-600'
}

export function InteractivePermissionNode({ data, selected }: NodeProps<PermissionNodeData>) {
  const permission = data.entity
  const { roleCount = 0 } = data.statistics
  const ResourceIcon = getResourceIcon(permission.resource)
  const actionColor = getActionColor(permission.action)
  
  return (
    <div className="relative">
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-orange-500"
        style={{ borderRadius: '50%' }}
      />
      
      <Card 
        className={`
          min-w-[240px] p-4 transition-all duration-300 cursor-pointer transform
          ${selected || data.isSelected ? 'ring-2 ring-orange-500 shadow-lg scale-105' : 'shadow-md hover:shadow-lg hover:scale-102'}
          ${data.isHighlighted ? 'bg-orange-50 border-orange-300 shadow-orange-100' : 'bg-white border-gray-200 hover:border-orange-200'}
        `}
      >
        <div className="flex items-center gap-3">
          <div className={`
            p-2 rounded-lg flex-shrink-0
            ${data.isHighlighted ? 'bg-orange-100' : 'bg-orange-50'}
          `}>
            <ResourceIcon className="h-5 w-5 text-orange-600" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm text-gray-900 truncate">
              {permission.name}
            </div>
            <div className="text-xs text-gray-500 line-clamp-2">
              {permission.description}
            </div>
          </div>
        </div>
        
        <div className="mt-3 space-y-2">
          {/* Resource and Action */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-mono">
              {permission.resource}
            </Badge>
            <Badge 
              variant="secondary" 
              className={`text-xs font-mono ${actionColor}`}
            >
              {permission.action}
            </Badge>
          </div>
          
          {/* Role usage */}
          <div className="flex items-center justify-between">
            <Badge 
              variant={roleCount > 0 ? "default" : "secondary"} 
              className="text-xs px-2 py-1"
            >
              <Shield className="h-3 w-3 mr-1" />
              {roleCount} role{roleCount !== 1 ? 's' : ''}
            </Badge>
            
            <div className="text-xs text-gray-400">
              Permission
            </div>
          </div>
        </div>
        
        {/* Usage indicator */}
        <div className="mt-2 flex items-center justify-between">
          <div className={`
            w-2 h-2 rounded-full 
            ${roleCount > 0 ? 'bg-green-400' : 'bg-gray-300'}
          `} title={`Used by ${roleCount} roles`} />
          
          {/* Permission scope indicator */}
          <div className="flex items-center gap-1">
            <div className="text-xs text-gray-400">
              {permission.resource}:{permission.action}
            </div>
          </div>
        </div>
        
        {/* Connection indicator */}
        {data.connections.length > 0 && (
          <div className="absolute -top-1 -right-1">
            <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </div>
        )}
      </Card>
      
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-orange-500"
        style={{ borderRadius: '50%' }}
      />
    </div>
  )
}