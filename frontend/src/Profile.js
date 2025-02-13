import React, { useState, useEffect } from 'react';

function Profile() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/profile', { credentials: 'include' })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error((await response.json()).message);
        }
        return response.json();
      })
      .then(data => {
        setUser(data.user); 
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
      });
  }, []);

  if (error) {
    return <div style={{ margin: '2rem', textAlign: 'center' }}>
      <h1>Not Authenticated</h1>
      <p>{error}</p>
    </div>;
  }

  if (!user) {
    return <div style={{ margin: '2rem', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ margin: '2rem', textAlign: 'center' }}>
      <h1>Profile Page</h1>
      <p>Welcome, {user.username}!</p>
    </div>
  );
}

export default Profile;