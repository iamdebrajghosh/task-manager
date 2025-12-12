const express = require("express");
const User = require("../models/User");
const Task = require("../models/Task");
const auth = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("name email role");
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json({ id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/update", auth, async (req, res) => {
  try {
    const { name } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: "User not found" });
    if (typeof name === "string") {
      user.name = name.trim();
    }
    await user.save();
    res.json({ id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/activity", auth, async (req, res) => {
  try {
    const now = new Date();
    const days = 7;
    const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const tasks = await Task.find({ userId: req.user.id, createdAt: { $gte: from } }).select("createdAt").lean();
    const buckets = new Map();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      buckets.set(key, { date: key, count: 0 });
    }
    for (const t of tasks) {
      const d = new Date(t.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (buckets.has(key)) buckets.get(key).count++;
    }
    res.json({ last7Days: Array.from(buckets.values()) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/today", auth, async (req, res) => {
  try {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

    const created = await Task.countDocuments({
      userId: req.user.id,
      createdAt: { $gte: start, $lt: end },
    });

    const completed = await Task.countDocuments({
      userId: req.user.id,
      completed: true,
      updatedAt: { $gte: start, $lt: end },
    });

    const pending = await Task.countDocuments({
      userId: req.user.id,
      createdAt: { $gte: start, $lt: end },
      completed: false,
    });

    const topPending = await Task.find({
      userId: req.user.id,
      createdAt: { $gte: start, $lt: end },
      completed: false,
    })
      .sort({ createdAt: 1 })
      .limit(3)
      .select("title category completed")
      .lean();

    res.json({ created, completed, pending, topPending });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
