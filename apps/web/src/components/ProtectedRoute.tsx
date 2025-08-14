import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  role?: string;
  roles?: string[];
  requireAll?: boolean;
}

export const ProtectedRoute = ({ children, role, roles, requireAll = false }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, hasRole, hasAnyRole, hasAllRoles } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role requirements
  if (role || roles) {
    let hasAccess = false;

    if (role) {
      hasAccess = hasRole(role);
    } else if (roles) {
      hasAccess = requireAll ? hasAllRoles(roles) : hasAnyRole(roles);
    }

    if (!hasAccess) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};