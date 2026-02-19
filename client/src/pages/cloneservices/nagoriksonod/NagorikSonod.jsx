import React, { useState, useRef, useEffect } from 'react';
import Header from '../../../components/header/Header';
import Sidebar from '../../../components/sidebar/Sidebar';
import { Trash2, Printer, ArrowLeft, Save, Eye, Download, FileText, History, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Calendar, Info, RefreshCw } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ApertureLoader from '../../../components/loader/ApertureLoader';
import toast, { Toaster } from 'react-hot-toast';

function NagorikSonod() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [receiptId, setReceiptId] = useState('');
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
  const [servicePrice, setServicePrice] = useState(150); // Default price

  // Success popup state
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [orderSuccessData, setOrderSuccessData] = useState(null);

  // Delete confirmation popup state
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [receiptToDelete, setReceiptToDelete] = useState(null);

  // State for Nagorik Sonod Form Data
  const [formData, setFormData] = useState({
    certificateNo: generateCertificateNumber(),
    issueDate: '',
    name: '',
    fatherName: '',
    motherName: '',
    spouseName: '',
    birthDate: '',
    nidNumber: '',
    grandfatherName: '',
    wardNo: '',
    villageArea: '',
    postOffice: '',
    postCode: '',
    thana: '',
    upazila: '',
    district: 'কুমিল্লা',
    municipalityName: 'দেবিদ্বার পৌরসভা',
    municipalityEmail: 'debidwarpourashava@lgd.gov.bd',
    municipalityMobile: '01329649260'
  });

  // Function to generate certificate number
  function generateCertificateNumber() {
    const randomNum = Math.floor(Math.random() * 1000000000000);
    return randomNum.toString().padStart(12, '0');
  }

  // Function to regenerate certificate number
  const regenerateCertificateNumber = () => {
    setFormData(prev => ({
      ...prev,
      certificateNo: generateCertificateNumber()
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  // Fetch service price from API
  const fetchServicePrice = async () => {
    try {
      const response = await api.get('/api/user/service/price/nagorik-sonod');
      if (response.data && response.data.price !== undefined) {
        setServicePrice(response.data.price);
      }
    } catch (error) {
      console.error('Error fetching service price:', error);
      // Keep default price if API fails
      setServicePrice(150);
    }
  };

  // Fetch receipts list
  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/user/nagorik-sonod/all');
      if (response.data.success) {
        setReceipts(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching receipts:', error);
      toast.error('নাগরিক সনদ তালিকা লোড করতে সমস্যা হয়েছে');
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
      (receipt.certificateNo && receipt.certificateNo.toLowerCase().includes(term)) ||
      (receipt.name && receipt.name.toLowerCase().includes(term)) ||
      (receipt.fatherName && receipt.fatherName.toLowerCase().includes(term)) ||
      (receipt.municipalityName && receipt.municipalityName.toLowerCase().includes(term)) ||
      (receipt.district && receipt.district.toLowerCase().includes(term))
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
      const response = await api.delete(`/api/user/nagorik-sonod/${receiptToDelete._id}`);
      
      if (response.data.success) {
        toast.success('নাগরিক সনদ সফলভাবে ডিলিট করা হয়েছে');
        // Refresh receipts list
        fetchReceipts();
        // If the deleted receipt is the currently displayed one, clear it
        if (receiptId === receiptToDelete._id) {
          setReceiptId('');
          setSaveSuccess(false);
        }
      } else {
        toast.error(response.data.message || 'নাগরিক সনদ ডিলিট করতে সমস্যা হয়েছে');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.message || 'নাগরিক সনদ ডিলিট করতে সমস্যা হয়েছে');
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
        service: 'নাগরিক সনদ',
        reference: `NGS_${Date.now()}`,
        description: `নাগরিক সনদ তৈরি - সনদ নং: ${formData.certificateNo}`
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

  // Close success popup
  const closeSuccessPopup = () => {
    setShowSuccessPopup(false);
    setOrderSuccessData(null);
  };

  // Save Nagorik Sonod Function
  const saveNagorikSonod = async () => {
    try {
      setIsSaving(true);
      setSaveSuccess(false);

      // Validate required fields
      const requiredFields = [
        'name', 'fatherName', 'motherName', 'birthDate',
        'wardNo', 'villageArea', 'postOffice', 'postCode',
        'thana', 'upazila', 'district', 'municipalityName',
        'municipalityEmail', 'municipalityMobile', 'issueDate'
      ];

      for (const field of requiredFields) {
        if (!formData[field] || formData[field].trim() === '') {
          toast.error(`${field} ফিল্ডটি পূরণ করুন`);
          setIsSaving(false);
          return;
        }
      }

      // First deduct balance from user account
      const deductionResult = await deductBalance();
      
      if (!deductionResult.success) {
        toast.error(`ব্যালেন্স কাটতে ব্যর্থ: ${deductionResult.message}`);
        setIsSaving(false);
        return;
      }

      // If balance deduction successful, save the nagorik sonod
      const payload = {
        certificateNo: formData.certificateNo,
        issueDate: formData.issueDate,
        name: formData.name,
        fatherName: formData.fatherName,
        motherName: formData.motherName,
        spouseName: formData.spouseName,
        birthDate: formData.birthDate,
        nidNumber: formData.nidNumber,
        grandfatherName: formData.grandfatherName,
        wardNo: formData.wardNo,
        villageArea: formData.villageArea,
        postOffice: formData.postOffice,
        postCode: formData.postCode,
        thana: formData.thana,
        upazila: formData.upazila,
        district: formData.district,
        municipalityName: formData.municipalityName,
        municipalityEmail: formData.municipalityEmail,
        municipalityMobile: formData.municipalityMobile,
        transactionId: deductionResult.data?.transactionId || null
      };

      const response = await api.post(`${base_url}/api/user/nagorik-sonod/save`, payload);
      
      if (response.data.success) {
        const savedReceiptId = response.data.data.receiptId;
        setReceiptId(savedReceiptId);
        setSaveSuccess(true);
        
        // Update user balance in localStorage
        if (deductionResult.data?.newBalance !== undefined) {
          const userData = JSON.parse(localStorage.getItem('user'));
          userData.balance = deductionResult.data.newBalance;
          localStorage.setItem('user', JSON.stringify(userData));
        }
        
        // Refresh receipts list
        fetchReceipts();
        toast.success("নাগরিক সনদ অর্ডার সফল হয়েছে!")
        setTimeout(() => {
          navigate(`/clone-services/citizen-certificate-download/${savedReceiptId}`);
        }, 500);
      } else {
        toast.error(response.data.message || 'নাগরিক সনদ সংরক্ষণ ব্যর্থ হয়েছে');
      }
    } catch (error) {
      console.error('Save error:', error);
      if (error.response) {
        toast.error(error.response.data.message || 'নাগরিক সনদ সংরক্ষণ করতে সমস্যা হয়েছে');
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
        certificateNo: generateCertificateNumber(),
        issueDate: '',
        name: '',
        fatherName: '',
        motherName: '',
        spouseName: '',
        birthDate: '',
        nidNumber: '',
        grandfatherName: '',
        wardNo: '',
        villageArea: '',
        postOffice: '',
        postCode: '',
        thana: '',
        upazila: '',
        district: 'কুমিল্লা',
        municipalityName: 'দেবিদ্বার পৌরসভা',
        municipalityEmail: 'debidwarpourashava@lgd.gov.bd',
        municipalityMobile: '01329649260'
      });
      setReceiptId('');
      setSaveSuccess(false);
      toast.success('ফর্ম ক্লিয়ার করা হয়েছে');
    }
  };

  // Action Buttons component for table
  const ActionButtons = ({ receipt }) => (
    <div className="flex justify-center gap-2">
      <button
        onClick={() => navigate(`/clone-services/citizen-certificate-download/${receipt.receiptId}`)}
        className={`p-1.5 rounded transition-colors duration-200 ${
          isDarkMode 
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
        className={`p-1.5 rounded transition-colors duration-200 ${
          isDarkMode 
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

  // Navigate to download after success
  const handleSuccessContinue = () => {
    if (orderSuccessData?.orderId) {
      navigate(`/clone-services/nagorik-sonod-clone-download/${orderSuccessData.orderId}`);
    }
    closeSuccessPopup();
  };
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
      const response = await axios.get(`${base_url}/api/user/service/notice/nagorik-sonod`);
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
      
      <div className={`font-anek lg:ml-72 mt-[9vh] min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-700'}`}>
        <Header toggleSidebar={toggleSidebar} />
        <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />

        <main className="min-h-[91vh] p-4 md:p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className={`text-lg md:text-2xl font-bold ${isDarkMode ? 'text-theme_color' : 'text-theme_color'}`}>
              নাগরিক সনদ
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
          <div className={`w-full mx-auto p-6 shadow-md rounded-sm border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column - Personal Information */}
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold pb-1 mb-1">ব্যক্তিগত তথ্য:</h3>
                  </div>
                  
                  {/* Certificate No Field with Generate Button */}
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <label className={`text-[15px] font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        সনদ নং
                      </label>
                      <button
                        type="button"
                        onClick={regenerateCertificateNumber}
                        className={`flex items-center gap-1 text-xs px-2 border-[1px] cursor-pointer border-gray-200 py-1 rounded transition-colors duration-200 ${
                          isDarkMode 
                            ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                        }`}
                        title="Generate New Certificate Number"
                      >
                        <RefreshCw size={10} />
                        Generate
                      </button>
                    </div>
                    <input 
                      type="text"
                      name="certificateNo"
                      value={formData.certificateNo}
                      onChange={handleInputChange}
                      className={`border rounded-md text-sm md:text-[15px] px-4 py-2 focus:outline-none focus:ring-2 ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white focus:ring-green-500 focus:ring-offset-gray-800' 
                          : 'bg-white border-gray-300 focus:ring-green-500 focus:ring-offset-white'
                      }`}
                      placeholder="সনদ নং"
                    />
                  </div>

                  <InputField 
                    label="ইস্যু তারিখ *" 
                    name="issueDate" 
                    value={formData.issueDate} 
                    onChange={handleInputChange} 
                    isDarkMode={isDarkMode} 
                    placeholder="YYYY-MM-DD"
                    type="date"
                    required
                  />
                  <InputField 
                    label="নাম *" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleInputChange} 
                    isDarkMode={isDarkMode} 
                    placeholder="পূর্ণ নাম"
                    required
                  />
                  <InputField 
                    label="পিতার নাম *" 
                    name="fatherName" 
                    value={formData.fatherName} 
                    onChange={handleInputChange} 
                    isDarkMode={isDarkMode} 
                    placeholder="পিতার নাম"
                    required
                  />
                  <InputField 
                    label="মাতার নাম *" 
                    name="motherName" 
                    value={formData.motherName} 
                    onChange={handleInputChange} 
                    isDarkMode={isDarkMode} 
                    placeholder="মাতার নাম"
                    required
                  />
                  <InputField 
                    label="স্বামী/স্ত্রীর নাম" 
                    name="spouseName" 
                    value={formData.spouseName} 
                    onChange={handleInputChange} 
                    isDarkMode={isDarkMode} 
                    placeholder="স্বামী/স্ত্রীর নাম (যদি থাকে)"
                  />
                  <InputField 
                    label="জন্ম তারিখ *" 
                    name="birthDate" 
                    value={formData.birthDate} 
                    onChange={handleInputChange} 
                    isDarkMode={isDarkMode} 
                    placeholder="YYYY-MM-DD"
                    type="date"
                    required
                  />
                </div>
              </div>

              {/* Right Column - Address and Municipality Information */}
              <div className="space-y-4">
                <div className="space-y-3">
                  <h3 className="font-bold pb-1 mb-4">ঠিকানা ও পৌরসভা তথ্য:</h3>
                  
                  <InputField 
                    label="জাতীয় পরিচয়পত্র নম্বর" 
                    name="nidNumber" 
                    value={formData.nidNumber} 
                    onChange={handleInputChange} 
                    isDarkMode={isDarkMode} 
                    placeholder="NID Number"
                  />
                  <InputField 
                    label="মহাপিতার নাম" 
                    name="grandfatherName" 
                    value={formData.grandfatherName} 
                    onChange={handleInputChange} 
                    isDarkMode={isDarkMode} 
                    placeholder="মহাপিতার নাম"
                  />
                  <InputField 
                    label="ওয়ার্ড নং *" 
                    name="wardNo" 
                    value={formData.wardNo} 
                    onChange={handleInputChange} 
                    isDarkMode={isDarkMode} 
                    placeholder="ওয়ার্ড নম্বর"
                    required
                  />
                  <InputField 
                    label="গ্রাম/মহল্লা *" 
                    name="villageArea" 
                    value={formData.villageArea} 
                    onChange={handleInputChange} 
                    isDarkMode={isDarkMode} 
                    placeholder="গ্রাম বা মহল্লার নাম"
                    required
                  />
                  <InputField 
                    label="ডাকঘর *" 
                    name="postOffice" 
                    value={formData.postOffice} 
                    onChange={handleInputChange} 
                    isDarkMode={isDarkMode} 
                    placeholder="ডাকঘরের নাম"
                    required
                  />
                  <InputField 
                    label="পোস্ট কোড *" 
                    name="postCode" 
                    value={formData.postCode} 
                    onChange={handleInputChange} 
                    isDarkMode={isDarkMode} 
                    placeholder="পোস্ট কোড"
                    required
                  />
                  <InputField 
                    label="থানা *" 
                    name="thana" 
                    value={formData.thana} 
                    onChange={handleInputChange} 
                    isDarkMode={isDarkMode} 
                    placeholder="থানা"
                    required
                  />
                  <InputField 
                    label="উপজেলা *" 
                    name="upazila" 
                    value={formData.upazila} 
                    onChange={handleInputChange} 
                    isDarkMode={isDarkMode} 
                    placeholder="উপজেলা"
                    required
                  />
                  <InputField 
                    label="জেলা *" 
                    name="district" 
                    value={formData.district} 
                    onChange={handleInputChange} 
                    isDarkMode={isDarkMode} 
                    placeholder="জেলা"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Municipality Information Section */}
            <div className="mt-6 p-4 border rounded-md border-gray-300">
              <h3 className="font-bold mb-3">পৌরসভা তথ্য:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField 
                  label="পৌরসভার নাম *" 
                  name="municipalityName" 
                  value={formData.municipalityName} 
                  onChange={handleInputChange} 
                  isDarkMode={isDarkMode} 
                  placeholder="পৌরসভার নাম"
                  required
                />
                <InputField 
                  label="পৌরসভা ই-মেইল *" 
                  name="municipalityEmail" 
                  value={formData.municipalityEmail} 
                  onChange={handleInputChange} 
                  isDarkMode={isDarkMode} 
                  placeholder="ই-মেইল"
                  required
                />
                <InputField 
                  label="পৌরসভা মোবাইল *" 
                  name="municipalityMobile" 
                  value={formData.municipalityMobile} 
                  onChange={handleInputChange} 
                  isDarkMode={isDarkMode} 
                  placeholder="মোবাইল নম্বর"
                  required
                />
              </div>
            </div>

            {/* Payment Notification Section */}
            <div className={`mt-6 mb-4 p-4 border rounded-md flex justify-start items-start gap-3 transition-colors duration-300 ${
              isDarkMode 
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

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
              <button 
                onClick={saveNagorikSonod}
                disabled={isSaving}
                className={`w-full hover:bg-theme_color text-white font-bold py-3 rounded shadow-sm flex items-center justify-center gap-2 transition-all text-sm md:text-base cursor-pointer ${isSaving
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
                    <Save size={20} /> ডাউনলোড করুন ({servicePrice} টাকা)
                  </>
                )}
              </button>
            </div>
            
            {/* Previous Nagorik Sonod Table */}
            <div className="mt-12">
              <div className="flex justify-between items-center mb-6">
                <h2 className={`text-lg md:text-xl font-bold ${isDarkMode ? 'text-green-400' : 'text-[#1abc9c]'}`}>
                  পূর্ববর্তী নাগরিক সনদ তালিকা
                </h2>
                
                {/* Search Bar */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="নাগরিক সনদ খুঁজুন..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className={`pl-10 pr-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white focus:ring-green-500'
                        : 'bg-white border-gray-300 text-gray-700 focus:ring-green-500'
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
                    <ApertureLoader/>
                  </div>
                ) : (
                  <table className="w-full text-center border-collapse border-[1px] border-gray-200">
                    <thead>
                      <tr className={`text-nowrap border-t border-b transition-colors duration-300 ${
                        isDarkMode
                          ? 'bg-green-900/20 border-gray-700'
                          : 'bg-[#d1f2eb] border-gray-300'
                      }`}>
                        <th className={`p-3 text-xs font-semibold uppercase tracking-wider border-r transition-colors duration-300 ${
                          isDarkMode
                            ? 'text-gray-300 border-gray-700'
                            : 'text-gray-600 border-gray-200'
                        }`}>
                          ক্রম 
                        </th>
                        <th className={`p-3 text-sm font-semibold border-r transition-colors duration-300 ${
                          isDarkMode
                            ? 'text-gray-300 border-gray-700'
                            : 'text-gray-600 border-gray-200'
                        }`}>
                          রসিদ আইডি
                        </th>
                        <th className={`p-3 text-sm font-semibold border-r transition-colors duration-300 ${
                          isDarkMode
                            ? 'text-gray-300 border-gray-700'
                            : 'text-gray-600 border-gray-200'
                        }`}>
                          সনদ নং
                        </th>
                        <th className={`p-3 text-sm font-semibold border-r transition-colors duration-300 ${
                          isDarkMode
                            ? 'text-gray-300 border-gray-700'
                            : 'text-gray-600 border-gray-200'
                        }`}>
                          নাম
                        </th>
                        <th className={`p-3 text-sm font-semibold border-r transition-colors duration-300 ${
                          isDarkMode
                            ? 'text-gray-300 border-gray-700'
                            : 'text-gray-600 border-gray-200'
                        }`}>
                          পিতার নাম
                        </th>
                        <th className={`p-3 text-sm font-semibold border-r transition-colors duration-300 ${
                          isDarkMode
                            ? 'text-gray-300 border-gray-700'
                            : 'text-gray-600 border-gray-200'
                        }`}>
                          পৌরসভা
                        </th>
                        <th className={`p-3 text-sm font-semibold border-r transition-colors duration-300 ${
                          isDarkMode
                            ? 'text-gray-300 border-gray-700'
                            : 'text-gray-600 border-gray-200'
                        }`}>
                          ইস্যু তারিখ
                        </th>
                        <th className={`p-3 text-sm font-semibold transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          অ্যাকশন
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentReceipts.length === 0 ? (
                        <tr className="">
                          <td colSpan="8" className="p-8 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <FileText className={isDarkMode ? 'text-gray-600' : 'text-gray-400'} size={48} />
                              <p className={`font-medium mb-2 transition-colors duration-300 ${
                                isDarkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                কোন নাগরিক সনদ পাওয়া যায়নি
                              </p>
                              <p className={`text-sm max-w-md transition-colors duration-300 ${
                                isDarkMode ? 'text-gray-500' : 'text-gray-500'
                              }`}>
                                {searchTerm ? 'আপনার সার্চের সাথে মিলছে এমন কোনো নাগরিক সনদ নেই' : 'আপনার প্রথম নাগরিক সনদ এখনই তৈরি করুন!'}
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
                            className={`border-b hover:transition-colors duration-300 ${
                              index % 2 === 0 
                                ? isDarkMode ? 'bg-gray-800/30 hover:bg-gray-800/50' : 'bg-white hover:bg-gray-50'
                                : isDarkMode ? 'bg-gray-900/30 hover:bg-gray-900/50' : 'bg-gray-50 hover:bg-gray-100'
                            } ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
                          >
                            <td className={`p-3 text-sm font-medium border-r transition-colors duration-300 ${
                              isDarkMode
                                ? 'text-gray-300 border-gray-700'
                                : 'text-gray-700 border-gray-200'
                            }`}>
                              {startIndex + index + 1}
                            </td>
                            <td className={`p-3 text-sm text-nowrap border-r transition-colors duration-300 ${
                              isDarkMode
                                ? 'text-gray-200 border-gray-700'
                                : 'text-gray-800 border-gray-200'
                            }`}>
                              <div className="font-medium">{receipt.receiptId || 'N/A'}</div>
                            </td>
                            <td className={`p-3 text-sm border-r transition-colors duration-300 ${
                              isDarkMode
                                ? 'text-gray-200 border-gray-700'
                                : 'text-gray-800 border-gray-200'
                            }`}>
                              {receipt.certificateNo || 'N/A'}
                            </td>
                            <td className={`p-3 text-sm border-r transition-colors duration-300 ${
                              isDarkMode
                                ? 'text-gray-200 border-gray-700'
                                : 'text-gray-800 border-gray-200'
                            }`}>
                              {receipt.name || 'N/A'}
                            </td>
                            <td className={`p-3 text-sm border-r transition-colors duration-300 ${
                              isDarkMode
                                ? 'text-gray-200 border-gray-700'
                                : 'text-gray-800 border-gray-200'
                            }`}>
                              {receipt.fatherName || 'N/A'}
                            </td>
                            <td className={`p-3 text-sm border-r transition-colors duration-300 ${
                              isDarkMode
                                ? 'text-gray-200 border-gray-700'
                                : 'text-gray-800 border-gray-200'
                            }`}>
                              {receipt.municipalityName || 'N/A'}
                            </td>
                            <td className={`p-3 text-sm text-nowrap border-r transition-colors duration-300 ${
                              isDarkMode
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
                <div className={`flex flex-wrap justify-between items-center mt-4 pt-4 border-t text-sm transition-colors duration-300 ${
                  isDarkMode 
                    ? 'border-gray-700 text-gray-400' 
                    : 'border-gray-200 text-gray-500'
                }`}>
                  <div className="mb-3 md:mb-0">
                    প্রদর্শন <span className={`font-bold transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {startIndex + 1}
                    </span> থেকে{' '}
                    <span className={`font-bold transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {Math.min(endIndex, filteredReceipts.length)}
                    </span> এর{' '}
                    <span className={`font-bold transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {filteredReceipts.length}
                    </span> টি এন্ট্রি
                  </div>
                  <div className="flex items-center space-x-1">
                    <button 
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                      className={`p-2 border rounded hover:transition-colors duration-200 cursor-pointer ${
                        isDarkMode
                          ? 'border-gray-700 hover:bg-gray-800 disabled:opacity-50'
                          : 'border-gray-200 hover:bg-gray-50 disabled:opacity-50'
                      } disabled:cursor-not-allowed`}
                    >
                      <ChevronsLeft size={14} />
                    </button>
                    <button 
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`p-2 border rounded hover:transition-colors duration-200 cursor-pointer ${
                        isDarkMode
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
                          className={`px-3 py-1 border rounded transition duration-200 cursor-pointer ${
                            currentPage === pageNum 
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
                      className={`p-2 border rounded hover:transition-colors duration-200 cursor-pointer ${
                        isDarkMode
                          ? 'border-gray-700 hover:bg-gray-800 disabled:opacity-50'
                          : 'border-gray-200 hover:bg-gray-50 disabled:opacity-50'
                      } disabled:cursor-not-allowed`}
                    >
                      <ChevronRight size={14} />
                    </button>
                    <button 
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                      className={`p-2 border rounded hover:transition-colors duration-200 cursor-pointer ${
                        isDarkMode
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
          </div>
        </main>
      </div>

      {/* Order Success Popup */}
      {showSuccessPopup && orderSuccessData && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.7)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
          <div className={`rounded-2xl p-6 md:p-8 max-w-md w-full shadow-xl transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="text-center">
              <div className={`mx-auto flex items-center border-[1px] border-green-500 justify-center h-16 w-16 md:h-20 md:w-20 rounded-full mb-4 md:mb-6 ${
                isDarkMode ? 'bg-green-900/40' : 'bg-green-100'
              }`}>
                <svg className="h-10 w-10 md:h-12 md:w-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h3 className={`text-xl md:text-2xl font-bold mb-2 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-100' : 'text-gray-900'
              }`}>
                অর্ডার সফল!
              </h3>
              
              <p className={`text-sm md:text-base mb-4 md:mb-6 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                আপনার নাগরিক সনদ অর্ডারটি সফলভাবে প্লেস করা হয়েছে।
              </p>
              
              <div className={`rounded-xl p-4 mb-4 md:mb-6 border transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-gray-700/50 border-gray-600' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="grid grid-cols-1 gap-3 md:gap-4">
                  <div className="text-left">
                    <p className={`text-xs md:text-sm transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      সেবা
                    </p>
                    <p className={`font-semibold text-sm md:text-base truncate transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-800'
                    }`}>
                      {orderSuccessData.serviceName}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className={`text-xs md:text-sm transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      মোট টাকা
                    </p>
                    <p className="font-semibold text-sm md:text-base text-green-600">
                      {orderSuccessData.totalAmount}৳
                    </p>
                  </div>
                  <div className="text-left">
                    <p className={`text-xs md:text-sm transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      অর্ডার আইডি
                    </p>
                    <p className={`font-semibold text-sm md:text-base truncate transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-800'
                    }`}>
                      {orderSuccessData.orderId}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={closeSuccessPopup}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-4 rounded-xl transition duration-200 text-sm md:text-base cursor-pointer"
                >
                  বন্ধ করুন
                </button>
                <button
                  onClick={handleSuccessContinue}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-xl transition duration-200 text-sm md:text-base cursor-pointer"
                >
                  সনদ দেখুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Popup */}
      {showDeletePopup && receiptToDelete && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.7)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
          <div className={`rounded-2xl p-6 md:p-8 max-w-md w-full shadow-xl transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="text-center">
              <div className={`mx-auto flex items-center justify-center h-16 w-16 md:h-20 md:w-20 rounded-full mb-4 md:mb-6 ${
                isDarkMode ? 'bg-red-900/40' : 'bg-red-100'
              }`}>
                <svg className="h-10 w-10 md:h-12 md:w-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              
              <h3 className={`text-xl md:text-2xl font-bold mb-2 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-100' : 'text-gray-900'
              }`}>
                নাগরিক সনদ ডিলিট করুন
              </h3>
              
              <p className={`text-sm md:text-base mb-4 md:mb-6 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                আপনি কি নিশ্চিত যে আপনি এই নাগরিক সনদটি ডিলিট করতে চান?
              </p>
              
              <div className={`rounded-xl p-4 mb-4 md:mb-6 border transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-gray-700/50 border-gray-600' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="text-left">
                    <p className={`text-xs md:text-sm transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      রসিদ আইডি
                    </p>
                    <p className={`font-semibold text-sm md:text-base truncate transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-800'
                    }`}>
                      {receiptToDelete.receiptId}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className={`text-xs md:text-sm transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      সনদ নং
                    </p>
                    <p className={`font-semibold text-sm md:text-base truncate transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-800'
                    }`}>
                      {receiptToDelete.certificateNo}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className={`text-xs md:text-sm transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      নাম
                    </p>
                    <p className={`font-semibold text-sm md:text-base truncate transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-800'
                    }`}>
                      {receiptToDelete.name}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className={`text-xs md:text-sm transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      পিতার নাম
                    </p>
                    <p className={`font-semibold text-sm md:text-base truncate transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-800'
                    }`}>
                      {receiptToDelete.fatherName}
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
                  className={`flex-1 font-semibold py-3 px-4 rounded-xl transition duration-200 text-sm md:text-base cursor-pointer ${
                    deletingId === receiptToDelete._id
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
              
              <p className={`text-xs text-center mt-4 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-500'
              }`}>
                নোট: একবার ডিলিট করলে এই নাগরিক সনদটি পুনরুদ্ধার করা যাবে না।
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// --- Helper Components ---

function InputField({ label, name, value, onChange, placeholder, isDarkMode, type = "text", required = false }) {
  return (
    <div className="flex flex-col flex-1">
      <label className={`text-[15px] font-semibold mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input 
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className={`border rounded-md text-sm md:text-[15px] px-4 py-2 focus:outline-none focus:ring-2  ${
          isDarkMode 
            ? 'bg-gray-700 border-gray-600 text-white focus:ring-green-500 focus:ring-offset-gray-800' 
            : 'bg-white border-gray-300 focus:ring-green-500 focus:ring-offset-white'
        }`}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}

export default NagorikSonod;