import { Navigate } from 'react-router-dom';
import { authService } from '../services/authService';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles: ('ADMIN' | 'STAFF' | 'CUSTOMER' | 'RETAILER')[];
}

export default function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/signin" replace />;
  }

  const role = authService.getRole();
  const normalizedRole = role === 'ROLE_ADMIN' ? 'ADMIN' : role;
  if (!normalizedRole || !requiredRoles.includes(normalizedRole as 'ADMIN' | 'STAFF' | 'CUSTOMER' | 'RETAILER')) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
