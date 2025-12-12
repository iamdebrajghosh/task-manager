import { useState } from "react";
import { toast } from "react-toastify";
import { createTask } from "../api/tasks";

export default function TaskInput({ onAdd }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("personal");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdd = async () => {
    if (!title.trim() || isSubmitting) return;

    try {
      setError("");
      setIsSubmitting(true);
      const res = await createTask({ title: title.trim(), category });
      onAdd(res.data);
      setTitle("");
      setCategory("personal");
      toast.success("Todo Added!");
    } catch (err) {
      console.error("Error adding task:", err);
      const errorMsg =
        err.response?.data?.msg ||
        err.response?.data?.error ||
        "Something went wrong. Please try again.";
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="task-input">
      <label className="form-label fw-semibold text-muted small mb-1">
        Create a task
      </label>
      <div className="d-flex flex-column flex-md-row gap-2">
        <div className="w-100 w-md-auto" style={{ maxWidth: 220 }}>
          <select
            className="form-select form-select-lg"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={isSubmitting}
          >
            <option value="work">Work</option>
            <option value="personal">Personal</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        <input
          className="form-control form-control-lg"
          placeholder="e.g. Follow up with marketing"
          id="new-task-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSubmitting}
        />
        <button
          className="btn btn-primary btn-lg d-flex align-items-center justify-content-center gap-2"
          onClick={handleAdd}
          disabled={isSubmitting || !title.trim()}
        >
          {isSubmitting && (
            <span
              className="spinner-border spinner-border-sm"
              role="status"
              aria-hidden="true"
            />
          )}
          {isSubmitting ? "Adding..." : "Add Task"}
        </button>
      </div>
      {error && (
        <div className="alert alert-danger py-2 px-3 mt-3 mb-0" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
