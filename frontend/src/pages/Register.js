import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Register.css';

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async () => {
    // 1. Frontend validation checks
    if (!username.trim()) {
      setError('Username is required.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    // 2. Backend validation checks
    try {
      const response = await fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // important for session cookies
        body: JSON.stringify({ username, password })
      });

      if (response.ok) {
        navigate('/login');
      } else {
        const data = await response.json();
        setError(`Register error: ${data.message}`);
      }
    }  catch (error) {
      console.error('Network error:', error);
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="register-pageWrapper">
      <div className="register-card">
        <h2 className="register-title">REGISTER</h2>

        {/* Display any error messages */}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        <input
          type="text"
          placeholder="Username"
          className="register-inputField"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setError(''); // clear error if user changes input
          }}
        />

        <input
          type="password"
          placeholder="Password"
          className="register-inputField"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError('');
          }}
        />

        <button className="register-button" onClick={handleRegister}>
          SUBMIT
        </button>
      </div>
    </div>
  );
}

export default Register;