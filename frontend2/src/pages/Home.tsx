import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import './Home.css';

interface ErrorResponse {
  message?: string;
}

const Home: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/profile', { credentials: 'include' });

        if (!response.ok) {
          const errorData: ErrorResponse = await response.json();
          throw new Error(errorData.message || 'Failed to fetch profile.');
        }
      } catch (err) {
        if (err instanceof Error) {
          console.error(err);
          setError(err.message);
        } else {
          console.error("An unknown error occurred");
          setError("An unknown error occurred");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
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
        <h1 className="error-title">Not Authenticated</h1>
        <p className="error-message">{error}</p>
      </div>
    );
  }
  
  return (
    <div className="home-container">
      <Sidebar />
  
      <div className="home-content">
        <h1>Welcome to the Home Page!</h1>
        <p>You are now logged in.</p>
      </div>
    </div>
  );
  
};

export default Home;
