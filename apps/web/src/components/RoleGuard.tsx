import { type ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';

interface RoleGuardProps {
  children: ReactNode;
  role?: string;
  roles?: string[];
  requireAll?: boolean;
  fallback?: ReactNode;
}

export function RoleGuard({ 
  children, 
  role, 
  roles, 
  requireAll = false, 
  fallback = null 
}: RoleGuardProps) {
  const { hasRole, hasAnyRole, hasAllRoles } = useAuth();

  let hasAccess = false;

  if (role) {
    hasAccess = hasRole(role);
  } else if (roles) {
    hasAccess = requireAll ? hasAllRoles(roles) : hasAnyRole(roles);
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}