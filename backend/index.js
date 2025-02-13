/***** 1. Imports *****/
const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const session = require('express-session');
const db = require('./db');

/***** 2. Initialize App *****/
const app = express();
app.use(express.json());
app.use(cors());

// Session middleware:
app.use(cors({
  origin: 'http://localhost:3000', // React app address
  credentials: true               // so the browser can include cookies
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

/***** 3. Existing Routes *****/
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

/***** 4. Auth Routes *****/
// 1. Register
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1. Basic checks
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be >= 6 chars' });
    }

    // 2. Insert or check DB
    const existingUser = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (existingUser) {
      return res.status(409).json({ message: 'Username is already taken' });
    }

    // 3. Hash password, insert user
    const hashedPassword = await bcrypt.hash(password, 10);
    db.prepare('INSERT INTO users (username, password) VALUES (?,?)')
      .run(username, hashedPassword);

    return res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// 2. Login
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password required' });
    }

    // check DB for user
    const user = db.prepare('SELECT * FROM users WHERE username=?').get(username);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // compare password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // valid => set session
    req.session.userId = user.id;
    return res.json({ message: 'Login successful' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// 3. Logout
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

// 4. Protected Route
app.get('/profile', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  // If logged in, fetch user info from DB
  const stmt = db.prepare('SELECT username FROM users WHERE id = ?');
  const user = stmt.get(req.session.userId);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.json({ message: 'Profile data', user });
});

app.get('/home', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  // If logged in, fetch user info from DB
  const stmt = db.prepare('SELECT username FROM users WHERE id = ?');
  const user = stmt.get(req.session.userId);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.json({ message: 'Profile data', user });
});

/***** 5. Start the Server *****/
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
