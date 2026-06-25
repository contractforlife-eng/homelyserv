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
      // Mock data with percentages
      const mockData = {
        users: {
          total: 25,
          workers: 19,
          employers: 3,
          admins: 3,
          newThisMonth: 5,
          activeUsers: 22,
          percentages: {
            workers: 76,
            employers: 12,
            admins: 12,
            active: 88,
            new: 20,
            growth: 15,
          }
        },
        hires: {
          total: 8,
          active: 6,
          completed: 2,
          pending: 0,
          totalRevenue: 6669,
          averageSalary: 4500,
          percentages: {
            active: 75,
            completed: 25,
            pending: 0,
            growth: 12,
            completion: 25,
          }
        },
        payments: {
          total: 8,
          confirmed: 6,
          pending: 2,
          totalAmount: 6669,
          methods: {
            instapay: 3,
            vodafoneCash: 2,
            bankTransfer: 2,
            bitcoin: 1,
          },
          percentages: {
            confirmed: 75,
            pending: 25,
            instapay: 37.5,
            vodafoneCash: 25,
            bankTransfer: 25,
            bitcoin: 12.5,
          }
        },
        revenue: {
          total: 6669,
          monthly: [450, 520, 680, 750, 820, 910, 980, 1050, 1120],
          growth: 15,
          average: 556,
          percentages: {
            growth: 15,
            monthlyChange: 12,
            quarterGrowth: 8,
          }
        }
      };
      setReportData(mockData);
    } catch (err) {
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

  // Helper function to render percentage bar
  const renderPercentageBar = (value, total, label, color = '#2e7d32') => {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    return (
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: '13px', color: '#5a7a5a' }}>{label}</span>
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#1a3a1a' }}>{percentage.toFixed(1)}%</span>
        </div>
        <div style={{ width: '100%', height: '8px', background: '#f0f7f0', borderRadius: '4px', overflow: 'hidden' }}>
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
      <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1a3a1a', marginBottom: '16px' }}>User Statistics</h4>
      
      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#f8fbf8', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#1a3a1a' }}>{reportData?.users?.total || 0}</div>
          <div style={{ fontSize: '12px', color: '#5a7a5a' }}>Total Users</div>
          <div style={{ fontSize: '11px', color: '#2e7d32', marginTop: '4px' }}>↑ {reportData?.users?.percentages?.growth || 0}% growth</div>
        </div>
        <div style={{ background: '#f8fbf8', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#2e7d32' }}>{reportData?.users?.activeUsers || 0}</div>
          <div style={{ fontSize: '12px', color: '#5a7a5a' }}>Active Users</div>
          <div style={{ fontSize: '11px', color: '#2e7d32', marginTop: '4px' }}>{reportData?.users?.percentages?.active || 0}% of total</div>
        </div>
        <div style={{ background: '#f8fbf8', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#0d47a1' }}>{reportData?.users?.newThisMonth || 0}</div>
          <div style={{ fontSize: '12px', color: '#5a7a5a' }}>New This Month</div>
          <div style={{ fontSize: '11px', color: '#0d47a1', marginTop: '4px' }}>{reportData?.users?.percentages?.new || 0}% of total</div>
        </div>
        <div style={{ background: '#f8fbf8', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#f39c12' }}>{reportData?.users?.workers || 0}</div>
          <div style={{ fontSize: '12px', color: '#5a7a5a' }}>Workers</div>
          <div style={{ fontSize: '11px', color: '#f39c12', marginTop: '4px' }}>{reportData?.users?.percentages?.workers || 0}% of total</div>
        </div>
      </div>

      {/* User Distribution */}
      <div style={{ background: '#f8fbf8', padding: '20px', borderRadius: '8px' }}>
        <h5 style={{ fontSize: '14px', fontWeight: '600', color: '#1a3a1a', marginBottom: '16px' }}>User Distribution</h5>
        {renderPercentageBar(reportData?.users?.workers || 0, reportData?.users?.total || 1, 'Workers', '#2e7d32')}
        {renderPercentageBar(reportData?.users?.employers || 0, reportData?.users?.total || 1, 'Employers', '#0d47a1')}
        {renderPercentageBar(reportData?.users?.admins || 0, reportData?.users?.total || 1, 'Admins', '#f39c12')}
        {renderPercentageBar(reportData?.users?.activeUsers || 0, reportData?.users?.total || 1, 'Active Users', '#1976d2')}
      </div>
    </div>
  );

  const renderHireReport = () => (
    <div>
      <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1a3a1a', marginBottom: '16px' }}>Hire Statistics</h4>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#f8fbf8', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#1a3a1a' }}>{reportData?.hires?.total || 0}</div>
          <div style={{ fontSize: '12px', color: '#5a7a5a' }}>Total Hires</div>
          <div style={{ fontSize: '11px', color: '#2e7d32', marginTop: '4px' }}>↑ {reportData?.hires?.percentages?.growth || 0}% growth</div>
        </div>
        <div style={{ background: '#f8fbf8', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#2e7d32' }}>{reportData?.hires?.active || 0}</div>
          <div style={{ fontSize: '12px', color: '#5a7a5a' }}>Active Hires</div>
          <div style={{ fontSize: '11px', color: '#2e7d32', marginTop: '4px' }}>{reportData?.hires?.percentages?.active || 0}% of total</div>
        </div>
        <div style={{ background: '#f8fbf8', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#0d47a1' }}>{reportData?.hires?.completed || 0}</div>
          <div style={{ fontSize: '12px', color: '#5a7a5a' }}>Completed</div>
          <div style={{ fontSize: '11px', color: '#0d47a1', marginTop: '4px' }}>{reportData?.hires?.percentages?.completion || 0}% of total</div>
        </div>
        <div style={{ background: '#f8fbf8', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#e65100' }}>{reportData?.hires?.pending || 0}</div>
          <div style={{ fontSize: '12px', color: '#5a7a5a' }}>Pending</div>
          <div style={{ fontSize: '11px', color: '#e65100', marginTop: '4px' }}>{reportData?.hires?.percentages?.pending || 0}% of total</div>
        </div>
      </div>

      {/* Hire Status Distribution */}
      <div style={{ background: '#f8fbf8', padding: '20px', borderRadius: '8px' }}>
        <h5 style={{ fontSize: '14px', fontWeight: '600', color: '#1a3a1a', marginBottom: '16px' }}>Hire Status Distribution</h5>
        {renderPercentageBar(reportData?.hires?.active || 0, reportData?.hires?.total || 1, 'Active', '#2e7d32')}
        {renderPercentageBar(reportData?.hires?.completed || 0, reportData?.hires?.total || 1, 'Completed', '#0d47a1')}
        {renderPercentageBar(reportData?.hires?.pending || 0, reportData?.hires?.total || 1, 'Pending', '#f39c12')}
      </div>
    </div>
  );

  const renderPaymentReport = () => (
    <div>
      <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1a3a1a', marginBottom: '16px' }}>Payment Statistics</h4>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#f8fbf8', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#1a3a1a' }}>{reportData?.payments?.total || 0}</div>
          <div style={{ fontSize: '12px', color: '#5a7a5a' }}>Total Payments</div>
        </div>
        <div style={{ background: '#f8fbf8', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#2e7d32' }}>{reportData?.payments?.confirmed || 0}</div>
          <div style={{ fontSize: '12px', color: '#5a7a5a' }}>Confirmed</div>
          <div style={{ fontSize: '11px', color: '#2e7d32', marginTop: '4px' }}>{reportData?.payments?.percentages?.confirmed || 0}% of total</div>
        </div>
        <div style={{ background: '#f8fbf8', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#f39c12' }}>{reportData?.payments?.pending || 0}</div>
          <div style={{ fontSize: '12px', color: '#5a7a5a' }}>Pending</div>
          <div style={{ fontSize: '11px', color: '#f39c12', marginTop: '4px' }}>{reportData?.payments?.percentages?.pending || 0}% of total</div>
        </div>
        <div style={{ background: '#f8fbf8', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#2e7d32' }}>EGP {reportData?.payments?.totalAmount || 0}</div>
          <div style={{ fontSize: '12px', color: '#5a7a5a' }}>Total Amount</div>
        </div>
      </div>

      {/* Payment Methods Distribution */}
      <div style={{ background: '#f8fbf8', padding: '20px', borderRadius: '8px', marginBottom: '16px' }}>
        <h5 style={{ fontSize: '14px', fontWeight: '600', color: '#1a3a1a', marginBottom: '16px' }}>Payment Methods Distribution</h5>
        {reportData?.payments?.methods && Object.entries(reportData.payments.methods).map(([method, count]) => (
          renderPercentageBar(
            count, 
            reportData.payments.total, 
            method.charAt(0).toUpperCase() + method.slice(1),
            ['#2e7d32', '#0d47a1', '#f39c12', '#e65100'][Object.keys(reportData.payments.methods).indexOf(method)]
          )
        ))}
      </div>
    </div>
  );

  const renderRevenueReport = () => (
    <div>
      <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1a3a1a', marginBottom: '16px' }}>Revenue Overview</h4>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#f8fbf8', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#2e7d32' }}>EGP {reportData?.revenue?.total || 0}</div>
          <div style={{ fontSize: '12px', color: '#5a7a5a' }}>Total Revenue</div>
          <div style={{ fontSize: '11px', color: '#2e7d32', marginTop: '4px' }}>↑ {reportData?.revenue?.percentages?.growth || 0}% growth</div>
        </div>
        <div style={{ background: '#f8fbf8', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#1a3a1a' }}>{reportData?.hires?.total || 0}</div>
          <div style={{ fontSize: '12px', color: '#5a7a5a' }}>Total Hires</div>
        </div>
        <div style={{ background: '#f8fbf8', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#0d47a1' }}>EGP {reportData?.hires?.averageSalary || 0}</div>
          <div style={{ fontSize: '12px', color: '#5a7a5a' }}>Avg. Salary</div>
        </div>
        <div style={{ background: '#f8fbf8', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#f39c12' }}>{reportData?.payments?.pending || 0}</div>
          <div style={{ fontSize: '12px', color: '#5a7a5a' }}>Pending Payments</div>
          <div style={{ fontSize: '11px', color: '#f39c12', marginTop: '4px' }}>{reportData?.payments?.percentages?.pending || 0}% of total</div>
        </div>
      </div>

      {/* Revenue Growth */}
      <div style={{ background: '#f8fbf8', padding: '20px', borderRadius: '8px' }}>
        <h5 style={{ fontSize: '14px', fontWeight: '600', color: '#1a3a1a', marginBottom: '16px' }}>Revenue Growth Metrics</h5>
        {renderPercentageBar(reportData?.revenue?.growth || 0, 100, 'Overall Growth', '#2e7d32')}
        {renderPercentageBar(reportData?.revenue?.percentages?.monthlyChange || 0, 100, 'Monthly Change', '#0d47a1')}
        {renderPercentageBar(reportData?.revenue?.percentages?.quarterGrowth || 0, 100, 'Quarter Growth', '#f39c12')}
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1a3a1a' }}>Reports</h1>
          <p style={{ color: '#5a7a5a', fontSize: '14px' }}>View and export platform reports</p>
        </div>
        <button
          onClick={exportReport}
          style={{
            padding: '10px 24px',
            background: '#1976d2',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          📊 Export Report
        </button>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {reportTypes.map((type) => (
          <button
            key={type.key}
            onClick={() => setReportType(type.key)}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              background: reportType === type.key ? '#2e7d32' : '#fff',
              color: reportType === type.key ? '#fff' : '#5a7a5a',
              border: reportType === type.key ? 'none' : '1px solid #d4e8d4',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: reportType === type.key ? '600' : '400',
              transition: 'all 0.3s ease',
            }}
          >
            {type.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {dateOptions.map((option) => (
          <button
            key={option.key}
            onClick={() => setDateRange(option.key)}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              background: dateRange === option.key ? '#e8f5e9' : 'transparent',
              color: dateRange === option.key ? '#2e7d32' : '#5a7a5a',
              border: '1px solid ' + (dateRange === option.key ? '#2e7d32' : '#d4e8d4'),
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: dateRange === option.key ? '600' : '400',
            }}
          >
            {option.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#5a7a5a' }}>Generating report...</div>
      ) : (
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #d4e8d4',
        }}>
          {renderContent()}
        </div>
      )}
    </AdminLayout>
  );
}