import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Clone from './pages/Clone';
import Profile from './pages/Profile';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Default route => Login page */}
        <Route path="/" element={<Login />} />

        {/* Registration route */}
        <Route path="/register" element={<Register />} />

        {/* Protected pages (assumes user is logged in) */}
        <Route path="/home" element={<PrivateRoute><Home /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/clone" element={<PrivateRoute><Clone /></PrivateRoute>} />

        {/* If no path matches, redirect to the login page */}
        <Route path="*" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;