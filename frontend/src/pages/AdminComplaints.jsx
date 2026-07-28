// src/pages/AdminComplaints.jsx - MIGRATED TO DASHBOARD LAYOUT
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import {
  Home,
  Users,
  MessageCircle,
  Settings,
  LogOut,
  Menu,
  Bell,
  Globe,
  X,
  CreditCard,
  Search,
  AlertTriangle,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter,
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  FileText,
  Trash2,
  Eye,
  Shield,
  Briefcase,
  UserCheck,
  Check,
  RefreshCw,
  Send,
  BarChart3,
  FileCheck,
  Crown,
  DollarSign,
  UserPlus
} from 'lucide-react';

// ============================================================
// MAIN ADMIN COMPLAINTS COMPONENT
// ============================================================
const AdminComplaints = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState('en');
  const [user, setUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  const translations = {
    en: {
      title: 'Complaints Management',
      subtitle: 'View and manage all complaints from workers and employers',
      stats: {
        total: 'Total Complaints',
        pending: 'Pending',
        resolved: 'Resolved',
        rejected: 'Rejected',
        inProgress: 'In Progress',
        workers: 'From Workers',
        employers: 'From Employers'
      },
      filters: {
        all: 'All Complaints',
        pending: 'Pending',
        inProgress: 'In Progress',
        resolved: 'Resolved',
        rejected: 'Rejected',
        workers: 'Workers Only',
        employers: 'Employers Only'
      },
      table: {
        title: 'Title',
        from: 'From',
        category: 'Category',
        status: 'Status',
        date: 'Date',
        actions: 'Actions',
        noResults: 'No complaints found',
        searchPlaceholder: 'Search complaints...'
      },
      actions: {
        view: 'View Details',
        resolve: 'Resolve',
        reject: 'Reject',
        refresh: 'Refresh',
        delete: 'Delete'
      },
      status: {
        pending: 'Pending',
        resolved: 'Resolved',
        rejected: 'Rejected',
        inProgress: 'In Progress'
      },
      categories: {
        general: 'General',
        employer: 'Employer Issue',
        payment: 'Payment Issue',
        platform: 'Platform Issue',
        worker: 'Worker Issue',
        other: 'Other'
      },
      modal: {
        title: 'Complaint Details',
        complaintId: 'Complaint ID',
        from: 'Submitted By',
        type: 'User Type',
        email: 'Email',
        phone: 'Phone',
        category: 'Category',
        status: 'Status',
        date: 'Date',
        description: 'Description',
        response: 'Admin Response',
        close: 'Close',
        resolve: 'Mark as Resolved',
        reject: 'Reject Complaint',
        resolveConfirm: 'Are you sure you want to mark this complaint as resolved?',
        rejectConfirm: 'Are you sure you want to reject this complaint?',
        resolved: 'Complaint resolved successfully!',
        rejected: 'Complaint rejected.',
        noResponse: 'No response yet',
        addResponse: 'Add Response',
        responsePlaceholder: 'Type your response here...',
        sendResponse: 'Send Response'
      },
      languageToggle: 'العربية',
      notifications: 'Notifications',
      loading: 'Loading complaints...',
      noComplaints: 'No complaints yet',
      refreshSuccess: 'Complaints refreshed!'
    },
    ar: {
      title: 'إدارة الشكاوى',
      subtitle: 'عرض وإدارة جميع الشكاوى من العمال وأصحاب العمل',
      stats: {
        total: 'إجمالي الشكاوى',
        pending: 'قيد الانتظار',
        resolved: 'تم الحل',
        rejected: 'مرفوض',
        inProgress: 'قيد المعالجة',
        workers: 'من العمال',
        employers: 'من أصحاب العمل'
      },
      filters: {
        all: 'جميع الشكاوى',
        pending: 'قيد الانتظار',
        inProgress: 'قيد المعالجة',
        resolved: 'تم الحل',
        rejected: 'مرفوض',
        workers: 'عمال فقط',
        employers: 'أصحاب عمل فقط'
      },
      table: {
        title: 'العنوان',
        from: 'من',
        category: 'الفئة',
        status: 'الحالة',
        date: 'التاريخ',
        actions: 'الإجراءات',
        noResults: 'لا توجد شكاوى',
        searchPlaceholder: 'ابحث عن شكاوى...'
      },
      actions: {
        view: 'عرض التفاصيل',
        resolve: 'حل',
        reject: 'رفض',
        refresh: 'تحديث',
        delete: 'حذف'
      },
      status: {
        pending: 'قيد الانتظار',
        resolved: 'تم الحل',
        rejected: 'مرفوض',
        inProgress: 'قيد المعالجة'
      },
      categories: {
        general: 'عام',
        employer: 'مشكلة مع صاحب العمل',
        payment: 'مشكلة في الدفع',
        platform: 'مشكلة في المنصة',
        worker: 'مشكلة مع عامل',
        other: 'أخرى'
      },
      modal: {
        title: 'تفاصيل الشكوى',
        complaintId: 'رقم الشكوى',
        from: 'مقدم من',
        type: 'نوع المستخدم',
        email: 'البريد الإلكتروني',
        phone: 'الهاتف',
        category: 'الفئة',
        status: 'الحالة',
        date: 'التاريخ',
        description: 'الوصف',
        response: 'رد الإدارة',
        close: 'إغلاق',
        resolve: 'تحديد كمحلولة',
        reject: 'رفض الشكوى',
        resolveConfirm: 'هل أنت متأكد من رغبتك في تحديد هذه الشكوى كمحلولة؟',
        rejectConfirm: 'هل أنت متأكد من رغبتك في رفض هذه الشكوى؟',
        resolved: 'تم حل الشكوى بنجاح!',
        rejected: 'تم رفض الشكوى.',
        noResponse: 'لا يوجد رد حتى الآن',
        addResponse: 'إضافة رد',
        responsePlaceholder: 'اكتب ردك هنا...',
        sendResponse: 'إرسال الرد'
      },
      languageToggle: 'English',
      notifications: 'الإشعارات',
      loading: 'جاري تحميل الشكاوى...',
      noComplaints: 'لا توجد شكاوى حتى الآن',
      refreshSuccess: 'تم تحديث الشكاوى!'
    }
  };

  const t = translations[language] || translations.en;

  // ============================================================
  // LOAD COMPLAINTS FROM ALL SOURCES
  // ============================================================
  const loadComplaints = () => {
    setLoading(true);
    
    try {
      // Load employer complaints
      const employerComplaints = JSON.parse(localStorage.getItem('employer_complaints') || '[]');
      
      // Load worker complaints  
      const workerComplaints = JSON.parse(localStorage.getItem('worker_complaints') || '[]');
      
      // Load admin complaints (if any stored directly)
      const adminComplaints = JSON.parse(localStorage.getItem('admin_complaints') || '[]');
      
      // Combine all complaints with source tracking
      const allComplaints = [];
      
      // Add employer complaints
      employerComplaints.forEach(c => {
        allComplaints.push({
          ...c,
          source: 'employer',
          sourceLabel: 'Employer',
          userEmail: c.employerEmail || c.email || 'Unknown',
          userName: c.employerName || c.name || 'Employer',
          userType: 'employer',
          submittedAt: c.date || c.createdAt || c.submittedAt || new Date().toISOString()
        });
      });
      
      // Add worker complaints
      workerComplaints.forEach(c => {
        allComplaints.push({
          ...c,
          source: 'worker',
          sourceLabel: 'Worker',
          userEmail: c.workerEmail || c.email || 'Unknown',
          userName: c.workerName || c.name || 'Worker',
          userType: 'worker',
          submittedAt: c.date || c.createdAt || c.submittedAt || new Date().toISOString()
        });
      });
      
      // Add admin complaints
      adminComplaints.forEach(c => {
        allComplaints.push({
          ...c,
          source: 'admin',
          sourceLabel: 'Admin',
          userEmail: c.adminEmail || c.email || 'Unknown',
          userName: c.adminName || c.name || 'Admin',
          userType: 'admin',
          submittedAt: c.date || c.createdAt || c.submittedAt || new Date().toISOString()
        });
      });
      
      // Sort by date (newest first)
      allComplaints.sort((a, b) => {
        const dateA = new Date(a.submittedAt || a.date || a.createdAt || 0);
        const dateB = new Date(b.submittedAt || b.date || b.createdAt || 0);
        return dateB - dateA;
      });
      
      console.log(`📋 Loaded ${allComplaints.length} complaints:`, {
        employer: employerComplaints.length,
        worker: workerComplaints.length,
        admin: adminComplaints.length
      });
      
      setComplaints(allComplaints);
      setFilteredComplaints(allComplaints);
      
    } catch (error) {
      console.error('Error loading complaints:', error);
      setComplaints([]);
      setFilteredComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // UPDATE COMPLAINT STATUS
  // ============================================================
  const updateComplaintStatus = (complaintId, newStatus) => {
    setProcessing(true);
    
    try {
      // Get all complaints from all sources
      const employerComplaints = JSON.parse(localStorage.getItem('employer_complaints') || '[]');
      const workerComplaints = JSON.parse(localStorage.getItem('worker_complaints') || '[]');
      const adminComplaints = JSON.parse(localStorage.getItem('admin_complaints') || '[]');
      
      // Update in employer complaints
      const updatedEmployer = employerComplaints.map(c => 
        c.id === complaintId ? { ...c, status: newStatus, updatedAt: new Date().toISOString() } : c
      );
      
      // Update in worker complaints
      const updatedWorker = workerComplaints.map(c => 
        c.id === complaintId ? { ...c, status: newStatus, updatedAt: new Date().toISOString() } : c
      );
      
      // Update in admin complaints
      const updatedAdmin = adminComplaints.map(c => 
        c.id === complaintId ? { ...c, status: newStatus, updatedAt: new Date().toISOString() } : c
      );
      
      // Save back to localStorage
      localStorage.setItem('employer_complaints', JSON.stringify(updatedEmployer));
      localStorage.setItem('worker_complaints', JSON.stringify(updatedWorker));
      localStorage.setItem('admin_complaints', JSON.stringify(updatedAdmin));
      
      // Reload complaints
      loadComplaints();
      
      // Show success message
      if (newStatus === 'resolved') {
        alert(t.modal.resolved);
      } else if (newStatus === 'rejected') {
        alert(t.modal.rejected);
      }
      
      // Close modal if open
      setShowDetailsModal(false);
      setSelectedComplaint(null);
      
    } catch (error) {
      console.error('Error updating complaint:', error);
      alert('Failed to update complaint. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // ============================================================
  // ADD ADMIN RESPONSE TO COMPLAINT
  // ============================================================
  const addResponse = (complaintId, responseText) => {
    if (!responseText.trim()) return;
    
    setProcessing(true);
    
    try {
      // Get all complaints from all sources
      const employerComplaints = JSON.parse(localStorage.getItem('employer_complaints') || '[]');
      const workerComplaints = JSON.parse(localStorage.getItem('worker_complaints') || '[]');
      const adminComplaints = JSON.parse(localStorage.getItem('admin_complaints') || '[]');
      
      // Find the complaint to get its source
      let complaintSource = null;
      let foundComplaint = null;
      
      // Check in employer complaints
      const empComplaint = employerComplaints.find(c => c.id === complaintId);
      if (empComplaint) {
        complaintSource = 'employer';
        foundComplaint = empComplaint;
      }
      
      // Check in worker complaints
      if (!foundComplaint) {
        const workComplaint = workerComplaints.find(c => c.id === complaintId);
        if (workComplaint) {
          complaintSource = 'worker';
          foundComplaint = workComplaint;
        }
      }
      
      // Check in admin complaints
      if (!foundComplaint) {
        const adminComp = adminComplaints.find(c => c.id === complaintId);
        if (adminComp) {
          complaintSource = 'admin';
          foundComplaint = adminComp;
        }
      }
      
      if (!foundComplaint) {
        alert('Complaint not found');
        setProcessing(false);
        return;
      }
      
      // Update the complaint with admin response
      const updatedComplaint = {
        ...foundComplaint,
        adminResponse: responseText,
        adminResponseAt: new Date().toISOString(),
        status: 'inProgress',
        updatedAt: new Date().toISOString()
      };
      
      // Update in the appropriate storage
      if (complaintSource === 'employer') {
        const updatedEmployer = employerComplaints.map(c => 
          c.id === complaintId ? updatedComplaint : c
        );
        localStorage.setItem('employer_complaints', JSON.stringify(updatedEmployer));
      } else if (complaintSource === 'worker') {
        const updatedWorker = workerComplaints.map(c => 
          c.id === complaintId ? updatedComplaint : c
        );
        localStorage.setItem('worker_complaints', JSON.stringify(updatedWorker));
      } else {
        const updatedAdmin = adminComplaints.map(c => 
          c.id === complaintId ? updatedComplaint : c
        );
        localStorage.setItem('admin_complaints', JSON.stringify(updatedAdmin));
      }
      
      // Also update admin_complaints for admin view
      const adminComplaintsUpdated = adminComplaints.map(c => 
        c.id === complaintId ? updatedComplaint : c
      );
      localStorage.setItem('admin_complaints', JSON.stringify(adminComplaintsUpdated));
      
      // Create notification for the complainant
      const notification = {
        id: 'notif_' + Date.now(),
        type: 'complaint_response',
        message: `Admin has responded to your complaint: "${foundComplaint.title}"`,
        complaintId: complaintId,
        complaintTitle: foundComplaint.title,
        response: responseText,
        date: new Date().toISOString(),
        read: false
      };
      
      // Reload complaints
      loadComplaints();
      
      // Update selected complaint
      if (selectedComplaint && selectedComplaint.id === complaintId) {
        setSelectedComplaint({
          ...selectedComplaint,
          adminResponse: responseText,
          adminResponseAt: new Date().toISOString(),
          status: 'inProgress'
        });
      }
      
      alert('✅ Response sent successfully! The user will see it in their complaints page.');
      
    } catch (error) {
      console.error('Error adding response:', error);
      alert('Failed to add response. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // ============================================================
  // useEffects
  // ============================================================
  // Use authStore as single source of truth
  const authUser = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const authLoading = useAuthStore(state => state.isLoading);

  useEffect(() => {
    const savedLang = localStorage.getItem('homelyserv_language');
    if (savedLang) setLanguage(savedLang);

    const sidebarState = localStorage.getItem('sidebar_collapsed');
    if (sidebarState) {
      setSidebarCollapsed(JSON.parse(sidebarState));
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !authUser) {
      navigate('/login');
      return;
    }

    if (authUser.role !== 'ADMIN') {
      navigate('/login');
      return;
    }

    setUser(authUser);
    loadComplaints();
  }, [authUser, isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  // Filter complaints
  useEffect(() => {
    let filtered = complaints;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    if (sourceFilter !== 'all') {
      filtered = filtered.filter(c => c.source === sourceFilter);
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.title?.toLowerCase().includes(searchLower) ||
        c.userName?.toLowerCase().includes(searchLower) ||
        c.userEmail?.toLowerCase().includes(searchLower) ||
        c.category?.toLowerCase().includes(searchLower) ||
        c.description?.toLowerCase().includes(searchLower) ||
        c.id?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredComplaints(filtered);
  }, [complaints, statusFilter, sourceFilter, searchTerm]);

  // ============================================================
  // UI Helpers
  // ============================================================
  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'ar' : 'en';
    setLanguage(newLang);
    localStorage.setItem('homelyserv_language', newLang);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
    localStorage.setItem('sidebar_collapsed', JSON.stringify(!sidebarCollapsed));
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLogout = () => {
    useAuthStore.getState().logout();
    navigate('/login');
  };

  const handleRefresh = () => {
    loadComplaints();
    alert(t.refreshSuccess);
  };

  const handleViewDetails = (complaint) => {
    setSelectedComplaint(complaint);
    setShowDetailsModal(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-500/20 text-yellow-400',
      inProgress: 'bg-blue-500/20 text-blue-400',
      resolved: 'bg-green-500/20 text-green-400',
      rejected: 'bg-red-500/20 text-red-400'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400 dark:text-gray-500';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock size={16} className="text-yellow-400" />;
      case 'inProgress': return <AlertCircle size={16} className="text-blue-400" />;
      case 'resolved': return <CheckCircle size={16} className="text-green-400" />;
      case 'rejected': return <X size={16} className="text-red-400" />;
      default: return <AlertCircle size={16} className="text-gray-400 dark:text-gray-500" />;
    }
  };

  const getStatusLabel = (status) => {
    return t.status[status] || status;
  };

  const getSourceIcon = (source) => {
    switch (source) {
      case 'employer': return <Briefcase size={14} className="text-blue-400" />;
      case 'worker': return <UserCheck size={14} className="text-green-400" />;
      case 'admin': return <Shield size={14} className="text-purple-400" />;
      default: return <UserIcon size={14} className="text-gray-400 dark:text-gray-500" />;
    }
  };

  const getSourceLabel = (source) => {
    return source === 'employer' ? 'Employer' : 
           source === 'worker' ? 'Worker' : 
           source === 'admin' ? 'Admin' : 'Unknown';
  };

  const getCategoryLabel = (category) => {
    return t.categories[category] || category || 'General';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => c.status === 'pending').length,
    inProgress: complaints.filter(c => c.status === 'inProgress').length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
    rejected: complaints.filter(c => c.status === 'rejected').length,
    workers: complaints.filter(c => c.source === 'worker').length,
    employers: complaints.filter(c => c.source === 'employer').length
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="mt-4 text-gray-400 dark:text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="mt-4 text-gray-400 dark:text-gray-500">{t.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout requiredRole="ADMIN" variant="admin">
      <DashboardHeader
        title={t.title}
        language={language}
        onToggleLanguage={toggleLanguage}
        notificationUserId={user?.id || user?.email}
        isPremium={false}
        variant="admin"
      />

      <div className="p-4 md:p-6">
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-2xl p-6 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-black">{t.title}</h1>
            <p className="text-black/70 mt-1">{t.subtitle}</p>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-black/70">
              <span>📋 Total: {stats.total}</span>
              <span>👤 Workers: {stats.workers}</span>
              <span>🏢 Employers: {stats.employers}</span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400 dark:text-gray-500">{t.stats.total}</p>
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <FileText size={20} className="text-blue-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400 dark:text-gray-500">{t.stats.pending}</p>
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Clock size={20} className="text-yellow-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white mt-1">{stats.pending}</p>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400 dark:text-gray-500">{t.stats.inProgress}</p>
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <AlertCircle size={20} className="text-blue-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white mt-1">{stats.inProgress}</p>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400 dark:text-gray-500">{t.stats.resolved}</p>
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle size={20} className="text-green-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white mt-1">{stats.resolved}</p>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400 dark:text-gray-500">{t.stats.rejected}</p>
              <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                <AlertCircle size={20} className="text-red-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white mt-1">{stats.rejected}</p>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400 dark:text-gray-500">From Workers</p>
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <UserCheck size={20} className="text-green-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white mt-1">{stats.workers}</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-yellow-500/20 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder={t.table.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-white placeholder-gray-500"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
              >
                <option value="all">{t.filters.all}</option>
                <option value="pending">{t.filters.pending}</option>
                <option value="inProgress">{t.filters.inProgress}</option>
                <option value="resolved">{t.filters.resolved}</option>
                <option value="rejected">{t.filters.rejected}</option>
              </select>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
              >
                <option value="all">All Sources</option>
                <option value="employer">Employers Only</option>
                <option value="worker">Workers Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Showing <span className="font-semibold text-white">{filteredComplaints.length}</span> complaints
          </p>
        </div>

        {/* Complaints List */}
        {filteredComplaints.length === 0 ? (
          <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-12 text-center border border-yellow-500/20">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-white mb-2">{t.noComplaints}</h3>
            <p className="text-gray-400 dark:text-gray-500">Complaints from workers and employers will appear here</p>
            <button
              onClick={handleRefresh}
              className="mt-4 px-6 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition"
            >
              <RefreshCw size={16} className="inline mr-2" />
              {t.actions.refresh}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredComplaints.map((complaint) => (
              <div
                key={complaint.id}
                className="bg-[#1a1a1a] rounded-xl shadow-sm border border-yellow-500/20 overflow-hidden hover:border-yellow-500/40 transition"
              >
                <div className="p-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        {getSourceIcon(complaint.source)}
                        <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
                          {getSourceLabel(complaint.source)}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400 dark:text-gray-500">|</span>
                        <AlertTriangle size={20} className="text-yellow-400" />
                        <div>
                          <h3 className="font-semibold text-white">{complaint.title}</h3>
                          <p className="text-sm text-gray-400 dark:text-gray-500">{complaint.userName}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-300 mt-1 line-clamp-2">{complaint.description}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
                        <span className="text-gray-500 dark:text-gray-400 dark:text-gray-500">{getCategoryLabel(complaint.category)}</span>
                        <span className="text-gray-600 dark:text-gray-300">|</span>
                        <span className="text-gray-500 dark:text-gray-400 dark:text-gray-500">{formatDate(complaint.submittedAt || complaint.date || complaint.createdAt)}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(complaint.status)}`}>
                          {getStatusIcon(complaint.status)}
                          {getStatusLabel(complaint.status)}
                        </span>
                        {complaint.source === 'employer' && (
                          <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs">Employer</span>
                        )}
                        {complaint.source === 'worker' && (
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full text-xs">Worker</span>
                        )}
                        {complaint.adminResponse && (
                          <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full text-xs flex items-center gap-1">
                            <CheckCircle size={12} />
                            Responded
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleViewDetails(complaint)}
                        className="px-3 py-1.5 bg-yellow-500/20 text-yellow-400 rounded-lg text-xs font-medium hover:bg-yellow-500/30 transition flex items-center gap-1"
                      >
                        <Eye size={14} />
                        {t.actions.view}
                      </button>
                      {complaint.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateComplaintStatus(complaint.id, 'resolved')}
                            disabled={processing}
                            className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-xs font-medium hover:bg-green-500/30 transition disabled:opacity-50"
                          >
                            <CheckCircle size={14} className="inline mr-1" />
                            {t.actions.resolve}
                          </button>
                          <button
                            onClick={() => updateComplaintStatus(complaint.id, 'rejected')}
                            disabled={processing}
                            className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/30 transition disabled:opacity-50"
                          >
                            <X size={14} className="inline mr-1" />
                            {t.actions.reject}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-yellow-500/20">
            <div className="flex items-center justify-between p-6 border-b border-yellow-500/20">
              <h2 className="text-xl font-semibold text-white">{t.modal.title}</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 rounded-lg hover:bg-yellow-500/10 transition-colors text-gray-400 dark:text-gray-500 hover:text-yellow-500"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="bg-[#0a0a0a] rounded-xl p-4 mb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-400 dark:text-gray-500">{t.modal.complaintId}</p>
                    <p className="text-lg font-bold text-white">{selectedComplaint.id}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${getStatusColor(selectedComplaint.status)}`}>
                    {getStatusIcon(selectedComplaint.status)}
                    {getStatusLabel(selectedComplaint.status)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#0a0a0a] rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-400 dark:text-gray-500 mb-3 flex items-center gap-2">
                    <UserIcon size={16} className="text-yellow-500" />
                    {t.modal.from}
                  </h3>
                  <p className="font-medium text-white">{selectedComplaint.userName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getSourceIcon(selectedComplaint.source)}
                    <span className="text-sm text-gray-400 dark:text-gray-500">{getSourceLabel(selectedComplaint.source)}</span>
                  </div>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{selectedComplaint.userEmail}</p>
                  {selectedComplaint.phone && (
                    <p className="text-sm text-gray-400 dark:text-gray-500">{selectedComplaint.phone}</p>
                  )}
                </div>

                <div className="bg-[#0a0a0a] rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-400 dark:text-gray-500 mb-3 flex items-center gap-2">
                    <FileText size={16} className="text-yellow-500" />
                    Details
                  </h3>
                  <p className="text-sm text-gray-400 dark:text-gray-500">{t.modal.category}</p>
                  <p className="font-medium text-white">{getCategoryLabel(selectedComplaint.category)}</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">{t.modal.date}</p>
                  <p className="font-medium text-white">{formatDate(selectedComplaint.submittedAt || selectedComplaint.date || selectedComplaint.createdAt)}</p>
                </div>
              </div>

              <div className="mt-4 bg-[#0a0a0a] rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-400 dark:text-gray-500 mb-2">{t.modal.description}</h3>
                <p className="text-white whitespace-pre-wrap">{selectedComplaint.description}</p>
              </div>

              {/* Admin Response Section */}
              <div className="mt-4 bg-[#0a0a0a] rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-400 dark:text-gray-500 mb-2 flex items-center gap-2">
                  <Shield size={16} className="text-yellow-500" />
                  {t.modal.response}
                </h3>
                {selectedComplaint.adminResponse ? (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                    <p className="text-white whitespace-pre-wrap">{selectedComplaint.adminResponse}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1">
                      {formatDate(selectedComplaint.adminResponseAt)}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500 text-sm">{t.modal.noResponse}</p>
                )}
                
                <div className="mt-3">
                  <textarea
                    placeholder={t.modal.responsePlaceholder}
                    rows="3"
                    className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-white placeholder-gray-500"
                    id="adminResponse"
                  />
                  <button
                    onClick={() => {
                      const response = document.getElementById('adminResponse').value;
                      if (response.trim()) {
                        addResponse(selectedComplaint.id, response);
                        document.getElementById('adminResponse').value = '';
                      } else {
                        alert('Please enter a response');
                      }
                    }}
                    disabled={processing}
                    className="mt-2 px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition disabled:opacity-50 flex items-center gap-2"
                  >
                    <Send size={16} />
                    {t.modal.sendResponse}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 p-6 border-t border-yellow-500/20">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors text-sm"
              >
                {t.modal.close}
              </button>
              
              {selectedComplaint.status === 'pending' && (
                <>
                  <button
                    onClick={() => updateComplaintStatus(selectedComplaint.id, 'resolved')}
                    disabled={processing}
                    className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle size={16} />
                    {t.modal.resolve}
                  </button>
                  <button
                    onClick={() => updateComplaintStatus(selectedComplaint.id, 'rejected')}
                    disabled={processing}
                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <X size={16} />
                    {t.modal.reject}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminComplaints;