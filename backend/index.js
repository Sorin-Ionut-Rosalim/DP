/***** 1. Imports *****/
const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const session = require('express-session');
const pool = require('./db');

/***** 2. Initialize App *****/
const app = express();
app.use(express.json());

// CORS and Session config
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(session({
  secret: 'someSuperSecretKey',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // set to true in production with HTTPS
    httpOnly: true
  }
}));

/***** 3. Test pool Connection *****/
app.get('/test-pool', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ serverTime: result.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'pool error', error: err.message });
  }
});

/***** 4. Basic Test Route *****/
app.get('/', (req, res) => {
  res.send('Backend is running!');
});

/***** 5. Clone Endpoint *****/
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
    if (fs.existsSync(clonePath)) {
      // fs.rmSync(clonePath, { recursive: true, force: true });
      return res.status(200).json({ message: 'Clone successful!' });
    } else {
      return res.status(500).json({ message: 'Clone directory not found.' });
    }
  });
});

/***** 6. Auth Routes *****/

// 6.1 Register
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Basic checks
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be >= 6 chars' });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: 'Username is already taken' });
    }

    // Insert new user
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2)',
      [username, hashedPassword]
    );

    return res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 6.2 Login
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password required' });
    }

    // Look up user in Postgres
    const result = await pool.query(
      'SELECT id, password FROM users WHERE username = $1',
      [username]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // valid => set session
    req.session.userId = user.id;
    return res.json({ message: 'Login successful' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 6.3 Logout
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Logout error' });
    }
    res.clearCookie('connect.sid'); // optional
    res.json({ message: 'Logged out successfully' });
  });
});

// 6.4 Protected Route: /profile
app.get('/profile', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  try {
    const result = await pool.query(
      'SELECT id, username FROM users WHERE id = $1',
      [req.session.userId]
    );
    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'Profile data', user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 6.5 Another Protected Route: /home
app.get('/home', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  try {
    const result = await pool.query(
      'SELECT id, username FROM users WHERE id = $1',
      [req.session.userId]
    );
    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'Profile data', user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/***** 7. Start the Server *****/
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
