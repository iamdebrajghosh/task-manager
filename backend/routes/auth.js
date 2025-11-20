// routes/auth.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ msg: 'Please provide email and password' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ msg: 'User already exists' });

    const saltRounds = 10;
    const hashed = await bcrypt.hash(password, saltRounds);

    const user = new User({ email, password: hashed });
    await user.save();

    // create token
    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ msg: 'User registered', user: { id: user._id, email: user.email }, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ msg: 'Please provide email and password' });
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not set');
      return res.status(500).json({ msg: 'Server configuration error' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ msg: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ msg: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ msg: 'Login successful', user: { id: user._id, email: user.email }, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ msg: 'Server error: ' + err.message });
  }
});

// Update email or password
router.put('/update', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ msg: "No token, unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const { oldPassword, newEmail, newPassword } = req.body;

    // verify old password always
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Old password incorrect" });

    // update email
    if (newEmail) {
      const exists = await User.findOne({ email: newEmail });
      if (exists) return res.status(400).json({ msg: "Email already taken" });

      user.email = newEmail;
    }

    // update password
    if (newPassword) {
      const saltRounds = 10;
      user.password = await bcrypt.hash(newPassword, saltRounds);
    }

    await user.save();

    res.json({ msg: "User updated successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});


module.exports = router;
 