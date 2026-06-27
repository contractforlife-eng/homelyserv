import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Briefcase, MapPin, DollarSign, Calendar, Clock, 
  Users, Building, Star, CheckCircle, XCircle,
  MessageCircle, Heart, Share2, Flag, Award,
  FileText, Mail, Phone, Globe, ArrowLeft
} from 'lucide-react';

function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const job = {
    id: 1,
    title: 'Nanny - Full Time',
    employer: 'Sara Mohamed',
    location: 'Cairo, Egypt',
    salary: 'EGP 3,500 - 4,500/month',
    type: 'Full-Time',
    posted: '2026-06-20',
    description: 'We are looking for an experienced nanny to care for our 2 children aged 2 and 5. The ideal candidate should have experience with children, be patient, caring, and reliable.',
    requirements: [
      'Minimum 3 years of experience',
      'First Aid certification',
      'Fluent in English',
      'Valid work permit'
    ],
    benefits: [
      'Competitive salary',
      'Accommodation provided',
      'Meals included',
      'Weekly off days'
    ],
    employerDetails: {
      name: 'Sara Mohamed',
      email: 'sara@example.com',
      phone: '+201234567891',
      rating: 4.8,
      totalHires: 12
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Link to="/search" className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition mb-4">
          <ArrowLeft size={18} /> Back to Search
        </Link>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{job.title}</h1>
              <div className="flex items-center gap-4 mt-2">
                <span className="flex items-center gap-1 text-gray-600">
                  <Building size={18} className="text-gray-400" /> {job.employer}
                </span>
                <span className="flex items-center gap-1 text-gray-600">
                  <MapPin size={18} className="text-gray-400" /> {job.location}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                <Heart size={20} className="text-gray-400" />
              </button>
              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                <Share2 size={20} className="text-gray-400" />
              </button>
              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                <Flag size={20} className="text-gray-400" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-500">Salary</p>
              <p className="font-semibold text-gray-800">{job.salary}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-500">Job Type</p>
              <p className="font-semibold text-gray-800">{job.type}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-500">Posted</p>
              <p className="font-semibold text-gray-800">{job.posted}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-3">Job Description</h2>
              <p className="text-gray-600 leading-relaxed">{job.description}</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-3">Requirements</h2>
              <ul className="space-y-2">
                {job.requirements.map((req, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-600">
                    <CheckCircle size={16} className="text-green-500" /> {req}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-3">Benefits</h2>
              <ul className="space-y-2">
                {job.benefits.map((benefit, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-600">
                    <Award size={16} className="text-blue-500" /> {benefit}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Sidebar */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Employer</h3>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold">
                  {job.employerDetails.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{job.employerDetails.name}</p>
                  <div className="flex items-center gap-1">
                    <Star size={14} className="fill-yellow-400 text-yellow-400" />
                    <span className="text-sm">{job.employerDetails.rating}</span>
                    <span className="text-xs text-gray-400">({job.employerDetails.totalHires} hires)</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail size={14} className="text-gray-400" /> {job.employerDetails.email}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone size={14} className="text-gray-400" /> {job.employerDetails.phone}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <button className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition font-medium">
                Apply Now
              </button>
              <button className="w-full mt-3 border border-gray-300 py-3 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2">
                <MessageCircle size={18} /> Contact Employer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default JobDetails;