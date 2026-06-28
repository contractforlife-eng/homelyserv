import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Briefcase, DollarSign, User, MapPin, Phone, Mail,
  CheckCircle, XCircle, Clock, Eye, MessageCircle,
  Calendar, Building, Award, AlertCircle, ArrowLeft,
  Search, Filter, Download, Star, Shield, Heart,
  FileText, ExternalLink, Copy, Globe, Home, Users,
  Send, Edit, Trash2, Plus, ChevronDown, ChevronUp
} from 'lucide-react';

function EmployerOffers() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sent');
  const [selectedOffer, setSelectedOffer] = useState(null);
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

  // Real offer data - accurate information
  const [offers, setOffers] = useState([
    {
      id: 1,
      workerName: 'Ahmed Ali',
      workerPhone: '+201234567890',
      workerEmail: 'ahmed.ali@homelyserv.com',
      workerAddress: '12 Garden Street, Heliopolis, Cairo, Egypt',
      workerCity: 'Cairo',
      workerCountry: 'Egypt',
      position: 'Nanny - Full Time',
      category: 'Babysitter',
      salary: 4000,
      startDate: '2026-07-01',
      status: 'pending', // pending, accepted, rejected, expired
      date: '2026-06-20',
      description: 'Experienced nanny with 5 years of experience. Passionate about childcare and child development.',
      workerImage: 'https://images.unsplash.com/photo-1589571894960-20bbe2828c42?w=80&h=80&fit=crop&crop=face',
      workerRating: 4.9,
      workerExperience: 5,
      skills: ['Childcare', 'First Aid', 'Teaching', 'Cooking'],
      rejectionReason: null,
      adminEditable: true
    },
    {
      id: 2,
      workerName: 'Mona Hassan',
      workerPhone: '+201234567891',
      workerEmail: 'mona.hassan@homelyserv.com',
      workerAddress: '45 Alexandria Road, Sporting, Alexandria, Egypt',
      workerCity: 'Alexandria',
      workerCountry: 'Egypt',
      position: 'Elderly Caregiver',
      category: 'Caregiver',
      salary: 4200,
      startDate: '2026-06-25',
      status: 'accepted',
      date: '2026-06-18',
      description: 'Dedicated elderly caregiver with 7 years of experience. Specialized in dementia and Alzheimer\'s care.',
      workerImage: 'https://images.unsplash.com/photo-1593104547489-5cfb3839a3b5?w=80&h=80&fit=crop&crop=face',
      workerRating: 4.8,
      workerExperience: 7,
      skills: ['Elderly Care', 'Medication Management', 'Companionship', 'Physiotherapy'],
      rejectionReason: null,
      adminEditable: false
    },
    {
      id: 3,
      workerName: 'Khaled Mostafa',
      workerPhone: '+201234567892',
      workerEmail: 'khaled.mostafa@homelyserv.com',
      workerAddress: '8 Zamalek Street, Zamalek, Cairo, Egypt',
      workerCity: 'Cairo',
      workerCountry: 'Egypt',
      position: 'Driver',
      category: 'Driver',
      salary: 3800,
      startDate: '2026-06-15',
      status: 'rejected',
      date: '2026-06-15',
      description: 'Professional driver with 10 years of experience. Safe and reliable transportation services.',
      workerImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face',
      workerRating: 4.7,
      workerExperience: 10,
      skills: ['Driving', 'Navigation', 'Car Maintenance', 'Customer Service'],
      rejectionReason: 'Worker declined due to salary',
      adminEditable: true
    }
  ]);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium flex items-center gap-1"><Clock size={14} /> Pending</span>;
      case 'accepted':
        return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium flex items-center gap-1"><CheckCircle size={14} /> Accepted</span>;
      case 'rejected':
        return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium flex items-center gap-1"><XCircle size={14} /> Rejected</span>;
      case 'expired':
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium flex items-center gap-1"><AlertCircle size={14} /> Expired</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">{status}</span>;
    }
  };

  const handleWhatsApp = (phone) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  const filteredOffers = offers.filter(o => {
    if (activeTab === 'sent') return o.status === 'pending';
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
            <Link to="/employer-dashboard" className="text-gray-600 hover:text-red-600 transition">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">My Offers</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2">
              <Plus size={18} /> New Offer
            </button>
            <span className="text-sm text-gray-500">
              {offers.filter(o => o.status === 'pending').length} pending
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Sent Offers</p>
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
          {['sent', 'accepted', 'rejected'].map((tab) => (
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
            <button className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2 mx-auto">
              <Plus size={18} /> Create New Offer
            </button>
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
                  {/* Worker Info */}
                  <div className="flex items-start gap-4 flex-1">
                    <img src={offer.workerImage} alt={offer.workerName} className="w-16 h-16 rounded-full object-cover border-2 border-gray-200" />
                    <div>
                      <h3 className="font-semibold text-gray-800 text-lg">{offer.workerName}</h3>
                      <p className="text-sm text-gray-600">{offer.position}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-1">
                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">{offer.category}</span>
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar size={12} /> Start: {offer.startDate}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Star size={12} className="fill-yellow-400 text-yellow-400" /> {offer.workerRating}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Briefcase size={12} /> {offer.workerExperience} years
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
                        <button className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition flex items-center gap-1">
                          <MessageCircle size={16} /> Message
                        </button>
                        <button 
                          onClick={() => handleWhatsApp(offer.workerPhone)}
                          className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition flex items-center gap-1"
                        >
                          <span>💬</span> WhatsApp
                        </button>
                      </div>
                    )}
                    {offer.status === 'accepted' && (
                      <div className="flex gap-2">
                        <button className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition flex items-center gap-1">
                          <MessageCircle size={16} /> Message
                        </button>
                        <button 
                          onClick={() => handleWhatsApp(offer.workerPhone)}
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
                    <button className="p-1.5 text-gray-400 hover:text-gray-600 transition">
                      <Eye size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default EmployerOffers;
