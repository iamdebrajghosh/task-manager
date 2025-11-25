const express = require("express");
const Task = require("../models/Task");
const auth = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", auth, async (req, res) => {
  try {
    const { status, search, category } = req.query;
    const query = { userId: req.user.id };
    if (status === "completed") query.completed = true;
    if (status === "pending") query.completed = false;
    if (search) query.title = { $regex: search, $options: "i" };
    if (category && ["work", "personal", "urgent"].includes(category)) {
      query.category = category;
    }
    const tasks = await Task.find(query).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const { title, description, category } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ msg: "Title is required" });
    const task = await Task.create({
      title: title.trim(),
      description: description || "",
      category: ["work", "personal", "urgent"].includes((category || "").toLowerCase()) ? category.toLowerCase() : undefined,
      userId: req.user.id,
    });
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const update = {};
    if (typeof req.body.completed === "boolean") update.completed = req.body.completed;
    if (typeof req.body.title === "string") update.title = req.body.title.trim();
    if (typeof req.body.description === "string") update.description = req.body.description;
    if (typeof req.body.category === "string") {
      const c = req.body.category.toLowerCase();
      if (["work", "personal", "urgent"].includes(c)) update.category = c;
    }
    const task = await Task.findOneAndUpdate({ _id: id, userId: req.user.id }, update, { new: true });
    if (!task) return res.status(404).json({ msg: "Task not found" });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findOneAndDelete({ _id: id, userId: req.user.id });
    if (!task) return res.status(404).json({ msg: "Task not found" });
    res.json({ msg: "Task deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
