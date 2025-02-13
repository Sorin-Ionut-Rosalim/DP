import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Login.css';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { setIsAuth } = useContext(AuthContext); // to update context
  const [message] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
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
        <h2 className="loginTitle">USER LOGIN</h2>

        <div className="profileCircle"></div>

        <p>{message}</p>

        <input
          type="text"
          placeholder="Username"
          className="inputField"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="inputField"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="rowBetween">
          <label>
            <input type="checkbox" style={{ marginRight: '4px' }} />
            Remember me
          </label>
          <Link to="/register" className="registerLink">Register</Link>
        </div>

        <button
          className="loginButton"
          onClick={handleLogin}
        >
          LOG IN
        </button>
      </div>
    </div>
  );
}

export default Login;