import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import './Home.css'

function Home() {
  const [error, setError] = useState('');
  
  useEffect(() => {
    fetch('/profile', { credentials: 'include' })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error((await response.json()).message);
        }
        return response.json();
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


  return (
    <div className="home-container">
      <Sidebar />

      <div className="home-content">
        <h1>Welcome to the Home Page!</h1>
        <p>You are now logged in.</p>
      </div>
    </div>
  );
}

export default Home;