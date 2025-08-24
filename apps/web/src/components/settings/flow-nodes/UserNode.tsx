import { memo } from 'react'
import { Handle, Position } from 'reactflow'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { User, Mail, Building, Calendar } from 'lucide-react'
import type { User as UserType } from '@/types/api.types'

interface UserNodeData {
  user: UserType
  isHighlighted?: boolean
  showDetails?: boolean
}

interface UserNodeProps {
  data: UserNodeData
  selected: boolean
}

export const UserNode = memo(({ data, selected }: UserNodeProps) => {
  const { user, isHighlighted = false, showDetails = true } = data

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="relative">
      {/* Output handle to roles */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 border-2 border-purple-500 bg-white"
      />

      <Card className={`
        min-w-[220px] p-3 border-2 transition-all duration-200
        ${selected ? 'border-purple-500 shadow-lg' : 'border-gray-200 hover:border-gray-300'}
        ${isHighlighted ? 'ring-2 ring-purple-200 bg-purple-50' : 'bg-white'}
      `}>
        <div className="flex items-start gap-3">
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarFallback className="bg-purple-100 text-purple-700 text-xs">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-gray-900 truncate">
              {user.name}
            </h3>
            
            {showDetails && (
              <div className="space-y-1 mt-1">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{user.email}</span>
                </div>
                
                {user.company && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Building className="h-3 w-3" />
                    <span className="truncate">{user.company}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(user.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            )}
            
            <div className="flex flex-wrap gap-1 mt-2">
              {user.roles.map((role, index) => (
                <Badge 
                  key={index}
                  variant="secondary" 
                  className="text-xs px-2 py-0"
                >
                  {role}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        
        <div className="text-xs text-gray-400 mt-2 flex justify-between">
          <span>ID: {user.id.slice(0, 8)}</span>
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>{user.roles.length} role{user.roles.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </Card>
    </div>
  )
})

UserNode.displayName = 'UserNode'