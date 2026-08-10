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
  const { username, email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);

  try {
    await pool.query('INSERT INTO users(name, email, password) VALUES ($1,$2,$3)', [username, email, hashed]);
    res.json({message: "Account created! You can now login"});
  } catch (err) {
    console.log(err);
    res.json({message: "Email already exists"});
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
