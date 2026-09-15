// user-service/index.js
const express = require('express');
const jwt = require('jsonwebtoken');
const connectDB = require('./db');
const User = require('./User');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5004;

app.use(express.json());

connectDB();

// Re-decode the token here to know WHICH user is calling.
// (The Gateway already verified it's valid + role=user before forwarding,
// this just extracts the identity for this service to use.)
function identifyUser(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader.split(' ')[1];

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    req.user = decoded; // { id, email, role }
    next();
  });
}

app.get('/user/ping', (req, res) => {
  res.json({ message: 'reached user service via gateway' });
});

// Task 9: GET /user/viewprofile
app.get('/user/viewprofile', identifyUser, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email }).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Task 9: PUT /user/updateprofile
// Only allows updating name and phone - not email, password, or role
app.put('/user/updateprofile', identifyUser, async (req, res) => {
  try {
    const { name, phone } = req.body;

    const updatedUser = await User.findOneAndUpdate(
      { email: req.user.email },
      { $set: { name, phone } },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`User service running on ${PORT}`));