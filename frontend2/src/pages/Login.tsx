import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Login.css';

const Login: React.FC = () => {
  const authContext = useContext(AuthContext);

  if (!authContext) {
    throw new Error("AuthContext must be used within an AuthProvider");
  }

  const { setIsAuth } = authContext;
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!username.trim()) {
      setError('Username is required.');
      return;
    }
    if (!password.trim()) {
      setError('Password is required.');
      return;
    }

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        setIsAuth(true);
        navigate('/home');
      } else {
        const data: { message: string } = await response.json();
        setError(data.message || 'Login failed.');
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('Network error:', error);
        setError('Something went wrong. Please try again.');
      } else {
        console.error("An unknown error occurred.");
        setError("An unknown error occurred.");
      }
    }
  };

  return (
    <div className="pageWrapper">
      <div className="loginCard">
        <h2 className="loginTitle">User Login</h2>

        {error && <p className="errorMessage">{error}</p>}

        <input
          type="text"
          placeholder="Username"
          className="inputField"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setError(null);
          }}
        />

        <input
          type="password"
          placeholder="Password"
          className="inputField"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(null);
          }}
        />

        <div className="rowBetween">
          <Link to="/register" className="registerLink">
            Register
          </Link>
        </div>

        <button className="loginButton" onClick={handleLogin}>
          Log In
        </button>
      </div>
    </div>
  );
};

export default Login;
