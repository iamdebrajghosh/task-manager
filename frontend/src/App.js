import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Profile from './pages/Profile';
import AdminStats from './pages/AdminStats';
import './App.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<Register />} />
        <Route 
          path="/dashboard" 
          element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/stats" 
          element={
          <ProtectedRoute>
            <AdminStats />
          </ProtectedRoute>
          } 
        />
      </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
