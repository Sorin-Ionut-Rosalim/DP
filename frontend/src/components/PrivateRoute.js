import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

function PrivateRoute({ children }) {
  const { isAuth, loading } = useContext(AuthContext);

  if (loading) {
    // We are still checking if user is authenticated
    return <div>Checking authentication...</div>;
  }

  if (!isAuth) {
    // Not authenticated
    return <Navigate to="/" replace />;
  }

  // Authenticated
  return children;
}

export default PrivateRoute;