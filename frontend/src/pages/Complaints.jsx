import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  AlertCircle, Send, User, Phone, Mail, FileText, 
  CheckCircle, XCircle, Clock, Eye, MessageCircle,
  ArrowLeft, Search, Filter, Download, Printer,
  Plus, Edit, Trash2, ChevronDown, ChevronUp
} from 'lucide-react';

function Complaints() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('new');
  const [expandedComplaint, setExpandedComplaint] = useState(null);
  const [formData, setFormData] = useState({
    employeeName: '',
    employeePhone: '',
    complainantName: '',
    employerPhone: '',
    employerId: '',
    complaintText: '',
    type: 'worker'
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      setFormData(prev => ({
        ...prev,
        complainantName: parsed.fullName || '',
        employeeName: parsed.fullName || '',
        employeePhone: parsed.phone || '',
        type: parsed.role === 'worker' ? 'worker' : 'employer'
      }));
    } else {
      navigate('/login');
    }
    setLoading(false);
  }, [navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // In production, send to backend
    alert('Complaint submitted successfully!');
    setFormData(prev => ({
      ...prev,
      employerPhone: '',
      employerId: '',
      complaintText: ''
    }));
  };

  // Sample complaints data
  const complaints = [
    { 
      id: 1, 
      type: 'worker',
      from: 'Ahmed Ali',
      employeeName: 'Ahmed Ali',
      employeePhone: '+201234567890',
      complainantName: 'Sara Mohamed',
      employerPhone: '+201234567891',
      employerId: '12345678901234',
      message: 'Employer not responding after hiring. I have been waiting for 3 days for a response.',
      date: '2026-06-20',
      status: 'pending',
      response: null
    },
    { 
      id: 2, 
      type: 'employer',
      from: 'Sara Mohamed',
      employeeName: 'Khaled Mostafa',
      employeePhone: '+201234567892',
      complainantName: 'Sara Mohamed',
      employerPhone: '+201234567891',
      employerId: '12345678901235',
      message: 'Worker did not show up for work without any notice. This is the second time.',
      date: '2026-06-18',
      status: 'resolved',
      response: 'We have contacted the worker and resolved the issue. They will be more punctual in the future.'
    },
    { 
      id: 3, 
      type: 'worker',
      from: 'Mona Hassan',
      employeeName: 'Mona Hassan',
      employeePhone: '+201234567893',
      complainantName: 'Khaled Mostafa',
      employerPhone: '+201234567894',
      employerId: '12345678901236',
      message: 'Payment delay from employer. I have not received my salary for 2 months.',
      date: '2026-06-15',
      status: 'pending',
      response: null
    }
  ];

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs flex items-center gap-1"><Clock size={12} /> Pending</span>;
      case 'resolved':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs flex items-center gap-1"><CheckCircle size={12} /> Resolved</span>;
      case 'rejected':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs flex items-center gap-1"><XCircle size={12} /> Rejected</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">{status}</span>;
    }
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
            <Link to="/dashboard" className="text-gray-600 hover:text-red-600 transition">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">Complaints</h1>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2 text-sm">
              <Filter size={16} /> Filter
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2 text-sm">
              <Download size={16} /> Export
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('new')}
            className={`px-4 py-2 text-sm font-medium transition ${
              activeTab === 'new' 
                ? 'text-red-600 border-b-2 border-red-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            New Complaint
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-sm font-medium transition ${
              activeTab === 'history' 
                ? 'text-red-600 border-b-2 border-red-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Complaint History
            <span className="ml-2 bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">{complaints.length}</span>
          </button>
        </div>

        {activeTab === 'new' ? (
          /* New Complaint Form */
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-3xl mx-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Submit a Complaint</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Employee Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.employeeName}
                    onChange={(e) => setFormData({...formData, employeeName: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Employee Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.employeePhone}
                    onChange={(e) => setFormData({...formData, employeePhone: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Complainant Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.complainantName}
                  onChange={(e) => setFormData({...formData, complainantName: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Employer Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.employerPhone}
                    onChange={(e) => setFormData({...formData, employerPhone: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Employer ID Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.employerId}
                    onChange={(e) => setFormData({...formData, employerId: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Complaint Text <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.complaintText}
                  onChange={(e) => setFormData({...formData, complaintText: e.target.value})}
                  rows="5"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 resize-none"
                  placeholder="Describe your complaint in detail..."
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition font-semibold flex items-center justify-center gap-2"
              >
                <Send size={18} /> Submit Complaint
              </button>
            </form>
          </div>
        ) : (
          /* Complaint History */
          <div className="space-y-4">
            {complaints.map((complaint) => (
              <div key={complaint.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div 
                  className="p-4 cursor-pointer hover:bg-gray-50 transition"
                  onClick={() => setExpandedComplaint(expandedComplaint === complaint.id ? null : complaint.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <p className="font-semibold text-gray-800">{complaint.from}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          complaint.type === 'worker' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {complaint.type === 'worker' ? 'Worker' : 'Employer'}
                        </span>
                        {getStatusBadge(complaint.status)}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{complaint.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{complaint.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {complaint.status === 'pending' && (
                        <span className="text-xs text-yellow-600 flex items-center gap-1">
                          <Clock size={14} /> Awaiting Response
                        </span>
                      )}
                      <ChevronDown size={18} className={`text-gray-400 transition-transform ${
                        expandedComplaint === complaint.id ? 'rotate-180' : ''
                      }`} />
                    </div>
                  </div>
                </div>

                {expandedComplaint === complaint.id && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Employee Name</p>
                        <p className="font-medium text-gray-800">{complaint.employeeName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Employee Phone</p>
                        <p className="font-medium text-gray-800">{complaint.employeePhone}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Complainant Name</p>
                        <p className="font-medium text-gray-800">{complaint.complainantName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Employer Phone</p>
                        <p className="font-medium text-gray-800">{complaint.employerPhone}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Employer ID</p>
                        <p className="font-medium text-gray-800">{complaint.employerId}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Status</p>
                        <p className="font-medium text-gray-800">{complaint.status}</p>
                      </div>
                    </div>

                    {complaint.response && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm font-semibold text-blue-800 mb-1">Admin Response</p>
                        <p className="text-sm text-blue-700">{complaint.response}</p>
                      </div>
                    )}

                    {complaint.status === 'pending' && (
                      <div className="mt-4 flex gap-3">
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition flex items-center gap-2">
                          <MessageCircle size={16} /> Reply
                        </button>
                        <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition flex items-center gap-2">
                          <CheckCircle size={16} /> Resolve
                        </button>
                        <button className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition flex items-center gap-2">
                          <XCircle size={16} /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Complaints;