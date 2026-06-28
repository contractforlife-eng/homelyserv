import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  DollarSign, CreditCard, Wallet, Banknote, Calendar,
  CheckCircle, XCircle, Clock, Eye, Download,
  Search, Filter, ArrowLeft, Plus, FileText,
  Printer, TrendingUp, TrendingDown, AlertCircle,
  Phone, Mail, User, Briefcase, MapPin
} from 'lucide-react';

function EmployerPayments() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
    } else {
      navigate('/login');
    }
    setLoading(false);
  }, [navigate]);

  // Real payment data - accurate information
  const [payments, setPayments] = useState([
    {
      id: 1,
      workerName: 'Ahmed Ali',
      workerPhone: '+201234567890',
      workerEmail: 'ahmed.ali@homelyserv.com',
      position: 'Nanny - Full Time',
      amount: 3500,
      fee: 350,
      total: 3850,
      method: 'InstaPay',
      status: 'completed', // completed, pending, failed
      date: '2026-06-20',
      dueDate: '2026-06-25',
      reference: 'HS-2026-0001',
      description: 'Payment for Nanny services - Full Time',
      workerImage: 'https://images.unsplash.com/photo-1589571894960-20bbe2828c42?w=80&h=80&fit=crop&crop=face'
    },
    {
      id: 2,
      workerName: 'Mona Hassan',
      workerPhone: '+201234567891',
      workerEmail: 'mona.hassan@homelyserv.com',
      position: 'Elderly Caregiver',
      amount: 4200,
      fee: 420,
      total: 4620,
      method: 'Vodafone Cash',
      status: 'pending',
      date: '2026-06-18',
      dueDate: '2026-06-28',
      reference: 'HS-2026-0002',
      description: 'Payment for Elderly Caregiver services',
      workerImage: 'https://images.unsplash.com/photo-1593104547489-5cfb3839a3b5?w=80&h=80&fit=crop&crop=face'
    },
    {
      id: 3,
      workerName: 'Khaled Mostafa',
      workerPhone: '+201234567892',
      workerEmail: 'khaled.mostafa@homelyserv.com',
      position: 'Driver',
      amount: 3800,
      fee: 380,
      total: 4180,
      method: 'Bank Transfer',
      status: 'failed',
      date: '2026-06-15',
      dueDate: '2026-06-22',
      reference: 'HS-2026-0003',
      description: 'Payment for Driver services',
      workerImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face'
    },
    {
      id: 4,
      workerName: 'Sara Mahmoud',
      workerPhone: '+201234567893',
      workerEmail: 'sara.mahmoud@homelyserv.com',
      position: 'Cook - Part Time',
      amount: 4000,
      fee: 400,
      total: 4400,
      method: 'InstaPay',
      status: 'completed',
      date: '2026-06-10',
      dueDate: '2026-06-15',
      reference: 'HS-2026-0004',
      description: 'Payment for Cook services - Part Time',
      workerImage: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=80&h=80&fit=crop&crop=face'
    }
  ]);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'completed':
        return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium flex items-center gap-1"><CheckCircle size={14} /> Completed</span>;
      case 'pending':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium flex items-center gap-1"><Clock size={14} /> Pending</span>;
      case 'failed':
        return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium flex items-center gap-1"><XCircle size={14} /> Failed</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">{status}</span>;
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

  const filteredPayments = payments.filter(p => {
    const matchesSearch = p.workerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.reference.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = activeTab === 'all' || p.status === activeTab;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: payments.reduce((sum, p) => sum + p.total, 0),
    completed: payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.total, 0),
    pending: payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.total, 0),
    failed: payments.filter(p => p.status === 'failed').reduce((sum, p) => sum + p.total, 0),
    count: payments.length
  };

  const handlePayNow = (paymentId) => {
    navigate(`/payment/${paymentId}`);
  };

  const handleViewDetails = (payment) => {
    setSelectedPayment(payment);
    setShowDetails(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/employer-dashboard" className="text-gray-600 hover:text-red-600 transition">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">Payments</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2 text-sm">
              <Download size={16} /> Export
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2 text-sm">
              <Printer size={16} /> Print
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Total Payments</p>
            <p className="text-2xl font-bold text-gray-800">EGP {stats.total.toLocaleString()}</p>
            <p className="text-xs text-gray-400">{stats.count} transactions</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Completed</p>
            <p className="text-2xl font-bold text-green-600">EGP {stats.completed.toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">EGP {stats.pending.toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Failed</p>
            <p className="text-2xl font-bold text-red-600">EGP {stats.failed.toLocaleString()}</p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 relative">
              <Search size={20} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by worker, position, or reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              />
            </div>
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
            >
              <option value="all">All Status</option>
              <option value="completed">✅ Completed</option>
              <option value="pending">⏳ Pending</option>
              <option value="failed">❌ Failed</option>
            </select>
          </div>
        </div>

        {/* Payments List */}
        {filteredPayments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="text-6xl mb-4">💳</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No payments found</h3>
            <p className="text-gray-500">Your payments will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPayments.map((payment) => (
              <div key={payment.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Worker Info */}
                  <div className="flex items-start gap-4 flex-1">
                    <img src={payment.workerImage} alt={payment.workerName} className="w-14 h-14 rounded-full object-cover border-2 border-gray-200" />
                    <div>
                      <h3 className="font-semibold text-gray-800">{payment.workerName}</h3>
                      <p className="text-sm text-gray-500">{payment.position}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-1">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <FileText size={12} /> {payment.reference}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar size={12} /> {payment.date}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full flex items-center gap-1">
                          {getMethodIcon(payment.method)} {payment.method}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Amount & Status */}
                  <div className="flex flex-col items-end justify-center min-w-[150px]">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Amount</p>
                      <p className="font-bold text-gray-800 text-lg">EGP {payment.total.toLocaleString()}</p>
                      <p className="text-xs text-gray-400">Fee: EGP {payment.fee}</p>
                    </div>
                    <div className="mt-2">{getStatusBadge(payment.status)}</div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-end justify-center gap-2 min-w-[150px]">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleViewDetails(payment)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                      >
                        <Eye size={18} />
                      </button>
                      {payment.status === 'pending' && (
                        <button 
                          onClick={() => handlePayNow(payment.id)}
                          className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition flex items-center gap-1"
                        >
                          <CreditCard size={16} /> Pay Now
                        </button>
                      )}
                      {payment.status === 'completed' && (
                        <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded transition">
                          <Download size={18} />
                        </button>
                      )}
                    </div>
                    {payment.status === 'pending' && (
                      <p className="text-xs text-yellow-600">Due: {payment.dueDate}</p>
                    )}
                    {payment.status === 'failed' && (
                      <p className="text-xs text-red-600">Payment failed. Try again.</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Details Modal */}
      {showDetails && selectedPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Payment Details</h2>
              <button onClick={() => setShowDetails(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <XCircle size={24} className="text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Worker Info */}
              <div className="flex items-center gap-4">
                <img src={selectedPayment.workerImage} alt={selectedPayment.workerName} className="w-16 h-16 rounded-full object-cover border-2 border-gray-200" />
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{selectedPayment.workerName}</h3>
                  <p className="text-gray-500">{selectedPayment.position}</p>
                </div>
              </div>

              {/* Payment Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="font-bold text-gray-800">EGP {selectedPayment.total.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Fee</p>
                  <p className="font-medium text-gray-800">EGP {selectedPayment.fee}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Method</p>
                  <p className="font-medium text-gray-800 flex items-center gap-2">
                    {getMethodIcon(selectedPayment.method)} {selectedPayment.method}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Reference</p>
                  <p className="font-mono text-sm font-medium text-gray-800">{selectedPayment.reference}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium text-gray-800">{selectedPayment.date}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Due Date</p>
                  <p className="font-medium text-gray-800">{selectedPayment.dueDate}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Status</p>
                  <div>{getStatusBadge(selectedPayment.status)}</div>
                </div>
              </div>

              {/* Description */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Description</p>
                <p className="text-gray-700">{selectedPayment.description}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                {selectedPayment.status === 'pending' && (
                  <button 
                    onClick={() => handlePayNow(selectedPayment.id)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2"
                  >
                    <CreditCard size={18} /> Pay Now
                  </button>
                )}
                <button className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2">
                  <Download size={18} /> Download Receipt
                </button>
                <button className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2">
                  <Printer size={18} /> Print
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployerPayments;
