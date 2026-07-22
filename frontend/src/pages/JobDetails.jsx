import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Briefcase, MapPin, DollarSign, Calendar, Clock, 
  Users, Building, Star, CheckCircle, XCircle,
  MessageCircle, Heart, Share2, Flag, Award,
  FileText, Mail, Phone, Globe, ArrowLeft, Loader2
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import api from '../utils/api';

function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [applying, setApplying] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState(null);

  // Get authenticated user from authStore
  const authUser = useAuthStore(state => state.user);
  const authLoading = useAuthStore(state => state.loading);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  useEffect(() => {
    const fetchJobDetails = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // If there's a real API endpoint, use it
        // For now, we'll use mock data but with proper API call structure
        const response = await api.get(`/api/jobs/${id}`);
        if (response.data.success) {
          setJob(response.data.job);
        } else {
          throw new Error(response.data.message || 'Failed to load job details');
        }
      } catch (error) {
        console.error('Error fetching job details:', error);
        // Fallback to mock data if API not ready
        const mockJob = {
          id: parseInt(id) || 1,
          title: 'Nanny - Full Time',
          employer: 'Sara Mohamed',
          employerId: 'emp_123',
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
        setJob(mockJob);
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [id]);

  const handleApply = async () => {
    // Check if user is authenticated
    if (!isAuthenticated || !authUser) {
      navigate('/login', { state: { from: `/job/${id}` } });
      return;
    }

    setApplying(true);
    setApplicationStatus(null);

    try {
      const response = await api.post(`/api/jobs/${id}/apply`, {
        userId: authUser.id,
        userEmail: authUser.email,
        userName: authUser.fullName
      });

      if (response.data.success) {
        setApplicationStatus({
          success: true,
          message: 'Application submitted successfully!'
        });
      } else {
        throw new Error(response.data.message || 'Application failed');
      }
    } catch (error) {
      console.error('Error applying for job:', error);
      setApplicationStatus({
        success: false,
        message: error.message || 'Failed to apply. Please try again.'
      });
    } finally {
      setApplying(false);
    }
  };

  const handleContactEmployer = () => {
    if (!isAuthenticated || !authUser) {
      navigate('/login', { state: { from: `/job/${id}` } });
      return;
    }
    
    // Navigate to messages or open contact modal
    if (job?.employerDetails?.email) {
      navigate('/messages', { 
        state: { 
          recipientEmail: job.employerDetails.email,
          recipientName: job.employerDetails.name
        }
      });
    } else {
      // Fallback: just show a message
      alert('Contact employer functionality coming soon!');
    }
  };

  // Show loading state
  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-red-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error && !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Job Not Found</h3>
          <p className="text-gray-500">{error}</p>
          <button
            onClick={() => navigate('/search')}
            className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  if (!job) {
    return null;
  }

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

        {/* Application Status Message */}
        {applicationStatus && (
          <div className={`mb-6 p-4 rounded-xl ${
            applicationStatus.success 
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            <div className="flex items-center gap-2">
              {applicationStatus.success ? (
                <CheckCircle size={20} />
              ) : (
                <XCircle size={20} />
              )}
              {applicationStatus.message}
            </div>
          </div>
        )}

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
              <button 
                onClick={handleApply}
                disabled={applying}
                className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {applying ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Applying...
                  </>
                ) : (
                  'Apply Now'
                )}
              </button>
              <button 
                onClick={handleContactEmployer}
                className="w-full mt-3 border border-gray-300 py-3 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2"
              >
                <MessageCircle size={18} /> Contact Employer
              </button>
              {!isAuthenticated && (
                <p className="text-xs text-gray-500 text-center mt-3">
                  Please <Link to="/login" className="text-red-600 hover:underline">sign in</Link> to apply or contact
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default JobDetails;