import React, { useState } from 'react';
import './Auth.css';
import { useRegisterMutation } from '../hooks/useRegisterMutation';

const Register: React.FC = () => {

  const {mutate: registerMutation} = useRegisterMutation();
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
  if (!username.trim()) {
    setError('Username is required.');
    return;
  }
  if (password.length < 6) {
    setError('Password must be at least 6 characters.');
    return;
  }

  registerMutation(
    { username, password },
    {
      onError: (err: any) => {
        setError(err.message);
      }
    }
  );
};

  return (
    <div className="auth-pageWrapper">
      <div className="auth-card">
        <h2 className="auth-title">Register</h2>

        {error && <p className="errorMessage">{error}</p>}

        <input
          type="text"
          placeholder="Username"
          className="auth-inputField"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setError(null);
          }}
        />

        <input
          type="password"
          placeholder="Password"
          className="auth-inputField"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(null);
          }}
        />

        <button className="auth-button" onClick={handleRegister}>
          Submit
        </button>

        <div style={{ marginTop: '1rem' }}>
          <a href="/login" className="auth-link">
            Already have an account? Login
          </a>
        </div>
      </div>
    </div>
  );
};

export default Register;
