import TaskItem from "./TaskItem";
import { AnimatePresence } from "framer-motion";

export default function TaskList({
  tasks,
  isLoading,
  onDelete,
  onUpdate,
  onNotify,
  emptyMessage,
}) {
  if (isLoading) {
    return (
      <div className="task-card card shadow-sm border-0">
        <ul className="list-group list-group-flush">
          {Array.from({ length: 4 }).map((_, idx) => (
            <li key={idx} className="list-group-item px-4 py-3">
              <div className="skeleton-line" style={{ width: "40%" }} />
              <div className="skeleton-line" style={{ width: "25%", marginTop: 8 }} />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (!tasks.length) {
    return (
      <div className="task-card card shadow-sm border-0 text-center py-5">
        <h5 className="mb-2">You're one task away from momentum</h5>
        <p className="text-muted mb-3">{emptyMessage}</p>
        <div className="d-inline-flex align-items-center gap-2 px-3 py-2 rounded-3 bg-light">
          <i className="bi bi-magic" />
          <span className="small text-muted">Try adding a task to kickstart your day</span>
        </div>
      </div>
    );
  }

  return (
    <div className="task-card card shadow-sm border-0">
      <ul className="list-group list-group-flush">
        <AnimatePresence initial={false}>
          {tasks.map((task) => (
            <TaskItem
              key={task._id}
              task={task}
              onDelete={onDelete}
              onUpdate={onUpdate}
              onNotify={onNotify}
            />
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
