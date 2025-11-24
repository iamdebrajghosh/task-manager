import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "../axiosInstance";
import TaskInput from "../components/TaskInput";
import TaskList from "../components/TaskList";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "completed", label: "Completed" },
  { id: "pending", label: "Pending" },
];

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [serverSearch, setServerSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  useEffect(() => {
    const timeoutId = setTimeout(
      () => setServerSearch(searchTerm.trim()),
      350
    );
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const notify = useCallback((message, variant = "danger") => {
    if (!message) return;
    setToast({ message, variant });
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = setTimeout(() => setToast(null), 4000);
  }, []);

  const loadTasks = useCallback(
    async ({
      status = statusFilter,
      search = serverSearch,
      silent = false,
    } = {}) => {
      try {
        if (!silent) setIsLoading(true);
        setError("");

        const res = await axios.get("/tasks", {
          params: {
            status,
            ...(search ? { search } : {}),
          },
        });
        setTasks(res.data);
      } catch (err) {
        console.error("Error loading tasks:", err);
        const errorMsg =
          err.response?.data?.msg ||
          err.response?.data?.error ||
          "Failed to load tasks. Please try again.";
        setError(errorMsg);
        notify(errorMsg);
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [notify, serverSearch, statusFilter]
  );

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(
    () => () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    },
    []
  );

  const matchesCurrentView = (task) => {
    if (statusFilter === "completed" && !task.completed) return false;
    if (statusFilter === "pending" && task.completed) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      return task.title.toLowerCase().includes(term);
    }
    return true;
  };

  const handleTaskAdded = (task) => {
    if (matchesCurrentView(task)) {
      setTasks((prev) => [task, ...prev]);
    }
    if (statusFilter !== "all" || serverSearch) {
      loadTasks({ status: statusFilter, search: serverSearch, silent: true });
    }
  };

  const handleDelete = (id) =>
    setTasks((prev) => prev.filter((t) => t._id !== id));

  const handleUpdate = (updated) =>
    setTasks((prev) =>
      prev.map((t) => (t._id === updated._id ? updated : t))
    );

  const filteredTasks = useMemo(() => {
    if (!searchTerm.trim()) return tasks;
    const term = searchTerm.trim().toLowerCase();
    return tasks.filter((task) => task.title.toLowerCase().includes(term));
  }, [tasks, searchTerm]);

  const handleRetry = () => loadTasks();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const currentUser = (() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  })();

  return (
    <div className="dashboard-page py-5">
      <div className="container">
        <section className="dashboard-hero card shadow-sm border-0 mb-4">
          <div className="card-body d-flex flex-column flex-lg-row justify-content-between align-items-start gap-3">
            <div>
              <p className="text-uppercase fw-semibold text-primary small mb-1">
                Welcome back
              </p>
              <h1 className="h3 mb-2">Stay on top of every task</h1>
              <p className="text-muted mb-0">
                Filter, search, and manage your to-dos without losing momentum.
              </p>
            </div>
            <div className="d-flex gap-2 align-self-lg-center">
              <button
                className="btn btn-outline-secondary"
                onClick={handleRetry}
                disabled={isLoading}
              >
                {isLoading ? "Refreshing..." : "Refresh"}
              </button>
              <button className="btn btn-outline-danger" onClick={logout}>
                Logout
              </button>
            </div>
          </div>
        </section>

        {toast && (
          <div
            className={`alert alert-${toast.variant} d-flex justify-content-between align-items-center`}
            role="alert"
          >
            <span>{toast.message}</span>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={() => setToast(null)}
            />
          </div>
        )}

        <section className="card shadow-sm border-0 mb-4">
          <div className="card-body">
            <TaskInput onAdd={handleTaskAdded} />
            {currentUser?.role === "admin" && (
              <div className="mt-3 d-flex gap-2">
                <button className="btn btn-outline-primary btn-sm">Admin Action A</button>
                <button className="btn btn-outline-primary btn-sm">Admin Action B</button>
              </div>
            )}
          </div>
        </section>

        <section className="card shadow-sm border-0 mb-4">
          <div className="card-body d-flex flex-column flex-lg-row gap-3 align-items-lg-center">
            <div className="filter-group btn-group" role="group">
              {FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  className={`btn btn-outline-primary ${
                    statusFilter === filter.id ? "active" : ""
                  }`}
                  onClick={() => setStatusFilter(filter.id)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <div className="flex-grow-1 w-100">
              <label className="form-label fw-semibold small text-muted mb-1">
                Search tasks
              </label>
              <input
                type="search"
                className="form-control form-control-lg"
                placeholder="Type to filter by title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </section>

        {error && (
          <div className="alert alert-danger d-flex justify-content-between align-items-center">
            <span>{error}</span>
            <button className="btn btn-sm btn-outline-light" onClick={handleRetry}>
              Try again
            </button>
          </div>
        )}

        <TaskList
          tasks={filteredTasks}
          isLoading={isLoading}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
          onNotify={notify}
          emptyMessage={
            searchTerm
              ? "No tasks match your search."
              : "You're all caught up. Enjoy the momentum!"
          }
        />
      </div>
    </div>
  );
}
