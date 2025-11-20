const express = require("express");
const Task = require("../models/Task");
const auth = require("../middleware/authMiddleware");
const router = express.Router();

// Create Task
router.post("/", auth, async (req, res) => {
  try {
    const { title, description } = req.body;

    const task = await Task.create({
      title,
      description,
      userId: req.user.id,
    });

    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all tasks for logged-in user
router.get("/", auth, async (req, res) => {
  try {
    const { status = "all", search = "" } = req.query;
    const normalizedStatus = String(status).toLowerCase();
    const searchTerm = search ? String(search).trim() : "";
    const query = { userId: req.user.id };

    if (normalizedStatus === "completed") {
      query.completed = true;
    } else if (normalizedStatus === "pending") {
      query.completed = false;
    }

    if (searchTerm) {
      query.title = { $regex: searchTerm, $options: "i" };
    }

    const tasks = await Task.find(query).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: "Failed to load tasks. Please try again." });
  }
});

// Update task
router.patch("/:id", auth, async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    );

    if (!task) return res.status(404).json({ msg: "Task not found" });

    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete task
router.delete("/:id", auth, async (req, res) => {
  try {
    console.log("Delete request received for task ID:", req.params.id);
    console.log("User ID from token:", req.user.id);
    
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!task) {
      console.log("Task not found or doesn't belong to user");
      return res.status(404).json({ msg: "Task not found" });
    }

    console.log("Task deleted successfully");
    res.json({ msg: "Task deleted" });
  } catch (err) {
    console.error("Delete task error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
