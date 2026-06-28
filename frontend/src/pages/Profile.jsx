import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, Mail, Phone, MapPin, Briefcase, Calendar, Edit, 
  Save, X, Camera, CheckCircle, AlertCircle, Upload,
  Star, Shield, Award, Clock, FileText, Download,
  Trash2, Plus, Minus, ChevronDown, ChevronUp
} from 'lucide-react';
import axios from 'axios';

function Profile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phone: '',
    city: '',
    role: 'worker',
    category: '',
    experience: '',
    salary: '',
    availability: 'Available',
    workType: 'Full-Time',
    bio: '',
    skills: [],
    image: ''
  });

  const [editData, setEditData] = useState(profile);
  const [newSkill, setNewSkill] = useState('');
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        setUser(parsed);
        
        // Use the image from localStorage if exists, otherwise use default
        const userImage = parsed.image || 'https://images.unsplash.com/photo-1589571894960-20bbe2828c42?w=150&h=150&fit=crop&crop=face';
        
        const profileData = {
          fullName: parsed.fullName || '',
          email: parsed.email || '',
          phone: parsed.phone || '',
          city: parsed.city || '',
          role: parsed.role || 'worker',
          category: parsed.category || 'Nanny',
          experience: parsed.experience || '5',
          salary: parsed.salary || '3500',
          availability: parsed.availability || 'Available',
          workType: parsed.workType || 'Full-Time',
          bio: parsed.bio || 'Experienced professional with a passion for helping others.',
          skills: parsed.skills || ['Childcare', 'First Aid'],
          image: userImage
        };
        setProfile(profileData);
        setEditData(profileData);
        setLoading(false);
      } catch (e) {
        console.error('Error parsing user data:', e);
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setLoading(true);
      try {
        // Compress image
        const reader = new FileReader();
        reader.onloadend = async () => {
          const img = new Image();
          img.onload = async () => {
            // Compress to 200x200
            const canvas = document.createElement('canvas');
            canvas.width = 200;
            canvas.height = 200;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, 200, 200);
            const compressedImage = canvas.toDataURL('image/jpeg', 0.8);
            
            // Update local state
            setEditData(prev => ({ ...prev, image: compressedImage }));
            setLoading(false);
          };
          img.src = reader.result;
        };
        reader.readAsDataURL(file);
      } catch (err) {
        console.error('Error uploading image:', err);
        setError('Failed to upload image');
        setLoading(false);
      }
    }
  };

  const handleSave = async () => {
    setError('');
    setLoading(true);
    
    // Validate required fields
    if (!editData.fullName.trim()) {
      setError('Full name is required');
      setLoading(false);
      return;
    }
    if (!editData.email.trim()) {
      setError('Email is required');
      setLoading(false);
      return;
    }
    
    try {
      // Update profile state
      setProfile(editData);
      
      // Update localStorage with all data
      if (user) {
        const token = localStorage.getItem('token');
        const updatedUser = { 
          ...user, 
          ...editData,
          fullName: editData.fullName,
          email: editData.email,
          phone: editData.phone || '',
          city: editData.city || '',
          category: editData.category,
          experience: editData.experience,
          salary: editData.salary,
          availability: editData.availability,
          workType: editData.workType,
          bio: editData.bio,
          skills: editData.skills,
          image: editData.image || ''
        };
        
        // Save to localStorage
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        
        // Also update on server
        try {
          await axios.put(`${API_URL}/auth/profile`, updatedUser, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
        } catch (err) {
          console.log('Server update failed, but local saved:', err);
        }
      }
      
      setIsEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData(profile);
    setError('');
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

  if (loading && !profile.fullName) {
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
            <Link to="/worker-dashboard" className="text-gray-600 hover:text-red-600 transition">← Back</Link>
            <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
          </div>
          <div className="flex gap-3">
            {saved && (
              <span className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle size={16} /> Saved successfully!
              </span>
            )}
            {isEditing ? (
              <>
                <button onClick={handleSave} disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 disabled:opacity-50">
                  <Save size={18} /> {loading ? 'Saving...' : 'Save'}
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

      <div className="max-w-4xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {/* Profile Image */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-6">
            <div className="relative">
              {editData.image ? (
                <img 
                  src={editData.image} 
                  alt={profile.fullName} 
                  className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1589571894960-20bbe2828c42?w=150&h=150&fit=crop&crop=face';
                  }}
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-200 border-4 border-gray-200 flex items-center justify-center text-3xl font-bold text-gray-500">
                  {profile.fullName?.charAt(0) || 'U'}
                </div>
              )}
              <button 
                onClick={handlePhotoClick}
                className="absolute bottom-0 right-0 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition"
                title="Change Photo"
              >
                <Camera size={16} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>
            <div className="flex-1">
              {isEditing ? (
                <input
                  type="text"
                  value={editData.fullName}
                  onChange={(e) => setEditData({...editData, fullName: e.target.value})}
                  className="text-2xl font-bold text-gray-800 w-full px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              ) : (
                <h2 className="text-2xl font-bold text-gray-800">{profile.fullName || 'User'}</h2>
              )}
              {isEditing ? (
                <select
                  value={editData.role}
                  onChange={(e) => setEditData({...editData, role: e.target.value})}
                  className="text-gray-500 text-sm px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 mt-1"
                >
                  <option value="worker">Worker</option>
                  <option value="employer">Employer</option>
                </select>
              ) : (
                <p className="text-gray-500">{profile.role || 'No role'}</p>
              )}
            </div>
          </div>

          {/* Profile Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.fullName}
                  onChange={(e) => setEditData({...editData, fullName: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              ) : (
                <p className="text-gray-800">{profile.fullName || 'Not set'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
              {isEditing ? (
                <input
                  type="email"
                  value={editData.email}
                  onChange={(e) => setEditData({...editData, email: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              ) : (
                <p className="text-gray-800">{profile.email || 'Not set'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={editData.phone}
                  onChange={(e) => setEditData({...editData, phone: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              ) : (
                <p className="text-gray-800">{profile.phone || 'Not set'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">City</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.city}
                  onChange={(e) => setEditData({...editData, city: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              ) : (
                <p className="text-gray-800">{profile.city || 'Not set'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
              {isEditing ? (
                <select
                  value={editData.category}
                  onChange={(e) => setEditData({...editData, category: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  <option value="Nanny">Nanny</option>
                  <option value="Elderly Caregiver">Elderly Caregiver</option>
                  <option value="Driver">Driver</option>
                  <option value="Cook">Cook</option>
                  <option value="Nurse">Nurse</option>
                  <option value="House Manager">House Manager</option>
                  <option value="Gardener">Gardener</option>
                  <option value="Bodyguard">Bodyguard</option>
                  <option value="Security Guard">Security Guard</option>
                </select>
              ) : (
                <p className="text-gray-800">{profile.category || 'Not set'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Experience (years)</label>
              {isEditing ? (
                <input
                  type="number"
                  value={editData.experience}
                  onChange={(e) => setEditData({...editData, experience: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              ) : (
                <p className="text-gray-800">{profile.experience || '0'} years</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Expected Salary (EGP/month)</label>
              {isEditing ? (
                <input
                  type="number"
                  value={editData.salary}
                  onChange={(e) => setEditData({...editData, salary: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              ) : (
                <p className="text-gray-800">EGP {profile.salary || '0'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Availability</label>
              {isEditing ? (
                <select
                  value={editData.availability}
                  onChange={(e) => setEditData({...editData, availability: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  <option value="Available">Available</option>
                  <option value="Part-Time">Part-Time</option>
                  <option value="Full-Time">Full-Time</option>
                  <option value="Not Available">Not Available</option>
                </select>
              ) : (
                <p className="text-gray-800">{profile.availability || 'Not set'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Work Type</label>
              {isEditing ? (
                <select
                  value={editData.workType}
                  onChange={(e) => setEditData({...editData, workType: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  <option value="Full-Time">Full-Time</option>
                  <option value="Part-Time">Part-Time</option>
                  <option value="Contract">Contract</option>
                  <option value="Temporary">Temporary</option>
                </select>
              ) : (
                <p className="text-gray-800">{profile.workType || 'Not set'}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Bio</label>
              {isEditing ? (
                <textarea
                  value={editData.bio}
                  onChange={(e) => setEditData({...editData, bio: e.target.value})}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 resize-none"
                />
              ) : (
                <p className="text-gray-600">{profile.bio || 'Not set'}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Skills</label>
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
                  {profile.skills.map((skill, i) => (
                    <span key={i} className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;