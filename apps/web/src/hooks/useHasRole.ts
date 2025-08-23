import { useAuth } from './useAuth'

/**
 * Hook to check if the current user has specific role(s)
 * @param roles - Single role or array of roles to check
 * @returns boolean indicating if user has at least one of the specified roles
 */
export function useHasRole(roles: string | string[]): boolean {
  const { user } = useAuth()
  
  if (!user || !user.roles || !Array.isArray(user.roles)) {
    return false
  }
  
  const rolesToCheck = Array.isArray(roles) ? roles : [roles]
  
  return rolesToCheck.some(role => user.roles.includes(role))
}

/**
 * Hook to check if the current user is an admin
 * @returns boolean indicating if user has admin role
 */
export function useIsAdmin(): boolean {
  return useHasRole('admin')
}