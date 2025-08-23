import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Edit3, Save, X, User, Mail, Phone, Building, Calendar, Shield } from "lucide-react"

import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { updateProfileSchema, type UpdateProfileFormData } from "@/lib/schemas/profile"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import { authService } from "@/services/api"

export function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(true)
  const [profileLoaded, setProfileLoaded] = useState(false)
  const { user, updateUser } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
  })

  const formData = watch()

  useEffect(() => {
    // Only load profile once when component mounts
    if (profileLoaded) return

    const loadProfile = async () => {
      try {
        setIsRefreshing(true)
        const response = await authService.getProfile()
        
        // Handle different response structures
        let userData = null
        
        // Case 1: Standard ApiResponse format
        if (response.success && response.data) {
          userData = response.data
        }
        // Case 2: Direct response format (API returns user directly)
        else if (response && (response as any).id && (response as any).email) {
          userData = response as any
        }
        
        if (userData) {
          // Ensure roles array exists
          if (!userData.roles || !Array.isArray(userData.roles)) {
            userData.roles = []
          }
          
          updateUser(userData)
          reset({
            name: userData.name,
            email: userData.email,
            phone: userData.phone || "",
            company: userData.company || "",
          })
          setProfileLoaded(true)
        } else {
          toast.error("Failed to load profile data")
        }
      } catch (error) {
        console.error('Error loading profile:', error)
        toast.error("Failed to load profile data")
      } finally {
        setIsRefreshing(false)
      }
    }

    loadProfile()
  }, [profileLoaded]) // Only depend on profileLoaded flag

  const onSubmit = async (data: UpdateProfileFormData) => {
    try {
      setIsLoading(true)
      const updateData = {
        name: data.name,
        email: data.email,
        phone: data.phone || undefined,
        company: data.company || undefined,
      }

      const response = await authService.updateProfile(updateData)
      
      // Check if response indicates success
      if (response.success !== false) {
        // Handle successful update - check if we have user data
        if (response.data && typeof response.data === 'object' && 'id' in response.data) {
          updateUser(response.data)
        }
        
        setIsEditing(false)
        toast.success("Profile updated successfully")
      } else {
        // Only show error if response explicitly indicates failure
        toast.error(response.message || "Failed to update profile")
      }
    } catch (error: any) {
      console.error("Profile update error:", error)
      toast.error(error.response?.data?.message || error.message || "Failed to update profile")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    if (user) {
      reset({
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        company: user.company || "",
      })
    }
    setIsEditing(false)
  }

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'user': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'crew': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'extra': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  if (isRefreshing) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h2>
            <p className="text-gray-600">Unable to load profile information.</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const hasChanges = user && (
    formData.name !== user.name ||
    formData.email !== user.email ||
    formData.phone !== (user.phone || "") ||
    formData.company !== (user.company || "")
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Profile Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
            <p className="text-muted-foreground">
              Manage your account information and preferences.
            </p>
          </div>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              <Edit3 className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button
                onClick={handleSubmit(onSubmit)}
                disabled={isLoading || !hasChanges}
              >
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Profile Info Card */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {isEditing ? (
                  <form className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          {...register("name")}
                          className={errors.name ? "border-red-500" : ""}
                        />
                        {errors.name && (
                          <p className="text-sm text-red-500">{errors.name.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          {...register("email")}
                          className={errors.email ? "border-red-500" : ""}
                        />
                        {errors.email && (
                          <p className="text-sm text-red-500">{errors.email.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          {...register("phone")}
                          placeholder="Optional"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="company">Company</Label>
                        <Input
                          id="company"
                          {...register("company")}
                          placeholder="Optional"
                        />
                      </div>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage
                          src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}
                          alt={user.name}
                        />
                        <AvatarFallback className="text-lg">
                          {getUserInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h2 className="text-2xl font-bold">{user.name}</h2>
                        <p className="text-muted-foreground">{user.email}</p>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="flex items-center space-x-3">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Full Name</p>
                          <p className="text-sm text-muted-foreground">{user.name}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Email</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>

                      {user.phone && (
                        <div className="flex items-center space-x-3">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Phone</p>
                            <p className="text-sm text-muted-foreground">{user.phone}</p>
                          </div>
                        </div>
                      )}

                      {user.company && (
                        <div className="flex items-center space-x-3">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Company</p>
                            <p className="text-sm text-muted-foreground">{user.company}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Account Details Sidebar */}
          <div className="space-y-6">
            {/* Roles Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-4 w-4" />
                  Roles & Permissions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {user.roles.map((role) => (
                    <Badge key={role} className={getRoleColor(role)}>
                      {role}
                    </Badge>
                  ))}
                  {user.roles.length === 0 && (
                    <p className="text-sm text-muted-foreground">No roles assigned</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Account Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Member since</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(user.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Last updated</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(user.updated_at)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
