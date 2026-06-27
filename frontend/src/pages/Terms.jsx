import React from 'react';
import { Link } from 'react-router-dom';

function Terms() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-gray-600 hover:text-red-600 transition">← Back</Link>
            <h1 className="text-2xl font-bold text-gray-800">Terms of Service</h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">1. Introduction</h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            Welcome to HomelyServ. By using our platform, you agree to these terms and conditions. 
            Please read them carefully before using our services.
          </p>

          <h2 className="text-2xl font-bold text-gray-800 mb-4">2. User Accounts</h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            You must be at least 18 years old to create an account. You are responsible for maintaining 
            the security of your account and for all activities that occur under your account.
          </p>

          <h2 className="text-2xl font-bold text-gray-800 mb-4">3. User Types</h2>
          <div className="space-y-3 mb-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-800">Workers (Job Seekers)</h3>
              <p className="text-gray-600 text-sm">Create profiles, upload documents, and apply for jobs.</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-800">Employers</h3>
              <p className="text-gray-600 text-sm">Post jobs, search for workers, and manage hires.</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-4">4. Payments and Commissions</h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            Employers agree to pay a commission fee (6.5% + VAT) upon successful hire. 
            Payments can be made via InstaPay, Vodafone Cash, or Bank Transfer.
          </p>

          <h2 className="text-2xl font-bold text-gray-800 mb-4">5. Privacy</h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            We take your privacy seriously. Your personal data is protected and never shared 
            with third parties without your consent. See our Privacy Policy for details.
          </p>

          <h2 className="text-2xl font-bold text-gray-800 mb-4">6. Termination</h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            We reserve the right to suspend or terminate accounts that violate these terms 
            or engage in fraudulent activities.
          </p>

          <h2 className="text-2xl font-bold text-gray-800 mb-4">7. Changes to Terms</h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            We may update these terms from time to time. Continued use of the platform 
            constitutes acceptance of the updated terms.
          </p>

          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-6">
            <p className="text-sm text-red-800">
              Last updated: June 27, 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Terms;