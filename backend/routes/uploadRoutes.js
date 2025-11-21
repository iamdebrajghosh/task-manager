const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const Task = require("../models/Task");
const auth = require("../middleware/authMiddleware");

const router = express.Router();

const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

router.post(
  "/upload/:taskId",
  auth,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ msg: "No file provided" });
      }

      const task = await Task.findOne({
        _id: req.params.taskId,
        userId: req.user.id,
      });

      if (!task) return res.status(404).json({ msg: "Task not found" });

      task.file = req.file.filename;
      await task.save();

      res.json({ msg: "File uploaded", task });
    } catch (err) {
      console.error("File upload error:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

router.delete("/delete/:taskId", auth, async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.taskId,
      userId: req.user.id,
    });

    if (!task) return res.status(404).json({ msg: "Task not found" });

    if (task.file) {
      const filePath = path.join(uploadsDir, task.file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      task.file = null;
    }

    await task.save();

    res.json({ msg: "File deleted", task });
  } catch (err) {
    console.error("File delete error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

