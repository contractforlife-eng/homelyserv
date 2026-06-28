import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Briefcase, DollarSign, User, MapPin, Phone, Mail,
  CheckCircle, XCircle, Clock, Eye, MessageCircle,
  Calendar, Building, Award, AlertCircle, ArrowLeft,
  Star, Shield, Heart, Share2, Flag, FileText,
  ExternalLink, Copy, Globe, Home, Users,
  Send, Edit, Trash2, Plus, ChevronDown, ChevronUp
} from 'lucide-react';

function WorkerOffers() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [offerToReject, setOfferToReject] = useState(null);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [offerToAccept, setOfferToAccept] = useState(null);

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

  const offers = [
    {
      id: 1,
      employerName: 'Sara Mohamed',
      employerPhone: '+201234567891',
      employerEmail: 'sara.mohamed@homelyserv.com',
      employerAddress: '15 Nile Street, Zamalek, Cairo, Egypt',
      employerCity: 'Cairo',
      employerCountry: 'Egypt',
      position: 'Nanny - Full Time',
      category: 'Babysitter',
      salary: 4000,
      startDate: '2026-07-01',
      status: 'pending',
      date: '2026-06-20',
      description: 'We are looking for an experienced nanny to care for our 2 children aged 2 and 5.',
      requirements: ['3+ years experience', 'First Aid certified', 'Loving and patient'],
      employerImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&crop=face',
      rejectionReason: null,
      employerRating: 4.8,
      totalHires: 12,
      workSchedule: 'Sunday to Thursday, 8 AM - 5 PM',
      benefits: ['Accommodation provided', 'Meals included']
    },
    {
      id: 2,
      employerName: 'Khaled Mostafa',
      employerPhone: '+201234567894',
      employerEmail: 'khaled.mostafa@homelyserv.com',
      employerAddress: '42 Alexandria Road, Sporting, Alexandria, Egypt',
      employerCity: 'Alexandria',
      employerCountry: 'Egypt',
      position: 'Elderly Caregiver',
      category: 'Caregiver',
      salary: 4200,
      startDate: '2026-06-25',
      status: 'accepted',
      date: '2026-06-18',
      description: 'Looking for a compassionate caregiver for my elderly father with dementia.',
      requirements: ['5+ years elderly care', 'Dementia experience', 'Patient and caring'],
      employerImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face',
      rejectionReason: null,
      employerRating: 4.9,
      totalHires: 8,
      workSchedule: 'Live-in, 6 days a week',
      benefits: ['Private room', 'Meals provided']
    },
    {
      id: 3,
      employerName: 'Nadia Ibrahim',
      employerPhone: '+201234567896',
      employerEmail: 'nadia.ibrahim@homelyserv.com',
      employerAddress: '8 Zamalek Street, Zamalek, Cairo, Egypt',
      employerCity: 'Cairo',
      employerCountry: 'Egypt',
      position: 'Driver',
      category: 'Driver',
      salary: 3800,
      startDate: '2026-06-15',
      status: 'rejected',
      date: '2026-06-15',
      description: 'Need a professional driver for daily office commute and errands.',
      requirements: ['Valid driver license', '5+ years driving', 'Clean record'],
      employerImage: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=80&h=80&fit=crop&crop=face',
      rejectionReason: 'Salary below my minimum requirements',
      employerRating: 4.7,
      totalHires: 15,
      workSchedule: '7 AM - 6 PM, Sunday to Thursday',
      benefits: ['Fuel allowance', 'Vehicle provided']
    }
  ];

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium flex items-center gap-1"><Clock size={14} /> Pending</span>;
      case 'accepted':
        return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium flex items-center gap-1"><CheckCircle size={14} /> Accepted</span>;
      case 'rejected':
        return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium flex items-center gap-1"><XCircle size={14} /> Rejected</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">{status}</span>;
    }
  };

  const filteredOffers = offers.filter(o => {
    if (activeTab === 'pending') return o.status === 'pending';
    if (activeTab === 'accepted') return o.status === 'accepted';
    if (activeTab === 'rejected') return o.status === 'rejected';
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg border-r border-gray-200 min-h-screen fixed">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-red-600">HomelyServ</h1>
          <p className="text-xs text-gray-500 mt-1">Worker Panel</p>
        </div>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">{user?.fullName || 'User'}</p>
              <p className="text-xs text-gray-500">Worker</p>
            </div>
          </div>
        </div>
        <nav className="p-4 space-y-1">
          <Link to="/worker-dashboard" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <Home size={20} /> Dashboard
          </Link>
          <Link to="/worker-offers" className="flex items-center gap-3 px-4 py-3 bg-red-50 text-red-600 rounded-lg">
            <Briefcase size={20} /> Offers
            <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">2</span>
          </Link>
          <Link to="/profile" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <User size={20} /> Profile
          </Link>
          <Link to="/search" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <Search size={20} /> Search
          </Link>
          <Link to="/messages" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <MessageCircle size={20} /> Messages
          </Link>
          <Link to="/settings" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <Settings size={20} /> Settings
          </Link>
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 flex-1">
        <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-800">My Offers</h2>
              <p className="text-gray-500 text-sm">Manage your job offers</p>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">Pending Offers</p>
              <p className="text-2xl font-bold text-yellow-600">{offers.filter(o => o.status === 'pending').length}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">Accepted Offers</p>
              <p className="text-2xl font-bold text-green-600">{offers.filter(o => o.status === 'accepted').length}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">Rejected Offers</p>
              <p className="text-2xl font-bold text-red-600">{offers.filter(o => o.status === 'rejected').length}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            {['pending', 'accepted', 'rejected'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium transition ${
                  activeTab === tab 
                    ? 'text-red-600 border-b-2 border-red-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                  {offers.filter(o => o.status === tab).length}
                </span>
              </button>
            ))}
          </div>

          {/* Offers List */}
          {filteredOffers.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No {activeTab} offers</h3>
              <p className="text-gray-500">Your {activeTab} offers will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOffers.map((offer) => (
                <div key={offer.id} className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <img src={offer.employerImage} alt={offer.employerName} className="w-16 h-16 rounded-full object-cover border-2 border-gray-200" />
                      <div>
                        <h3 className="font-semibold text-gray-800 text-lg">{offer.employerName}</h3>
                        <p className="text-sm text-gray-600">{offer.position}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-1">
                          <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">{offer.category}</span>
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Calendar size={12} /> Start: {offer.startDate}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Briefcase size={12} /> {offer.date}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end justify-center min-w-[150px]">
                      <p className="text-sm text-gray-500">Offered Salary</p>
                      <p className="font-bold text-gray-800">EGP {offer.salary.toLocaleString()}</p>
                      <div className="mt-2">{getStatusBadge(offer.status)}</div>
                    </div>

                    <div className="flex flex-col items-end justify-center gap-2 min-w-[180px]">
                      {offer.status === 'pending' && (
                        <div className="flex gap-2">
                          <button className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition flex items-center gap-1">
                            <CheckCircle size={16} /> Accept
                          </button>
                          <button className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition flex items-center gap-1">
                            <XCircle size={16} /> Reject
                          </button>
                        </div>
                      )}
                      {offer.status === 'accepted' && (
                        <div className="flex gap-2">
                          <button className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition flex items-center gap-1">
                            <MessageCircle size={16} /> Message
                          </button>
                          <button className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition flex items-center gap-1">
                            <span>💬</span> WhatsApp
                          </button>
                        </div>
                      )}
                      {offer.status === 'rejected' && (
                        <div className="text-center">
                          <p className="text-xs text-red-600">Reason: {offer.rejectionReason}</p>
                          <p className="text-xs text-gray-400 mt-1">Contact admin to edit</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WorkerOffers;