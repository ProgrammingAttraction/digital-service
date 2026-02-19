import React, { useState, useRef, useEffect } from 'react';
import Header from '../../../components/header/Header';
import Sidebar from '../../../components/sidebar/Sidebar';
import { Trash2, Printer, ArrowLeft, Save, Eye, Download, FileText, History, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Calendar, Info, RefreshCw, DollarSign, FileCheck, Receipt, ChartBar, User, MapPin, Home, Users, Hash } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ApertureLoader from '../../../components/loader/ApertureLoader';
import toast, { Toaster } from 'react-hot-toast';
import { FaBangladeshiTakaSign } from "react-icons/fa6";

function TaxReturn() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [receiptId, setReceiptId] = useState('');
  const { isDarkMode } = useTheme();
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user?.id;

  // State for tax returns list
  const [taxReturns, setTaxReturns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [assessmentYearFilter, setAssessmentYearFilter] = useState('');
  
  // Service price state
  const [servicePrice, setServicePrice] = useState(150); // Default 150 BDT

  // Statistics state
  const [statistics, setStatistics] = useState({
    totalReturns: 0,
    totalIncome: 0,
    totalTaxPaid: 0,
    totalTaxLiability: 0,
    avgIncome: 0,
    returnsByYear: []
  });

  // Delete confirmation popup state
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [returnToDelete, setReturnToDelete] = useState(null);

  // Function to generate reference number
  function generateReferenceNumber() {
    const chars = 'TAX0123456789ABCDEF';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // State for Tax Return Form Data (Updated with all fields from image)
  const [formData, setFormData] = useState({
    // Reference number
    referenceNo: generateReferenceNumber(),
    
    // Personal Information (from image)
    taxpayerName: '',
    fathersName: '',
    mothersName: '',
    currentAddress: '',
    permanentAddress: '',
    taxpayerStatus: 'Individual -> Bangladesh -> Having NID',
    
    // Identification numbers
    nidNumber: '',
    tinNumber: '',
    
    // Tax information
    assessmentYear: '2025-2026',
    financialYear: '2024-2025',
    circle: 'Circle-114',
    taxZone: 'Taxes Zone-06, Dhaka',
    totalIncome: '',
    totalTaxPaid: '',
    taxRebate: '',
    
    // Return registration
    returnRegisterVolumeNo: '',
    returnSubmissionDate: new Date().toISOString().split('T')[0],
    
    // Office information
    taxOfficeName: 'National Board of Revenue',
    taxOfficeAddress: 'Income Tax Department, Dhaka',
    
    // Certificate information
    certificateIssuer: 'System Generated'
  });

  // Calculate tax liability based on Bangladesh tax slab
  const calculateTaxLiability = (income) => {
    const incomeNum = parseFloat(income) || 0;
    let tax = 0;
    
    if (incomeNum <= 350000) {
      tax = 0;
    } else if (incomeNum <= 450000) {
      tax = (incomeNum - 350000) * 0.05;
    } else if (incomeNum <= 750000) {
      tax = 5000 + (incomeNum - 450000) * 0.10;
    } else if (incomeNum <= 1150000) {
      tax = 35000 + (incomeNum - 750000) * 0.15;
    } else if (incomeNum <= 1650000) {
      tax = 95000 + (incomeNum - 1150000) * 0.20;
    } else {
      tax = 195000 + (incomeNum - 1650000) * 0.25;
    }
    
    return tax;
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

  // Fetch service price
  const fetchServicePrice = async () => {
    try {
      const response = await api.get('/api/user/service/price/tax-return');
      if (response.data.price) {
        setServicePrice(response.data.price);
      }
    } catch (error) {
      console.error('Error fetching service price:', error);
      // Keep default price if API fails
      setServicePrice(150);
    }
  };

  useEffect(() => {
    fetchServicePrice();
    fetchTaxReturns();
    fetchStatistics();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      // Recalculate tax if total income changes
      if (name === 'totalIncome' || name === 'taxRebate') {
        const income = parseFloat(updated.totalIncome) || 0;
        const rebate = parseFloat(updated.taxRebate) || 0;
        const taxLiability = calculateTaxLiability(income);
        const netTax = Math.max(0, taxLiability - rebate);
        
        // Update tax paid if it's not set or less than calculated
        if (!updated.totalTaxPaid || parseFloat(updated.totalTaxPaid) < netTax) {
          updated.totalTaxPaid = netTax.toFixed(2);
        }
      }
      
      return updated;
    });
  };

  // Function to regenerate reference number
  const regenerateReferenceNumber = () => {
    setFormData(prev => ({
      ...prev,
      referenceNo: generateReferenceNumber()
    }));
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  // Fetch tax returns list
  const fetchTaxReturns = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/user/tax-return/all');
      if (response.data.success) {
        setTaxReturns(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching tax returns:', error);
      toast.error('আয়কর রিটার্ন তালিকা লোড করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      const response = await api.get('/api/user/tax-return/statistics');
      if (response.data.success) {
        setStatistics(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  // Calculate tax liability for current form
  const currentTaxLiability = calculateTaxLiability(formData.totalIncome);
  const netTaxPayable = Math.max(0, currentTaxLiability - (parseFloat(formData.taxRebate) || 0));

  // Filter tax returns based on search term and year filter
  const filteredReturns = taxReturns.filter(taxReturn => {
    let matchesSearch = true;
    let matchesYear = true;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      matchesSearch = (
        (taxReturn.receiptId && taxReturn.receiptId.toLowerCase().includes(term)) ||
        (taxReturn.tinNumber && taxReturn.tinNumber.toLowerCase().includes(term)) ||
        (taxReturn.taxpayerName && taxReturn.taxpayerName.toLowerCase().includes(term)) ||
        (taxReturn.nidNumber && taxReturn.nidNumber.toLowerCase().includes(term)) ||
        (taxReturn.fathersName && taxReturn.fathersName.toLowerCase().includes(term))
      );
    }
    
    if (assessmentYearFilter) {
      matchesYear = taxReturn.assessmentYear === assessmentYearFilter;
    }
    
    return matchesSearch && matchesYear;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredReturns.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentReturns = filteredReturns.slice(startIndex, endIndex);

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

  // Format currency
  const formatCurrency = (amount) => {
    return parseFloat(amount || 0).toLocaleString('bn-BD', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Show delete confirmation popup
  const confirmDeleteReturn = (taxReturn) => {
    setReturnToDelete(taxReturn);
    setShowDeletePopup(true);
  };

  // Delete tax return
  const deleteTaxReturn = async () => {
    if (!returnToDelete) return;

    try {
      setDeletingId(returnToDelete._id);
      const response = await api.delete(`/api/user/tax-return/${returnToDelete._id}`);
      
      if (response.data.success) {
        toast.success('আয়কর রিটার্ন সফলভাবে ডিলিট করা হয়েছে');
        // Refresh tax returns list and statistics
        fetchTaxReturns();
        fetchStatistics();
        // If the deleted return is the currently displayed one, clear it
        if (receiptId === returnToDelete._id) {
          setReceiptId('');
        }
      } else {
        toast.error(response.data.message || 'আয়কর রিটার্ন ডিলিট করতে সমস্যা হয়েছে');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.message || 'আয়কর রিটার্ন ডিলিট করতে সমস্যা হয়েছে');
    } finally {
      setDeletingId(null);
      setShowDeletePopup(false);
      setReturnToDelete(null);
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setShowDeletePopup(false);
    setReturnToDelete(null);
  };

  // Deduct balance from user account
  const deductBalance = async (amount) => {
    try {
      const response = await api.post('/api/user/balance/deduct', {
        amount: amount,
        service: 'আয়কর রিটার্ন সার্টিফিকেট',
        reference: formData.referenceNo || `TAX_${Date.now()}`,
        description: `আয়কর রিটার্ন তৈরি - করদাতা: ${formData.taxpayerName}`
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

  // Save Tax Return Function (Updated for new fields)
  const saveTaxReturn = async () => {
    try {
      setIsSaving(true);

      // Validate required fields (updated with all fields from image)
      const requiredFields = [
        'referenceNo',
        'taxpayerName', 
        'fathersName', 
        'mothersName',
        'currentAddress',
        'permanentAddress',
        'nidNumber', 
        'tinNumber', 
        'totalIncome',
        'assessmentYear', 
        'financialYear', 
        'returnSubmissionDate'
      ];

      for (const field of requiredFields) {
        if (!formData[field] || formData[field].toString().trim() === '') {
          toast.error(`${field} ফিল্ডটি পূরণ করুন`);
          setIsSaving(false);
          return;
        }
      }

      // Validate TIN format (12 digits)
      const tinRegex = /^\d{12}$/;
      if (!tinRegex.test(formData.tinNumber.replace(/\s/g, ''))) {
        toast.error('টিআইএন নম্বর ১২ ডিজিটের হতে হবে');
        setIsSaving(false);
        return;
      }

      // Validate NID format
      const nidRegex = /^\d{10,17}$/;
      if (!nidRegex.test(formData.nidNumber.replace(/\s/g, ''))) {
        toast.error('এনআইডি নম্বর সঠিক ফরম্যাটে লিখুন (১০-১৭ ডিজিট)');
        setIsSaving(false);
        return;
      }

      // Check if total tax paid is sufficient
      if (parseFloat(formData.totalTaxPaid) < netTaxPayable) {
        if (!window.confirm(`আপনি ${netTaxPayable.toFixed(2)} টাকার কম ট্যাক্স দিয়েছেন। আপনি কি এগিয়ে যেতে চান?`)) {
          setIsSaving(false);
          return;
        }
      }

      // Use dynamic service price
      const serviceCharge = servicePrice; // Dynamic price from API

      // First deduct balance from user account
      const deductionResult = await deductBalance(serviceCharge);
      
      if (!deductionResult.success) {
        toast.error(`ব্যালেন্স কাটতে ব্যর্থ: ${deductionResult.message}`);
        setIsSaving(false);
        return;
      }

      // If balance deduction successful, save the tax return
      const payload = {
        // Reference number
        referenceNo: formData.referenceNo.trim(),
        
        // Personal information from image
        taxpayerName: formData.taxpayerName.trim(),
        fathersName: formData.fathersName.trim(),
        mothersName: formData.mothersName.trim(),
        currentAddress: formData.currentAddress.trim(),
        permanentAddress: formData.permanentAddress.trim(),
        taxpayerStatus: formData.taxpayerStatus,
        
        // Identification numbers
        nidNumber: formData.nidNumber.trim(),
        tinNumber: formData.tinNumber.trim(),
        
        // Tax information
        assessmentYear: formData.assessmentYear,
        financialYear: formData.financialYear,
        circle: formData.circle,
        taxZone: formData.taxZone,
        totalIncome: parseFloat(formData.totalIncome) || 0,
        totalTaxPaid: parseFloat(formData.totalTaxPaid) || 0,
        taxRebate: parseFloat(formData.taxRebate) || 0,
        
        // Return registration
        returnRegisterVolumeNo: formData.returnRegisterVolumeNo.trim(),
        returnSubmissionDate: formData.returnSubmissionDate,
        
        // Office information
        taxOfficeName: formData.taxOfficeName,
        taxOfficeAddress: formData.taxOfficeAddress,
        
        // Certificate information
        certificateIssuer: formData.certificateIssuer,
        
        transactionId: deductionResult.data?.transactionId || null
      };

      const response = await api.post('/api/user/tax-return/save', payload);
      
      if (response.data.success) {
        const savedReceiptId = response.data.data.receiptId;
        setReceiptId(savedReceiptId);
        
        // Update user balance in localStorage
        if (deductionResult.data?.newBalance !== undefined) {
          const userData = JSON.parse(localStorage.getItem('user'));
          userData.balance = deductionResult.data.newBalance;
          localStorage.setItem('user', JSON.stringify(userData));
        }
        
        // Refresh tax returns list and statistics
        fetchTaxReturns();
        fetchStatistics();
        
        toast.success("আয়কর রিটার্ন সফল হয়েছে!");
        setTimeout(() => {
          navigate(`/clone-services/tax-return-clone-download/${savedReceiptId}`);
        }, 500);
      } else {
        toast.error(response.data.message || 'আয়কর রিটার্ন সংরক্ষণ ব্যর্থ হয়েছে');
      }
    } catch (error) {
      console.error('Save error:', error);
      if (error.response) {
        toast.error(error.response.data.message || 'আয়কর রিটার্ন সংরক্ষণ করতে সমস্যা হয়েছে');
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
        taxpayerName: '',
        fathersName: '',
        mothersName: '',
        currentAddress: '',
        permanentAddress: '',
        taxpayerStatus: 'Individual -> Bangladesh -> Having NID',
        nidNumber: '',
        tinNumber: '',
        assessmentYear: '2025-2026',
        financialYear: '2024-2025',
        circle: 'Circle-114',
        taxZone: 'Taxes Zone-06, Dhaka',
        totalIncome: '',
        totalTaxPaid: '',
        taxRebate: '',
        returnRegisterVolumeNo: '',
        returnSubmissionDate: new Date().toISOString().split('T')[0],
        taxOfficeName: 'National Board of Revenue',
        taxOfficeAddress: 'Income Tax Department, Dhaka',
        certificateIssuer: 'System Generated'
      });
      setReceiptId('');
      toast.success('ফর্ম ক্লিয়ার করা হয়েছে');
    }
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
      const response = await axios.get(`${base_url}/api/user/service/notice/return-clone`);
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
  // Action Buttons component for table
  const ActionButtons = ({ taxReturn }) => (
    <div className="flex justify-center gap-2">
      <button
        onClick={() => navigate(`/clone-services/tax-return-clone-download/${taxReturn.receiptId}`)}
        className={`p-1.5 rounded cursor-pointer transition-colors duration-200 ${
          isDarkMode 
            ? 'bg-blue-900/30 text-blue-300 hover:bg-blue-800/50' 
            : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
        }`}
        title="ডাউনলোড করুন"
      >
        <Download size={16} />
      </button>
      
      <button
        onClick={() => confirmDeleteReturn(taxReturn)}
        disabled={deletingId === taxReturn._id}
        className={`p-1.5 rounded cursor-pointer transition-colors duration-200 ${
          isDarkMode 
            ? 'bg-red-900/30 text-red-300 hover:bg-red-800/50 disabled:opacity-50' 
            : 'bg-red-100 text-red-600 hover:bg-red-200 disabled:opacity-50'
        }`}
        title="ডিলিট করুন"
      >
        {deletingId === taxReturn._id ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
        ) : (
          <Trash2 size={16} />
        )}
      </button>
    </div>
  );

  // Get unique assessment years for filter
  const assessmentYears = [...new Set(taxReturns.map(returnItem => returnItem.assessmentYear))].sort().reverse();

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
              আয়কর রিটার্ন সার্টিফিকেট
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
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Taxpayer Information */}
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-4">
                    <User className="w-5 h-5 text-teal-500" />
                    <h3 className="font-bold text-lg">ব্যক্তিগত তথ্য:</h3>
                  </div>
                  
                  {/* Reference No Field with Generate Button */}
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <label className={`text-[15px] font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        রেফারেন্স নং *
                      </label>
                      <button
                        type="button"
                        onClick={regenerateReferenceNumber}
                        className={`flex items-center gap-1 text-xs px-2 border-[1px] cursor-pointer border-gray-200 py-1 rounded transition-colors duration-200 ${
                          isDarkMode 
                            ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                        }`}
                        title="Generate New Reference Number"
                      >
                        <RefreshCw size={10} />
                        জেনারেট করুন
                      </button>
                    </div>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                      <input 
                        type="text"
                        name="referenceNo"
                        value={formData.referenceNo}
                        onChange={handleInputChange}
                        className={`w-full border rounded-md text-sm md:text-[15px] pl-10 pr-4 py-2 focus:outline-none focus:ring-2 ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white focus:ring-green-500 focus:ring-offset-gray-800' 
                            : 'bg-white border-gray-300 focus:ring-green-500 focus:ring-offset-white'
                        }`}
                        placeholder="রেফারেন্স নং"
                        required
                      />
                    </div>
                  </div>

                  <InputField 
                    label="করদাতার নাম *" 
                    name="taxpayerName" 
                    value={formData.taxpayerName} 
                    onChange={handleInputChange} 
                    isDarkMode={isDarkMode} 
                    placeholder="করদাতার নাম লিখুন"
                    required
                    icon={<User size={16} />}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField 
                      label="পিতার নাম *" 
                      name="fathersName" 
                      value={formData.fathersName} 
                      onChange={handleInputChange} 
                      isDarkMode={isDarkMode} 
                      placeholder="পিতার নাম লিখুন"
                      required
                      icon={<Users size={16} />}
                    />
                    
                    <InputField 
                      label="মাতার নাম *" 
                      name="mothersName" 
                      value={formData.mothersName} 
                      onChange={handleInputChange} 
                      isDarkMode={isDarkMode} 
                      placeholder="মাতার নাম লিখুন"
                      required
                      icon={<Users size={16} />}
                    />
                  </div>
                  
                  <InputField 
                    label="বর্তমান ঠিকানা *" 
                    name="currentAddress" 
                    value={formData.currentAddress} 
                    onChange={handleInputChange} 
                    isDarkMode={isDarkMode} 
                    placeholder="বর্তমান ঠিকানা লিখুন"
                    required
                    icon={<MapPin size={16} />}
                  />
                  
                  <InputField 
                    label="স্থায়ী ঠিকানা *" 
                    name="permanentAddress" 
                    value={formData.permanentAddress} 
                    onChange={handleInputChange} 
                    isDarkMode={isDarkMode} 
                    placeholder="স্থায়ী ঠিকানা লিখুন"
                    required
                    icon={<Home size={16} />}
                  />
                  
                  <InputField 
                    label="করদাতার অবস্থা" 
                    name="taxpayerStatus" 
                    value={formData.taxpayerStatus} 
                    onChange={handleInputChange} 
                    isDarkMode={isDarkMode} 
                    placeholder="করদাতার অবস্থা"
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField 
                      label="এনআইডি নম্বর *" 
                      name="nidNumber" 
                      value={formData.nidNumber} 
                      onChange={handleInputChange} 
                      isDarkMode={isDarkMode} 
                      placeholder="১০-১৭ ডিজিটের এনআইডি নম্বর"
                      required
                    />
                    
                    <InputField 
                      label="টিআইএন নম্বর *" 
                      name="tinNumber" 
                      value={formData.tinNumber} 
                      onChange={handleInputChange} 
                      isDarkMode={isDarkMode} 
                      placeholder="১২ ডিজিটের টিআইএন নম্বর"
                      required
                      pattern="\d{12}"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column - Tax Information */}
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-4">
                    <FaBangladeshiTakaSign className="w-5 h-5 text-teal-500" />
                    <h3 className="font-bold text-lg">কর তথ্য:</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField 
                      label="মূল্যায়ন বছর *" 
                      name="assessmentYear" 
                      value={formData.assessmentYear} 
                      onChange={handleInputChange} 
                      isDarkMode={isDarkMode} 
                      placeholder="2025-2026"
                      required
                      icon={<Calendar size={16} />}
                    />
                    
                    <InputField 
                      label="অর্থবছর *" 
                      name="financialYear" 
                      value={formData.financialYear} 
                      onChange={handleInputChange} 
                      isDarkMode={isDarkMode} 
                      placeholder="2024-2025"
                      required
                      icon={<Calendar size={16} />}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField 
                      label="সার্কেল *" 
                      name="circle" 
                      value={formData.circle} 
                      onChange={handleInputChange} 
                      isDarkMode={isDarkMode} 
                      placeholder="সার্কেল"
                      required
                    />
                    
                    <InputField 
                      label="কর জোন *" 
                      name="taxZone" 
                      value={formData.taxZone} 
                      onChange={handleInputChange} 
                      isDarkMode={isDarkMode} 
                      placeholder="কর জোন"
                      required
                    />
                  </div>
                  
                  <InputField 
                    label="মোট আয় *" 
                    name="totalIncome" 
                    value={formData.totalIncome} 
                    onChange={handleInputChange} 
                    isDarkMode={isDarkMode} 
                    placeholder="মোট বার্ষিক আয়"
                    type="number"
                    required
                    icon={<FaBangladeshiTakaSign size={16} />}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField 
                      label="কর রিবেট" 
                      name="taxRebate" 
                      value={formData.taxRebate} 
                      onChange={handleInputChange} 
                      isDarkMode={isDarkMode} 
                      placeholder="কর রিবেটের পরিমাণ"
                      type="number"
                    />
                    
                    <InputField 
                      label="মোট প্রদত্ত কর *" 
                      name="totalTaxPaid" 
                      value={formData.totalTaxPaid} 
                      onChange={handleInputChange} 
                      isDarkMode={isDarkMode} 
                      placeholder="মোট প্রদত্ত করের পরিমাণ"
                      type="number"
                      required
                    />
                  </div>
                  
                  <InputField 
                    label="রিটার্ন রেজিস্টার ভলিউম নং" 
                    name="returnRegisterVolumeNo" 
                    value={formData.returnRegisterVolumeNo} 
                    onChange={handleInputChange} 
                    isDarkMode={isDarkMode} 
                    placeholder="রেজিস্টার ভলিউম নং"
                  />
                  
                  <InputField 
                    label="রিটার্ন জমা দেওয়ার তারিখ *" 
                    name="returnSubmissionDate" 
                    value={formData.returnSubmissionDate} 
                    onChange={handleInputChange} 
                    isDarkMode={isDarkMode} 
                    type="date"
                    required
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField 
                      label="ট্যাক্স অফিসের নাম" 
                      name="taxOfficeName" 
                      value={formData.taxOfficeName} 
                      onChange={handleInputChange} 
                      isDarkMode={isDarkMode} 
                      placeholder="ট্যাক্স অফিসের নাম"
                    />
                    
                    <InputField 
                      label="ট্যাক্স অফিসের ঠিকানা" 
                      name="taxOfficeAddress" 
                      value={formData.taxOfficeAddress} 
                      onChange={handleInputChange} 
                      isDarkMode={isDarkMode} 
                      placeholder="ট্যাক্স অফিসের ঠিকানা"
                    />
                  </div>
                  
                  <InputField 
                    label="সার্টিফিকেট ইস্যুকারী" 
                    name="certificateIssuer" 
                    value={formData.certificateIssuer} 
                    onChange={handleInputChange} 
                    isDarkMode={isDarkMode} 
                    placeholder="সার্টিফিকেট ইস্যুকারী"
                  />
                </div>
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
                onClick={saveTaxReturn}
                disabled={isSaving}
                className={`w-full hover:bg-theme_color text-white font-bold py-4 rounded shadow-sm flex items-center justify-center gap-2 transition-all text-sm md:text-base cursor-pointer ${
                  isSaving
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-theme_color hover:scale-[1.02]'
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
            
            {/* Previous Tax Returns Table */}
            <div className="mt-12">
              <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h2 className={`text-lg md:text-xl font-bold ${isDarkMode ? 'text-green-400' : 'text-[#1abc9c]'}`}>
                  পূর্ববর্তী আয়কর রিটার্ন তালিকা
                </h2>
                
                <div className="flex flex-col md:flex-row gap-4">
                  
                  {/* Search Bar */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="আয়কর রিটার্ন খুঁজুন..."
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
                          করদাতার নাম
                        </th>
                        <th className={`p-3 text-sm font-semibold border-r transition-colors duration-300 ${
                          isDarkMode
                            ? 'text-gray-300 border-gray-700'
                            : 'text-gray-600 border-gray-200'
                        }`}>
                          টিআইএন
                        </th>
                        <th className={`p-3 text-sm font-semibold border-r transition-colors duration-300 ${
                          isDarkMode
                            ? 'text-gray-300 border-gray-700'
                            : 'text-gray-600 border-gray-200'
                        }`}>
                          মূল্যায়ন বছর
                        </th>
                        <th className={`p-3 text-sm font-semibold border-r transition-colors duration-300 ${
                          isDarkMode
                            ? 'text-gray-300 border-gray-700'
                            : 'text-gray-600 border-gray-200'
                        }`}>
                          মোট আয়
                        </th>
                        <th className={`p-3 text-sm font-semibold border-r transition-colors duration-300 ${
                          isDarkMode
                            ? 'text-gray-300 border-gray-700'
                            : 'text-gray-600 border-gray-200'
                        }`}>
                          প্রদত্ত কর
                        </th>
                        <th className={`p-3 text-sm font-semibold transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          অ্যাকশন
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentReturns.length === 0 ? (
                        <tr className="">
                          <td colSpan="8" className="p-8 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <FileText className={isDarkMode ? 'text-gray-600' : 'text-gray-400'} size={48} />
                              <p className={`font-medium mb-2 transition-colors duration-300 ${
                                isDarkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                কোন আয়কর রিটার্ন পাওয়া যায়নি
                              </p>
                              <p className={`text-sm max-w-md transition-colors duration-300 ${
                                isDarkMode ? 'text-gray-500' : 'text-gray-500'
                              }`}>
                                {searchTerm || assessmentYearFilter 
                                  ? 'আপনার সার্চের সাথে মিলছে এমন কোনো আয়কর রিটার্ন নেই' 
                                  : 'আপনার প্রথম আয়কর রিটার্ন এখনই তৈরি করুন!'}
                              </p>
                              {(searchTerm || assessmentYearFilter) && (
                                <button
                                  onClick={() => {
                                    setSearchTerm('');
                                    setAssessmentYearFilter('');
                                  }}
                                  className="mt-4 text-sm bg-blue-600 text-white px-4 py-2 rounded-sm cursor-pointer"
                                >
                                  সার্চ ক্লিয়ার করুন
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ) : (
                        currentReturns.map((taxReturn, index) => (
                          <tr 
                            key={taxReturn._id || index} 
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
                                ? 'text-blue-300 border-gray-700'
                                : 'text-blue-600 border-gray-200'
                              }`}>
                              <div className="font-mono text-xs">{taxReturn.receiptId || 'N/A'}</div>
                            </td>
                            <td className={`p-3 text-sm border-r transition-colors duration-300 ${
                              isDarkMode
                                ? 'text-gray-200 border-gray-700'
                                : 'text-gray-800 border-gray-200'
                            }`}>
                              <div className="font-medium">{taxReturn.taxpayerName || 'N/A'}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                পিতা: {taxReturn.fathersName || 'N/A'}
                              </div>
                            </td>
                            <td className={`p-3 text-sm border-r transition-colors duration-300 ${
                              isDarkMode
                                ? 'text-gray-200 border-gray-700'
                                : 'text-gray-800 border-gray-200'
                            }`}>
                              <div className="font-mono font-bold">{taxReturn.tinNumber || 'N/A'}</div>
                            </td>
                            <td className={`p-3 text-sm border-r transition-colors duration-300 ${
                              isDarkMode
                                ? 'text-gray-200 border-gray-700'
                                : 'text-gray-800 border-gray-200'
                            }`}>
                              <span className="font-bold">{taxReturn.assessmentYear || 'N/A'}</span>
                            </td>
                            <td className={`p-3 text-sm font-bold border-r  transition-colors duration-300 ${
                              isDarkMode
                                ? 'text-gray-200 border-gray-700'
                                : 'text-gray-800 border-gray-200'
                            }`}>
                              {formatCurrency(taxReturn.totalIncome)} ৳
                            </td>
                            <td className={`p-3 text-sm font-bold border-gray-200 border-r transition-colors duration-300 ${
                              taxReturn.totalTaxPaid > 0 
                                ? isDarkMode ? 'text-green-400' : 'text-green-600'
                                : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              {formatCurrency(taxReturn.totalTaxPaid)} ৳
                            </td>
                            <td className="p-3">
                              <ActionButtons taxReturn={taxReturn} />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination */}
              {filteredReturns.length > 0 && (
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
                      {Math.min(endIndex, filteredReturns.length)}
                    </span> এর{' '}
                    <span className={`font-bold transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {filteredReturns.length}
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

      {/* Delete Confirmation Popup */}
      {showDeletePopup && returnToDelete && (
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
                আয়কর রিটার্ন ডিলিট করুন
              </h3>
              
              <p className={`text-sm md:text-base mb-4 md:mb-6 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                আপনি কি নিশ্চিত যে আপনি এই আয়কর রিটার্নটি ডিলিট করতে চান?
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
                      করদাতার নাম
                    </p>
                    <p className={`font-semibold text-sm md:text-base truncate transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-800'
                    }`}>
                      {returnToDelete.taxpayerName}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className={`text-xs md:text-sm transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      টিআইএন নম্বর
                    </p>
                    <p className={`font-semibold text-sm md:text-base truncate transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-800'
                    }`}>
                      {returnToDelete.tinNumber}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className={`text-xs md:text-sm transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      মূল্যায়ন বছর
                    </p>
                    <p className={`font-semibold text-sm md:text-base truncate transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-800'
                    }`}>
                      {returnToDelete.assessmentYear}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className={`text-xs md:text-sm transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      মোট আয়
                    </p>
                    <p className={`font-semibold text-sm md:text-base transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-800'
                    }`}>
                      {formatCurrency(returnToDelete.totalIncome)} ৳
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
                  onClick={deleteTaxReturn}
                  disabled={deletingId === returnToDelete._id}
                  className={`flex-1 font-semibold py-3 px-4 rounded-xl transition duration-200 text-sm md:text-base cursor-pointer ${
                    deletingId === returnToDelete._id
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {deletingId === returnToDelete._id ? (
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
                নোট: একবার ডিলিট করলে এই আয়কর রিটার্নটি পুনরুদ্ধার করা যাবে না।
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// --- Helper Components ---

function InputField({ label, name, value, onChange, placeholder, isDarkMode, type = "text", required = false, pattern, icon }) {
  return (
    <div className="flex flex-col flex-1">
      <label className={`text-[15px] font-semibold mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input 
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          className={`w-full border rounded-md text-sm md:text-[15px] px-4 py-2 focus:outline-none focus:ring-2 ${icon ? 'pl-10' : ''} ${
            isDarkMode 
              ? 'bg-gray-700 border-gray-600 text-white focus:ring-green-500 focus:ring-offset-gray-800' 
              : 'bg-white border-gray-300 focus:ring-green-500 focus:ring-offset-white'
          }`}
          placeholder={placeholder}
          required={required}
          pattern={pattern}
          min={type === 'number' ? '0' : undefined}
          step={type === 'number' ? '0.01' : undefined}
        />
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, isDarkMode }) {
  const colorClasses = {
    blue: {
      bg: isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100',
      text: isDarkMode ? 'text-blue-400' : 'text-blue-600',
      border: isDarkMode ? 'border-blue-800/50' : 'border-blue-300'
    },
    green: {
      bg: isDarkMode ? 'bg-green-900/30' : 'bg-green-100',
      text: isDarkMode ? 'text-green-400' : 'text-green-600',
      border: isDarkMode ? 'border-green-800/50' : 'border-green-300'
    },
    purple: {
      bg: isDarkMode ? 'bg-purple-900/30' : 'bg-purple-100',
      text: isDarkMode ? 'text-purple-400' : 'text-purple-600',
      border: isDarkMode ? 'border-purple-800/50' : 'border-purple-300'
    },
    yellow: {
      bg: isDarkMode ? 'bg-yellow-900/30' : 'bg-yellow-100',
      text: isDarkMode ? 'text-yellow-400' : 'text-yellow-600',
      border: isDarkMode ? 'border-yellow-800/50' : 'border-yellow-300'
    }
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color].bg} ${colorClasses[color].border}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{title}</p>
          <p className={`text-xl md:text-2xl font-bold mt-1 ${colorClasses[color].text}`}>{value}</p>
        </div>
        <div className={`p-2 rounded-full ${colorClasses[color].text}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function CalculatorIcon({ size = 16 }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <line x1="8" y1="8" x2="16" y2="8" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="8" y1="16" x2="12" y2="16" />
      <line x1="14" y1="14" x2="18" y2="18" />
    </svg>
  );
}

export default TaxReturn;