import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import './Auth.css';
import { useLoginMutation } from '../hooks/useLoginMutation';

export const useAuth = () => {
  const authContext = useContext(AuthContext);

  if (!authContext) {
    throw new Error("AuthContext must be used within an AuthProvider");
  }

  return authContext;
}

const Login: React.FC = () => {

  const {mutate: loginMutation} = useLoginMutation();
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!username.trim()) {
      setError('Username is required.');
      return;
    }
    if (!password.trim()) {
      setError('Password is required.');
      return;
    }

    loginMutation({username, password});
  };

  return (
    <div className="auth-pageWrapper">
      <div className="auth-card">
        <h2 className="auth-title">LOGIN</h2>

        {error && <p className="auth-errorMessage">{error}</p>}

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

        <button className="auth-button" onClick={handleLogin}>
          Login
        </button>

        <div style={{ marginTop: '1rem' }}>
          <a href="/register" className="auth-link">
            Don't have an account? Register
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;
