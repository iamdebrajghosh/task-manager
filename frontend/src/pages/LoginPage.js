import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../axiosInstance";

function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // If already logged in, redirect to dashboard
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Basic validation
    if (!form.email || !form.password) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post("/auth/login", {
        email: form.email.trim(),
        password: form.password
      });
      
      if (res.data.accessToken) {
        localStorage.setItem("token", res.data.accessToken);
        if (res.data.refreshToken) {
          localStorage.setItem("refreshToken", res.data.refreshToken);
        }
        if (res.data.user) {
          localStorage.setItem("user", JSON.stringify(res.data.user));
        }
        navigate("/dashboard", { replace: true });
      } else {
        setError("No token received from server");
      }
    } catch (err) {
      console.error("Login error:", err);
      
      if (err.response) {
        // Server responded with error
        const errorMsg = err.response.data?.msg || err.response.data?.error || `Login failed: ${err.response.status}`;
        setError(errorMsg);
      } else if (err.request) {
        // Request made but no response (server not running or CORS issue)
        setError("Cannot connect to server. Please make sure the backend is running on http://localhost:5000");
      } else {
        // Error setting up request
        setError("An error occurred: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center", 
      minHeight: "100vh",
      padding: "20px"
    }}>
      <form onSubmit={handleSubmit} style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        width: "100%",
        maxWidth: "400px",
        padding: "20px",
        border: "1px solid #ccc",
        borderRadius: "8px"
      }}>
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Login</h2>
        
        {error && (
          <div style={{
            padding: "10px",
            backgroundColor: "#f8d7da",
            color: "#721c24",
            borderRadius: "4px",
            marginBottom: "10px",
            fontSize: "14px"
          }}>
            {error}
          </div>
        )}
        
        <input 
          type="email"
          placeholder="Email" 
          value={form.email}
          onChange={(e) => {
            setForm({ ...form, email: e.target.value });
            setError("");
          }}
          style={{ padding: "10px", fontSize: "16px" }}
          required
          disabled={loading}
        />
        <input 
          placeholder="Password" 
          type="password" 
          value={form.password}
          onChange={(e) => {
            setForm({ ...form, password: e.target.value });
            setError("");
          }}
          style={{ padding: "10px", fontSize: "16px" }}
          required
          disabled={loading}
        />
        <button 
          type="submit"
          disabled={loading}
          style={{ 
            padding: "10px", 
            fontSize: "16px", 
            backgroundColor: loading ? "#6c757d" : "#007bff", 
            color: "white", 
            border: "none", 
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span className="spinner" />
              Logging in...
            </span>
          ) : (
            "Login"
          )}
        </button>
        <p style={{ textAlign: "center", marginTop: "10px" }}>
          <a href="/register">Need an account? Register</a>
        </p>
      </form>
    </div>
  );
}

export default LoginPage;
