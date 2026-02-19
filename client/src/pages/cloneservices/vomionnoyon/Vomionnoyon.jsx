import React, { useState, useRef, useEffect } from 'react';
import Header from '../../../components/header/Header';
import Sidebar from '../../../components/sidebar/Sidebar';
import { Trash2, Printer, ArrowLeft, Save, Eye, Download, FileText, History, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Calendar, Info } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ApertureLoader from '../../../components/loader/ApertureLoader';
import toast, { Toaster } from 'react-hot-toast';

function Vomionnoyon() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [receiptId, setReceiptId] = useState('');
  const [servicePrice, setServicePrice] = useState(0); // Added state for service price
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

  // Success popup state
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [orderSuccessData, setOrderSuccessData] = useState(null);

  // Delete confirmation popup state
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [receiptToDelete, setReceiptToDelete] = useState(null);

  // State for General Info
  const [formData, setFormData] = useState({
    formNo: '',
    porishishto: '',
    slNo: '',
    onuchhed: '',
    officeName: '',
    mouza: '',
    upazila: '',
    district: '',
    khatian: '',
    holding: '',
    totalLand: '',
    arrear3Plus: '',
    arrearLast3: '',
    interest: '',
    currentDemand: '',
    totalDemand: '',
    totalCollect: '',
    totalArrear: '',
    inWords: '',
    note: '',
    chalanNo: '',
    dateBn: '',
    dateEn: ''
  });

  const [owners, setOwners] = useState([{ name: '', portion: '' }]);
  const [lands, setLands] = useState([{ dagNo: '', class: '', amount: '' }]);

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
  useEffect(() => {
    const fetchServicePrice = async () => {
      try {
        const response = await axios.get(`${base_url}/api/user/service/price/vomi-unnoyon-kor`);
        console.log(response)
        if (response.data) {
          setServicePrice(response.data.price);
        } else {
          setServicePrice(100); // Default fallback price
        }
      } catch (error) {
        console.error('Error fetching service price:', error);
        setServicePrice(100); // Default fallback price
      }
    };

    fetchServicePrice();
  }, [base_url]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  // Handlers
  const addOwner = () => setOwners([...owners, { name: '', portion: '' }]);
  const removeOwner = (index) => setOwners(owners.filter((_, i) => i !== index));
  const addLand = () => setLands([...lands, { dagNo: '', class: '', amount: '' }]);
  const removeLand = (index) => setLands(lands.filter((_, i) => i !== index));

  const handleOwnerChange = (index, field, value) => {
    const newOwners = [...owners];
    newOwners[index][field] = value;
    setOwners(newOwners);
  };

  const handleLandChange = (index, field, value) => {
    const newLands = [...lands];
    newLands[index][field] = value;
    setLands(newLands);
  };

  const toBn = (n) => n.toString().replace(/\d/g, d => "০১২৩৪৫৬৭৮৯"[d]);

  // QR Code Data String - Updated to include full URL
  const getQRValue = (slNo, khatian, totalCollect, dateEn, receiptId) => {
    // Create the verification URL with receipt ID
    const verificationUrl = `https://api.xbdapi.my.id/clone-services/vomi-unnoyon-kor-downlaod/${receiptId || 'N/A'}`;
    
    // QR code content with both verification URL and basic receipt info
    return `ভূমি উন্নয়ন কর রসিদ
সিরিয়াল: ${slNo}
খতিয়ান: ${khatian}
পরিমাণ: ${totalCollect} টাকা
তারিখ: ${dateEn}

যাচাই করুন: ${verificationUrl}`;
  };

  const qrValue = getQRValue(formData.slNo, formData.khatian, formData.totalCollect, formData.dateEn, receiptId);

  // Fetch receipts list
  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/user/vomionnoyon/all');
      if (response.data.success) {
        setReceipts(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching receipts:', error);
      toast.error('রসিদ তালিকা লোড করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, []);

  // Filter receipts based on search term
  const filteredReceipts = receipts.filter(receipt => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (receipt.receiptId && receipt.receiptId.toLowerCase().includes(term)) ||
      (receipt.slNo && receipt.slNo.toLowerCase().includes(term)) ||
      (receipt.officeName && receipt.officeName.toLowerCase().includes(term)) ||
      (receipt.mouza && receipt.mouza.toLowerCase().includes(term)) ||
      (receipt.upazila && receipt.upazila.toLowerCase().includes(term)) ||
      (receipt.khatian && receipt.khatian.toLowerCase().includes(term))
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
    const date = new Date(dateString);
    return date.toLocaleDateString('bn-BD', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `${amount || '০'} টাকা`;
  };

  // Get status color
  const getStatusColor = (status, isDark) => {
    switch (status) {
      case 'completed':
        return isDark ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-800';
      case 'draft':
        return isDark ? 'bg-yellow-900/40 text-yellow-300' : 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return isDark ? 'bg-gray-900/40 text-gray-300' : 'bg-gray-100 text-gray-800';
      default:
        return isDark ? 'bg-gray-900/40 text-gray-300' : 'bg-gray-100 text-gray-800';
    }
  };

  // Get status text
  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'সম্পন্ন';
      case 'draft':
        return 'খসড়া';
      case 'archived':
        return 'আর্কাইভড';
      default:
        return status;
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
      const response = await api.delete(`/api/user/vomionnoyon/${receiptToDelete._id}`);
      
      if (response.data.success) {
        toast.success('রসিদ সফলভাবে ডিলিট করা হয়েছে');
        // Refresh receipts list
        fetchReceipts();
        // If the deleted receipt is the currently displayed one, clear it
        if (receiptId === receiptToDelete._id) {
          setReceiptId('');
          setSaveSuccess(false);
        }
      } else {
        toast.error(response.data.message || 'রসিদ ডিলিট করতে সমস্যা হয়েছে');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.message || 'রসিদ ডিলিট করতে সমস্যা হয়েছে');
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

  // Download receipt as PDF
  const downloadReceipt = (receipt) => {
    toast.loading('PDF তৈরি করা হচ্ছে...', { duration: 2000 });
    setTimeout(() => {
      toast.success(`PDF ডাউনলোড করা হবে: ${receipt.receiptId}`);
    }, 2000);
  };

  // Action Buttons component for table
  const ActionButtons = ({ receipt }) => (
    <div className="flex justify-center gap-2">
      <button
        onClick={() => navigate(`/clone-services/vomi-unnoyon-kor-downlaod/${receipt.receiptId}`)}
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

  // Deduct balance from user account
  const deductBalance = async () => {
    try {
      const response = await api.post('/api/user/balance/deduct', {
        amount: servicePrice,
        service: 'ভূমি উন্নয়ন কর রসিদ',
        reference: `VOM_${Date.now()}`,
        description: `ভূমি উন্নয়ন কর রসিদ তৈরি - সিরিয়াল নং: ${formData.slNo}`
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

  // Save Receipt Function with Balance Deduction
  const saveReceipt = async () => {
    try {
      setIsSaving(true);
      setSaveSuccess(false);

      // Validate required fields
      const requiredFields = ['formNo', 'porishishto', 'slNo', 'officeName', 'mouza', 'upazila',
        'district', 'khatian', 'holding', 'totalLand', 'currentDemand', 'totalCollect',
        'inWords', 'note', 'dateBn', 'dateEn'];

      for (const field of requiredFields) {
        if (!formData[field] || formData[field].trim() === '') {
          toast.error(`${field} ফিল্ডটি পূরণ করুন`);
          setIsSaving(false);
          return;
        }
      }

      if (owners.length === 0) {
        toast.error('অন্তত একজন মালিকের তথ্য যোগ করুন');
        setIsSaving(false);
        return;
      }

      if (lands.length === 0) {
        toast.error('অন্তত একটি জমির তথ্য যোগ করুন');
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

      // If balance deduction successful, save the receipt
      const payload = {
        formNo: formData.formNo,
        porishishto: formData.porishishto,
        slNo: formData.slNo,
        onuchhed: formData.onuchhed || '৩৯২',
        officeName: formData.officeName,
        mouza: formData.mouza,
        upazila: formData.upazila,
        district: formData.district,
        khatian: formData.khatian,
        holding: formData.holding,
        totalLand: formData.totalLand,
        arrear3Plus: formData.arrear3Plus || '০',
        arrearLast3: formData.arrearLast3 || '০',
        interest: formData.interest || '০',
        currentDemand: formData.currentDemand,
        totalDemand: formData.totalDemand || formData.currentDemand,
        totalCollect: formData.totalCollect,
        totalArrear: formData.totalArrear || '০',
        inWords: formData.inWords,
        note: formData.note,
        chalanNo: formData.chalanNo || '',
        dateBn: formData.dateBn,
        dateEn: formData.dateEn,
        owners: owners,
        lands: lands,
        transactionId: deductionResult.data?.transactionId || null
      };

      const response = await api.post(`${base_url}/api/user/vomionnoyon/save`, payload);
      
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
        
        // Show success popup
        setOrderSuccessData({
          orderId: savedReceiptId,
          serviceName: 'ভূমি উন্নয়ন কর রসিদ',
          phoneNumber: user?.phone || 'N/A',
          totalAmount: servicePrice,
          duration: 'অবিলম্বে'
        });
        toast.success("ভূমি উন্নয়ন কর অর্ডার সফল হয়েছে!")
        
        // Navigate to download page after a short delay
        setTimeout(() => {
          navigate(`/clone-services/vomi-unnoyon-kor-downlaod/${savedReceiptId}`);
        }, 500);
        
      } else {
        toast.error(response.data.message || 'রসিদ সংরক্ষণ ব্যর্থ হয়েছে');
      }
    } catch (error) {
      console.error('Save error:', error);
      if (error.response) {
        toast.error(error.response.data.message || 'রসিদ সংরক্ষণ করতে সমস্যা হয়েছে');
      } else {
        toast.error('নেটওয়ার্ক সমস্যা! আবার চেষ্টা করুন');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Navigate to receipts history
  const goToHistory = () => {
    navigate('/user/vomionnoyon/history');
  };

  // Navigate to view single receipt
  const viewSavedReceipt = () => {
    if (receiptId) {
      navigate(`/user/vomionnoyon/view/${receiptId}`);
    }
  };

  // Download as PDF (client-side generation)
  const downloadAsPDF = () => {
    toast.loading('PDF তৈরি হচ্ছে...', { duration: 2000 });
    setTimeout(() => {
      toast.success('PDF ডাউনলোড করা হবে');
    }, 2000);
  };

  // Clear form
  const clearForm = () => {
    if (window.confirm('আপনি কি ফর্মটি ক্লিয়ার করতে চান?')) {
      setFormData({
        formNo: '',
        porishishto: '',
        slNo: '',
        onuchhed: '',
        officeName: '',
        mouza: '',
        upazila: '',
        district: '',
        khatian: '',
        holding: '',
        totalLand: '',
        arrear3Plus: '',
        arrearLast3: '',
        interest: '',
        currentDemand: '',
        totalDemand: '',
        totalCollect: '',
        totalArrear: '',
        inWords: '',
        note: '',
        chalanNo: '',
        dateBn: '',
        dateEn: ''
      });
      setOwners([{ name: '', portion: '' }]);
      setLands([{ dagNo: '', class: '', amount: '' }]);
      setReceiptId('');
      setSaveSuccess(false);
      toast.success('ফর্ম ক্লিয়ার করা হয়েছে');
    }
  };

  // Load saved receipt if ID exists in URL
  useEffect(() => {
    const loadSavedReceipt = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const receiptIdParam = urlParams.get('receiptId');
      
      if (receiptIdParam) {
        try {
          const response = await api.get(`/api/user/vomionnoyon/receipt/${receiptIdParam}`);
          if (response.data.success) {
            const receipt = response.data.data;
            setFormData({
              formNo: receipt.formNo,
              porishishto: receipt.porishishto,
              slNo: receipt.slNo,
              onuchhed: receipt.onuchhed,
              officeName: receipt.officeName,
              mouza: receipt.mouza,
              upazila: receipt.upazila,
              district: receipt.district,
              khatian: receipt.khatian,
              holding: receipt.holding,
              totalLand: receipt.totalLand,
              arrear3Plus: receipt.arrear3Plus,
              arrearLast3: receipt.arrearLast3,
              interest: receipt.interest,
              currentDemand: receipt.currentDemand,
              totalDemand: receipt.totalDemand,
              totalCollect: receipt.totalCollect,
              totalArrear: receipt.totalArrear,
              inWords: receipt.inWords,
              note: receipt.note,
              chalanNo: receipt.chalanNo,
              dateBn: receipt.dateBn,
              dateEn: receipt.dateEn
            });
            setOwners(receipt.owners);
            setLands(receipt.lands);
            setReceiptId(receipt.receiptId);
            setSaveSuccess(true);
            toast.success('রসিদ লোড করা হয়েছে');
          }
        } catch (error) {
          console.error('Error loading receipt:', error);
          toast.error('রসিদ লোড করতে সমস্যা হয়েছে');
        }
      }
    };

    loadSavedReceipt();
  }, []);
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
      const response = await axios.get(`${base_url}/api/user/service/notice/vomiunnoyon`);
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
      />
      
      <div className={`font-anek lg:ml-72 mt-[9vh] min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-700'}`}>
        <Header toggleSidebar={toggleSidebar} />
        <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />

        <main className="min-h-[91vh] p-4 md:p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className={`text-lg md:text-2xl font-bold ${isDarkMode ? 'text-theme_color' : 'text-theme_color'}`}>
              ভূমি উন্নয়ন কর
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
              {/* General Info */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h2 className="font-bold  pb-1 mb-4">সাধারণ তথ্য:</h2>
                </div>
                <InputField label="বাংলাদেশ ফরম নং" name="formNo" value={formData.formNo} onChange={handleInputChange} isDarkMode={isDarkMode} />
                <InputField label="পরিশিষ্ট" name="porishishto" value={formData.porishishto} onChange={handleInputChange} isDarkMode={isDarkMode} />
                <InputField label="ক্রমিক নং" name="slNo" value={formData.slNo} onChange={handleInputChange} isDarkMode={isDarkMode} />
                <InputField label="অনুচ্ছেদ" name="onuchhed" value={formData.onuchhed} onChange={handleInputChange} isDarkMode={isDarkMode} />
                <InputField label="ভূমি অফিসের নাম" name="officeName" value={formData.officeName} onChange={handleInputChange} isDarkMode={isDarkMode} />
                <div className="grid grid-cols-2 gap-2">
                  <InputField label="মৌজা" name="mouza" value={formData.mouza} onChange={handleInputChange} isDarkMode={isDarkMode} />
                  <InputField label="উপজেলা" name="upazila" value={formData.upazila} onChange={handleInputChange} isDarkMode={isDarkMode} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <InputField label="জেলা" name="district" value={formData.district} onChange={handleInputChange} isDarkMode={isDarkMode} />
                  <InputField label="হোল্ডিং নং" name="holding" value={formData.holding} onChange={handleInputChange} isDarkMode={isDarkMode} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <InputField label="খতিয়ান নং" name="khatian" value={formData.khatian} onChange={handleInputChange} isDarkMode={isDarkMode} />
                  <InputField label="মোট জমি (শতক)" name="totalLand" value={formData.totalLand} onChange={handleInputChange} isDarkMode={isDarkMode} />
                </div>
              </div>

              {/* Payment Details */}
              <div className="space-y-3">
                <h2 className="font-bold  pb-1 mb-4">আদায়ের বিবরণ:</h2>
                <div className="grid grid-cols-2 gap-2">
                  <InputField label="৩ বছরের ঊর্ধ্বে বকেয়া" name="arrear3Plus" value={formData.arrear3Plus} onChange={handleInputChange} isDarkMode={isDarkMode} />
                  <InputField label="গত ৩ বছরের বকেয়া" name="arrearLast3" value={formData.arrearLast3} onChange={handleInputChange} isDarkMode={isDarkMode} />
                </div>
                <InputField label="বকেয়ার সুদ/ক্ষতিপূরণ" name="interest" value={formData.interest} onChange={handleInputChange} isDarkMode={isDarkMode} />
                <div className="grid grid-cols-2 gap-2">
                  <InputField label="হাল দাবি" name="currentDemand" value={formData.currentDemand} onChange={handleInputChange} isDarkMode={isDarkMode} />
                  <InputField label="মোট দাবি" name="totalDemand" value={formData.totalDemand} onChange={handleInputChange} isDarkMode={isDarkMode} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <InputField label="মোট আদায়" name="totalCollect" value={formData.totalCollect} onChange={handleInputChange} isDarkMode={isDarkMode} />
                  <InputField label="মোট বকেয়া" name="totalArrear" value={formData.totalArrear} onChange={handleInputChange} isDarkMode={isDarkMode} />
                </div>
                <InputField label="চালান নং" name="chalanNo" value={formData.chalanNo} onChange={handleInputChange} isDarkMode={isDarkMode} />
                <InputField label="সর্বমোট (কথায়)" name="inWords" value={formData.inWords} onChange={handleInputChange} isDarkMode={isDarkMode} />
                <InputField label="নোট (অর্থবছর)" name="note" value={formData.note} onChange={handleInputChange} isDarkMode={isDarkMode} />
                <div className="grid grid-cols-2 gap-2">
                  <InputField label="তারিখ (বাংলা)" name="dateBn" value={formData.dateBn} onChange={handleInputChange} isDarkMode={isDarkMode} />
                  <InputField label="তারিখ (ইংরেজি)" name="dateEn" value={formData.dateEn} onChange={handleInputChange} isDarkMode={isDarkMode} />
                </div>
              </div>
            </div>

            {/* Owners Section */}
            <div className="mt-10">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-center font-bold text-lg">মালিকের নাম ও জমির অংশ </h2>
                <span className="text-sm text-gray-500">{owners.length} জন মালিক</span>
              </div>
              {owners.map((owner, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end mb-4">
                  <InputField 
                    label={`মালিকের নাম ${index + 1}`} 
                    value={owner.name} 
                    onChange={(e) => handleOwnerChange(index, 'name', e.target.value)} 
                    isDarkMode={isDarkMode} 
                  />
                  <div className="flex gap-2 items-end">
                    <InputField 
                      label="অংশ" 
                      value={owner.portion} 
                      onChange={(e) => handleOwnerChange(index, 'portion', e.target.value)} 
                      isDarkMode={isDarkMode} 
                    />
                    {owners.length > 1 && (
                      <button 
                        onClick={() => removeOwner(index)} 
                        className="p-2 text-red-500 hover:text-red-700 mb-1"
                        title="মালিক অপসারণ"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <button 
                onClick={addOwner} 
                className="bg-theme_color cursor-pointer text-white px-4 py-2 rounded text-sm flex items-center gap-1"
              >
                + আরও মালিক যোগ করুন
              </button>
            </div>

            {/* Lands Section */}
            <div className="mt-10">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-center font-bold text-lg">জমি সংক্রান্ত তথ্য</h2>
                <span className="text-sm text-gray-500">{lands.length} টি জমি</span>
              </div>
              {lands.map((land, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-4">
                  <InputField 
                    label={`দাগ নং ${index + 1}`} 
                    value={land.dagNo} 
                    onChange={(e) => handleLandChange(index, 'dagNo', e.target.value)} 
                    isDarkMode={isDarkMode} 
                  />
                  <InputField 
                    label="শ্রেণি" 
                    value={land.class} 
                    onChange={(e) => handleLandChange(index, 'class', e.target.value)} 
                    isDarkMode={isDarkMode} 
                  />
                  <div className="flex gap-2 items-end">
                    <InputField 
                      label="পরিমাণ (শতক)" 
                      value={land.amount} 
                      onChange={(e) => handleLandChange(index, 'amount', e.target.value)} 
                      isDarkMode={isDarkMode} 
                    />
                    {lands.length > 1 && (
                      <button 
                        onClick={() => removeLand(index)} 
                        className="p-2 text-red-500 hover:text-red-700 mb-1"
                        title="জমি অপসারণ"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <button 
                onClick={addLand} 
                className="bg-theme_color cursor-pointer text-white px-4 py-2 rounded text-sm flex items-center gap-1"
              >
                + আরও জমি যোগ করুন
              </button>
            </div>

            {/* Payment Notification Section */}
            <div className={`mt-6 mb-4 p-3 text-base border rounded-md flex justify-start items-center gap-2 transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-blue-900/20 border-blue-800/50' 
                : 'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className={isDarkMode ? 'text-blue-300' : 'text-blue-700'}>
                এই সেবার জন্য আপনার অ্যাকাউন্ট থেকে <span className="font-bold">{servicePrice} টাকা</span> কাটা হবে। 
              </p>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
              <button 
                onClick={saveReceipt}
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
                    <Save size={20} /> ডাউনলোড করুন ({servicePrice} টাকা)
                  </>
                )}
              </button>
            </div>
            
            {/* Previous Receipts Table */}
            <div className="mt-12">
              <div className="flex justify-between items-center mb-6">
                <h2 className={`text-lg md:text-xl font-bold ${isDarkMode ? 'text-green-400' : 'text-[#1abc9c]'}`}>
                  পূর্ববর্তী রসিদ তালিকা
                </h2>
                
                {/* Search Bar */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="রসিদ খুঁজুন..."
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
                          অফিসের নাম
                        </th>
                        <th className={`p-3 text-sm font-semibold border-r transition-colors duration-300 ${
                          isDarkMode
                            ? 'text-gray-300 border-gray-700'
                            : 'text-gray-600 border-gray-200'
                        }`}>
                          মৌজা
                        </th>
                        <th className={`p-3 text-sm font-semibold border-r transition-colors duration-300 ${
                          isDarkMode
                            ? 'text-gray-300 border-gray-700'
                            : 'text-gray-600 border-gray-200'
                        }`}>
                          খতিয়ান নং
                        </th>
                        <th className={`p-3 text-sm font-semibold border-r transition-colors duration-300 ${
                          isDarkMode
                            ? 'text-gray-300 border-gray-700'
                            : 'text-gray-600 border-gray-200'
                        }`}>
                          মোট আদায়
                        </th>
                        <th className={`p-3 text-sm font-semibold border-r transition-colors duration-300 ${
                          isDarkMode
                            ? 'text-gray-300 border-gray-700'
                            : 'text-gray-600 border-gray-200'
                        }`}>
                          তারিখ
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
                                কোন রসিদ পাওয়া যায়নি
                              </p>
                              <p className={`text-sm max-w-md transition-colors duration-300 ${
                                isDarkMode ? 'text-gray-500' : 'text-gray-500'
                              }`}>
                                {searchTerm ? 'আপনার সার্চের সাথে মিলছে এমন কোনো রসিদ নেই' : 'আপনার প্রথম রসিদটি এখনই তৈরি করুন!'}
                              </p>
                              {searchTerm && (
                                <button
                                  onClick={() => setSearchTerm('')}
                                  className="mt-4 text-sm bg-[#00a65a] text-white px-4 py-2 rounded-sm cursor-pointer"
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
                              {receipt.officeName || 'N/A'}
                            </td>
                            <td className={`p-3 text-sm border-r transition-colors duration-300 ${
                              isDarkMode
                                ? 'text-gray-200 border-gray-700'
                                : 'text-gray-800 border-gray-200'
                            }`}>
                              {receipt.mouza || 'N/A'}
                            </td>
                            <td className={`p-3 text-sm font-bold border-r transition-colors duration-300 ${
                              isDarkMode
                                ? 'text-gray-200 border-gray-700'
                                : 'text-gray-800 border-gray-200'
                            }`}>
                              {receipt.khatian || 'N/A'}
                            </td>
                            <td className={`p-3 text-sm font-bold border-r transition-colors duration-300 ${
                              isDarkMode
                                ? 'text-gray-200 border-gray-700'
                                : 'text-gray-800 border-gray-200'
                            }`}>
                              {formatCurrency(receipt.totalCollect)}
                            </td>
                            <td className={`p-3 text-sm text-nowrap border-r transition-colors duration-300 ${
                              isDarkMode
                                ? 'text-gray-400 border-gray-700'
                                : 'text-gray-600 border-gray-200'
                            }`}>
                              <div className="flex items-center justify-center gap-1">
                                <Calendar size={12} />
                                {formatDate(receipt.createdAt)}
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
                আপনার ভূমি উন্নয়ন কর রসিদ অর্ডারটি সফলভাবে প্লেস করা হয়েছে।
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
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={closeSuccessPopup}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-xl transition duration-200 text-sm md:text-base cursor-pointer"
                >
                  ঠিক আছে
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Popup */}
 {showDeletePopup && receiptToDelete && (
  <div className="fixed inset-0 bg-[rgba(0,0,0,0.7)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
    <div className={`rounded-2xl p-5 md:p-7 max-w-md w-full shadow-xl transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-800' : 'bg-white'
    }`}>
      <div className="text-center">
        <div className={`mx-auto flex items-center justify-center h-14 w-14 md:h-16 md:w-16 rounded-full mb-3 md:mb-5 ${
          isDarkMode ? 'bg-red-900/40' : 'bg-red-100'
        }`}>
          <svg className="h-8 w-8 md:h-10 md:w-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        
        <h3 className={`text-lg md:text-xl font-bold mb-2 transition-colors duration-300 ${
          isDarkMode ? 'text-gray-100' : 'text-gray-900'
        }`}>
          রসিদ ডিলিট করুন
        </h3>
        
        <p className={`text-xs md:text-sm mb-3 md:mb-5 transition-colors duration-300 ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          আপনি কি নিশ্চিত যে আপনি এই রসিদটি ডিলিট করতে চান?
        </p>
        
        <div className={`rounded-lg p-3 md:p-4 mb-4 md:mb-5 border transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-gray-700/50 border-gray-600' 
            : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="grid grid-cols-2 gap-2 md:gap-3">
            <div className="text-left">
              <p className={`text-xs transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                রসিদ আইডি
              </p>
              <p className={`font-semibold text-sm truncate transition-colors duration-300 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>
                {receiptToDelete.receiptId}
              </p>
            </div>
            <div className="text-left">
              <p className={`text-xs transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                অফিসের নাম
              </p>
              <p className={`font-semibold text-sm truncate transition-colors duration-300 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>
                {receiptToDelete.officeName}
              </p>
            </div>
            <div className="text-left">
              <p className={`text-xs transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                মোট আদায়
              </p>
              <p className="font-semibold text-sm text-green-600">
                {receiptToDelete.totalCollect} টাকা
              </p>
            </div>
            <div className="text-left">
              <p className={`text-xs transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                তারিখ
              </p>
              <p className={`font-semibold text-sm transition-colors duration-300 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>
                {formatDate(receiptToDelete.createdAt)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 md:gap-3">
          <button
            onClick={cancelDelete}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2.5 md:py-3 px-3 md:px-4 rounded-lg transition duration-200 text-xs md:text-sm cursor-pointer"
          >
            বাতিল করুন
          </button>
          <button
            onClick={deleteReceipt}
            disabled={deletingId === receiptToDelete._id}
            className={`flex-1 font-semibold py-2.5 md:py-3 px-3 md:px-4 rounded-lg transition duration-200 text-xs md:text-sm cursor-pointer ${
              deletingId === receiptToDelete._id
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {deletingId === receiptToDelete._id ? (
              <span className="flex items-center justify-center gap-1.5">
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                ডিলিট হচ্ছে...
              </span>
            ) : (
              'ডিলিট করুন'
            )}
          </button>
        </div>
        
        <p className={`text-xs text-center mt-3 md:mt-4 transition-colors duration-300 ${
          isDarkMode ? 'text-gray-500' : 'text-gray-500'
        }`}>
          নোট: একবার ডিলিট করলে এই রসিদটি পুনরুদ্ধার করা যাবে না।
        </p>
      </div>
    </div>
  </div>
)}
    </>
  );
}

// --- Helper Components ---

function InputField({ label, name, value, onChange, placeholder, isDarkMode, type = "text" }) {
  return (
    <div className="flex flex-col flex-1">
      <label className={`text-[15px] font-semibold mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        {label}
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
        placeholder={label}
      />
    </div>
  );
}
export default Vomionnoyon;