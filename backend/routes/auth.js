// routes/auth.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/authMiddleware');

const issueAccessToken = (user) => {
  return jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
};

const issueRefreshToken = (user) => {
  const payload = { id: user._id, email: user.email, role: user.role, jti: Math.random().toString(36).slice(2) };
  const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  return jwt.sign(payload, refreshSecret, { expiresIn: '7d' });
};

const cookieOpts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ msg: 'Please provide email and password' });
    }

    if (password.length < 6) {
      return res.status(400).json({ msg: 'Password must be at least 6 characters long' });
    }

    // Check JWT_SECRET and JWT_REFRESH_SECRET
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not set');
      return res.status(500).json({ msg: 'Server configuration error: JWT_SECRET is missing' });
    }
    
    const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
    if (!refreshSecret) {
      console.error('JWT_REFRESH_SECRET and JWT_SECRET are not set');
      return res.status(500).json({ msg: 'Server configuration error: JWT secrets are missing' });
    }

    // Check database connection
    const dbState = mongoose.connection.readyState;
    if (dbState !== 1) {
      const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
      console.error(`Database connection state: ${states[dbState] || 'unknown'}`);
      return res.status(500).json({ 
        msg: 'Database connection error. Please ensure MongoDB is running and check your MONGO_URI in .env file.' 
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ msg: 'Please provide a valid email address' });
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashed = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = new User({ 
      name: (name || '').trim(), 
      email: normalizedEmail, 
      password: hashed 
    });
    await user.save();

    // Create tokens
    let accessToken, refreshToken;
    try {
      accessToken = issueAccessToken(user);
      refreshToken = issueRefreshToken(user);
    } catch (tokenError) {
      console.error('Token generation error:', tokenError);
      // Delete the user if token generation fails
      await User.findByIdAndDelete(user._id);
      return res.status(500).json({ msg: 'Server configuration error: Unable to generate authentication tokens' });
    }

    // Save refresh token hash
    const hash = await bcrypt.hash(refreshToken, 10);
    user.refreshTokenHash = hash;
    await user.save();

    // Set cookie and return response
    res.cookie('refreshToken', refreshToken, cookieOpts);
    res.status(201).json({ 
      accessToken, 
      refreshToken, 
      user: { 
        id: user._id, 
        email: user.email, 
        role: user.role 
      } 
    });
  } catch (err) {
    // Handle duplicate email error
    if (err && (err.code === 11000 || err.name === 'MongoServerError' || err.message?.includes('duplicate'))) {
      return res.status(400).json({ msg: 'Email already exists' });
    }
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message).join(', ');
      return res.status(400).json({ msg: `Validation error: ${errors}` });
    }

    // Log full error for debugging
    console.error('Register error:', {
      message: err.message,
      stack: err.stack,
      name: err.name,
      code: err.code
    });

    // Return user-friendly error message
    let errorMsg = 'Registration failed. Please try again.';
    if (err.message?.includes('JWT')) {
      errorMsg = 'Server configuration error';
    } else if (err.message?.includes('connection') || err.message?.includes('MongoDB')) {
      errorMsg = 'Database connection error. Please try again later.';
    }
    
    res.status(500).json({ msg: errorMsg });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('name email role');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json({ id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

router.post('/refresh-token', async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    if (!refreshToken) return res.status(400).json({ msg: 'Refresh token required' });
    const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
    const decoded = jwt.verify(refreshToken, refreshSecret);
    const user = await User.findById(decoded.id);
    if (!user || !user.refreshTokenHash) return res.status(401).json({ msg: 'Invalid refresh token' });
    const match = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!match) return res.status(401).json({ msg: 'Invalid refresh token' });
    const newAccessToken = jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const newRefreshToken = jwt.sign({ id: user._id, email: user.email, role: user.role, jti: Math.random().toString(36).slice(2) }, refreshSecret, { expiresIn: '7d' });
    user.refreshTokenHash = await bcrypt.hash(newRefreshToken, 10);
    await user.save();
    res.cookie('refreshToken', newRefreshToken, cookieOpts);
    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    res.status(401).json({ msg: 'Invalid or expired refresh token' });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    if (!refreshToken) return res.status(400).json({ msg: 'Refresh token required' });
    const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
    const decoded = jwt.verify(refreshToken, refreshSecret);
    const user = await User.findById(decoded.id);
    if (!user || !user.refreshTokenHash) return res.status(401).json({ msg: 'Invalid refresh token' });
    const match = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!match) return res.status(401).json({ msg: 'Invalid refresh token' });
    const accessToken = issueAccessToken(user);
    const newRefreshToken = issueRefreshToken(user);
    user.refreshTokenHash = await bcrypt.hash(newRefreshToken, 10);
    await user.save();
    res.cookie('refreshToken', newRefreshToken, cookieOpts);
    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (err) {
    res.status(401).json({ msg: 'Invalid or expired refresh token' });
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

    const accessToken = issueAccessToken(user);
    const refreshToken = issueRefreshToken(user);
    user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await user.save();
    res.cookie('refreshToken', refreshToken, cookieOpts);
    res.json({ accessToken, refreshToken, user: { id: user._id, email: user.email, role: user.role } });
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
 
