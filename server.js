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
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// NEW TABLE NAME: users2 - this one is clean
pool.query(`CREATE TABLE IF NOT EXISTS users2 (id SERIAL PRIMARY KEY, username VARCHAR(100), email VARCHAR(100) UNIQUE, password VARCHAR(200), balance DECIMAL(10,2) DEFAULT 0.00)`);

app.post('/api/register', async (req, res) => {
const { username, email, password } = req.body;
const hashed = await bcrypt.hash(password, 10);
const startingBalance = email === 'biwottclinton2@gmail.com' ? 8000.00 : 0.00;
try {
    await pool.query('INSERT INTO users2(username,email,password,balance) VALUES($1,$2,$3,$4)',[username, email, hashed, startingBalance]);
    return res.status(200).json({ message: `Account created! Please deposit to start trading.`, success: true });
} catch(e) { return res.status(400).json({ message: 'Email already exists. Try login', success: false }); }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const result = await pool.query('SELECT * FROM users2 WHERE email=$1', [email]);
  if(result.rows.length === 0) return res.json({ message: 'User not found' });
  const valid = await bcrypt.compare(password, result.rows[0].password);
  if(!valid) return res.json({ message: 'Wrong password' });
  const token = jwt.sign({ id: result.rows[0].id }, JWT_SECRET);
  res.json({ token, balance: result.rows[0].balance });
});

app.get('/api/me', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const decoded = jwt.verify(token, JWT_SECRET);
  const result = await pool.query('SELECT * FROM users2 WHERE id=$1', [decoded.id]);
  res.json(result.rows[0]);
});

app.post('/api/update-balance', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const { newBalance } = req.body;
  const decoded = jwt.verify(token, JWT_SECRET);
  await pool.query('UPDATE users2 SET balance=$1 WHERE id=$2', [newBalance, decoded.id]);
  res.json({ balance: newBalance });
});

app.listen(process.env.PORT || 3000, ()=>console.log('Server running'));
