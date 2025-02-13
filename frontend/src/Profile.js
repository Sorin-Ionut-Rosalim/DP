import React, { useState, useEffect } from 'react';

function Profile() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // Attempt to fetch user profile
    fetch('/profile', { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error((await res.json()).message);
        }
        return res.json();
      })
      .then(data => {
        setProfile(data.user);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
      });
  }, []);

  if (error) {
    return <div>Not authenticated: {error}</div>;
  }

  if (!profile) {
    return <div>Loading profile...</div>;
  }

  return (
    <div>
      <h2>Profile</h2>
      <p>Logged in as: {profile.username}</p>
      {/* Additional user info */}
    </div>
  );
}

export default Profile;