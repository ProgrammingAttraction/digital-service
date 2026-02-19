import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, 
  Upload, 
  X, 
  ImageIcon,
  CheckCircle2,
  Loader2,
  Download,
  AlertCircle,
  Calendar,
  Search,
  RefreshCw,
  CreditCard,
  Info,
  User,
  Camera,
  Save,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Trash2,
  Eye
} from 'lucide-react';
import axios from 'axios';
import Header from '../../../components/header/Header';
import Sidebar from '../../../components/sidebar/Sidebar';
import { useTheme } from '../../../context/ThemeContext';
import toast, { Toaster } from 'react-hot-toast';
import {NavLink, useNavigate} from "react-router-dom"
import ApertureLoader from '../../../components/loader/ApertureLoader';

function Signtoserver() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copyType, setCopyType] = useState('old');
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const navigate = useNavigate();
  
  // State for Previews and File Names
  const [fileData, setFileData] = useState({
    pdf: { preview: null, name: "No file chosen", file: null },
    nid: { preview: null, name: "No file chosen", file: null }
  });

  // Form State with ocupation field
  const [formData, setFormData] = useState({
    photo: '',
    nameBangla: '',
    nameEnglish: '',
    nationalId: '',
    pinNumber: '',
    formNumber: '',
    voterNumber: '',
    voterArea: '',
    mobileNumber: '',
    fatherName: '',
    motherName: '',
    spouseName: '',
    education: '',
    ocupation: '', // Added ocupation field
    birthPlace: '',
    birthDate: '',
    bloodGroup: '',
    gender: 'Gender',
    currentAddress: '',
    permanentAddress: '',
    UBRN: '',
    birthDateUBRN: ''
  });

  // API State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [extractedData, setExtractedData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [captchaData, setCaptchaData] = useState(null);
  const [captchaText, setCaptchaText] = useState('');
  const [isFetchingUBRN, setIsFetchingUBRN] = useState(false);
  const [isVerifyingCaptcha, setIsVerifyingCaptcha] = useState(false);
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'ubrn'
  const [servicePrice, setServicePrice] = useState(null);
  const [balance, setBalance] = useState(null);
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user?.id;
  
  // Table States
  const [serverCopies, setServerCopies] = useState([]);
  const [loadingCopies, setLoadingCopies] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [receiptToDelete, setReceiptToDelete] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  
  // Theme context
  const { isDarkMode } = useTheme();
  
  // Refs
  const pdfInputRef = useRef(null);
  const nidInputRef = useRef(null);

  // Fetch service price and user balance on component mount
  useEffect(() => {
    fetchServicePrice();
    fetchServerCopies();
  }, []);

  const fetchServicePrice = async () => {
    try {
      const response = await axios.get(`${base_url}/api/user/service/price/server-copy`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'userId': userId
        }
      });
      
      if (response.data.success) {
        setServicePrice(response.data.price);
      }
    } catch (err) {
      console.error('Failed to fetch service price:', err);
      setServicePrice(5); // Default price
    }
  };
  
  const fetchServerCopies = async () => {
    try {
      setLoadingCopies(true);
      const response = await axios.get(`${base_url}/api/user/server-copy/all`, {
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
      
      if (response.data.success) {
        setServerCopies(response.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch server copies:', err);
      toast.error('সার্ভার কপি তালিকা লোড করতে ব্যর্থ হয়েছে');
    } finally {
      setLoadingCopies(false);
    }
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFileData(prev => ({ 
          ...prev, 
          [type]: { 
            preview: reader.result, 
            name: file.name,
            file: file
          } 
        }));
      };
      reader.readAsDataURL(file);
      
      // Auto-extract data if PDF is uploaded
      if (type === 'pdf' && file.type === 'application/pdf') {
        analyzePDF(file);
      }
    }
  };

  // ==================== SERVER COPY PDF ANALYSIS ====================
  const analyzePDF = async (pdfFile) => {
    if (!pdfFile) return;
    
    setIsAnalyzing(true);
    setError('');
    setExtractedData(null);
    
    try {
      // Check balance before proceeding
      if (balance !== null && servicePrice !== null && balance < servicePrice) {
        const errorMsg = `অপর্যাপ্ত ব্যালেন্স। প্রয়োজন ${servicePrice}৳, আপনার ব্যালেন্স: ${balance}৳`;
        toast.error(errorMsg);
        setError(errorMsg);
        setIsAnalyzing(false);
        return;
      }
      
      const formData = new FormData();
      formData.append('pdf', pdfFile);
      console.log("userId", userId);
      
      // Use the new server-copy/analyze route
      const response = await axios.post(`${base_url}/api/user/server-copy/analyze`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
          'userId': userId
        }
      });
      
      if (response.data.success) {
        const extractedData = response.data.data || response.data;
        setExtractedData(extractedData);
        
        // Auto-fill form with extracted data
        autoFillForm(extractedData);
        
        // Update balance if transaction info exists
        if (response.data.transaction) {
          setBalance(response.data.transaction.balance);
          // Update user balance in localStorage
          if (user && response.data.transaction.balance !== undefined) {
            user.balance = response.data.transaction.balance;
            localStorage.setItem('user', JSON.stringify(user));
          }
        }
        
        toast.success('PDF বিশ্লেষণ সফল হয়েছে! ডাটা স্বয়ংক্রিয়ভাবে পূরণ করা হয়েছে।');
        setSuccess('PDF বিশ্লেষণ সফল হয়েছে! ডাটা স্বয়ংক্রিয়ভাবে পূরণ করা হয়েছে।');
      } else {
        const errorMsg = 'PDF বিশ্লেষণ ব্যর্থ হয়েছে: ' + (response.data.message || 'অজানা ত্রুটি');
        toast.error(errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      console.error('Server Copy PDF analysis error:', err);
      
      // Try with non-authenticated route if authenticated route fails
      if (err.response?.status === 401 || err.response?.status === 403) {
        try {
          await analyzePDFWithoutAuth(pdfFile);
        } catch (secondError) {
          const errorMsg = secondError.response?.data?.message || secondError.message || 'PDF বিশ্লেষণ ব্যর্থ হয়েছে';
          toast.error(errorMsg);
          setError(errorMsg);
        }
      } else {
        const errorMsg = err.response?.data?.message || err.message || 'PDF বিশ্লেষণ ব্যর্থ হয়েছে';
        toast.error(errorMsg);
        setError(errorMsg);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzePDFWithoutAuth = async (pdfFile) => {
    const formData = new FormData();
    formData.append('pdf', pdfFile);
    
    const response = await axios.post(`${base_url}/api/user/server-copy/analyze-pdf`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    if (response.data.success) {
      setExtractedData(response.data.data || response.data);
      autoFillForm(response.data.data || response.data);
      toast.success('PDF বিশ্লেষণ সফল হয়েছে! ডাটা স্বয়ংক্রিয়ভাবে পূরণ করা হয়েছে।');
      setSuccess('PDF বিশ্লেষণ সফল হয়েছে! ডাটা স্বয়ংক্রিয়ভাবে পূরণ করা হয়েছে।');
    } else {
      throw new Error(response.data.message || 'PDF বিশ্লেষণ ব্যর্থ হয়েছে');
    }
  };

  const autoFillForm = (data) => {
    const newFormData = { ...formData };
    
    // Map extracted data to form fields based on the provided response structure
    // Personal Information
    if (data.nameBn || data.nameBangla) newFormData.nameBangla = data.nameBn || data.nameBangla || '';
    if (data.nameEn || data.nameEnglish) newFormData.nameEnglish = data.nameEn || data.nameEnglish || '';
    if (data.nationalId || data.nid_number) newFormData.nationalId = data.nationalId || data.nid_number || '';
    if (data.pin || data.pinNumber) newFormData.pinNumber = data.pin || data.pinNumber || '';
    
    // Family Information
    if (data.father || data.fatherName) newFormData.fatherName = data.father || data.fatherName || '';
    if (data.mother || data.motherName) newFormData.motherName = data.mother || data.motherName || '';
    if (data.spouse || data.spouseName) newFormData.spouseName = data.spouse || data.spouseName || '';
    
    // Birth Information
    if (data.dateOfBirth || data.birthDate) newFormData.birthDate = data.dateOfBirth || data.birthDate || '';
    if (data.birthPlace || data.place_of_birth) newFormData.birthPlace = data.birthPlace || data.place_of_birth || '';
    
    // Demographic Information
    if (data.gender) {
      newFormData.gender = data.gender === 'male' ? 'Male' : 
                           data.gender === 'female' ? 'Female' : 
                           data.gender.charAt(0).toUpperCase() + data.gender.slice(1);
    }
    
    // Photo URL from response - FIXED: Set photo field, don't update nid preview
    if (data.photo) {
      newFormData.photo = data.photo;
      // Don't automatically set nid preview from extracted photo
      // This prevents duplicate photo handling
    }
    
    if (data.bloodGroup || data.bloodGroup) newFormData.bloodGroup = data.bloodGroup || data.bloodGroup || '';
    
    // Education and Occupation
    if (data.education || data.education_qualification) newFormData.education = data.education || data.education_qualification || '';
    
    // Occupation - Check various possible field names
    if (data.occupation || data.profession || data.ocupation) {
      newFormData.ocupation = data.occupation || data.profession || data.ocupation || '';
    }
    
    // Voter Information
    if (data.voterNo || data.voterNumber) newFormData.voterNumber = data.voterNo || data.voterNumber || '';
    if (data.voterArea || data.voter_area) newFormData.voterArea = data.voterArea || data.voter_area || '';
    
    // Address Information
    if (data.presentAddress) {
      newFormData.currentAddress = data.presentAddress.addressLine || '';
    } else if (data.address) {
      newFormData.currentAddress = data.address || '';
    }
    
    if (data.permanentAddress) {
      newFormData.permanentAddress = data.permanentAddress.addressLine || '';
    } else if (data.permanent_address) {
      newFormData.permanentAddress = data.permanent_address || '';
    } else if (data.presentAddress?.addressLine) {
      newFormData.permanentAddress = data.presentAddress.addressLine || '';
    }
    
    // Other fields
    if (data.slNo || data.formNumber) newFormData.formNumber = data.slNo || data.formNumber || '';
    
    setFormData(newFormData);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');
  setSuccess('');
  
  try {
    // Validate required fields
    if (!fileData.pdf.file) {
      throw new Error('দয়া করে একটি PDF ফাইল আপলোড করুন');
    }
    
    // Prepare form data
    const submitFormData = new FormData();
    
    // Add PDF file - ensure it's appended with the correct field name
    submitFormData.append('pdf', fileData.pdf.file);
    
    // FIXED: Handle photo/nidImage properly - only send ONE photo field
    if (fileData.nid.file) {
      // If user manually uploaded a photo, send it as nidImage
      submitFormData.append('nidImage', fileData.nid.file);
    } else if (formData.photo && formData.photo.trim() !== '') {
      // If we have a photo URL from extracted data, send it as a string field
      // This ensures it's sent as a single string, not an array
      submitFormData.append('photo', formData.photo);
    }
    
    // Add all form fields
    Object.keys(formData).forEach(key => {
      // Skip empty values and UBRN fields if not needed
      // Also skip 'photo' field if we're handling it separately above (to avoid duplication)
      if (key === 'photo' && fileData.nid.file) {
        // Skip photo field if we're sending nidImage instead
        return;
      }
      
      if (formData[key] && formData[key].toString().trim() !== '' && 
          !['UBRN', 'birthDateUBRN'].includes(key)) {
        submitFormData.append(key, formData[key].toString().trim());
      }
    });
    
    // Add copy type
    submitFormData.append('copyType', copyType);
    
    // Log FormData contents for debugging
    console.log('FormData entries:');
    for (let pair of submitFormData.entries()) {
      if (pair[0] === 'pdf' || pair[0] === 'nidImage') {
        console.log(pair[0], pair[1]?.name || 'file object');
      } else {
        console.log(pair[0], pair[1]);
      }
    }
    
    // Use the process-birth-certificate route
    const response = await axios.post(`${base_url}/api/user/server-copy/process-birth-certificate`, submitFormData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'userid': userId,
        'Authorization': token 
      }
    });
    
    // Handle successful response
    if (response.data.success) {
      toast.success('সার্ভার কপি তৈরি সফল হয়েছে!');
      resetForm();
      fetchServerCopies();
      
    } else {
      throw new Error(response.data.message || 'জমা দিতে ব্যর্থ হয়েছে');
    }
    
  } catch (err) {
    console.error('Submission error:', err);
    
    // Handle error response
    if (err.response?.data) {
      const errorData = err.response.data;
      const errorMsg = errorData.message || errorData.error || 'জমা দিতে ব্যর্থ হয়েছে';
      toast.error(errorMsg);
      setError(errorMsg);
    } else {
      const errorMsg = err.message || 'নেটওয়ার্ক ত্রুটি';
      toast.error(errorMsg);
      setError(errorMsg);
    }
  } finally {
    setLoading(false);
  }
};

  const resetForm = () => {
    setFileData({
      pdf: { preview: null, name: "No file chosen", file: null },
      nid: { preview: null, name: "No file chosen", file: null }
    });
    
    setFormData({
      photo: '',
      nameBangla: '',
      nameEnglish: '',
      nationalId: '',
      pinNumber: '',
      formNumber: '',
      voterNumber: '',
      voterArea: '',
      mobileNumber: '',
      fatherName: '',
      motherName: '',
      spouseName: '',
      education: '',
      ocupation: '', // Reset ocupation field
      birthPlace: '',
      birthDate: '',
      bloodGroup: '',
      gender: 'Gender',
      currentAddress: '',
      permanentAddress: '',
      UBRN: '',
      birthDateUBRN: ''
    });
    
    setExtractedData(null);
    setCaptchaData(null);
    setCaptchaText('');
  };

  const clearFile = (type) => {
    setFileData(prev => ({ 
      ...prev, 
      [type]: { preview: null, name: "No file chosen", file: null } 
    }));
    
    if (type === 'pdf') {
      setExtractedData(null);
    }
    
    // If clearing nid file, also clear the photo form field
    if (type === 'nid') {
      setFormData(prev => ({
        ...prev,
        photo: ''
      }));
    }
  };

  // ==================== TABLE FUNCTIONS ====================
  // Filter server copies based on search term
  const filteredServerCopies = serverCopies.filter(copy => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (copy.orderId && copy.orderId.toLowerCase().includes(searchLower)) ||
      (copy.nameBangla && copy.nameBangla.toLowerCase().includes(searchLower)) ||
      (copy.nameEnglish && copy.nameEnglish.toLowerCase().includes(searchLower)) ||
      (copy.nationalId && copy.nationalId.includes(searchTerm))
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredServerCopies.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentServerCopies = filteredServerCopies.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

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

  // Delete functions
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
      const response = await axios.delete(`${base_url}/api/user/server-copy/${receiptToDelete._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'userId': userId
        }
      });
      
      if (response.data.success) {
        toast.success('সার্ভার কপি সফলভাবে ডিলিট করা হয়েছে');
        // Refresh the list
        fetchServerCopies();
      } else {
        toast.error(response.data.message || 'ডিলিট করতে ব্যর্থ হয়েছে');
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

  // Action buttons component
  const ActionButtons = ({ receipt }) => (
    <div className="flex items-center justify-center gap-2">
      {/* v1 Button */}
      <NavLink
        to={`/auto-services/sign-to-server-copy-download/v2/${receipt.orderId}`}
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
        to={`/auto-services/sign-to-server-copy-download/v1/${receipt.orderId}`}
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
        to={`/auto-services/sign-to-server-copy-download/v3/${receipt.orderId}`}
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
        <Trash2 size={18} />
      </button>
    </div>
  );

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
      const response = await axios.get(`${base_url}/api/user/service/notice/sign-to-server-copy`);
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

      <div className={`font-anek lg:ml-72 mt-[9vh] min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-[#f4f6f9] text-gray-700'}`}>
        <Header toggleSidebar={toggleSidebar} />
        <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />

        <main className="min-h-[91vh] p-4 md:p-6">
          {/* Top Label */}
          <div className="flex justify-between items-center">
            <h1 className={`text-lg md:text-[23px] font-bold mb-3 ${isDarkMode ? 'text-theme_color' : 'text-theme_color'}`}>
              সাইন টু সার্ভার কপি
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
              <CheckCircle2 size={18} />
              <span className="text-sm">{success}</span>
              <button onClick={() => setSuccess('')} className="ml-auto">
                <X size={18} />
              </button>
            </div>
          )}
          
          {error && (
            <div className={`mb-4 p-3 rounded border flex items-center gap-2 ${isDarkMode 
              ? 'bg-red-900/30 border-red-800/50 text-red-300' 
              : 'bg-red-100 text-red-700 border-red-200'}`}>
              <AlertCircle size={18} />
              <span className="text-sm">{error}</span>
              <button onClick={() => setError('')} className="ml-auto">
                <X size={18} />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className={`w-full p-6 border shadow-sm rounded-lg mb-6 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            
            {/* PDF Upload Section */}
            <div className="flex flex-col items-center mb-8">
              <input 
                type="file" 
                ref={pdfInputRef} 
                className="hidden" 
                accept=".pdf" 
                onChange={(e) => handleFileChange(e, 'pdf')} 
                disabled={loading || isAnalyzing}
              />
              <div 
                onClick={() => !loading && !isAnalyzing && pdfInputRef.current.click()}
                className={`border-2 border-dashed ${fileData.pdf.file ? 'border-theme_color bg-green-50' : isDarkMode ? 'border-theme_color bg-gray-700/50' : 'border-theme_color'} rounded-xl p-6 flex flex-col items-center justify-center w-full max-w-md cursor-pointer ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-teal-50'} transition-all ${(loading || isAnalyzing) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className={`mb-2 ${isDarkMode ? 'text-theme_color' : 'text-theme_color'}`}>
                  {isAnalyzing ? (
                    <Loader2 size={42} className="animate-spin" />
                  ) : (
                    <FileText size={42} strokeWidth={1.5} />
                  )}
                </div>
                <p className={`font-bold text-sm ${isDarkMode ? 'text-theme_color' : 'text-theme_color'}`}>
                  {isAnalyzing ? 'PDF বিশ্লেষণ হচ্ছে...' : fileData.pdf.file ? 'PDF আপলোড হয়েছে' : 'সার্ভার কপি লোড করতে'}
                </p>
                <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                  {fileData.pdf.name}
                </p>
                {isAnalyzing && (
                  <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    সার্ভার কপি থেকে ডাটা এক্সট্রাক্ট হচ্ছে...
                  </p>
                )}
              </div>
              
              {fileData.pdf.file && (
                <div className="mt-2 flex items-center gap-2">
                  <span className={`text-xs ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>{fileData.pdf.name}</span>
                  <button 
                    type="button"
                    onClick={() => clearFile('pdf')}
                    className={`${isDarkMode ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-700'}`}
                    disabled={loading}
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Balance Warning */}
            {servicePrice !== null && balance !== null && balance < servicePrice && (
              <div className={`mb-4 p-3 rounded border flex items-center gap-2 ${isDarkMode 
                ? 'bg-yellow-900/30 border-yellow-800/50 text-yellow-300' 
                : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>
                <AlertCircle size={18} />
                <div>
                  <p className="text-sm font-semibold">অপর্যাপ্ত ব্যালেন্স!</p>
                  <p className="text-xs">প্রয়োজন: {servicePrice}৳, আপনার ব্যালেন্স: {balance}৳</p>
                  <p className="text-xs mt-1">এই পরিষেবা ব্যবহার করতে দয়া করে আপনার অ্যাকাউন্ট রিচার্জ করুন।</p>
                </div>
              </div>
            )}

            {/* Beautiful Photo Preview Section */}
            <div className="flex justify-center mb-10">
              <div className="relative group">
                <div className={`w-48 h-56 rounded-2xl overflow-hidden shadow-2xl border-[6px] transition-all duration-300 transform group-hover:scale-[1.02] ${
                  isDarkMode 
                    ? 'border-gray-800 bg-gray-900 shadow-blue-900/20' 
                    : 'border-white bg-white shadow-gray-200'
                } relative`}>
                  
                  <div 
                    onClick={() => !loading && nidInputRef.current.click()}
                    className={`w-full h-full flex flex-col items-center justify-center cursor-pointer relative z-10 ${
                      loading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <input 
                      type="file" 
                      ref={nidInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={(e) => handleFileChange(e, 'nid')} 
                      disabled={loading}
                    />

                    {fileData.nid.preview ? (
                      <div className="w-full h-full relative group/img">
                        <img 
                          src={fileData.nid.preview} 
                          alt="User Photo" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = `
                              <div class="flex flex-col items-center justify-center h-full ${isDarkMode ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-400'}">
                                <User size={48} />
                                <span class="text-xs mt-2 font-bold uppercase tracking-tighter">Load Failed</span>
                              </div>
                            `;
                          }}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                          <Camera size={32} className="text-white" />
                        </div>
                      </div>
                    ) : formData.photo ? (
                      // Show extracted photo if available and no manual upload
                      <div className="w-full h-full relative group/img">
                        <img 
                          src={formData.photo} 
                          alt="Extracted Photo" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = `
                              <div class="flex flex-col items-center justify-center h-full ${isDarkMode ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-400'}">
                                <User size={48} />
                                <span class="text-xs mt-2 font-bold uppercase tracking-tighter">Load Failed</span>
                              </div>
                            `;
                          }}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                          <Camera size={32} className="text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className={`flex flex-col items-center justify-center h-full w-full p-6 transition-colors ${
                        isDarkMode 
                          ? 'bg-gradient-to-b from-gray-800 to-gray-900 text-gray-400 hover:from-gray-750' 
                          : 'bg-gradient-to-b from-blue-50 to-white text-gray-400 hover:from-blue-100'
                      }`}>
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 animate-pulse-slow ${
                          isDarkMode ? 'bg-gray-700 shadow-inner' : 'bg-white shadow-md'
                        }`}>
                          <Camera size={36} className={isDarkMode ? 'text-blue-400' : 'text-blue-500'} />
                        </div>
                        <span className={`text-sm text-center font-bold uppercase tracking-wide ${isDarkMode ? 'text-gray-200' : 'text-gray-600'}`}>
                          {fileData.nid.file ? 'Uploaded' : 'ছবি আপলোড'}
                        </span>
                        <div className={`h-[2px] w-8 my-2 rounded-full ${isDarkMode ? 'bg-blue-500/50' : 'bg-blue-300'}`}></div>
                        <span className={`text-[11px] text-center leading-tight ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          ক্লিক করে ছবি নির্বাচন করুন
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Premium UI Corner Accents */}
                  <div className={`absolute top-2 left-2 w-6 h-6 border-t-[3px] border-l-[3px] rounded-tl-md z-20 pointer-events-none transition-all group-hover:top-1 group-hover:left-1 ${isDarkMode ? 'border-blue-500' : 'border-blue-400'}`}></div>
                  <div className={`absolute bottom-2 right-2 w-6 h-6 border-b-[3px] border-r-[3px] rounded-br-md z-20 pointer-events-none transition-all group-hover:bottom-1 group-hover:right-1 ${isDarkMode ? 'border-blue-500' : 'border-blue-400'}`}></div>
                </div>
                
                {/* Floating Clear Button */}
                {(fileData.nid.file || fileData.nid.preview) && (
                  <button 
                    type="button"
                    onClick={() => clearFile('nid')}
                    className="absolute -top-3 -right-3 bg-red-500 text-white rounded-xl p-2 hover:bg-red-600 shadow-xl z-30 transform hover:scale-110 active:scale-90 transition-all border-2 border-white"
                    disabled={loading}
                  >
                    <X size={18} strokeWidth={3} />
                  </button>
                )}
              </div>
            </div>

            {/* Form Grid - Now includes ocupation field */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
              <InputField 
                label="নাম (বাংলা)" 
                name="nameBangla"
                value={formData.nameBangla}
                onChange={handleInputChange}
                placeholder="সম্পূর্ণ নাম বাংলায়" 
                required 
                disabled={loading}
                isDarkMode={isDarkMode}
              />
              <InputField 
                label="নাম (ইংরেজী)" 
                name="nameEnglish"
                value={formData.nameEnglish}
                onChange={handleInputChange}
                placeholder="সম্পূর্ণ নাম ইংরেজীতে" 
                required 
                disabled={loading}
                isDarkMode={isDarkMode}
              />
              <InputField 
                label="এনআইডি নম্বর" 
                name="nationalId"
                value={formData.nationalId}
                onChange={handleInputChange}
                placeholder="এনআইডি নাম্বার" 
                required 
                disabled={loading}
                isDarkMode={isDarkMode}
              />
              <InputField 
                label="পিন নম্বর" 
                name="pinNumber"
                value={formData.pinNumber}
                onChange={handleInputChange}
                placeholder="পিন নাম্বার" 
                required 
                disabled={loading}
                isDarkMode={isDarkMode}
              />
              <InputField 
                label="ফরম নম্বর" 
                name="formNumber"
                value={formData.formNumber}
                onChange={handleInputChange}
                placeholder="ফরম নাম্বার" 
                required 
                disabled={loading}
                isDarkMode={isDarkMode}
              />
              <InputField 
                label="ভোটার নম্বর" 
                name="voterNumber"
                value={formData.voterNumber}
                onChange={handleInputChange}
                placeholder="ভোটার নাম্বার" 
                required 
                disabled={loading}
                isDarkMode={isDarkMode}
              />
              <InputField 
                label="ভোটার এরিয়া" 
                name="voterArea"
                value={formData.voterArea}
                onChange={handleInputChange}
                placeholder="ভোটার এরিয়া" 
                required 
                disabled={loading}
                isDarkMode={isDarkMode}
              />
              <InputField 
                label="মোবাইল নম্বর" 
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleInputChange}
                placeholder="মোবাইল নাম্বার" 
                disabled={loading}
                isDarkMode={isDarkMode}
              />
              <InputField 
                label="পেশা" 
                name="ocupation"
                value={formData.ocupation}
                onChange={handleInputChange}
                placeholder="পেশা" 
                required 
                disabled={loading}
                isDarkMode={isDarkMode}
              />
              <InputField 
                label="পিতার নাম" 
                name="fatherName"
                value={formData.fatherName}
                onChange={handleInputChange}
                placeholder="পিতার নাম বাংলায়" 
                required 
                disabled={loading}
                isDarkMode={isDarkMode}
              />
              <InputField 
                label="মাতার নাম" 
                name="motherName"
                value={formData.motherName}
                onChange={handleInputChange}
                placeholder="মাতার নাম বাংলায়" 
                required 
                disabled={loading}
                isDarkMode={isDarkMode}
              />
              <InputField 
                label="স্বামী/স্ত্রীর নাম" 
                name="spouseName"
                value={formData.spouseName}
                onChange={handleInputChange}
                placeholder="স্বামী/স্ত্রীর নাম বাংলায়" 
                disabled={loading}
                isDarkMode={isDarkMode}
              />
              <InputField 
                label="শিক্ষাগত যোগ্যতা" 
                name="education"
                value={formData.education}
                onChange={handleInputChange}
                placeholder="শিক্ষাগত যোগ্যতা" 
                required 
                disabled={loading}
                isDarkMode={isDarkMode}
              />
              <InputField 
                label="জন্মস্থান" 
                name="birthPlace"
                value={formData.birthPlace}
                onChange={handleInputChange}
                placeholder="জন্মস্থান (অঞ্চল)" 
                required 
                disabled={loading}
                isDarkMode={isDarkMode}
              />
              <InputField 
                label="জন্ম তারিখ" 
                name="birthDate"
                value={formData.birthDate}
                onChange={handleInputChange}
                placeholder="20 Mar 1987" 
                required 
                disabled={loading}
                isDarkMode={isDarkMode}
              />
              <InputField 
                label="রক্তের গ্রুপ" 
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleInputChange}
                placeholder="B+" 
                disabled={loading}
                isDarkMode={isDarkMode}
              />
              
              <div className="flex flex-col">
                <label className={`text-[11px] font-bold mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  লিঙ্গ <span className="text-red-500">*</span>
                </label>
                <select 
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className={`border rounded-sm px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#1abc9c] ${isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-[#1abc9c]'
                    : 'bg-white border-gray-300 focus:border-[#1abc9c]'
                  } disabled:bg-gray-100 disabled:cursor-not-allowed`}
                  disabled={loading}
                  required
                >
                  <option value="Gender">লিঙ্গ</option>
                  <option value="Male">পুরুষ</option>
                  <option value="Female">মহিলা</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className={`text-[11px] font-bold mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  বর্তমান ঠিকানা <span className="text-red-500">*</span>
                </label>
                <textarea 
                  name="currentAddress"
                  value={formData.currentAddress}
                  onChange={handleInputChange}
                  className={`w-full border rounded-sm px-3 py-2 text-sm md:tet-[15px] focus:outline-none focus:ring-2 focus:ring-[#1abc9c] min-h-[50px] ${isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-[#1abc9c]'
                    : 'bg-white border-gray-300 focus:border-[#1abc9c]'
                  } disabled:bg-gray-100 disabled:cursor-not-allowed`}
                  placeholder="বাসা/হোল্ডিং: (Holding), গ্রাম/রাস্তা: (গ্রাম, মৌজা), ডাকঘর: (Post Office - Postal Code), উপজেলা, সিটি কর্পোরেশন/পৌরসভা, জেলা"
                  required
                  disabled={loading}
                />
              </div>

              <div className="md:col-span-2">
                <label className={`text-[11px] font-bold mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  স্থায়ী ঠিকানা <span className="text-red-500">*</span>
                </label>
                <textarea 
                  name="permanentAddress"
                  value={formData.permanentAddress}
                  onChange={handleInputChange}
                  className={`w-full border rounded-sm px-3 py-2 text-sm md:tet-[15px] focus:outline-none focus:ring-2 focus:ring-[#1abc9c] min-h-[50px] ${isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-[#1abc9c]'
                    : 'bg-white border-gray-300 focus:border-[#1abc9c]'
                  } disabled:bg-gray-100 disabled:cursor-not-allowed`}
                  placeholder="বাসা/হোল্ডিং: (Holding), গ্রাম/রাস্তা: (গ্রাম, মৌজা), ডাকঘর: (Post Office - Postal Code), উপজেলা, সিটি কর্পোরেশন/পৌরসভা, জেলা"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Service Price Information Box */}
            {servicePrice !== null && (
              <div className={`mt-6 mb-6 p-4 border rounded-md flex justify-start items-start gap-3 ${isDarkMode
                  ? 'bg-blue-900/20 border-blue-800/50'
                  : 'bg-blue-50 border-blue-200'
                }`}>
                <div className="flex items-start">
                  <Info className={`w-6 h-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                </div>
                <div>
                  <p className={isDarkMode ? 'text-blue-200' : 'text-blue-600'}>
                    এই সেবার জন্য আপনার অ্যাকাউন্ট থেকে <span className="font-bold">{servicePrice} টাকা</span> কাটা হবে।
                  </p>
                </div>
              </div>
            )}

            {/* Footer Action */}
            <div className="mt-8 flex gap-3">
              <button 
                type="submit"
                className="flex-1 bg-theme_color text-white font-bold py-3 rounded text-sm transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={loading || (!fileData.pdf.file && activeTab === 'upload')}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    ডাউনলোড করা হচ্ছে...
                  </>
                ) : (
                  <>
                    <Save size={20} /> ডাউনলোড করুন 
                  </>
                )}
              </button>
            </div>

          </form>

          {/* Previous Server Copies Table */}
          <div className={`w-full p-6 border shadow-sm rounded-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-lg md:text-xl font-bold ${isDarkMode ? 'text-[#1abc9c]' : 'text-[#1abc9c]'}`}>
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
              {loadingCopies ? (
                <div className="flex justify-center items-center py-12">
                  <ApertureLoader/>
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
                        নাম (বাংলা)
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
                        <td colSpan="7" className="p-8 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <FileText className={isDarkMode ? 'text-gray-600' : 'text-gray-400'} size={48} />
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
                                className="mt-4 text-sm bg-blue-600 text-white px-4 py-2 rounded-sm cursor-pointer"
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
                            <div className="font-semibold">{copy.nameBangla || 'N/A'}</div>
                            <div className="text-xs text-gray-500">{copy.nameEnglish || ''}</div>
                          </td>
                          <td className={`p-3 text-sm border-r transition-colors duration-300 ${isDarkMode
                              ? 'text-gray-200 border-gray-700'
                              : 'text-gray-800 border-gray-200'
                            }`}>
                            {copy.nationalId || 'N/A'}
                          </td>
                          <td className={`p-3 text-sm border-r transition-colors duration-300 ${isDarkMode
                              ? 'text-gray-200 border-gray-700'
                              : 'text-gray-800 border-gray-200'
                            }`}>
                            <span className="font-bold">{copy.servicePrice || 0}৳</span>
                          </td>
                          <td className={`p-3 text-sm text-nowrap border-r transition-colors duration-300 ${isDarkMode
                              ? 'text-gray-400 border-gray-700'
                              : 'text-gray-600 border-gray-200'
                            }`}>
                            <div className="flex items-center justify-center gap-1">
                              <Calendar size={12} />
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

            {/* Pagination */}
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
                      অর্ডার আইডি
                    </p>
                    <p className={`font-semibold text-xs md:text-sm truncate transition-colors duration-300 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      {receiptToDelete.orderId}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className={`text-xs transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      নাম
                    </p>
                    <p className={`font-semibold text-xs md:text-sm truncate transition-colors duration-300 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      {receiptToDelete.nameBangla}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className={`text-xs transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      এনআইডি
                    </p>
                    <p className={`font-semibold text-xs md:text-sm truncate transition-colors duration-300 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      {receiptToDelete.nationalId}
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

function InputField({ label, name, value, onChange, placeholder, required = false, disabled = false, isDarkMode = false }) {
  return (
    <div className="flex flex-col">
      <label className={`text-[11px] font-bold mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input 
        name={name}
        value={value}
        onChange={onChange}
        className={`border rounded-sm px-3 py-2.5 text-sm md:text-[16px] focus:outline-none focus:ring-2 focus:ring-[#1abc9c] placeholder:text-gray-600 ${isDarkMode
          ? 'bg-gray-700 border-gray-600 text-white placeholder:text-gray-600 focus:border-[#1abc9c]'
          : 'bg-white border-gray-300 focus:border-[#1abc9c]'
        } disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors`}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
      />
    </div>
  );
}

export default Signtoserver;