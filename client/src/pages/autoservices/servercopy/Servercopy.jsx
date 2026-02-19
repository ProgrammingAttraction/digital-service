import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../../../components/header/Header';
import Sidebar from '../../../components/sidebar/Sidebar';
import { useTheme } from '../../../context/ThemeContext';
import toast, { Toaster } from 'react-hot-toast';
import { 
  FaServer, 
  FaFileDownload, 
  FaMoneyBillWave, 
  FaCalendarAlt, 
  FaIdCard, 
  FaExclamationTriangle, 
  FaSpinner, 
  FaCheckCircle,
  FaInfoCircle,
  FaArrowRight,
  FaBell,
  FaVolumeUp,
  FaSearch,
  FaEye,
  FaTrash,
  FaFile,
  FaDownload,
  FaFilePdf,
  FaTimes,
  FaCalendar
} from 'react-icons/fa';
import { IoIosArrowBack } from "react-icons/io";
import { IoIosArrowForward } from "react-icons/io";
import { NavLink } from 'react-router-dom';

function Servercopy() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [nid, setNid] = useState('');
  const [dob, setDob] = useState('');
  const [loading, setLoading] = useState(false);
  const [priceLoading, setPriceLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [servicePrice, setServicePrice] = useState(0);
  const [serviceName, setServiceName] = useState('সার্ভার কপি Unofficial');

  // Table states - EXACT SAME as Signtoserver
  const [serverCopies, setServerCopies] = useState([]);
  const [loadingCopies, setLoadingCopies] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [receiptToDelete, setReceiptToDelete] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const { isDarkMode } = useTheme();
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user?.id;

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  // Fetch service price and server copies on component mount
  useEffect(() => {
    fetchServicePrice();
    fetchServerCopies();
  }, []);

  // Fetch server copies when page changes
  useEffect(() => {
    fetchServerCopies();
  }, [currentPage, searchTerm]);

  const fetchServicePrice = async () => {
    try {
      setPriceLoading(true);
      const response = await axios.get(`${base_url}/api/user/service/price/server-copy-unofficial`);
      
      if (response.data && response.data.success) {
        setServicePrice(response.data.price);
        setServiceName(response.data.serviceName || 'সার্ভার কপি Unofficial');
      }
    } catch (error) {
      console.error('Error fetching service price:', error);
      setServicePrice(10); // Default fallback price
    } finally {
      setPriceLoading(false);
    }
  };

  // EXACT SAME fetch function as Signtoserver
  const fetchServerCopies = async () => {
    try {
      setLoadingCopies(true);
      const response = await axios.get(`${base_url}/api/user/server-copy-unofficial/all`, {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search: searchTerm
        },
        headers: {
          'Authorization': `Bearer ${token}`,
          'userId': userId
        }
      });
      
      if (response.data && response.data.success) {
        setServerCopies(response.data.data || []);
      } else {
        setServerCopies([]);
      }
    } catch (err) {
      console.error('Failed to fetch server copies:', err);
      toast.error('সার্ভার কপি তালিকা লোড করতে ব্যর্থ হয়েছে');
      setServerCopies([]);
    } finally {
      setLoadingCopies(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!nid.trim()) {
      toast.error('দয়া করে এনআইডি নম্বর দিন');
      setError('দয়া করে এনআইডি নম্বর দিন');
      return;
    }
    
    if (!dob.trim()) {
      toast.error('দয়া করে জন্ম তারিখ দিন');
      setError('দয়া করে জন্ম তারিখ দিন');
      return;
    }

    // SIMPLE DATE VALIDATION - Accept any date string with numbers and separators
    const dateRegex = /^[\d\-/\.]+$/;
    if (!dateRegex.test(dob)) {
      toast.error('জন্ম তারিখ শুধুমাত্র সংখ্যা এবং বিভাজক (-, /, .) থাকতে পারে');
      setError('জন্ম তারিখ শুধুমাত্র সংখ্যা এবং বিভাজক (-, /, .) থাকতে পারে');
      return;
    }

    // Validate NID format (10, 13, or 17 digits)
    const nidRegex = /^\d{10}$|^\d{13}$|^\d{17}$/;
    if (!nidRegex.test(nid.replace(/\s/g, ''))) {
      toast.error('এনআইডি নম্বর ১০, ১৩ বা ১৭ সংখ্যার হতে হবে');
      setError('এনআইডি নম্বর ১০, ১৩ বা ১৭ সংখ্যার হতে হবে');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Configure axios request
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'userid': userId
        }
      };

      // Send data EXACTLY as entered - NO FORMATTING
      const requestData = {
        nid: nid,
        dob: dob,
        serviceprice:servicePrice

      };

      console.log('Sending data to backend:', requestData);

      // Make API call using axios
      const response = await axios.post(
        `${base_url}/api/user/server-copy-nid`,
        requestData,
        config
      );

      const data = response.data;
      
      console.log('API Response:', data);

      if (data.success) {
        const successMsg = 'এনআইডি সার্ভার কপি ডাটা সফলভাবে প্রাপ্ত হয়েছে!';
        toast.success(successMsg);
        setSuccess(successMsg);
        
        // Show transaction info if available
        if (data.transaction) {
          const transactionMsg = `ডাটা সফলভাবে প্রাপ্ত হয়েছে! কাটা পরিমাণ: ${data.transaction.amount}৳, নতুন ব্যালেন্স: ${data.transaction.balance}৳`;
          toast.success(transactionMsg);
          setSuccess(transactionMsg);
          
          // Update user balance in localStorage
          if (user && data.transaction.balance !== undefined) {
            user.balance = data.transaction.balance;
            localStorage.setItem('user', JSON.stringify(user));
          }
        }
        
        // Clear form
        setNid('');
        setDob('');
        
        // Refresh server copies list
        fetchServerCopies();
      } else {
        const errorMsg = data.message || 'সার্ভার থেকে ডাটা পাওয়া যায়নি';
        toast.error(errorMsg);
        setError(errorMsg);
      }
    } catch (error) {
      console.error('API Error:', error);
      
      // Handle axios error response
      if (error.response) {
        const errorMsg = error.response.data?.message || 'সার্ভার থেকে ডাটা পাওয়া যায়নি!';
        toast.error(errorMsg);
        setError(errorMsg);
      } else if (error.request) {
        const errorMsg = 'সার্ভার থেকে কোনো উত্তর পাওয়া যায়নি। দয়া করে আপনার ইন্টারনেট সংযোগ পরীক্ষা করুন।';
        toast.error(errorMsg);
        setError(errorMsg);
      } else {
        const errorMsg = error.message || 'কিছু সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।';
        toast.error(errorMsg);
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNidChange = (e) => {
    const value = e.target.value;
    // Remove any non-digit characters
    const cleanedValue = value.replace(/\D/g, '');
    setNid(cleanedValue);
  };

  // SIMPLE DATE INPUT - NO AUTO-FORMATTING
  const handleDobChange = (e) => {
    setDob(e.target.value);
  };
  
  // -------------------------------notice-funtion-----------------------
  const [noticeLoading, setNoticeLoading] = useState(true);
  const [notice, setNotice] = useState('');
  
  // Fetch notice from backend
  useEffect(() => {
    fetchNotice();
  }, []);

  const fetchNotice = async () => {
    try {
      setNoticeLoading(true);
      const response = await axios.get(`${base_url}/api/user/service/notice/server-copy-unofficial`);
      if (response.data) {
        setNotice(response.data.service);
      } else {
        setNotice('⚠️ নোটিশঃ ফরম নং হলে NIDFN জন্মতারিখ তারিখ এবং ১৩ ডিজিট হলে জন্মসাল যোগ অর্ডার করবেন');
      }
    } catch (error) {
      console.error('Error fetching notice:', error);
      setNotice('⚠️ নোটিশঃ ফরম নং হলে NIDFN জন্মতারিখ তারিখ এবং ১৩ ডিজিট হলে জন্মসাল যোগ অর্ডার করবেন');
    } finally {
      setNoticeLoading(false);
    }
  };

  // -------------------------------Table Functions (EXACT SAME as Signtoserver)-----------------------
  
  // Format date function (same as Signtoserver)
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Filter server copies based on search term (same as Signtoserver)
  const filteredServerCopies = serverCopies.filter(copy => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (copy.orderId && copy.orderId.toLowerCase().includes(searchLower)) ||
      (copy.nameBangla && copy.nameBangla.toLowerCase().includes(searchLower)) ||
      (copy.nameEnglish && copy.nameEnglish.toLowerCase().includes(searchLower)) ||
      (copy.nationalId && copy.nationalId.includes(searchTerm)) ||
      (copy.nid && copy.nid.includes(searchTerm))
    );
  });

  // Pagination (same as Signtoserver)
  const totalPages = Math.ceil(filteredServerCopies.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentServerCopies = filteredServerCopies.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Delete functions (same as Signtoserver)
  const confirmDelete = (receipt) => {
    setReceiptToDelete(receipt);
    setShowDeletePopup(true);
  };

  const cancelDelete = () => {
    setShowDeletePopup(false);
    setReceiptToDelete(null);
  };

  const deleteReceipt = async () => {
    if (!receiptToDelete) return;
    
    try {
      setDeletingId(receiptToDelete._id);
      const response = await axios.delete(`${base_url}/api/user/server-copy-unofficial/${receiptToDelete._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'userId': userId
        }
      });
      
      if (response.data && response.data.success) {
        toast.success('সার্ভার কপি সফলভাবে ডিলিট করা হয়েছে');
        // Refresh the list
        fetchServerCopies();
      } else {
        toast.error(response.data?.message || 'ডিলিট করতে ব্যর্থ হয়েছে');
      }
    } catch (err) {
      console.error('Delete error:', err);
      toast.error(err.response?.data?.message || 'ডিলিট করতে ব্যর্থ হয়েছে');
    } finally {
      setShowDeletePopup(false);
      setReceiptToDelete(null);
      setDeletingId(null);
    }
  };


  const ActionButtons = ({ receipt }) => (
    <div className="flex items-center justify-center gap-2">
      {/* v1 Button */}
      <NavLink
        to={`/auto-services/server-copy-unofficial-download/v1/${receipt.orderId}`}
        className={`px-2 py-1 rounded text-base font-medium border-[1px] border-blue-500 hover:transition-colors duration-200 cursor-pointer ${isDarkMode
          ? 'bg-blue-900/30 hover:bg-blue-800 text-blue-300'
          : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
        }`}
        title="v1 ডাউনলোড"
      >
        v1
      </NavLink>
      
      {/* v2 Button */}
      <NavLink
        to={`/auto-services/server-copy-unofficial-download/v2/${receipt.orderId}`}
        className={`px-2 py-1 rounded text-base font-medium border-[1px] border-green-500 hover:transition-colors duration-200 cursor-pointer ${isDarkMode
          ? 'bg-green-900/30 hover:bg-green-800 text-green-300'
          : 'bg-green-100 hover:bg-green-200 text-green-600'
        }`}
        title="v2 ডাউনলোড"
      >
        v2
      </NavLink>
      
      {/* v3 Button */}
      <NavLink
        to={`/auto-services/server-copy-unofficial-download/v3/${receipt.orderId}`}
        className={`px-2 py-1 rounded text-base font-medium border-[1px] border-purple-500 hover:transition-colors duration-200 cursor-pointer ${isDarkMode
          ? 'bg-purple-900/30 hover:bg-purple-800 text-purple-300'
          : 'bg-purple-100 hover:bg-purple-200 text-purple-600'
        }`}
        title="v3 ডাউনলোড"
      >
        v3
      </NavLink>
      
      {/* Delete Button (only for pending status) */}
    <button
        onClick={() => confirmDelete(receipt)}
        className={`p-1.5 rounded hover:transition-colors duration-200 border-[1px] border-red-500 cursor-pointer ${isDarkMode
            ? 'bg-red-900/30 hover:bg-red-800 text-red-300'
            : 'bg-red-100 hover:bg-red-200 text-red-600'
          }`}
        title="ডিলিট করুন"
      >
        <FaTrash size={16} />
      </button>
    </div>
  );
  // View order details
  const viewOrderDetails = (receipt) => {
    if (receipt.data) {
      const dataStr = JSON.stringify(receipt.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `server_copy_${receipt.nid || receipt.nationalId || 'order'}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      toast.error('এই অর্ডারের ডাটা পাওয়া যায়নি');
    }
  };

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: isDarkMode ? '#1f2937' : '#ffffff',
            color: isDarkMode ? '#ffffff' : '#1f2937',
            border: `1px solid ${isDarkMode ? '#01B1F3' : '#01B1F3'}`,
            boxShadow: '0 4px 12px rgba(1, 177, 243, 0.15)',
          },
          success: {
            iconTheme: {
              primary: '#01B1F3',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          },
        }}
      />

      <div className={`font-anek lg:ml-72 mt-[9vh] min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-[#f4f6f9] text-gray-700'}`}>
        <Header toggleSidebar={toggleSidebar} />
        <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />

        <main className="min-h-[91vh] p-4 md:p-6">
          {/* Top Label */}
          <div className="flex justify-between items-center mb-3">
            <h1 className={`text-lg md:text-[23px] font-bold ${isDarkMode ? 'text-theme_color' : 'text-theme_color'}`}>
              সার্ভার কপি Unofficial
            </h1>
          </div>
      
          {/* Notice Box */}
          <div className={`border rounded-md p-2 mb-6 transition-colors duration-300 ${
            isDarkMode 
              ? 'border-theme_color bg-gray-800' 
              : 'border-theme_color bg-white'
          }`}>
            <div className="flex items-center justify-between">
              <marquee className={`text-sm md:text-[17px] flex-1 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {notice}
              </marquee>
              <div className={`w-4 h-4 rounded-full flex items-center justify-center ml-2 flex-shrink-0 transition-colors duration-300 ${
                isDarkMode ? 'bg-green-600' : 'bg-green-500'
              }`}>
                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className={`mb-4 p-3 rounded border flex items-center gap-2 ${isDarkMode 
              ? 'bg-green-900/30 border-green-800/50 text-green-300' 
              : 'bg-green-100 text-green-700 border-green-200'}`}>
              <FaCheckCircle size={18} />
              <span className="text-sm">{success}</span>
              <button onClick={() => setSuccess('')} className="ml-auto">
                <FaTimes size={18} />
              </button>
            </div>
          )}
          
          {error && (
            <div className={`mb-4 p-3 rounded border flex items-center gap-2 ${isDarkMode 
              ? 'bg-red-900/30 border-red-800/50 text-red-300' 
              : 'bg-red-100 text-red-700 border-red-200'}`}>
              <FaExclamationTriangle size={18} />
              <span className="text-sm">{error}</span>
              <button onClick={() => setError('')} className="ml-auto">
                <FaTimes size={18} />
              </button>
            </div>
          )}

          {/* Main Form Card */}
          <div className={`w-full p-6 border shadow-sm rounded-lg mb-6 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            
            {/* Form Header with Price */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className={`text-xl font-bold flex items-center gap-2 ${isDarkMode ? 'text-theme_color' : 'text-theme_color'}`}>
                  <FaServer /> {serviceName}
                </h2>
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  আপনার এনআইডি থেকে সার্ভার কপি সংগ্রহ করুন
                </p>
              </div>
              {priceLoading ? (
                <FaSpinner className="animate-spin text-xl text-theme_color" />
              ) : (
                <div className={`text-right ${isDarkMode ? 'text-theme_color' : 'text-theme_color'}`}>
                  <p className="text-sm opacity-90">সেবা মূল্য</p>
                  <p className="text-2xl font-bold">{servicePrice}৳</p>
                </div>
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* NID Input */}
              <div className="space-y-2">
                <label className={`flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <FaIdCard className="text-theme_color" />
                  এনআইডি নম্বর <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={nid}
                    onChange={handleNidChange}
                    placeholder="10, 13 অথবা 17 ডিজিটের এনআইডি নম্বর লিখুন" 
                    className={`w-full border rounded-lg py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-theme_color transition-all duration-200 ${isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 placeholder-gray-500'}`}
                    maxLength="17"
                    disabled={loading}
                  />
                  <div className="absolute right-4 top-3.5">
                    <FaIdCard className={isDarkMode ? 'text-gray-400' : 'text-gray-400'} />
                  </div>
                </div>
                <p className={`text-xs mt-2 flex items-center gap-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <FaInfoCircle /> ১০, ১৩ বা ১৭ সংখ্যার এনআইডি নম্বর দিন (স্পেস ছাড়া)
                </p>
              </div>

              {/* Date of Birth Input */}
              <div className="space-y-2">
                <label className={`flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <FaCalendarAlt className="text-theme_color" />
                  জন্ম তারিখ <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={dob}
                    onChange={handleDobChange}
                    placeholder="জন্ম তারিখ লিখুন (উদাহরণ: 1989-04-03, 03/04/1989, 03-04-1989)" 
                    className={`w-full border rounded-lg py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-theme_color transition-all duration-200 ${isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 placeholder-gray-500'}`}
                    disabled={loading}
                  />
                  <div className="absolute right-4 top-3.5">
                    <FaCalendarAlt className={isDarkMode ? 'text-gray-400' : 'text-gray-400'} />
                  </div>
                </div>
                <p className={`text-xs mt-2 flex items-center gap-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <FaInfoCircle /> তারিখ লিখুন: 1989-04-03, 03/04/1989, 03-04-1989, ইত্যাদি
                </p>
              </div>

              {/* Submit Button */}
              <button 
                type="submit"
                disabled={loading}
                className={`w-full ${loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-theme_color hover:bg-blue-600'} 
                  text-white font-bold py-3 rounded-lg transition-all duration-300 text-sm shadow hover:shadow-lg mt-2 flex items-center justify-center gap-3`}
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin h-5 w-5" />
                    <span>ডাটা সংগ্রহ করা হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <span>সার্ভার কপি সংগ্রহ করুন</span>
                    <FaArrowRight />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Previous Server Copies Table - EXACT SAME as Signtoserver */}
          <div className={`w-full p-6 border shadow-sm rounded-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-lg md:text-xl font-bold ${isDarkMode ? 'text-theme_color' : 'text-theme_color'}`}>
                পূর্ববর্তী সার্ভার কপি তালিকা
              </h2>

              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="সার্ভার কপি খুঁজুন..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className={`pl-10 pr-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-theme_color ${isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-700'
                    }`}
                />
                <FaSearch
                  className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                />
              </div>
            </div>

            {/* Data Table - EXACT SAME STRUCTURE */}
            <div className="overflow-x-auto">
              {loadingCopies ? (
                <div className="flex justify-center items-center py-12">
                  <FaSpinner className="animate-spin text-4xl text-theme_color" />
                </div>
              ) : (
                <table className="w-full text-center border-collapse border-[1px] border-gray-200">
                  <thead>
                    <tr className={`text-nowrap border-t border-b transition-colors duration-300 ${isDarkMode
                        ? 'bg-green-900/20 border-gray-700'
                        : 'bg-[#d1f2eb] border-gray-300'
                      }`}>
                      <th className={`p-3 text-xs font-semibold uppercase tracking-wider border-r transition-colors duration-300 ${isDarkMode
                          ? 'text-gray-300 border-gray-700'
                          : 'text-gray-600 border-gray-200'
                        }`}>
                        ক্রম
                      </th>
                      <th className={`p-3 text-sm font-semibold border-r transition-colors duration-300 ${isDarkMode
                          ? 'text-gray-300 border-gray-700'
                          : 'text-gray-600 border-gray-200'
                        }`}>
                        এনআইডি নম্বর
                      </th>
                      <th className={`p-3 text-sm font-semibold border-r transition-colors duration-300 ${isDarkMode
                          ? 'text-gray-300 border-gray-700'
                          : 'text-gray-600 border-gray-200'
                        }`}>
                        জন্ম তারিখ
                      </th>
                      <th className={`p-3 text-sm font-semibold border-r transition-colors duration-300 ${isDarkMode
                          ? 'text-gray-300 border-gray-700'
                          : 'text-gray-600 border-gray-200'
                        }`}>
                        পরিষেবা মূল্য
                      </th>
                      <th className={`p-3 text-sm font-semibold border-r transition-colors duration-300 ${isDarkMode
                          ? 'text-gray-300 border-gray-700'
                          : 'text-gray-600 border-gray-200'
                        }`}>
                        তারিখ
                      </th>
                      <th className={`p-3 text-sm font-semibold transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                        অ্যাকশন
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentServerCopies.length === 0 ? (
                      <tr className="">
                        <td colSpan="6" className="p-8 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <FaFile className={isDarkMode ? 'text-gray-600' : 'text-gray-400'} size={48} />
                            <p className={`font-medium mb-2 transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                              কোন সার্ভার কপি পাওয়া যায়নি
                            </p>
                            <p className={`text-sm max-w-md transition-colors duration-300 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'
                              }`}>
                              {searchTerm ? 'আপনার সার্চের সাথে মিলছে এমন কোনো সার্ভার কপি নেই' : 'আপনার প্রথম সার্ভার কপি এখনই তৈরি করুন!'}
                            </p>
                            {searchTerm && (
                              <button
                                onClick={() => setSearchTerm('')}
                                className="mt-4 text-sm bg-theme_color text-white px-4 py-2 rounded-sm cursor-pointer"
                              >
                                সার্চ ক্লিয়ার করুন
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      currentServerCopies.map((copy, index) => (
                        <tr
                          key={copy._id || index}
                          className={`border-b hover:transition-colors duration-300 ${index % 2 === 0
                              ? isDarkMode ? 'bg-gray-800/30 hover:bg-gray-800/50' : 'bg-white hover:bg-gray-50'
                              : isDarkMode ? 'bg-gray-900/30 hover:bg-gray-900/50' : 'bg-gray-50 hover:bg-gray-100'
                            } ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
                        >
                          <td className={`p-3 text-sm font-medium border-r transition-colors duration-300 ${isDarkMode
                              ? 'text-gray-300 border-gray-700'
                              : 'text-gray-700 border-gray-200'
                            }`}>
                            {startIndex + index + 1}
                          </td>
                          <td className={`p-3 text-sm border-r transition-colors duration-300 ${isDarkMode
                              ? 'text-gray-200 border-gray-700'
                              : 'text-gray-800 border-gray-200'
                            }`}>
                            <div className="font-semibold">{copy.nid || copy.nationalId || 'N/A'}</div>
                          </td>
                          <td className={`p-3 text-sm border-r transition-colors duration-300 ${isDarkMode
                              ? 'text-gray-200 border-gray-700'
                              : 'text-gray-800 border-gray-200'
                            }`}>
                            {copy.dob || copy.birthDate || 'N/A'}
                          </td>
                          <td className={`p-3 text-sm border-r transition-colors duration-300 ${isDarkMode
                              ? 'text-gray-200 border-gray-700'
                              : 'text-gray-800 border-gray-200'
                            }`}>
                            <span className="font-bold">{copy.amount || copy.servicePrice || servicePrice}৳</span>
                          </td>
                          <td className={`p-3 text-sm text-nowrap border-r transition-colors duration-300 ${isDarkMode
                              ? 'text-gray-400 border-gray-700'
                              : 'text-gray-600 border-gray-200'
                            }`}>
                            <div className="flex items-center justify-center gap-1">
                              <FaCalendar size={12} />
                              {formatDate(copy.createdAt)}
                            </div>
                          </td>
                          <td className="p-3">
                            <ActionButtons receipt={copy} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination - EXACT SAME as Signtoserver */}
            {filteredServerCopies.length > 0 && (
              <div className={`flex flex-wrap justify-between items-center mt-4 pt-4 border-t text-sm transition-colors duration-300 ${isDarkMode
                  ? 'border-gray-700 text-gray-400'
                  : 'border-gray-200 text-gray-500'
                }`}>
                <div className="mb-3 md:mb-0">
                  প্রদর্শন <span className={`font-bold transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                    {startIndex + 1}
                  </span> থেকে{' '}
                  <span className={`font-bold transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                    {Math.min(endIndex, filteredServerCopies.length)}
                  </span> এর{' '}
                  <span className={`font-bold transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                    {filteredServerCopies.length}
                  </span> টি সার্ভার কপি
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className={`p-2 border rounded hover:transition-colors duration-200 cursor-pointer ${isDarkMode
                        ? 'border-gray-700 hover:bg-gray-800 disabled:opacity-50'
                        : 'border-gray-200 hover:bg-gray-50 disabled:opacity-50'
                      } disabled:cursor-not-allowed`}
                  >
                    <IoIosArrowBack size={14} />
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`p-2 border rounded hover:transition-colors duration-200 cursor-pointer ${isDarkMode
                        ? 'border-gray-700 hover:bg-gray-800 disabled:opacity-50'
                        : 'border-gray-200 hover:bg-gray-50 disabled:opacity-50'
                      } disabled:cursor-not-allowed`}
                  >
                    <IoIosArrowBack size={14} />
                  </button>

                  {/* Page Numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-1 border rounded transition duration-200 cursor-pointer ${currentPage === pageNum
                            ? 'bg-[#00a65a] text-white border-[#00a65a]'
                            : isDarkMode
                              ? 'border-gray-700 hover:bg-gray-800'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`p-2 border rounded hover:transition-colors duration-200 cursor-pointer ${isDarkMode
                        ? 'border-gray-700 hover:bg-gray-800 disabled:opacity-50'
                        : 'border-gray-200 hover:bg-gray-50 disabled:opacity-50'
                      } disabled:cursor-not-allowed`}
                  >
                    <IoIosArrowForward size={14} />
                  </button>
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className={`p-2 border rounded hover:transition-colors duration-200 cursor-pointer ${isDarkMode
                        ? 'border-gray-700 hover:bg-gray-800 disabled:opacity-50'
                        : 'border-gray-200 hover:bg-gray-50 disabled:opacity-50'
                      } disabled:cursor-not-allowed`}
                  >
                    <IoIosArrowForward size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Delete Confirmation Popup - EXACT SAME as Signtoserver */}
      {showDeletePopup && receiptToDelete && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.7)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
          <div className={`rounded-xl p-4 md:p-6 max-w-md w-full shadow-xl transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="text-center">
              <div className={`mx-auto flex items-center justify-center h-12 w-12 md:h-14 md:w-14 rounded-full mb-3 md:mb-4 ${isDarkMode ? 'bg-red-900/40' : 'bg-red-100'}`}>
                <svg className="h-6 w-6 md:h-7 md:w-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>

              <h3 className={`text-lg md:text-xl font-bold mb-2 transition-colors duration-300 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                সার্ভার কপি ডিলিট করুন
              </h3>

              <p className={`text-xs md:text-sm mb-3 md:mb-4 transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                আপনি কি নিশ্চিত যে আপনি এই সার্ভার কপিটি ডিলিট করতে চান?
              </p>

              <div className={`rounded-lg p-3 md:p-4 mb-3 md:mb-4 border transition-colors duration-300 ${isDarkMode
                  ? 'bg-gray-700/50 border-gray-600'
                  : 'bg-gray-50 border-gray-200'
                }`}>
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <div className="text-left">
                    <p className={`text-xs transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      এনআইডি নম্বর
                    </p>
                    <p className={`font-semibold text-xs md:text-sm truncate transition-colors duration-300 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      {receiptToDelete.nid || receiptToDelete.nationalId || 'N/A'}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className={`text-xs transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      জন্ম তারিখ
                    </p>
                    <p className={`font-semibold text-xs md:text-sm truncate transition-colors duration-300 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      {receiptToDelete.dob || receiptToDelete.birthDate || 'N/A'}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className={`text-xs transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      মূল্য
                    </p>
                    <p className={`font-semibold text-xs md:text-sm truncate transition-colors duration-300 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      {receiptToDelete.amount || receiptToDelete.servicePrice || servicePrice}৳
                    </p>
                  </div>
                  <div className="text-left">
                    <p className={`text-xs transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      তারিখ
                    </p>
                    <p className={`font-semibold text-xs md:text-sm transition-colors duration-300 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      {formatDate(receiptToDelete.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 md:gap-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-3 md:py-2.5 md:px-4 rounded-lg transition duration-200 text-xs md:text-sm cursor-pointer"
                >
                  বাতিল করুন
                </button>
                <button
                  onClick={deleteReceipt}
                  disabled={deletingId === receiptToDelete._id}
                  className={`flex-1 font-semibold py-2 px-3 md:py-2.5 md:px-4 rounded-lg transition duration-200 text-xs md:text-sm cursor-pointer ${deletingId === receiptToDelete._id
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                >
                  {deletingId === receiptToDelete._id ? (
                    <span className="flex items-center justify-center gap-1.5">
                      ডিলিট হচ্ছে...
                    </span>
                  ) : (
                    'ডিলিট করুন'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Servercopy;