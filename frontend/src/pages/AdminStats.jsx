import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import axios from "../axiosInstance";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const COLORS = ["#0d6efd", "#ffc107", "#20c997", "#6f42c1", "#dc3545"]; 

export default function AdminStats() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState("7d");
  const user = (() => {
    try { const raw = localStorage.getItem("user"); return raw ? JSON.parse(raw) : null; } catch (_) { return null; }
  })();

  const isAdmin = !!user && user.role === "admin";

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await axios.get("/todos/stats", { params: { period } });
        setData(res.data);
      } catch (err) {
        const msg = err.response?.data?.msg || err.response?.data?.error || "Failed to load stats";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [period]);

  const completedPending = useMemo(() => {
    if (!data) return [];
    return [
      { name: "Completed", value: data.completed },
      { name: "Pending", value: data.pending },
    ];
  }, [data]);

  const categoryData = useMemo(() => {
    if (!data) return [];
    return [
      { name: "Work", value: data.byCategory?.Work || 0 },
      { name: "Personal", value: data.byCategory?.Personal || 0 },
      { name: "Urgent", value: data.byCategory?.Urgent || 0 },
    ];
  }, [data]);

  const weeklyData = useMemo(() => {
    if (!data) return [];
    return data.last7Days.map((d, idx) => ({ name: new Date(d.date).toLocaleDateString(), count: d.count, idx }));
  }, [data]);

  return (
    <div className="container py-5">
      {!isAdmin && <Navigate to="/dashboard" replace />}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="h4 mb-0">Admin Stats</h2>
        <div className="d-flex gap-2">
          <select className="form-select" value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="24h">Last 24h</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
        </div>
      </div>
      {loading && <div className="spinner" />}
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {data && (
        <div className="row g-4">
          <div className="col-12 col-md-3">
            <div className="card shadow-sm border-0">
              <div className="card-body d-flex align-items-center gap-3">
                <i className="bi bi-list-check fs-3 text-primary" />
                <div>
                  <div className="text-muted small">Total</div>
                  <div className="h5 mb-0">{data.total}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="card shadow-sm border-0">
              <div className="card-body">
                <h6 className="mb-3">Completed vs Pending</h6>
                <div style={{ width: "100%", height: 220 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={completedPending} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                        {completedPending.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-5">
            <div className="card shadow-sm border-0">
              <div className="card-body">
                <h6 className="mb-3">Categories</h6>
                <div style={{ width: "100%", height: 220 }}>
                  <ResponsiveContainer>
                    <BarChart data={categoryData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#0d6efd" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
          <div className="col-12">
            <div className="card shadow-sm border-0">
              <div className="card-body">
                <h6 className="mb-3">Weekly Productivity</h6>
                <div style={{ width: "100%", height: 260 }}>
                  <ResponsiveContainer>
                    <BarChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#20c997" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}