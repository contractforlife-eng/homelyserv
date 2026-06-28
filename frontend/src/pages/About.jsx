import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Briefcase, Award, Shield, Heart, Globe, CheckCircle, TrendingUp } from 'lucide-react';

function About() {
  const stats = [
    { label: 'Active Users', value: '25,000+', icon: <Users size={24} /> },
    { label: 'Workers', value: '8,000+', icon: <Briefcase size={24} /> },
    { label: 'Jobs Completed', value: '15,000+', icon: <CheckCircle size={24} /> },
    { label: 'Satisfaction Rate', value: '98%', icon: <Award size={24} /> }
  ];

  const values = [
    { title: 'Trust', description: 'We verify every worker to ensure safety and reliability.', icon: <Shield size={32} className="text-red-600" /> },
    { title: 'Quality', description: 'We connect you with the best professionals in the industry.', icon: <Award size={32} className="text-red-600" /> },
    { title: 'Care', description: 'We prioritize your home and family needs.', icon: <Heart size={32} className="text-red-600" /> },
    { title: 'Global', description: 'We serve communities worldwide with local expertise.', icon: <Globe size={32} className="text-red-600" /> }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-gray-600 hover:text-red-600 transition">← Back</Link>
            <h1 className="text-2xl font-bold text-gray-800">About HomelyServ</h1>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-8 text-white mb-8">
          <h1 className="text-4xl font-bold mb-4">Connecting Homes with Trusted Professionals</h1>
          <p className="text-lg text-red-100 max-w-2xl">
            HomelyServ is a comprehensive platform that connects job seekers with employers looking to hire domestic workers and care providers.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
              <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center mx-auto mb-3">
                {stat.icon}
              </div>
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Mission */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Our Mission</h2>
          <p className="text-gray-600 leading-relaxed">
            To provide a reliable and secure platform that facilitates employers' access to suitable workers and enables job seekers to find real job opportunities in an organized and professional manner.
          </p>
        </div>

        {/* Values */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {values.map((value, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
              <div className="flex justify-center mb-3">{value.icon}</div>
              <h3 className="font-semibold text-gray-800">{value.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{value.description}</p>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Why Choose HomelyServ?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle size={20} className="text-green-500 mt-1 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-800">Verified Professionals</p>
                <p className="text-sm text-gray-500">All workers are identity verified and background checked</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle size={20} className="text-green-500 mt-1 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-800">Secure Payments</p>
                <p className="text-sm text-gray-500">Multiple payment methods with secure processing</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle size={20} className="text-green-500 mt-1 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-800">Real-time Chat</p>
                <p className="text-sm text-gray-500">Communicate directly with workers and employers</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle size={20} className="text-green-500 mt-1 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-800">24/7 Support</p>
                <p className="text-sm text-gray-500">Our team is always here to help you</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default About;
