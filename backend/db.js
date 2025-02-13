// db.js
const Database = require('better-sqlite3');
const db = new Database('mydb.sqlite'); // creates a file if it doesn't exist

// Create a users table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  )
`);

module.exports = db;
