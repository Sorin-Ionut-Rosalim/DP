const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(cors());

// Endpoint to test the server
app.get('/', (req, res) => {
  res.send('Backend is running!');
});

// /clone endpoint
app.post('/clone', (req, res) => {
  const { repoUrl } = req.body;
  if (!repoUrl) {
    return res.status(400).json({ message: 'No repo URL provided' });
  }

  // Construct a directory name (e.g., use timestamp or a random string)
  const cloneDirName = `repo-${Date.now()}`;
  const clonePath = path.join(__dirname, cloneDirName);

  // Run the 'git clone' command
  const cmd = `git clone ${repoUrl} ${cloneDirName}`;
  exec(cmd, { cwd: __dirname }, (error, stdout, stderr) => {
    if (error) {
      console.error('Error cloning repo:', error);
      return res.status(500).json({ 
        message: 'Failed to clone repository',
        error: error.message 
      });
    }

    console.log('Repo cloned successfully! STDOUT:', stdout);

    // Example: you could check the folder or read the package.json, etc.
    // For now, just confirm the folder exists
    if (fs.existsSync(clonePath)) {
      return res.status(200).json({ message: 'Clone successful!' });
    } else {
      return res.status(500).json({ message: 'Clone directory not found.' });
    }
  });
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
