import { memo } from 'react'
import { Handle, Position } from 'reactflow'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, Users, Settings } from 'lucide-react'
import type { Role } from '@/types/api.types'

interface RoleNodeData {
  role: Role
  userCount?: number
  permissionCount?: number
  isHighlighted?: boolean
}

interface RoleNodeProps {
  data: RoleNodeData
  selected: boolean
}

export const RoleNode = memo(({ data, selected }: RoleNodeProps) => {
  const { role, userCount = 0, permissionCount = 0, isHighlighted = false } = data

  return (
    <div className="relative">
      {/* Input handle for parent roles */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 border-2 border-blue-500 bg-white"
      />

      <Card className={`
        min-w-[200px] p-3 border-2 transition-all duration-200
        ${selected ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-gray-300'}
        ${isHighlighted ? 'ring-2 ring-blue-200 bg-blue-50' : 'bg-white'}
      `}>
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
            <Shield className="h-4 w-4 text-blue-600" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-gray-900 truncate">
              {role.name}
            </h3>
            {role.description && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                {role.description}
              </p>
            )}
            
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs px-2 py-0">
                <Users className="h-3 w-3 mr-1" />
                {userCount}
              </Badge>
              <Badge variant="outline" className="text-xs px-2 py-0">
                <Settings className="h-3 w-3 mr-1" />
                {permissionCount}
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="text-xs text-gray-400 mt-2 flex justify-between">
          <span>ID: {role.id.slice(0, 8)}</span>
          <span>{new Date(role.created_at).toLocaleDateString()}</span>
        </div>
      </Card>

      {/* Output handle for child roles */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 border-2 border-blue-500 bg-white"
      />

      {/* Output handle for permissions */}
      <Handle
        type="source"
        position={Position.Right}
        id="permissions"
        className="w-3 h-3 border-2 border-green-500 bg-white"
      />
    </div>
  )
})

RoleNode.displayName = 'RoleNode'