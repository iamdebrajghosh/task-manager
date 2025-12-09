import { useEffect, useState } from "react";
import axios from "../axiosInstance";
import { toast } from "react-toastify";

export default function Profile() {
  const [data, setData] = useState(null);
  const [nameInput, setNameInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await axios.get("/user/me");
        setData(res.data);
        setNameInput(res.data?.name || "");
      } catch (err) {
        const msg = err.response?.data?.msg || err.response?.data?.error || "Failed to load profile";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const saveName = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.put("/user/update", { name: nameInput });
      setData(res.data);
      toast.success("Name updated");
    } catch (err) {
      const msg = err.response?.data?.msg || err.response?.data?.error || "Failed to update name";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="card shadow-sm border-0">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="h5 mb-0">Profile</h2>
          </div>
          {loading && <div className="spinner" />}
          {error && <div className="alert alert-danger" role="alert">{error}</div>}
          {data && (
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label">Name</label>
                <div className="d-flex gap-2">
                  <input className="form-control" value={nameInput} onChange={(e) => setNameInput(e.target.value)} />
                  <button className="btn btn-primary" onClick={saveName} disabled={loading || !nameInput.trim()}>Save</button>
                </div>
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
