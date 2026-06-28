import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Star, MapPin, DollarSign, Briefcase, Calendar, Clock, 
  CheckCircle, XCircle, MessageCircle, Shield, Award, 
  Mail, Phone, Heart, Share2, Flag, FileText, 
  Download, Eye, ThumbsUp, ThumbsDown, User,
  Bookmark, ExternalLink, Copy, Edit, Save, X,
  Camera, Upload, Trash2, Plus, Minus, ChevronDown,
  ChevronUp, AlertCircle
} from 'lucide-react';

function WorkerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [isSaved, setIsSaved] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [activeTab, setActiveTab] = useState('about');
  const [isEditing, setIsEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  // Worker data state
  const [worker, setWorker] = useState({
    id: 1,
    name: 'Ahmed Ali',
    category: 'Nanny',
    rating: 4.9,
    reviewCount: 127,
    location: 'Cairo, Egypt',
    phone: '+201234567890',
    email: 'ahmed@example.com',
    salary: 3500,
    availability: 'Available',
    workType: 'Full-Time',
    experienceYears: 5,
    verified: true,
    age: 28,
    image: 'https://images.unsplash.com/photo-1589571894960-20bbe2828c42?w=400&h=400&fit=crop&crop=face',
    skills: ['Childcare', 'First Aid', 'Teaching', 'Cooking', 'Swimming', 'Driving'],
    bio: 'Experienced nanny with 5 years of experience. Passionate about childcare and child development. I have worked with children of all ages from newborns to teenagers. I believe in creating a safe, nurturing, and educational environment for children to thrive.',
    documents: [
      { name: 'ID Card.pdf', type: 'Identity', size: '2.4 MB', verified: true },
      { name: 'Childcare Certificate.pdf', type: 'Certificate', size: '1.8 MB', verified: true },
      { name: 'First Aid Certification.pdf', type: 'Certificate', size: '3.2 MB', verified: true }
    ],
    experiences: [
      { employer: 'Smith Family', role: 'Full-Time Nanny', startDate: '2019-01', endDate: '2021-06', description: 'Cared for two children aged 2 and 5. Managed daily routines, meal preparation, educational activities, and school drop-offs.' },
      { employer: 'Johnson Family', role: 'Live-in Nanny', startDate: '2021-08', endDate: '2024-03', description: 'Cared for newborn twins. Handled all aspects of infant care including feeding, bathing, sleep training, and developmental activities.' }
    ],
    reviews: [
      { user: 'Sara Mohamed', rating: 5, comment: 'Excellent nanny! Highly recommended. Ahmed was professional, caring, and great with our children.', date: '2026-05-15' },
      { user: 'Khaled Rashed', rating: 4, comment: 'Great with children, very reliable. Punctual and always prepared with activities.', date: '2026-04-20' }
    ],
    stats: {
      totalHires: 12,
      completedHires: 10,
      onTimeRate: 98,
      responseRate: 95
    }
  });

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    category: '',
    location: '',
    phone: '',
    email: '',
    salary: '',
    availability: '',
    workType: '',
    experienceYears: '',
    age: '',
    bio: '',
    skills: []
  });

  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    // Check if worker is saved
    const savedWorkers = JSON.parse(localStorage.getItem('savedWorkers') || '[]');
    setIsSaved(savedWorkers.includes(id));
    
    // Initialize edit form with worker data
    setEditForm({
      name: worker.name,
      category: worker.category,
      location: worker.location,
      phone: worker.phone,
      email: worker.email,
      salary: worker.salary,
      availability: worker.availability,
      workType: worker.workType,
      experienceYears: worker.experienceYears,
      age: worker.age,
      bio: worker.bio,
      skills: [...worker.skills]
    });
  }, [id, worker]);

  const toggleSave = () => {
    const savedWorkers = JSON.parse(localStorage.getItem('savedWorkers') || '[]');
    if (isSaved) {
      const updated = savedWorkers.filter(w => w !== id);
      localStorage.setItem('savedWorkers', JSON.stringify(updated));
    } else {
      savedWorkers.push(id);
      localStorage.setItem('savedWorkers', JSON.stringify(savedWorkers));
    }
    setIsSaved(!isSaved);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${worker.name} - HomelyServ`,
        text: `Check out ${worker.name}'s profile on HomelyServ`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Profile link copied to clipboard!');
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // In production, upload to server
      const reader = new FileReader();
      reader.onloadend = () => {
        setWorker(prev => ({ ...prev, image: reader.result }));
        setEditForm(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset form to original data
    setEditForm({
      name: worker.name,
      category: worker.category,
      location: worker.location,
      phone: worker.phone,
      email: worker.email,
      salary: worker.salary,
      availability: worker.availability,
      workType: worker.workType,
      experienceYears: worker.experienceYears,
      age: worker.age,
      bio: worker.bio,
      skills: [...worker.skills]
    });
  };

  const handleSaveEdit = () => {
    // Update worker with edited data
    setWorker(prev => ({
      ...prev,
      name: editForm.name,
      category: editForm.category,
      location: editForm.location,
      phone: editForm.phone,
      email: editForm.email,
      salary: editForm.salary,
      availability: editForm.availability,
      workType: editForm.workType,
      experienceYears: editForm.experienceYears,
      age: editForm.age,
      bio: editForm.bio,
      skills: [...editForm.skills]
    }));
    setIsEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !editForm.skills.includes(newSkill.trim())) {
      setEditForm(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setEditForm(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skillToRemove)
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <Link to="/search" className="inline-flex items-center gap-2 text-gray-600 hover:text-red-600 transition mb-4">
          ← Back to Search
        </Link>

        {/* Save Success Message */}
        {saved && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm flex items-center gap-2">
            <CheckCircle size={18} /> Profile updated successfully!
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-4">
              {/* Profile Image */}
              <div className="relative">
                <img src={worker.image} alt={worker.name} className="w-full rounded-lg object-cover aspect-square" />
                {worker.verified && (
                  <div className="absolute top-3 right-3 bg-green-500 rounded-full p-1.5">
                    <CheckCircle size={16} className="text-white" />
                  </div>
                )}
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
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-xl font-bold"
                  />
                ) : (
                  <h2 className="text-2xl font-bold text-gray-800">{worker.name}</h2>
                )}
                <div className="flex items-center gap-2 mt-1">
                  {isEditing ? (
                    <select
                      value={editForm.availability}
                      onChange={(e) => setEditForm({...editForm, availability: e.target.value})}
                      className="text-sm px-3 py-1 rounded-full border border-gray-300 focus:ring-2 focus:ring-red-500"
                    >
                      <option value="Available">Available</option>
                      <option value="Part-Time">Part-Time</option>
                      <option value="Full-Time">Full-Time</option>
                      <option value="Not Available">Not Available</option>
                    </select>
                  ) : (
                    <span className={`text-sm px-3 py-1 rounded-full ${
                      worker.availability === 'Available' ? 'bg-green-100 text-green-800' :
                      worker.availability === 'Part-Time' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {worker.availability}
                    </span>
                  )}
                  <div className="flex items-center gap-1">
                    <Star size={16} className="fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{worker.rating}</span>
                    <span className="text-sm text-gray-400">({worker.reviewCount})</span>
                  </div>
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.category}
                    onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                    className="w-full mt-1 text-sm px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                ) : (
                  <p className="text-sm text-gray-500 mt-1">{worker.category} • {worker.age} years old</p>
                )}
              </div>

              {/* Quick Info */}
              <div className="mt-4 space-y-2.5 text-sm">
                <div className="flex items-center gap-3 text-gray-600">
                  <MapPin size={16} className="text-gray-400" />
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.location}
                      onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                      className="flex-1 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    />
                  ) : (
                    <span>{worker.location}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <DollarSign size={16} className="text-gray-400" />
                  {isEditing ? (
                    <input
                      type="number"
                      value={editForm.salary}
                      onChange={(e) => setEditForm({...editForm, salary: parseInt(e.target.value)})}
                      className="flex-1 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    />
                  ) : (
                    <span>EGP {worker.salary.toLocaleString()}/month</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <Briefcase size={16} className="text-gray-400" />
                  {isEditing ? (
                    <input
                      type="number"
                      value={editForm.experienceYears}
                      onChange={(e) => setEditForm({...editForm, experienceYears: parseInt(e.target.value)})}
                      className="flex-1 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    />
                  ) : (
                    <span>{worker.experienceYears} years experience</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <Clock size={16} className="text-gray-400" />
                  {isEditing ? (
                    <select
                      value={editForm.workType}
                      onChange={(e) => setEditForm({...editForm, workType: e.target.value})}
                      className="flex-1 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    >
                      <option value="Full-Time">Full-Time</option>
                      <option value="Part-Time">Part-Time</option>
                      <option value="Contract">Contract</option>
                      <option value="Temporary">Temporary</option>
                    </select>
                  ) : (
                    <span>{worker.workType}</span>
                  )}
                </div>
              </div>

              {/* Edit/Save Buttons */}
              <div className="mt-4 space-y-2">
                {isEditing ? (
                  <div className="flex gap-2">
                    <button 
                      onClick={handleSaveEdit}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium flex items-center justify-center gap-2"
                    >
                      <Save size={18} /> Save Changes
                    </button>
                    <button 
                      onClick={handleCancelEdit}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2"
                    >
                      <X size={18} /> Cancel
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={handleEditClick}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium flex items-center justify-center gap-2"
                  >
                    <Edit size={18} /> Edit Profile
                  </button>
                )}
                <button className="w-full px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition font-medium">
                  Hire Now
                </button>
                <button 
                  onClick={() => setShowContact(!showContact)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2"
                >
                  <MessageCircle size={18} /> Contact
                </button>
                <div className="flex gap-2">
                  <button 
                    onClick={toggleSave}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2 text-sm"
                  >
                    {isSaved ? <Bookmark size={16} className="text-red-600 fill-red-600" /> : <Bookmark size={16} />}
                    {isSaved ? 'Saved' : 'Save'}
                  </button>
                  <button 
                    onClick={handleShare}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2 text-sm"
                  >
                    <Share2 size={16} /> Share
                  </button>
                </div>
              </div>

              {/* Contact Info (toggle) */}
              {showContact && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="font-medium text-gray-800 mb-2">Contact Details</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone size={14} className="text-gray-400" />
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.phone}
                          onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-red-500"
                        />
                      ) : (
                        <span>{worker.phone}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail size={14} className="text-gray-400" />
                      {isEditing ? (
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-red-500"
                        />
                      ) : (
                        <span>{worker.email}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Tabs */}
              <div className="border-b border-gray-100 flex overflow-x-auto">
                {['about', 'experience', 'reviews', 'documents'].map((tab) => (
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
                {activeTab === 'about' && (
                  <div className="space-y-6">
                    {/* Bio */}
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-2">About</h3>
                      {isEditing ? (
                        <textarea
                          value={editForm.bio}
                          onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                          rows="4"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 resize-none"
                        />
                      ) : (
                        <p className="text-gray-600 leading-relaxed">{worker.bio}</p>
                      )}
                    </div>

                    {/* Skills */}
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-2">Skills</h3>
                      {isEditing ? (
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {editForm.skills.map((skill, i) => (
                              <span key={i} className="px-3 py-1.5 bg-red-50 text-red-700 rounded-full text-sm flex items-center gap-1">
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
                          {worker.skills.map((skill, i) => (
                            <span key={i} className="px-3 py-1.5 bg-red-50 text-red-700 rounded-full text-sm">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Verification Badges */}
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-2">Verification</h3>
                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle size={16} /> Identity Verified
                        </div>
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <Shield size={16} /> Background Check
                        </div>
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <Award size={16} /> Documents Verified
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'experience' && (
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-4">Work Experience</h3>
                    <div className="space-y-4">
                      {worker.experiences.map((exp, i) => (
                        <div key={i} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold text-gray-800">{exp.role}</h4>
                              <p className="text-sm text-gray-600">{exp.employer}</p>
                            </div>
                            <span className="text-sm text-gray-400">
                              {exp.startDate} - {exp.endDate || 'Present'}
                            </span>
                          </div>
                          {exp.description && (
                            <p className="text-sm text-gray-600 mt-2">{exp.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-4">Reviews</h3>
                    <div className="space-y-4">
                      {worker.reviews.map((review, i) => (
                        <div key={i} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-800">{review.user}</p>
                              <div className="flex items-center gap-1 mt-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} size={14} className={i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
                                ))}
                              </div>
                            </div>
                            <span className="text-xs text-gray-400">{review.date}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-2">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'documents' && (
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-4">Documents</h3>
                    <div className="space-y-3">
                      {worker.documents.map((doc, i) => (
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

export default WorkerProfile;
