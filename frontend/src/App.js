import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import RequireAuth from './components/RequireAuth';
import Profile from './pages/Profile';
import AdminStats from './pages/AdminStats';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<Register />} />
        <Route 
          path="/dashboard" 
          element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
          } 
        />
        <Route 
          path="/profile" 
          element={
          <RequireAuth>
            <Profile />
          </RequireAuth>
          } 
        />
        <Route 
          path="/admin/stats" 
          element={
          <RequireAuth>
            <AdminStats />
          </RequireAuth>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
