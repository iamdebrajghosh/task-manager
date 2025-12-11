import axios from "../axiosInstance";
import { updateTask, deleteTask as deleteTaskApi } from "../api/tasks";
import { useRef, useState } from "react";
import Modal from "react-modal";
import { toast } from "react-toastify";
import { motion } from "framer-motion";

export default function TaskItem({ task, onDelete, onUpdate, onNotify }) {
  const [error, setError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeletingFile, setIsDeletingFile] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || "");
  const fileInputRef = useRef(null);

  const API_BASE =
    process.env.REACT_APP_API_BASE_URL?.replace(/\/$/, "") ||
    "http://localhost:5000";
  const fileUrl = task.file ? `${API_BASE}/uploads/${task.file}` : null;

  const toggleComplete = async () => {
    if (isUpdating || isDeleting) return;
    const previousTask = { ...task };
    const nextCompleted = !task.completed;
    const optimisticTask = { ...task, completed: nextCompleted };

    onUpdate(optimisticTask);
    setError("");
    setIsUpdating(true);

    try {
      const res = await updateTask(task._id, {
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
      await deleteTaskApi(task._id);
      onDelete(task._id);
      onNotify?.("Task deleted.", "success");
      toast.success("Task deleted.");
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

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await axios.post(`/upload/upload/${task._id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onUpdate(res.data.task || res.data);
      onNotify?.("File uploaded.", "success");
      toast.success("File uploaded.");
    } catch (err) {
      console.error("Error uploading file:", err);
      const errorMsg =
        err.response?.data?.msg ||
        err.response?.data?.error ||
        "Failed to upload file";
      setError(errorMsg);
      onNotify?.(errorMsg, "danger");
    } finally {
      setIsUploading(false);
      resetFileInput();
    }
  };

  const handleFileDelete = async () => {
    if (isDeletingFile) return;
    setError("");
    setIsDeletingFile(true);
    try {
      const res = await axios.delete(`/upload/delete/${task._id}`);
      onUpdate(res.data.task || res.data);
      onNotify?.("File deleted.", "success");
      toast.success("File deleted.");
    } catch (err) {
      console.error("Error deleting file:", err);
      const errorMsg =
        err.response?.data?.msg ||
        err.response?.data?.error ||
        "Failed to delete file";
      setError(errorMsg);
      onNotify?.(errorMsg, "danger");
    } finally {
      setIsDeletingFile(false);
    }
  };

  const openEdit = () => {
    setEditTitle(task.title);
    setEditDescription(task.description || "");
    setIsEditOpen(true);
  };

  const saveEdit = async () => {
    try {
      setIsUpdating(true);
      const res = await updateTask(task._id, {
        title: editTitle,
        description: editDescription,
      });
      onUpdate(res.data);
      setIsEditOpen(false);
      toast.success("Task updated.");
    } catch (err) {
      const errorMsg =
        err.response?.data?.msg || err.response?.data?.error || "Failed to update";
      setError(errorMsg);
      onNotify?.(errorMsg, "danger");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <motion.li
      className="list-group-item px-4 py-3 d-flex flex-column gap-3 task-item"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      layout
    >
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
          {task.category && (
            <span className={`badge ms-2 ${
              task.category === "work"
                ? "bg-primary-subtle text-primary"
                : task.category === "urgent"
                ? "bg-danger-subtle text-danger"
                : "bg-info-subtle text-info"
            }`}>{task.category}</span>
          )}
        </div>
        <div className="d-flex align-items-center gap-2">
          {isUpdating && (
            <span className="text-muted small">Updating...</span>
          )}
          <button
            className="btn btn-outline-primary btn-sm"
            onClick={openEdit}
            disabled={isDeleting}
          >
            <i className="bi bi-pencil-square"></i> Edit
          </button>
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
            {!isDeleting && <i className="bi bi-trash"></i>}
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
      <div className="d-flex flex-column flex-lg-row align-items-lg-center gap-3">
        <label className="btn btn-outline-secondary btn-sm mb-0">
          <input
            type="file"
            className="d-none"
            onChange={handleFileUpload}
            disabled={isUploading || isDeleting || isDeletingFile}
            ref={fileInputRef}
          />
          {isUploading ? (
            <span className="d-flex align-items-center gap-2">
              <span
                className="spinner-border spinner-border-sm"
                role="status"
                aria-hidden="true"
              />
              Uploading...
            </span>
          ) : (
            "Upload File"
          )}
        </label>
        {task.file && (
          <div className="d-flex flex-wrap align-items-center gap-2">
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-link btn-sm px-0"
            >
              View file
            </a>
            <button
              className="btn btn-outline-warning btn-sm"
              onClick={handleFileDelete}
              disabled={isDeletingFile}
            >
              {isDeletingFile ? "Deleting..." : "Delete File"}
            </button>
          </div>
        )}
      </div>
      {error && (
        <div className="alert alert-danger mb-0 py-2 px-3" role="alert">
          {error}
        </div>
      )}
      <Modal isOpen={isEditOpen} onRequestClose={() => setIsEditOpen(false)} ariaHideApp={false}>
        <h5 className="mb-3">Edit Task</h5>
        <div className="mb-3">
          <label className="form-label">Title</label>
          <input className="form-control" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
        </div>
        <div className="mb-3">
          <label className="form-label">Description</label>
          <textarea className="form-control" rows={3} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-secondary" onClick={() => setIsEditOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={saveEdit} disabled={isUpdating || !editTitle.trim()}>Save</button>
        </div>
      </Modal>
    </motion.li>
  );
}
