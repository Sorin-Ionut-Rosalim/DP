import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // so cookies are sent
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Logged in successfully!');
        navigate('/home');
      } else {
        setMessage(`Login Error: ${data.message}`);
      }
    } catch (error) {
      console.error(error);
      setMessage(`Network Error: Unable to login ${error}`);
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