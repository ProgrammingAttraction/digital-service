import React, { useState, useEffect } from 'react';
import { RotateCcw, Loader2, AlertCircle, Save, Info, Trash2, Download, Calendar, FileText, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import Header from '../../../components/header/Header';
import Sidebar from '../../../components/sidebar/Sidebar';
import { useTheme } from '../../../context/ThemeContext';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import ApertureLoader from '../../../components/loader/ApertureLoader';

function Birthcertificate() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;

  // State variables
  const [brn, setBrn] = useState(''); // Changed from ubrn to brn
  const [dob, setDob] = useState(''); // Changed from birthDate to dob
  const [loading, setLoading] = useState(false);
  const [captchaImage, setCaptchaImage] = useState('');
  const [captchaValue, setCaptchaValue] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [requiresCaptcha, setRequiresCaptcha] = useState(false);
  const [saving, setSaving] = useState(false);
  const [receiptId, setReceiptId] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // State for receipt list
  const [receipts, setReceipts] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  // Delete confirmation popup state
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [receiptToDelete, setReceiptToDelete] = useState(null);

  const [formData, setFormData] = useState({
    // Personal Information
    nameBangla: '',
    nameEnglish: '',
    fatherNameBangla: '',
    fatherNameEnglish: '',
    fatherNationalityBangla: '',
    fatherNationalityEnglish: '',
    motherNameBangla: '',
    motherNameEnglish: '',
    motherNationalityBangla: '',
    motherNationalityEnglish: '',
    birthPlaceBangla: '',
    birthPlaceEnglish: '',
    gender: '',
    
    // Birth Registration Details
    birthRegistrationNumber: '',
    dateOfRegistration: '',
    dateOfBirth: '',
    dateOfBirthInWords: '',
    dateOfIssuance: '',
    
    // Location Details
    registerOfficeAddress: '',
    upazilaPourashavaCityCorporationZila: '',
    permanentAddressBangla: '',
    permanentAddressEnglish: '',
    
    // Other Details
    qrLink: '',
    leftBarcode: '',
    
    // Auto-generated barcode
    autoBarcode: ''
  });

  // Price state
  const [price, setPrice] = useState(200);
  const [servicePrice, setServicePrice] = useState(200);
  const [serviceName, setServiceName] = useState('অটো জন্মানিবন্ধন মেক');

  // Get user ID from localStorage
  const getUserId = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user._id || user.id;
  };

  // Get auth headers
  const getAuthHeaders = () => {
    const userId = getUserId();
    return {
      'userid': userId,
      'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
      'Content-Type': 'application/json'
    };
  };

  // Configure axios with base URL and headers
  const api = axios.create({
    baseURL: base_url,
    headers: getAuthHeaders()
  });

  // Fetch service price on component mount
  useEffect(() => {
    fetchServicePrice();
    generateBarcode();
    fetchReceipts();
  }, []);

  // Fetch service price from the specific endpoint
  const fetchServicePrice = async () => {
    try {
      const response = await axios.get(`${base_url}/api/user/service/price/auto-birth-certificate`, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setServicePrice(response.data.price);
        setPrice(response.data.price);
        setServiceName(response.data.serviceName || 'অটো জন্মানিবন্ধন মেক');
      } else {
        setServicePrice(200);
        setPrice(200);
        setServiceName('অটো জন্মানিবন্ধন মেক');
      }
    } catch (error) {
      console.log('Error fetching service price, using default:', error);
      setServicePrice(200);
      setPrice(200);
      setServiceName('অটো জন্মানিবন্ধন মেক');
    }
  };

  // Fetch receipts list
  const fetchReceipts = async () => {
    try {
      setListLoading(true);
      const response = await api.get('/api/user/users/birth-certificate/all');
      if (response.data.success) {
        setReceipts(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching receipts:', error);
      toast.error('জন্ম নিবন্ধন সনদ তালিকা লোড করতে সমস্যা হয়েছে');
    } finally {
      setListLoading(false);
    }
  };

  // Generate random barcode
  const generateBarcode = () => {
    const randomCode = Math.floor(10000 + Math.random() * 90000).toString();
    setFormData(prev => ({ ...prev, leftBarcode: randomCode, autoBarcode: randomCode }));
  };

  // ========== STEP 1: GET CAPTCHA ===========
  const getCaptchaFromAPI = async () => {
    try {
      setError('');
      setSuccessMessage('');
      setLoading(true);

      const userId = getUserId();
      if (!userId) {
        setError('Please login to use this service');
        toast.error('লগইন করুন');
        return null;
      }

      const response = await axios.post(`${base_url}/api/user/birth-certificate-data`, 
        {
          brn: brn,          // Changed from UBRN to brn
          dob: dob          // Changed from BirthDate to dob
        },
        {
          headers: getAuthHeaders()
        }
      );

      if (response.data.success) {
        if (response.data.requiresCaptcha) {
          return response.data.data;
        } else {
          processBirthData(response.data.data);
          return null;
        }
      } else {
        setError(response.data.message || 'Failed to get CAPTCHA');
        toast.error(response.data.message || 'CAPTCHA পাওয়া যায়নি');
        return null;
      }
    } catch (error) {
      console.error('Error getting CAPTCHA:', error);
      setError(error.response?.data?.message || 'Failed to connect to server');
      toast.error(error.response?.data?.message || 'সার্ভার কানেকশন ব্যর্থ');
      return null;
    } finally {
      setLoading(false);
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
      const response = await axios.get(`${base_url}/api/user/service/notice/auto-birth-certificate`);
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

  // ========== STEP 2: VERIFY DATA WITH CAPTCHA ==========
  const verifyWithCaptchaAPI = async () => {
    try {
      setError('');
      setLoading(true);

      const userId = getUserId();
      if (!userId) {
        setError('Please login to use this service');
        toast.error('লগইন করুন');
        return null;
      }

      const response = await axios.post(`${base_url}/api/user/birth-certificate-data`, 
        {
          brn: brn,                    // Changed from UBRN to brn
          dob: dob,                    // Changed from BirthDate to dob
          sessionId: sessionId,
          captcha_code: captchaValue   // Changed from captcha to captcha_code
        },
        {
          headers: getAuthHeaders()
        }
      );
      if (response.data.success) {
        processBirthData(response.data.data);
        toast.success('ডেটা সফলভাবে লোড হয়েছে!');
        return response.data;
      } else {
        setError(response.data.message || 'Verification failed');
        toast.error(response.data.message || 'ভেরিফিকেশন ব্যর্থ');
        return null;
      }
    } catch (error) {
      console.error('Error verifying CAPTCHA:', error);
      setError(error.response?.data?.message || 'Failed to verify CAPTCHA');
      toast.error(error.response?.data?.message || 'CAPTCHA ভেরিফিকেশন ব্যর্থ');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Process birth data received from API
  const processBirthData = (apiData) => {
    try {
      console.log('Processing API data:', apiData);
      
      const data = apiData.data || apiData;
      
      const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
          // Handle different date formats (YYYY-MM-DD or DD/MM/YYYY)
          let dateParts;
          if (dateString.includes('/')) {
            dateParts = dateString.split('/');
            if (dateParts.length === 3) {
              // Convert DD/MM/YYYY to YYYY-MM-DD
              const day = dateParts[0].padStart(2, '0');
              const month = dateParts[1].padStart(2, '0');
              const year = dateParts[2];
              return `${year}-${month}-${day}`;
            }
          } else if (dateString.includes('-')) {
            dateParts = dateString.split('-');
            if (dateParts.length === 3) {
              // Already YYYY-MM-DD
              return dateString;
            }
          }
          
          const date = new Date(dateString);
          if (isNaN(date.getTime())) return dateString;
          return date.toISOString().split('T')[0];
        } catch (e) {
          return dateString;
        }
      };

      const birthDateFormatted = formatDate(data.dateOfBirth || data.dob || dob);
      const registrationDate = formatDate(data.dateOfRegistration || data.registrationDate);
      const issueDate = formatDate(data.dateOfIssuance || data.issuanceDate || new Date().toISOString().split('T')[0]);

      const updatedFormData = {
        nameBangla: data.nameBangla || '',
        nameEnglish: data.nameEnglish || data.name_english || data.name_en || data.name || '',
        fatherNameBangla: data.fatherName || data.fatherNameBangla || '',
        fatherNameEnglish: data.fatherNameEn || data.fatherNameEnglish || '',
        fatherNationalityBangla: data.fatherNationalityBn || 'বাংলাদেশি',
        fatherNationalityEnglish: data.fatherNationality || 'Bangladeshi',
        motherNameBangla: data.motherName || data.motherNameBangla || '',
        motherNameEnglish: data.motherNameEn || data.motherNameEnglish || '',
        motherNationalityBangla: data.motherNationalityBn || 'বাংলাদেশি',
        motherNationalityEnglish: data.motherNationality || 'Bangladeshi',
        birthPlaceBangla: data.birthPlace || data.birthPlaceBangla || '',
        birthPlaceEnglish: data.birthPlaceEn || data.birthPlaceEnglish || '',
        birthRegistrationNumber: data.brn || data.birthRegistrationNumber || brn,
        dateOfRegistration: registrationDate,
        dateOfBirth: birthDateFormatted,
        dateOfBirthInWords: data.dobWords || convertDateToWords(birthDateFormatted),
        dateOfIssuance: issueDate,
        gender: data.genderBn || data.genderEnglish || 'পুরুষ',
        registerOfficeAddress: data.registerOfficeAddress  || '',
        upazilaPourashavaCityCorporationZila: data.registerOffice || data.registrationOffice || '',
        permanentAddressBangla: data.birthPlace || data.birthPlaceBangla || '',
        permanentAddressEnglish: data.birthPlaceEn || data.birthPlaceEnglish || '',
        qrLink: data.qrLink,
        leftBarcode: formData.leftBarcode,
        autoBarcode: formData.autoBarcode
      };

      setFormData(updatedFormData);
      setSuccessMessage('Data loaded successfully!');
      
      setRequiresCaptcha(false);
      setCaptchaValue('');
      setCaptchaImage('');
      setSessionId('');

    } catch (error) {
      console.error('Error processing birth data:', error);
      setError('Failed to process birth data');
      toast.error('ডেটা প্রসেসিং ব্যর্থ');
    }
  };

  // Auto load data from BDRIS API
  const handleAutoLoad = async () => {
    if (!brn || !dob) {  // Changed from ubrn/birthDate to brn/dob
      setError('দয়া করে জন্ম নিবন্ধন নাম্বার এবং জন্ম তারিখ প্রদান করুন');
      toast.error('দয়া করে জন্ম নিবন্ধন নাম্বার এবং জন্ম তারিখ প্রদান করুন');
      return;
    }

    // Validate BRN format (could be 17 digits or other format)
    if (!brn || brn.length < 10) {
      setError('দয়া করে বৈধ জন্ম নিবন্ধন নাম্বার প্রদান করুন');
      toast.error('বৈধ জন্ম নিবন্ধন নাম্বার দিন');
      return;
    }

    setError('');
    setSuccessMessage('');

    const captchaData = await getCaptchaFromAPI();
    
    if (captchaData) {
      setSessionId(captchaData.sessionId);
      
      if (captchaData.captchaUrl) {
        setCaptchaImage(captchaData.captchaUrl);
      } else if (captchaData.captcha) {
        setCaptchaImage(captchaData.captcha);
      } else if (captchaData.image) {
        setCaptchaImage(captchaData.image);
      } else if (captchaData.captchaBase64) {
        setCaptchaImage(captchaData.captchaBase64);
      } else {
        setError('CAPTCHA image not found in response');
        toast.error('CAPTCHA পাওয়া যায়নি');
        return;
      }
      
      setRequiresCaptcha(true);
    }
  };

  // Verify with CAPTCHA
  const handleVerifyCaptcha = async () => {
    if (!captchaValue) {
      setError('দয়া করে CAPTCHA কোডটি লিখুন');
      toast.error('CAPTCHA কোড দিন');
      return;
    }

    setError('');
    await verifyWithCaptchaAPI();
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Deduct balance from user account
  const deductBalance = async () => {
    try {
      const response = await axios.post(`${base_url}/api/user/balance/deduct`, {
        amount: servicePrice,
        service: serviceName,
        reference: `BIRTH_${Date.now()}`,
        description: `${serviceName} - জন্ম নিবন্ধন নং: ${formData.birthRegistrationNumber}`
      }, {
        headers: getAuthHeaders()
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

  // Save and download function
  const handleSaveAndDownload = async () => {
    const requiredFields = [
      'nameBangla', 'nameEnglish', 'birthRegistrationNumber', 
      'dateOfBirth', 'dateOfRegistration', 'fatherNameBangla',
      'motherNameBangla', 'birthPlaceBangla', 'permanentAddressBangla'
    ];

    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      setError('দয়া করে সকল প্রয়োজনীয় তথ্য প্রদান করুন');
      toast.error('সকল প্রয়োজনীয় তথ্য প্রদান করুন');
      return;
    }

    setSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      const userId = getUserId();
      if (!userId) {
        setError('Please login to save data');
        toast.error('লগইন করুন');
        setSaving(false);
        return;
      }

      const deductionResult = await deductBalance();
      
      if (!deductionResult.success) {
        setError(`ব্যালেন্স কাটতে ব্যর্থ: ${deductionResult.message}`);
        toast.error(`ব্যালেন্স কাটতে ব্যর্থ: ${deductionResult.message}`);
        setSaving(false);
        return;
      }

      const saveData = {
        ...formData,
        brn: brn,            // Changed from ubrn to brn
        dob: dob,           // Changed from birthDate to dob
        userId: userId,
        price: servicePrice,
        servicePrice: servicePrice,
        serviceName: serviceName,
        transactionId: deductionResult.data?.transactionId || null
      };

      const response = await api.post('/api/user/users/birth-certificate/save', saveData);

      if (response.data.success) {
        const newReceiptId = response.data.data.receiptId;
        setReceiptId(newReceiptId);
        setSuccessMessage('জন্ম নিবন্ধন সনদ সফলভাবে সংরক্ষণ করা হয়েছে!');
        toast.success('জন্ম নিবন্ধন সনদ সফলভাবে সংরক্ষণ করা হয়েছে!');

        if (deductionResult.data?.newBalance !== undefined) {
          const userData = JSON.parse(localStorage.getItem('user'));
          userData.balance = deductionResult.data.newBalance;
          localStorage.setItem('user', JSON.stringify(userData));
        }

        fetchReceipts();
        
        setTimeout(() => {
          navigate(`/auto-services/auto-birth-registration-download/${newReceiptId}`);
        }, 500);

      } else {
        setError(response.data.message || 'Failed to save certificate');
        toast.error(response.data.message || 'সনদ সংরক্ষণ ব্যর্থ');
      }
    } catch (error) {
      console.error('Error saving certificate:', error);
      setError(error.response?.data?.message || 'Failed to save certificate');
      toast.error(error.response?.data?.message || 'সনদ সংরক্ষণ ব্যর্থ');
    } finally {
      setSaving(false);
    }
  };

  // Helper functions
  const convertDateToWords = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
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
      
      const dayInWords = dayNames[day - 1] || day.toString();
      return `${dayInWords} of ${month} ${year}`;
    } catch (error) {
      console.error('Error converting date to words:', error);
      return dateString;
    }
  };

  // Refresh CAPTCHA
  const handleRefreshCaptcha = async () => {
    if (!brn || !dob) {  // Changed from ubrn/birthDate to brn/dob
      setError('দয়া করে জন্ম নিবন্ধন নাম্বার এবং জন্ম তারিখ পুনরায় প্রবেশ করুন');
      toast.error('জন্ম নিবন্ধন নাম্বার এবং জন্ম তারিখ পুনরায় দিন');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const captchaResponse = await getCaptchaFromAPI();
      
      if (captchaResponse) {
        setSessionId(captchaResponse.sessionId);
        
        if (captchaResponse.captchaUrl) {
          setCaptchaImage(captchaResponse.captchaUrl);
        } else if (captchaResponse.captcha) {
          setCaptchaImage(captchaResponse.captcha);
        } else if (captchaResponse.image) {
          setCaptchaImage(captchaResponse.image);
        } else if (captchaResponse.captchaBase64) {
          setCaptchaImage(captchaResponse.captchaBase64);
        }
        
        setCaptchaValue('');
        setSuccessMessage('CAPTCHA রিফ্রেশ করা হয়েছে');
        toast.success('CAPTCHA রিফ্রেশ করা হয়েছে');
      }
    } catch (error) {
      console.error('Error refreshing CAPTCHA:', error);
      setError(`CAPTCHA রিফ্রেশ করতে সমস্যা: ${error.message}`);
      toast.error(`CAPTCHA রিফ্রেশ করতে সমস্যা: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Clear form
  const clearForm = () => {
    if (window.confirm('আপনি কি ফর্মটি ক্লিয়ার করতে চান?')) {
      setFormData({
        nameBangla: '',
        nameEnglish: '',
        fatherNameBangla: '',
        fatherNameEnglish: '',
        fatherNationalityBangla: '',
        fatherNationalityEnglish: '',
        motherNameBangla: '',
        motherNameEnglish: '',
        motherNationalityBangla: '',
        motherNationalityEnglish: '',
        birthPlaceBangla: '',
        birthPlaceEnglish: '',
        gender: '',
        birthRegistrationNumber: '',
        dateOfRegistration: '',
        dateOfBirth: '',
        dateOfBirthInWords: '',
        dateOfIssuance: '',
        registerOfficeAddress: '',
        upazilaPourashavaCityCorporationZila: '',
        permanentAddressBangla: '',
        permanentAddressEnglish: '',
        qrLink: '',
        leftBarcode: formData.autoBarcode,
        autoBarcode: formData.autoBarcode
      });
      setBrn('');      // Changed from setUbrn to setBrn
      setDob('');     // Changed from setBirthDate to setDob
      setReceiptId('');
      setSuccessMessage('');
      setError('');
      toast.success('ফর্ম ক্লিয়ার করা হয়েছে');
    }
  };

  // Handle date input with manual typing
  const handleDateInput = (e, setDateFunction) => {
    const value = e.target.value;
    setDateFunction(value);
  };

  // Filter receipts based on search term
  const filteredReceipts = receipts.filter(receipt => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (receipt.receiptId && receipt.receiptId.toLowerCase().includes(term)) ||
      (receipt.birthRegistrationNumber && receipt.birthRegistrationNumber.toLowerCase().includes(term)) ||
      (receipt.nameBangla && receipt.nameBangla.toLowerCase().includes(term)) ||
      (receipt.nameEnglish && receipt.nameEnglish.toLowerCase().includes(term)) ||
      (receipt.fatherNameBangla && receipt.fatherNameBangla.toLowerCase().includes(term)) ||
      (receipt.fatherNameEnglish && receipt.fatherNameEnglish.toLowerCase().includes(term))
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
      const response = await api.delete(`/api/user/users/birth-certificate/${receiptToDelete._id}`);
      
      if (response.data.success) {
        toast.success('জন্ম নিবন্ধন সনদ সফলভাবে ডিলিট করা হয়েছে');
        fetchReceipts();
      } else {
        toast.error(response.data.message || 'জন্ম নিবন্ধন সনদ ডিলিট করতে সমস্যা হয়েছে');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.message || 'জন্ম নিবন্ধন সনদ ডিলিট করতে সমস্যা হয়েছে');
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

  // Action Buttons component for table
  const ActionButtons = ({ receipt }) => (
    <div className="flex justify-center gap-2">
      <button
        onClick={() => navigate(`/auto-services/auto-birth-registration-download/${receipt.receiptId}`)}
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

  // Render error message
  const renderErrorMessage = () => {
    if (!error) return null;

    return (
      <div className={`mb-4 rounded-lg p-4 ${
        isDarkMode 
          ? 'bg-red-900/20 border border-red-800/50 text-red-200' 
          : 'bg-red-50 border border-red-200 text-red-700'
      }`}>
        <div className="flex items-center">
          <AlertCircle className={`mr-2 ${isDarkMode ? 'text-red-400' : 'text-red-500'}`} size={20} />
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  };

  // Render success message
  const renderSuccessMessage = () => {
    if (!successMessage) return null;

    return (
      <div className={`mb-4 rounded-lg p-4 ${
        isDarkMode 
          ? 'bg-green-900/20 border border-green-800/50 text-green-200' 
          : 'bg-green-50 border border-green-200 text-green-700'
      }`}>
        <div className="flex items-center">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center mr-2 ${
            isDarkMode ? 'bg-green-500' : 'bg-green-500'
          }`}>
            <span className="text-white text-xs">✓</span>
          </div>
          <p className="text-sm">{successMessage}</p>
        </div>
      </div>
    );
  };

  // Render CAPTCHA modal
  // Render CAPTCHA modal
  const renderCaptchaModal = () => {
    if (!requiresCaptcha) return null;

    return (
      <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[1000] p-4">
        <div className={`rounded-lg p-6 max-w-md w-full ${
          isDarkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'
        }`}>
          <h3 className="text-xl font-bold mb-4">CAPTCHA যাচাই করুন</h3>
          
          <div className="mb-4">
            <label className={`block text-sm font-medium mb-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              নিচের ছবিতে দেখানো কোডটি লিখুন
            </label>
            
            <div className="flex items-center justify-between mb-3">
              <div className={`p-3 border rounded flex justify-center items-center min-h-[60px] min-w-[200px] ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600' 
                  : 'bg-gray-50 border-gray-300'
              }`}>
                {captchaImage ? (
                  <img 
                    src={captchaImage} 
                    alt="CAPTCHA" 
                    className="max-h-12"
                    onError={(e) => {
                      // Safely handle image loading error
                      const parent = e.target.parentElement;
                      if (parent) {
                        parent.innerHTML = `
                          <div class="text-red-500 text-sm text-center p-2">
                            CAPTCHA লোড করতে সমস্যা<br/>
                            <button 
                              type="button"
                              onclick="window.location.reload()"
                              class="text-teal-500 underline mt-1 cursor-pointer"
                            >
                              পুনরায় চেষ্টা করুন
                            </button>
                          </div>
                        `;
                        
                        // Re-add the click handler
                        setTimeout(() => {
                          const retryBtn = parent.querySelector('button');
                          if (retryBtn) {
                            retryBtn.onclick = () => {
                              handleRefreshCaptcha();
                            };
                          }
                        }, 0);
                      } else {
                        // Fallback if parent is null
                        console.error('CAPTCHA image failed to load');
                      }
                    }}
                  />
                ) : (
                  <div className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>CAPTCHA লোড হচ্ছে...</div>
                )}
              </div>
              <button
                onClick={handleRefreshCaptcha}
                disabled={loading}
                className={`ml-2 p-2 border rounded hover:transition-colors duration-200 ${
                  isDarkMode 
                    ? 'border-gray-600 hover:bg-gray-700 disabled:opacity-50' 
                    : 'border-gray-300 hover:bg-gray-50 disabled:opacity-50'
                }`}
                title="Refresh CAPTCHA"
              >
                <RotateCcw size={20} className={isDarkMode ? 'text-gray-300' : 'text-gray-600'} />
              </button>
            </div>
            
            <input
              type="text"
              value={captchaValue}
              onChange={(e) => setCaptchaValue(e.target.value)}
              className={`w-full border rounded-md px-4 py-2 focus:outline-none focus:ring-2 ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white focus:ring-teal-500'
                  : 'border-gray-300 focus:ring-teal-500'
              }`}
              placeholder="CAPTCHA কোড লিখুন"
              autoFocus
            />
            <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              CAPTCHA কোডটি ছবিতে দেখানো সংখ্যাগুলো লিখুন
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setRequiresCaptcha(false);
                setCaptchaValue('');
                setCaptchaImage('');
                setSessionId('');
                setError('');
              }}
              className={`flex-1 font-semibold py-2 cursor-pointer px-4 rounded-md transition-colors duration-200 ${
                isDarkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                  : 'bg-gray-300 hover:bg-gray-400 text-gray-800'
              }`}
            >
              বাতিল
            </button>
            <button
              onClick={handleVerifyCaptcha}
              disabled={loading}
              className="flex-1 bg-teal-600 hover:bg-teal-700 cursor-pointer text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={20} />
                  প্রক্রিয়াকরণ...
                </>
              ) : (
                'যাচাই করুন'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render download section if receiptId exists
  const renderDownloadSection = () => {
    if (!receiptId) return null;

    return (
      <div className={`mt-6 rounded-lg p-4 ${
        isDarkMode 
          ? 'bg-green-900/20 border border-green-800/50 text-green-200' 
          : 'bg-green-50 border border-green-200 text-green-700'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold">সফলভাবে সংরক্ষণ করা হয়েছে!</h3>
            <p className="text-sm mt-1">
              রসিদ আইডি: <span className="font-bold">{receiptId}</span>
            </p>
            <p className="text-sm">
              সেবা: <span className="font-bold">{serviceName}</span>
            </p>
            <p className="text-sm">
              মূল্য: <span className="font-bold">{servicePrice} টাকা</span>
            </p>
            <p className="text-xs mt-1">
              আপনার ব্যালেন্স থেকে <span className="font-bold">{servicePrice} টাকা</span> কেটে নেওয়া হয়েছে
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                navigate('/certificates');
              }}
              className={`font-semibold py-2 px-4 rounded-md transition-colors duration-200 ${
                isDarkMode
                  ? 'bg-blue-700 hover:bg-blue-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              সব সনদ দেখুন
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render QR Code preview
  const renderQRPreview = () => {
    if (!formData.qrLink) return null;

    return (
      <div className={`mt-4 p-4 border rounded-lg ${
        isDarkMode 
          ? 'bg-gray-800/50 border-gray-700 text-gray-200' 
          : 'bg-white border-gray-300 text-gray-600'
      }`}>
        <h4 className={`text-sm font-bold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          QR Code Preview:
        </h4>
        <div className="flex items-center gap-4">
          <div className={`p-2 border rounded ${
            isDarkMode ? 'border-gray-600 bg-gray-900/30' : 'border-gray-200'
          }`}>
            <QRCodeSVG 
              value={formData.qrLink} 
              size={80}
              level="H"
              includeMargin={true}
              bgColor={isDarkMode ? '#1f2937' : '#ffffff'}
              fgColor={isDarkMode ? '#10b981' : '#000000'}
            />
          </div>
          <div className="text-xs">
            <p>এই QR কোডটি স্ক্যান করলে যাচাই পৃষ্ঠায় যাওয়া যাবে</p>
            <p className={`mt-1 break-all text-[10px] ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {formData.qrLink}
            </p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(formData.qrLink);
                toast.success('QR লিঙ্ক কপি করা হয়েছে!');
              }}
              className={`mt-2 text-xs ${
                isDarkMode 
                  ? 'text-blue-400 hover:text-blue-300' 
                  : 'text-blue-600 hover:text-blue-800'
              }`}
            >
              লিঙ্ক কপি করুন
            </button>
          </div>
        </div>
      </div>
    );
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
      
      <div className={`font-anek lg:ml-72 mt-[9vh] min-h-screen transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-900 text-gray-100' : 'text-gray-700'
      }`}>
        <Header toggleSidebar={toggleSidebar} />
        <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />

        <main className={`min-h-[91vh] p-4 md:p-6 ${
          isDarkMode ? 'bg-gray-900' : 'bg-[#f4f6f9]'
        }`}>
          
          <div className="mb-3">
            <h1 className={`text-lg md:text-[23px] font-bold mb-1 ${
              isDarkMode ? 'text-theme_color' : 'text-theme_color'
            }`}>
              {serviceName}
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
                isDarkMode ? 'bg-theme_color' : 'bg-theme_color'
              }`}>
                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="w-full mx-auto">
            {renderErrorMessage()}
            {renderSuccessMessage()}

            {/* 1. Auto Load Section */}
            <div className="mb-8 shadow-sm rounded-lg overflow-hidden">
              <div className={`py-2.5 px-4 ${
                isDarkMode ? 'bg-green-900/50' : 'bg-theme_color'
              }`}>
                <h2 className={`text-center font-bold text-lg ${
                  isDarkMode ? 'text-theme_color' : 'text-white'
                }`}>
                  জন্ম নিবন্ধন তথ্য
                </h2>
              </div>
              <div className={`p-6 border border-t-0 rounded-b-lg ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-200'
              }`}>
                <label className={`text-xs font-bold block mb-1 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  জন্ম নিবন্ধন নাম্বার
                </label>
                <div className="flex flex-col gap-3">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <div className={`w-4 h-4 rounded-sm ${
                        isDarkMode ? 'bg-theme_color' : 'bg-theme_color'
                      }`}></div>
                    </div>
                    <input 
                      type="text" 
                      value={brn}  // Changed from ubrn to brn
                      onChange={(e) => setBrn(e.target.value)}  // Changed from setUbrn to setBrn
                      className={`w-full border rounded-md py-2.5 pl-10 pr-3 focus:outline-none focus:ring-1 text-sm ${
                        isDarkMode
                          ? 'bg-gray-700 border-gray-600 text-white focus:ring-green-500'
                          : 'bg-white border-gray-300 focus:ring-[#1abc9c]'
                      }`}
                      placeholder="01234567890123456"
                      maxLength="17"
                      pattern="\d*"
                      inputMode="numeric"
                    />
                  </div>
                  
                  <label className={`text-xs font-bold block mb-1 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    জন্ম তারিখ
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <div className={`w-4 h-4 rounded-sm ${
                        isDarkMode ? 'bg-theme_color' : 'bg-theme_color'
                      }`}></div>
                    </div>
                    <input 
                      type="text" 
                      value={dob}  // Changed from birthDate to dob
                      onChange={(e) => handleDateInput(e, setDob)}  // Changed from setBirthDate to setDob
                      className={`w-full border rounded-md py-2.5 pl-10 pr-3 focus:outline-none focus:ring-1 text-sm ${
                        isDarkMode
                          ? 'bg-gray-700 border-gray-600 text-white focus:ring-green-500'
                          : 'bg-white border-gray-300 focus:ring-[#1abc9c]'
                      }`}
                      placeholder="DD-MM-YYYY বা YYYY-MM-DD"
                      maxLength="10"
                    />
                  </div>
                  
                  <p className={`text-[11px] font-bold ${
                    isDarkMode ? 'text-theme_color' : 'text-theme_color'
                  }`}>
                    আপনার জন্ম নিবন্ধন নাম্বার এবং জন্ম তারিখ লিখুন (DD-MM-YYYY বা YYYY-MM-DD ফরম্যাটে)
                  </p>
                  <button 
                    onClick={handleAutoLoad}
                    disabled={loading}
                    className={`w-full text-white font-bold py-3 rounded-full transition-all text-sm uppercase shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center ${
                      isDarkMode
                        ? 'bg-theme_color'
                        : 'bg-theme_color'
                    }`}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin mr-2" size={20} />
                        প্রক্রিয়াকরণ...
                      </>
                    ) : (
                      'অটো লোড'
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Main Form Details */}
            <div className={`border rounded-lg shadow-sm p-6 md:p-8 mb-8 ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                
                {/* Left Column */}
                <div className="space-y-4">
                  <InputField 
                    label="Register Office Address" 
                    value={formData.registerOfficeAddress}
                    onChange={(e) => handleInputChange('registerOfficeAddress', e.target.value)}
                    placeholder="রেজিস্টার অফিসের ঠিকানা" 
                    required 
                    isDarkMode={isDarkMode}
                  />
                  <InputField 
                    label="Birth Registration Number" 
                    value={formData.birthRegistrationNumber}
                    onChange={(e) => handleInputChange('birthRegistrationNumber', e.target.value)}
                    placeholder="XXXXXXXXXXXXXXXXX" 
                    required 
                    isDarkMode={isDarkMode}
                  />
                  <InputField 
                    label="Date of Registration" 
                    value={formData.dateOfRegistration}
                    onChange={(e) => handleInputChange('dateOfRegistration', e.target.value)}
                    placeholder="YYYY-MM-DD" 
                    type="text"
                    required 
                    isDarkMode={isDarkMode}
                  />
                  <InputField 
                    label="Date of Birth" 
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    placeholder="YYYY-MM-DD" 
                    type="text"
                    required 
                    isDarkMode={isDarkMode}
                  />
                  
                  <div className="flex flex-col">
                    <label className={`text-[13px] font-bold mb-1 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Left Bar Code <span className="text-red-500">*</span>
                      {formData.autoBarcode && (
                        <span className={`text-xs ml-2 ${
                          isDarkMode ? 'text-green-400' : 'text-green-600'
                        }`}>
                          (Auto-generated)
                        </span>
                      )}
                    </label>
                    <div className="flex gap-1">
                      <input 
                        className={`flex-1 border rounded-sm px-3 py-2 text-sm focus:outline-none ${
                          isDarkMode
                            ? 'bg-gray-700 border-gray-600 text-white focus:border-green-500'
                            : 'bg-white border-gray-300 focus:border-[#1abc9c]'
                        }`} 
                        value={formData.leftBarcode}
                        onChange={(e) => handleInputChange('leftBarcode', e.target.value)}
                        placeholder="XXXXX" 
                        maxLength="5"
                        pattern="\d*"
                        inputMode="numeric"
                      />
                      <button 
                        onClick={generateBarcode}
                        className={`border p-2 rounded transition-colors duration-200 ${
                          isDarkMode
                            ? 'bg-gray-700 border-green-500 text-green-400 hover:bg-gray-600'
                            : 'bg-white border-[#1abc9c] text-[#1abc9c] hover:bg-teal-50'
                        }`}
                        title="Generate new barcode"
                      >
                        <RotateCcw size={18} />
                      </button>
                    </div>
                  </div>

                  <InputField 
                    label="নাম" 
                    value={formData.nameBangla}
                    onChange={(e) => handleInputChange('nameBangla', e.target.value)}
                    placeholder="সম্পূর্ণ নাম বাংলায়" 
                    required 
                    isDarkMode={isDarkMode}
                  />
                  <InputField 
                    label="পিতার নাম" 
                    value={formData.fatherNameBangla}
                    onChange={(e) => handleInputChange('fatherNameBangla', e.target.value)}
                    placeholder="পিতার নাম বাংলায়" 
                    required 
                    isDarkMode={isDarkMode}
                  />
                  <InputField 
                    label="পিতার জাতীয়তা" 
                    value={formData.fatherNationalityBangla}
                    onChange={(e) => handleInputChange('fatherNationalityBangla', e.target.value)}
                    placeholder="পিতার জাতীয়তা বাংলায়" 
                    required 
                    isDarkMode={isDarkMode}
                  />
                  <InputField 
                    label="মাতার নাম" 
                    value={formData.motherNameBangla}
                    onChange={(e) => handleInputChange('motherNameBangla', e.target.value)}
                    placeholder="মাতার নাম বাংলায়" 
                    required 
                    isDarkMode={isDarkMode}
                  />
                  <InputField 
                    label="মাতার জাতীয়তা" 
                    value={formData.motherNationalityBangla}
                    onChange={(e) => handleInputChange('motherNationalityBangla', e.target.value)}
                    placeholder="মাতার জাতীয়তা বাংলায়" 
                    required 
                    isDarkMode={isDarkMode}
                  />
                  <InputField 
                    label="জন্মস্থান" 
                    value={formData.birthPlaceBangla}
                    onChange={(e) => handleInputChange('birthPlaceBangla', e.target.value)}
                    placeholder="জন্মস্থান বাংলায়" 
                    required 
                    isDarkMode={isDarkMode}
                  />
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <InputField 
                    label="Upazila/Pourashava/City Corporation, Zila" 
                    value={formData.upazilaPourashavaCityCorporationZila}
                    onChange={(e) => handleInputChange('upazilaPourashavaCityCorporationZila', e.target.value)}
                    placeholder="উপজেলা/পৌরসভা/সিটি কর্পোরেশন, জেলা" 
                    required 
                    isDarkMode={isDarkMode}
                  />
                  
                  <div className="flex flex-col">
                    <label className={`text-[13px] font-bold mb-1 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Gender <span className="text-red-500">*</span>
                    </label>
                    <select 
                      className={`border rounded-sm px-3 py-2 text-sm focus:outline-none ${
                        isDarkMode
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-green-500'
                          : 'bg-white border-gray-300 focus:border-[#1abc9c]'
                      }`}
                      value={formData.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                    >
                      <option value="">Select</option>
                      <option value="পুরুষ">পুরুষ</option>
                      <option value="মহিলা">মহিলা</option>
                    </select>
                  </div>

                  <InputField 
                    label="Date of Issuance" 
                    value={formData.dateOfIssuance}
                    onChange={(e) => handleInputChange('dateOfIssuance', e.target.value)}
                    placeholder="YYYY-MM-DD" 
                    type="text"
                    required 
                    isDarkMode={isDarkMode}
                  />
                  <InputField 
                    label="Date of Birth in Word (Optional)" 
                    value={formData.dateOfBirthInWords}
                    onChange={(e) => handleInputChange('dateOfBirthInWords', e.target.value)}
                    placeholder="Eleventh August two thousand three" 
                    isDarkMode={isDarkMode}
                  />
                  <InputField 
                    label="QR Link" 
                    value={formData.qrLink}
                    onChange={(e) => handleInputChange('qrLink', e.target.value)}
                    placeholder="https://bdris.gov.bd/certificate/verify?key=..." 
                    required 
                    isDarkMode={isDarkMode}
                  />
                  <InputField 
                    label="Name" 
                    value={formData.nameEnglish}
                    onChange={(e) => handleInputChange('nameEnglish', e.target.value)}
                    placeholder="Full Name in English" 
                    required 
                    isDarkMode={isDarkMode}
                  />
                  <InputField 
                    label="Father Name" 
                    value={formData.fatherNameEnglish}
                    onChange={(e) => handleInputChange('fatherNameEnglish', e.target.value)}
                    placeholder="Father Name in English" 
                    required 
                    isDarkMode={isDarkMode}
                  />
                  <InputField 
                    label="Father Nationality" 
                    value={formData.fatherNationalityEnglish}
                    onChange={(e) => handleInputChange('fatherNationalityEnglish', e.target.value)}
                    placeholder="Father Nationality in English" 
                    required 
                    isDarkMode={isDarkMode}
                  />
                  <InputField 
                    label="Mother Name" 
                    value={formData.motherNameEnglish}
                    onChange={(e) => handleInputChange('motherNameEnglish', e.target.value)}
                    placeholder="Mother Name in English" 
                    required 
                    isDarkMode={isDarkMode}
                  />
                  <InputField 
                    label="Mother Nationality" 
                    value={formData.motherNationalityEnglish}
                    onChange={(e) => handleInputChange('motherNationalityEnglish', e.target.value)}
                    placeholder="Mother Nationality in English" 
                    required 
                    isDarkMode={isDarkMode}
                  />
                  <InputField 
                    label="Place of Birth" 
                    value={formData.birthPlaceEnglish}
                    onChange={(e) => handleInputChange('birthPlaceEnglish', e.target.value)}
                    placeholder="Place of Birth in English" 
                    required 
                    isDarkMode={isDarkMode}
                  />
                </div>
              </div>

              {/* Address Textareas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                <div className="flex flex-col">
                  <label className={`text-[13px] font-bold mb-1 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    স্থায়ী ঠিকানা <span className="text-red-500">*</span>
                  </label>
                  <textarea 
                    className={`w-full border rounded-sm px-3 py-2 text-sm min-h-[100px] focus:outline-none ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-green-500'
                        : 'bg-white border-gray-300 focus:border-[#1abc9c]'
                    }`} 
                    placeholder="স্থায়ী ঠিকানা বাংলায়"
                    value={formData.permanentAddressBangla}
                    onChange={(e) => handleInputChange('permanentAddressBangla', e.target.value)}
                  ></textarea>
                </div>
                <div className="flex flex-col">
                  <label className={`text-[13px] font-bold mb-1 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Permanent Address <span className="text-red-500">*</span>
                  </label>
                  <textarea 
                    className={`w-full border rounded-sm px-3 py-2 text-sm min-h-[100px] focus:outline-none ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-green-500'
                        : 'bg-white border-gray-300 focus:border-[#1abc9c]'
                    }`} 
                    placeholder="Permanent Address in English"
                    value={formData.permanentAddressEnglish}
                    onChange={(e) => handleInputChange('permanentAddressEnglish', e.target.value)}
                  ></textarea>
                </div>
              </div>

              {/* QR Code Preview */}
              {renderQRPreview()}

              {/* Payment Notification */}
              <div className={`mt-6 mb-6 p-4 border rounded-md flex justify-start items-start gap-3 ${
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

              {/* Download Section */}
              {renderDownloadSection()}

              {/* Action Buttons */}
              <div className="flex gap-4 mt-6">
                <button 
                  onClick={handleSaveAndDownload}
                  disabled={saving}
                  className={`flex-1 text-white flex gap-2 font-bold py-4 rounded shadow-md transition-all text-sm uppercase disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center ${
                    isDarkMode
                      ? 'bg-theme_color'
                      : 'bg-theme_color'
                  }`}
                >
                  {saving ? (
                    <>
                     <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    ডাউনলোড করা হচ্ছে...
                  </>
                ) : (
                  <>
                    <Save size={20} /> সংরক্ষণ ও ডাউনলোড ({servicePrice} টাকা)
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 3. Previous Birth Certificates Table */}
            <div className={`mt-12 border rounded-lg shadow-sm p-6 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="flex justify-between items-center mb-6">
                <h2 className={`text-lg md:text-xl font-bold ${isDarkMode ? 'text-green-400' : 'text-[#1abc9c]'}`}>
                  পূর্ববর্তী জন্ম নিবন্ধন সনদ তালিকা
                </h2>
                
                {/* Search Bar */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="জন্ম নিবন্ধন সনদ খুঁজুন..."
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
                {listLoading ? (
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
                          জন্ম তারিখ
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
                          <td colSpan="6" className="p-8 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <FileText className={isDarkMode ? 'text-gray-600' : 'text-gray-400'} size={48} />
                              <p className={`font-medium mb-2 transition-colors duration-300 ${
                                isDarkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                কোন জন্ম নিবন্ধন সনদ পাওয়া যায়নি
                              </p>
                              <p className={`text-sm max-w-md transition-colors duration-300 ${
                                isDarkMode ? 'text-gray-500' : 'text-gray-500'
                              }`}>
                                {searchTerm 
                                  ? 'আপনার সার্চের সাথে মিলছে এমন কোনো জন্ম নিবন্ধন সনদ নেই / No birth certificates match your search'
                                  : 'আপনার প্রথম জন্ম নিবন্ধন সনদ এখনই তৈরি করুন! / Create your first birth certificate now!'
                                }
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
                            <td className={`p-3 text-sm border-r transition-colors duration-300 ${
                              isDarkMode
                                ? 'text-gray-200 border-gray-700'
                                : 'text-gray-800 border-gray-200'
                            }`}>
                              {receipt.birthRegistrationNumber || 'N/A'}
                            </td>
                            <td className={`p-3 text-sm border-r transition-colors duration-300 ${
                              isDarkMode
                                ? 'text-gray-200 border-gray-700'
                                : 'text-gray-800 border-gray-200'
                            }`}>
                              {receipt.nameBangla || receipt.nameEnglish || 'N/A'}
                            </td>
                            <td className={`p-3 text-sm border-r transition-colors duration-300 ${
                              isDarkMode
                                ? 'text-gray-200 border-gray-700'
                                : 'text-gray-800 border-gray-200'
                            }`}>
                              {receipt.fatherNameBangla || receipt.fatherNameEnglish || 'N/A'}
                            </td>
                            <td className={`p-3 text-sm text-nowrap border-r transition-colors duration-300 ${
                              isDarkMode
                                ? 'text-gray-400 border-gray-700'
                                : 'text-gray-600 border-gray-200'
                            }`}>
                              <div className="flex items-center justify-center gap-1">
                                <Calendar size={12} />
                                {receipt.dateOfBirth}
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
                    </span> থেকে {' '}
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

        {/* CAPTCHA Modal */}
        {renderCaptchaModal()}

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
                  জন্ম নিবন্ধন সনদ ডিলিট করুন
                </h3>
                
                <p className={`text-xs mb-3 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  আপনি কি নিশ্চিত যে আপনি এই জন্ম নিবন্ধন সনদটি ডিলিট করতে চান?
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
                        {receiptToDelete.birthRegistrationNumber}
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
                        {receiptToDelete.nameBangla || receiptToDelete.nameEnglish}
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
                        {receiptToDelete.fatherNameBangla || receiptToDelete.fatherNameEnglish}
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
      </div>
    </>
  );
}

// Reusable Input Component
function InputField({ label, value, onChange, placeholder, required = false, type = 'text', isDarkMode }) {
  return (
    <div className="flex flex-col">
      <label className={`text-[13px] font-bold mb-1 ${
        isDarkMode ? 'text-gray-300' : 'text-gray-700'
      }`}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input 
        type={type}
        className={`border rounded-sm px-3 py-2.5 text-sm focus:outline-none transition-colors duration-300 ${
          isDarkMode
            ? 'bg-gray-700 border-gray-600 text-white placeholder:text-gray-700 focus:border-green-500'
            : 'border-gray-300 placeholder:text-gray-600 bg-white focus:border-[#1abc9c]'
        }`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

export default Birthcertificate;