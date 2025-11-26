const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ["work", "personal", "urgent"],
      default: "personal",
    },
    file: {
      type: String,
      default: null,
    },
    description: {
      type: String,
      default: "",
    },
    completed: {
      type: Boolean,
      default: false,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);
TaskSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Task", TaskSchema);
