const express = require('express');
const bcrypt = require('bcrypt');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

const JWT_SECRET = "binarypro_secret_key";

// FAKE DATABASE IN MEMORY
let users = [];

// REGISTER API
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  
  users.push({id: users.length + 1, name: username, email, password: hashed});
  res.json({message: "Account created! You can now login"});
});

// LOGIN API
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);
  
  if(!user) return res.status(400).json({message: "User not found"});
  
  const valid = await bcrypt.compare(password, user.password);
  if(!valid) return res.status(400).json({message: "Wrong password"});

  const token = jwt.sign({id: user.id}, JWT_SECRET);
  res.json({message: "Login successful", token});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
