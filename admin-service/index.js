// admin-service/index.js
const express = require('express');
const connectDB = require('./db');
const User = require('./User');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5003;

app.use(express.json());

connectDB();

app.get('/admin/ping', (req, res) => {
  res.json({ message: 'reached admin service via gateway' });
});

// Task 8: GET /admin/searchuser?query=...
// Search by name or email (partial match, case-insensitive)
app.get('/admin/searchuser', async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'query parameter is required (name or email)' });
    }

    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    }).select('-password'); // never send password back

    if (users.length === 0) {
      return res.status(404).json({ message: 'No user found' });
    }

    res.status(200).json({ count: users.length, users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Task 8: GET /admin/viewalluser
app.get('/admin/viewalluser', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({ count: users.length, users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Task 8: DELETE /admin/deluser
app.delete('/admin/deluser', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'email is required in request body' });
    }

    const deletedUser = await User.findOneAndDelete({ email });

    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User deleted successfully', email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Admin service running on ${PORT}`));