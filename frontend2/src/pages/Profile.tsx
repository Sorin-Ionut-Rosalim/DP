import React, { useState, useEffect } from 'react';
import Sidebar from "../components/Sidebar";
import './Profile.css';

interface User {
  id: string;
  username: string;
  email: string;
}

const Profile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/profile', { credentials: 'include' });

        if (!response.ok) {
          const errorData: { message?: string } = await response.json();
          throw new Error(errorData.message || 'Failed to fetch profile.');
        }

        const data: { user: User } = await response.json();
        setUser(data.user);
      } catch (err) {
        if (err instanceof Error) {
          console.error(err);
          setError(err.message);
        } else {
          console.error("An unknown error occurred.");
          setError("An unknown error occurred.");
        }
      }
    };

    fetchProfile();
  }, []);

  if (error) {
    return (
      <div className="status-container">
        <h1 className="error-title">Not Authenticated</h1>
        <p className="error-message">{error}</p>
      </div>
    );
  }

  if (!user) {
    return <div className="status-container"><h1>Loading...</h1></div>;
  }

  return (
    <div className="profile-container">
      <Sidebar />
      <div className="profile-content">
        <div className="profile-card">
          <h1 className="profile-title">Profile Page</h1>
          <div className="profile-info">
            <p><strong>ID:</strong> {user.id}</p>
            <p><strong>Username:</strong> {user.username}</p>
            <p><strong>Email:</strong> {user.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
