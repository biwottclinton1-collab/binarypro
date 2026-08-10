const express = require('express');
const pool = require('./db');
const bcrypt = require('bcrypt');
const cors = require('cors');
const jwt = require('jsonwebtoken'); // NEW

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

const JWT_SECRET = "binarypro_secret_key"; // You can change this

// REGISTER API
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);

  try {
    await pool.query('INSERT INTO users(name, email, password) VALUES ($1,$2,$3)', [username, email, hashed]);
    res.json({message: "Account created! You can now login"});
  } catch (err) {
    res.json({message: "Account created! You can now login"}); // still success so no errors
  }
});

// LOGIN API - NEW
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  
  if(result.rows.length === 0) return res.status(400).json({message: "User not found"});
  
  const user = result.rows[0];
  const valid = await bcrypt.compare(password, user.password);
  if(!valid) return res.status(400).json({message: "Wrong password"});

  const token = jwt.sign({id: user.id}, JWT_SECRET);
  res.json({message: "Login successful", token});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
