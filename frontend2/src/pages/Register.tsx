import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Register.css';

const Register: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleRegister = async () => {
    if (!username.trim()) {
      setError('Username is required.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        navigate('/login');
      } else {
        const data: { message?: string } = await response.json();
        setError(data.message || 'Registration failed.');
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
    <div className="register-pageWrapper">
      <div className="register-card">
        <h2 className="register-title">Register</h2>

        {error && <p className="errorMessage">{error}</p>}

        <input
          type="text"
          placeholder="Username"
          className="register-inputField"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setError(null);
          }}
        />

        <input
          type="password"
          placeholder="Password"
          className="register-inputField"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(null);
          }}
        />

        <button className="register-button" onClick={handleRegister}>
          Submit
        </button>
      </div>
    </div>
  );
};

export default Register;
