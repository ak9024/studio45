import { memo } from 'react'
import { Handle, Position } from 'reactflow'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Key, Tag } from 'lucide-react'
import type { Permission } from '@/types/api.types'

interface PermissionNodeData {
  permission: Permission
  roleCount?: number
  isHighlighted?: boolean
}

interface PermissionNodeProps {
  data: PermissionNodeData
  selected: boolean
}

export const PermissionNode = memo(({ data, selected }: PermissionNodeProps) => {
  const { permission, roleCount = 0, isHighlighted = false } = data

  const getResourceColor = (resource: string) => {
    const colors = {
      users: 'bg-blue-100 text-blue-700',
      roles: 'bg-purple-100 text-purple-700',
      templates: 'bg-green-100 text-green-700',
      settings: 'bg-orange-100 text-orange-700',
      default: 'bg-gray-100 text-gray-700'
    }
    return colors[resource as keyof typeof colors] || colors.default
  }

  const getActionColor = (action: string) => {
    const colors = {
      create: 'bg-green-100 text-green-800',
      read: 'bg-blue-100 text-blue-800', 
      update: 'bg-yellow-100 text-yellow-800',
      delete: 'bg-red-100 text-red-800',
      default: 'bg-gray-100 text-gray-800'
    }
    return colors[action as keyof typeof colors] || colors.default
  }

  return (
    <div className="relative">
      {/* Input handle from roles */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 border-2 border-green-500 bg-white"
      />

      <Card className={`
        min-w-[180px] p-3 border-2 transition-all duration-200
        ${selected ? 'border-green-500 shadow-lg' : 'border-gray-200 hover:border-gray-300'}
        ${isHighlighted ? 'ring-2 ring-green-200 bg-green-50' : 'bg-white'}
      `}>
        <div className="flex items-start gap-3">
          <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
            <Key className="h-4 w-4 text-green-600" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-gray-900 truncate">
              {permission.name}
            </h3>
            {permission.description && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                {permission.description}
              </p>
            )}
            
            <div className="flex flex-col gap-1 mt-2">
              <div className="flex items-center gap-1">
                <Badge className={`text-xs px-2 py-0 ${getResourceColor(permission.resource)}`}>
                  <Tag className="h-3 w-3 mr-1" />
                  {permission.resource}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <Badge className={`text-xs px-2 py-0 ${getActionColor(permission.action)}`}>
                  {permission.action}
                </Badge>
                <Badge variant="secondary" className="text-xs px-2 py-0">
                  {roleCount} roles
                </Badge>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-xs text-gray-400 mt-2">
          <span>ID: {permission.id.slice(0, 8)}</span>
        </div>
      </Card>
    </div>
  )
})

PermissionNode.displayName = 'PermissionNode'