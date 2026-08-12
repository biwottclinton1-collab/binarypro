const express = require('express');
const cors = require('cors');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // serves your index.html

const JWT_SECRET = "supersecretkey123";
const USERS_FILE = "users.json";

// read users
function readUsers() {
  if(!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, "[]");
  return JSON.parse(fs.readFileSync(USERS_FILE));
}
// save users
function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// REGISTER
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;
  let users = readUsers();
  if(users.find(u => u.email === email)) {
    return res.status(400).json({ error: "Email already exists" });
  }
  const hash = await bcrypt.hash(password, 10);
  users.push({ email, password: hash, balance: 8009.52 });
  saveUsers(users);
  const token = jwt.sign({ email }, JWT_SECRET);
  res.json({ token });
});

// LOGIN
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  let users = readUsers();
  const user = users.find(u => u.email === email);
  if(!user) return res.status(400).json({ error: "User not found" });
  const ok = await bcrypt.compare(password, user.password);
  if(!ok) return res.status(400).json({ error: "Wrong password" });
  const token = jwt.sign({ email }, JWT_SECRET);
  res.json({ token });
});

// BALANCE
app.get('/api/balance', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  try {
    const { email } = jwt.verify(token, JWT_SECRET);
    let users = readUsers();
    const user = users.find(u => u.email === email);
    res.json({ balance: user.balance });
  } catch(e) {
    res.status(401).json({ error: "Unauthorized" });
  }
});

// CHART
app.get('/api/chart/:symbol', (req, res) => {
  let price = 9584.63;
  let data = [];
  for(let i = 0; i < 100; i++) {
    price = price + (Math.random() - 0.5) * 20;
    data.push({ time: Date.now() - (100 - i) * 1000, price: parseFloat(price.toFixed(2)) });
  }
  res.json({ price: price.toFixed(2), change: "0", changePercent: "0", data: data });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on " + PORT));
