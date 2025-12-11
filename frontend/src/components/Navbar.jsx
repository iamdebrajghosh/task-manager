import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth() || {};
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom mb-3">
      <div className="container">
        <Link className="navbar-brand fw-semibold brand-gradient" to={isAuthenticated ? "/dashboard" : "/"}>TodoPro</Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMain">
          <span className="navbar-toggler-icon" />
        </button>
        <div className="collapse navbar-collapse" id="navMain">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            {isAuthenticated && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/dashboard">Dashboard</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/profile">Profile</Link>
                </li>
                {user?.role === "admin" && (
                  <li className="nav-item">
                    <Link className="nav-link" to="/admin/stats">Admin</Link>
                  </li>
                )}
              </>
            )}
          </ul>
          <div className="d-flex align-items-center gap-2">
            {isAuthenticated ? (
              <>
                <span className="text-muted small">{user?.email}</span>
                <button className="btn btn-outline-danger btn-sm" onClick={() => logout?.()}>Logout</button>
              </>
            ) : (
              <>
                <Link className="btn btn-outline-primary btn-sm" to="/login">Login</Link>
                <Link className="btn btn-primary btn-sm" to="/register">Register</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
