// src/pages/LoginPage.js
import React, { useState } from "react";
import axiosInstance from "../axiosInstance";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const res = await axiosInstance.post('/auth/login', {
        email: email.trim(),
        password
      });

      // expected: res.data.token
      const { token, user } = res.data;
      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setMessage('Login successful — redirecting...');
        // small delay so user sees the message
        setTimeout(() => navigate('/dashboard'), 600);
      } else {
        setMessage('Login failed: No token returned');
      }
    } catch (err) {
      console.error('Login error:', err);
      if (err.response) {
        // Server responded with error
        const msg = err.response.data?.msg || `Login failed: ${err.response.status} ${err.response.statusText}`;
        setMessage(msg);
      } else if (err.request) {
        // Request made but no response
        setMessage('Login failed: Cannot connect to server. Is the backend running?');
      } else {
        // Error setting up request
        setMessage('Login failed: ' + err.message);
      }
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="card p-4 shadow" style={{ width: "400px" }}>
        <h2 className="text-center mb-4">Login</h2>
        {message && <p className="text-center text-danger fw-bold">{message}</p>}
        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input type="email" className="form-control" placeholder="you@example.com" value={email} required onChange={(e)=>setEmail(e.target.value)} />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input type="password" className="form-control" placeholder="Enter password" value={password} required onChange={(e)=>setPassword(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary w-100">Login</button>
        </form>
        <p className="text-center mt-3"><small>No account? Register later</small></p>
      </div>
    </div>
  );
}
