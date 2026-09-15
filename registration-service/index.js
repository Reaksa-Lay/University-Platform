// registration-service/index.js
const express = require('express');
const bcrypt = require('bcryptjs');
const connectDB = require('./db');
const User = require('./User');
require('dotenv').config();
 
const app = express();
const PORT = process.env.PORT || 5001;
 
app.use(express.json());
 
connectDB();
 
app.get('/register/ping', (req, res) => {
  res.json({ message: 'reached registration service via gateway' });
});
 
// Task 5: POST /register/userregister
app.post('/register/userregister', async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;
 
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email and password are required' });
    }
 
    // Check email is unique
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }
 
    // Hash password - never store plain text
    const hashedPassword = await bcrypt.hash(password, 10);
 
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'user',
      phone
    });
 
    await newUser.save();
 
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
 
app.listen(PORT, () => console.log(`Registration service running on ${PORT}`));
 