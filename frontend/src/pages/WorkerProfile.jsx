import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Star, MapPin, DollarSign, Briefcase, Calendar, Clock, CheckCircle, MessageCircle, Shield, Award, Mail, Phone, X, Heart, Share2 } from 'lucide-react';

function WorkerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const worker = {
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
    image: 'https://images.unsplash.com/photo-1589571894960-20bbe2828c42?w=400&h=400&fit=crop&crop=face',
    skills: ['Childcare', 'First Aid', 'Teaching', 'Cooking', 'Swimming'],
    bio: 'Experienced nanny with 5 years of experience. Passionate about childcare and child development. I have worked with children of all ages from newborns to teenagers. I believe in creating a safe, nurturing, and educational environment for children to thrive.',
    documents: ['ID Card', 'Childcare Certificate', 'First Aid Certification'],
    experiences: [
      { employer: 'Smith Family', role: 'Full-Time Nanny', duration: '2019-2021' },
      { employer: 'Johnson Family', role: 'Live-in Nanny', duration: '2021-2024' }
    ],
    reviews: [
      { user: 'Sara Mohamed', rating: 5, comment: 'Excellent nanny! Highly recommended.', date: '2026-05-15' },
      { user: 'Khaled Rashed', rating: 4, comment: 'Great with children, very reliable.', date: '2026-04-20' }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <Link to="/search" className="text-red-600 hover:underline mb-4 inline-block">← Back to Search</Link>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <img src={worker.image} alt={worker.name} className="w-full rounded-lg object-cover aspect-square" />
              
              <div className="mt-4">
                <h2 className="text-2xl font-bold text-gray-800">{worker.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm px-3 py-1 rounded-full bg-green-100 text-green-800">{worker.availability}</span>
                  <div className="flex items-center gap-1">
                    <Star size={16} className="fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{worker.rating}</span>
                    <span className="text-sm text-gray-400">({worker.reviewCount})</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2.5 text-sm">
                <div className="flex items-center gap-3 text-gray-600"><MapPin size={16} className="text-gray-400" /> {worker.location}</div>
                <div className="flex items-center gap-3 text-gray-600"><DollarSign size={16} className="text-gray-400" /> EGP {worker.salary.toLocaleString()}/month</div>
                <div className="flex items-center gap-3 text-gray-600"><Briefcase size={16} className="text-gray-400" /> {worker.experienceYears} years experience</div>
                <div className="flex items-center gap-3 text-gray-600"><Clock size={16} className="text-gray-400" /> {worker.workType}</div>
                <div className="flex items-center gap-3 text-gray-600"><Phone size={16} className="text-gray-400" /> {worker.phone}</div>
                <div className="flex items-center gap-3 text-gray-600"><Mail size={16} className="text-gray-400" /> {worker.email}</div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-sm text-green-600"><CheckCircle size={16} /> Verified Profile</div>
                <div className="flex items-center gap-2 text-sm text-green-600 mt-1"><Shield size={16} /> Background Check</div>
                <div className="flex items-center gap-2 text-sm text-green-600 mt-1"><Award size={16} /> Documents Verified</div>
              </div>

              <div className="mt-4 space-y-2">
                <button className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium">Hire Now</button>
                <button className="w-full px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2">
                  <MessageCircle size={18} /> Contact
                </button>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-800 mb-2">About</h3>
              <p className="text-gray-600 leading-relaxed">{worker.bio}</p>

              <div className="mt-6">
                <h3 className="font-semibold text-gray-800 mb-2">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {worker.skills.map((skill, i) => (
                    <span key={i} className="px-3 py-1.5 bg-red-50 text-red-700 rounded-full text-sm">{skill}</span>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <h3 className="font-semibold text-gray-800 mb-2">Experience</h3>
                <div className="space-y-3">
                  {worker.experiences.map((exp, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <p className="font-medium text-gray-800">{exp.role}</p>
                      <p className="text-sm text-gray-600">{exp.employer}</p>
                      <p className="text-xs text-gray-400">{exp.duration}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <h3 className="font-semibold text-gray-800 mb-2">Documents</h3>
                <div className="flex flex-wrap gap-2">
                  {worker.documents.map((doc, i) => (
                    <span key={i} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm flex items-center gap-1">
                      <span className="text-xs">📄</span> {doc}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <h3 className="font-semibold text-gray-800 mb-2">Reviews</h3>
                <div className="space-y-3">
                  {worker.reviews.map((review, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-800">{review.user}</p>
                          <div className="flex items-center gap-1">
                            <Star size={14} className="fill-yellow-400 text-yellow-400" />
                            <span className="text-sm">{review.rating}</span>
                          </div>
                        </div>
                        <span className="text-xs text-gray-400">{review.date}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{review.comment}</p>
                    </div>
                  ))}
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