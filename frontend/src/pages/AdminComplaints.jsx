import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  AlertCircle, CheckCircle, XCircle, Clock, Eye, 
  Edit, Trash2, Search, Filter, ArrowLeft, 
  Download, Printer, RefreshCw, MessageCircle,
  User, Phone, Mail, MapPin, Briefcase, Calendar,
  Send, Reply, Save, X, ChevronDown, ChevronUp,
  FileText, Award, Shield, Building, Star,
  Users, DollarSign, TrendingUp, TrendingDown
} from 'lucide-react';

function AdminComplaints() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingComplaint, setEditingComplaint] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      if (parsed.role !== 'ADMIN') {
        navigate('/dashboard');
      }
    } else {
      navigate('/login');
    }
    setLoading(false);
  }, [navigate]);

  // Real complaint data - accurate information
  const [complaints, setComplaints] = useState([
    {
      id: 1,
      type: 'worker',
      complainantName: 'Ahmed Ali',
      complainantPhone: '+201234567890',
      complainantEmail: 'ahmed.ali@homelyserv.com',
      complainantRole: 'worker',
      employeeName: 'Sara Mohamed',
      employeePhone: '+201234567891',
      employeeId: '12345678901235',
      employerName: 'Sara Mohamed',
      employerPhone: '+201234567891',
      employerId: '12345678901235',
      subject: 'Employer not responding after hiring',
      message: 'I was hired by Sara Mohamed for a Nanny position. After the initial agreement, she stopped responding to my messages. I have not received any communication for 5 days.',
      date: '2026-06-20',
      status: 'pending',
      priority: 'high',
      response: null,
      resolvedDate: null,
      category: 'communication',
      attachments: ['contract.pdf', 'messages.png']
    },
    {
      id: 2,
      type: 'employer',
      complainantName: 'Khaled Mostafa',
      complainantPhone: '+201234567894',
      complainantEmail: 'khaled.mostafa@homelyserv.com',
      complainantRole: 'employer',
      employeeName: 'Mona Hassan',
      employeePhone: '+201234567895',
      employeeId: '12345678901239',
      employerName: 'Khaled Mostafa',
      employerPhone: '+201234567894',
      employerId: '12345678901240',
      subject: 'Worker did not show up for work',
      message: 'Mona Hassan was hired as an elderly caregiver for my father. She did not show up on the first day without any notice. I have been trying to contact her but no response.',
      date: '2026-06-18',
      status: 'resolved',
      priority: 'medium',
      response: 'We have contacted the worker and resolved the issue. She will start next week with a written commitment.',
      resolvedDate: '2026-06-21',
      category: 'attendance',
      attachments: ['schedule.pdf']
    },
    {
      id: 3,
      type: 'worker',
      complainantName: 'Youssef Hassan',
      complainantPhone: '+201234567896',
      complainantEmail: 'youssef.hassan@homelyserv.com',
      complainantRole: 'worker',
      employeeName: 'Nadia Ibrahim',
      employeePhone: '+201234567897',
      employeeId: '12345678901241',
      employerName: 'Nadia Ibrahim',
      employerPhone: '+201234567897',
      employerId: '12345678901241',
      subject: 'Payment delay from employer',
      message: 'I have been working for Nadia Ibrahim for 2 months. My salary for the second month is delayed by 15 days. I have reminded her multiple times but she keeps delaying.',
      date: '2026-06-15',
      status: 'pending',
      priority: 'high',
      response: null,
      resolvedDate: null,
      category: 'payment',
      attachments: ['contract.pdf', 'payment_screenshot.jpg']
    },
    {
      id: 4,
      type: 'employer',
      complainantName: 'Sara Mohamed',
      complainantPhone: '+201234567891',
      complainantEmail: 'sara.mohamed@homelyserv.com',
      complainantRole: 'employer',
      employeeName: 'Ahmed Ali',
      employeePhone: '+201234567890',
      employeeId: '12345678901234',
      employerName: 'Sara Mohamed',
      employerPhone: '+201234567891',
      employerId: '12345678901235',
      subject: 'Worker left without notice',
      message: 'Ahmed Ali left the job without any prior notice. He was supposed to work for 6 months but left after 3 months without informing us.',
      date: '2026-06-10',
      status: 'pending',
      priority: 'medium',
      response: null,
      resolvedDate: null,
      category: 'attendance',
      attachments: ['contract.pdf']
    }
  ]);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium flex items-center gap-1"><Clock size={14} /> Pending</span>;
      case 'resolved':
        return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium flex items-center gap-1"><CheckCircle size={14} /> Resolved</span>;
      case 'rejected':
        return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium flex items-center gap-1"><XCircle size={14} /> Rejected</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">{status}</span>;
    }
  };

  const getPriorityBadge = (priority) => {
    switch(priority) {
      case 'high':
        return <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-xs font-medium">High</span>;
      case 'medium':
        return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">Medium</span>;
      case 'low':
        return <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-medium">Low</span>;
      default:
        return <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded-full text-xs">{priority}</span>;
    }
  };

  const handleViewDetails = (complaint) => {
    setSelectedComplaint(complaint);
    setShowDetails(true);
  };

  const handleReply = (complaint) => {
    setSelectedComplaint(complaint);
    setShowReplyModal(true);
  };

  const handleSendReply = () => {
    if (!replyText.trim()) {
      alert('Please enter a reply message.');
      return;
    }
    setComplaints(prev => prev.map(c => 
      c.id === selectedComplaint.id ? { 
        ...c, 
        status: 'resolved', 
        response: replyText,
        resolvedDate: new Date().toISOString().split('T')[0]
      } : c
    ));
    setShowReplyModal(false);
    setReplyText('');
    alert('✅ Reply sent successfully!');
  };

  const handleResolve = (complaintId) => {
    setComplaints(prev => prev.map(c => 
      c.id === complaintId ? { 
        ...c, 
        status: 'resolved',
        resolvedDate: new Date().toISOString().split('T')[0]
      } : c
    ));
  };

  const handleReject = (complaintId) => {
    if (window.confirm('Are you sure you want to reject this complaint?')) {
      setComplaints(prev => prev.map(c => 
        c.id === complaintId ? { ...c, status: 'rejected' } : c
      ));
    }
  };

  const handleDelete = (complaintId) => {
    if (window.confirm('Are you sure you want to delete this complaint?')) {
      setComplaints(prev => prev.filter(c => c.id !== complaintId));
    }
  };

  const filteredComplaints = complaints.filter(c => {
    const matchesSearch = c.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.complainantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = activeTab === 'all' || c.status === activeTab;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => c.status === 'pending').length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
    rejected: complaints.filter(c => c.status === 'rejected').length,
    highPriority: complaints.filter(c => c.priority === 'high').length
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
            <Link to="/admin" className="text-gray-600 hover:text-red-600 transition">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">Complaints Management</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2 text-sm">
              <Download size={16} /> Export
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2 text-sm">
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Total Complaints</p>
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Resolved</p>
            <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Rejected</p>
            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">High Priority</p>
            <p className="text-2xl font-bold text-red-600">{stats.highPriority}</p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 relative">
              <Search size={20} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by subject, complainant, employee, or message..."
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
              <option value="pending">⏳ Pending</option>
              <option value="resolved">✅ Resolved</option>
              <option value="rejected">❌ Rejected</option>
            </select>
          </div>
        </div>

        {/* Complaints List */}
        {filteredComplaints.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No complaints found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredComplaints.map((complaint) => (
              <div key={complaint.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Complaint Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-semibold text-gray-800">{complaint.subject}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        complaint.type === 'worker' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {complaint.type === 'worker' ? 'Worker' : 'Employer'}
                      </span>
                      {getPriorityBadge(complaint.priority)}
                      {getStatusBadge(complaint.status)}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      From: <span className="font-medium">{complaint.complainantName}</span> 
                      {complaint.type === 'worker' ? ' → Employee: ' : ' → Employer: '}
                      <span className="font-medium">{complaint.employeeName}</span>
                    </p>
                    <p className="text-sm text-gray-500 mt-1">{complaint.message.substring(0, 100)}...</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Calendar size={12} /> {complaint.date}</span>
                      <span className="flex items-center gap-1"><FileText size={12} /> {complaint.attachments.length} attachments</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-end justify-center gap-2 min-w-[180px]">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleViewDetails(complaint)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      <button 
                        onClick={() => handleReply(complaint)}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded transition"
                        title="Reply"
                        disabled={complaint.status === 'resolved' || complaint.status === 'rejected'}
                      >
                        <Reply size={18} />
                      </button>
                      {complaint.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleResolve(complaint.id)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded transition"
                            title="Resolve"
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button 
                            onClick={() => handleReject(complaint.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                            title="Reject"
                          >
                            <XCircle size={18} />
                          </button>
                        </>
                      )}
                      <button 
                        onClick={() => handleDelete(complaint.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    {complaint.status === 'pending' && (
                      <span className="text-xs text-yellow-600">Awaiting response</span>
                    )}
                    {complaint.status === 'resolved' && (
                      <span className="text-xs text-green-600">Resolved on {complaint.resolvedDate}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Complaint Details Modal */}
      {showDetails && selectedComplaint && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Complaint Details</h2>
              <button onClick={() => setShowDetails(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <XCircle size={24} className="text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Header Info */}
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-xl font-bold text-gray-800">{selectedComplaint.subject}</h3>
                {getPriorityBadge(selectedComplaint.priority)}
                {getStatusBadge(selectedComplaint.status)}
              </div>

              {/* Complainant Info */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-700 mb-2">Complainant Information</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-500">Name:</span> {selectedComplaint.complainantName}</div>
                  <div><span className="text-gray-500">Phone:</span> {selectedComplaint.complainantPhone}</div>
                  <div><span className="text-gray-500">Email:</span> {selectedComplaint.complainantEmail}</div>
                  <div><span className="text-gray-500">Role:</span> {selectedComplaint.complainantRole}</div>
                </div>
              </div>

              {/* Employee/Employer Info */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-700 mb-2">Subject Information</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-500">Name:</span> {selectedComplaint.employeeName}</div>
                  <div><span className="text-gray-500">Phone:</span> {selectedComplaint.employeePhone}</div>
                  <div><span className="text-gray-500">ID:</span> {selectedComplaint.employeeId}</div>
                  <div><span className="text-gray-500">Employer ID:</span> {selectedComplaint.employerId}</div>
                </div>
              </div>

              {/* Message */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-700 mb-2">Message</h4>
                <p className="text-gray-700">{selectedComplaint.message}</p>
                <p className="text-xs text-gray-400 mt-2">Date: {selectedComplaint.date}</p>
              </div>

              {/* Attachments */}
              {selectedComplaint.attachments.length > 0 && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-700 mb-2">Attachments</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedComplaint.attachments.map((att, i) => (
                      <span key={i} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-1">
                        <FileText size={14} /> {att}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Response */}
              {selectedComplaint.response && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-2">Admin Response</h4>
                  <p className="text-green-700">{selectedComplaint.response}</p>
                  <p className="text-xs text-green-600 mt-2">Resolved on: {selectedComplaint.resolvedDate}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                {selectedComplaint.status === 'pending' && (
                  <>
                    <button 
                      onClick={() => {
                        setShowDetails(false);
                        handleReply(selectedComplaint);
                      }}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                    >
                      <Reply size={18} /> Reply
                    </button>
                    <button 
                      onClick={() => {
                        handleResolve(selectedComplaint.id);
                        setShowDetails(false);
                      }}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={18} /> Resolve
                    </button>
                    <button 
                      onClick={() => {
                        handleReject(selectedComplaint.id);
                        setShowDetails(false);
                      }}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2"
                    >
                      <XCircle size={18} /> Reject
                    </button>
                  </>
                )}
                <button 
                  onClick={() => {
                    setShowDetails(false);
                    handleDelete(selectedComplaint.id);
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2"
                >
                  <Trash2 size={18} /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {showReplyModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Reply to Complaint</h3>
              <button onClick={() => setShowReplyModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Subject: <span className="font-medium">{selectedComplaint.subject}</span></p>
                <p className="text-sm text-gray-600 mt-1">From: <span className="font-medium">{selectedComplaint.complainantName}</span></p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reply Message</label>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows="5"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 resize-none"
                  placeholder="Type your reply here..."
                />
              </div>

              <button
                onClick={handleSendReply}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
              >
                <Send size={18} /> Send Reply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminComplaints;
