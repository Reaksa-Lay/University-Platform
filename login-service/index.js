// login-service/index.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const connectDB = require('./db');
const User = require('./User');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5002;

app.use(express.json());

connectDB();

app.get('/auth/ping', (req, res) => {
  res.json({ message: 'reached login service via gateway' });
});

// Task 6: POST /auth/login
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ error: 'email, password and role are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email' });
    }

    // Check role matches
    if (user.role !== role) {
      return res.status(401).json({ error: 'Invalid role' });
    }

    // Check password matches the hashed one
    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // All matched -> issue JWT
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }       // 1h : Token is valid for 1 hour, 1m : Token is valid for 1 minute
    );

    res.status(200).json({
      message: 'Login successful',
      token
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Login service running on ${PORT}`));