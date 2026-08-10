const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('public')); // this shows our signup page

const db = new sqlite3.Database('./binarypro.db');

// Create users table automatically
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT,
    balance REAL DEFAULT 0
)`);

// REGISTER API
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    db.run(`INSERT INTO users (name, email, password) VALUES (?,?,?)`,
    [name, email, hashed], (err) => {
        if(err) return res.json({error: "Email already exists"});
        res.json({message: "Account created! You can now login"});
    });
});

// LOGIN API
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.get(`SELECT * FROM users WHERE email =?`, [email], async (err, user) => {
        if(!user) return res.json({error: "User not found"});
        const ok = await bcrypt.compare(password, user.password);
        if(!ok) return res.json({error: "Wrong password"});
        res.json({message: "Login success", user: {id:user.id, name:user.name, balance:user.balance}});
    });
});

app.listen(5000, () => console.log("Server running on http://localhost:5000"));