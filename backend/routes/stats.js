const express = require("express");
const Task = require("../models/Task");
const { authorizeRoles } = require("../middleware/authMiddleware");
const auth = require("../middleware/authMiddleware");

const router = express.Router();

const countByCategory = (tasks) => {
  const map = { work: 0, personal: 0, urgent: 0 };
  for (const t of tasks) {
    const k = (t.category || "personal").toLowerCase();
    if (map[k] !== undefined) map[k]++;
  }
  return { Work: map.work, Personal: map.personal, Urgent: map.urgent };
};

const dateKey = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

router.get("/stats", auth, authorizeRoles("admin"), async (req, res) => {
  try {
    const { period } = req.query;
    const now = new Date();
    const windows = { "24h": 1, "7d": 7, "30d": 30 };
    const days = windows[period] || 7;
    const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const tasks = await Task.find({ createdAt: { $gte: from } }).lean();

    const total = tasks.length;
    const completed = tasks.filter((t) => !!t.completed).length;
    const pending = total - completed;
    const byCategory = countByCategory(tasks);

    const seriesDays = 7;
    const seriesFrom = new Date(now.getTime() - seriesDays * 24 * 60 * 60 * 1000);
    const seriesTasks = await Task.find({ createdAt: { $gte: seriesFrom } }).lean();
    const buckets = new Map();
    for (let i = 0; i < seriesDays; i++) {
      const d = new Date(now.getTime() - (seriesDays - i) * 24 * 60 * 60 * 1000);
      buckets.set(dateKey(d), { date: d, count: 0 });
    }
    for (const t of seriesTasks) {
      const k = dateKey(new Date(t.createdAt));
      if (buckets.has(k)) buckets.get(k).count++;
    }
    const last7Days = Array.from(buckets.values()).map((b) => ({ date: b.date, count: b.count }));

    res.json({ total, completed, pending, byCategory, last7Days });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/stats/count", auth, authorizeRoles("admin"), async (req, res) => {
  try {
    const total = await Task.countDocuments({});
    res.json({ total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;