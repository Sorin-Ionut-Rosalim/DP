import React from 'react';
import Sidebar from '../components/Sidebar';
import './Home.css';
import { useProfileQuery } from '../hooks/useProfileQuery';

const Home: React.FC = () => {
  const { data: user, isLoading, error } = useProfileQuery();

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
        <h1 className="error-title">
          {error.message.includes('401') ? 'Not Authenticated' : 'Error'}
        </h1>
        <p className="error-message">
          {error.message.includes('401') 
            ? 'Please log in to access this page.'
            : error.message}
        </p>
      </div>
    );
  }

  return (
    <div className="home-container">
      <Sidebar />
      <div className="home-content">
        <div className="welcome-card">
          <h1 className="welcome-title">Welcome back, {user?.username}!</h1>
        </div>
      </div>
    </div>
  );
};

export default Home;