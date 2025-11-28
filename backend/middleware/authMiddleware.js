const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  const headerToken = req.headers.authorization || req.headers.Authorization;
  const bearerToken = headerToken && headerToken.startsWith("Bearer ") ? headerToken.split(" ")[1] : null;
  const token = bearerToken || req.header("x-auth-token");

  if (!token) return res.status(401).json({ msg: "No token, access denied" });

  try {
    const secret = process.env.JWT_SECRET || "dev-secret";
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(400).json({ msg: "Invalid token" });
  }
};

const authorizeRoles = (...allowed) => (req, res, next) => {
  const role = req.user?.role;
  if (!role) return res.status(403).json({ msg: "Forbidden" });
  if (!allowed.includes(role)) return res.status(403).json({ msg: "Forbidden" });
  next();
};

module.exports = auth;
module.exports.authorizeRoles = authorizeRoles;
