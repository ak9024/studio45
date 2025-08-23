import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { type User } from '@/types/api.types'
import { authService } from '@/services/api'

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  updateUser: (user: User) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Initialize auth state from localStorage
    const initAuth = async () => {
      try {
        const storedToken = authService.getToken()
        const storedUser = authService.getUser()

        if (storedToken && storedUser) {
          // Ensure user has roles array when loading from storage
          if (!storedUser.roles || !Array.isArray(storedUser.roles)) {
            storedUser.roles = []
          }
          setToken(storedToken)
          setUser(storedUser)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        authService.logout()
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      const response = await authService.login({ email, password })
      
      console.log('Login response:', response) // Debug logging
      
      // Handle different possible response structures
      let loginData: any = null
      
      // Case 1: Standard ApiResponse format
      if (response.success && response.data) {
        loginData = response.data
      }
      // Case 2: Direct response format (no success flag) 
      else if (response && ((response as any).token || (response as any).user)) {
        loginData = response as any
      }
      // Case 3: Response might be nested in data property
      else if ((response as any).data && ((response as any).data.token || (response as any).data.user)) {
        loginData = (response as any).data
      }
      
      if (loginData && loginData.token && loginData.user) {
        const { token: newToken, user: newUser } = loginData
        
        // Ensure user has roles array
        if (!newUser.roles || !Array.isArray(newUser.roles)) {
          newUser.roles = []
        }
        
        authService.setToken(newToken)
        authService.setUser(newUser)
        
        setToken(newToken)
        setUser(newUser)
      } else {
        console.error('Login failed - Invalid response structure:', response) // Debug logging
        throw new Error(response.message || response.error || 'Login failed - Invalid response format')
      }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (name: string, email: string, password: string) => {
    try {
      setIsLoading(true)
      const response = await authService.register({ name, email, password })
      
      if (response.success && response.data) {
        // After registration, automatically log in
        await login(email, password)
      } else {
        throw new Error(response.message || 'Registration failed')
      }
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    authService.logout()
    setUser(null)
    setToken(null)
  }

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser)
    authService.setUser(updatedUser)
  }

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    register,
    logout,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}