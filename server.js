const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.get('/', (req, res) => {
  res.json({ message: "BinaryPro API is Running with Postgres!" });
});

app.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if(!email ||!password) {
      return res.status(400).json({ error: "Email and password required" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users(email, password) VALUES($1, $2) RETURNING id',
      [email, hashedPassword]
    );
    res.json({ message: "User registered", userId: result.rows[0].id });
  } catch (err) {
    if(err.code === '23505') {
      return res.status(400).json({ error: "Email already exists" });
    }
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
