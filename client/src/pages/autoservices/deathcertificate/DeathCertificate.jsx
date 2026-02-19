import React, { useState, useRef, useEffect } from 'react';
import Header from '../../../components/header/Header';
import Sidebar from '../../../components/sidebar/Sidebar';
import { Trash2, Printer, ArrowLeft, Save, Eye, Download, FileText, History, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Calendar, Info, RefreshCw, Globe } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ApertureLoader from '../../../components/loader/ApertureLoader';
import toast, { Toaster } from 'react-hot-toast';

function DeathCertificate() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [servicePrice, setServicePrice] = useState(0);
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

  // Delete confirmation popup state
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [receiptToDelete, setReceiptToDelete] = useState(null);

  // State for Death Certificate Form Data with Bangla/English
  const [formData, setFormData] = useState({
    // Header Information
    governmentHeader: {
      english: "Government of the People's Republic of Bangladesh",
      bangla: "গণপ্রজাতন্ত্রী বাংলাদেশ সরকার"
    },
    officeOfRegistrar: {
      english: "Office of the Registrar, Birth and Death Registration",
      bangla: "জন্ম ও মৃত্যু নিবন্ধন অফিস"
    },
    unionParishad: {
      english: "",
      bangla: "ওরাকান্দি ইউনিয়ন পরিষদ"
    },
    upazila: {
      english: "",
      bangla: ""
    },
    district: {
      english: "",
      bangla: ""
    },
    rule: {
      english: "Rule 9, 10",
      bangla: "নিয়ম ৯, ১০"
    },
    
    // Certificate Title
    certificateTitle: {
      english: "Death Registration Certificate",
      bangla: "মৃত্যু নিবন্ধন সনদ"
    },
    
    // Registration Details
    dateOfRegistration: '',
    deathRegistrationNumber: generateDeathRegistrationNumber(),
    dateOfIssuance: '',
    
    // Personal Information
    name: {
      english: '',
      bangla: ''
    },
    motherName: {
      english: '',
      bangla: ''
    },
    personNationality: {
      english: "Bangladeshi",
      bangla: "বাংলাদেশি"
    },
    fatherName: {
      english: '',
      bangla: ''
    },
    fatherNationality: {
      english: "Bangladeshi",
      bangla: "বাংলাদেশি"
    },
    placeOfDeath: {
      english: "",
      bangla: ""
    },
    
    // Additional Information
    dateOfBirth: '',
    sex: {
      english: "Female",
      bangla: "মহিলা"
    },
    dateOfDeath: '',
    dateOfDeathInWords: {
      english: '',
      bangla: ''
    },
    causeOfDeath: {
      english: "Natural Death",
      bangla: "প্রাকৃতিক মৃত্যু"
    },
    
    // Signature Section
    sealSignature: {
      english: "Seal & Signature",
      bangla: "সিল ও স্বাক্ষর"
    },
    assistantRegistrar: {
      english: "Assistant to Registrar",
      bangla: "নিবন্ধকের সহকারী"
    },
    preparationVerification: {
      english: "(Preparation, Verification)",
      bangla: "(প্রস্তুতি, যাচাই)"
    },
    registrar: {
      english: "Registrar",
      bangla: "নিবন্ধক"
    },
    
    // Footer Information
    generatedFrom: {
      english: "bdris.gov.bd",
      bangla: "bdris.gov.bd"
    },
    verificationNote: {
      english: "This certificate is generated from bdris.gov.bd, and to verify this certificate, please scan the above QR Code & Bar Code.",
      bangla: "এই সনদটি bdris.gov.bd থেকে তৈরি করা হয়েছে, এবং এই সনদটি যাচাই করতে উপরের কিউআর কোড ও বার কোড স্ক্যান করুন।"
    }
  });

  // Function to generate death registration number (17 digits)
  function generateDeathRegistrationNumber() {
    const year = new Date().getFullYear().toString().slice(-2);
    const randomDigits = Math.floor(Math.random() * 1000000000000000).toString().padStart(15, '0');
    return `${year}${randomDigits}`.slice(0, 17);
  }

  // Function to convert date to English words
  function dateToEnglishWords(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const day = date.getDate();
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    
    const dayNames = [
      "First", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh", "Eighth", "Ninth", "Tenth",
      "Eleventh", "Twelfth", "Thirteenth", "Fourteenth", "Fifteenth", "Sixteenth", "Seventeenth",
      "Eighteenth", "Nineteenth", "Twentieth", "Twenty First", "Twenty Second", "Twenty Third",
      "Twenty Fourth", "Twenty Fifth", "Twenty Sixth", "Twenty Seventh", "Twenty Eighth",
      "Twenty Ninth", "Thirtieth", "Thirty First"
    ];
    
    const dayInWords = dayNames[day - 1];
    const yearInWords = numberToEnglishWords(year);
    
    return `${dayInWords} of ${month} ${yearInWords}`;
  }

  // Function to convert date to Bangla words
  function dateToBanglaWords(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const day = date.getDate();
    const monthNames = [
      "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
      "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
    ];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    
    const dayNames = [
      "প্রথম", "দ্বিতীয়", "তৃতীয়", "চতুর্থ", "পঞ্চম", "ষষ্ঠ", "সপ্তম", "অষ্টম", "নবম", "দশম",
      "একাদশ", "দ্বাদশ", "ত্রয়োদশ", "চতুর্দশ", "পঞ্চদশ", "ষোড়শ", "সপ্তদশ",
      "অষ্টাদশ", "ঊনবিংশ", "বিংশ", "একবিংশ", "বাইশ", "তেইশ",
      "চব্বিশ", "পঁচিশ", "ছাব্বিশ", "সাতাশ", "আটাশ",
      "ঊনত্রিশ", "ত্রিশ", "একত্রিশ"
    ];
    
    const dayInWords = dayNames[day - 1];
    const yearInWords = numberToBanglaWords(year);
    
    return `${dayInWords} ${month} ${yearInWords}`;
  }

  // Helper function to convert number to English words
  function numberToEnglishWords(num) {
    const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    if (num === 0) return 'Zero';
    if (num < 10) return units[num];
    if (num < 20) return teens[num - 10];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + units[num % 10] : '');
    
    // For years (like 2025)
    if (num < 10000) {
      const thousands = Math.floor(num / 1000);
      const remainder = num % 1000;
      let words = units[thousands] + ' Thousand';
      if (remainder > 0) words += ' ' + numberToEnglishWords(remainder);
      return words;
    }
    
    return num.toString();
  }

  // Helper function to convert number to Bangla words
  function numberToBanglaWords(num) {
    const units = ['', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়'];
    const teens = ['দশ', 'এগারো', 'বারো', 'তেরো', 'চৌদ্দ', 'পনেরো', 'ষোল', 'সতেরো', 'আঠারো', 'উনিশ'];
    const tens = ['', '', 'বিশ', 'ত্রিশ', 'চল্লিশ', 'পঞ্চাশ', 'ষাট', 'সত্তর', 'আশি', 'নব্বই'];
    const hundreds = ['', 'একশ', 'দুইশ', 'তিনশ', 'চারশ', 'পাঁচশ', 'ছয়শ', 'সাতশ', 'আটশ', 'নয়শ'];
    
    if (num === 0) return 'শূন্য';
    if (num < 10) return units[num];
    if (num < 20) return teens[num - 10];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + numberToBanglaWords(num % 10) : '');
    if (num < 1000) return hundreds[Math.floor(num / 100)] + (num % 100 !== 0 ? ' ' + numberToBanglaWords(num % 100) : '');
    
    // For years (like ২০২৫)
    if (num < 10000) {
      const thousands = Math.floor(num / 1000);
      const remainder = num % 1000;
      let words = units[thousands] + ' হাজার';
      if (remainder > 0) words += ' ' + numberToBanglaWords(remainder);
      return words;
    }
    
    return num.toString();
  }

  // Function to regenerate registration number
  const regenerateRegistrationNumber = () => {
    setFormData(prev => ({
      ...prev,
      deathRegistrationNumber: generateDeathRegistrationNumber()
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

  // Handle input changes for regular fields
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'dateOfDeath' && value) {
      // Update both English and Bangla date words
      const englishWords = dateToEnglishWords(value);
      const banglaWords = dateToBanglaWords(value);
      
      setFormData(prev => ({
        ...prev,
        [name]: value,
        dateOfDeathInWords: {
          english: englishWords,
          bangla: banglaWords
        }
      }));
    } else if (name.includes('.')) {
      // Handle nested object fields (e.g., name.english, name.bangla)
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle sex selection
  const handleSexChange = (e) => {
    const englishValue = e.target.value;
    let banglaValue = "মহিলা";
    
    if (englishValue === "Male") banglaValue = "পুরুষ";
    else if (englishValue === "Other") banglaValue = "অন্যান্য";
    
    setFormData(prev => ({
      ...prev,
      sex: {
        english: englishValue,
        bangla: banglaValue
      }
    }));
  };

  // Toggle sidebar
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  // Fetch service price
  useEffect(() => {
    const fetchServicePrice = async () => {
      try {
        const response = await axios.get(`${base_url}/api/user/service/price/death-certificate`);
        if (response.data && response.data.price) {
          setServicePrice(response.data.price);
        } else {
          setServicePrice(200); // Default fallback price
        }
      } catch (error) {
        console.error('Error fetching service price:', error);
        setServicePrice(200); // Default fallback price
      }
    };

    fetchServicePrice();
  }, [base_url]);

  // Fetch receipts list
  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/user/death-certificate/all');
      if (response.data.success) {
        setReceipts(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching receipts:', error);
      toast.error('মৃত্যু নিবন্ধন সনদ তালিকা লোড করতে সমস্যা হয়েছে');
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
      (receipt.deathRegistrationNumber && receipt.deathRegistrationNumber.toLowerCase().includes(term)) ||
      (receipt.name?.english && receipt.name.english.toLowerCase().includes(term)) ||
      (receipt.name?.bangla && receipt.name.bangla.toLowerCase().includes(term)) ||
      (receipt.fatherName?.english && receipt.fatherName.english.toLowerCase().includes(term)) ||
      (receipt.fatherName?.bangla && receipt.fatherName.bangla.toLowerCase().includes(term))
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
      const response = await api.delete(`/api/user/death-certificate/${receiptToDelete._id}`);
      
      if (response.data.success) {
        toast.success('মৃত্যু নিবন্ধন সনদ সফলভাবে ডিলিট করা হয়েছে');
        fetchReceipts();
      } else {
        toast.error(response.data.message || 'মৃত্যু নিবন্ধন সনদ ডিলিট করতে সমস্যা হয়েছে');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.message || 'মৃত্যু নিবন্ধন সনদ ডিলিট করতে সমস্যা হয়েছে');
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
        amount: servicePrice,
        service: 'মৃত্যু নিবন্ধন সনদ',
        reference: `DTH_${Date.now()}`,
        description: `মৃত্যু নিবন্ধন সনদ তৈরি - নিবন্ধন নং: ${formData.deathRegistrationNumber}`
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

  // Save Death Certificate Function
  const saveDeathCertificate = async () => {
    try {
      setIsSaving(true);

      // Validate required fields
      const requiredFields = [
        'name', 'fatherName', 'motherName', 'dateOfBirth',
        'dateOfDeath', 'placeOfDeath', 'unionParishad', 
        'upazila', 'district', 'dateOfRegistration', 'dateOfIssuance',
        'causeOfDeath'
      ];

      // Check each required field
      for (const field of requiredFields) {
        if (field === 'name' || field === 'fatherName' || field === 'motherName' || 
            field === 'placeOfDeath' || field === 'unionParishad' || field === 'upazila' || 
            field === 'district' || field === 'causeOfDeath') {
          
          const fieldData = formData[field];
          if (!fieldData?.english || fieldData.english.trim() === ''){
            toast.error(`${field} ফিল্ডটি ইংরেজি এবং বাংলা উভয় ভাষায় পূরণ করুন`);
            setIsSaving(false);
            return;
          }
        } else if (!formData[field] || formData[field].toString().trim() === '') {
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

      // Prepare payload
      const payload = {
        ...formData,
        transactionId: deductionResult.data?.transactionId || null
      };

      const response = await api.post(`${base_url}/api/user/death-certificate/save`, payload);
      
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
        toast.success("মৃত্যু নিবন্ধন সনদ অর্ডার সফল হয়েছে!");
        
        setTimeout(() => {
          navigate(`/auto-services/death-certificate-download/${savedReceiptId}`);
        }, 1000);
      } else {
        toast.error(response.data.message || 'মৃত্যু নিবন্ধন সনদ সংরক্ষণ ব্যর্থ হয়েছে');
      }
    } catch (error) {
      console.error('Save error:', error);
      if (error.response) {
        toast.error(error.response.data.message || 'মৃত্যু নিবন্ধন সনদ সংরক্ষণ করতে সমস্যা হয়েছে');
      } else {
        toast.error('নেটওয়ার্ক সমস্যা! আবার চেষ্টা করুন');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Action Buttons component for table
  const ActionButtons = ({ receipt }) => (
    <div className="flex justify-center gap-2">
      <button
        onClick={() => navigate(`/auto-services/death-certificate-download/${receipt.receiptId}`)}
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
      const response = await axios.get(`${base_url}/api/user/service/notice/death-certificate`);
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
              মৃত্যু নিবন্ধন সনদ 
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
            
            {/* Death Registration Number */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-1">
                <label className={`text-[15px] font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Death Registration Number / মৃত্যু নিবন্ধন নম্বর
                </label>
                <button
                  type="button"
                  onClick={regenerateRegistrationNumber}
                  className={`flex items-center gap-1 border  text-sm md:text-[15px] px-4 py-2 cursor-pointer border-gray-200  rounded transition-colors duration-200 ${
                    isDarkMode 
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                  title="Generate New Registration Number"
                >
                  <RefreshCw size={10} />
                  Generate
                </button>
              </div>
              <input 
                type="text"
                name="deathRegistrationNumber"
                value={formData.deathRegistrationNumber}
                onChange={handleInputChange}
                className={`border rounded-md text-sm md:text-[15px] px-4 py-2.5 focus:outline-none focus:ring-2 w-full ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white focus:ring-green-500 focus:ring-offset-gray-800' 
                    : 'bg-white border-gray-300 focus:ring-green-500 focus:ring-offset-white'
                }`}
                placeholder="Death Registration Number"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-4">
                <div className="space-y-3">
                  <h3 className={`font-bold pb-1 mb-1 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    ব্যক্তিগত তথ্য / Personal Information
                  </h3>
                  
                  {/* Name - English and Bangla side by side */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className={`text-[14px] font-semibold mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Name (English) *
                      </label>
                      <input 
                        type="text"
                        name="name.english"
                        value={formData.name.english}
                        onChange={handleInputChange}
                        className={`border rounded-md text-sm w-full px-3 py-2.5 focus:outline-none focus:ring-2 ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white focus:ring-green-500' 
                            : 'bg-white border-gray-300 focus:ring-green-500'
                        }`}
                        placeholder="Enter name in English"
                        required
                      />
                    </div>
                    <div>
                      <label className={`text-[14px] font-semibold mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        নাম (বাংলা) *
                      </label>
                      <input 
                        type="text"
                        name="name.bangla"
                        value={formData.name.bangla}
                        onChange={handleInputChange}
                        className={`border rounded-md text-sm w-full px-3 py-2.5 focus:outline-none focus:ring-2 ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white focus:ring-green-500' 
                            : 'bg-white border-gray-300 focus:ring-green-500'
                        }`}
                        placeholder="বাংলায় নাম লিখুন"
                        required
                      />
                    </div>
                  </div>
                  
                  {/* Father Name - English and Bangla side by side */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className={`text-[14px] font-semibold mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Father Name (English) *
                      </label>
                      <input 
                        type="text"
                        name="fatherName.english"
                        value={formData.fatherName.english}
                        onChange={handleInputChange}
                        className={`border rounded-md text-sm w-full px-3 py-2.5 focus:outline-none focus:ring-2 ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white focus:ring-green-500' 
                            : 'bg-white border-gray-300 focus:ring-green-500'
                        }`}
                        placeholder="Enter father's name in English"
                        required
                      />
                    </div>
                    <div>
                      <label className={`text-[14px] font-semibold mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        পিতার নাম (বাংলা) *
                      </label>
                      <input 
                        type="text"
                        name="fatherName.bangla"
                        value={formData.fatherName.bangla}
                        onChange={handleInputChange}
                        className={`border rounded-md text-sm w-full px-3 py-2.5 focus:outline-none focus:ring-2 ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white focus:ring-green-500' 
                            : 'bg-white border-gray-300 focus:ring-green-500'
                        }`}
                        placeholder="বাংলায় পিতার নাম লিখুন"
                        required
                      />
                    </div>
                  </div>
                  
                  {/* Mother Name - English and Bangla side by side */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className={`text-[14px] font-semibold mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Mother Name (English) *
                      </label>
                      <input 
                        type="text"
                        name="motherName.english"
                        value={formData.motherName.english}
                        onChange={handleInputChange}
                        className={`border rounded-md text-sm w-full px-3 py-2.5 focus:outline-none focus:ring-2 ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white focus:ring-green-500' 
                            : 'bg-white border-gray-300 focus:ring-green-500'
                        }`}
                        placeholder="Enter mother's name in English"
                        required
                      />
                    </div>
                    <div>
                      <label className={`text-[14px] font-semibold mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        মাতার নাম (বাংলা) *
                      </label>
                      <input 
                        type="text"
                        name="motherName.bangla"
                        value={formData.motherName.bangla}
                        onChange={handleInputChange}
                        className={`border rounded-md text-sm w-full px-3 py-2.5 focus:outline-none focus:ring-2 ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white focus:ring-green-500' 
                            : 'bg-white border-gray-300 focus:ring-green-500'
                        }`}
                        placeholder="বাংলায় মাতার নাম লিখুন"
                        required
                      />
                    </div>
                  </div>
                  
                  <InputField 
                    label="Date of Birth / জন্ম তারিখ *"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    isDarkMode={isDarkMode}
                    type="text"
                    placeholder="DD-MM-YYYY"
                    required
                  />
                  
              
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div className="space-y-3">
                  <h3 className={`font-bold pb-1 mb-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    মৃত্যু সংক্রান্ত তথ্য / Death Information
                  </h3>
                  
                  <InputField 
                    label="Date of Death / মৃত্যুর তারিখ *"
                    name="dateOfDeath"
                    value={formData.dateOfDeath}
                    onChange={handleInputChange}
                    isDarkMode={isDarkMode}
                    type="text"
                    placeholder="DD-MM-YYYY"
                    required
                  />
                  
                  
                  {/* Place of Death - English and Bangla side by side */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className={`text-[14px] font-semibold mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Place of Death (English) *
                      </label>
                      <input 
                        type="text"
                        name="placeOfDeath.english"
                        value={formData.placeOfDeath.english}
                        onChange={handleInputChange}
                        className={`border rounded-md text-sm w-full px-3 py-2.5 focus:outline-none focus:ring-2 ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white focus:ring-green-500' 
                            : 'bg-white border-gray-300 focus:ring-green-500'
                        }`}
                        placeholder="Dhaka, Bangladesh"
                        required
                      />
                    </div>
                    <div>
                      <label className={`text-[14px] font-semibold mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        মৃত্যুর স্থান (বাংলা) *
                      </label>
                      <input 
                        type="text"
                        name="placeOfDeath.bangla"
                        value={formData.placeOfDeath.bangla}
                        onChange={handleInputChange}
                        className={`border rounded-md text-sm w-full px-3 py-2.5 focus:outline-none focus:ring-2 ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white focus:ring-green-500' 
                            : 'bg-white border-gray-300 focus:ring-green-500'
                        }`}
                        placeholder="যেমনঃ ঢাকা, বাংলাদেশ"
                        required
                      />
                    </div>
                  </div>
                      <div className="flex flex-col flex-1">
                    <label className={`text-[15px] font-semibold mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Sex / লিঙ্গ *
                    </label>
                    <select 
                      name="sex"
                      value={formData.sex.english}
                      onChange={handleSexChange}
                      className={`border rounded-md text-sm md:text-[15px] px-4 py-2.5 focus:outline-none focus:ring-2 ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white focus:ring-green-500 focus:ring-offset-gray-800' 
                          : 'bg-white border-gray-300 focus:ring-green-500 focus:ring-offset-white'
                      }`}
                      required
                    >
                      <option value="Female">Female / মহিলা</option>
                      <option value="Male">Male / পুরুষ</option>
                      <option value="Other">Other / অন্যান্য</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Location Information - English and Bangla side by side */}
            <div className="mt-6">
              <h3 className={`font-bold pb-1 mb-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                অবস্থান তথ্য / Location Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Union Parishad */}
                <div className="space-y-2">
                  <label className={`text-[14px] font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Union Parishad (English) *
                  </label>
                  <input 
                    type="text"
                    name="unionParishad.english"
                    value={formData.unionParishad.english}
                    onChange={handleInputChange}
                    className={`border rounded-md text-sm w-full px-3 py-2.5 focus:outline-none focus:ring-2 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white focus:ring-green-500' 
                        : 'bg-white border-gray-300 focus:ring-green-500'
                    }`}
                    placeholder="Orakandi Union Parishad"
                    required
                  />
                </div>
                
                {/* Upazila */}
                <div className="space-y-2">
                  <label className={`text-[14px] font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Upazila (English) *
                  </label>
                  <input 
                    type="text"
                    name="upazila.english"
                    value={formData.upazila.english}
                    onChange={handleInputChange}
                    className={`border rounded-md text-sm w-full px-3 py-2.5 focus:outline-none focus:ring-2 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white focus:ring-green-500' 
                        : 'bg-white border-gray-300 focus:ring-green-500'
                    }`}
                    placeholder="Kashiani"
                    required
                  />
                </div>
                
                {/* District */}
                <div className="space-y-2">
                  <label className={`text-[14px] font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    District (English) *
                  </label>
                  <input 
                    type="text"
                    name="district.english"
                    value={formData.district.english}
                    onChange={handleInputChange}
                    className={`border rounded-md text-sm w-full px-3 py-2.5 focus:outline-none focus:ring-2 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white focus:ring-green-500' 
                        : 'bg-white border-gray-300 focus:ring-green-500'
                    }`}
                    placeholder="Gopalganj"
                    required
                  />
                
                </div>
              </div>
            </div>

            {/* Registration Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <InputField 
                label="Date of Registration / নিবন্ধনের তারিখ"
                name="dateOfRegistration"
                value={formData.dateOfRegistration}
                onChange={handleInputChange}
                isDarkMode={isDarkMode}
                type="text"
                placeholder="DD-MM-YYYY"
                required
              />
              
              <InputField 
                label="Date of Issuance / ইস্যুর তারিখ"
                name="dateOfIssuance"
                value={formData.dateOfIssuance}
                onChange={handleInputChange}
                isDarkMode={isDarkMode}
                type="text"
                placeholder="DD-MM-YYYY"
                required
              />
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
                  এই সেবার জন্য আপনার অ্যাকাউন্ট থেকে <span className="font-bold">{servicePrice} টাকা</span> কাটা হবে।</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
              <button 
                onClick={saveDeathCertificate}
                disabled={isSaving}
                className={`w-full hover:bg-theme_color text-white font-bold py-4 rounded shadow-sm flex items-center justify-center gap-2 transition-all text-sm md:text-base cursor-pointer ${
                  isSaving
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
            
            {/* Previous Death Certificates Table */}
            <div className="mt-12">
              <div className="flex justify-between items-center mb-6">
                <h2 className={`text-lg md:text-xl font-bold ${isDarkMode ? 'text-green-400' : 'text-[#1abc9c]'}`}>
                  পূর্ববর্তী মৃত্যু নিবন্ধন সনদ তালিকা
                </h2>
                
                {/* Search Bar */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="মৃত্যু নিবন্ধন সনদ খুঁজুন.."
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
                          নিবন্ধন নং
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
                          মৃত্যুর তারিখ
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
                          <td colSpan="7" className="p-8 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <FileText className={isDarkMode ? 'text-gray-600' : 'text-gray-400'} size={48} />
                              <p className={`font-medium mb-2 transition-colors duration-300 ${
                                isDarkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                কোন মৃত্যু নিবন্ধন সনদ পাওয়া যায়নি / No death certificates found
                              </p>
                              <p className={`text-sm max-w-md transition-colors duration-300 ${
                                isDarkMode ? 'text-gray-500' : 'text-gray-500'
                              }`}>
                                {searchTerm 
                                  ? ( 'আপনার সার্চের সাথে মিলছে এমন কোনো মৃত্যু নিবন্ধন সনদ নেই / No death certificates match your search')
                                  : ( 'আপনার প্রথম মৃত্যু নিবন্ধন সনদ এখনই তৈরি করুন! / Create your first death certificate now!')
                                }
                              </p>
                              {searchTerm && (
                                <button
                                  onClick={() => setSearchTerm('')}
                                  className="mt-4 text-sm bg-blue-600 text-white px-4 py-2 rounded-sm cursor-pointer"
                                >
                                  সার্চ ক্লিয়ার করুন / Clear Search
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
                            <td className={`p-3 text-sm border-r transition-colors duration-300 ${
                              isDarkMode
                                ? 'text-gray-200 border-gray-700'
                                : 'text-gray-800 border-gray-200'
                            }`}>
                              {receipt.deathRegistrationNumber || 'N/A'}
                            </td>
                            <td className={`p-3 text-sm border-r transition-colors duration-300 ${
                              isDarkMode
                                ? 'text-gray-200 border-gray-700'
                                : 'text-gray-800 border-gray-200'
                            }`}>
                              {receipt.name?.english || receipt.name?.bangla || 'N/A'}
                            </td>
                            <td className={`p-3 text-sm border-r transition-colors duration-300 ${
                              isDarkMode
                                ? 'text-gray-200 border-gray-700'
                                : 'text-gray-800 border-gray-200'
                            }`}>
                              {receipt.fatherName?.english || receipt.fatherName?.bangla || 'N/A'}
                            </td>
                            <td className={`p-3 text-sm text-nowrap border-r transition-colors duration-300 ${
                              isDarkMode
                                ? 'text-gray-400 border-gray-700'
                                : 'text-gray-600 border-gray-200'
                            }`}>
                              <div className="flex items-center justify-center gap-1">
                                <Calendar size={12} />
                                {formatDate(receipt.dateOfDeath)}
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
                    প্রদর্শন / Showing <span className={`font-bold transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {startIndex + 1}
                    </span> থেকে / to{' '}
                    <span className={`font-bold transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {Math.min(endIndex, filteredReceipts.length)}
                    </span> এর / of{' '}
                    <span className={`font-bold transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {filteredReceipts.length}
                    </span> টি এন্ট্রি / entries
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
    {showDeletePopup && receiptToDelete && (
  <div className="fixed inset-0 bg-[rgba(0,0,0,0.7)] bg-opacity-50 flex items-center justify-center z-[10000] p-3">
    <div className={`rounded-xl p-4 md:p-5 max-w-sm w-full shadow-xl transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-800' : 'bg-white'
    }`}>
      <div className="text-center">
        <div className={`mx-auto flex items-center justify-center h-12 w-12 md:h-14 md:w-14 rounded-full mb-3 ${
          isDarkMode ? 'bg-red-900/40' : 'bg-red-100'
        }`}>
          <svg className="h-6 w-6 md:h-7 md:w-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        
        <h3 className={`text-base md:text-lg font-bold mb-1.5 transition-colors duration-300 ${
          isDarkMode ? 'text-gray-100' : 'text-gray-900'
        }`}>
          মৃত্যু নিবন্ধন সনদ ডিলিট করুন
        </h3>
        
        <p className={`text-xs mb-3 transition-colors duration-300 ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          আপনি কি নিশ্চিত যে আপনি এই মৃত্যু নিবন্ধন সনদটি ডিলিট করতে চান?
        </p>
        
        <div className={`rounded-lg p-3 mb-3 border transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-gray-700/50 border-gray-600' 
            : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-left">
              <p className={`text-xs transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                রসিদ আইডি
              </p>
              <p className={`font-semibold text-xs truncate transition-colors duration-300 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>
                {receiptToDelete.receiptId}
              </p>
            </div>
            <div className="text-left">
              <p className={`text-xs transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                নিবন্ধন নং
              </p>
              <p className={`font-semibold text-xs truncate transition-colors duration-300 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>
                {receiptToDelete.deathRegistrationNumber}
              </p>
            </div>
            <div className="text-left">
              <p className={`text-xs transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                নাম 
              </p>
              <p className={`font-semibold text-xs truncate transition-colors duration-300 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>
                {receiptToDelete.name?.english || receiptToDelete.name?.bangla}
              </p>
            </div>
            <div className="text-left">
              <p className={`text-xs transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                পিতার নাম
              </p>
              <p className={`font-semibold text-xs truncate transition-colors duration-300 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>
                {receiptToDelete.fatherName?.english || receiptToDelete.fatherName?.bangla}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={cancelDelete}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-3 rounded-lg transition duration-200 text-xs cursor-pointer"
          >
            বাতিল করুন
          </button>
          <button
            onClick={deleteReceipt}
            disabled={deletingId === receiptToDelete._id}
            className={`flex-1 font-semibold py-2 px-3 rounded-lg transition duration-200 text-xs cursor-pointer ${
              deletingId === receiptToDelete._id
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {deletingId === receiptToDelete._id ? (
              <span className="flex items-center justify-center gap-1.5">
                ডিলিট হচ্ছে... / Deleting...
              </span>
            ) : (
              'ডিলিট করুন '
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

// --- Helper Components ---

function InputField({ label, name, value, onChange, placeholder, isDarkMode, type = "text", required = false }) {
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
        className={`border rounded-md text-sm md:text-[15px] px-4 py-2.5 focus:outline-none focus:ring-2  ${
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

export default DeathCertificate;