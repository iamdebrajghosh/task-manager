import { useEffect, useState } from "react";
import axios from "../axiosInstance";

export default function Profile() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await axios.get("/user/me");
        setData(res.data);
      } catch (err) {
        const msg = err.response?.data?.msg || err.response?.data?.error || "Failed to load profile";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <div className="container py-5">
      <div className="card shadow-sm border-0">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="h5 mb-0">Profile</h2>
            <button className="btn btn-outline-danger" onClick={logout}>Logout</button>
          </div>
          {loading && <div className="spinner" />}
          {error && <div className="alert alert-danger" role="alert">{error}</div>}
          {data && (
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label">Name</label>
                <input className="form-control" value={data.name || ""} readOnly />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label">Email</label>
                <input className="form-control" value={data.email || ""} readOnly />
              </div>
              <div className="col-12">
                <label className="form-label">Change Password</label>
                <input className="form-control" type="password" placeholder="Coming soon" disabled />
              </div>
              {data.role === "admin" && (
                <div className="col-12">
                  <div className="alert alert-info" role="alert">Admin placeholders</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}