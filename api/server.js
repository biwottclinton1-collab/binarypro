const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors'); // ADDED THIS
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// MIDDLEWARE - THIS FIXES "Register failed"
app.use(cors()); // ADDED THIS LINE
app.use(express.json());

// MONGO CONNECTION
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('Mongo Connected'))
.catch(err => console.log(err));

// USER MODEL
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const User = mongoose.model('User', UserSchema);

// REGISTER ROUTE
app.post('/api/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();
    
    res.status(201).json({ message: 'Account created' });
  } catch (err) {
    res.status(500).json({ message: 'Register failed', error: err.message });
  }
});

// LOGIN ROUTE
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Login failed' });
  }
});

app.listen(PORT, () => console.log(`Server running on ${PORT}`));
module.exports = app;
