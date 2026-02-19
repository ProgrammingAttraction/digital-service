import React, { useState, useRef, useEffect } from 'react';
import { Shuffle, Send, X, Trash2, Download, FileText, Calendar, RefreshCw, Info, Save } from 'lucide-react';
import Header from '../../../components/header/Header';
import Sidebar from '../../../components/sidebar/Sidebar';
import { useTheme } from '../../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ApertureLoader from '../../../components/loader/ApertureLoader';
import toast, { Toaster } from 'react-hot-toast';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

function Takmulcertificate() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupData, setPopupData] = useState({
    certificateNumber: '',
    passportNumber: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const { isDarkMode } = useTheme();
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user?.id;

  // State for receipt list
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  
  // State for service price
  const [servicePrice, setServicePrice] = useState(300); // Default price

  // Delete confirmation popup state
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [receiptToDelete, setReceiptToDelete] = useState(null);

  const [formData, setFormData] = useState({
    referenceNo: generateReferenceNumber(),
    certificateNumber: '',
    passportNumber: '',
    name: '',
    nationality: 'Bangladesh',
    workType: '',
    labourNumber: '',
    issueDate: '',
    expiryDate: ''
  });

  // Function to generate reference number
  function generateReferenceNumber() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'TAX';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Function to regenerate reference number
  const regenerateReferenceNumber = () => {
    setFormData(prev => ({
      ...prev,
      referenceNo: generateReferenceNumber()
    }));
  };

  // Configure axios with base URL and headers
  const api = axios.create({
    baseURL: base_url,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'userid': userId
    }
  });

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  const openPopup = () => {
    setPopupData({
      certificateNumber: '',
      passportNumber: ''
    });
    setPopupOpen(true);
  };

  const closePopup = () => setPopupOpen(false);

  const handleLoadData = () => {
    if (!popupData.certificateNumber || !popupData.passportNumber) {
      toast.error('সার্টিফিকেট নম্বর এবং পাসপোর্ট নম্বর উভয়ই প্রয়োজন');
      return;
    }

    // Here you would call API to load data
    // For now, we'll just close the popup and let user fill manually
    closePopup();
    toast.success('ডাটা লোডের জন্য প্রস্তুত');
  };

  const handlePopupInputChange = (e) => {
    const { name, value } = e.target;
    setPopupData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFormInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGenerateRandom = () => {
    const randomCert = Math.floor(100000000 + Math.random() * 900000000).toString();
    setFormData(prev => ({
      ...prev,
      certificateNumber: randomCert
    }));
  };

  // Fetch service price from API
  const fetchServicePrice = async () => {
    try {
      const response = await api.get('/api/user/service/price/takmul-certificate');
      if (response.data && response.data.price !== undefined) {
        setServicePrice(response.data.price);
      }
    } catch (error) {
      console.error('Error fetching service price:', error);
      // Keep default price if API fails
      setServicePrice(300);
    }
  };

  // Fetch receipts list
  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/user/takmul-certificate/all');
      if (response.data.success) {
        setReceipts(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching receipts:', error);
      toast.error('তাকামুল সার্টিফিকেট তালিকা লোড করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServicePrice();
    fetchReceipts();
  }, []);

  // Filter receipts based on search term
  const filteredReceipts = receipts.filter(receipt => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (receipt.receiptId && receipt.receiptId.toLowerCase().includes(term)) ||
      (receipt.certificateNumber && receipt.certificateNumber.toLowerCase().includes(term)) ||
      (receipt.passportNumber && receipt.passportNumber.toLowerCase().includes(term)) ||
      (receipt.name && receipt.name.toLowerCase().includes(term)) ||
      (receipt.labourNumber && receipt.labourNumber.toLowerCase().includes(term))
    );
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredReceipts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentReceipts = filteredReceipts.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('bn-BD', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Show delete confirmation popup
  const confirmDeleteReceipt = (receipt) => {
    setReceiptToDelete(receipt);
    setShowDeletePopup(true);
  };

  // Delete receipt
  const deleteReceipt = async () => {
    if (!receiptToDelete) return;

    try {
      setDeletingId(receiptToDelete._id);
      const response = await api.delete(`/api/user/takmul-certificate/${receiptToDelete._id}`);

      if (response.data.success) {
        toast.success('তাকামুল সার্টিফিকেট সফলভাবে ডিলিট করা হয়েছে');
        fetchReceipts();
      } else {
        toast.error(response.data.message || 'তাকামুল সার্টিফিকেট ডিলিট করতে সমস্যা হয়েছে');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.message || 'তাকামুল সার্টিফিকেট ডিলিট করতে সমস্যা হয়েছে');
    } finally {
      setDeletingId(null);
      setShowDeletePopup(false);
      setReceiptToDelete(null);
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setShowDeletePopup(false);
    setReceiptToDelete(null);
  };

  // Deduct balance from user account
  const deductBalance = async () => {
    try {
      const response = await api.post('/api/user/balance/deduct', {
        amount: servicePrice, // Use dynamic service price
        service: 'তাকামুল সার্টিফিকেট',
        reference: `TAK_${Date.now()}`,
        description: `তাকামুল সার্টিফিকেট তৈরি - সার্টিফিকেট নং: ${formData.certificateNumber}`
      });

      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      console.error('Balance deduction error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'ব্যালেন্স কাটতে সমস্যা হয়েছে'
      };
    }
  };

  // Save Takmul Certificate Function
  const saveTakmulCertificate = async () => {
    try {
      setIsSaving(true);

      // Validate required fields
      const requiredFields = [
        'certificateNumber', 'passportNumber', 'name', 'nationality',
        'workType', 'labourNumber', 'issueDate', 'expiryDate'
      ];

      for (const field of requiredFields) {
        if (!formData[field] || formData[field].trim() === '') {
          toast.error(`${field} ফিল্ডটি পূরণ করুন`);
          setIsSaving(false);
          return;
        }
      }

      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(formData.issueDate) || !dateRegex.test(formData.expiryDate)) {
        toast.error('তারিখের ফরম্যাট YYYY-MM-DD হতে হবে');
        setIsSaving(false);
        return;
      }

      // Validate expiry date is after issue date
      const issueDate = new Date(formData.issueDate);
      const expiryDate = new Date(formData.expiryDate);
      if (expiryDate <= issueDate) {
        toast.error('মেয়াদ শেষের তারিখ ইস্যু তারিখের পরে হতে হবে');
        setIsSaving(false);
        return;
      }

      // First deduct balance from user account
      const deductionResult = await deductBalance();

      if (!deductionResult.success) {
        toast.error(`ব্যালেন্স কাটতে ব্যর্থ: ${deductionResult.message}`);
        setIsSaving(false);
        return;
      }

      // If balance deduction successful, save the certificate
      const payload = {
        certificateNumber: formData.certificateNumber.trim(),
        passportNumber: formData.passportNumber.trim(),
        name: formData.name.trim(),
        nationality: formData.nationality.trim(),
        workType: formData.workType,
        labourNumber: formData.labourNumber.trim(),
        issueDate: formData.issueDate,
        expiryDate: formData.expiryDate,
        transactionId: deductionResult.data?.transactionId || null
      };

      const response = await api.post(`${base_url}/api/user/takmul-certificate/save`, payload);

      if (response.data.success) {
        const savedReceiptId = response.data.data.receiptId;

        // Update user balance in localStorage
        if (deductionResult.data?.newBalance !== undefined) {
          const userData = JSON.parse(localStorage.getItem('user'));
          userData.balance = deductionResult.data.newBalance;
          localStorage.setItem('user', JSON.stringify(userData));
        }

        // Refresh receipts list
        fetchReceipts();
        toast.success("তাকামুল সার্টিফিকেট অর্ডার সফল হয়েছে!")
        setTimeout(() => {
          navigate(`/clone-services/takamul-certificate-clone-download/${savedReceiptId}`);
        }, 500);
      } else {
        toast.error(response.data.message || 'তাকামুল সার্টিফিকেট সংরক্ষণ ব্যর্থ হয়েছে');
      }
    } catch (error) {
      console.error('Save error:', error);
      if (error.response) {
        toast.error(error.response.data.message || 'তাকামুল সার্টিফিকেট সংরক্ষণ করতে সমস্যা হয়েছে');
      } else {
        toast.error('নেটওয়ার্ক সমস্যা! আবার চেষ্টা করুন');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Clear form
  const clearForm = () => {
    if (window.confirm('আপনি কি ফর্মটি ক্লিয়ার করতে চান?')) {
      setFormData({
        referenceNo: generateReferenceNumber(),
        certificateNumber: '',
        passportNumber: '',
        name: '',
        nationality: 'Bangladesh',
        workType: '',
        labourNumber: '',
        issueDate: '',
        expiryDate: ''
      });
      toast.success('ফর্ম ক্লিয়ার করা হয়েছে');
    }
  };

  // Action Buttons component for table
  const ActionButtons = ({ receipt }) => (
    <div className="flex justify-center gap-2">
      <button
        onClick={() => navigate(`/clone-services/takamul-certificate-clone-download/${receipt.receiptId}`)}
        className={`p-1.5 rounded transition-colors duration-200 ${isDarkMode
            ? 'bg-blue-900/30 text-blue-300 hover:bg-blue-800/50'
            : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
          }`}
        title="ডাউনলোড করুন"
      >
        <Download size={16} />
      </button>
      <button
        onClick={() => confirmDeleteReceipt(receipt)}
        disabled={deletingId === receipt._id}
        className={`p-1.5 rounded transition-colors duration-200 ${isDarkMode
            ? 'bg-red-900/30 text-red-300 hover:bg-red-800/50 disabled:opacity-50'
            : 'bg-red-100 text-red-600 hover:bg-red-200 disabled:opacity-50'
          }`}
        title="ডিলিট করুন"
      >
        {deletingId === receipt._id ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
        ) : (
          <Trash2 size={16} />
        )}
      </button>
    </div>
  );
// -------------------------------notice-funtion-----------------------
const [noticeLoading, setNoticeLoading] = useState(true);
  const [notice, setNotice] = useState('');
   // Fetch prices from backend
 useEffect(() => {
    fetchNotice();
  }, []);

  // Fetch notice from backend
  const fetchNotice = async () => {
    try {
      setNoticeLoading(true);
      const response = await axios.get(`${base_url}/api/user/service/notice/takamul-certificate`);
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
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: isDarkMode ? '#374151' : '#fff',
            color: isDarkMode ? '#fff' : '#374151',
          },
        }}
      />

      <div className={`font-anek lg:ml-72 mt-[9vh] p-4 md:p-6 min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-[#f4f6f9] text-gray-700'}`}>
        <Header toggleSidebar={toggleSidebar} />
        <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />

        {/* Load Data Popup Modal */}
        {popupOpen && (
          <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 z-[10000] flex items-center justify-center p-4">
            <div className={`rounded-xl shadow-2xl w-full max-w-md transform transition-all ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              {/* Popup Header */}
              <div className={`flex items-center justify-between p-5 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <h2 className={`text-xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                  লেবার তথ্য লোড করুন
                </h2>
                <button
                  onClick={closePopup}
                  className={`p-1 rounded-full transition-colors ${isDarkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                >
                  <X size={24} />
                </button>
              </div>

              {/* Popup Content */}
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-semibold mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      সার্টিফিকেট নম্বর *
                    </label>
                    <input
                      type="text"
                      name="certificateNumber"
                      value={popupData.certificateNumber}
                      onChange={handlePopupInputChange}
                      placeholder="সার্টিফিকেট নম্বর দিন"
                      className={`w-full border rounded-md px-4 py-3 focus:outline-none text-sm ${isDarkMode
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-[#1abc9c]'
                          : 'border-gray-300 text-gray-800 focus:border-[#1abc9c]'
                        }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      পাসপোর্ট নম্বর *
                    </label>
                    <input
                      type="text"
                      name="passportNumber"
                      value={popupData.passportNumber}
                      onChange={handlePopupInputChange}
                      placeholder="পাসপোর্ট নম্বর দিন"
                      className={`w-full border rounded-md px-4 py-3 focus:outline-none text-sm ${isDarkMode
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-[#1abc9c]'
                          : 'border-gray-300 text-gray-800 focus:border-[#1abc9c]'
                        }`}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 mt-8 pt-5 border-t border-gray-200">
                  <button
                    onClick={closePopup}
                    className={`px-5 py-2.5 font-medium border rounded-md transition-colors cursor-pointer ${isDarkMode
                        ? 'text-gray-300 border-gray-600 hover:bg-gray-700'
                        : 'text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    বন্ধ করুন
                  </button>
                  <button
                    onClick={handleLoadData}
                    className="px-5 py-2.5 bg-[#1abc9c] text-white font-medium rounded-md hover:bg-[#16a085] transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Send size={16} /> তথ্য লোড করুন
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
             <h1 className={`text-lg md:text-[23px] mb-[10px] font-bold ${isDarkMode ? 'text-theme_color' : 'text-theme_color'}`}>
                তাকামুল সার্টিফিকেট ফরম
              </h1>
      
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
        <main className="">
          {/* Page Title */}
          <div className={`w-full p-6 border shadow-sm rounded-lg mb-6 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex justify-between items-center mb-6">
           
              <div className="flex gap-2">
                <button
                  onClick={regenerateReferenceNumber}
                  className={`px-4 py-2 text-sm font-medium rounded-md flex items-center gap-2 transition-colors cursor-pointer ${isDarkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                  <RefreshCw size={16} /> রেফারেন্স নম্বর
                </button>
              </div>
            </div>

            {/* Reference Number Field */}
            <div className="mb-6">
              <label className={`text-sm font-semibold mb-2 block ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                রেফারেন্স নম্বর
              </label>
              <input
                type="text"
                name="referenceNo"
                value={formData.referenceNo}
                onChange={handleFormInputChange}
                className={`border rounded-sm px-3 py-2.5 w-full text-sm focus:outline-none ${isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-700'
                  }`}
                readOnly
              />
            </div>

            {/* Form Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-6">
              {/* Row 1 */}
              <div className="flex flex-col">
                <label className={`text-[13px] md:text-[15px] font-semibold mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  সার্টিফিকেট নম্বর:
                </label>
                <div className="flex gap-0">
                  <input
                    name="certificateNumber"
                    value={formData.certificateNumber}
                    onChange={handleFormInputChange}
                    className={`flex-1 border rounded-l-sm px-3 py-2.5 text-sm focus:outline-none ${isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-[#1abc9c]'
                        : 'bg-white border-gray-300 text-gray-700 focus:border-[#1abc9c]'
                      }`}
                    placeholder="XXXXXXXXX"
                  />
                  <button
                    onClick={handleGenerateRandom}
                    className={`border border-l-0 px-3 rounded-r-sm transition-colors cursor-pointer ${isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-[#1abc9c] hover:bg-gray-600'
                        : 'bg-white border-gray-300 text-[#1abc9c] hover:bg-gray-50'
                      }`}
                  >
                    <Shuffle size={14} />
                  </button>
                </div>
              </div>

              <InputField
                label="পাসপোর্ট নম্বর:"
                placeholder="পাসপোর্ট নম্বর"
                name="passportNumber"
                value={formData.passportNumber}
                onChange={handleFormInputChange}
                isDarkMode={isDarkMode}
                required
              />

              {/* Row 2 */}
              <InputField
                label="নাম:"
                placeholder="পূর্ণ নাম"
                name="name"
                value={formData.name}
                onChange={handleFormInputChange}
                isDarkMode={isDarkMode}
                required
              />

              <InputField
                label="জাতীয়তা:"
                placeholder="বাংলাদেশ"
                name="nationality"
                value={formData.nationality}
                onChange={handleFormInputChange}
                isDarkMode={isDarkMode}
                required
              />

              {/* Row 3 */}
              <div className="flex flex-col">
                <label className={`text-[13px] md:text-[15px] font-semibold mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  কাজের ধরণ:
                </label>
                <select
                  name="workType"
                  value={formData.workType}
                  onChange={handleFormInputChange}
                  className={`border rounded-sm px-3 py-2.5 text-sm focus:outline-none ${isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-[#1abc9c]'
                      : 'bg-white border-gray-300 text-gray-700 focus:border-[#1abc9c]'
                    }`}
                >
                  <option value="">-- কাজের ধরণ নির্বাচন করুন --</option>
                  <option value="Domestic Worker">গৃহকর্মী</option>
                  <option value="General Labor">সাধারণ শ্রমিক</option>
                  <option value="Other">অন্যান্য</option>
                </select>
              </div>

              <InputField
                label="লেবার নম্বর:"
                placeholder="XXXXX"
                name="labourNumber"
                value={formData.labourNumber}
                onChange={handleFormInputChange}
                isDarkMode={isDarkMode}
                required
              />

              {/* Row 4 */}
              <DateInputField
                label="ইস্যু তারিখ:"
                placeholder="YYYY-MM-DD"
                name="issueDate"
                value={formData.issueDate}
                onChange={handleFormInputChange}
                isDarkMode={isDarkMode}
                required
              />

              <DateInputField
                label="মেয়াদ শেষের তারিখ:"
                placeholder="YYYY-MM-DD"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleFormInputChange}
                isDarkMode={isDarkMode}
                required
              />
            </div>

            {/* Payment Notification */}
            <div className={`mt-6 mb-6 p-4 border rounded-md flex justify-start items-start gap-3 ${isDarkMode
                ? 'bg-blue-900/20 border-blue-800/50'
                : 'bg-blue-50 border-blue-200'
              }`}>
              <div className="flex items-start">
                <Info className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className={isDarkMode ? 'text-blue-200' : 'text-blue-600'}>
                  এই সেবার জন্য আপনার অ্যাকাউন্ট থেকে <span className="font-bold">{servicePrice} টাকা</span> কাটা হবে।
                </p>
              </div>
            </div>

            {/* Action Button */}
            <div className="mt-8">
              <button
                onClick={saveTakmulCertificate}
                disabled={isSaving}
                className={`w-full hover:bg-theme_color text-white font-bold py-4 rounded shadow-sm flex items-center justify-center gap-2 transition-all text-sm md:text-base cursor-pointer ${isSaving
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-theme_color'
                  }`}
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    ডাউনলোড করা হচ্ছে...
                  </>
                ) : (
                  <>
                    <Save size={20} /> ডাউনলোড করুন  ({servicePrice} টাকা)
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Previous Takmul Certificate Table */}
          <div className={`w-full p-6 border shadow-sm rounded-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-lg md:text-xl font-bold ${isDarkMode ? 'text-[#1abc9c]' : 'text-[#1abc9c]'}`}>
                পূর্ববর্তী তাকামুল সার্টিফিকেট তালিকা
              </h2>

              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="তাকামুল সার্টিফিকেট খুঁজুন..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className={`pl-10 pr-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1abc9c] ${isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-700'
                    }`}
                />
                <svg
                  className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Data Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <ApertureLoader />
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
                        সার্টিফিকেট নম্বর
                      </th>
                      <th className={`p-3 text-sm font-semibold border-r transition-colors duration-300 ${isDarkMode
                          ? 'text-gray-300 border-gray-700'
                          : 'text-gray-600 border-gray-200'
                        }`}>
                        পাসপোর্ট নম্বর
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
                        ইস্যু তারিখ
                      </th>
                      <th className={`p-3 text-sm font-semibold transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                        অ্যাকশন
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentReceipts.length === 0 ? (
                      <tr className="">
                        <td colSpan="7" className="p-8 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <FileText className={isDarkMode ? 'text-gray-600' : 'text-gray-400'} size={48} />
                            <p className={`font-medium mb-2 transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                              কোন তাকামুল সার্টিফিকেট পাওয়া যায়নি
                            </p>
                            <p className={`text-sm max-w-md transition-colors duration-300 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'
                              }`}>
                              {searchTerm ? 'আপনার সার্চের সাথে মিলছে এমন কোনো সার্টিফিকেট নেই' : 'আপনার প্রথম তাকামুল সার্টিফিকেট এখনই তৈরি করুন!'}
                            </p>
                            {searchTerm && (
                              <button
                                onClick={() => setSearchTerm('')}
                                className="mt-4 text-sm bg-blue-600 text-white px-4 py-2 rounded-sm cursor-pointer"
                              >
                                সার্চ ক্লিয়ার করুন
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      currentReceipts.map((receipt, index) => (
                        <tr
                          key={receipt._id || index}
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
                            <div className="font-medium">{receipt.receiptId || 'N/A'}</div>
                          </td>
                          <td className={`p-3 text-sm border-r transition-colors duration-300 ${isDarkMode
                              ? 'text-gray-200 border-gray-700'
                              : 'text-gray-800 border-gray-200'
                            }`}>
                            {receipt.certificateNumber || 'N/A'}
                          </td>
                          <td className={`p-3 text-sm border-r transition-colors duration-300 ${isDarkMode
                              ? 'text-gray-200 border-gray-700'
                              : 'text-gray-800 border-gray-200'
                            }`}>
                            {receipt.passportNumber || 'N/A'}
                          </td>
                          <td className={`p-3 text-sm font-bold border-r transition-colors duration-300 ${isDarkMode
                              ? 'text-gray-200 border-gray-700'
                              : 'text-gray-800 border-gray-200'
                            }`}>
                            {receipt.name || 'N/A'}
                          </td>
                          <td className={`p-3 text-sm text-nowrap border-r transition-colors duration-300 ${isDarkMode
                              ? 'text-gray-400 border-gray-700'
                              : 'text-gray-600 border-gray-200'
                            }`}>
                            <div className="flex items-center justify-center gap-1">
                              <Calendar size={12} />
                              {formatDate(receipt.issueDate)}
                            </div>
                          </td>
                          <td className="p-3">
                            <ActionButtons receipt={receipt} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {filteredReceipts.length > 0 && (
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
                    {Math.min(endIndex, filteredReceipts.length)}
                  </span> এর{' '}
                  <span className={`font-bold transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                    {filteredReceipts.length}
                  </span> টি এন্ট্রি
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
                    <ChevronsLeft size={14} />
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`p-2 border rounded hover:transition-colors duration-200 cursor-pointer ${isDarkMode
                        ? 'border-gray-700 hover:bg-gray-800 disabled:opacity-50'
                        : 'border-gray-200 hover:bg-gray-50 disabled:opacity-50'
                      } disabled:cursor-not-allowed`}
                  >
                    <ChevronLeft size={14} />
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
                    <ChevronRight size={14} />
                  </button>
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className={`p-2 border rounded hover:transition-colors duration-200 cursor-pointer ${isDarkMode
                        ? 'border-gray-700 hover:bg-gray-800 disabled:opacity-50'
                        : 'border-gray-200 hover:bg-gray-50 disabled:opacity-50'
                      } disabled:cursor-not-allowed`}
                  >
                    <ChevronsRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Delete Confirmation Popup */}
      {showDeletePopup && receiptToDelete && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.7)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
          <div className={`rounded-2xl p-6 md:p-8 max-w-md w-full shadow-xl transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
            <div className="text-center">
              <div className={`mx-auto flex items-center justify-center h-16 w-16 md:h-20 md:w-20 rounded-full mb-4 md:mb-6 ${isDarkMode ? 'bg-red-900/40' : 'bg-red-100'
                }`}>
                <svg className="h-10 w-10 md:h-12 md:w-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>

              <h3 className={`text-xl md:text-2xl font-bold mb-2 transition-colors duration-300 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'
                }`}>
                তাকামুল সার্টিফিকেট ডিলিট করুন
              </h3>

              <p className={`text-sm md:text-base mb-4 md:mb-6 transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                আপনি কি নিশ্চিত যে আপনি এই তাকামুল সার্টিফিকেটটি ডিলিট করতে চান?
              </p>

              <div className={`rounded-xl p-4 mb-4 md:mb-6 border transition-colors duration-300 ${isDarkMode
                  ? 'bg-gray-700/50 border-gray-600'
                  : 'bg-gray-50 border-gray-200'
                }`}>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="text-left">
                    <p className={`text-xs md:text-sm transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                      রসিদ আইডি
                    </p>
                    <p className={`font-semibold text-sm md:text-base truncate transition-colors duration-300 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'
                      }`}>
                      {receiptToDelete.receiptId}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className={`text-xs md:text-sm transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                      সার্টিফিকেট নম্বর
                    </p>
                    <p className={`font-semibold text-sm md:text-base truncate transition-colors duration-300 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'
                      }`}>
                      {receiptToDelete.certificateNumber}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className={`text-xs md:text-sm transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                      নাম
                    </p>
                    <p className={`font-semibold text-sm md:text-base truncate transition-colors duration-300 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'
                      }`}>
                      {receiptToDelete.name}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className={`text-xs md:text-sm transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                      তারিখ
                    </p>
                    <p className={`font-semibold text-sm md:text-base transition-colors duration-300 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'
                      }`}>
                      {formatDate(receiptToDelete.issueDate)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-4 rounded-xl transition duration-200 text-sm md:text-base cursor-pointer"
                >
                  বাতিল করুন
                </button>
                <button
                  onClick={deleteReceipt}
                  disabled={deletingId === receiptToDelete._id}
                  className={`flex-1 font-semibold py-3 px-4 rounded-xl transition duration-200 text-sm md:text-base cursor-pointer ${deletingId === receiptToDelete._id
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                >
                  {deletingId === receiptToDelete._id ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ডিলিট হচ্ছে...
                    </span>
                  ) : (
                    'ডিলিট করুন'
                  )}
                </button>
              </div>

              <p className={`text-xs text-center mt-4 transition-colors duration-300 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'
                }`}>
                নোট: একবার ডিলিট করলে এই সার্টিফিকেটটি পুনরুদ্ধার করা যাবে না।
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Reusable Input Component
function InputField({ label, placeholder, required = false, name, value, onChange, isDarkMode, type = "text" }) {
  return (
    <div className="flex flex-col">
      <label className={`text-[15px] font-semibold mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className={`border rounded-md text-sm md:text-[15px] px-4 py-2 focus:outline-none focus:ring-2  ${isDarkMode
            ? 'bg-gray-700 border-gray-600 text-white focus:ring-green-500 focus:ring-offset-gray-800'
            : 'bg-white border-gray-300 focus:ring-green-500 focus:ring-offset-white'
          }`}
        placeholder={placeholder}
      />
    </div>
  );
}

// Reusable Date Input Component (allows typing)
function DateInputField({ label, placeholder, required = false, name, value, onChange, isDarkMode }) {
  return (
    <div className="flex flex-col">
      <label className={`text-[15px] font-semibold mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        className={`border rounded-md text-sm md:text-[15px] px-4 py-2 focus:outline-none focus:ring-2 ${isDarkMode
            ? 'bg-gray-700 border-gray-600 text-white focus:ring-green-500 focus:ring-offset-gray-800'
            : 'bg-white border-gray-300 focus:ring-green-500 focus:ring-offset-white'
          }`}
        placeholder={placeholder}
        pattern="\d{4}-\d{2}-\d{2}"
        title="YYYY-MM-DD format"
      />
      <small className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
        ফরম্যাট: YYYY-MM-DD (যেমন: 2024-12-31)
      </small>
    </div>
  );
}

export default Takmulcertificate;