const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const JWT_SECRET = 'binarypro_secret_key_2026';
const ADMIN_EMAIL = 'boss1@gmail.com'; // CHANGE TO YOUR EMAIL FOR $8000

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.query(`CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, username VARCHAR(100), email VARCHAR(100) UNIQUE, password VARCHAR(200), balance DECIMAL(10,2) DEFAULT 0.00)`);

app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  const startingBalance = email === ADMIN_EMAIL? 8000.00 : 0.00;
  try {
    await pool.query('INSERT INTO users(username,email,password,balance) VALUES($1,$2,$3,$4)',[username, email, hashed, startingBalance]);
    res.json({ message: `Account created! You can now login` });
  } catch(e) { res.json({ message: 'Email already exists' }); }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const result = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
  if(result.rows.length === 0) return res.json({ message: 'User not found' });
  const user = result.rows[0];
  const valid = await bcrypt.compare(password, user.password);
  if(!valid) return res.json({ message: 'Wrong password' });
  const token = jwt.sign({ id: user.id }, JWT_SECRET);
  res.json({ token, balance: user.balance });
});

app.get('/api/me', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if(!token) return res.status(401).json({ message: 'No token' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const result = await pool.query('SELECT id, username, email, balance FROM users WHERE id=$1', [decoded.id]);
    res.json(result.rows[0]);
  } catch(e) { res.status(401).json({ message: 'Invalid token' }); }
});

app.post('/api/update-balance', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const { newBalance } = req.body;
  const decoded = jwt.verify(token, JWT_SECRET);
  await pool.query('UPDATE users SET balance=$1 WHERE id=$2', [newBalance, decoded.id]);
  res.json({ balance: newBalance });
});

app.listen(process.env.PORT || 3000);
