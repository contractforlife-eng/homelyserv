import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Search from './pages/Search';
import WorkerProfile from './pages/WorkerProfile';
import WorkerView from './pages/WorkerView';
import MyHires from './pages/MyHires';
import Payment from './pages/Payment';
import AdminDashboard from './pages/AdminDashboard';

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
        <Route path="/my-hires" element={<MyHires />} />
        <Route path="/payment/:hireId" element={<Payment />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;