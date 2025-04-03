import React from 'react';
import Sidebar from "../components/Sidebar";
import './Profile.css';
import { useProfileQuery } from '../hooks/useProfileQuery';

const Profile: React.FC = () => {
  const { data: user, error, isLoading } = useProfileQuery();

  if (isLoading) {
    return (
      <div className="status-container">
        <div className="loading-spinner"></div>
        <h1>Loading...</h1>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="status-container">
        <h1 className="error-title">Error Loading Profile</h1>
        <div className="error-message">
          <p>We couldn't load your profile information.</p>
          <p>Please ensure you're logged in and try again.</p>
          <details style={{ marginTop: '1rem', color: '#666' }}>
            <summary>Technical details</summary>
            <pre style={{ whiteSpace: 'pre-wrap' }}>{error.message}</pre>
          </details>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <Sidebar />
      <div className="profile-content">
        <div className="profile-card">
          <div className="user-info-grid">
            <div className="info-item">
              <span className="info-label">User ID</span>
              <span className="info-value">{user?.id}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Username</span>
              <span className="info-value">{user?.username}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Scans</span>
              <span className="info-value"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;