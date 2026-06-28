import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  BarChart3, PieChart, LineChart, TrendingUp, TrendingDown,
  Download, Printer, RefreshCw, ArrowLeft, Calendar,
  Users, Briefcase, DollarSign, Star, Clock, CheckCircle,
  XCircle, AlertCircle, FileText, Mail, Phone,
  Eye, Edit, Trash2, Filter, Search, ChevronDown,
  ChevronUp, Award, Shield, Building, MapPin,
  Activity, Zap, Target, Flag, Globe, Settings
} from 'lucide-react';

function AdminReports() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('month');
  const [chartType, setChartType] = useState('bar');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      if (parsed.role !== 'ADMIN') {
        navigate('/dashboard');
      }
    } else {
      navigate('/login');
    }
    setLoading(false);
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
      </div>
    );
  }

  // Report data
  const overviewStats = {
    totalUsers: 25680,
    totalWorkers: 8432,
    totalEmployers: 1234,
    totalHires: 895,
    totalRevenue: 48650,
    totalComplaints: 127,
    activeUsers: 2845,
    completionRate: 78,
    growthRate: 12.5
  };

  const monthlyData = [
    { month: 'Jan', users: 1200, hires: 45, revenue: 3200 },
    { month: 'Feb', users: 1340, hires: 52, revenue: 3800 },
    { month: 'Mar', users: 1500, hires: 58, revenue: 4200 },
    { month: 'Apr', users: 1680, hires: 63, revenue: 4800 },
    { month: 'May', users: 1850, hires: 72, revenue: 5400 },
    { month: 'Jun', users: 2100, hires: 85, revenue: 6200 }
  ];

  const categoryData = [
    { name: 'Nanny', value: 1256, percentage: 39 },
    { name: 'Elderly Care', value: 842, percentage: 26 },
    { name: 'Drivers', value: 612, percentage: 19 },
    { name: 'Security', value: 285, percentage: 9 },
    { name: 'Housekeeping', value: 220, percentage: 7 }
  ];

  const recentReports = [
    { id: 1, title: 'Monthly Revenue Report', date: '2026-06-20', status: 'completed', type: 'revenue' },
    { id: 2, title: 'User Growth Report', date: '2026-06-18', status: 'pending', type: 'users' },
    { id: 3, title: 'Worker Performance Report', date: '2026-06-15', status: 'completed', type: 'workers' },
    { id: 4, title: 'Commission Report', date: '2026-06-12', status: 'completed', type: 'commission' }
  ];

  const getStatusBadge = (status) => {
    switch(status) {
      case 'completed':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Completed</span>;
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Pending</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="text-gray-600 hover:text-red-600 transition">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">Reports & Analytics</h1>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-sm"
            >
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="quarter">Last 90 Days</option>
              <option value="year">Last Year</option>
            </select>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2 text-sm">
              <Download size={16} /> Export
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2 text-sm">
              <Printer size={16} /> Print
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2 text-sm">
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {['overview', 'users', 'hires', 'revenue', 'performance', 'reports'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium transition capitalize ${
                activeTab === tab 
                  ? 'text-red-600 border-b-2 border-red-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Users</p>
                    <p className="text-2xl font-bold text-gray-800">{overviewStats.totalUsers.toLocaleString()}</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Users size={20} className="text-blue-600" />
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-1 text-xs">
                  <TrendingUp size={14} className="text-green-500" />
                  <span className="text-green-500">+{overviewStats.growthRate}%</span>
                  <span className="text-gray-400">vs last month</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Workers</p>
                    <p className="text-2xl font-bold text-gray-800">{overviewStats.totalWorkers.toLocaleString()}</p>
                  </div>
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                    <Briefcase size={20} className="text-green-600" />
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-1 text-xs">
                  <TrendingUp size={14} className="text-green-500" />
                  <span className="text-green-500">+8%</span>
                  <span className="text-gray-400">vs last month</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-800">${overviewStats.totalRevenue.toLocaleString()}</p>
                  </div>
                  <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                    <DollarSign size={20} className="text-red-600" />
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-1 text-xs">
                  <TrendingUp size={14} className="text-green-500" />
                  <span className="text-green-500">+18%</span>
                  <span className="text-gray-400">vs last month</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Completion Rate</p>
                    <p className="text-2xl font-bold text-gray-800">{overviewStats.completionRate}%</p>
                  </div>
                  <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                    <Award size={20} className="text-purple-600" />
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-1 text-xs">
                  <TrendingUp size={14} className="text-green-500" />
                  <span className="text-green-500">+5%</span>
                  <span className="text-gray-400">vs last month</span>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-800">Monthly Growth</h3>
                  <button 
                    onClick={() => setChartType(chartType === 'bar' ? 'line' : 'bar')}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Switch to {chartType === 'bar' ? 'Line' : 'Bar'} Chart
                  </button>
                </div>
                <div className="h-64 flex items-end justify-between gap-2">
                  {monthlyData.map((item, i) => (
                    <div key={i} className="flex flex-col items-center flex-1">
                      <div 
                        className={`${chartType === 'bar' ? 'w-full' : 'w-1'} bg-red-600 rounded-t transition-all duration-500`}
                        style={{ height: `${(item.users / 2500) * 100}%` }}
                      ></div>
                      <span className="text-xs text-gray-500 mt-2">{item.month}</span>
                      <span className="text-xs text-gray-400">{item.users}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Category Distribution</h3>
                <div className="space-y-3">
                  {categoryData.map((cat, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{cat.name}</span>
                        <span className="font-medium">{cat.value} ({cat.percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className={`h-2 rounded-full ${
                            i === 0 ? 'bg-red-600' : 
                            i === 1 ? 'bg-blue-600' : 
                            i === 2 ? 'bg-green-600' : 
                            i === 3 ? 'bg-purple-600' : 'bg-yellow-600'
                          }`}
                          style={{ width: `${cat.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Reports */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Recent Reports</h3>
              <div className="space-y-3">
                {recentReports.map((report) => (
                  <div key={report.id} className="flex justify-between items-center border-b border-gray-100 pb-3">
                    <div>
                      <p className="font-medium text-gray-800">{report.title}</p>
                      <p className="text-sm text-gray-500">{report.date}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(report.status)}
                      <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                        <Eye size={16} />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded">
                        <Download size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">User Analytics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">New Users (This Month)</p>
                <p className="text-2xl font-bold text-blue-600">2,100</p>
                <p className="text-xs text-green-600">+15% from last month</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Active Users</p>
                <p className="text-2xl font-bold text-green-600">{overviewStats.activeUsers.toLocaleString()}</p>
                <p className="text-xs text-green-600">+8% from last month</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">User Retention Rate</p>
                <p className="text-2xl font-bold text-purple-600">72%</p>
                <p className="text-xs text-green-600">+5% from last month</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Month</th>
                    <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">New Users</th>
                    <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Active Users</th>
                    <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Growth</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map((item, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-3 font-medium text-gray-800">{item.month}</td>
                      <td className="py-3 text-gray-600">{item.users}</td>
                      <td className="py-3 text-gray-600">{Math.round(item.users * 0.65)}</td>
                      <td className="py-3 text-green-600">+{Math.round((item.users / 1200 - 1) * 100)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'revenue' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Revenue Analytics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-red-600">${overviewStats.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Commission Earned</p>
                <p className="text-2xl font-bold text-orange-600">${Math.round(overviewStats.totalRevenue * 0.065).toLocaleString()}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Average Per Hire</p>
                <p className="text-2xl font-bold text-blue-600">$54</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Month</th>
                    <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Revenue</th>
                    <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Commission</th>
                    <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Growth</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map((item, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-3 font-medium text-gray-800">{item.month}</td>
                      <td className="py-3 text-gray-600">${item.revenue}</td>
                      <td className="py-3 text-gray-600">${Math.round(item.revenue * 0.065)}</td>
                      <td className="py-3 text-green-600">+{Math.round((item.revenue / 3200 - 1) * 100)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Generate Report</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500">
                  <option>Revenue Report</option>
                  <option>User Report</option>
                  <option>Worker Report</option>
                  <option>Hire Report</option>
                  <option>Commission Report</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500">
                  <option>PDF</option>
                  <option>Excel</option>
                  <option>CSV</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input type="date" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input type="date" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" />
              </div>
            </div>
            <button className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2">
              <FileText size={18} /> Generate Report
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminReports;
