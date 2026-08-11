const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const app = express();
app.use(express.json());
app.use(express.static('public'));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// TEMP WIPE - RUNS 3 SECONDS AFTER START TO DELETE ALL OLD USERS
setTimeout(()=>{
  pool.query('DELETE FROM users2').then(()=>console.log('DB WIPED')).catch(e=>console.log(e));
},3000);

const JWT_SECRET = 'binarypro_secret_key_2025';

// REGISTER - NEW USERS GET $0
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  const startingBalance = 0.00; 
  try {
    await pool.query('INSERT INTO users2(username,email,password,balance) VALUES($1,$2,$3,$4)',[username, email, hashed, startingBalance]);
    return res.status(200).json({ message: `Registration successful! Please deposit to start trading.`, success: true });
  } catch(e) { 
    return res.status(400).json({ message: 'Email already exists. Try login', success: false }); 
  }
});

// LOGIN
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const result = await pool.query('SELECT * FROM users2 WHERE email=$1', [email]);
  if(result.rows.length === 0) return res.status(400).json({ message: 'Invalid email or password' });
  const user = result.rows[0];
  const valid = await bcrypt.compare(password, user.password);
  if(!valid) return res.status(400).json({ message: 'Invalid email or password' });
  const token = jwt.sign({ id: user.id }, JWT_SECRET);
  res.json({ token });
});

// BALANCE
app.get('/api/balance', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if(!token) return res.status(401).json({ message: 'No token' });
  const decoded = jwt.verify(token, JWT_SECRET);
  const result = await pool.query('SELECT balance FROM users2 WHERE id=$1', [decoded.id]);
  res.json({ balance: result.rows[0].balance });
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));
app.listen(process.env.PORT || 3000);
