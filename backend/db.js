const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.PG_USER || 'dissertation_user',
  host: process.env.PG_HOST || 'localhost',
  database: process.env.PG_DATABASE || 'dissertation_db',
  password: process.env.PG_PASSWORD || 'mysecretpassword',
  port: process.env.PG_PORT || 5432,
});

module.exports = pool;