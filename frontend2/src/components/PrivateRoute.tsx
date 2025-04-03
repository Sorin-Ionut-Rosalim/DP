import { useContext, ReactNode } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

interface PrivateRouteProps {
  children: ReactNode;
  redirectTo?: string;
  loadingFallback?: ReactNode;
}


// A component that protects routes by checking authentication
const PrivateRoute: React.FC<PrivateRouteProps> = ({ 
  children,
  redirectTo = '/login',
  loadingFallback = <div>Checking authentication...</div>
}) => {
  const authContext = useContext(AuthContext);

  if (!authContext) {
    throw new Error("PrivateRoute must be used within an AuthProvider");
  }

  const { isAuthenticated, isLoading } = authContext;

  if (isLoading ) {
    return loadingFallback;
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
