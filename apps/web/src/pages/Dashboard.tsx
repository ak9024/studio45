import { useAuth } from '../hooks/useAuth';
import { UserDashboardView } from '../components/UserDashboardView';
import { AdminDashboardView } from '../components/AdminDashboardView';

export const Dashboard = () => {
  const { isAdmin } = useAuth();

  // Route to appropriate dashboard based on user role
  return isAdmin ? <AdminDashboardView /> : <UserDashboardView />;
};