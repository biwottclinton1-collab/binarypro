const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const app = express();
app.use(express.json());
app.use(express.static('public'));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const JWT_SECRET = 'binarypro_secret_key_2025';

// REGISTER - NEW USERS GET $0
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  const startingBalance = 0.00; // <-- ALL NEW USERS START WITH $0
  try {
    await pool.query('INSERT INTO users2(username,email,password,balance) VALUES($1,$2,$3,$4)',[username, email, hashed, startingBalance]);
    return res.status(200).json({ message: `Registration successful! Please deposit to start trading.`, success: true });
  } catch(e) { 
    return res.status(400).json({ message: 'Email already exists. Try login', success: false }); 
  }
});

// LOGIN
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const result = await pool.query('SELECT * FROM users2 WHERE email=$1', [email]);
  if(result.rows.length === 0) return res.status(400).json({ message: 'Invalid email or password' });
  const user = result.rows[0];
  const valid = await bcrypt.compare(password, user.password);
  if(!valid) return res.status(400).json({ message: 'Invalid email or password' });
  const token = jwt.sign({ id: user.id }, JWT_SECRET);
  res.json({ token });
});

// BALANCE
app.get('/api/balance', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
if(!token) return res.status(401).json({ message: 'No token' });
const decoded = jwt.verify(token, JWT_SECRET);
const result = await pool.query('SELECT balance FROM users2 WHERE id=$1', [decoded.id]);
res.json({ balance: result.rows[0].balance });
});
// PUBLIC BALANCE - NO TOKEN NEEDED
app.get('/api/balance', async (req,res)=>{
  try{
    const result = await pool.query("SELECT balance FROM users2 WHERE email = 'boss1@gmail.com'");
    if(result.rows.length > 0){
      res.json({balance: parseFloat(result.rows[0].balance)})
    } else {
      res.json({balance: 0})
    }
  }catch(e){
    res.json({balance: 0, error: e.message})
  }
});

// TEMP: Give boss admin money - MUST BE ABOVE app.get('*')

// TEMP: Give boss admin money - MUST BE ABOVE app.get('*')
app.post('/api/admin/resetboss', async (req,res)=>{
  try{
    await pool.query('UPDATE users2 SET balance = 8009.52 WHERE email = $1', ['boss1@gmail.com']);
    res.json({msg: 'boss1@gmail.com balance set to 8009.52'});
  }catch(e){ 
    console.log(e)
    res.status(500).json({error: e.message}) 
  }
});

// DEBUG: See DB data - MUST BE ABOVE THE * ROUTE
app.get('/api/debugboss', async (req,res)=>{
  try{
    const u1 = await pool.query('SELECT * FROM users WHERE email = $1', ['boss1@gmail.com']);
    const u2 = await pool.query('SELECT * FROM users2 WHERE email = $1', ['boss1@gmail.com']);
    res.json({
      users_table: u1.rows[0] || "NOT FOUND",
      users2_table: u2.rows[0] || "NOT FOUND"
    });
  }catch(e){
    res.json({error: e.message})
  }
});

// FORCE BALANCE TO READ FROM users2
app.get('/api/balance', async (req,res)=>{
  try{
    // Get email from session/JWT. If you don't have auth yet, keep it hardcoded for now
    const email = req.user?.email || 'boss1@gmail.com'; 
    
    const result = await pool.query('SELECT balance FROM users2 WHERE email = $1', [email]);
    if(result.rows.length > 0){
      res.json({balance: parseFloat(result.rows[0].balance)})
    } else {
      res.json({balance: 0})
    }
  }catch(e){
    res.json({balance: 0, error: e.message})
  }
});

// THIS MUST BE THE VERY LAST ROUTE
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));

app.listen(process.env.PORT || 3000);
