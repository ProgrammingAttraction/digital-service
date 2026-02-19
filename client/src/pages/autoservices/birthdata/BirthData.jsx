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
  FaCalendar,
  FaCopy,
  FaUser,
  FaVenusMars,
  FaMapMarkerAlt,
  FaQrcode,
  FaBarcode,
  FaPrint,
  FaUserFriends,
  FaMapPin,
  FaGlobe,
  FaPhone,
  FaEnvelope,
  FaWhatsapp
} from 'react-icons/fa';
import { IoIosArrowBack } from "react-icons/io";
import { IoIosArrowForward } from "react-icons/io";
import { NavLink } from 'react-router-dom';

function BirthData() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [priceLoading, setPriceLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [servicePrice, setServicePrice] = useState(0);
  const [serviceName, setServiceName] = useState('জন্ম নিবন্ধন তথ্য');

  // Popup states
  const [showDataPopup, setShowDataPopup] = useState(false);
  const [foundData, setFoundData] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  
  // New state for confirmed data popup
  const [showConfirmedDataPopup, setShowConfirmedDataPopup] = useState(false);
  const [confirmedData, setConfirmedData] = useState(null);

  const { isDarkMode } = useTheme();
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user?.id;

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  // Fetch service price on component mount
  useEffect(() => {
    fetchServicePrice();
  }, []);

  const fetchServicePrice = async () => {
    try {
      setPriceLoading(true);
      const response = await axios.get(`${base_url}/api/user/service/price/birth-data`);
      if (response.data) {
        setServicePrice(response.data.price);
        setServiceName(response.data.serviceName || 'জন্ম নিবন্ধন তথ্য');
      }
    } catch (error) {
      console.error('Error fetching service price:', error);
      setServicePrice(10); // Default fallback price
    } finally {
      setPriceLoading(false);
    }
  };

  // Handle first route - Search by name
  const handleSearchByName = async (searchName) => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(`${base_url}/api/user/birth-certificate-data/search-by-name`, {
        params: { name: searchName },
        headers: {
          'Authorization': `Bearer ${token}`,
          'userId': userId
        }
      });

      if (response.data && response.data.success) {
        // Show popup with found data
        setFoundData(response.data.data[0]); // Take first match
        setShowDataPopup(true);
      } else {
        toast.error('এই নামে কোনো জন্ম নিবন্ধন তথ্য পাওয়া যায়নি');
      }
    } catch (error) {
      console.error('Search error:', error);
      if (error.response && error.response.status === 404) {
        toast.error('এই নামে কোনো জন্ম নিবন্ধন তথ্য পাওয়া যায়নি');
      } else {
        toast.error(error.response?.data?.message || 'তথ্য অনুসন্ধানে ব্যর্থ হয়েছে');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle second route - Confirm and deduct balance
  const handleConfirmData = async () => {
    if (!foundData) return;

    // Check if user has sufficient balance
    if (user.balance < servicePrice) {
      toast.error('পর্যাপ্ত ব্যালেন্স নেই। দয়া করে রিচার্জ করুন।');
      return;
    }

    try {
      setConfirmLoading(true);
      const response = await axios.get(`${base_url}/api/user/birth-certificate-data/confirmed`, {
        params: { 
          name: foundData.nameBangla || foundData.nameEnglish,
          serviceprice: servicePrice
        },
        headers: {
          'Authorization': `Bearer ${token}`,
          'userId': userId
        }
      });

      if (response.data && response.data.success) {
        // Update user balance in localStorage
        if (user) {
          const newBalance = (user.balance || 0) - servicePrice;
          user.balance = newBalance;
          localStorage.setItem('user', JSON.stringify(user));
        }

        toast.success('তথ্য সফলভাবে নিশ্চিত করা হয়েছে!');
        
        // Store confirmed data from response
        const confirmedDataFromResponse = response.data.data[0] || response.data.data;
        setConfirmedData(confirmedDataFromResponse);
        
        // Close first popup
        setShowDataPopup(false);
        
        // Show confirmed data popup
        setShowConfirmedDataPopup(true);
        
        // Set success message
        setSuccess('তথ্য সফলভাবে প্রাপ্ত হয়েছে');
      }
    } catch (error) {
      console.error('Confirmation error:', error);
      toast.error(error.response?.data?.message || 'নিশ্চিত করতে ব্যর্থ হয়েছে');
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!name.trim()) {
      toast.error('দয়া করে নাম লিখুন');
      setError('দয়া করে নাম লিখুন');
      return;
    }

    // Check if user has sufficient balance for preview
    if (user.balance < servicePrice) {
      toast.error('পর্যাপ্ত ব্যালেন্স নেই। দয়া করে রিচার্জ করুন।');
      return;
    }

    // First search by name
    await handleSearchByName(name);
  };

  const handleNameChange = (e) => {
    setName(e.target.value);
  };

  const closePopup = () => {
    setShowDataPopup(false);
    setFoundData(null);
  };

  const closeConfirmedPopup = () => {
    setShowConfirmedDataPopup(false);
    setConfirmedData(null);
  };

  // Copy text to clipboard
  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} কপি করা হয়েছে`);
  };

  // Copy all data to clipboard
  const copyAllData = () => {
    if (!confirmedData) return;
    
    const dataText = `
জন্ম নিবন্ধন তথ্য
-------------------
জন্ম নিবন্ধন নম্বর: ${confirmedData.birthRegistrationNumber || 'N/A'}
নাম (বাংলা): ${confirmedData.nameBangla || 'N/A'}
নাম (ইংরেজি): ${confirmedData.nameEnglish || 'N/A'}
জন্ম তারিখ: ${formatDate(confirmedData.dateOfBirth)}
    `.trim();
    
    navigator.clipboard.writeText(dataText);
    toast.success('সমস্ত তথ্য কপি করা হয়েছে');
  };

  // Format date for display
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
      const response = await axios.get(`${base_url}/api/user/service/notice/birth-data`);
      if (response.data) {
        setNotice(response.data.service);
      } else {
        setNotice('⚠️ নোটিশঃ নাম দিয়ে জন্ম নিবন্ধন তথ্য খুঁজুন এবং নিশ্চিত করুন');
      }
    } catch (error) {
      console.error('Error fetching notice:', error);
      setNotice('⚠️ নোটিশঃ নাম দিয়ে জন্ম নিবন্ধন তথ্য খুঁজুন এবং নিশ্চিত করুন');
    } finally {
      setNoticeLoading(false);
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
              জন্ম নিবন্ধন তথ্য
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
                  নাম দিয়ে জন্ম নিবন্ধন তথ্য সংগ্রহ করুন
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
              {/* Name Input */}
              <div className="space-y-2">
                <label className={`flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <FaUser className="text-theme_color" />
                  নাম <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={name}
                    onChange={handleNameChange}
                    placeholder="বাংলা বা ইংরেজিতে নাম লিখুন" 
                    className={`w-full border rounded-lg py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-theme_color transition-all duration-200 ${isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 placeholder-gray-500'}`}
                    disabled={loading}
                  />
                  <div className="absolute right-4 top-3.5">
                    <FaUser className={isDarkMode ? 'text-gray-400' : 'text-gray-400'} />
                  </div>
                </div>
                <p className={`text-xs mt-2 flex items-center gap-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <FaInfoCircle /> যে নাম দিয়ে নিবন্ধন করা হয়েছে সেই নাম লিখুন
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
                    <span>অনুসন্ধান করা হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <span>তথ্য অনুসন্ধান করুন</span>
                    <FaArrowRight />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Found Data Display (if any after confirmation) */}
          {foundData && !showDataPopup && !showConfirmedDataPopup && (
            <div className={`w-full p-6 border shadow-sm rounded-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <h2 className={`text-lg md:text-xl font-bold mb-4 ${isDarkMode ? 'text-theme_color' : 'text-theme_color'}`}>
                প্রাপ্ত তথ্য
              </h2>
              
              <div className="grid grid-cols-1 gap-4">
                {/* Personal Information */}
                <div className={`p-4 rounded-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <FaUser className="text-theme_color" /> ব্যক্তিগত তথ্য
                  </h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">জন্ম নিবন্ধন নম্বর:</span> {foundData.birthRegistrationNumber || 'N/A'}</p>
                    <p><span className="font-medium">জন্ম তারিখ:</span> {formatDate(foundData.dateOfBirth)}</p>
                    <p><span className="font-medium">নাম (বাংলা):</span> {foundData.nameBangla || 'N/A'}</p>
                    <p><span className="font-medium">নাম (ইংরেজি):</span> {foundData.nameEnglish || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Data Confirmation Popup - First Popup */}
      {showDataPopup && foundData && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.7)] font-anek bg-opacity-50 flex items-center justify-center z-[10000] p-4 overflow-y-auto">
          <div className={`rounded-xl p-4 md:p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-xl font-bold flex items-center gap-2 ${isDarkMode ? 'text-theme_color' : 'text-theme_color'}`}>
                <FaCheckCircle /> পাওয়া তথ্য
              </h2>
              <button
                onClick={closePopup}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <FaTimes size={20} />
              </button>
            </div>

            <p className={`mb-4 p-3 rounded ${isDarkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
              নিম্নলিখিত তথ্য পাওয়া গেছে। আপনি কি এই তথ্যটি নিশ্চিত করতে চান? নিশ্চিত করলে আপনার অ্যাকাউন্ট থেকে {servicePrice}৳ কাটা হবে।
            </p>

            {/* Found Data Display in Popup */}
            <div className={`mb-6 p-4 rounded-lg border ${isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
              <h3 className={`font-semibold mb-4 flex items-center gap-2 text-lg ${isDarkMode ? 'text-theme_color' : 'text-theme_color'}`}>
                <FaIdCard /> জন্ম নিবন্ধন তথ্য
              </h3>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-3">
                  <div className={`p-3 rounded ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <p className="text-sm opacity-70 mb-1">নাম (বাংলা)</p>
                    <p className="font-semibold flex items-center gap-2 text-lg">
                      {foundData.nameBangla || 'N/A'}
                      {foundData.nameBangla && (
                        <button 
                          onClick={() => copyToClipboard(foundData.nameBangla, 'নাম (বাংলা)')}
                          className="text-theme_color hover:text-blue-700"
                        >
                          <FaCopy size={14} />
                        </button>
                      )}
                    </p>
                  </div>
                  
                  <div className={`p-3 rounded ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <p className="text-sm opacity-70 mb-1">নাম (ইংরেজি)</p>
                    <p className="font-semibold flex items-center gap-2">
                      {foundData.nameEnglish || 'N/A'}
                      {foundData.nameEnglish && (
                        <button 
                          onClick={() => copyToClipboard(foundData.nameEnglish, 'নাম (ইংরেজি)')}
                          className="text-theme_color hover:text-blue-700"
                        >
                          <FaCopy size={14} />
                        </button>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={closePopup}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold rounded-lg transition duration-200 text-sm cursor-pointer"
              >
                বাতিল করুন
              </button>
              <button
                onClick={handleConfirmData}
                disabled={confirmLoading || user.balance < servicePrice}
                className={`px-4 py-2 font-semibold rounded-lg transition duration-200 text-sm cursor-pointer flex items-center gap-2 ${
                  confirmLoading || user.balance < servicePrice
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-theme_color hover:bg-blue-600 text-white'
                }`}
              >
                {confirmLoading ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    <span>নিশ্চিত করা হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <span>নিশ্চিত করুন ({servicePrice}৳)</span>
                    <FaCheckCircle />
                  </>
                )}
              </button>
            </div>

            {user.balance < servicePrice && (
              <p className="mt-2 text-sm text-red-500 text-right">
                পর্যাপ্ত ব্যালেন্স নেই। দয়া করে রিচার্জ করুন।
              </p>
            )}
          </div>
        </div>
      )}

      {/* Confirmed Data Popup - Second Popup with Copy Functionality */}
      {showConfirmedDataPopup && confirmedData && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.7)] font-anek bg-opacity-50 flex items-center justify-center z-[10000] p-4 overflow-y-auto">
          <div className={`rounded-xl p-4 md:p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-xl font-bold flex items-center gap-2 ${isDarkMode ? 'text-theme_color' : 'text-theme_color'}`}>
                <FaCheckCircle /> নিশ্চিতকৃত জন্ম নিবন্ধন তথ্য
              </h2>
              <button
                onClick={closeConfirmedPopup}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <FaTimes size={20} />
              </button>
            </div>

            <p className={`mb-4 p-3 rounded flex items-center gap-2 ${isDarkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700'}`}>
              <FaCheckCircle /> আপনার তথ্য সফলভাবে নিশ্চিত করা হয়েছে। নিচের তথ্য কপি করে নিন।
            </p>

            {/* Copy All Button */}
            <div className="mb-4 flex justify-end">
              <button
                onClick={copyAllData}
                className="px-4 py-2 bg-theme_color hover:bg-blue-600 text-white font-semibold rounded-lg transition duration-200 text-sm cursor-pointer flex items-center gap-2"
              >
                <FaCopy /> সব তথ্য কপি করুন
              </button>
            </div>

            {/* Confirmed Data Display */}
            <div className={`mb-6 p-4 rounded-lg border ${isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
              <h3 className={`font-semibold mb-4 flex items-center gap-2 text-lg ${isDarkMode ? 'text-theme_color' : 'text-theme_color'}`}>
                <FaIdCard /> জন্ম নিবন্ধন তথ্য
              </h3>
              
              <div className="">
                {/* Left Column */}
                <div className="space-y-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`p-3 rounded ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <p className="text-sm opacity-70 mb-1">জন্ম নিবন্ধন নম্বর</p>
                    <p className="font-semibold flex items-center gap-2 text-lg">
                      {confirmedData.birthRegistrationNumber || 'N/A'}
                      {confirmedData.birthRegistrationNumber && (
                        <button 
                          onClick={() => copyToClipboard(confirmedData.birthRegistrationNumber, 'জন্ম নিবন্ধন নম্বর')}
                          className="text-theme_color hover:text-blue-700"
                        >
                          <FaCopy size={14} />
                        </button>
                      )}
                    </p>
                  </div>

                  <div className={`p-3 rounded ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <p className="text-sm opacity-70 mb-1">নাম (বাংলা)</p>
                    <p className="font-semibold flex items-center gap-2 text-lg">
                      {confirmedData.nameBangla || 'N/A'}
                      {confirmedData.nameBangla && (
                        <button 
                          onClick={() => copyToClipboard(confirmedData.nameBangla, 'নাম (বাংলা)')}
                          className="text-theme_color hover:text-blue-700"
                        >
                          <FaCopy size={14} />
                        </button>
                      )}
                    </p>
                  </div>
                  
                  <div className={`p-3 rounded ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <p className="text-sm opacity-70 mb-1">নাম (ইংরেজি)</p>
                    <p className="font-semibold flex items-center gap-2">
                      {confirmedData.nameEnglish || 'N/A'}
                      {confirmedData.nameEnglish && (
                        <button 
                          onClick={() => copyToClipboard(confirmedData.nameEnglish, 'নাম (ইংরেজি)')}
                          className="text-theme_color hover:text-blue-700"
                        >
                          <FaCopy size={14} />
                        </button>
                      )}
                    </p>
                  </div>
                       <div className={`p-3 rounded ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <p className="text-sm opacity-70 mb-1">জন্ম তারিখ</p>
                    <p className="font-semibold flex items-center gap-2">
                      {formatDate(confirmedData.dateOfBirth)}
                      {confirmedData.dateOfBirth && (
                        <button 
                          onClick={() => copyToClipboard(formatDate(confirmedData.dateOfBirth), 'জন্ম তারিখ')}
                          className="text-theme_color hover:text-blue-700"
                        >
                          <FaCopy size={14} />
                        </button>
                      )}
                    </p>
                  </div>
                </div>
                
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={closeConfirmedPopup}
                className="px-4 py-2 bg-theme_color hover:bg-blue-600 text-white font-semibold rounded-lg transition duration-200 text-sm cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default BirthData;