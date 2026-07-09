import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Home, Briefcase, User, Search, Clock, DollarSign,
  MessageCircle, Settings, LogOut, CreditCard,
  Wallet, Banknote, Calendar, CheckCircle, XCircle,
  Eye, Download, Printer, Phone, Mail, ArrowLeft
} from 'lucide-react';

function EmployerPayments() {
  const [payments, setPayments] = useState([
    {
      id: 1,
      workerName: 'Ahmed Ali',
      position: 'Nanny - Full Time',
      amount: 3500,
      fee: 350,
      total: 3850,
      method: 'InstaPay',
      status: 'completed',
      date: '2026-06-20',
      reference: 'HS-2026-0001'
    },
    {
      id: 2,
      workerName: 'Mona Hassan',
      position: 'Elderly Caregiver',
      amount: 4200,
      fee: 420,
      total: 4620,
      method: 'Vodafone Cash',
      status: 'pending',
      date: '2026-06-18',
      reference: 'HS-2026-0002'
    },
    {
      id: 3,
      workerName: 'Khaled Mostafa',
      position: 'Driver',
      amount: 3800,
      fee: 380,
      total: 4180,
      method: 'Bank Transfer',
      status: 'failed',
      date: '2026-06-15',
      reference: 'HS-2026-0003'
    }
  ]);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'completed':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs flex items-center gap-1">
          <CheckCircle size={12} /> Completed
        </span>;
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs flex items-center gap-1">
          <Clock size={12} /> Pending
        </span>;
      case 'failed':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs flex items-center gap-1">
          <XCircle size={12} /> Failed
        </span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">{status}</span>;
    }
  };

  const getMethodIcon = (method) => {
    switch(method) {
      case 'InstaPay':
        return <Wallet size={16} className="text-blue-600" />;
      case 'Vodafone Cash':
        return <Phone size={16} className="text-green-600" />;
      case 'Bank Transfer':
        return <Banknote size={16} className="text-purple-600" />;
      default:
        return <CreditCard size={16} className="text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg border-r border-gray-200 min-h-screen fixed">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-red-600">HomelyServ</h1>
          <p className="text-xs text-gray-500 mt-1">Employer Panel</p>
        </div>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
              E
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">Employer</p>
              <p className="text-xs text-gray-500">Employer</p>
            </div>
          </div>
        </div>
        <nav className="p-4 space-y-1">
          <Link to="/employer-dashboard" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <Home size={20} /> Dashboard
          </Link>
          <Link to="/employer-search" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <Search size={20} /> Search
          </Link>
          <Link to="/employer-pending" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <Clock size={20} /> Pending
          </Link>
          <Link to="/employer-past" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <Briefcase size={20} /> Past
          </Link>
          <Link to="/employer-payments" className="flex items-center gap-3 px-4 py-3 bg-red-50 text-red-600 rounded-lg">
            <DollarSign size={20} /> Payments
          </Link>
          <Link to="/employer-profile" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <User size={20} /> Profile
          </Link>
          <Link to="/employer-complaints" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <AlertCircle size={20} /> Complaints
          </Link>
          <Link to="/employer-messages" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <MessageCircle size={20} /> Messages
          </Link>
          <Link to="/employer-settings" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <Settings size={20} /> Settings
          </Link>
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <button onClick={() => { localStorage.clear(); window.location.href = '/login'; }} className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 flex-1">
        <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Payments</h2>
              <p className="text-gray-500 text-sm">Manage your payment history</p>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition flex items-center gap-1">
                <Download size={16} /> Export
              </button>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">Total Payments</p>
              <p className="text-2xl font-bold text-gray-800">
                EGP {payments.reduce((sum, p) => sum + p.total, 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                EGP {payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.total, 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                EGP {payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.total, 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">Failed</p>
              <p className="text-2xl font-bold text-red-600">
                EGP {payments.filter(p => p.status === 'failed').reduce((sum, p) => sum + p.total, 0).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Payment Methods Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">Payment Methods</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="font-medium text-blue-800 flex items-center gap-2">
                  <Wallet size={18} /> InstaPay
                </p>
                <p className="text-sm text-blue-600">01009189851</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="font-medium text-green-800 flex items-center gap-2">
                  <Phone size={18} /> Vodafone Cash
                </p>
                <p className="text-sm text-green-600">01009189851</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <p className="font-medium text-purple-800 flex items-center gap-2">
                  <Banknote size={18} /> Bank Transfer
                </p>
                <p className="text-sm text-purple-600">1002425938683</p>
              </div>
            </div>
          </div>

          {/* Payments List */}
          <div className="space-y-4">
            {payments.map((payment) => (
              <div key={payment.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{payment.workerName}</h3>
                    <p className="text-sm text-gray-500">{payment.position}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar size={12} /> {payment.date}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        {getMethodIcon(payment.method)} {payment.method}
                      </span>
                      <span className="text-xs text-gray-500">{payment.reference}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-center min-w-[120px]">
                    <p className="text-sm text-gray-500">Amount</p>
                    <p className="font-bold text-gray-800 text-lg">EGP {payment.total.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">Fee: EGP {payment.fee}</p>
                  </div>

                  <div className="flex flex-col items-end justify-center gap-2 min-w-[130px]">
                    {getStatusBadge(payment.status)}
                    {payment.status === 'pending' && (
                      <button className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition flex items-center gap-1">
                        <CreditCard size={14} /> Pay Now
                      </button>
                    )}
                    <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition">
                      <Eye size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmployerPayments;