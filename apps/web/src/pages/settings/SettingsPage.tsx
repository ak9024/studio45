import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Shield, Users, Database } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"

export function SettingsPage() {
  const { user } = useAuth()

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Admin Settings</h2>
            <p className="text-muted-foreground">
              Configure system-wide settings and manage application preferences.
            </p>
          </div>
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            <Shield className="mr-1 h-3 w-3" />
            Admin Only
          </Badge>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">
              <Settings className="mr-2 h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="mr-2 h-4 w-4" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="mr-2 h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="system">
              <Database className="mr-2 h-4 w-4" />
              System
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Application Configuration</CardTitle>
                  <CardDescription>
                    Configure global application settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">App Title:</span> {import.meta.env.VITE_APP_TITLE || 'Studio45'}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Environment:</span> {import.meta.env.MODE || 'development'}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">API URL:</span> {import.meta.env.VITE_API_URL || 'Not configured'}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                  <CardDescription>
                    Current system information and status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Status:</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Online
                      </Badge>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Admin User:</span> {user?.name} ({user?.email})
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Roles:</span> {user?.roles?.join(', ')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management Settings</CardTitle>
                <CardDescription>
                  Configure user registration, roles, and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    User management features are available through the Users page. 
                    Additional user settings and bulk operations will be added here.
                  </div>
                  <div className="space-y-2">
                    <div className="font-medium">Available Roles:</div>
                    <div className="flex gap-2 flex-wrap">
                      <Badge>admin</Badge>
                      <Badge variant="secondary">user</Badge>
                      <Badge variant="secondary">crew</Badge>
                      <Badge variant="secondary">extra</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Configure authentication and security policies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Security settings and authentication policies will be configured here.
                  </div>
                  <div className="space-y-2">
                    <div className="font-medium">Current Security Features:</div>
                    <ul className="text-sm space-y-1 ml-4">
                      <li>• Role-based access control (RBAC)</li>
                      <li>• Protected routes for admin functions</li>
                      <li>• JWT token authentication</li>
                      <li>• Password reset functionality</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Configuration</CardTitle>
                <CardDescription>
                  Database, API, and system-level settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    System configuration and maintenance tools will be available here.
                  </div>
                  <div className="space-y-2">
                    <div className="font-medium">System Information:</div>
                    <div className="text-sm space-y-1">
                      <div>Built with React + TypeScript</div>
                      <div>UI Components: shadcn/ui</div>
                      <div>Styling: Tailwind CSS</div>
                      <div>Build Tool: Vite</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}