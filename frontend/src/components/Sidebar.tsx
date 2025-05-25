// components/Sidebar.tsx
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useLogoutMutation } from '../hooks/useLogoutMutation';
import './Sidebar.css';

const Sidebar: React.FC = () => {
  const authContext = useContext(AuthContext);
  const logoutMutation = useLogoutMutation();

  if (!authContext) {
    throw new Error("AuthContext must be used within an AuthProvider");
  }

  const { isAuthenticated, setIsAuthenticated } = authContext;

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        setIsAuthenticated(false);
      }
    });
  };

  if (!isAuthenticated) return null;

  return (
    <nav className="sidebar">
      <h3 className="sidebar-title">Menu</h3>
      <ul className="sidebar-list">
        <li>
          <Link to="/home" className="sidebar-link">Home</Link>
        </li>
        <li>
          <Link to="/profile" className="sidebar-link">Profile</Link>
        </li>
        <li>
          <Link to="/scan" className="sidebar-link">Scan</Link>
        </li>
        <li>
          <button 
            onClick={handleLogout}
            className="sidebar-logout-button"
            disabled={logoutMutation.isPending}
          >
            {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default Sidebar;