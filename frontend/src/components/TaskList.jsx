import TaskItem from "./TaskItem";

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
      <div className="task-card card shadow-sm border-0 text-center py-5">
        <div className="d-flex flex-column align-items-center gap-3">
          <div
            className="spinner-border text-primary"
            role="status"
            aria-label="Loading tasks"
          />
          <p className="text-muted mb-0">Loading tasks...</p>
        </div>
      </div>
    );
  }

  if (!tasks.length) {
    return (
      <div className="task-card card shadow-sm border-0 text-center py-5">
        <p className="text-muted mb-0">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="task-card card shadow-sm border-0">
      <ul className="list-group list-group-flush">
        {tasks.map((task) => (
          <TaskItem
            key={task._id}
            task={task}
            onDelete={onDelete}
            onUpdate={onUpdate}
            onNotify={onNotify}
          />
        ))}
      </ul>
    </div>
  );
}
