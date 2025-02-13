import React, { useState } from 'react';

function Clone() {
  const [repoUrl, setRepoUrl] = useState('');

  const handleClone = async () => {
    try {
      const response = await fetch('/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl })
      });
      const result = await response.json();
      alert(`Clone status: ${result.message}`);
    } catch (error) {
      console.error('Error cloning:', error);
    }
  };

  return (
    <div style={{ margin: '2rem', textAlign: 'center' }}>
      <h1>Clone a GitHub Repository</h1>
      <input
        type="text"
        placeholder="Enter GitHub Repo URL"
        value={repoUrl}
        onChange={(e) => setRepoUrl(e.target.value)}
        style={{ width: '300px', marginRight: '1rem' }}
      />
      <button onClick={handleClone}>Clone</button>
    </div>
  );
}

export default Clone;