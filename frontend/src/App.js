import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

import Home from './Home';
import Register from './Register';
import Login from './Login';
import Profile from './Profile';
import Clone from './Clone';

function App() {

  // We'll put the logout button in a small nav
  const handleLogout = async () => {
    try {
      await fetch('/logout', { 
        method: 'POST',
        credentials: 'include'
      });
      alert('Logged out successfully!');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <Router>
      <nav style={{ margin: '1rem', textAlign: 'center' }}>
        <Link to="/" style={{ margin: '0 1rem' }}>Home</Link>
        <Link to="/register" style={{ margin: '0 1rem' }}>Register</Link>
        <Link to="/login" style={{ margin: '0 1rem' }}>Login</Link>
        <Link to="/profile" style={{ margin: '0 1rem' }}>Profile</Link>
        <Link to="/clone" style={{ margin: '0 1rem' }}>Clone Repo</Link>
        <button onClick={handleLogout} style={{ margin: '0 1rem' }}>
          Logout
        </button>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/clone" element={<Clone />} />
      </Routes>
    </Router>
  );
}

export default App;
