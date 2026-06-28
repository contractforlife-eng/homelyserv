import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Briefcase, DollarSign, User, MapPin, Phone, Mail,
  CheckCircle, XCircle, Clock, Eye, MessageCircle,
  Calendar, Building, Award, AlertCircle, ArrowLeft,
  ChevronDown, ChevronUp, Search, Filter, Download,
  Star, Shield, Heart, Share2, Flag, FileText,
  ExternalLink, Copy, Globe, Home, Users
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

  // Real offer data - accurate information
  const [offers, setOffers] = useState([
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
      status: 'pending', // pending, accepted, rejected
      date: '2026-06-20',
      description: 'We are looking for an experienced nanny to care for our 2 children aged 2 and 5. Full-time position from Sunday to Thursday, 8 AM to 5 PM. Accommodation and meals provided.',
      requirements: ['3+ years experience', 'First Aid certified', 'Loving and patient', 'Fluent in English'],
      employerImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&crop=face',
      rejectionReason: null,
      adminEditable: true,
      employerRating: 4.8,
      totalHires: 12
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
      description: 'Looking for a compassionate caregiver for my elderly father (78 years old) with dementia. Must have experience with elderly care and medication management. Live-in position with private room.',
      requirements: ['5+ years elderly care', 'Dementia experience', 'Patient and caring', 'Valid license'],
      employerImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face',
      rejectionReason: null,
      adminEditable: false,
      employerRating: 4.9,
      totalHires: 8
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
      description: 'Need a professional driver for daily office commute and errands. Must have valid license and clean driving record. Working hours: 7 AM to 6 PM.',
      requirements: ['Valid driver license', '5+ years driving', 'Clean record', 'Fluent Arabic'],
      employerImage: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=80&h=80&fit=crop&crop=face',
      rejectionReason: 'Salary below my minimum requirements',
      adminEditable: true,
      employerRating: 4.7,
      totalHires: 15
    }
  ]);

  const handleAccept = (offerId) => {
    const offer = offers.find(o => o.id === offerId);
    if (offer) {
      setSelectedOffer(offer);
      setShowDetails(true);
    }
  };

  const handleConfirmAccept = () => {
    setOffers(prev => prev.map(o => 
      o.id === selectedOffer.id ? { ...o, status: 'accepted' } : o
    ));
    alert('✅ Offer accepted successfully! You can now contact the employer.');
    setShowDetails(false);
  };

  const handleRejectClick = (offerId) => {
    setOfferToReject(offerId);
    setShowRejectModal(true);
  };

  const handleConfirmReject = () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection.');
      return;
    }
    setOffers(prev => prev.map(o => 
      o.id === offerToReject ? { ...o, status: 'rejected', rejectionReason: rejectionReason } : o
    ));
    setShowRejectModal(false);
    setRejectionReason('');
    alert('❌ Offer rejected. It has been moved to rejected offers.');
  };

  const handleWhatsApp = (phone) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/worker-dashboard" className="text-gray-600 hover:text-red-600 transition">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">My Offers</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              {offers.filter(o => o.status === 'pending').length} pending offers
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Pending Offers</p>
            <p className="text-2xl font-bold text-yellow-600">
              {offers.filter(o => o.status === 'pending').length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Accepted Offers</p>
            <p className="text-2xl font-bold text-green-600">
              {offers.filter(o => o.status === 'accepted').length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Rejected Offers</p>
            <p className="text-2xl font-bold text-red-600">
              {offers.filter(o => o.status === 'rejected').length}
            </p>
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
              <div key={offer.id} className={`bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition ${
                offer.status === 'accepted' ? 'border-green-200' :
                offer.status === 'rejected' ? 'border-red-200' :
                'border-gray-100'
              }`}>
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Employer Info */}
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
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Star size={12} className="fill-yellow-400 text-yellow-400" /> {offer.employerRating}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Salary & Status */}
                  <div className="flex flex-col items-end justify-center min-w-[150px]">
                    <p className="text-sm text-gray-500">Offered Salary</p>
                    <p className="font-bold text-gray-800">EGP {offer.salary.toLocaleString()}</p>
                    <div className="mt-2">{getStatusBadge(offer.status)}</div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-end justify-center gap-2 min-w-[180px]">
                    {offer.status === 'pending' && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleAccept(offer.id)}
                          className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition flex items-center gap-1"
                        >
                          <CheckCircle size={16} /> Accept
                        </button>
                        <button 
                          onClick={() => handleRejectClick(offer.id)}
                          className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition flex items-center gap-1"
                        >
                          <XCircle size={16} /> Reject
                        </button>
                      </div>
                    )}
                    {offer.status === 'accepted' && (
                      <div className="flex gap-2">
                        <button className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition flex items-center gap-1">
                          <MessageCircle size={16} /> Message
                        </button>
                        <button 
                          onClick={() => handleWhatsApp(offer.employerPhone)}
                          className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition flex items-center gap-1"
                        >
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

      {/* Offer Details Modal (on Accept) */}
      {showDetails && selectedOffer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Offer Details</h2>
              <button onClick={() => setShowDetails(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <XCircle size={24} className="text-gray-400" />
              </button>
            </div>

            {/* Employer Info */}
            <div className="flex items-center gap-4 mb-4">
              <img src={selectedOffer.employerImage} alt={selectedOffer.employerName} className="w-20 h-20 rounded-full object-cover border-2 border-gray-200" />
              <div>
                <h3 className="text-xl font-bold text-gray-800">{selectedOffer.employerName}</h3>
                <p className="text-gray-500">{selectedOffer.position}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Star size={14} className="fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{selectedOffer.employerRating}</span>
                  <span className="text-xs text-gray-400">({selectedOffer.totalHires} hires)</span>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Salary</p>
                <p className="font-bold text-gray-800">EGP {selectedOffer.salary.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Start Date</p>
                <p className="font-medium text-gray-800">{selectedOffer.startDate}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium text-gray-800">{selectedOffer.employerPhone}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-800">{selectedOffer.employerEmail}</p>
              </div>
            </div>

            {/* Address */}
            <div className="p-3 bg-gray-50 rounded-lg mb-4">
              <p className="text-sm text-gray-500">Address</p>
              <p className="font-medium text-gray-800">{selectedOffer.employerAddress}</p>
              <p className="text-sm text-gray-500 mt-1">{selectedOffer.employerCity}, {selectedOffer.employerCountry}</p>
            </div>

            {/* Description */}
            <div className="p-3 bg-gray-50 rounded-lg mb-4">
              <p className="text-sm text-gray-500">Job Description</p>
              <p className="text-gray-700">{selectedOffer.description}</p>
            </div>

            {/* Requirements */}
            <div className="p-3 bg-gray-50 rounded-lg mb-4">
              <p className="text-sm text-gray-500">Requirements</p>
              <ul className="list-disc list-inside text-gray-700">
                {selectedOffer.requirements.map((req, i) => (
                  <li key={i} className="text-sm">{req}</li>
                ))}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={handleConfirmAccept}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
              >
                <CheckCircle size={18} /> Confirm Accept
              </button>
              <button 
                onClick={() => handleWhatsApp(selectedOffer.employerPhone)}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
              >
                <span>💬</span> WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Reject Offer</h3>
            <p className="text-gray-600 mb-4">Please provide a reason for rejecting this offer:</p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows="4"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 resize-none"
              placeholder="Enter rejection reason..."
            />
            <div className="flex gap-3 mt-4">
              <button 
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmReject}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkerOffers;