import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../axiosInstance";

function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("/auth/register", form);
      if (res.data?.user?.email) {
        navigate("/login", { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
    } catch (err) {
      alert(err.response?.data?.msg || err.response?.data?.error || "Registration failed");
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
          style={{ 
            padding: "10px", 
            fontSize: "16px", 
            backgroundColor: "#28a745", 
            color: "white", 
            border: "none", 
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Register
        </button>
        <p style={{ textAlign: "center", marginTop: "10px" }}>
          <a href="/">Already have an account? Login</a>
        </p>
      </form>
    </div>
  );
}

export default Register;

