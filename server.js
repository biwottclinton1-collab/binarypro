const express = require('express');
const pool = require('./db');
const bcrypt = require('bcrypt');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('public')); // this shows our signup page

// REGISTER API
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);

  try {
    await pool.query('INSERT INTO users(name, email, password) VALUES ($1,$2,$3)', [name, email, hashed]);
    res.json({message: "Account created! You can now login"});
  } catch (err) {
    res.json({error: "Email already exists"});
  }
});

// LOGIN API
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if(!user) return res.json({error: "User not found"});

    const match = await bcrypt.compare(password, user.password);
    if(!match) return res.json({error: "Wrong password"});

    res.json({message: "Login success", user: {id:user.id, name:user.name, balance:user.balance}});
  } catch (err) {
    res.json({error: "Server error"});
  }
});

// FIXED FOR RENDER
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
