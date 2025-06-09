import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Auth.css';
import { useLoginMutation } from '../hooks/useLoginMutation';

const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const LockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>;

const Login: React.FC = () => {
  const { mutate: login, isPending, error } = useLoginMutation();

  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);


  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setValidationError('Username is required.');
      return;
    }
    if (!password.trim()) {
      setValidationError('Password is required.');
      return;
    }
    
    setValidationError(null);
    login({ username, password });
  };

  return (
    <div className="auth-pageWrapper">
      <div className="auth-card">
        <div className="auth-header">
            <h2 className="auth-title">Welcome Back</h2>
            <p className="auth-subtitle">Log in to access your dashboard.</p>
        </div>

        {/* Display server or validation errors */}
        {(error || validationError) && (
            <div className="auth-errorMessage">
                {error?.message || validationError}
            </div>
        )}
        
        <form onSubmit={handleLogin} className="auth-form">
          <div className="input-group">
            <span className="input-icon"><UserIcon /></span>
            <input
              type="text"
              placeholder="Username"
              className="auth-inputField"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isPending}
              autoComplete="username"
            />
          </div>

          <div className="input-group">
            <span className="input-icon"><LockIcon /></span>
            <input
              type="password"
              placeholder="Password"
              className="auth-inputField"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isPending}
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="auth-button" disabled={isPending}>
            {isPending ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;