// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  // Try multiple ways to get the token
  const authHeader = req.headers.authorization || req.headers.Authorization || req.header('Authorization');
  const token = authHeader?.split(' ')[1]; // 'Bearer <token>'
  
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not set');
      return res.status(500).json({ msg: 'Server configuration error' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Token verification error:', err.message);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

module.exports = auth;
