import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getTasks, updateTask } from "../api/tasks";
import TaskInput from "../components/TaskInput";
import TaskList from "../components/TaskList";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "completed", label: "Completed" },
  { id: "pending", label: "Pending" },
];

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [hasMore, setHasMore] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("");
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

        const res = await getTasks({
          status,
          ...(search ? { search } : {}),
          ...(categoryFilter ? { category: categoryFilter } : {}),
          page,
          limit,
        });
        setTasks(res.data);
        setHasMore((res.data?.length || 0) === limit);
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
    [notify, serverSearch, statusFilter, categoryFilter, page, limit]
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
    let cur = tasks;
    if (categoryFilter) {
      cur = cur.filter((t) => t.category === categoryFilter);
    }
    if (!searchTerm.trim()) return cur;
    const term = searchTerm.trim().toLowerCase();
    return cur.filter((task) => task.title.toLowerCase().includes(term));
  }, [tasks, searchTerm, categoryFilter]);

  const completedTasks = useMemo(() => tasks.filter((t) => !!t.completed).length, [tasks]);
  const QUOTES = [
    "Small steps, big results.",
    "Progress, not perfection.",
    "Do the next right thing.",
    "Your future self is cheering for you.",
    "Momentum beats motivation.",
  ];
  const quote = QUOTES[new Date().getDay() % QUOTES.length];
  const [streak, setStreak] = useState({ count: 0, best: 0 });
  const pendingTasks = useMemo(() => tasks.filter((t) => !t.completed), [tasks]);
  const [dailyGoal, setDailyGoal] = useState(3);
  const [activity, setActivity] = useState([]);
  const [daily, setDaily] = useState({ created: 0, completed: 0, pending: 0 });
  const [todayFocus, setTodayFocus] = useState([]);
  const progressDenom = daily.created || pendingTasks.length || dailyGoal;
  const todayPct = progressDenom ? Math.round((daily.completed / progressDenom) * 100) : 0;

  useEffect(() => {
    try {
      const raw = localStorage.getItem("taskStreak");
      if (raw) {
        const obj = JSON.parse(raw);
        setStreak({ count: Number(obj.count) || 0, best: Number(obj.best) || 0 });
      }
      const g = Number(localStorage.getItem("dailyGoal") || 3);
      setDailyGoal(Math.min(10, Math.max(1, g)));
    } catch (_) {}
  }, [completedTasks]);

  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const el = document.getElementById("dash-search-input");
        if (el) el.focus();
      }
      if (e.shiftKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        const el = document.getElementById("new-task-input");
        if (el) el.focus();
      }
      if (e.ctrlKey && e.key.toLowerCase() === "g") {
        e.preventDefault();
        setStatusFilter((cur) => (cur === "all" ? "pending" : cur === "pending" ? "completed" : "all"));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    const loadActivity = async () => {
      try {
        const res = await fetch((process.env.REACT_APP_API_BASE_URL || "/api") + "/user/activity", {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();
        setActivity(data.last7Days || []);
      } catch (_) {}
    };
    const loadToday = async () => {
      try {
        const res = await fetch((process.env.REACT_APP_API_BASE_URL || "/api") + "/user/today", {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        const t = await res.json();
        setDaily({ created: t.created || 0, completed: t.completed || 0, pending: t.pending || 0 });
        setTodayFocus(Array.isArray(t.topPending) ? t.topPending : []);
      } catch (_) {}
    };
    loadActivity();
    loadToday();
  }, []);

  const handleRetry = () => loadTasks();
  const { user: currentUser } = useAuth() || {};

  if (currentUser?.role === "admin") {
    return <Navigate to="/admin/stats" replace />;
  }

  return (
    <div className="dashboard-page py-5">
      <div className="container">
        <section className="dashboard-hero card shadow-sm border-0 mb-4">
          <div className="card-body d-flex flex-column flex-lg-row justify-content-between align-items-start gap-3">
            <div>
              <h1 className="h3 mb-1">Welcome back, {currentUser?.name || "User"}</h1>
              <div className="text-muted small">
                {currentUser?.email} • Role: {currentUser?.role || "user"}
              </div>
              <div className="mt-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="text-muted small">Today’s progress</span>
                  <span className="text-muted small">{daily.completed}/{progressDenom} • {todayPct}%</span>
                </div>
                <div className="progress motivation-progress" role="progressbar" aria-valuenow={todayPct} aria-valuemin="0" aria-valuemax="100">
                  <div className="progress-bar" style={{ width: `${todayPct}%` }} />
                </div>
                <div className="mt-2 text-muted small fst-italic">{quote}</div>
                <div className="mt-2 d-flex gap-3 align-items-center">
                  <span className="badge bg-primary-subtle text-primary">Streak {streak.count}d</span>
                  <span className="badge bg-success-subtle text-success">Best {streak.best}d</span>
                  <span className="text-muted small">Shortcuts: Ctrl+K search • Shift+N new • Ctrl+G cycle</span>
                </div>
                <div className="mt-3 d-flex align-items-center gap-2">
                  <span className="text-muted small">Daily Goal</span>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    style={{ maxWidth: 90 }}
                    value={dailyGoal}
                    min={1}
                    max={10}
                    onChange={(e) => {
                      const v = Math.min(10, Math.max(1, Number(e.target.value || 1)));
                      setDailyGoal(v);
                      localStorage.setItem("dailyGoal", String(v));
                    }}
                  />
                  <span className="badge bg-info-subtle text-info">Aim: {dailyGoal}</span>
                </div>
              </div>
            </div>
            <div className="d-flex gap-2 align-self-lg-center">
              <button
                className="btn btn-outline-secondary"
                onClick={handleRetry}
                disabled={isLoading}
              >
                {isLoading ? "Refreshing..." : "Refresh"}
              </button>
              {currentUser?.role === "admin" && (
                <a className="btn btn-outline-primary" href="/admin/stats">
                  Admin Stats
                </a>
              )}
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
            {!!todayFocus.length && (
              <div className="mt-4 focus-card p-3 rounded-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="m-0">Focus Today</h6>
                  <span className="text-muted small">Top 3 pending</span>
                </div>
                <ul className="list-unstyled m-0">
                  {todayFocus.map((t) => (
                    <li key={t._id} className="d-flex justify-content-between align-items-center py-1">
                      <span className="text-truncate" title={t.title}>{t.title}</span>
                      <button
                        className="btn btn-sm btn-success"
                        onClick={async () => {
                          try {
                            const res = await updateTask(t._id, { completed: true });
                            handleUpdate(res.data);
                            // refresh today summary
                            const sres = await fetch((process.env.REACT_APP_API_BASE_URL || "/api") + "/user/today", { credentials: "include" });
                            const s = await sres.json();
                            setDaily({ created: s.created || 0, completed: s.completed || 0, pending: s.pending || 0 });
                            setTodayFocus(Array.isArray(s.topPending) ? s.topPending : []);
                          } catch (_) {}
                        }}
                      >Complete</button>
                    </li>
                  ))}
                </ul>
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
            <div>
              <label className="form-label fw-semibold small text-muted mb-1">Category</label>
              <select
                className="form-select"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All</option>
                <option value="work">Work</option>
                <option value="personal">Personal</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="flex-grow-1 w-100">
              <label className="form-label fw-semibold small text-muted mb-1">
                Search tasks
              </label>
              <input
                type="search"
                className="form-control form-control-lg"
                placeholder="Type to filter by title..."
                id="dash-search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </section>

        {!!activity.length && (
          <section className="card shadow-sm border-0 mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="m-0">Consistency This Week</h6>
                <span className="text-muted small">Tasks created per day</span>
              </div>
              <div style={{ width: "100%", height: 220 }}>
                <ResponsiveContainer>
                  <BarChart data={activity} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#6c63ff" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>
        )}

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
        <div className="d-flex justify-content-between align-items-center mt-3">
          <button
            className="btn btn-outline-secondary"
            onClick={() => {
              setPage((p) => Math.max(1, p - 1));
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            disabled={isLoading || page === 1}
          >
            Previous
          </button>
          <span className="text-muted small">Page {page}</span>
          <button
            className="btn btn-outline-secondary"
            onClick={() => {
              setPage((p) => p + 1);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            disabled={isLoading || !hasMore}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
