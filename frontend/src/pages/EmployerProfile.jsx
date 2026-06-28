import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, Mail, Phone, MapPin, Briefcase, Calendar, 
  Star, CheckCircle, XCircle, Clock, Edit, Save, 
  X, Camera, Shield, Award, Building, Globe,
  Users, DollarSign, FileText, Download, Eye,
  MessageCircle, Settings, LogOut, ArrowLeft,
  Plus, Trash2, ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react';
import { getUser, updateUser, getUserImage, getUserName } from '../utils/userHelpers';

function EmployerProfile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phone: '',
    city: '',
    country: 'Egypt',
    role: 'employer',
    company: 'Individual',
    position: 'Employer',
    bio: '',
    rating: 4.7,
    reviewCount: 45,
    totalHires: 24,
    joined: '',
    verified: true,
    image: '',
    documents: [
      { name: 'ID Card.pdf', type: 'Identity', size: '1.2 MB', verified: true },
      { name: 'Business License.pdf', type: 'Business', size: '0.8 MB', verified: false }
    ]
  });

  const [editData, setEditData] = useState(profile);

  useEffect(() => {
    const userData = getUser();
    if (userData) {
      setUser(userData);
      const profileData = {
        fullName: userData.fullName || '',
        email: userData.email || '',
        phone: userData.phone || '',
        city: userData.city || '',
        country: userData.country || 'Egypt',
        role: 'employer',
        company: userData.company || 'Individual',
        position: userData.position || 'Employer',
        bio: userData.bio || '',
        rating: userData.rating || 4.7,
        reviewCount: userData.reviewCount || 45,
        totalHires: userData.totalHires || 24,
        joined: userData.joined || new Date().toISOString().split('T')[0],
        verified: userData.isVerified || true,
        image: userData.image || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
        documents: userData.documents || [
          { name: 'ID Card.pdf', type: 'Identity', size: '1.2 MB', verified: true },
          { name: 'Business License.pdf', type: 'Business', size: '0.8 MB', verified: false }
        ]
      };
      setProfile(profileData);
      setEditData(profileData);
      setLoading(false);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 200;
          canvas.height = 200;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, 200, 200);
          const compressedImage = canvas.toDataURL('image/jpeg', 0.8);
          setEditData(prev => ({ ...prev, image: compressedImage }));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    setError('');
    
    // Validate required fields
    if (!editData.fullName.trim()) {
      setError('Full name is required');
      return;
    }
    if (!editData.email.trim()) {
      setError('Email is required');
      return;
    }
    
    setProfile(editData);
    
    if (user) {
      const updatedUser = { 
        ...user, 
        ...editData,
        fullName: editData.fullName,
        email: editData.email,
        phone: editData.phone || '',
        city: editData.city || '',
        country: editData.country || 'Egypt',
        company: editData.company || 'Individual',
        position: editData.position || 'Employer',
        bio: editData.bio || '',
        rating: editData.rating || 4.7,
        reviewCount: editData.reviewCount || 45,
        totalHires: editData.totalHires || 24,
        joined: editData.joined || new Date().toISOString().split('T')[0],
        isVerified: editData.verified || true,
        image: editData.image || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
        documents: editData.documents || []
      };
      
      const savedUser = updateUser(updatedUser);
      setUser(savedUser);
    }
    
    setIsEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData(profile);
    setError('');
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
            {isEditing ? (
              <>
                <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2">
                  <Save size={18} /> Save
                </button>
                <button onClick={handleCancel} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2">
                  <X size={18} /> Cancel
                </button>
              </>
            ) : (
              <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2">
                <Edit size={18} /> Edit Profile
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-4">
              {/* Profile Image */}
              <div className="relative">
                <img 
                  src={editData.image || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face'} 
                  alt={editData.fullName} 
                  className="w-full rounded-lg object-cover aspect-square"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face';
                  }}
                />
                <button 
                  onClick={handlePhotoClick}
                  className="absolute bottom-3 right-3 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition shadow-lg"
                  title="Change Photo"
                >
                  <Camera size={18} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                {editData.verified && (
                  <div className="absolute top-3 right-3 bg-green-500 rounded-full p-1.5">
                    <CheckCircle size={16} className="text-white" />
                  </div>
                )}
              </div>

              {/* Name & Rating */}
              <div className="mt-4">
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.fullName}
                    onChange={(e) => setEditData({...editData, fullName: e.target.value})}
                    className="text-2xl font-bold text-gray-800 w-full px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                ) : (
                  <h2 className="text-2xl font-bold text-gray-800">{editData.fullName}</h2>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm px-3 py-1 rounded-full bg-purple-100 text-purple-800">Employer</span>
                  <div className="flex items-center gap-1">
                    <Star size={16} className="fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{editData.rating}</span>
                    <span className="text-sm text-gray-400">({editData.reviewCount} reviews)</span>
                  </div>
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.position}
                    onChange={(e) => setEditData({...editData, position: e.target.value})}
                    className="text-sm text-gray-500 w-full mt-1 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                ) : (
                  <p className="text-sm text-gray-500 mt-1">{editData.position} at {editData.company}</p>
                )}
              </div>

              {/* Quick Info */}
              <div className="mt-4 space-y-2.5 text-sm">
                <div className="flex items-center gap-3 text-gray-600">
                  <MapPin size={16} className="text-gray-400" />
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.city}
                      onChange={(e) => setEditData({...editData, city: e.target.value})}
                      className="flex-1 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    />
                  ) : (
                    <span>{editData.city}, {editData.country}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <Phone size={16} className="text-gray-400" />
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editData.phone}
                      onChange={(e) => setEditData({...editData, phone: e.target.value})}
                      className="flex-1 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    />
                  ) : (
                    <span>{editData.phone}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <Mail size={16} className="text-gray-400" />
                  {isEditing ? (
                    <input
                      type="email"
                      value={editData.email}
                      onChange={(e) => setEditData({...editData, email: e.target.value})}
                      className="flex-1 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    />
                  ) : (
                    <span>{editData.email}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <Calendar size={16} className="text-gray-400" />
                  <span>Joined {editData.joined}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold text-gray-800">{editData.totalHires}</p>
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
              <div className="p-6">
                {/* Bio */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-800 mb-2">About</h3>
                  {isEditing ? (
                    <textarea
                      value={editData.bio}
                      onChange={(e) => setEditData({...editData, bio: e.target.value})}
                      rows="4"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 resize-none"
                    />
                  ) : (
                    <p className="text-gray-600 leading-relaxed">{editData.bio || 'No bio provided'}</p>
                  )}
                </div>

                {/* Company Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
                      <p className="text-gray-800">{editData.company}</p>
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
                      <p className="text-gray-800">{editData.position}</p>
                    )}
                  </div>
                </div>

                {/* Personal Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
                      <p className="text-gray-800">{editData.fullName}</p>
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
                      <p className="text-gray-800">{editData.email}</p>
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
                      <p className="text-gray-800">{editData.phone}</p>
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
                      <p className="text-gray-800">{editData.city}</p>
                    )}
                  </div>
                </div>

                {/* Documents */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-4">Documents</h3>
                  <div className="space-y-3">
                    {editData.documents.map((doc, i) => (
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmployerProfile;