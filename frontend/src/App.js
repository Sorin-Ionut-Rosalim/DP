import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Clone from './pages/Clone';
import Profile from './pages/Profile';

function App() {
  return (
    <Router>
      <Routes>
        {/* Default route => Login page */}
        <Route path="/" element={<Login />} />

        {/* Registration route */}
        <Route path="/register" element={<Register />} />

        {/* Protected pages (assumes user is logged in) */}
        <Route path="/home" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/clone" element={<Clone />} />
      </Routes>
    </Router>
  );
}

export default App;