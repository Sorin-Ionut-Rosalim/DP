import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Sidebar.css';

function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // Call your backend to log out
      await fetch('/logout', { method: 'POST', credentials: 'include' });
      // Redirect to login page
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="sidebar">
      <h3 className="sidebar-title">Menu</h3>
      <ul className="sidebar-list">
        <li>
          <Link to="/home">Home</Link>
        </li>
        <li>
          <Link to="/profile">Profile</Link>
        </li>
        <li>
          <Link to="/clone">Clone</Link>
        </li>
        <li>
          <button onClick={handleLogout}>Logout</button>
        </li>
      </ul>
    </nav>
  );
}

export default Sidebar;
