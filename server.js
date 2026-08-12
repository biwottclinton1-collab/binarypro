const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const JWT_SECRET = "supersecretkey123";

// MEMORY DATABASE - resets when Render sleeps
let users = [
  { email: "admin@admin.com", password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", balance: 8009.52 } // password = password
];

// REGISTER
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;
  if(users.find(u => u.email === email)) {
    return res.status(400).json({ error: "Email already exists" });
  }
  const hash = await bcrypt.hash(password, 10);
  users.push({ email, password: hash, balance: 0 }); // NEW USERS = $0
  res.json({ success: true, message: "Registered. Please login" }); // NO AUTO LOGIN
});

// LOGIN
document.getElementById('loginBtn').onclick = async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({email, password})
  });
  
  const data = await res.json();
  
  if(res.ok) { // ONLY redirect if success
    localStorage.setItem('token', data.token);
    window.location = '/dashboard.html';
  } else {
    alert(data.error); // Show "User not found" or "Wrong password"
  }
}
});

// BALANCE
app.get('/api/balance', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  try {
    const { email } = jwt.verify(token, JWT_SECRET);
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
  res.json({ price: price.toFixed(2), change: (Math.random()*100-50).toFixed(2), changePercent: (Math.random()*1-0.5).toFixed(2), data: data });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on " + PORT));
