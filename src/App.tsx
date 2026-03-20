import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MainLayout } from './components/MainLayout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { ProjectDetails } from './pages/ProjectDetails';
import { Team } from './pages/Team';
import { Timesheet } from './pages/Timesheet';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { Tasks } from './pages/Tasks';
import { Unauthorized } from './pages/Unauthorized';

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/projects/:id" element={<ProjectDetails />} />
                <Route path="/tasks" element={<Tasks />} />
                
                {/* Admin & Super Admin only */}
                <Route element={<ProtectedRoute allowedRoles={['Super Admin', 'Admin']} />}>
                  <Route path="/team" element={<Team />} />
                  <Route path="/reports" element={<Reports />} />
                </Route>

                <Route path="/timesheet" element={<Timesheet />} />
                <Route path="/settings" element={<Settings />} />
                
                {/* Super Admin only */}
                <Route element={<ProtectedRoute allowedRoles={['Super Admin']} />}>
                  {/* Add any super admin specific pages here if needed */}
                </Route>
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AppProvider>
    </AuthProvider>
  );
}
