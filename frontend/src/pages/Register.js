import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Register.css';

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      const response = await fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // important for session cookies
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(`Success: ${data.message}`);
        navigate('/login');
      } else {
        setMessage(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error(error);
      setMessage(`Network Error: Unable to login ${error}`);
      alert('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="register-pageWrapper">
      <div className="register-card">
        <h2 className="register-title">REGISTER</h2>
        <p>{message}</p>
        <input
          type="text"
          placeholder="Username"
          className="register-inputField"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="register-inputField"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="register-button" onClick={handleRegister}>
          SUBMIT
        </button>
      </div>
    </div>
  );
}

export default Register;