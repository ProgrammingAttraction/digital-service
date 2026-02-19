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

function Surokkhaclone() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [certificateId, setCertificateId] = useState('');
  const { isDarkMode } = useTheme();
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user?.id;

  // State for certificate list
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  
  // Service price state
  const [servicePrice, setServicePrice] = useState(150); // Default 150 BDT

  // Success popup state
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [orderSuccessData, setOrderSuccessData] = useState(null);

  // Delete confirmation popup state
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [certificateToDelete, setCertificateToDelete] = useState(null);

  // Vaccine options
  const vaccineOptions = [
    'Pfizer (Pfizer-BioNTech)',
    'AstraZeneca',
    'Sinopharm',
    'Moderna',
    'Sinovac',
    'Covishield',
    'Sputnik V',
    'Johnson & Johnson',
    'Novavax',
    'Other'
  ];

  // State for Surokkha Form Data
  const [formData, setFormData] = useState({
    certificateNo: generateCertificateNumber(),
    name: '',
    nationality: 'Bangladeshi',
    gender: 'Male',
    nationalId: 'N/A',
    birthNo: 'N/A',
    passportNo: '',
    dateOfBirth: '',
    vaccinatedBy: 'Directorate General of Health Services (DGHS)',
    dose1Date: '',
    dose1VaccineName: '',
    dose1OtherVaccine: '',
    dose2Date: '',
    dose2VaccineName: '',
    dose2OtherVaccine: '',
    dose3Date: '',
    dose3VaccineName: '',
    dose3OtherVaccine: '',
    vaccinationCenter: 'Dhaka Medical College Hospital',
    totalDoses: '3'
  });

  // Function to generate certificate number
  function generateCertificateNumber() {
    const prefix = 'BD';
    const numbers = Math.floor(100000000000000 + Math.random() * 900000000000000);
    return `${prefix}${numbers}`;
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

  // Fetch service price
  const fetchServicePrice = async () => {
    try {
      const response = await api.get('/api/user/service/price/surokkha-certificate');
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
    fetchCertificates();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // If "Other" is selected, clear the other vaccine field
    if (value !== 'Other') {
      if (name === 'dose1VaccineName') {
        setFormData(prev => ({ ...prev, dose1OtherVaccine: '' }));
      } else if (name === 'dose2VaccineName') {
        setFormData(prev => ({ ...prev, dose2OtherVaccine: '' }));
      } else if (name === 'dose3VaccineName') {
        setFormData(prev => ({ ...prev, dose3OtherVaccine: '' }));
      }
    }
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  // Fetch certificates list
  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/user/surokkha-certificate/all');
      if (response.data.success) {
        setCertificates(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching certificates:', error);
      toast.error('সুরক্ষা সার্টিফিকেট তালিকা লোড করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  // Filter certificates based on search term
  const filteredCertificates = certificates.filter(certificate => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (certificate.certificateId && certificate.certificateId.toLowerCase().includes(term)) ||
      (certificate.certificateNo && certificate.certificateNo.toLowerCase().includes(term)) ||
      (certificate.name && certificate.name.toLowerCase().includes(term)) ||
      (certificate.passportNo && certificate.passportNo.toLowerCase().includes(term)) ||
      (certificate.nationalId && certificate.nationalId.toLowerCase().includes(term))
    );
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredCertificates.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCertificates = filteredCertificates.slice(startIndex, endIndex);

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
  const confirmDeleteCertificate = (certificate) => {
    setCertificateToDelete(certificate);
    setShowDeletePopup(true);
  };

  // Delete certificate
  const deleteCertificate = async () => {
    if (!certificateToDelete) return;

    try {
      setDeletingId(certificateToDelete._id);
      const response = await api.delete(`/api/user/surokkha-certificate/${certificateToDelete._id}`);
      
      if (response.data.success) {
        toast.success('সুরক্ষা সার্টিফিকেট সফলভাবে ডিলিট করা হয়েছে');
        // Refresh certificates list
        fetchCertificates();
        // If the deleted certificate is the currently displayed one, clear it
        if (certificateId === certificateToDelete._id) {
          setCertificateId('');
          setSaveSuccess(false);
        }
      } else {
        toast.error(response.data.message || 'সুরক্ষা সার্টিফিকেট ডিলিট করতে সমস্যা হয়েছে');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.message || 'সুরক্ষা সার্টিফিকেট ডিলিট করতে সমস্যা হয়েছে');
    } finally {
      setDeletingId(null);
      setShowDeletePopup(false);
      setCertificateToDelete(null);
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setShowDeletePopup(false);
    setCertificateToDelete(null);
  };

  // Deduct balance from user account
  const deductBalance = async () => {
    try {
      const response = await api.post('/api/user/balance/deduct', {
        amount: servicePrice, // Use dynamic service price
        service: 'সুরক্ষা ভ্যাকসিন সার্টিফিকেট',
        reference: `SUR_${Date.now()}`,
        description: `সুরক্ষা ভ্যাকসিন সার্টিফিকেট তৈরি - সার্টিফিকেট নং: ${formData.certificateNo}`
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

  // Save Surokkha Certificate Function
  const saveSurokkhaCertificate = async () => {
    try {
      setIsSaving(true);
      setSaveSuccess(false);

      // Validate required fields
      const requiredFields = [
        'name', 'gender', 'dateOfBirth', 'dose1Date',
        'dose1VaccineName', 'dose2Date', 'dose2VaccineName',
        'vaccinationCenter', 'totalDoses'
      ];

      for (const field of requiredFields) {
        if (!formData[field] || formData[field].trim() === '') {
          toast.error(`${field} ফিল্ডটি পূরণ করুন`);
          setIsSaving(false);
          return;
        }
      }

      // Check if "Other" vaccine is selected but no other vaccine name provided
      if (formData.dose1VaccineName === 'Other' && !formData.dose1OtherVaccine.trim()) {
        toast.error('ডোজ ১ এর ভ্যাকসিন নাম লিখুন');
        setIsSaving(false);
        return;
      }

      if (formData.dose2VaccineName === 'Other' && !formData.dose2OtherVaccine.trim()) {
        toast.error('ডোজ ২ এর ভ্যাকসিন নাম লিখুন');
        setIsSaving(false);
        return;
      }

      if (formData.dose3VaccineName === 'Other' && !formData.dose3OtherVaccine.trim()) {
        toast.error('ডোজ ৩ এর ভ্যাকসিন নাম লিখুন');
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
        certificateNo: formData.certificateNo || generateCertificateNumber(),
        name: formData.name,
        nationality: formData.nationality || 'Bangladeshi',
        gender: formData.gender,
        nationalId: formData.nationalId || 'N/A',
        birthNo: formData.birthNo || 'N/A',
        passportNo: formData.passportNo || 'N/A',
        dateOfBirth: formData.dateOfBirth,
        vaccinatedBy: formData.vaccinatedBy || 'Directorate General of Health Services (DGHS)',
        dose1Date: formData.dose1Date,
        dose1VaccineName: formData.dose1VaccineName,
        dose1OtherVaccine: formData.dose1OtherVaccine || '',
        dose2Date: formData.dose2Date,
        dose2VaccineName: formData.dose2VaccineName,
        dose2OtherVaccine: formData.dose2OtherVaccine || '',
        dose3Date: formData.dose3Date || '',
        dose3VaccineName: formData.dose3VaccineName || '',
        dose3OtherVaccine: formData.dose3OtherVaccine || '',
        vaccinationCenter: formData.vaccinationCenter,
        totalDoses: formData.totalDoses,
        transactionId: deductionResult.data?.transactionId || null
      };

      const response = await api.post(`${base_url}/api/user/surokkha-certificate/save`, payload);
      
      if (response.data.success) {
        const savedCertificateId = response.data.data.certificateId;
        setCertificateId(savedCertificateId);
        setSaveSuccess(true);
        
        // Update user balance in localStorage
        if (deductionResult.data?.newBalance !== undefined) {
          const userData = JSON.parse(localStorage.getItem('user'));
          userData.balance = deductionResult.data.newBalance;
          localStorage.setItem('user', JSON.stringify(userData));
        }
        
        // Refresh certificates list
        fetchCertificates();
        toast.success("সুরক্ষা সার্টিফিকেট অর্ডার সফল হয়েছে!")
        setTimeout(() => {
          navigate(`/clone-services/surokkha-clone-download/${savedCertificateId}`);
        }, 500);
      } else {
        toast.error(response.data.message || 'সুরক্ষা সার্টিফিকেট সংরক্ষণ ব্যর্থ হয়েছে');
      }
    } catch (error) {
      console.error('Save error:', error);
      if (error.response) {
        toast.error(error.response.data.message || 'সুরক্ষা সার্টিফিকেট সংরক্ষণ করতে সমস্যা হয়েছে');
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
        name: '',
        nationality: 'Bangladeshi',
        gender: 'Male',
        nationalId: 'N/A',
        birthNo: 'N/A',
        passportNo: '',
        dateOfBirth: '',
        vaccinatedBy: 'Directorate General of Health Services (DGHS)',
        dose1Date: '',
        dose1VaccineName: '',
        dose1OtherVaccine: '',
        dose2Date: '',
        dose2VaccineName: '',
        dose2OtherVaccine: '',
        dose3Date: '',
        dose3VaccineName: '',
        dose3OtherVaccine: '',
        vaccinationCenter: 'Dhaka Medical College Hospital',
        totalDoses: '3'
      });
      setCertificateId('');
      setSaveSuccess(false);
      toast.success('ফর্ম ক্লিয়ার করা হয়েছে');
    }
  };

  // Action Buttons component for table
  const ActionButtons = ({ certificate }) => (
    <div className="flex justify-center gap-2">
      <button
        onClick={() => navigate(`/clone-services/surokkha-clone-download/${certificate.certificateId}`)}
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
          <Trash2 size={16} />
        )}
      </button>
    </div>
  );

  // Navigate to download after success
  const handleSuccessContinue = () => {
    if (orderSuccessData?.orderId) {
      navigate(`/clone-services/suraksha-clone-download/${orderSuccessData.orderId}`);
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
      const response = await axios.get(`${base_url}/api/user/service/notice/surokkha-clone`);
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
              সুরক্ষা ভ্যাকসিন সার্টিফিকেট
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
              {/* Left Column: Beneficiary Information */}
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold pb-1 mb-1">বেনিফিশিয়ার তথ্য:</h3>
                  </div>
                  
                  {/* Certificate No Field with Generate Button */}
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <label className={`text-[15px] font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Certificate No *
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
                      placeholder="Certificate No"
                      required
                    />
                  </div>

                  <InputField 
                    label="Name *" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleInputChange} 
                    isDarkMode={isDarkMode} 
                    placeholder="Enter Full Name"
                    required
                  />
                  
                  <InputField 
                    label="National ID" 
                    name="nationalId" 
                    value={formData.nationalId} 
                    onChange={handleInputChange} 
                    isDarkMode={isDarkMode} 
                    placeholder="N/A"
                  />
                  
                  <InputField 
                    label="Birth No" 
                    name="birthNo" 
                    value={formData.birthNo} 
                    onChange={handleInputChange} 
                    isDarkMode={isDarkMode} 
                    placeholder="N/A"
                  />
                  
                  <InputField 
                    label="Passport No" 
                    name="passportNo" 
                    value={formData.passportNo} 
                    onChange={handleInputChange} 
                    isDarkMode={isDarkMode} 
                    placeholder="Passport Number"
                  />
                  
                  {/* Date of Birth as text input */}
                  <InputField 
                    label="Date of Birth *" 
                    name="dateOfBirth" 
                    value={formData.dateOfBirth} 
                    onChange={handleInputChange} 
                    isDarkMode={isDarkMode} 
                    placeholder="YYYY-MM-DD or any date format"
                    required
                  />
                  
                  {/* Gender Select */}
                  <div className="flex flex-col">
                    <label className={`text-[15px] font-semibold mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Gender *
                    </label>
                    <select 
                      name="gender"
                      value={formData.gender}
                      onChange={(e) => handleSelectChange('gender', e.target.value)}
                      className={`border rounded-md text-sm md:text-[15px] px-4 py-2 focus:outline-none focus:ring-2 ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white focus:ring-green-500 focus:ring-offset-gray-800' 
                          : 'bg-white border-gray-300 focus:ring-green-500 focus:ring-offset-white'
                      }`}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Nationality Select */}
                  <div className="flex flex-col">
                    <label className={`text-[15px] font-semibold mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Nationality
                    </label>
                    <select 
                      name="nationality"
                      value={formData.nationality}
                      onChange={(e) => handleSelectChange('nationality', e.target.value)}
                      className={`border rounded-md text-sm md:text-[15px] px-4 py-2 focus:outline-none focus:ring-2 ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white focus:ring-green-500 focus:ring-offset-gray-800' 
                          : 'bg-white border-gray-300 focus:ring-green-500 focus:ring-offset-white'
                      }`}
                    >
                      <option value="Bangladeshi">Bangladeshi</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <InputField 
                    label="Vaccinated By" 
                    name="vaccinatedBy" 
                    value={formData.vaccinatedBy} 
                    onChange={handleInputChange} 
                    isDarkMode={isDarkMode} 
                    placeholder="Directorate General of Health Services (DGHS)"
                  />
                </div>
              </div>

              {/* Right Column: Vaccination Details */}
              <div className="space-y-4">
                <div className="space-y-3">
                  <h3 className="font-bold pb-1 mb-4">ভ্যাকসিনেশন তথ্য:</h3>
                  
                  {/* Dose 1 */}
                  <div className="space-y-3">
                    <h4 className={`text-sm font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      ডোজ ১:
                    </h4>
                    
                    {/* Dose 1 Date as text input */}
                    <InputField 
                      label="Date of Vaccination *" 
                      name="dose1Date" 
                      value={formData.dose1Date} 
                      onChange={handleInputChange} 
                      isDarkMode={isDarkMode} 
                      placeholder="YYYY-MM-DD or any date format"
                      required
                    />
                    
                    {/* Vaccine Name Select for Dose 1 */}
                    <div className="flex flex-col">
                      <label className={`text-[15px] font-semibold mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Name of Vaccine *
                      </label>
                      <select 
                        name="dose1VaccineName"
                        value={formData.dose1VaccineName}
                        onChange={(e) => handleSelectChange('dose1VaccineName', e.target.value)}
                        className={`border rounded-md text-sm md:text-[15px] px-4 py-2 focus:outline-none focus:ring-2 ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white focus:ring-green-500 focus:ring-offset-gray-800' 
                            : 'bg-white border-gray-300 focus:ring-green-500 focus:ring-offset-white'
                        }`}
                      >
                        <option value="">Select Vaccine</option>
                        {vaccineOptions.map((vaccine, index) => (
                          <option key={index} value={vaccine}>{vaccine}</option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Other Vaccine Name for Dose 1 */}
                    {formData.dose1VaccineName === 'Other' && (
                      <InputField 
                        label="Other Vaccine Name *" 
                        name="dose1OtherVaccine" 
                        value={formData.dose1OtherVaccine} 
                        onChange={handleInputChange} 
                        isDarkMode={isDarkMode} 
                        placeholder="Enter vaccine name"
                        required
                      />
                    )}
                  </div>
                  
                  {/* Dose 2 */}
                  <div className="space-y-3">
                    <h4 className={`text-sm font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      ডোজ ২:
                    </h4>
                    
                    {/* Dose 2 Date as text input */}
                    <InputField 
                      label="Date of Vaccination *" 
                      name="dose2Date" 
                      value={formData.dose2Date} 
                      onChange={handleInputChange} 
                      isDarkMode={isDarkMode} 
                      placeholder="YYYY-MM-DD or any date format"
                      required
                    />
                    
                    {/* Vaccine Name Select for Dose 2 */}
                    <div className="flex flex-col">
                      <label className={`text-[15px] font-semibold mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Name of Vaccine *
                      </label>
                      <select 
                        name="dose2VaccineName"
                        value={formData.dose2VaccineName}
                        onChange={(e) => handleSelectChange('dose2VaccineName', e.target.value)}
                        className={`border rounded-md text-sm md:text-[15px] px-4 py-2 focus:outline-none focus:ring-2 ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white focus:ring-green-500 focus:ring-offset-gray-800' 
                            : 'bg-white border-gray-300 focus:ring-green-500 focus:ring-offset-white'
                        }`}
                      >
                        <option value="">Select Vaccine</option>
                        {vaccineOptions.map((vaccine, index) => (
                          <option key={index} value={vaccine}>{vaccine}</option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Other Vaccine Name for Dose 2 */}
                    {formData.dose2VaccineName === 'Other' && (
                      <InputField 
                        label="Other Vaccine Name *" 
                        name="dose2OtherVaccine" 
                        value={formData.dose2OtherVaccine} 
                        onChange={handleInputChange} 
                        isDarkMode={isDarkMode} 
                        placeholder="Enter vaccine name"
                        required
                      />
                    )}
                  </div>
                  
                  {/* Dose 3 */}
                  <div className="space-y-3">
                    <h4 className={`text-sm font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      ডোজ ৩:
                    </h4>
                    
                    {/* Dose 3 Date as text input */}
                    <InputField 
                      label="Date of Vaccination" 
                      name="dose3Date" 
                      value={formData.dose3Date} 
                      onChange={handleInputChange} 
                      isDarkMode={isDarkMode} 
                      placeholder="YYYY-MM-DD or any date format"
                    />
                    
                    {/* Vaccine Name Select for Dose 3 */}
                    <div className="flex flex-col">
                      <label className={`text-[15px] font-semibold mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Name of Vaccine
                      </label>
                      <select 
                        name="dose3VaccineName"
                        value={formData.dose3VaccineName}
                        onChange={(e) => handleSelectChange('dose3VaccineName', e.target.value)}
                        className={`border rounded-md text-sm md:text-[15px] px-4 py-2 focus:outline-none focus:ring-2 ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white focus:ring-green-500 focus:ring-offset-gray-800' 
                            : 'bg-white border-gray-300 focus:ring-green-500 focus:ring-offset-white'
                        }`}
                      >
                        <option value="">Select Vaccine</option>
                        {vaccineOptions.map((vaccine, index) => (
                          <option key={index} value={vaccine}>{vaccine}</option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Other Vaccine Name for Dose 3 */}
                    {formData.dose3VaccineName === 'Other' && (
                      <InputField 
                        label="Other Vaccine Name *" 
                        name="dose3OtherVaccine" 
                        value={formData.dose3OtherVaccine} 
                        onChange={handleInputChange} 
                        isDarkMode={isDarkMode} 
                        placeholder="Enter vaccine name"
                        required
                      />
                    )}
                  </div>
                  
                  {/* Vaccination Center as text input (not dropdown) */}
                  <InputField 
                    label="Vaccination Center *" 
                    name="vaccinationCenter" 
                    value={formData.vaccinationCenter} 
                    onChange={handleInputChange} 
                    isDarkMode={isDarkMode} 
                    placeholder="Enter Vaccination Center Name"
                    required
                  />
                  
                  <InputField 
                    label="Total Doses *" 
                    name="totalDoses" 
                    value={formData.totalDoses} 
                    onChange={handleInputChange} 
                    isDarkMode={isDarkMode} 
                    placeholder="3"
                    required
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
                onClick={saveSurokkhaCertificate}
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
            
            {/* Previous Certificates Table */}
            <div className="mt-12">
              <div className="flex justify-between items-center mb-6">
                <h2 className={`text-lg md:text-xl font-bold ${isDarkMode ? 'text-green-400' : 'text-[#1abc9c]'}`}>
                  পূর্ববর্তী সুরক্ষা সার্টিফিকেট তালিকা
                </h2>
                
                {/* Search Bar */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="সুরক্ষা সার্টিফিকেট খুঁজুন..."
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
                          সার্টিফিকেট আইডি
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
                          পাসপোর্ট নং
                        </th>
                        <th className={`p-3 text-sm font-semibold border-r transition-colors duration-300 ${
                          isDarkMode
                            ? 'text-gray-300 border-gray-700'
                            : 'text-gray-600 border-gray-200'
                        }`}>
                          ভ্যাকসিন
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
                      {currentCertificates.length === 0 ? (
                        <tr className="">
                          <td colSpan="7" className="p-8 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <FileText className={isDarkMode ? 'text-gray-600' : 'text-gray-400'} size={48} />
                              <p className={`font-medium mb-2 transition-colors duration-300 ${
                                isDarkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                কোন সুরক্ষা সার্টিফিকেট পাওয়া যায়নি
                              </p>
                              <p className={`text-sm max-w-md transition-colors duration-300 ${
                                isDarkMode ? 'text-gray-500' : 'text-gray-500'
                              }`}>
                                {searchTerm ? 'আপনার সার্চের সাথে মিলছে এমন কোনো সুরক্ষা সার্টিফিকেট নেই' : 'আপনার প্রথম সুরক্ষা সার্টিফিকেট এখনই তৈরি করুন!'}
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
                        currentCertificates.map((certificate, index) => (
                          <tr 
                            key={certificate._id || index} 
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
                              <div className="font-medium">{certificate.certificateId || 'N/A'}</div>
                            </td>
                            <td className={`p-3 text-sm border-r transition-colors duration-300 ${
                              isDarkMode
                                ? 'text-gray-200 border-gray-700'
                                : 'text-gray-800 border-gray-200'
                            }`}>
                              {certificate.name || 'N/A'}
                            </td>
                            <td className={`p-3 text-sm border-r transition-colors duration-300 ${
                              isDarkMode
                                ? 'text-gray-200 border-gray-700'
                                : 'text-gray-800 border-gray-200'
                            }`}>
                              {certificate.passportNo || 'N/A'}
                            </td>
                            <td className={`p-3 text-sm font-bold border-r transition-colors duration-300 ${
                              isDarkMode
                                ? 'text-gray-200 border-gray-700'
                                : 'text-gray-800 border-gray-200'
                            }`}>
                              {certificate.dose1VaccineName || 'N/A'}
                            </td>
                            <td className={`p-3 text-sm text-nowrap border-r transition-colors duration-300 ${
                              isDarkMode
                                ? 'text-gray-400 border-gray-700'
                                : 'text-gray-600 border-gray-200'
                            }`}>
                              <div className="flex items-center justify-center gap-1">
                                <Calendar size={12} />
                                {formatDate(certificate.dose1Date)}
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
                      {Math.min(endIndex, filteredCertificates.length)}
                    </span> এর{' '}
                    <span className={`font-bold transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {filteredCertificates.length}
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
                আপনার সুরক্ষা সার্টিফিকেট অর্ডারটি সফলভাবে প্লেস করা হয়েছে।
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
                  সার্টিফিকেট দেখুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Popup */}
      {showDeletePopup && certificateToDelete && (
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
                সুরক্ষা সার্টিফিকেট ডিলিট করুন
              </h3>
              
              <p className={`text-sm md:text-base mb-4 md:mb-6 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                আপনি কি নিশ্চিত যে আপনি এই সুরক্ষা সার্টিফিকেটটি ডিলিট করতে চান?
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
                      সার্টিফিকেট আইডি
                    </p>
                    <p className={`font-semibold text-sm md:text-base truncate transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-800'
                    }`}>
                      {certificateToDelete.certificateId}
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
                      {certificateToDelete.name}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className={`text-xs md:text-sm transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      পাসপোর্ট নং
                    </p>
                    <p className={`font-semibold text-sm md:text-base truncate transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-800'
                    }`}>
                      {certificateToDelete.passportNo}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className={`text-xs md:text-sm transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      তারিখ
                    </p>
                    <p className={`font-semibold text-sm md:text-base transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-800'
                    }`}>
                      {formatDate(certificateToDelete.dose1Date)}
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
                  onClick={deleteCertificate}
                  disabled={deletingId === certificateToDelete._id}
                  className={`flex-1 font-semibold py-3 px-4 rounded-xl transition duration-200 text-sm md:text-base cursor-pointer ${
                    deletingId === certificateToDelete._id
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {deletingId === certificateToDelete._id ? (
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
                নোট: একবার ডিলিট করলে এই সুরক্ষা সার্টিফিকেটটি পুনরুদ্ধার করা যাবে না।
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
        className={`border rounded-md text-sm md:text-[15px] px-4 py-2 focus:outline-none focus:ring-2 ${isDarkMode
            ? 'bg-gray-700 border-gray-600 text-white focus:ring-green-500 focus:ring-offset-gray-800'
            : 'bg-white border-gray-300 focus:ring-green-500 focus:ring-offset-white'
          }`}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}

export default Surokkhaclone;