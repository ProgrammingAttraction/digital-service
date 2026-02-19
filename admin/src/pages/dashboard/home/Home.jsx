import React, { useState, useEffect } from 'react';
import { 
  FaUsers, 
  FaMoneyBill, 
  FaShoppingCart, 
  FaChartLine, 
  FaExchangeAlt,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaDollarSign,
  FaUserPlus,
  FaFileAlt,
  FaCreditCard,
  FaTachometerAlt,
  FaCalendarAlt,
  FaArrowUp,
  FaArrowDown,
  FaFilter,
  FaDownload,
  FaSearch,
  FaEye,
  FaEdit,
  FaSync,
  FaDatabase,
  FaChartBar,
  FaUserCheck,
  FaReceipt,
  FaCog,
  FaBell,
  FaChevronRight
} from 'react-icons/fa';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import toast, { Toaster } from 'react-hot-toast';
import { FaBangladeshiTakaSign } from "react-icons/fa6";
import { useDashboard } from '../../../context/DashboardContext';
import { GiWallet, GiNetworkBars } from "react-icons/gi";
import { MdWallet, MdShowChart, MdTrendingUp, MdBarChart, MdOutlineInsights } from 'react-icons/md';
import { TbReportAnalytics, TbArrowWaveRightUp, TbArrowWaveRightDown } from 'react-icons/tb';
import { IoIosSpeedometer, IoIosStats } from 'react-icons/io';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Home = () => {
  const { 
    dashboardData, 
    usersHistory, 
    ordersHistory, 
    depositsHistory,
    refreshDashboard,
    fetchWithDateFilter,
    fetchHistoryData
  } = useDashboard();
  
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('today');
  const [dateFilter, setDateFilter] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [showCustomFilter, setShowCustomFilter] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [serviceStats, setServiceStats] = useState([]);
  const [loadingServiceStats, setLoadingServiceStats] = useState(false);
  
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;

  // Define the sign copy services to group together
  const signCopyServices = [
    'সাইন কপি (Voter Number)',
    'সাইন কপি (Birth Number)',
    'সাইন কপি (FORM No)',
    'সাইন কপি (NID No)'
  ];

  // Service icons mapping
  const getServiceIcon = (serviceName) => {
    const name = serviceName?.toLowerCase() || '';
    
    if (signCopyServices.some(service => serviceName?.includes(service)) || serviceName === 'সাইন কপি (All Types)') {
      return <FaFileAlt className="text-xl" />;
    } else if (name.includes('কল') || name.includes('call')) {
      return <FaExchangeAlt className="text-xl" />;
    } else if (name.includes('বায়োমেট্রিক') || name.includes('biometric')) {
      return <FaUserCheck className="text-xl" />;
    } else if (name.includes('এনআইডি') || name.includes('nid')) {
      return <FaCreditCard className="text-xl" />;
    } else if (name.includes('recharge') || name.includes('রিচার্জ')) {
      return <FaMoneyBill className="text-xl" />;
    } else if (name.includes('notification') || name.includes('নোটিফিকেশন')) {
      return <FaBell className="text-xl" />;
    } else {
      return <FaShoppingCart className="text-xl" />;
    }
  };

  // Service color mapping
  const getServiceColor = (index) => {
    const colors = [
      'from-indigo-500 via-indigo-600 to-blue-500',
      'from-emerald-500 via-emerald-600 to-teal-500',
      'from-violet-500 via-violet-600 to-purple-500',
      'from-orange-500 via-orange-600 to-amber-500',
      'from-rose-500 via-rose-600 to-pink-500',
      'from-cyan-500 via-cyan-600 to-sky-500',
      'from-lime-500 via-lime-600 to-green-500',
      'from-fuchsia-500 via-fuchsia-600 to-purple-500'
    ];
    return colors[index % colors.length];
  };

  // Handle service box click
  const handleServiceClick = (serviceName) => {
    if (serviceName === 'সাইন কপি (All Types)') {
      // Navigate to orders page with only sign copy services filter
      navigate(`/admin/orders/all?service=সাইন কপি`);
    } else {
      navigate(`/admin/orders/all?service=${encodeURIComponent(serviceName)}`);
    }
  };

  // Process service stats to group sign copy services
  const processServiceStats = (stats) => {
    const otherServices = [];
    let signCopyTotal = 0;
    let signCopyStats = null;

    stats.forEach(service => {
      if (signCopyServices.some(signService => 
        service.serviceName?.includes(signService)
      )) {
        signCopyTotal += service.orderCount || 0;
      } else {
        otherServices.push(service);
      }
    });

    // Create combined sign copy service entry
    if (signCopyTotal > 0) {
      signCopyStats = {
        serviceName: 'সাইন কপি (All Types)',
        orderCount: signCopyTotal,
        isCombined: true,
        subServices: signCopyServices
      };
    }

    // Return combined service first, then other services
    const result = [];
    if (signCopyStats) {
      result.push(signCopyStats);
    }
    return [...result, ...otherServices];
  };

  const fetchServiceStats = async () => {
    setLoadingServiceStats(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${base_url}/api/admin/orders/service-count`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = response.data;
      
      if (data.success) {
        const processedStats = processServiceStats(data.data || []);
        setServiceStats(processedStats);
        toast.success('Service stats updated');
      } else {
        toast.error(data.message || 'Failed to fetch service statistics');
      }
    } catch (error) {
      console.error('Error fetching service stats:', error);
      toast.error(error.response?.data?.message || 'Error fetching service statistics');
    } finally {
      setLoadingServiceStats(false);
    }
  };

  useEffect(() => {
    fetchServiceStats();
  }, []);

  // Apply date filter with loading state
  const applyDateFilter = async () => {
    setStatsLoading(true);
    await fetchWithDateFilter(dateFilter.startDate, dateFilter.endDate);
    await fetchServiceStats();
    setStatsLoading(false);
    toast.success('Filter applied successfully');
  };

  // Reset date filter
  const resetDateFilter = async () => {
    setStatsLoading(true);
    const today = new Date().toISOString().split('T')[0];
    setDateFilter({
      startDate: today,
      endDate: today
    });
    setTimeRange('today');
    await fetchWithDateFilter(today, today);
    await fetchServiceStats();
    setStatsLoading(false);
    toast.success('Filter reset');
  };

  // Quick time range buttons
  const handleTimeRange = async (range) => {
    setStatsLoading(true);
    setTimeRange(range);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let startDate = new Date(today);
    
    switch(range) {
      case 'today':
        startDate = today;
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(today.getFullYear(), 0, 1);
        break;
    }
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = today.toISOString().split('T')[0];
    
    setDateFilter({
      startDate: startDateStr,
      endDate: endDateStr
    });
    
    await fetchWithDateFilter(startDateStr, endDateStr);
    await fetchServiceStats();
    setStatsLoading(false);
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    setStatsLoading(true);
    await refreshDashboard();
    await fetchServiceStats();
    setRefreshing(false);
    setStatsLoading(false);
  };

  // Export data
  const exportData = (type) => {
    let data = [];
    let filename = '';
    
    switch(type) {
      case 'users':
        data = usersHistory;
        filename = `users_${dateFilter.startDate}_to_${dateFilter.endDate}.csv`;
        break;
      case 'orders':
        data = ordersHistory;
        filename = `orders_${dateFilter.startDate}_to_${dateFilter.endDate}.csv`;
        break;
      case 'deposits':
        data = depositsHistory;
        filename = `deposits_${dateFilter.startDate}_to_${dateFilter.endDate}.csv`;
        break;
    }
    
    // Convert to CSV
    const csvContent = convertToCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    
    toast.success(`${type} data exported successfully`);
  };

  const convertToCSV = (data) => {
    if (!data.length) return '';
    
    const headers = Object.keys(data[0]);
    const rows = data.map(row => 
      headers.map(header => JSON.stringify(row[header])).join(',')
    );
    
    return [headers.join(','), ...rows].join('\n');
  };

  // Format currency in BDT
  const formatCurrency = (amount) => {
    const numAmount = Number(amount) || 0;
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numAmount).replace('BDT', '৳');
  };

  // Format number with commas
  const formatNumber = (num) => {
    const number = Number(num) || 0;
    return new Intl.NumberFormat('en-US').format(number);
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format date with time
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status color
  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'active':
      case 'approved':
      case 'completed':
        return 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white';
      case 'pending':
      case 'processing':
        return 'bg-gradient-to-r from-amber-500 to-amber-600 text-white';
      case 'suspended':
      case 'rejected':
      case 'cancelled':
        return 'bg-gradient-to-r from-rose-500 to-rose-600 text-white';
      default:
        return 'bg-gradient-to-r from-slate-500 to-slate-600 text-white';
    }
  };

  // Stats cards data with enhanced design
  const statsCards = [
    {
      title: 'Total Users',
      value: formatNumber(dashboardData.users?.total || 0),
      subtitle: `Active: ${formatNumber(dashboardData.users?.active || 0)}`,
      icon: <FaUserCheck className="text-white text-xl" />,
      change: dashboardData.users?.newUsersToday || 0,
      changeLabel: 'New today',
      trend: 'up',
      color: 'from-indigo-500 via-indigo-600 to-blue-500',
      bgColor: 'bg-gradient-to-br from-indigo-500 via-indigo-600 to-blue-500',
      iconBg: 'bg-white/20',
      changeColor: 'text-emerald-400',
      progress: 75,
      chartColor: '#6366f1'
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(dashboardData.systemTotals?.totalRevenue || 0),
      subtitle: `Avg order: ${formatCurrency(dashboardData.systemTotals?.averageOrderValue || 0)}`,
      icon: <FaBangladeshiTakaSign className="text-white text-xl" />,
      change: dashboardData.quickStats?.revenueToday || 0,
      changeLabel: 'Today',
      trend: 'up',
      color: 'from-emerald-500 via-emerald-600 to-teal-500',
      bgColor: 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-500',
      iconBg: 'bg-white/20',
      changeColor: 'text-emerald-400',
      progress: 85,
      chartColor: '#10b981'
    },
    {
      title: 'Total Deposits',
      value: formatCurrency(dashboardData.deposits?.approved?.amount || 0),
      subtitle: `Pending: ${formatNumber(dashboardData.quickStats?.totalPendingDeposits || 0)}`,
      icon: <GiWallet className="text-white text-xl" />,
      change: dashboardData.quickStats?.depositsToday || 0,
      changeLabel: 'Today',
      trend: 'up',
      color: 'from-violet-500 via-violet-600 to-purple-500',
      bgColor: 'bg-gradient-to-br from-violet-500 via-violet-600 to-purple-500',
      iconBg: 'bg-white/20',
      changeColor: 'text-emerald-400',
      progress: 65,
      chartColor: '#8b5cf6'
    },
    {
      title: 'Total Orders',
      value: formatNumber(dashboardData.orders?.total || 0),
      subtitle: `Completed: ${formatNumber(dashboardData.orders?.completed?.count || 0)}`,
      icon: <FaShoppingCart className="text-white text-xl" />,
      change: dashboardData.orders?.today?.count || 0,
      changeLabel: 'Today',
      trend: 'up',
      color: 'from-orange-500 via-orange-600 to-amber-500',
      bgColor: 'bg-gradient-to-br from-orange-500 via-orange-600 to-amber-500',
      iconBg: 'bg-white/20',
      changeColor: 'text-emerald-400',
      progress: 90,
      chartColor: '#f97316'
    }
  ];

  // Secondary stats
  const secondaryStats = [
    {
      title: 'User Balance',
      value: formatCurrency(dashboardData.users?.totalBalance || 0),
      icon: <FaCreditCard className="text-slate-700" />,
      color: 'bg-gradient-to-br from-cyan-50 to-blue-50',
      borderColor: 'border-cyan-100',
      trend: 'up',
      change: '+12.5%'
    },
    {
      title: 'Total Profit',
      value: formatCurrency(dashboardData.systemTotals?.totalProfit || 0),
      icon: <FaMoneyBill className="text-slate-700" />,
      color: 'bg-gradient-to-br from-teal-50 to-emerald-50',
      borderColor: 'border-teal-100',
      trend: 'up',
      change: '+18.3%'
    },
    {
      title: 'Avg Order Value',
      value: formatCurrency(dashboardData.systemTotals?.averageOrderValue || 0),
      icon: <MdShowChart className="text-slate-700" />,
      color: 'bg-gradient-to-br from-rose-50 to-pink-50',
      borderColor: 'border-rose-100',
      trend: 'neutral',
      change: '+2.4%'
    },
    {
      title: 'Pending Actions',
      value: formatNumber(dashboardData.quickStats?.pendingActions || 0),
      icon: <FaClock className="text-slate-700" />,
      color: 'bg-gradient-to-br from-amber-50 to-yellow-50',
      borderColor: 'border-amber-100',
      trend: 'down',
      change: '-5.2%'
    }
  ];

  // Time range buttons
  const timeRangeButtons = [
    { id: 'today', label: 'Today', icon: <FaCalendarAlt /> },
    { id: 'week', label: 'This Week', icon: <IoIosStats /> },
    { id: 'month', label: 'This Month', icon: <MdTrendingUp /> },
    { id: 'year', label: 'This Year', icon: <TbReportAnalytics /> },
    { id: 'custom', label: 'Custom', icon: <FaFilter /> }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 lg:ml-72 mt-[9vh] p-4 md:p-6 transition-all duration-500">
      <Toaster 
        position="top-right" 
        toastOptions={{
          duration: 4000,
          style: {
            background: 'linear-gradient(135deg, #1e293b, #334155)',
            color: '#f8fafc',
            border: '1px solid #475569',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }
        }}
      />

      {/* Animated background elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header with enhanced design */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 bg-clip-text text-transparent">
              Dashboard Overview
            </h1>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <p className="text-slate-600 text-sm font-medium bg-white/50 backdrop-blur-sm px-3 py-1 rounded-full">
                Last updated: {dashboardData.currentDate || new Date().toLocaleDateString()}
              </p>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
              LIVE
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCustomFilter(!showCustomFilter)}
            className="px-5 py-2.5 bg-white/80 backdrop-blur-sm text-slate-700 rounded-[10px] hover:bg-white transition-all duration-300 border border-slate-200/80 hover:border-indigo-300  flex items-center gap-2 group"
          >
            <FaFilter className="text-indigo-500 group-hover:rotate-12 transition-transform" />
            <span className="font-semibold">Advanced Filter</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 via-indigo-600 to-blue-500 text-white rounded-[10px] transition-all duration-300 flex items-center gap-2  disabled:opacity-70 disabled:cursor-not-allowed group overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <FaSync className={`text-lg ${refreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform'}`} />
            <span className="font-semibold">{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Custom Date Filter Panel */}
      <AnimatePresence>
        {showCustomFilter && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white/90 backdrop-blur-lg rounded-[10px] border border-slate-200/80 overflow-hidden mb-6"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600">
                    <FaFilter className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">
                    Custom Date Filter
                  </h3>
                </div>
                <button
                  onClick={() => setShowCustomFilter(false)}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    <span className="flex items-center gap-2">
                      <FaCalendarAlt className="text-indigo-500" />
                      Start Date
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={dateFilter.startDate}
                      onChange={(e) => setDateFilter({...dateFilter, startDate: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 bg-white/50 backdrop-blur-sm font-medium"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                      <FaCalendarAlt />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    <span className="flex items-center gap-2">
                      <FaCalendarAlt className="text-indigo-500" />
                      End Date
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={dateFilter.endDate}
                      onChange={(e) => setDateFilter({...dateFilter, endDate: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 bg-white/50 backdrop-blur-sm font-medium"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                      <FaCalendarAlt />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-end gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={applyDateFilter}
                    className="w-full px-4 py-3.5 bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-500 text-white rounded-xl  transition-all duration-300 font-semibold flex items-center justify-center gap-2"
                  >
                    <FaFilter />
                    Apply Filter
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={resetDateFilter}
                    className="w-full px-4 py-3 bg-slate-100 text-slate-700 rounded-xl border-[1px] border-gray-200 hover:bg-slate-200 transition-all duration-300 font-semibold"
                  >
                    Reset to Today
                  </motion.button>
                </div>
              </div>
              <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-100">
                <p className="text-sm text-slate-700 font-medium">
                  Showing data from <span className="font-bold text-slate-900">{formatDate(dateFilter.startDate)}</span> to <span className="font-bold text-slate-900">{formatDate(dateFilter.endDate)}</span>
                  {dateFilter.startDate !== dateFilter.endDate && (
                    <span className="ml-2 text-xs font-medium px-2 py-1 rounded-full bg-white/80">
                      {Math.ceil((new Date(dateFilter.endDate) - new Date(dateFilter.startDate)) / (1000 * 60 * 60 * 24))} days
                    </span>
                  )}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Time Range Buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-3 mb-8"
      >
        {timeRangeButtons.map((button) => (
          <motion.button
            key={button.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (button.id === 'custom') {
                setShowCustomFilter(true);
              } else {
                handleTimeRange(button.id);
              }
            }}
            className={`px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 backdrop-blur-sm ${
              timeRange === button.id
                ? 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-600 text-white shadow-2xl'
                : 'bg-white/80 text-slate-700 hover:bg-white border border-slate-200/80 hover:border-indigo-300 hover:shadow-xl'
            }`}
          >
            <span className={timeRange === button.id ? 'text-white' : 'text-indigo-500'}>
              {button.icon}
            </span>
            {button.label}
          </motion.button>
        ))}
      </motion.div>

      {/* Service Statistics Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FaChartBar className="text-indigo-600" />
            Service Statistics
          </h2>
          <button
            onClick={fetchServiceStats}
            disabled={loadingServiceStats}
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-2 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-all duration-300 group disabled:opacity-50"
          >
            <FaSync className={`text-sm ${loadingServiceStats ? 'animate-spin' : 'group-hover:rotate-180 transition-transform'}`} />
            {loadingServiceStats ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        
        {loadingServiceStats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl p-5 animate-pulse">
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-300 rounded w-24"></div>
                    <div className="h-6 bg-slate-300 rounded w-16"></div>
                  </div>
                  <div className="w-12 h-12 bg-slate-300 rounded-xl"></div>
                </div>
                <div className="h-2 bg-slate-300 rounded-full"></div>
              </div>
            ))}
          </div>
        ) : serviceStats.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {serviceStats.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                onClick={() => handleServiceClick(service.serviceName)}
                className={`relative overflow-hidden rounded-xl group cursor-pointer transition-all duration-300`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${getServiceColor(index)}`}></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
                
                {/* Animated background wave */}
                <div className="absolute -bottom-20 -left-4 w-56 h-56 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                <div className="absolute -top-20 -right-4 w-56 h-56 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700 delay-100"></div>
                
                <div className="relative p-5">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <p className="text-sm font-semibold text-white/90 mb-2 truncate">
                        {service.serviceName}
                      </p>
                      <h3 className="text-2xl font-bold text-white drop-shadow-lg">
                        {formatNumber(service.orderCount)}
                      </h3>
                    </div>
                    <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                      {getServiceIcon(service.serviceName)}
                    </div>
                  </div>
                  
                  {/* Show sub-services for combined sign copy service - EXACTLY as in the image */}
                  
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white/80">Total Orders</span>
                      <span className="text-white font-semibold">
                        {service.orderCount > 0 ? '100%' : '0%'}
                      </span>
                    </div>
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: service.orderCount > 0 ? '100%' : '0%' }}
                        transition={{ delay: index * 0.1 + 0.3, duration: 1 }}
                        className="h-full bg-white rounded-full"
                      ></motion.div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-white/20">
                    <span className="text-xs font-semibold text-white/80 flex items-center gap-1">
                      <FaChevronRight className="text-xs group-hover:translate-x-1 transition-transform" />
                      Click to view details
                    </span>
                    <span className="text-xs font-semibold text-white/70">
                      {service.isCombined ? 'Combined Service' : 'Service'}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200/80 p-10 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaShoppingCart className="text-slate-400 text-3xl" />
            </div>
            <p className="text-xl font-bold text-slate-700 mb-2">No service statistics found</p>
            <p className="text-slate-500">Try changing your date filter or refresh the data</p>
          </div>
        )}
      </motion.div>

      {/* Loading Overlay */}
      {statsLoading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="  rounded-2xl p-8">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
              <p className="text-slate-700 font-semibold">Loading dashboard data...</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Stats Grid with enhanced design */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
      >
        {/* Primary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {statsCards.map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className={`relative overflow-hidden rounded-[10px] group`}
            >
              <div className={`absolute inset-0 ${card.bgColor}`}></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
              
              {/* Animated background wave */}
              <div className="absolute -bottom-20 -left-4 w-56 h-56 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
              <div className="absolute -top-20 -right-4 w-56 h-56 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700 delay-100"></div>
              
              <div className="relative p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-sm font-semibold text-white/90 mb-2">{card.title}</p>
                    <h3 className="text-2xl font-bold text-white drop-shadow-lg">{card.value}</h3>
                  </div>
                  <div className={`p-3 rounded-xl ${card.iconBg} backdrop-blur-sm`}>
                    {card.icon}
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white/80">{card.subtitle}</span>
                    <span className="text-white font-semibold">{card.progress}%</span>
                  </div>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${card.progress}%` }}
                      transition={{ delay: index * 0.1 + 0.3, duration: 1 }}
                      className="h-full bg-white rounded-full"
                    ></motion.div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-white/20">
                  <span className={`text-xs font-semibold ${card.changeColor} flex items-center gap-1`}>
                    {card.trend === 'up' ? (
                      <TbArrowWaveRightUp className="text-lg" />
                    ) : card.trend === 'down' ? (
                      <TbArrowWaveRightDown className="text-lg" />
                    ) : (
                      <GiNetworkBars className="text-lg" />
                    )}
                    {card.change > 0 ? `+${card.change}` : card.change} {card.changeLabel}
                  </span>
                  <span className="text-xs font-semibold text-white/70">
                    Updated just now
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Secondary Stats & Mini Chart */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {secondaryStats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 + 0.4 }}
              whileHover={{ y: -3 }}
              className={`${stat.color} border-2 ${stat.borderColor} rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 group`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm font-semibold text-slate-600 mb-1">{stat.title}</p>
                  <h3 className="text-xl font-bold text-slate-800">{stat.value}</h3>
                </div>
                <div className={`p-2.5 rounded-lg bg-white/80 backdrop-blur-sm group-hover:scale-110 transition-transform`}>
                  {stat.icon}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold ${
                  stat.trend === 'up' ? 'text-emerald-600' :
                  stat.trend === 'down' ? 'text-rose-600' :
                  'text-slate-600'
                } flex items-center gap-1`}>
                  {stat.trend === 'up' && <FaArrowUp className="text-xs" />}
                  {stat.trend === 'down' && <FaArrowDown className="text-xs" />}
                  {stat.change}
                </span>
                <div className="w-16 h-10 flex items-end gap-0.5">
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.random() * 100}%` }}
                      transition={{ delay: index * 0.1 + i * 0.05 }}
                      className={`flex-1 rounded-t ${
                        stat.trend === 'up' ? 'bg-emerald-400' :
                        stat.trend === 'down' ? 'bg-rose-400' :
                        'bg-slate-400'
                      }`}
                    ></motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
          
          {/* Quick Actions Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
            className="md:col-span-2 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <MdOutlineInsights className="text-indigo-300" />
                Quick Actions
              </h3>
              <div className="flex gap-2">
                <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                  <FaCog className="text-white/70" />
                </button>
                <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                  <FaBell className="text-white/70" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => exportData('users')}
                className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 group"
              >
                <div className="flex items-center justify-between mb-2">
                  <FaUsers className="text-emerald-400" />
                  <FaChevronRight className="text-white/40 group-hover:text-white/60 transition-colors" />
                </div>
                <p className="text-sm font-medium text-white/90">Export Users</p>
              </button>
              <button
                onClick={() => exportData('orders')}
                className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 group"
              >
                <div className="flex items-center justify-between mb-2">
                  <FaShoppingCart className="text-orange-400" />
                  <FaChevronRight className="text-white/40 group-hover:text-white/60 transition-colors" />
                </div>
                <p className="text-sm font-medium text-white/90">Export Orders</p>
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Content Tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-white/90 backdrop-blur-lg rounded-[10px] border border-slate-200/80 overflow-hidden mb-6"
      >
        {/* Animated Tab Navigation */}
        <div className="flex border-b border-slate-200/80 bg-gradient-to-r from-slate-50 to-white/50">
          {['overview', 'users', 'orders', 'deposits'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 px-1 font-semibold text-sm transition-all duration-300 relative group`}
            >
              <span className={`flex items-center justify-center gap-2 transition-colors ${
                activeTab === tab
                  ? 'text-indigo-600'
                  : 'text-slate-500 group-hover:text-slate-700'
              }`}>
                {tab === 'overview' && <FaTachometerAlt className="text-lg" />}
                {tab === 'users' && <FaUsers className="text-lg" />}
                {tab === 'orders' && <FaShoppingCart className="text-lg" />}
                {tab === 'deposits' && <MdWallet className="text-lg" />}
                {tab.charAt(0).toUpperCase() + tab.slice(1)} History
              </span>
              {activeTab === tab && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-t-full"
                />
              )}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-1 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-t-full transition-all duration-300 group-hover:w-4/5"></div>
            </button>
          ))}
        </div>

        {/* Tab Content with enhanced animations */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="p-6"
          >
            {/* Overview Tab - Enhanced */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Users Card */}
                <div className="bg-white rounded-xl border border-slate-200/80 p-5 transition-shadow duration-300">
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600">
                        <FaUserCheck className="text-white text-sm" />
                      </div>
                      Recent Users
                    </h3>
                    <button
                      onClick={() => exportData('users')}
                      className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-2 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-all duration-300 group"
                    >
                      <FaDownload className="group-hover:translate-y-0.5 transition-transform" /> Export
                    </button>
                  </div>
                  <div className="space-y-3">
                    {dashboardData.recentActivity?.users?.slice(0, 5).map((user, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-3 hover:bg-gradient-to-r from-indigo-50/50 to-transparent rounded-xl transition-all duration-300 group cursor-pointer border border-transparent hover:border-indigo-100"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-xl flex items-center justify-center border-2 border-indigo-200 group-hover:border-indigo-300 transition-colors">
                              <FaUsers className="text-indigo-600 text-lg" />
                            </div>
                            {user.emailverified && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                                <FaCheckCircle className="text-white text-xs" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">{user.fullname}</p>
                            <p className="text-sm text-slate-500 truncate max-w-[150px]">{user.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(user.status)} shadow-sm`}>
                            {user.status}
                          </span>
                          <p className="text-xs text-slate-500 mt-2 group-hover:text-slate-700 transition-colors">
                            {formatDateTime(user.createdAt)}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                    {(!dashboardData.recentActivity?.users || dashboardData.recentActivity.users.length === 0) && (
                      <div className="text-center py-10">
                        <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                          <FaUsers className="text-slate-400 text-3xl" />
                        </div>
                        <p className="text-slate-500 font-medium">No recent users</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Orders Card */}
                <div className="bg-white rounded-xl border border-slate-200/80 p-5  transition-shadow duration-300">
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600">
                        <FaReceipt className="text-white text-sm" />
                      </div>
                      Recent Orders
                    </h3>
                    <button
                      onClick={() => exportData('orders')}
                      className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-2 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-all duration-300 group"
                    >
                      <FaDownload className="group-hover:translate-y-0.5 transition-transform" /> Export
                    </button>
                  </div>
                  <div className="space-y-3">
                    {dashboardData.recentActivity?.orders?.slice(0, 5).map((order, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-3 hover:bg-gradient-to-r from-emerald-50/50 to-transparent rounded-xl transition-all duration-300 group cursor-pointer border border-transparent hover:border-emerald-100"
                      >
                        <div>
                          <p className="font-bold text-slate-800 font-mono group-hover:text-emerald-700 transition-colors">{order.orderId}</p>
                          <p className="text-sm text-slate-500 truncate max-w-[200px]">{order.service?.workName || order.serviceName}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(order.status)} shadow-sm`}>
                            {order.status}
                          </span>
                          <p className="font-bold text-slate-800 text-lg mt-2 group-hover:text-emerald-700 transition-colors">
                            {formatCurrency(order.totalAmount)}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                    {(!dashboardData.recentActivity?.orders || dashboardData.recentActivity.orders.length === 0) && (
                      <div className="text-center py-10">
                        <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                          <FaShoppingCart className="text-slate-400 text-3xl" />
                        </div>
                        <p className="text-slate-500 font-medium">No recent orders</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Deposits - Full Width */}
                <div className="bg-white rounded-xl border border-slate-200/80 p-5 transition-shadow duration-300 lg:col-span-2">
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600">
                        <MdWallet className="text-white text-sm" />
                      </div>
                      Recent Deposits
                    </h3>
                    <div className="flex gap-3">
                      <button
                        onClick={() => exportData('deposits')}
                        className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-2 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-all duration-300 group"
                      >
                        <FaDownload className="group-hover:translate-y-0.5 transition-transform" /> Export
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-slate-200/80">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gradient-to-r from-slate-50 to-white/80 border-b border-slate-200/80">
                          {['User', 'Transaction ID', 'Amount', 'Bonus', 'Status', 'Date'].map((header, idx) => (
                            <th key={idx} className="py-3 px-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {dashboardData.recentActivity?.deposits?.slice(0, 7).map((deposit, index) => (
                          <motion.tr
                            key={index}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className="border-b border-slate-100 hover:bg-gradient-to-r from-violet-50/30 to-transparent transition-all duration-300"
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-violet-100 to-violet-50 rounded-lg flex items-center justify-center border-2 border-violet-200">
                                  <FaUsers className="text-violet-600" />
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-800">{deposit.user?.fullname}</p>
                                  <p className="text-xs text-slate-500">{deposit.user?.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <p className="text-sm font-mono text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                                {deposit.transactionId}
                              </p>
                            </td>
                            <td className="py-3 px-4">
                              <p className="font-bold text-slate-800 text-lg">{formatCurrency(deposit.amount)}</p>
                            </td>
                            <td className="py-3 px-4">
                              <p className={`text-sm font-semibold ${deposit.bonusAmount > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                                {formatCurrency(deposit.bonusAmount)}
                              </p>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(deposit.status)} shadow-sm`}>
                                {deposit.status}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <p className="text-sm text-slate-500 font-medium">{formatDateTime(deposit.createdAt)}</p>
                            </td>
                          </motion.tr>
                        ))}
                        {(!dashboardData.recentActivity?.deposits || dashboardData.recentActivity.deposits.length === 0) && (
                          <tr>
                            <td colSpan="6" className="py-16 text-center text-slate-500">
                              <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MdWallet className="text-slate-400 text-3xl" />
                              </div>
                              <p className="text-lg font-medium text-slate-700 mb-2">No recent deposits</p>
                              <p className="text-sm text-slate-500">Try changing your date filter</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Users History Tab */}
            {activeTab === 'users' && (
              <div className="bg-white rounded-xl border border-slate-200/80 p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600">
                        <FaUsers className="text-white" />
                      </div>
                      <div>
                        Users History
                        <p className="text-sm font-normal text-slate-500 mt-1">
                          Showing {usersHistory.length} users from {formatDate(dateFilter.startDate)} to {formatDate(dateFilter.endDate)}
                        </p>
                      </div>
                    </h3>
                  </div>
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => exportData('users')}
                      className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 via-indigo-600 to-blue-500 text-white rounded-xl hover:shadow-2xl transition-all duration-300 flex items-center gap-2 font-semibold shadow-lg"
                    >
                      <FaDownload /> Export CSV
                    </motion.button>
                  </div>
                </div>
                
                <div className="overflow-hidden rounded-xl border border-slate-200/80 ">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1000px]">
                      <thead>
                        <tr className="bg-gradient-to-r from-slate-50 to-white/80">
                          {['User', 'Contact', 'Balance', 'Total Deposit', 'Status', 'Joined'].map((header, idx) => (
                            <th key={idx} className="py-4 px-6 text-left text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200/80">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {usersHistory.slice(0, 10).map((user, index) => (
                          <motion.tr
                            key={index}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.02 }}
                            className="border-b border-slate-100 hover:bg-gradient-to-r from-indigo-50/30 to-transparent transition-all duration-300 group"
                          >
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-xl flex items-center justify-center border-2 border-indigo-200 group-hover:border-indigo-300 transition-colors">
                                  <FaUsers className="text-indigo-600" />
                                </div>
                                <div>
                                  <p className="font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">{user.fullname}</p>
                                  <p className="text-sm text-slate-500">{user.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <p className="text-sm font-medium text-slate-700">{user.whatsappnumber}</p>
                            </td>
                            <td className="py-4 px-6">
                              <p className="font-bold text-slate-800 text-lg">{formatCurrency(user.balance)}</p>
                            </td>
                            <td className="py-4 px-6">
                              <p className="font-semibold text-slate-700">{formatCurrency(user.totaldeposit)}</p>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex flex-col gap-1">
                                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(user.status)} shadow-sm w-fit`}>
                                  {user.status}
                                </span>
                                {user.emailverified && (
                                  <span className="px-2 py-1 rounded-full text-xs bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold w-fit">
                                    Verified
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <p className="text-sm text-slate-500 font-medium">{formatDateTime(user.createdAt)}</p>
                            </td>
                          </motion.tr>
                        ))}
                        {usersHistory.length === 0 && (
                          <tr>
                            <td colSpan="6" className="py-16 text-center text-slate-500">
                              <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FaUsers className="text-slate-400 text-4xl" />
                              </div>
                              <p className="text-xl font-bold text-slate-700 mb-2">No users found</p>
                              <p className="text-sm text-slate-500">Try changing your date filter</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Orders History Tab */}
            {activeTab === 'orders' && (
              <div className="bg-white rounded-xl border border-slate-200/80 p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600">
                        <FaShoppingCart className="text-white" />
                      </div>
                      <div>
                        Orders History
                        <p className="text-sm font-normal text-slate-500 mt-1">
                          Showing {ordersHistory.length} orders from {formatDate(dateFilter.startDate)} to {formatDate(dateFilter.endDate)}
                        </p>
                      </div>
                    </h3>
                  </div>
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => exportData('orders')}
                      className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 via-indigo-600 to-blue-500 text-white rounded-xl hover:shadow-2xl transition-all duration-300 flex items-center gap-2 font-semibold shadow-lg"
                    >
                      <FaDownload /> Export CSV
                    </motion.button>
                  </div>
                </div>
                
                <div className="overflow-hidden rounded-xl border border-slate-200/80">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1200px]">
                      <thead>
                        <tr className="bg-gradient-to-r from-slate-50 to-white/80">
                          {['Order ID', 'Customer', 'Service', 'Amount', 'Status', 'Type', 'Created'].map((header, idx) => (
                            <th key={idx} className="py-4 px-6 text-left text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200/80">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {ordersHistory.slice(0, 10).map((order, index) => (
                          <motion.tr
                            key={index}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.02 }}
                            className="border-b border-slate-100 hover:bg-gradient-to-r from-emerald-50/30 to-transparent transition-all duration-300 group"
                          >
                            <td className="py-4 px-6">
                              <p className="font-mono text-sm text-slate-800 font-bold">{order.orderId}</p>
                            </td>
                            <td className="py-4 px-6">
                              <div>
                                <p className="font-semibold text-slate-800 group-hover:text-emerald-700 transition-colors">{order.username}</p>
                                <p className="text-sm text-slate-500">{order.userEmail}</p>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <p className="text-sm text-slate-700 font-medium">{order.serviceName}</p>
                            </td>
                            <td className="py-4 px-6">
                              <p className="font-bold text-slate-800 text-lg">{formatCurrency(order.totalAmount)}</p>
                              <p className="text-xs text-slate-500">Qty: {order.quantity}</p>
                            </td>
                            <td className="py-4 px-6">
                              <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(order.status)} shadow-sm`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-slate-500 to-slate-600 text-white shadow-sm">
                                {order.orderType}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <p className="text-sm text-slate-500 font-medium">{formatDateTime(order.createdAt)}</p>
                            </td>
                          </motion.tr>
                        ))}
                        {ordersHistory.length === 0 && (
                          <tr>
                            <td colSpan="7" className="py-16 text-center text-slate-500">
                              <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FaShoppingCart className="text-slate-400 text-4xl" />
                              </div>
                              <p className="text-xl font-bold text-slate-700 mb-2">No orders found</p>
                              <p className="text-sm text-slate-500">Try changing your date filter</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Deposits History Tab */}
            {activeTab === 'deposits' && (
              <div className="bg-white rounded-xl border border-slate-200/80 p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600">
                        <MdWallet className="text-white" />
                      </div>
                      <div>
                        Deposits History
                        <p className="text-sm font-normal text-slate-500 mt-1">
                          Showing {depositsHistory.length} deposits from {formatDate(dateFilter.startDate)} to {formatDate(dateFilter.endDate)}
                        </p>
                      </div>
                    </h3>
                  </div>
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => exportData('deposits')}
                      className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 via-indigo-600 to-blue-500 text-white rounded-xl hover:shadow-2xl transition-all duration-300 flex items-center gap-2 font-semibold shadow-lg"
                    >
                      <FaDownload /> Export CSV
                    </motion.button>
                  </div>
                </div>
                
                <div className="overflow-hidden rounded-xl border border-slate-200/80">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1400px]">
                      <thead>
                        <tr className="bg-gradient-to-r from-slate-50 to-white/80">
                          {['User', 'Transaction ID', 'Method', 'Amount', 'Bonus', 'Total', 'Status', 'Date'].map((header, idx) => (
                            <th key={idx} className="py-4 px-6 text-left text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200/80">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {depositsHistory.slice(0, 10).map((deposit, index) => (
                          <motion.tr
                            key={index}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.02 }}
                            className="border-b border-slate-100 hover:bg-gradient-to-r from-violet-50/30 to-transparent transition-all duration-300 group"
                          >
                            <td className="py-4 px-6">
                              <div>
                                <p className="font-semibold text-slate-800 group-hover:text-violet-700 transition-colors">{deposit.user?.fullname || 'N/A'}</p>
                                <p className="text-sm text-slate-500">{deposit.user?.email || 'N/A'}</p>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <p className="text-sm font-mono text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                                {deposit.transactionId}
                              </p>
                            </td>
                            <td className="py-4 px-6">
                              <p className="text-sm font-semibold text-slate-700">{deposit.depositMethod?.name || deposit.depositMethodDetails?.name || 'N/A'}</p>
                            </td>
                            <td className="py-4 px-6">
                              <p className="font-bold text-slate-800 text-lg">{formatCurrency(deposit.amount)}</p>
                            </td>
                            <td className="py-4 px-6">
                              <p className={`text-sm font-semibold ${deposit.bonusAmount > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                                {formatCurrency(deposit.bonusAmount)}
                              </p>
                            </td>
                            <td className="py-4 px-6">
                              <p className="font-bold text-slate-900 text-xl">{formatCurrency(deposit.amount + deposit.bonusAmount)}</p>
                            </td>
                            <td className="py-4 px-6">
                              <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(deposit.status)} shadow-sm`}>
                                {deposit.status}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <p className="text-sm text-slate-500 font-medium">{formatDateTime(deposit.createdAt)}</p>
                            </td>
                          </motion.tr>
                        ))}
                        {depositsHistory.length === 0 && (
                          <tr>
                            <td colSpan="8" className="py-16 text-center text-slate-500">
                              <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MdWallet className="text-slate-400 text-4xl" />
                              </div>
                              <p className="text-xl font-bold text-slate-700 mb-2">No deposits found</p>
                              <p className="text-sm text-slate-500">Try changing your date filter</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Add custom styles for animations */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default Home;