import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Briefcase,
  FileText,
  MessageCircle,
  Settings,
  LogOut,
  Home,
  Bell,
  Star,
  MapPin,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Award
} from 'lucide-react';

function WorkerView() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleLogout = () => {
    navigate('/login');
  };

  // Worker data
  const worker = {
    name: 'Ahmed Mohamed',
    email: 'ahmed@homelyserv.com',
    phone: '+201234567890',
    location: 'Cairo, Egypt',
    category: 'Nanny',
    rating: 4.9,
    reviewCount: 127,
    image: 'https://images.unsplash.com/photo-1589571894960-20bbe2828c42?w=150&h=150&fit=crop&crop=face',
    experience: 5,
    salary: 3500,
    availability: 'Available',
    verified: true,
    skills: ['Childcare', 'First Aid', 'Teaching', 'Cooking'],
    offers: [
      { id: 1, employer: 'Sara Mohamed', position: 'Nanny - Full Time', salary: 4000, status: 'pending', date: '2026-06-20' },
      { id: 2, employer: 'Khaled Mostafa', position: 'Nanny - Part Time', salary: 3500, status: 'accepted', date: '2026-06-15' },
      { id: 3, employer: 'Nadia Ibrahim', position: 'Live-in Nanny', salary: 4500, status: 'rejected', date: '2026-06-10' }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg border-r border-gray-200 min-h-screen">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-red-600">HomelyServ</h1>
        </div>
        <div className="px-4 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <img src={worker.image} alt={worker.name} className="w-12 h-12 rounded-full object-cover border-2 border-gray-200" />
            <div>
              <p className="font-semibold text-gray-800">{worker.name}</p>
              <p className="text-xs text-gray-500">{worker.category}</p>
            </div>
          </div>
        </div>
        <nav className="px-4 py-4 space-y-1">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'dashboard' ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-50'}`}>
            <Home size={20} /> Dashboard
          </button>
          <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'profile' ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-50'}`}>
            <User size={20} /> Profile
          </button>
          <button onClick={() => setActiveTab('offers')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'offers' ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-50'}`}>
            <Briefcase size={20} /> Offers
          </button>
          <button onClick={() => setActiveTab('messages')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'messages' ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-50'}`}>
            <MessageCircle size={20} /> Messages
          </button>
          <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'settings' ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-50'}`}>
            <Settings size={20} /> Settings
          </button>
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Worker Dashboard</h2>
            <div className="flex items-center gap-4">
              <button className="relative">
                <Bell size={20} className="text-gray-600" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>
              <span className="text-sm text-gray-500">{worker.name}</span>
            </div>
          </div>
        </header>

        <div className="p-6">
          {activeTab === 'dashboard' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <p className="text-sm text-gray-500">Total Offers</p>
                  <p className="text-2xl font-bold text-gray-800">{worker.offers.length}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <p className="text-sm text-gray-500">Pending</p>
                  <p className="text-2xl font-bold text-gray-800">{worker.offers.filter(o => o.status === 'pending').length}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <p className="text-sm text-gray-500">Accepted</p>
                  <p className="text-2xl font-bold text-gray-800">{worker.offers.filter(o => o.status === 'accepted').length}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <p className="text-sm text-gray-500">Rating</p>
                  <p className="text-2xl font-bold text-gray-800">{worker.rating} ★</p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Recent Offers</h3>
                <div className="space-y-3">
                  {worker.offers.map((offer) => (
                    <div key={offer.id} className="flex justify-between items-center p-3 border-b border-gray-100">
                      <div>
                        <p className="font-medium text-gray-800">{offer.position}</p>
                        <p className="text-sm text-gray-500">{offer.employer} • {offer.date}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-800">EGP {offer.salary}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          offer.status === 'accepted' ? 'bg-green-100 text-green-800' :
                          offer.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'profile' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-6">My Profile</h3>
              <div className="flex items-start gap-6">
                <img src={worker.image} alt={worker.name} className="w-32 h-32 rounded-full object-cover border-4 border-gray-200" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-gray-800">{worker.name}</h2>
                    {worker.verified && <CheckCircle size={20} className="text-green-500" />}
                  </div>
                  <p className="text-gray-500">{worker.category}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Star size={16} className="fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{worker.rating}</span>
                    <span className="text-gray-400">({worker.reviewCount} reviews)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin size={16} /> {worker.location}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <DollarSign size={16} /> EGP {worker.salary.toLocaleString()}/month
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar size={16} /> {worker.experience} years experience
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock size={16} /> {worker.availability}
                    </div>
                  </div>
                  <div className="mt-4">
                    <h4 className="font-semibold text-gray-700 mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {worker.skills.map((skill, i) => (
                        <span key={i} className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm">{skill}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'offers' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-6">My Offers</h3>
              <div className="space-y-4">
                {worker.offers.map((offer) => (
                  <div key={offer.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-800">{offer.position}</h4>
                        <p className="text-sm text-gray-600">{offer.employer}</p>
                        <p className="text-sm text-gray-500">{offer.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-800">EGP {offer.salary.toLocaleString()}</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-1 ${
                          offer.status === 'accepted' ? 'bg-green-100 text-green-800' :
                          offer.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WorkerView;