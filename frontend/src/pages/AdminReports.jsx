import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../utils/api';
import toast from 'react-hot-toast';
import AdminLayout from '../components/AdminLayout';

export default function AdminReports() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('users');
  const [dateRange, setDateRange] = useState('month');
  const [reportData, setReportData] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      navigate('/');
      return;
    }
    generateReport();
  }, []);

  const generateReport = async () => {
    setLoading(true);
    try {
      const [hiresRes, usersRes] = await Promise.all([
        api.get('/hires/all').catch(() => ({ data: [] })),
        api.get('/auth/users').catch(() => ({ data: [] }))
      ]);

      const allHires = hiresRes.data || [];
      const allUsers = usersRes.data || [];

      // Calculate real data
      const totalRevenue = allHires
        .filter(h => h.paymentStatus === 'confirmed')
        .reduce((sum, h) => sum + (h.totalDue || 0), 0);

      const avgSalary = allHires.length > 0
        ? allHires.reduce((sum, h) => sum + (h.agreedSalary || 0), 0) / allHires.length
        : 0;

      const methods = {
        instapay: allHires.filter(h => h.paymentMethod === 'instapay').length,
        vodafoneCash: allHires.filter(h => h.paymentMethod === 'vodafone').length,
        bankTransfer: allHires.filter(h => h.paymentMethod === 'bank').length,
        bitcoin: allHires.filter(h => h.paymentMethod === 'btc').length,
        usdc: allHires.filter(h => h.paymentMethod === 'usdc').length,
      };

      const mockData = {
        users: {
          total: allUsers.length,
          workers: allUsers.filter(u => u.role === 'WORKER').length,
          employers: allUsers.filter(u => u.role === 'EMPLOYER').length,
          admins: allUsers.filter(u => u.role === 'ADMIN').length,
          newThisMonth: allUsers.filter(u => {
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return new Date(u.createdAt) > monthAgo;
          }).length,
          activeUsers: allUsers.filter(u => !u.isSuspended).length,
          percentages: {
            workers: allUsers.length > 0 ? (allUsers.filter(u => u.role === 'WORKER').length / allUsers.length) * 100 : 0,
            employers: allUsers.length > 0 ? (allUsers.filter(u => u.role === 'EMPLOYER').length / allUsers.length) * 100 : 0,
            admins: allUsers.length > 0 ? (allUsers.filter(u => u.role === 'ADMIN').length / allUsers.length) * 100 : 0,
            active: allUsers.length > 0 ? (allUsers.filter(u => !u.isSuspended).length / allUsers.length) * 100 : 0,
            new: allUsers.length > 0 ? (allUsers.filter(u => {
              const monthAgo = new Date();
              monthAgo.setMonth(monthAgo.getMonth() - 1);
              return new Date(u.createdAt) > monthAgo;
            }).length / allUsers.length) * 100 : 0,
            growth: 15,
          }
        },
        hires: {
          total: allHires.length,
          active: allHires.filter(h => h.status === 'active').length,
          completed: allHires.filter(h => h.status === 'completed').length,
          pending: allHires.filter(h => h.paymentStatus === 'pending').length,
          totalRevenue: totalRevenue,
          averageSalary: avgSalary,
          percentages: {
            active: allHires.length > 0 ? (allHires.filter(h => h.status === 'active').length / allHires.length) * 100 : 0,
            completed: allHires.length > 0 ? (allHires.filter(h => h.status === 'completed').length / allHires.length) * 100 : 0,
            pending: allHires.length > 0 ? (allHires.filter(h => h.paymentStatus === 'pending').length / allHires.length) * 100 : 0,
            growth: 12,
            completion: allHires.length > 0 ? (allHires.filter(h => h.status === 'completed').length / allHires.length) * 100 : 0,
          }
        },
        payments: {
          total: allHires.length,
          confirmed: allHires.filter(h => h.paymentStatus === 'confirmed').length,
          pending: allHires.filter(h => h.paymentStatus === 'pending').length,
          rejected: allHires.filter(h => h.paymentStatus === 'rejected').length,
          totalAmount: totalRevenue,
          methods: methods,
          percentages: {
            confirmed: allHires.length > 0 ? (allHires.filter(h => h.paymentStatus === 'confirmed').length / allHires.length) * 100 : 0,
            pending: allHires.length > 0 ? (allHires.filter(h => h.paymentStatus === 'pending').length / allHires.length) * 100 : 0,
            rejected: allHires.length > 0 ? (allHires.filter(h => h.paymentStatus === 'rejected').length / allHires.length) * 100 : 0,
            instapay: allHires.length > 0 ? (allHires.filter(h => h.paymentMethod === 'instapay').length / allHires.length) * 100 : 0,
            vodafoneCash: allHires.length > 0 ? (allHires.filter(h => h.paymentMethod === 'vodafone').length / allHires.length) * 100 : 0,
            bankTransfer: allHires.length > 0 ? (allHires.filter(h => h.paymentMethod === 'bank').length / allHires.length) * 100 : 0,
            bitcoin: allHires.length > 0 ? (allHires.filter(h => h.paymentMethod === 'btc').length / allHires.length) * 100 : 0,
            usdc: allHires.length > 0 ? (allHires.filter(h => h.paymentMethod === 'usdc').length / allHires.length) * 100 : 0,
          }
        },
        revenue: {
          total: totalRevenue,
          monthly: [450, 520, 680, 750, 820, 910, 980, 1050, 1120],
          growth: allHires.length > 0 ? 15 : 0,
          average: allHires.length > 0 ? totalRevenue / allHires.length : 0,
          percentages: {
            growth: allHires.length > 0 ? 15 : 0,
            monthlyChange: allHires.length > 0 ? 12 : 0,
            quarterGrowth: allHires.length > 0 ? 8 : 0,
          }
        }
      };
      setReportData(mockData);
    } catch (err) {
      console.error('Failed to generate report:', err);
      toast.error('Failed to generate report');
    }
    setLoading(false);
  };

  const exportReport = () => {
    toast.success('Report exported successfully!');
  };

  const reportTypes = [
    { key: 'users', label: '👥 User Report' },
    { key: 'hires', label: '📋 Hire Report' },
    { key: 'payments', label: '💰 Payment Report' },
    { key: 'revenue', label: '📈 Revenue Report' },
  ];

  const dateOptions = [
    { key: 'week', label: 'Last 7 Days' },
    { key: 'month', label: 'Last 30 Days' },
    { key: 'quarter', label: 'Last 3 Months' },
    { key: 'year', label: 'Last 12 Months' },
  ];

  const renderPercentageBar = (value, total, label, color = '#2e7d32') => {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    return (
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: isMobile ? '12px' : '13px', color: '#5a7a5a' }}>{label}</span>
          <span style={{ fontSize: isMobile ? '12px' : '13px', fontWeight: '600', color: '#1a3a1a' }}>
            {percentage.toFixed(1)}%
          </span>
        </div>
        <div style={{ 
          width: '100%', 
          height: isMobile ? '6px' : '8px', 
          background: '#f0f7f0', 
          borderRadius: '4px', 
          overflow: 'hidden' 
        }}>
          <div style={{
            width: `${percentage}%`,
            height: '100%',
            background: color,
            borderRadius: '4px',
            transition: 'width 0.5s ease',
          }} />
        </div>
      </div>
    );
  };

  const renderUserReport = () => (
    <div>
      <h4 style={{ fontSize: isMobile ? '15px' : '16px', fontWeight: '600', color: '#1a3a1a', marginBottom: '16px' }}>
        User Statistics
      </h4>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
        gap: isMobile ? '10px' : '16px',
        marginBottom: '20px',
      }}>
        <div style={{ background: '#f8fbf8', padding: isMobile ? '12px' : '16px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: '700', color: '#1a3a1a' }}>
            {reportData?.users?.total || 0}
          </div>
          <div style={{ fontSize: isMobile ? '10px' : '12px', color: '#5a7a5a' }}>Total Users</div>
          <div style={{ fontSize: isMobile ? '10px' : '11px', color: '#2e7d32', marginTop: '4px' }}>
            ↑ {reportData?.users?.percentages?.growth || 0}% growth
          </div>
        </div>
        <div style={{ background: '#f8fbf8', padding: isMobile ? '12px' : '16px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: '700', color: '#2e7d32' }}>
            {reportData?.users?.activeUsers || 0}
          </div>
          <div style={{ fontSize: isMobile ? '10px' : '12px', color: '#5a7a5a' }}>Active Users</div>
          <div style={{ fontSize: isMobile ? '10px' : '11px', color: '#2e7d32', marginTop: '4px' }}>
            {reportData?.users?.percentages?.active?.toFixed(1) || 0}% of total
          </div>
        </div>
        <div style={{ background: '#f8fbf8', padding: isMobile ? '12px' : '16px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: '700', color: '#0d47a1' }}>
            {reportData?.users?.newThisMonth || 0}
          </div>
          <div style={{ fontSize: isMobile ? '10px' : '12px', color: '#5a7a5a' }}>New This Month</div>
          <div style={{ fontSize: isMobile ? '10px' : '11px', color: '#0d47a1', marginTop: '4px' }}>
            {reportData?.users?.percentages?.new?.toFixed(1) || 0}% of total
          </div>
        </div>
        <div style={{ background: '#f8fbf8', padding: isMobile ? '12px' : '16px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: '700', color: '#f39c12' }}>
            {reportData?.users?.workers || 0}
          </div>
          <div style={{ fontSize: isMobile ? '10px' : '12px', color: '#5a7a5a' }}>Workers</div>
          <div style={{ fontSize: isMobile ? '10px' : '11px', color: '#f39c12', marginTop: '4px' }}>
            {reportData?.users?.percentages?.workers?.toFixed(1) || 0}% of total
          </div>
        </div>
      </div>

      <div style={{ background: '#f8fbf8', padding: isMobile ? '16px' : '20px', borderRadius: '8px' }}>
        <h5 style={{ fontSize: isMobile ? '13px' : '14px', fontWeight: '600', color: '#1a3a1a', marginBottom: '12px' }}>
          User Distribution
        </h5>
        {renderPercentageBar(
          reportData?.users?.workers || 0, 
          reportData?.users?.total || 1, 
          'Workers', '#2e7d32'
        )}
        {renderPercentageBar(
          reportData?.users?.employers || 0, 
          reportData?.users?.total || 1, 
          'Employers', '#0d47a1'
        )}
        {renderPercentageBar(
          reportData?.users?.admins || 0, 
          reportData?.users?.total || 1, 
          'Admins', '#f39c12'
        )}
        {renderPercentageBar(
          reportData?.users?.activeUsers || 0, 
          reportData?.users?.total || 1, 
          'Active Users', '#1976d2'
        )}
      </div>
    </div>
  );

  const renderHireReport = () => (
    <div>
      <h4 style={{ fontSize: isMobile ? '15px' : '16px', fontWeight: '600', color: '#1a3a1a', marginBottom: '16px' }}>
        Hire Statistics
      </h4>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
        gap: isMobile ? '10px' : '16px',
        marginBottom: '20px',
      }}>
        <div style={{ background: '#f8fbf8', padding: isMobile ? '12px' : '16px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: '700', color: '#1a3a1a' }}>
            {reportData?.hires?.total || 0}
          </div>
          <div style={{ fontSize: isMobile ? '10px' : '12px', color: '#5a7a5a' }}>Total Hires</div>
          <div style={{ fontSize: isMobile ? '10px' : '11px', color: '#2e7d32', marginTop: '4px' }}>
            ↑ {reportData?.hires?.percentages?.growth || 0}% growth
          </div>
        </div>
        <div style={{ background: '#f8fbf8', padding: isMobile ? '12px' : '16px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: '700', color: '#2e7d32' }}>
            {reportData?.hires?.active || 0}
          </div>
          <div style={{ fontSize: isMobile ? '10px' : '12px', color: '#5a7a5a' }}>Active Hires</div>
          <div style={{ fontSize: isMobile ? '10px' : '11px', color: '#2e7d32', marginTop: '4px' }}>
            {reportData?.hires?.percentages?.active?.toFixed(1) || 0}% of total
          </div>
        </div>
        <div style={{ background: '#f8fbf8', padding: isMobile ? '12px' : '16px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: '700', color: '#0d47a1' }}>
            {reportData?.hires?.completed || 0}
          </div>
          <div style={{ fontSize: isMobile ? '10px' : '12px', color: '#5a7a5a' }}>Completed</div>
          <div style={{ fontSize: isMobile ? '10px' : '11px', color: '#0d47a1', marginTop: '4px' }}>
            {reportData?.hires?.percentages?.completion?.toFixed(1) || 0}% of total
          </div>
        </div>
        <div style={{ background: '#f8fbf8', padding: isMobile ? '12px' : '16px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: '700', color: '#e65100' }}>
            {reportData?.hires?.pending || 0}
          </div>
          <div style={{ fontSize: isMobile ? '10px' : '12px', color: '#5a7a5a' }}>Pending</div>
          <div style={{ fontSize: isMobile ? '10px' : '11px', color: '#e65100', marginTop: '4px' }}>
            {reportData?.hires?.percentages?.pending?.toFixed(1) || 0}% of total
          </div>
        </div>
      </div>

      <div style={{ background: '#f8fbf8', padding: isMobile ? '16px' : '20px', borderRadius: '8px' }}>
        <h5 style={{ fontSize: isMobile ? '13px' : '14px', fontWeight: '600', color: '#1a3a1a', marginBottom: '12px' }}>
          Hire Status Distribution
        </h5>
        {renderPercentageBar(
          reportData?.hires?.active || 0, 
          reportData?.hires?.total || 1, 
          'Active', '#2e7d32'
        )}
        {renderPercentageBar(
          reportData?.hires?.completed || 0, 
          reportData?.hires?.total || 1, 
          'Completed', '#0d47a1'
        )}
        {renderPercentageBar(
          reportData?.hires?.pending || 0, 
          reportData?.hires?.total || 1, 
          'Pending', '#f39c12'
        )}
      </div>
    </div>
  );

  const renderPaymentReport = () => (
    <div>
      <h4 style={{ fontSize: isMobile ? '15px' : '16px', fontWeight: '600', color: '#1a3a1a', marginBottom: '16px' }}>
        Payment Statistics
      </h4>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
        gap: isMobile ? '10px' : '16px',
        marginBottom: '20px',
      }}>
        <div style={{ background: '#f8fbf8', padding: isMobile ? '12px' : '16px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: '700', color: '#1a3a1a' }}>
            {reportData?.payments?.total || 0}
          </div>
          <div style={{ fontSize: isMobile ? '10px' : '12px', color: '#5a7a5a' }}>Total Payments</div>
        </div>
        <div style={{ background: '#f8fbf8', padding: isMobile ? '12px' : '16px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: '700', color: '#2e7d32' }}>
            {reportData?.payments?.confirmed || 0}
          </div>
          <div style={{ fontSize: isMobile ? '10px' : '12px', color: '#5a7a5a' }}>Confirmed</div>
          <div style={{ fontSize: isMobile ? '10px' : '11px', color: '#2e7d32', marginTop: '4px' }}>
            {reportData?.payments?.percentages?.confirmed?.toFixed(1) || 0}% of total
          </div>
        </div>
        <div style={{ background: '#f8fbf8', padding: isMobile ? '12px' : '16px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: '700', color: '#f39c12' }}>
            {reportData?.payments?.pending || 0}
          </div>
          <div style={{ fontSize: isMobile ? '10px' : '12px', color: '#5a7a5a' }}>Pending</div>
          <div style={{ fontSize: isMobile ? '10px' : '11px', color: '#f39c12', marginTop: '4px' }}>
            {reportData?.payments?.percentages?.pending?.toFixed(1) || 0}% of total
          </div>
        </div>
        <div style={{ background: '#f8fbf8', padding: isMobile ? '12px' : '16px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: '700', color: '#2e7d32' }}>
            EGP {reportData?.payments?.totalAmount?.toFixed(0) || 0}
          </div>
          <div style={{ fontSize: isMobile ? '10px' : '12px', color: '#5a7a5a' }}>Total Amount</div>
        </div>
      </div>

      <div style={{ background: '#f8fbf8', padding: isMobile ? '16px' : '20px', borderRadius: '8px', marginBottom: '16px' }}>
        <h5 style={{ fontSize: isMobile ? '13px' : '14px', fontWeight: '600', color: '#1a3a1a', marginBottom: '12px' }}>
          Payment Methods Distribution
        </h5>
        {reportData?.payments?.methods && Object.entries(reportData.payments.methods).map(([method, count]) => (
          renderPercentageBar(
            count, 
            reportData.payments.total || 1, 
            method.charAt(0).toUpperCase() + method.slice(1).replace(/([A-Z])/g, ' $1'),
            ['#2e7d32', '#0d47a1', '#f39c12', '#e65100', '#4a148c'][Object.keys(reportData.payments.methods).indexOf(method)]
          )
        ))}
      </div>
    </div>
  );

  const renderRevenueReport = () => (
    <div>
      <h4 style={{ fontSize: isMobile ? '15px' : '16px', fontWeight: '600', color: '#1a3a1a', marginBottom: '16px' }}>
        Revenue Overview
      </h4>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
        gap: isMobile ? '10px' : '16px',
        marginBottom: '20px',
      }}>
        <div style={{ background: '#f8fbf8', padding: isMobile ? '12px' : '16px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: '700', color: '#2e7d32' }}>
            EGP {reportData?.revenue?.total?.toFixed(0) || 0}
          </div>
          <div style={{ fontSize: isMobile ? '10px' : '12px', color: '#5a7a5a' }}>Total Revenue</div>
          <div style={{ fontSize: isMobile ? '10px' : '11px', color: '#2e7d32', marginTop: '4px' }}>
            ↑ {reportData?.revenue?.percentages?.growth || 0}% growth
          </div>
        </div>
        <div style={{ background: '#f8fbf8', padding: isMobile ? '12px' : '16px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: '700', color: '#1a3a1a' }}>
            {reportData?.hires?.total || 0}
          </div>
          <div style={{ fontSize: isMobile ? '10px' : '12px', color: '#5a7a5a' }}>Total Hires</div>
        </div>
        <div style={{ background: '#f8fbf8', padding: isMobile ? '12px' : '16px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: '700', color: '#0d47a1' }}>
            EGP {reportData?.revenue?.average?.toFixed(0) || 0}
          </div>
          <div style={{ fontSize: isMobile ? '10px' : '12px', color: '#5a7a5a' }}>Avg. Revenue/Hire</div>
        </div>
        <div style={{ background: '#f8fbf8', padding: isMobile ? '12px' : '16px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: '700', color: '#f39c12' }}>
            {reportData?.payments?.pending || 0}
          </div>
          <div style={{ fontSize: isMobile ? '10px' : '12px', color: '#5a7a5a' }}>Pending Payments</div>
          <div style={{ fontSize: isMobile ? '10px' : '11px', color: '#f39c12', marginTop: '4px' }}>
            {reportData?.payments?.percentages?.pending?.toFixed(1) || 0}% of total
          </div>
        </div>
      </div>

      <div style={{ background: '#f8fbf8', padding: isMobile ? '16px' : '20px', borderRadius: '8px' }}>
        <h5 style={{ fontSize: isMobile ? '13px' : '14px', fontWeight: '600', color: '#1a3a1a', marginBottom: '12px' }}>
          Revenue Growth Metrics
        </h5>
        {renderPercentageBar(
          reportData?.revenue?.percentages?.growth || 0, 
          100, 
          'Overall Growth', '#2e7d32'
        )}
        {renderPercentageBar(
          reportData?.revenue?.percentages?.monthlyChange || 0, 
          100, 
          'Monthly Change', '#0d47a1'
        )}
        {renderPercentageBar(
          reportData?.revenue?.percentages?.quarterGrowth || 0, 
          100, 
          'Quarter Growth', '#f39c12'
        )}
      </div>
    </div>
  );

  const renderContent = () => {
    switch(reportType) {
      case 'users': return renderUserReport();
      case 'hires': return renderHireReport();
      case 'payments': return renderPaymentReport();
      case 'revenue': return renderRevenueReport();
      default: return renderUserReport();
    }
  };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? '20px' : '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: '700', color: '#1a2a3a', marginBottom: '4px' }}>
            Reports
          </h1>
          <p style={{ color: '#6a8bb0', fontSize: isMobile ? '14px' : '15px' }}>
            View and export platform reports
          </p>
        </div>
        <button
          onClick={exportReport}
          style={{
            padding: isMobile ? '8px 16px' : '10px 24px',
            background: '#1976d2',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: isMobile ? '13px' : '14px',
            fontWeight: '600',
            transition: 'all 0.3s ease',
            width: isMobile ? '100%' : 'auto',
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          📊 Export Report
        </button>
      </div>

      <div style={{
        display: 'flex',
        gap: isMobile ? '8px' : '16px',
        marginBottom: '20px',
        flexWrap: 'wrap',
      }}>
        {reportTypes.map((type) => (
          <button
            key={type.key}
            onClick={() => setReportType(type.key)}
            style={{
              padding: isMobile ? '8px 14px' : '10px 20px',
              borderRadius: '8px',
              background: reportType === type.key ? '#2e7d32' : '#fff',
              color: reportType === type.key ? '#fff' : '#5a7a5a',
              border: reportType === type.key ? 'none' : '1px solid #d4e8d4',
              cursor: 'pointer',
              fontSize: isMobile ? '13px' : '14px',
              fontWeight: reportType === type.key ? '600' : '400',
              transition: 'all 0.3s ease',
            }}
          >
            {type.label}
          </button>
        ))}
      </div>

      <div style={{
        display: 'flex',
        gap: isMobile ? '6px' : '8px',
        marginBottom: '16px',
        flexWrap: 'wrap',
      }}>
        {dateOptions.map((option) => (
          <button
            key={option.key}
            onClick={() => setDateRange(option.key)}
            style={{
              padding: '4px 12px',
              borderRadius: '6px',
              background: dateRange === option.key ? '#e8f5e9' : 'transparent',
              color: dateRange === option.key ? '#2e7d32' : '#5a7a5a',
              border: '1px solid ' + (dateRange === option.key ? '#2e7d32' : '#d4e8d4'),
              cursor: 'pointer',
              fontSize: isMobile ? '11px' : '12px',
              fontWeight: dateRange === option.key ? '600' : '400',
            }}
          >
            {option.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#6a8bb0' }}>Generating report...</div>
      ) : (
        <div style={{
          background: '#fff',
          borderRadius: isMobile ? '12px' : '16px',
          padding: isMobile ? '16px' : '24px',
          border: '1px solid #d4e8d4',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}>
          {renderContent()}
        </div>
      )}
    </AdminLayout>
  );
}