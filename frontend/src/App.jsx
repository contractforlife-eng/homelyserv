import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Search from './pages/Search';
import WorkerProfile from './pages/WorkerProfile';
import WorkerView from './pages/WorkerView';
import EmployerProfile from './pages/EmployerProfile';
import MyHires from './pages/MyHires';
import Payment from './pages/Payment';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminHires from './pages/AdminHires';
import AdminPayments from './pages/AdminPayments';
import AdminReports from './pages/AdminReports';
import AdminSettings from './pages/AdminSettings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/search" element={<Search />} />
        <Route path="/worker/:id" element={<WorkerProfile />} />
        <Route path="/worker-dashboard" element={<WorkerView />} />
        <Route path="/employer-profile" element={<EmployerProfile />} />
        <Route path="/my-hires" element={<MyHires />} />
        <Route path="/payment/:hireId" element={<Payment />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/hires" element={<AdminHires />} />
        <Route path="/admin/payments" element={<AdminPayments />} />
        <Route path="/admin/reports" element={<AdminReports />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;