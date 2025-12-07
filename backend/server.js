// server.js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const compression = require("compression");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config();

const connectDB = require("./config/db");

const authRoutes = require("./routes/auth");
const taskRoutes = require("./routes/taskRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const userRoutes = require("./routes/user");
const statsRoutes = require("./routes/stats");

const app = express();

app.set("trust proxy", "loopback");
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(compression());
app.use(morgan(":remote-addr :method :url :status :response-time ms"));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  try {
    if (req.body) req.body = mongoSanitize.sanitize(req.body);
    if (req.params) req.params = mongoSanitize.sanitize(req.params);
    if (req.query) {
      const sanitized = mongoSanitize.sanitize(req.query);
      Object.keys(req.query).forEach((k) => delete req.query[k]);
      Object.assign(req.query, sanitized);
    }
  } catch (_) {}
  next();
});
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { msg: "Too many requests, please try again later" },
});
app.use(limiter);

// Connect Database
connectDB();

// Test route
app.get("/", (req, res) => res.send("MERN TODO App Backend running"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/user", userRoutes);
app.use("/api/todos", statsRoutes);
app.use("/api/todos", taskRoutes);
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    maxAge: "1d",
  })
);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
