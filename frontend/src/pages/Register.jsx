import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../axiosInstance";
import { toast } from "react-toastify";

function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Basic validation
    if (!form.email || !form.password) {
      toast.error("Please fill in all required fields");
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post("/auth/register", {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password
      });
      
      if (res.data?.user?.email) {
        toast.success("Registration successful! Please login.");
        navigate("/login", { replace: true });
      } else {
        toast.success("Registration successful! Please login.");
        navigate("/login", { replace: true });
      }
    } catch (err) {
      console.error("Registration error:", err);
      const errorMsg = err.response?.data?.msg || 
                      err.response?.data?.error || 
                      err.message ||
                      "Registration failed. Please try again.";
      
      if (err.code === 'ECONNREFUSED' || err.message?.includes('Network Error')) {
        toast.error("Cannot connect to server. Please check if the backend is running.");
      } else {
        toast.error(errorMsg);
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
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Register</h2>
        <input 
          type="text"
          placeholder="Name" 
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })} 
          style={{ padding: "10px", fontSize: "16px" }}
          required
        />
        <input 
          type="email"
          placeholder="Email" 
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })} 
          style={{ padding: "10px", fontSize: "16px" }}
          required
        />
        <input 
          placeholder="Password" 
          type="password" 
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })} 
          style={{ padding: "10px", fontSize: "16px" }}
          required
        />
        <button 
          type="submit"
          disabled={loading}
          style={{ 
            padding: "10px", 
            fontSize: "16px", 
            backgroundColor: loading ? "#6c757d" : "#28a745", 
            color: "white", 
            border: "none", 
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? "Registering..." : "Register"}
        </button>
        <p style={{ textAlign: "center", marginTop: "10px" }}>
          <a href="/">Already have an account? Login</a>
        </p>
      </form>
    </div>
  );
}

export default Register;

