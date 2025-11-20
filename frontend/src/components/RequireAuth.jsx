// src/components/RequireAuth.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

export default function RequireAuth({ children }) {
  const token = localStorage.getItem('token');
  const location = useLocation();

  if (!token) {
    // redirect to login and keep current location for after-login redirect (if needed)
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
}
