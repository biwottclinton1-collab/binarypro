const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET || "binarypro_secret";

// Test Route
app.get('/', (req, res) => {
  res.json({ message: "BinaryPro API is Running!" });
});

// Example User Model
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const User = mongoose.model('User', UserSchema);

// Connect to MongoDB
mongoose.connect(MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
