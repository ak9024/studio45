import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Shield, 
  Key, 
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock
} from "lucide-react"
import { type Role, type Permission } from "@/types/api.types"

interface RoleStatsCardProps {
  roles: Role[]
  permissions: Permission[]
  loading?: boolean
  className?: string
}

interface RoleStats {
  totalRoles: number
  totalPermissions: number
  avgPermissionsPerRole: number
  rolesWithoutPermissions: number
  mostUsedPermissions: Permission[]
  recentlyCreatedRoles: Role[]
  permissionDistribution: Record<string, number>
}

export function RoleStatsCard({ 
  roles, 
  permissions, 
  loading = false,
  className = ""
}: RoleStatsCardProps) {
  
  const stats: RoleStats = useMemo(() => {
    // Calculate basic stats
    const totalRoles = roles.length
    const totalPermissions = permissions.length
    
    // Group permissions by resource for distribution
    const permissionDistribution = permissions.reduce((acc, perm) => {
      acc[perm.resource] = (acc[perm.resource] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Sort resources by permission count
    const sortedResources = Object.entries(permissionDistribution)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)

    // Get recently created roles (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const recentlyCreatedRoles = roles
      .filter(role => new Date(role.created_at) > weekAgo)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3)

    return {
      totalRoles,
      totalPermissions,
      avgPermissionsPerRole: totalRoles > 0 ? Math.round((totalPermissions / totalRoles) * 10) / 10 : 0,
      rolesWithoutPermissions: 0, // This would need role-permission data to calculate
      mostUsedPermissions: permissions.slice(0, 3), // Would need usage data
      recentlyCreatedRoles,
      permissionDistribution: Object.fromEntries(sortedResources)
    }
  }, [roles, permissions])

  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-300 rounded"></div>
                <div className="w-20 h-4 bg-gray-300 rounded"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="w-12 h-8 bg-gray-300 rounded mb-2"></div>
              <div className="w-24 h-3 bg-gray-300 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRoles}</div>
            <p className="text-xs text-muted-foreground">
              {stats.recentlyCreatedRoles.length} created this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Permissions</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPermissions}</div>
            <p className="text-xs text-muted-foreground">
              Across {Object.keys(stats.permissionDistribution).length} resources
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Permissions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgPermissionsPerRole}</div>
            <p className="text-xs text-muted-foreground">
              Per role (estimated)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Good</div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Permission Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Permission Distribution</CardTitle>
            <CardDescription>
              Permissions grouped by resource type
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(stats.permissionDistribution).map(([resource, count]) => {
              const percentage = stats.totalPermissions > 0 ? (count / stats.totalPermissions) * 100 : 0
              return (
                <div key={resource} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium capitalize">{resource}</span>
                    <Badge variant="secondary">{count} permissions</Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-muted-foreground text-right">
                    {percentage.toFixed(1)}% of total
                  </div>
                </div>
              )
            })}
            {Object.keys(stats.permissionDistribution).length === 0 && (
              <div className="text-center py-4 text-muted-foreground text-sm">
                No permission data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <CardDescription>
              Recently created roles and system changes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.recentlyCreatedRoles.length > 0 ? (
              <>
                <div className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  New Roles This Week
                </div>
                <div className="space-y-3">
                  {stats.recentlyCreatedRoles.map((role) => (
                    <div key={role.id} className="flex items-center justify-between p-2 rounded bg-gray-50">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium text-sm">{role.name}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {role.description}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {new Date(role.created_at).toLocaleDateString()}
                      </Badge>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  No Recent Activity
                </div>
                <div className="text-sm text-muted-foreground">
                  No new roles have been created in the past week.
                </div>
              </>
            )}

            {/* Quick Actions */}
            <div className="pt-4 border-t">
              <div className="text-sm font-medium mb-2">Quick Stats</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-center p-2 bg-blue-50 rounded">
                  <div className="font-bold text-blue-900">{stats.totalRoles}</div>
                  <div className="text-blue-700">Active Roles</div>
                </div>
                <div className="text-center p-2 bg-green-50 rounded">
                  <div className="font-bold text-green-900">{stats.totalPermissions}</div>
                  <div className="text-green-700">Permissions</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resource Overview */}
      {Object.keys(stats.permissionDistribution).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resource Overview</CardTitle>
            <CardDescription>
              Overview of permissions across different system resources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.permissionDistribution).map(([resource, count]) => (
                <Badge 
                  key={resource} 
                  variant="outline" 
                  className="flex items-center gap-1 px-3 py-1"
                >
                  <Key className="h-3 w-3" />
                  <span className="capitalize">{resource}</span>
                  <span className="text-muted-foreground">({count})</span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}