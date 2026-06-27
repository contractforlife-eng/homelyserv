import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Search from './pages/Search';
import MyHires from './pages/MyHires';
import WorkerProfile from './pages/WorkerProfile';
import Profile from './pages/Profile';
import Payment from './pages/Payment';
import AdminDashboard from './pages/AdminDashboard';
import EmployerDashboard from './pages/EmployerDashboard';
import WorkerDashboard from './pages/WorkerDashboard';
import Notifications from './pages/Notifications';
import Messages from './pages/Messages';
import Settings from './pages/Settings';
import JobDetails from './pages/JobDetails';
import ForgotPassword from './pages/ForgotPassword';
import About from './pages/About';
import Contact from './pages/Contact';
import Terms from './pages/Terms';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/search" element={<Search />} />
      <Route path="/my-hires" element={<MyHires />} />
      <Route path="/worker/:id" element={<WorkerProfile />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/payment/:hireId" element={<Payment />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/employer-dashboard" element={<EmployerDashboard />} />
      <Route path="/worker-dashboard" element={<WorkerDashboard />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/messages" element={<Messages />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/job/:id" element={<JobDetails />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;