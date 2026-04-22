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

  const role = authService.getRole() as 'ADMIN' | 'STAFF' | 'CUSTOMER' | 'RETAILER' | null;
  if (!role || !requiredRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
