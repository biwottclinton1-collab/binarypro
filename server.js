const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("Mongo Connected"))
 .catch(err => console.log(err));

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  balance: { type: Number, default: 0 },
  referralCode: String
});
const User = mongoose.model('User', userSchema);

// REGISTER
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password, referralCode } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'User already exists' });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, referralCode, balance: 0 });
    await user.save();
    
    res.json({ message: 'User registered successfully', balance: 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LOGIN
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'User not found' });
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Wrong password' });
    
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.json({ message: 'Login success', token, balance: user.balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// BALANCE
app.get('/api/balance', async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    res.json({ balance: user.balance });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
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
