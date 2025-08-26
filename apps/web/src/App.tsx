
import { Routes, Route, Link, Navigate } from "react-router-dom"
import { Suspense, lazy } from "react"
import { Button } from "@/components/ui/button"
import { AuthProvider, useAuth } from "@/contexts/AuthContext"
import { ThemeProvider } from "@/contexts/ThemeContext"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { Toaster } from "@/components/ui/sonner"

// Lazy load page components for code splitting
const LoginPage = lazy(() => import("./pages/auth/LoginPage").then(module => ({ default: module.LoginPage })))
const RegisterPage = lazy(() => import("./pages/auth/RegisterPage").then(module => ({ default: module.RegisterPage })))
const ForgotPasswordPage = lazy(() => import("./pages/auth/ForgotPasswordPage").then(module => ({ default: module.ForgotPasswordPage })))
const ResetPasswordPage = lazy(() => import("./pages/auth/ResetPasswordPage").then(module => ({ default: module.ResetPasswordPage })))
const DashboardPage = lazy(() => import("./pages/dashboard/DashboardPage").then(module => ({ default: module.DashboardPage })))
const AnalyticsPage = lazy(() => import("./pages/analytics/AnalyticsPage").then(module => ({ default: module.AnalyticsPage })))
const UsersPage = lazy(() => import("./pages/users/UsersPage").then(module => ({ default: module.UsersPage })))
const SettingsPage = lazy(() => import("./pages/settings/SettingsPage").then(module => ({ default: module.SettingsPage })))
const ProfilePage = lazy(() => import("./pages/profile/ProfilePage").then(module => ({ default: module.ProfilePage })))

// Loading component
function PageLoadingFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}

function HomePage() {
  const appTitle = import.meta.env.VITE_APP_TITLE || 'My App'
  const { isAuthenticated } = useAuth()

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">{appTitle}</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <Link to="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link to="/register">
                <Button>Sign Up</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Welcome to {appTitle}
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Get started by creating an account or signing in to your existing account.
            </p>
            <div className="space-x-4">
              <Link to="/login">
                <Button size="lg">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function AppContent() {
  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/analytics" 
          element={
            <ProtectedRoute>
              <AnalyticsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/users" 
          element={
            <ProtectedRoute requiredRoles={['admin']}>
              <UsersPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute requiredRoles={['admin']}>
              <SettingsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="studio45-ui-theme">
      <AuthProvider>
        <AppContent />
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
