import React, { useContext } from "react";
import { NavLink } from "react-router-dom"; // Use NavLink for active styling
import { AuthContext } from "../context/AuthContext";
import { useLogoutMutation } from "../hooks/useLogoutMutation";
import "./Sidebar.css";

// SVG Icons for the sidebar links
const HomeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    <polyline points="9 22 9 12 15 12 15 22"></polyline>
  </svg>
);

const ProfileIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const ScanIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m15.5 7.5 3 3-3 3"></path>
    <path d="M8.5 16.5 5 13l3.5-3.5"></path>
    <path d="M18 12H6"></path>
    <path d="M2 12a10 10 0 1 1 20 0 10 10 0 0 1-20 0Z"></path>
  </svg>
);

const LogoutIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
);

const Sidebar: React.FC = () => {
  const authContext = useContext(AuthContext);
  const logoutMutation = useLogoutMutation();

  if (!authContext) {
    throw new Error("PrivateRoute must be used within an AuthProvider");
  }

  const { isAuthenticated, setIsAuthenticated } = authContext;

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        setIsAuthenticated(false);
      },
    });
  };

  if (!isAuthenticated) return null;

  return (
    <aside className="sidebar">
      <div>
        <div className="sidebar-header">
          <h3 className="sidebar-title">MultiScanner</h3>
        </div>
        <nav className="sidebar-nav">
          <ul>
            <li>
              <NavLink
                to="/home"
                className={({ isActive }) =>
                  "sidebar-link" + (isActive ? " active" : "")
                }
              >
                <HomeIcon />
                <span>Home</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/portfolio"
                className={({ isActive }) =>
                  "sidebar-link" + (isActive ? " active" : "")
                }
              >
                <ProfileIcon />
                <span>Portfolio</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/scan"
                className={({ isActive }) =>
                  "sidebar-link" + (isActive ? " active" : "")
                }
              >
                <ScanIcon />
                <span>New Scan</span>
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>
      <div className="sidebar-footer">
        <button
          onClick={handleLogout}
          className="sidebar-logout-button"
          disabled={logoutMutation.isPending}
        >
          <LogoutIcon />
          <span>{logoutMutation.isPending ? "Logging out..." : "Logout"}</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;