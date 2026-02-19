import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Header from '../../../components/header/Header';
import Sidebar from '../../../components/sidebar/Sidebar';
import { useTheme } from '../../../context/ThemeContext';
import { useUser } from '../../../context/UserContext'; // Import useUser hook
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
  FaFileAlt,
  FaQrcode,
  FaDatabase,
  FaDownload,
  FaCopy,
  FaEye,
  FaTrash,
  FaFile,
  FaCalendar,
  FaTimes
} from 'react-icons/fa';
import { IoIosArrowBack } from "react-icons/io";
import { IoIosArrowForward } from "react-icons/io";

function Autotincertificate() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tinNumber, setTinNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [priceLoading, setPriceLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [servicePrice, setServicePrice] = useState(0);
  const [serviceName, setServiceName] = useState('টিন সার্টিফিকেট');
  const [certificateData, setCertificateData] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [receiptId, setReceiptId] = useState('');
  const [verificationUrl, setVerificationUrl] = useState('');
  const [qrCodeData, setQrCodeData] = useState('');
  const [transactionInfo, setTransactionInfo] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationData, setValidationData] = useState(null);
  
  // Table states
  const [certificates, setCertificates] = useState([]);
  const [loadingCertificates, setLoadingCertificates] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [certificateToDelete, setCertificateToDelete] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  
  // Notice states
  const [noticeLoading, setNoticeLoading] = useState(true);
  const [notice, setNotice] = useState('');
  
  // Get user data from context
  const { getUserBalance, refreshUserData } = useUser();
  const balance = getUserBalance(); // Get balance from context
  
  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user?.id;
  const { isDarkMode } = useTheme();
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const navigate = useNavigate();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  // Fetch service price and notice on component mount
  useEffect(() => {
    fetchServicePrice();
    fetchNotice();
    fetchCertificates();
  }, []);

  const fetchServicePrice = async () => {
    try {
      setPriceLoading(true);
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      const response = await axios.get(`${base_url}/api/user/service/price/auto-tin-certificate`, config);
      
      if (response.data && response.data.success) {
        setServicePrice(response.data.price);
        setServiceName(response.data.serviceName || 'টিন সার্টিফিকেট');
      }
    } catch (error) {
      console.error('Error fetching service price:', error);
      setServicePrice(100);
      setServiceName('টিন সার্টিফিকেট');
    } finally {
      setPriceLoading(false);
    }
  };

  const fetchNotice = async () => {
    try {
      setNoticeLoading(true);
      const response = await axios.get(`${base_url}/api/user/service/notice/auto-tin-certificate`);
      if (response.data) {
        setNotice(response.data.service);
      } else {
        setNotice('⚠️ নোটিশঃ সঠিক TIN নম্বর লিখুন এবং ব্যালেন্স পর্যাপ্ত আছে কিনা নিশ্চিত হোন');
      }
    } catch (error) {
      console.error('Error fetching notice:', error);
      setNotice('⚠️ নোটিশঃ সঠিক TIN নম্বর লিখুন এবং ব্যালেন্স পর্যাপ্ত আছে কিনা নিশ্চিত হোন');
    } finally {
      setNoticeLoading(false);
    }
  };

  const fetchCertificates = async () => {
    try {
      setLoadingCertificates(true);
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'userid': userId
        }
      };
      
      const response = await axios.get(`${base_url}/api/user/tin-certificate-api/all`, {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search: searchTerm
        },
        ...config
      });
      
      if (response.data && response.data.success) {
        setCertificates(response.data.data || []);
      } else {
        setCertificates([]);
      }
    } catch (err) {
      console.error('Failed to fetch certificates:', err);
      toast.error('TIN সার্টিফিকেট তালিকা লোড করতে ব্যর্থ হয়েছে');
      setCertificates([]);
    } finally {
      setLoadingCertificates(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, [currentPage, searchTerm]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation - only check if empty
    if (!tinNumber.trim()) {
      toast.error('দয়া করে TIN নম্বর দিন');
      setError('দয়া করে TIN নম্বর দিন');
      return;
    }

    // REMOVED: 12-digit validation
    // const tinRegex = /^\d{12}$/;
    // if (!tinRegex.test(tinNumber.trim())) {
    //   toast.error('TIN নম্বর ১২ সংখ্যার হতে হবে');
    //   setError('TIN নম্বর ১২ সংখ্যার হতে হবে');
    //   return;
    // }

    // Check balance from context
    if (balance < servicePrice) {
      toast.error(`অপর্যাপ্ত ব্যালেন্স। প্রয়োজন ${servicePrice}৳, আপনার ব্যালেন্স: ${balance}৳`);
      setError(`অপর্যাপ্ত ব্যালেন্স। প্রয়োজন ${servicePrice}৳, আপনার ব্যালেন্স: ${balance}৳`);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setCertificateData(null);
    setShowDetails(false);

    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      
      if (!token || !user) {
        throw new Error('ব্যবহারকারী প্রমাণীকরণ প্রয়োজন। দয়া করে আবার লগইন করুন।');
      }

      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          userId: userId
        }
      };

      const requestData = {
        tinNumber: tinNumber.trim()
      };

      // Make API call to fetch TIN certificate data
      const response = await axios.post(
        `${base_url}/api/user/tin-certificate-api/fetch`,
        requestData,
        config
      );

      const data = response.data;
      
      console.log('TIN Certificate API Response:', data);

      if (data.success) {
        const successMsg = 'TIN সার্টিফিকেট তথ্য সফলভাবে সংগ্রহ করা হয়েছে!';
        toast.success(successMsg);
        setSuccess(successMsg);
        
        // Set the data for display
        setCertificateData(data.data);
        setReceiptId(data.receiptId || '');
        setVerificationUrl(data.verificationUrl || '');
        setQrCodeData(data.qrCodeData || '');
        
        // Set transaction info if available
        if (data.transaction) {
          setTransactionInfo(data.transaction);
          
          // Update user balance by refreshing context
          refreshUserData();
          
          toast.success(`ডাটা সংগ্রহ সফল! কাটা পরিমাণ: ${data.transaction.amount}৳, নতুন ব্যালেন্স: ${data.transaction.balance}৳`);
        }
        
        // Refresh certificates list
        fetchCertificates();
        
        // Navigate to download page after a short delay
        setTimeout(() => {
          if (data.receiptId) {
            navigate(`/auto-services/tin-certificate-auto-download/${data.receiptId}`);
          }
        }, 2000);
        
      } else {
        const errorMsg = data.message || 'TIN সার্টিফিকেট তথ্য সংগ্রহ করতে ব্যর্থ হয়েছে';
        toast.error(errorMsg);
        setError(errorMsg);
      }
    } catch (error) {
      console.error('API Error:', error);
      
      // Handle axios error response
      if (error.response) {
        const errorData = error.response.data;
        const errorMsg = errorData.message || 'সার্ভার থেকে ত্রুটি পাওয়া গেছে';
        toast.error(errorMsg);
        setError(errorMsg);
        
        // Show specific error details if available
        if (errorData.error) {
          console.error('Error details:', errorData.error);
        }
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

  const handleValidateTin = async () => {
    if (!tinNumber.trim()) {
      toast.error('দয়া করে TIN নম্বর দিন');
      return;
    }

    // REMOVED: 12-digit validation
    // const tinRegex = /^\d{12}$/;
    // if (!tinRegex.test(tinNumber.trim())) {
    //   toast.error('TIN নম্বর ১২ সংখ্যার হতে হবে');
    //   return;
    // }

    setIsValidating(true);
    setValidationData(null);

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('ব্যবহারকারী প্রমাণীকরণ প্রয়োজন');
      }

      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      };

      const requestData = {
        tinNumber: tinNumber.trim(),
        checkApi: true
      };

      // Make API call to validate TIN
      const response = await axios.post(
        `${base_url}/api/user/tin-certificate-api/validate`,
        requestData,
        config
      );

      const data = response.data;
      
      if (data.success) {
        setValidationData(data.data);
        toast.success('TIN নম্বর যাচাই সম্পন্ন হয়েছে');
        
        // Update balance by refreshing context
        if (data.data.newBalance !== undefined) {
          refreshUserData();
        }
      } else {
        toast.error(data.message || 'যাচাই ব্যর্থ হয়েছে');
      }
    } catch (error) {
      console.error('Validation error:', error);
      toast.error('TIN নম্বর যাচাই করতে ব্যর্থ হয়েছে');
    } finally {
      setIsValidating(false);
    }
  };

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        toast.success('কপি করা হয়েছে');
      })
      .catch(() => {
        toast.error('কপি করতে ব্যর্থ হয়েছে');
      });
  };

  const handleDownloadQR = () => {
    if (!qrCodeData) return;
    
    try {
      // If qrCodeData is a base64 image
      if (qrCodeData.startsWith('data:image')) {
        const link = document.createElement('a');
        link.href = qrCodeData;
        link.download = `tin_qr_${tinNumber}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // If it's text QR data, create a text file
        const blob = new Blob([qrCodeData], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `tin_qr_${tinNumber}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
      
      toast.success('QR কোড ডাউনলোড করা হয়েছে');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('ডাউনলোড করতে ব্যর্থ হয়েছে');
    }
  };

  const handleDownloadCertificate = () => {
    if (!certificateData) return;
    
    try {
      const dataStr = JSON.stringify(certificateData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tin_certificate_${tinNumber}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('সার্টিফিকেট ডাউনলোড করা হয়েছে');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('ডাউনলোড করতে ব্যর্থ হয়েছে');
    }
  };

  const handleNavigateToDownload = () => {
    if (receiptId) {
      navigate(`/clone-services/tin-certificate-clone-download/${receiptId}`);
    }
  };

  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  const handleTinNumberChange = (e) => {
    const value = e.target.value;
    // Allow any number of digits (removed 12-digit restriction)
    // Remove any non-digit characters
    const cleanedValue = value.replace(/\D/g, '');
    setTinNumber(cleanedValue);
  };
  
  // Filter certificates based on search term
  const filteredCertificates = certificates.filter(cert => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (cert.receiptId && cert.receiptId.toLowerCase().includes(term)) ||
      (cert.tinNumber && cert.tinNumber.toLowerCase().includes(term)) ||
      (cert.name && cert.name.toLowerCase().includes(term)) ||
      (cert.fatherName && cert.fatherName.toLowerCase().includes(term)) ||
      (cert.city && cert.city.toLowerCase().includes(term))
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredCertificates.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCertificates = filteredCertificates.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Delete functions
  const confirmDeleteCertificate = (certificate) => {
    setCertificateToDelete(certificate);
    setShowDeletePopup(true);
  };

  const cancelDelete = () => {
    setShowDeletePopup(false);
    setCertificateToDelete(null);
  };

  const deleteCertificate = async () => {
    if (!certificateToDelete) return;
    
    try {
      setDeletingId(certificateToDelete._id);
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'userid': userId
        }
      };
      
      const response = await axios.delete(`${base_url}/api/user/tin-certificate-api/${certificateToDelete._id}`, config);
      
      if (response.data && response.data.success) {
        toast.success('TIN সার্টিফিকেট সফলভাবে ডিলিট করা হয়েছে');
        // Refresh the list
        fetchCertificates();
      } else {
        toast.error(response.data?.message || 'ডিলিট করতে ব্যর্থ হয়েছে');
      }
    } catch (err) {
      console.error('Delete error:', err);
      toast.error(err.response?.data?.message || 'ডিলিট করতে ব্যর্থ হয়েছে');
    } finally {
      setShowDeletePopup(false);
      setCertificateToDelete(null);
      setDeletingId(null);
    }
  };

  // Action buttons component
  const ActionButtons = ({ certificate }) => (
    <div className="flex justify-center gap-2">
      <button
        onClick={() => navigate(`/auto-services/tin-certificate-auto-download/${certificate.receiptId}`)}
        className={`p-1.5 rounded transition-colors duration-200 ${
          isDarkMode 
            ? 'bg-blue-900/30 text-blue-300 hover:bg-blue-800/50' 
            : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
        }`}
        title="ডাউনলোড করুন"
      >
        <FaDownload size={16} />
      </button>
      <button
        onClick={() => confirmDeleteCertificate(certificate)}
        disabled={deletingId === certificate._id}
        className={`p-1.5 rounded transition-colors duration-200 ${
          isDarkMode 
            ? 'bg-red-900/30 text-red-300 hover:bg-red-800/50 disabled:opacity-50' 
            : 'bg-red-100 text-red-600 hover:bg-red-200 disabled:opacity-50'
        }`}
        title="ডিলিট করুন"
      >
        {deletingId === certificate._id ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
        ) : (
          <FaTrash size={16} />
        )}
      </button>
    </div>
  );

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
              TIN সার্টিফিকেট (অটো)
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
                  <FaFileAlt /> TIN সার্টিফিকেট (অটো)
                </h2>
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  TIN সার্টিফিকেট তথ্য সংগ্রহ করুন
                </p>
              </div>
              <div className={`text-right ${isDarkMode ? 'text-theme_color' : 'text-theme_color'}`}>
                <p className="text-sm opacity-90">সেবা মূল্য</p>
                {priceLoading ? (
                  <FaSpinner className="animate-spin text-xl" />
                ) : (
                  <p className="text-2xl font-bold">{servicePrice}৳</p>
                )}
                <p className="text-xs mt-1">আপনার ব্যালেন্স: {balance}৳</p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* TIN Number Input - Removed maxLength restriction */}
              <div className="space-y-2">
                <label className={`flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <FaIdCard className="text-theme_color" />
                  TIN নম্বর <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={tinNumber}
                    onChange={handleTinNumberChange}
                    placeholder="TIN নম্বর লিখুন" 
                    className={`w-full border rounded-lg py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-theme_color transition-all duration-200 ${isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 placeholder-gray-500'}`}
                    disabled={loading}
                  />
                  <div className="absolute right-4 top-3.5">
                    <FaIdCard className={isDarkMode ? 'text-gray-400' : 'text-gray-400'} />
                  </div>
                </div>
                {/* <p className={`text-xs mt-2 flex items-center gap-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <FaInfoCircle /> যেকোনো সংখ্যার TIN নম্বর দিন
                </p> */}
              </div>

              {/* Validation Section */}
              {validationData && (
                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-blue-50'}`}>
                  <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                    <FaSearch className="text-blue-500" />
                    TIN যাচাই ফলাফল
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>TIN ফরম্যাট:</span>
                      <span className={`font-semibold ${validationData.isValidFormat ? 'text-green-500' : 'text-yellow-500'}`}>
                        {validationData.isValidFormat ? 'সঠিক' : 'চেক করুন'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>ডাটাবেসে আছে:</span>
                      <span className={`font-semibold ${validationData.existsInDatabase ? 'text-green-500' : 'text-yellow-500'}`}>
                        {validationData.existsInDatabase ? 'হ্যাঁ' : 'না'}
                      </span>
                    </div>
                    {validationData.apiResponse && (
                      <div className="flex justify-between">
                        <span>API যাচাই:</span>
                        <span className={`font-semibold ${validationData.isValidTIN ? 'text-green-500' : 'text-red-500'}`}>
                          {validationData.isValidTIN ? 'সঠিক TIN' : 'ভুল TIN'}
                        </span>
                      </div>
                    )}
                    {validationData.newBalance !== undefined && (
                      <div className="flex justify-between">
                        <span>নতুন ব্যালেন্স:</span>
                        <span className="font-semibold">{validationData.newBalance} ৳</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button 
                type="submit"
                className={`w-full bg-theme_color cursor-pointer text-white font-bold py-3 rounded-lg transition-all duration-300 text-sm shadow hover:shadow-lg mt-2 flex items-center justify-center gap-3`}
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin h-5 w-5" />
                    <span>ডাটা সংগ্রহ করা হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <span>TIN সার্টিফিকেট তথ্য সংগ্রহ করুন ({servicePrice}৳)</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Previous TIN Certificates Table */}
          <div className={`w-full p-6 border shadow-sm rounded-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-lg md:text-xl font-bold ${isDarkMode ? 'text-theme_color' : 'text-theme_color'}`}>
                পূর্ববর্তী TIN সার্টিফিকেট তালিকা
              </h2>

              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="TIN সার্টিফিকেট খুঁজুন..."
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

            {/* Data Table */}
            <div className="overflow-x-auto">
              {loadingCertificates ? (
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
                        রসিদ আইডি
                      </th>
                      <th className={`p-3 text-sm font-semibold border-r transition-colors duration-300 ${isDarkMode
                          ? 'text-gray-300 border-gray-700'
                          : 'text-gray-600 border-gray-200'
                        }`}>
                        TIN নম্বর
                      </th>
                      <th className={`p-3 text-sm font-semibold border-r transition-colors duration-300 ${isDarkMode
                          ? 'text-gray-300 border-gray-700'
                          : 'text-gray-600 border-gray-200'
                        }`}>
                        নাম
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
                    {currentCertificates.length === 0 ? (
                      <tr className="">
                        <td colSpan="7" className="p-8 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <FaFile className={isDarkMode ? 'text-gray-600' : 'text-gray-400'} size={48} />
                            <p className={`font-medium mb-2 transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                              কোন TIN সার্টিফিকেট পাওয়া যায়নি
                            </p>
                            <p className={`text-sm max-w-md transition-colors duration-300 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'
                              }`}>
                              {searchTerm ? 'আপনার সার্চের সাথে মিলছে এমন কোনো TIN সার্টিফিকেট নেই' : 'আপনার প্রথম TIN সার্টিফিকেট এখনই সংগ্রহ করুন!'}
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
                      currentCertificates.map((certificate, index) => (
                        <tr
                          key={certificate._id || index}
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
                          <td className={`p-3 text-sm text-nowrap border-r transition-colors duration-300 ${isDarkMode
                              ? 'text-gray-200 border-gray-700'
                              : 'text-gray-800 border-gray-200'
                            }`}>
                            <div className="font-medium">{certificate.receiptId || 'N/A'}</div>
                          </td>
                          <td className={`p-3 text-sm border-r transition-colors duration-300 ${isDarkMode
                              ? 'text-gray-200 border-gray-700'
                              : 'text-gray-800 border-gray-200'
                            }`}>
                            {certificate.tinNumber || 'N/A'}
                          </td>
                          <td className={`p-3 text-sm border-r transition-colors duration-300 ${isDarkMode
                              ? 'text-gray-200 border-gray-700'
                              : 'text-gray-800 border-gray-200'
                            }`}>
                            {certificate.name || certificate.tinHolderName || 'N/A'}
                          </td>
                          <td className={`p-3 text-sm border-r transition-colors duration-300 ${isDarkMode
                              ? 'text-gray-200 border-gray-700'
                              : 'text-gray-800 border-gray-200'
                            }`}>
                            <span className="font-bold">{certificate.amount || certificate.servicePrice || servicePrice}৳</span>
                          </td>
                          <td className={`p-3 text-sm text-nowrap border-r transition-colors duration-300 ${isDarkMode
                              ? 'text-gray-400 border-gray-700'
                              : 'text-gray-600 border-gray-200'
                            }`}>
                            <div className="flex items-center justify-center gap-1">
                              <FaCalendar size={12} />
                              {formatDate(certificate.createdAt || certificate.issueDate)}
                            </div>
                          </td>
                          <td className="p-3">
                            <ActionButtons certificate={certificate} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {filteredCertificates.length > 0 && (
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
                    {Math.min(endIndex, filteredCertificates.length)}
                  </span> এর{' '}
                  <span className={`font-bold transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                    {filteredCertificates.length}
                  </span> টি TIN সার্টিফিকেট
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

      {/* Delete Confirmation Popup */}
      {showDeletePopup && certificateToDelete && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.7)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
          <div className={`rounded-xl p-4 md:p-6 max-w-md w-full shadow-xl transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="text-center">
              <div className={`mx-auto flex items-center justify-center h-12 w-12 md:h-14 md:w-14 rounded-full mb-3 md:mb-4 ${isDarkMode ? 'bg-red-900/40' : 'bg-red-100'}`}>
                <svg className="h-6 w-6 md:h-7 md:w-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>

              <h3 className={`text-lg md:text-xl font-bold mb-2 transition-colors duration-300 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                TIN সার্টিফিকেট ডিলিট করুন
              </h3>

              <p className={`text-xs md:text-sm mb-3 md:mb-4 transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                আপনি কি নিশ্চিত যে আপনি এই TIN সার্টিফিকেটটি ডিলিট করতে চান?
              </p>

              <div className={`rounded-lg p-3 md:p-4 mb-3 md:mb-4 border transition-colors duration-300 ${isDarkMode
                  ? 'bg-gray-700/50 border-gray-600'
                  : 'bg-gray-50 border-gray-200'
                }`}>
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <div className="text-left">
                    <p className={`text-xs transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      রসিদ আইডি
                    </p>
                    <p className={`font-semibold text-xs md:text-sm truncate transition-colors duration-300 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      {certificateToDelete.receiptId}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className={`text-xs transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      TIN নম্বর
                    </p>
                    <p className={`font-semibold text-xs md:text-sm truncate transition-colors duration-300 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      {certificateToDelete.tinNumber}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className={`text-xs transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      নাম
                    </p>
                    <p className={`font-semibold text-xs md:text-sm truncate transition-colors duration-300 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      {certificateToDelete.name || certificateToDelete.tinHolderName || 'N/A'}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className={`text-xs transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      মূল্য
                    </p>
                    <p className={`font-semibold text-xs md:text-sm truncate transition-colors duration-300 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      {certificateToDelete.amount || certificateToDelete.servicePrice || servicePrice}৳
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
                  onClick={deleteCertificate}
                  disabled={deletingId === certificateToDelete._id}
                  className={`flex-1 font-semibold py-2 px-3 md:py-2.5 md:px-4 rounded-lg transition duration-200 text-xs md:text-sm cursor-pointer ${deletingId === certificateToDelete._id
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                >
                  {deletingId === certificateToDelete._id ? (
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

export default Autotincertificate;