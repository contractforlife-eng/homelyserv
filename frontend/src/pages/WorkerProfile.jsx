import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, Mail, Phone, MapPin, Briefcase, Calendar, 
  Star, CheckCircle, XCircle, Clock, Edit, Save, 
  X, Camera, Shield, Award, FileText, Download,
  ArrowLeft, AlertCircle, Plus, Trash2
} from 'lucide-react';

function WorkerProfile() {
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
    age: 28,
    role: 'worker',
    category: 'Nanny',
    experience: 5,
    salary: 3500,
    availability: 'Available',
    workType: 'Full-Time',
    bio: '',
    skills: ['Childcare', 'First Aid', 'Teaching'],
    rating: 4.9,
    performance: 4.8,
    honesty: 4.9,
    speed: 4.7,
    accuracy: 4.8,
    image: '',
    documents: [
      { name: 'ID Card.pdf', type: 'Identity', size: '2.4 MB', verified: true },
      { name: 'Certificate.pdf', type: 'Professional', size: '1.8 MB', verified: true }
    ]
  });

  const [editData, setEditData] = useState(profile);
  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      const profileData = {
        ...profile,
        fullName: parsed.fullName || '',
        email: parsed.email || '',
        phone: parsed.phone || '',
        city: parsed.city || '',
        image: parsed.image || 'https://images.unsplash.com/photo-1589571894960-20bbe2828c42?w=150&h=150&fit=crop&crop=face'
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
        setEditData(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    setError('');
    
    if (!editData.fullName.trim()) {
      setError('Full name is required');
      return;
    }
    
    setProfile(editData);
    
    if (user) {
      const updatedUser = { ...user, ...editData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
    
    setIsEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !editData.skills.includes(newSkill.trim())) {
      setEditData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setEditData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skillToRemove)
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
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
          <Link to="/worker-offers" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <Briefcase size={20} /> Offers
          </Link>
          <Link to="/worker-profile" className="flex items-center gap-3 px-4 py-3 bg-red-50 text-red-600 rounded-lg">
            <User size={20} /> Profile
          </Link>
          <Link to="/worker-complaints" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <AlertCircle size={20} /> Complaints
          </Link>
          <Link to="/worker-messages" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <MessageCircle size={20} /> Messages
          </Link>
          <Link to="/worker-settings" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition">
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
              <h2 className="text-xl font-bold text-gray-800">My Profile</h2>
              <p className="text-gray-500 text-sm">View and edit your profile</p>
            </div>
            <div className="flex gap-3">
              {saved && (
                <span className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle size={16} /> Saved!
                </span>
              )}
              {isEditing ? (
                <>
                  <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2">
                    <Save size={18} /> Save
                  </button>
                  <button onClick={() => { setIsEditing(false); setEditData(profile); }} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2">
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

        <div className="p-6">
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
                    src={editData.image || 'https://images.unsplash.com/photo-1589571894960-20bbe2828c42?w=150&h=150&fit=crop&crop=face'} 
                    alt={editData.fullName} 
                    className="w-full rounded-lg object-cover aspect-square"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1589571894960-20bbe2828c42?w=150&h=150&fit=crop&crop=face';
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
                    <span className="text-sm px-3 py-1 rounded-full bg-blue-100 text-blue-800">Worker</span>
                    <div className="flex items-center gap-1">
                      <Star size={16} className="fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{editData.rating}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{editData.category} • {editData.age} years old</p>
                </div>

                {/* Ratings */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 p-2 rounded-lg text-center">
                    <p className="text-xs text-gray-500">Performance</p>
                    <p className="font-bold text-gray-800">{editData.performance}</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-lg text-center">
                    <p className="text-xs text-gray-500">Honesty</p>
                    <p className="font-bold text-gray-800">{editData.honesty}</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-lg text-center">
                    <p className="text-xs text-gray-500">Speed</p>
                    <p className="font-bold text-gray-800">{editData.speed}</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-lg text-center">
                    <p className="text-xs text-gray-500">Accuracy</p>
                    <p className="font-bold text-gray-800">{editData.accuracy}</p>
                  </div>
                </div>

                {/* Quick Info */}
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin size={16} className="text-gray-400" />
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.city}
                        onChange={(e) => setEditData({...editData, city: e.target.value})}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-red-500"
                      />
                    ) : (
                      <span>{editData.city}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone size={16} className="text-gray-400" />
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editData.phone}
                        onChange={(e) => setEditData({...editData, phone: e.target.value})}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-red-500"
                      />
                    ) : (
                      <span>{editData.phone}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail size={16} className="text-gray-400" />
                    {isEditing ? (
                      <input
                        type="email"
                        value={editData.email}
                        onChange={(e) => setEditData({...editData, email: e.target.value})}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-red-500"
                      />
                    ) : (
                      <span>{editData.email}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Details */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                {/* Bio */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-800 mb-2">About</h3>
                  {isEditing ? (
                    <textarea
                      value={editData.bio}
                      onChange={(e) => setEditData({...editData, bio: e.target.value})}
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 resize-none"
                    />
                  ) : (
                    <p className="text-gray-600">{editData.bio || 'No bio provided'}</p>
                  )}
                </div>

                {/* Skills */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-800 mb-2">Skills</h3>
                  {isEditing ? (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {editData.skills.map((skill, i) => (
                          <span key={i} className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm flex items-center gap-1">
                            {skill}
                            <button
                              type="button"
                              onClick={() => handleRemoveSkill(skill)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X size={14} />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newSkill}
                          onChange={(e) => setNewSkill(e.target.value)}
                          placeholder="Add a skill..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                          onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                        />
                        <button
                          type="button"
                          onClick={handleAddSkill}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {editData.skills.map((skill, i) => (
                        <span key={i} className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Documents */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Documents</h3>
                  <div className="space-y-2">
                    {editData.documents.map((doc, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex items-center gap-3">
                          <FileText size={20} className="text-red-600" />
                          <div>
                            <p className="font-medium text-gray-800">{doc.name}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
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

export default WorkerProfile;