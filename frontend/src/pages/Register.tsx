import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Auth.css';
import { useRegisterMutation } from '../hooks/useRegisterMutation';

const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const LockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>;

const Register: React.FC = () => {
  const { mutate: register, isPending, error: serverError } = useRegisterMutation();

  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    if (!username.trim() || !password.trim()) {
      setValidationError('Username and password are required.');
      return;
    }
    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setValidationError('Passwords do not match.');
      return;
    }
    
    setValidationError(null);
    register({ username, password });
  };

  return (
    <div className="auth-pageWrapper">
      <div className="auth-card">
        <div className="auth-header">
            <h2 className="auth-title">Create an Account</h2>
            <p className="auth-subtitle">Get started with KotlinSonar.</p>
        </div>
        
        {/* Display server or validation errors */}
        {(serverError || validationError) && (
            <div className="auth-errorMessage">
                {serverError?.message || validationError}
            </div>
        )}
        
        <form onSubmit={handleRegister} className="auth-form">
          <div className="input-group">
            <span className="input-icon"><UserIcon /></span>
            <input
              type="text"
              placeholder="Username"
              className="auth-inputField"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isPending}
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
            />
          </div>

           <div className="input-group">
            <span className="input-icon"><LockIcon /></span>
            <input
              type="password"
              placeholder="Confirm Password"
              className="auth-inputField"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isPending}
            />
          </div>

          <button type="submit" className="auth-button" disabled={isPending}>
            {isPending ? 'Registering...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
