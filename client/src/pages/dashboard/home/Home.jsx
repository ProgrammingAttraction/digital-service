import React, { useState, useEffect } from 'react';
import { 
  FaUsers, FaCheckCircle, FaClock, FaUserCheck, FaSearch, 
  FaSignature, FaFingerprint, FaPassport, FaFileContract, FaServer,
  FaArrowRight, FaBolt, FaHistory, FaExclamationTriangle
} from 'react-icons/fa';
import { TbPhoneCall } from 'react-icons/tb';
import { MdOutlineAssignmentInd, MdOutlineSdCard } from 'react-icons/md';
import { 
  LayoutDashboard, ChevronLeft, ChevronRight, Filter, 
  Download, MoreHorizontal, Calendar as CalendarIcon, Search,
  AlertTriangle
} from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import ApertureLoader from '../../../components/loader/ApertureLoader';
import { useUser } from '../../../context/UserContext'; // Import useUser hook

const Home = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const { getUserBalance, refreshUserData } = useUser(); // Use the context
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user?.id;

  const [orders, setOrders] = useState([]);
  const [orderStats, setOrderStats] = useState(null);
  const [loading, setLoading] = useState({ orders: false, stats: false });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showBalanceAlert, setShowBalanceAlert] = useState(false);
  const ordersPerPage = 10;

  // Get user balance from context
  const userBalance = getUserBalance();

  useEffect(() => {
    fetchOrders();
    fetchOrderStatistics();
    
    // Refresh user data to ensure balance is up-to-date
    refreshUserData();
  }, []);

  useEffect(() => {
    // Show alert when balance is less than 20
    if (userBalance !== null && userBalance < 20) {
      setShowBalanceAlert(true);
    } else {
      setShowBalanceAlert(false);
    }
  }, [userBalance]);

  const fetchOrders = async () => {
    try {
      setLoading(p => ({ ...p, orders: true }));
      const { data } = await axios.get(`${base_url}/api/user/orders`, {
        headers: { 'userid': userId, 'Authorization': `Bearer ${token}` }
      });
      if (data.success) setOrders(data.data || []);
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoading(p => ({ ...p, orders: false })); 
    }
  };

  const fetchOrderStatistics = async () => {
    try {
      setLoading(p => ({ ...p, stats: true }));
      const { data } = await axios.get(`${base_url}/api/user/order-statistics`, {
        headers: { 'userid': userId, 'Authorization': `Bearer ${token}` }
      });
      if (data.success) setOrderStats(data.data);
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoading(p => ({ ...p, stats: false })); 
    }
  };

  const statsConfig = [
    { key: 'total', label: 'মোট অর্ডার', icon: <FaUsers />, color: 'from-blue-600 to-indigo-600', shadow: 'shadow-blue-500/20' },
    { key: 'completed', label: 'সম্পন্ন', icon: <FaCheckCircle />, color: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/20' },
    { key: 'pending', label: 'বিচারাধীন', icon: <FaClock />, color: 'from-orange-400 to-amber-600', shadow: 'shadow-orange-500/20' },
    { key: 'cancelled', label: 'বাতিল', icon: <FaUserCheck />, color: 'from-rose-500 to-red-700', shadow: 'shadow-rose-500/20' },
  ];

  const filteredOrders = orders.filter(o => 
    o.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.serviceName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentOrders = filteredOrders.slice((currentPage - 1) * ordersPerPage, currentPage * ordersPerPage);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  return (
    <div className={`min-h-screen font-anek overflow-y-auto lg:ml-72 mt-[8vh] p-4 md:p-8 transition-all duration-500 ${isDarkMode ? 'bg-[#0b0f1a] text-slate-100' : 'bg-gray-50 text-slate-900'}`}>
      
      {/* --- LOW BALANCE ALERT --- */}
      {showBalanceAlert && (
        <div className={`mb-6 rounded-xl border overflow-hidden animate-fadeIn ${isDarkMode ? 'bg-amber-900/20 border-amber-700/50' : 'bg-amber-50 border-amber-200'}`}>
          <div className="p-4 flex items-start gap-4">
            <div className={`p-2.5 rounded-lg ${isDarkMode ? 'bg-amber-900/40' : 'bg-amber-100'}`}>
              <AlertTriangle className={`${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`} size={24} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-lg">নিম্ন ব্যালেন্স সতর্কতা!</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isDarkMode ? 'bg-amber-900 text-amber-300' : 'bg-amber-200 text-amber-800'}`}>
                  গুরুত্বপূর্ণ
                </span>
              </div>
              <p className={`mb-3 ${isDarkMode ? 'text-amber-200/80' : 'text-amber-800'}`}>
                আপনার অ্যাকাউন্টে বর্তমান ব্যালেন্স <span className="font-bold">৳{userBalance?.toFixed(2)}</span> যা ৳২০ এর কম। নতুন অর্ডার দিতে সমস্যা হতে পারে। দ্রুত ব্যালেন্স রিচার্জ করুন।
              </p>
              <button 
                onClick={() => navigate('/recharge')}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${isDarkMode ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white'}`}
              >
                ব্যালেন্স রিচার্জ করুন
              </button>
            </div>
            <button 
              onClick={() => setShowBalanceAlert(false)}
              className={`p-1.5 rounded-lg ${isDarkMode ? 'hover:bg-amber-900/40' : 'hover:bg-amber-100'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* --- WELCOME HEADER --- */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight">অ্যাডমিন ড্যাশবোর্ড</h1>
          </div>
          <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>আপনার ব্যবসার রিয়েল-টাইম ওভারভিউ এবং সার্ভিসসমূহ</p>
        </div>

        <div className={`flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl ${isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-white border border-slate-200 shadow-sm'}`}>
          <div className="text-right">
            <p className="text-[10px] uppercase font-bold opacity-50">আজকের তারিখ</p>
            <p className="text-sm font-bold">{new Date().toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
      </div>

      {/* --- STATISTICS GRID --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {statsConfig.map((stat) => (
          <div key={stat.key} className={`relative overflow-hidden group p-6 rounded-[15px] border transition-all duration-300 ${isDarkMode ? 'bg-slate-800/40 border-slate-700 hover:border-teal-500/50' : 'bg-white border-slate-200 shadow-sm hover:shadow-xl'}`}>
            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full bg-gradient-to-br ${stat.color} opacity-10 group-hover:scale-150 transition-transform duration-500`}></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{stat.label}</p>
                <h3 className="text-3xl font-black">{orderStats?.counts?.[stat.key] || 0}</h3>
              </div>
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.color} ${stat.shadow} flex items-center justify-center text-white text-2xl`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- DATA TABLE SECTION --- */}
      <div className={`rounded-[15px] border overflow-hidden ${isDarkMode ? 'bg-slate-800/30 border-slate-700' : 'bg-white border-slate-200'}`}>
        
        {/* Table Header w/ Search */}
        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-inherit">
            <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                <FaHistory className="text-teal-500" size={18}/> অর্ডার হিস্টোরি
            </h2>
            <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                    type="text" 
                    placeholder="অর্ডার আইডি দিয়ে খুঁজুন..." 
                    className={`w-full pl-10 pr-4 py-2 rounded-xl text-sm outline-none border transition-all ${isDarkMode ? 'bg-slate-900/50 border-slate-700 focus:border-teal-500' : 'bg-gray-50 border-gray-200 focus:border-teal-500'}`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        <div className="overflow-x-auto">
          {loading.orders ? (
            <div className="py-24 flex flex-col items-center"><ApertureLoader /><p className="mt-4 text-sm font-bold opacity-40">তথ্য লোড হচ্ছে...</p></div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className={`${isDarkMode ? 'bg-slate-900/50' : 'bg-slate-50/80'} text-[14px] uppercase font-black tracking-wider border-b border-gray-200 `}>
                  <th className="px-6 py-4">অর্ডার আইডি</th>
                  <th className="px-6 py-4">সার্ভিস নাম</th>
                  <th className="px-6 py-4">স্ট্যাটাস</th>
                  <th className="px-6 py-4 text-center">পেমেন্ট</th>
                  <th className="px-6 py-4">তারিখ</th>
                </tr>
              </thead>
              <tbody className={`text-sm divide-y ${isDarkMode ? 'divide-slate-700' : 'divide-slate-100'}`}>
                {currentOrders.length > 0 ? currentOrders.map((order, idx) => (
                  <tr key={idx} className={`group transition-colors ${isDarkMode ? 'hover:bg-slate-700/30' : 'hover:bg-teal-50/30'}`}>
                    <td className="px-6 py-4 font-mono font-bold text-teal-500">{order.orderId || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                          <FaBolt size={12} className="text-teal-500" />
                        </div>
                        <span className="font-bold truncate max-w-[150px]">{order.serviceName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                        order.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 
                        order.status === 'pending' ? 'bg-amber-500/10 text-amber-500' : 'bg-rose-500/10 text-rose-500'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                           order.status === 'completed' ? 'bg-emerald-500' : 
                           order.status === 'pending' ? 'bg-amber-500' : 'bg-rose-500'
                        }`}></div>
                        {order.status === 'completed' ? 'সম্পন্ন' : order.status === 'pending' ? 'বিচারাধীন' : 'বাতিল'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-black text-center text-base">৳{order.totalAmount}</td>
                    <td className="px-6 py-4 opacity-70 text-xs">
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <CalendarIcon size={12}/> 
                        {new Date(order.createdAt).toLocaleDateString('bn-BD')}
                      </div>
                    </td>
                  </tr>
                )) : (
                    <tr>
                        <td colSpan="6" className="px-6 py-12 text-center opacity-50 font-bold">কোনো অর্ডার পাওয়া যায়নি</td>
                    </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* --- IMPROVED PAGINATION --- */}
        <div className={`p-6 md:px-8 flex flex-col sm:flex-row justify-between items-center gap-6 border-t ${isDarkMode ? 'bg-slate-900/40 border-slate-700' : 'bg-gray-50/50 border-slate-100'}`}>
          
          {/* Left Side: Stats */}
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider ${isDarkMode ? 'bg-slate-800 text-slate-400' : ''}`}>
              মোট রেকর্ড: <span className={isDarkMode ? 'text-teal-400' : 'text-teal-600'}>{filteredOrders.length}</span>
            </div>
          </div>

          {/* Right Side: Controls */}
          <div className="flex items-center gap-2">
            {/* Previous Button */}
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              className={`flex items-center gap-1 px-3 py-2 rounded-xl border font-bold text-xs transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed
                ${isDarkMode 
                  ? 'border-slate-700 hover:bg-slate-700 text-slate-300' 
                  : 'border-slate-200 hover:bg-white hover:shadow-md text-slate-600'}`}
            >
              <ChevronLeft size={16} />
              <span className="hidden md:inline">পূর্ববর্তী</span>
            </button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1.5 mx-2">
              {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1;
                // Show only first, last, and pages around current page for clean UI
                if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-10 h-10 rounded-xl font-bold text-sm transition-all duration-300 
                        ${currentPage === pageNum 
                          ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30 scale-110' 
                          : isDarkMode 
                            ? 'hover:bg-slate-700 text-slate-400' 
                            : 'hover:bg-white hover:shadow-sm text-slate-500'}`}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                  return <span key={pageNum} className="text-slate-400 px-1">...</span>;
                }
                return null;
              })}
            </div>

            {/* Next Button */}
            <button 
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(p => p + 1)}
              className={`flex items-center gap-1 px-3 py-2 rounded-xl border font-bold text-xs transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed
                ${isDarkMode 
                  ? 'border-slate-700 hover:bg-slate-700 text-slate-300' 
                  : 'border-slate-200 hover:bg-white hover:shadow-md text-slate-600'}`}
            >
              <span className="hidden md:inline">পরবর্তী</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;