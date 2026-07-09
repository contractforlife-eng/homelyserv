// src/components/StatusBadge.jsx
import React from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Zap, 
  Heart, 
  Users,
  Star,
  DollarSign,
  Calendar,
  Briefcase
} from 'lucide-react';

const StatusBadge = ({ status, className = '', size = 'sm' }) => {
  const config = {
    // Offer statuses
    new: { color: 'bg-blue-100 text-blue-800', icon: Zap, label: 'New' },
    applied: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Applied' },
    saved: { color: 'bg-purple-100 text-purple-800', icon: Heart, label: 'Saved' },
    interview: { color: 'bg-indigo-100 text-indigo-800', icon: Users, label: 'Interview' },
    offered: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Offered' },
    rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rejected' },
    expired: { color: 'bg-gray-100 text-gray-800', icon: AlertCircle, label: 'Expired' },
    
    // Payment statuses
    completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Completed' },
    pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
    failed: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Failed' },
    refunded: { color: 'bg-gray-100 text-gray-800', icon: AlertCircle, label: 'Refunded' },
    processing: { color: 'bg-blue-100 text-blue-800', icon: Clock, label: 'Processing' },
    
    // Application statuses
    pending_review: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending Review' },
    interview_scheduled: { color: 'bg-indigo-100 text-indigo-800', icon: Calendar, label: 'Interview Scheduled' },
    accepted: { color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle, label: 'Accepted' },
    
    // Job types
    'full-time': { color: 'bg-green-100 text-green-800', icon: Briefcase, label: 'Full Time' },
    'part-time': { color: 'bg-blue-100 text-blue-800', icon: Clock, label: 'Part Time' },
    contract: { color: 'bg-purple-100 text-purple-800', icon: FileText, label: 'Contract' },
    freelance: { color: 'bg-orange-100 text-orange-800', icon: Star, label: 'Freelance' },
    
    // Other
    urgent: { color: 'bg-red-100 text-red-600', icon: AlertCircle, label: 'Urgent' },
    featured: { color: 'bg-yellow-100 text-yellow-700', icon: Star, label: 'Featured' },
    verified: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Verified' },
  };

  const { color, icon: Icon, label } = config[status] || config.new;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${color} ${sizeClasses[size]} ${className}`}>
      <Icon size={iconSizes[size]} />
      {label}
    </span>
  );
};

export default StatusBadge;