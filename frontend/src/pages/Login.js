import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Login.css';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { setIsAuth } = useContext(AuthContext); // to update context
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    // front-end checks
    if (!username.trim()) {
      setError('Username is required.');
      return;
    }
    if (!password.trim()) {
      setError('Password is required.');
      return;
    }

    // back-end validation
    try {
      const response = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      });
      if (response.ok) {
        // success -> set context state
        setIsAuth(true);
        // redirect to /home
        navigate('/home');
      } else {
        const data = await response.json();
        alert(`Login error: ${data.message}`);
      }
    } catch (error) {
      console.error('Network error:', error);
      alert('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="pageWrapper">
      <div className="loginCard">
        <h2 className="login-title">USER LOGIN</h2>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <input
          type="text"
          placeholder="Username"
          className="inputField"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setError('');
          }}
        />

        <input
          type="password"
          placeholder="Password"
          className="inputField"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError('');
          }}
        />

        <button className="loginButton" onClick={handleLogin}>
          LOG IN
        </button>
      </div>
    </div>
  );
}

export default Login;