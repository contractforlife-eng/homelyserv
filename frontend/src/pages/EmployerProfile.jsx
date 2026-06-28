import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, Mail, Phone, MapPin, Briefcase, Calendar, 
  Star, CheckCircle, XCircle, Clock, Edit, Save, 
  X, Camera, Shield, Award, Building, Globe,
  Users, DollarSign, FileText, Download, Eye,
  MessageCircle, Settings, LogOut, ArrowLeft,
  Plus, Trash2, ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react';

function EmployerProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [saved, setSaved] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      setProfile(prev => ({
        ...prev,
        fullName: parsed.fullName || '',
        email: parsed.email || '',
        phone: parsed.phone || '',
        city: parsed.city || '',
        role: parsed.role || 'employer'
      }));
      setEditData(prev => ({
        ...prev,
        fullName: parsed.fullName || '',
        email: parsed.email || '',
        phone: parsed.phone || '',
        city: parsed.city || '',
        role: parsed.role || 'employer'
      }));
    } else {
      navigate('/login');
    }
    setLoading(false);
  }, [navigate]);

  // Employer profile data
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phone: '',
    city: '',
    country: 'Egypt',
    role: 'employer',
    company: 'HomelyServ Solutions',
    position: 'HR Manager',
    bio: 'Experienced HR professional with 10 years of experience in recruitment and talent management. Passionate about connecting the right talent with the right opportunities.',
    rating: 4.8,
    reviewCount: 45,
    totalHires: 24,
    joined: '2026-01-15',
    verified: true,
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face',
    documents: [
      { name: 'Company License.pdf', type: 'Business', size: '2.4 MB', verified: true },
      { name: 'ID Card.pdf', type: 'Identity', size: '1.2 MB', verified: true },
      { name: 'Tax Certificate.pdf', type: 'Tax', size: '0.8 MB', verified: false }
    ],
    recentHires: [
      { name: 'Ahmed Ali', position: 'Nanny', date: '2026-06-20', status: 'active' },
      { name: 'Mona Hassan', position: 'Caregiver', date: '2026-06-18', status: 'completed' },
      { name: 'Khaled Mostafa', position: 'Driver', date: '2026-06-15', status: 'active' }
    ]
  });

  const [editData, setEditData] = useState(profile);

  const handleSave = () => {
    setProfile(editData);
    // Update localStorage
    if (user) {
      const updatedUser = { ...user, ...editData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
    setIsEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'active':
        return <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs">Active</span>;
      case 'completed':
        return <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">Completed</span>;
      default:
        return <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded-full text-xs">{status}</span>;
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
            <Link to="/employer-dashboard" className="text-gray-600 hover:text-red-600 transition">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">Employer Profile</h1>
          </div>
          <div className="flex items-center gap-3">
            {saved && (
              <span className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle size={16} /> Saved successfully!
              </span>
            )}
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
            >
              {isEditing ? <X size={18} /> : <Edit size={18} />}
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-4">
              {/* Profile Image */}
              <div className="relative">
                <img src={profile.image} alt={profile.fullName} className="w-full rounded-lg object-cover aspect-square" />
                {isEditing && (
                  <button className="absolute bottom-3 right-3 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition">
                    <Camera size={18} />
                  </button>
                )}
                {profile.verified && (
                  <div className="absolute top-3 right-3 bg-green-500 rounded-full p-1.5">
                    <CheckCircle size={16} className="text-white" />
                  </div>
                )}
              </div>

              {/* Name & Rating */}
              <div className="mt-4">
                <h2 className="text-2xl font-bold text-gray-800">{profile.fullName}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm px-3 py-1 rounded-full bg-purple-100 text-purple-800">Employer</span>
                  <div className="flex items-center gap-1">
                    <Star size={16} className="fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{profile.rating}</span>
                    <span className="text-sm text-gray-400">({profile.reviewCount} reviews)</span>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-1">{profile.position} at {profile.company}</p>
              </div>

              {/* Quick Info */}
              <div className="mt-4 space-y-2.5 text-sm">
                <div className="flex items-center gap-3 text-gray-600">
                  <MapPin size={16} className="text-gray-400" />
                  <span>{profile.city}, {profile.country}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <Phone size={16} className="text-gray-400" />
                  <span>{profile.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <Mail size={16} className="text-gray-400" />
                  <span>{profile.email}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <Calendar size={16} className="text-gray-400" />
                  <span>Joined {profile.joined}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold text-gray-800">{profile.totalHires}</p>
                  <p className="text-xs text-gray-500">Total Hires</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-800">12</p>
                  <p className="text-xs text-gray-500">Active</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-800">95%</p>
                  <p className="text-xs text-gray-500">Response Rate</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Tabs */}
              <div className="border-b border-gray-100 flex overflow-x-auto">
                {['profile', 'hires', 'documents'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-3 text-sm font-medium transition whitespace-nowrap ${
                      activeTab === tab
                        ? 'text-red-600 border-b-2 border-red-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {activeTab === 'profile' && (
                  <div className="space-y-4">
                    {/* Bio */}
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-2">About</h3>
                      {isEditing ? (
                        <textarea
                          value={editData.bio}
                          onChange={(e) => setEditData({...editData, bio: e.target.value})}
                          rows="4"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 resize-none"
                        />
                      ) : (
                        <p className="text-gray-600 leading-relaxed">{profile.bio}</p>
                      )}
                    </div>

                    {/* Company Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editData.company}
                            onChange={(e) => setEditData({...editData, company: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                          />
                        ) : (
                          <p className="text-gray-800">{profile.company}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editData.position}
                            onChange={(e) => setEditData({...editData, position: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                          />
                        ) : (
                          <p className="text-gray-800">{profile.position}</p>
                        )}
                      </div>
                    </div>

                    {/* Personal Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editData.fullName}
                            onChange={(e) => setEditData({...editData, fullName: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                          />
                        ) : (
                          <p className="text-gray-800">{profile.fullName}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        {isEditing ? (
                          <input
                            type="email"
                            value={editData.email}
                            onChange={(e) => setEditData({...editData, email: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                          />
                        ) : (
                          <p className="text-gray-800">{profile.email}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        {isEditing ? (
                          <input
                            type="tel"
                            value={editData.phone}
                            onChange={(e) => setEditData({...editData, phone: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                          />
                        ) : (
                          <p className="text-gray-800">{profile.phone}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editData.city}
                            onChange={(e) => setEditData({...editData, city: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                          />
                        ) : (
                          <p className="text-gray-800">{profile.city}</p>
                        )}
                      </div>
                    </div>

                    {isEditing && (
                      <button
                        onClick={handleSave}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                      >
                        <Save size={18} /> Save Changes
                      </button>
                    )}
                  </div>
                )}

                {activeTab === 'hires' && (
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-4">Recent Hires</h3>
                    <div className="space-y-3">
                      {profile.recentHires.map((hire, i) => (
                        <div key={i} className="flex justify-between items-center border-b border-gray-100 pb-3">
                          <div>
                            <p className="font-medium text-gray-800">{hire.name}</p>
                            <p className="text-sm text-gray-500">{hire.position}</p>
                            <p className="text-xs text-gray-400">{hire.date}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            {getStatusBadge(hire.status)}
                            <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                              <Eye size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'documents' && (
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-4">Documents</h3>
                    <div className="space-y-3">
                      {profile.documents.map((doc, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <div className="flex items-center gap-3">
                            <FileText size={20} className="text-red-600" />
                            <div>
                              <p className="font-medium text-gray-800">{doc.name}</p>
                              <div className="flex items-center gap-3 text-xs text-gray-400">
                                <span>{doc.type}</span>
                                <span>{doc.size}</span>
                                {doc.verified ? (
                                  <span className="text-green-600 flex items-center gap-1">
                                    <CheckCircle size={12} /> Verified
                                  </span>
                                ) : (
                                  <span className="text-yellow-600 flex items-center gap-1">
                                    <Clock size={12} /> Pending
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <button className="p-1.5 text-gray-400 hover:text-gray-600 transition">
                            <Download size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmployerProfile;