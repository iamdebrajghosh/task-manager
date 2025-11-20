import axios from "../axiosInstance";
import { useState } from "react";

export default function TaskItem({ task, onDelete, onUpdate, onNotify }) {
  const [error, setError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const toggleComplete = async () => {
    if (isUpdating || isDeleting) return;
    const previousTask = { ...task };
    const nextCompleted = !task.completed;
    const optimisticTask = { ...task, completed: nextCompleted };

    onUpdate(optimisticTask);
    setError("");
    setIsUpdating(true);

    try {
      const res = await axios.patch(`/tasks/${task._id}`, {
        completed: nextCompleted,
      });
      onUpdate(res.data);
    } catch (err) {
      console.error("Error updating task:", err);
      const errorMsg =
        err.response?.data?.msg ||
        err.response?.data?.error ||
        "Failed to update task";
      setError(errorMsg);
      onNotify?.(errorMsg, "danger");
      onUpdate(previousTask);
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteTask = async () => {
    if (isDeleting) return;

    setError("");
    setIsDeleting(true);
    try {
      await axios.delete(`/tasks/${task._id}`);
      onDelete(task._id);
      onNotify?.("Task deleted.", "success");
    } catch (err) {
      console.error("Error deleting task:", err);
      const errorMsg =
        err.response?.data?.msg ||
        err.response?.data?.error ||
        "Failed to delete task";
      setError(errorMsg);
      onNotify?.(errorMsg, "danger");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <li className="list-group-item px-4 py-3 d-flex flex-column gap-3">
      <div className="d-flex flex-wrap align-items-center gap-3">
        <div className="form-check m-0">
          <input
            className="form-check-input task-checkbox"
            type="checkbox"
            checked={task.completed}
            onChange={toggleComplete}
            disabled={isUpdating || isDeleting}
            aria-label={`Mark ${task.title} as ${
              task.completed ? "pending" : "completed"
            }`}
          />
        </div>
        <div className="flex-grow-1">
          <p
            className={`task-title mb-1 ${
              task.completed ? "text-muted text-decoration-line-through" : ""
            }`}
          >
            {task.title}
          </p>
          <span
            className={`badge ${
              task.completed
                ? "bg-success-subtle text-success"
                : "bg-warning-subtle text-warning"
            }`}
          >
            {task.completed ? "Completed" : "Pending"}
          </span>
        </div>
        <div className="d-flex align-items-center gap-2">
          {isUpdating && (
            <span className="text-muted small">Updating...</span>
          )}
          <button
            className="btn btn-outline-danger btn-sm d-flex align-items-center gap-2"
            onClick={deleteTask}
            disabled={isDeleting}
          >
            {isDeleting && (
              <span
                className="spinner-border spinner-border-sm"
                role="status"
                aria-hidden="true"
              />
            )}
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
      {error && (
        <div className="alert alert-danger mb-0 py-2 px-3" role="alert">
          {error}
        </div>
      )}
    </li>
  );
}
