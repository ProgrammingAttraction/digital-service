import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, 
  Upload, 
  X, 
  Image as ImageIcon,
  CheckCircle2,
  Loader2,
  AlertCircle,
  User,
  Calendar,
  Home,
  Fingerprint,
  Info,
  Trash2,
  Download,
  Eye,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Save,
  History
} from 'lucide-react';
import Header from '../../../components/header/Header';
import Sidebar from '../../../components/sidebar/Sidebar';
import { useTheme } from '../../../context/ThemeContext';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import {useNavigate} from "react-router-dom"
import ApertureLoader from '../../../components/loader/ApertureLoader';

function Smartnid() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pdfProcessing, setPdfProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [extractionResult, setExtractionResult] = useState(null);
  const [servicePrice, setServicePrice] = useState(200); // Default price
  const [priceLoading, setPriceLoading] = useState(true);
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user?.id;
  
  // Unified State for Previews and File Names
  const [fileData, setFileData] = useState({
    pdf: { preview: null, name: "No file chosen", file: null },
    nid: { preview: null, name: "No file chosen", file: null, url: null },
    sign: { preview: null, name: "No file chosen", file: null, url: null }
  });

  // Form Data State
  const [formData, setFormData] = useState({
    nameBangla: "",
    nameEnglish: "",
    nationalId: "",
    pin: "",
    dateOfBirth: "",
    fatherName: "",
    motherName: "",
    birthPlace: "",
    bloodGroup: "",
    dateOfToday: "",
    address: "",
    gender: "",
    religion: ""
  });

  // Refs for hidden file inputs
  const pdfInputRef = useRef(null);
  const nidInputRef = useRef(null);
  const signInputRef = useRef(null);

  // Table State
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  // Delete confirmation popup state
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  // Fetch service price on component mount
  useEffect(() => {
    fetchServicePrice();
  }, []);

  // Fetch orders on component mount and when page/search changes
  useEffect(() => {
    fetchOrders();
  }, [currentPage, searchTerm]);

  // Fetch Smart NID service price
  const fetchServicePrice = async () => {
    try {
      setPriceLoading(true);
      const response = await axios.get(
        `${base_url}/api/user/service/price/smart-nid`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'userid': userId
          }
        }
      );
      
      if (response.data && response.data.price) {
        setServicePrice(response.data.price);
      }
    } catch (error) {
      console.error('Error fetching service price:', error);
      toast.error('সেবার মূল্য লোড করতে সমস্যা হয়েছে');
      // Keep default price of 200 if API fails
    } finally {
      setPriceLoading(false);
    }
  };

  // Fetch Smart NID orders
  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      const response = await axios.get(
        `${base_url}/api/user/smart-nid/orders`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'userid': userId
          },
          params: {
            page: currentPage,
            limit: itemsPerPage,
            search: searchTerm
          }
        }
      );

      if (response.data.success) {
        setOrders(response.data.data || []);
        setTotalPages(response.data.pagination?.pages || 1);
        setTotalOrders(response.data.pagination?.total || 0);
      } else {
        toast.error(response.data.message || 'স্মার্ট এনআইডি অর্ডার তালিকা লোড করতে সমস্যা হয়েছে');
      }
    } catch (error) {
      console.error('Error fetching Smart NID orders:', error);
      toast.error('স্মার্ট এনআইডি অর্ডার তালিকা লোড করতে সমস্যা হয়েছে');
    } finally {
      setOrdersLoading(false);
    }
  };

  // Load image from URL and convert to base64
  const loadImageFromUrl = async (url, type) => {
    try {
      console.log(`Loading image from URL: ${url}`);
      const response = await fetch(url);
      const blob = await response.blob();
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const base64data = reader.result;
        const fileName = type === 'nid' ? 'nid-photo.jpg' : 'signature.png';
        
        // Create file object from base64
        const arr = base64data.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        
        const file = new File([u8arr], fileName, { type: mime });
        
        setFileData(prev => ({ 
          ...prev, 
          [type]: { 
            preview: base64data, 
            name: fileName,
            file: file,
            url: url
          } 
        }));
      };
      
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error(`Error loading image from URL (${type}):`, error);
      // If image loading fails, at least show the URL
      setFileData(prev => ({ 
        ...prev, 
        [type]: { 
          preview: null, 
          name: type === 'nid' ? 'User Photo' : 'Signature', 
          file: null,
          url: url
        } 
      }));
    }
  };

  // Extract data from PDF using the simple backend route
  const extractDataFromPDF = async (pdfFile) => {
    setPdfProcessing(true);
    setError(null);
    setExtractedData(null);
    setExtractionResult(null);

    try {
      // Prepare form data for backend API
      const formData = new FormData();
      formData.append('pdf', pdfFile);
      
      console.log('Sending PDF to backend for extraction...');
      
      // Call the backend API route we created
      const response = await axios.post(
        `${base_url}/api/user/sign-to-nid`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          timeout: 60000 // 60 seconds timeout
        }
      );

      console.log('Backend response:', response.data);

      if (response.data.success) {
        const result = response.data.data;
        
        // Check if we have the expected nested structure
        if (result && result.data && result.code === 200) {
          const extractedData = result.data;
          setExtractionResult(result);
          setExtractedData(extractedData);
          
          console.log('Extracted data:', extractedData);
          
          // Auto-fill ALL form fields with extracted data
          setFormData({
            nameBangla: extractedData.nameBangla || "",
            nameEnglish: extractedData.nameEnglish || "",
            nationalId: extractedData.nationalId || "",
            pin: extractedData.pin || "",
            dateOfBirth: extractedData.dateOfBirth || "",
            fatherName: extractedData.fatherName || "",
            motherName: extractedData.motherName || "",
            birthPlace: extractedData.birthPlace || "",
            bloodGroup: extractedData.bloodGroup || "",
            dateOfToday: extractedData.dateOfToday || "",
            address: extractedData.address || "",
            gender: extractedData.gender || "",
            religion: extractedData.religion || ""
          });
          
          // Load images from URLs if available
          if (extractedData.userIMG) {
            loadImageFromUrl(extractedData.userIMG, 'nid');
          }
          
          if (extractedData.signIMG) {
            loadImageFromUrl(extractedData.signIMG, 'sign');
          }
          
          toast.success('PDF থেকে ডেটা সফলভাবে এক্সট্রাক্ট করা হয়েছে!');
        } else {
          setError("Invalid data format received from API");
          toast.error('PDF ডেটা এক্সট্রাক্ট করতে সমস্যা হয়েছে');
        }
      } else {
        setError(response.data.message || "Failed to extract data from PDF");
        toast.error(response.data.message || 'PDF ডেটা এক্সট্রাক্ট করতে ব্যর্থ হয়েছে');
      }
    } catch (apiError) {
      console.error("PDF extraction API error:", apiError);
      setError(apiError.response?.data?.message || 
               apiError.message || 
               "Failed to extract data from PDF. Please try again.");
      toast.error(apiError.response?.data?.message || 'PDF প্রক্রিয়াকরণে সমস্যা হয়েছে');
    } finally {
      setPdfProcessing(false);
    }
  };

  // Handle File Change and Create Preview
  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size too large. Maximum size is 10MB.');
        toast.error('ফাইলের সাইজ খুব বড়। সর্বোচ্চ ১০এমবি অনুমোদিত।');
        return;
      }

      // Validate file type
      if (type === 'pdf' && file.type !== 'application/pdf') {
        setError('Please upload a valid PDF file.');
        toast.error('শুধুমাত্র PDF ফাইল আপলোড করুন।');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFileData(prev => ({ 
          ...prev, 
          [type]: { 
            preview: reader.result, 
            name: file.name,
            file: file,
            url: null
          } 
        }));

        // If PDF file, extract data
        if (type === 'pdf') {
          extractDataFromPDF(file);
        } else {
          toast.success(`${type === 'nid' ? 'এনআইডি ছবি' : 'স্বাক্ষর'} সফলভাবে আপলোড হয়েছে!`);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Clear Image
  const clearFile = (e, type) => {
    e.stopPropagation();
    setFileData(prev => ({ 
      ...prev, 
      [type]: { preview: null, name: "No file chosen", file: null, url: null } 
    }));

    // If clearing PDF, also clear extracted data
    if (type === 'pdf') {
      setExtractedData(null);
      setExtractionResult(null);
      setFormData({
        nameBangla: "",
        nameEnglish: "",
        nationalId: "",
        pin: "",
        dateOfBirth: "",
        fatherName: "",
        motherName: "",
        birthPlace: "",
        bloodGroup: "",
        dateOfToday: "",
        address: "",
        gender: "",
        religion: ""
      });
    }
    
    toast.success(`${type === 'pdf' ? 'PDF' : type === 'nid' ? 'এনআইডি ছবি' : 'স্বাক্ষর'} সরানো হয়েছে`);
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle form submission - UPDATED FOR SMART NID
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    const requiredFields = [
      'nameBangla', 'nameEnglish', 'nationalId', 'pin', 
      'dateOfBirth', 'fatherName', 'motherName', 'birthPlace',
      'dateOfToday', 'address'
    ];
    
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      setError(`Please fill all required fields: ${missingFields.join(', ')}`);
      toast.error('সমস্ত প্রয়োজনীয় তথ্য পূরণ করুন');
      return;
    }
    
    // Check if NID photo exists (either file or URL)
    if (!fileData.nid.file && !fileData.nid.preview && !fileData.nid.url) {
      setError("Please upload NID photo or provide URL");
      toast.error('এনআইডি ছবি আপলোড করুন বা URL প্রদান করুন');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Prepare form data for submission
      const submitFormData = new FormData();
      
      // Append form fields
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          submitFormData.append(key, formData[key]);
        }
      });
      
      // Append PDF file if exists
      if (fileData.pdf.file) {
        submitFormData.append('pdfFile', fileData.pdf.file);
      }
      
      // Handle NID photo - could be file OR URL
      if (fileData.nid.file) {
        // NID photo uploaded as file
        submitFormData.append('nidImage', fileData.nid.file);
      } else if (fileData.nid.url) {
        // NID photo from URL (from PDF extraction)
        submitFormData.append('nidImageUrl', fileData.nid.url);
      }
      
      // Handle signature - optional, could be file OR URL
      if (fileData.sign.file) {
        // Signature uploaded as file
        submitFormData.append('signImage', fileData.sign.file);
      } else if (fileData.sign.url) {
        // Signature from URL (from PDF extraction)
        submitFormData.append('signImageUrl', fileData.sign.url);
      }
      
      // Call backend API to create SMART NID order
      const response = await axios.post(
        `${base_url}/api/user/smart-nid/create-order`, 
        submitFormData, 
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
            'userid': userId
          }
        }
      );

      if (response.data.success) {
        toast.success("স্মার্ট এনআইডি অর্ডার সফল হয়েছে!");
        
        // Update user balance in localStorage
        if (response.data.data) {
          const userData = JSON.parse(localStorage.getItem('user'));
          userData.balance -= servicePrice;
          localStorage.setItem('user', JSON.stringify(userData));
        }
        
        // Reset form after successful submission
        setFormData({
          nameBangla: "",
          nameEnglish: "",
          nationalId: "",
          pin: "",
          dateOfBirth: "",
          fatherName: "",
          motherName: "",
          birthPlace: "",
          bloodGroup: "",
          dateOfToday: "",
          address: "",
          gender: "",
          religion: ""
        });
        
        setFileData({
          pdf: { preview: null, name: "No file chosen", file: null, url: null },
          nid: { preview: null, name: "No file chosen", file: null, url: null },
          sign: { preview: null, name: "No file chosen", file: null, url: null }
        });
        
        setExtractedData(null);
        setExtractionResult(null);
        
        // Refresh orders list
        fetchOrders();
        
        // Navigate to download page (update this route if needed)
        navigate(`/auto-services/smart-nid-download/${response.data.data?.receiptId}`);
        
        // Show success message with order details
        toast.success(`অর্ডার নং: ${response.data.data?.receiptId || 'N/A'}`);
      } else {
        setError(response.data.message || "Failed to save Smart NID data");
        toast.error(response.data.message || 'স্মার্ট এনআইডি অর্ডার সংরক্ষণ ব্যর্থ হয়েছে');
      }
    } catch (err) {
      console.error("Submit error:", err);
      setError(err.response?.data?.message || "Failed to submit form");
      toast.error(err.response?.data?.message || 'ফর্ম সাবমিট করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  // View image in full screen
  const viewImageFullscreen = (type) => {
    const imageUrl = fileData[type].preview || fileData[type].url;
    if (!imageUrl) return;
    
    const win = window.open(imageUrl, '_blank');
    if (win) win.focus();
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
  const confirmDeleteOrder = (order) => {
    setOrderToDelete(order);
    setShowDeletePopup(true);
  };

  // Delete Smart NID order
  const deleteOrder = async () => {
    if (!orderToDelete) return;

    try {
      setDeletingId(orderToDelete._id);
      const response = await axios.delete(
        `${base_url}/api/user/smart-nid/order/${orderToDelete._id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'userid': userId
          }
        }
      );
      
      if (response.data.success) {
        toast.success('স্মার্ট এনআইডি অর্ডার সফলভাবে ডিলিট করা হয়েছে');
        // Refresh orders list
        fetchOrders();
        // Update user balance in localStorage
        if (response.data.data?.newBalance !== undefined) {
          const userData = JSON.parse(localStorage.getItem('user'));
          userData.balance = response.data.data.newBalance;
          localStorage.setItem('user', JSON.stringify(userData));
        }
      } else {
        toast.error(response.data.message || 'স্মার্ট এনআইডি অর্ডার ডিলিট করতে সমস্যা হয়েছে');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.message || 'স্মার্ট এনআইডি অর্ডার ডিলিট করতে সমস্যা হয়েছে');
    } finally {
      setDeletingId(null);
      setShowDeletePopup(false);
      setOrderToDelete(null);
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setShowDeletePopup(false);
    setOrderToDelete(null);
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Action Buttons component for table
  const ActionButtons = ({ order }) => (
    <div className="flex justify-center gap-2">
      <button
        onClick={() => navigate(`/auto-services/smart-nid-download/${order.receiptId}`)}
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
        onClick={() => confirmDeleteOrder(order)}
        disabled={deletingId === order._id}
        className={`p-1.5 rounded transition-colors duration-200 ${
          isDarkMode 
            ? 'bg-red-900/30 text-red-300 hover:bg-red-800/50 disabled:opacity-50' 
            : 'bg-red-100 text-red-600 hover:bg-red-200 disabled:opacity-50'
        }`}
        title="ডিলিট করুন"
      >
        {deletingId === order._id ? (
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
      const response = await axios.get(`${base_url}/api/user/service/notice/smart-nid-make`);
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

        <main className="min-h-[93vh] p-3 md:p-6">
          {/* Page Title */}
          <div className="flex items-center gap-2 mb-6">
            <h1 className={`text-xl md:text-2xl font-bold ${isDarkMode ? 'text-theme_color' : 'text-theme_color'}`}>স্মার্ট এনআইডি</h1>
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
          <div className={`border rounded-lg shadow-sm p-4 md:p-8 w-full mx-auto transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            
            {/* PDF Upload Section - Clickable Box */}
            <div className="flex justify-center mb-10">
              <input 
                type="file" 
                ref={pdfInputRef} 
                className="hidden" 
                accept=".pdf" 
                onChange={(e) => handleFileChange(e, 'pdf')}
                disabled={loading || pdfProcessing}
              />
              <div 
                onClick={() => !loading && !pdfProcessing && pdfInputRef.current.click()}
                className={`group border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center w-full max-w-md cursor-pointer transition-all duration-300 ${
                  loading || pdfProcessing 
                    ? isDarkMode 
                      ? 'border-gray-600 bg-gray-700/50' 
                      : 'border-gray-300 bg-gray-50'
                    : isDarkMode
                      ? 'border-theme_color bg-green-900/20 hover:bg-green-900/30'
                      : 'border-theme_color bg-teal-50/30 hover:bg-teal-50'
                }`}
              >
                {pdfProcessing ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="animate-spin text-theme_color mb-3" size={40} />
                    <p className="text-theme_color text-center font-bold text-lg">
                      Processing PDF...
                    </p>
                    <p className={`text-sm mt-1 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                      Extracting data, please wait
                    </p>
                  </div>
                ) : (
                  <>
                    <div className={`p-4 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform ${
                      isDarkMode ? 'bg-gray-700' : 'bg-white'
                    }`}>
                      <FileText size={40} className="text-theme_color" />
                    </div>
                    <p className="text-theme_color text-center font-bold text-lg">
                      {fileData.pdf.preview ? "ফাইল লোড হয়েছে" : "সাইন কপি লোড করুন"}
                    </p>
                    <p className={`text-sm mt-1 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                      {fileData.pdf.name}
                    </p>
                  </>
                )}
              </div>
            </div>

            {error && (
              <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 transition-colors duration-300 ${
                isDarkMode ? 'bg-red-900/30 border-red-800/50' : 'bg-red-50 border-red-200'
              } border`}>
                <AlertCircle className="text-red-600" size={20} />
                <p className="text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            {/* Image Upload Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
              
              {/* NID Photo Box */}
              <div className="flex flex-col">
                <label className={`text-sm font-semibold mb-2 flex items-center gap-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  এনআইডি ছবি <span className="text-red-500">*</span>
                  {fileData.nid.url && (
                    <span className="text-xs text-green-600 font-normal ml-2">(Auto-loaded)</span>
                  )}
                </label>
                <input 
                  type="file" 
                  ref={nidInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={(e) => handleFileChange(e, 'nid')}
                  disabled={loading}
                />
                <div className={`border rounded-xl overflow-hidden shadow-sm ${loading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer group'} transition-colors duration-300 ${
                  isDarkMode ? 'border-gray-700' : 'border-gray-300'
                }`}>
                  <div 
                    onClick={() => {
                      if (!loading) {
                        if (fileData.nid.preview || fileData.nid.url) {
                          viewImageFullscreen('nid');
                        } else {
                          nidInputRef.current.click();
                        }
                      }
                    }}
                    className={`h-48 flex flex-col items-center justify-center relative border-b overflow-hidden transition-colors duration-300 ${
                      isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-[#eeeeee] border-gray-300'
                    }`}
                  >
                    {(fileData.nid.preview || fileData.nid.url) ? (
                      <img 
                        src={fileData.nid.preview || fileData.nid.url} 
                        alt="NID" 
                        className="w-full h-full object-contain" 
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://via.placeholder.com/300x200?text=NID+Photo`;
                        }}
                      />
                    ) : (
                      <>
                        <ImageIcon size={48} className="mb-2 text-theme_color transition-colors" />
                        <span className={`font-bold text-xs tracking-widest uppercase ${
                          isDarkMode ? 'text-gray-500' : 'text-gray-400'
                        }`}>
                          No Image Selected
                        </span>
                      </>
                    )}
                    
                    <div className="absolute top-3 right-3 flex gap-2">
                      {(fileData.nid.preview || fileData.nid.url) ? (
                        <>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              viewImageFullscreen('nid');
                            }}
                            className={`p-1.5 rounded-lg shadow-sm border transition-colors duration-300 ${
                              isDarkMode 
                                ? 'bg-gray-800 border-gray-700 text-blue-400 hover:bg-gray-700' 
                                : 'bg-white border-gray-200 text-blue-500 hover:bg-blue-50'
                            }`}
                            title="View Full Screen"
                          >
                            <ImageIcon size={16} />
                          </button>
                          <button 
                            onClick={(e) => clearFile(e, 'nid')}
                            className={`p-1.5 rounded-lg shadow-md border transition-colors duration-300 ${
                              isDarkMode 
                                ? 'bg-gray-800 border-gray-700 text-red-400 hover:bg-red-900/30' 
                                : 'bg-white border-gray-200 text-red-500 hover:bg-red-50'
                            }`}
                            title="Remove"
                          >
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <div 
                          onClick={() => !loading && nidInputRef.current.click()}
                          className={`p-1.5 rounded-lg shadow-sm border cursor-pointer transition-colors duration-300 ${
                            isDarkMode 
                              ? 'bg-gray-800 border-gray-700 text-blue-400 hover:bg-gray-700' 
                              : 'bg-white border-gray-200 text-blue-500 hover:bg-blue-50'
                          }`}
                          title="Upload"
                        >
                          <Upload size={16} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Signature Box */}
              <div className="flex flex-col">
                <label className={`text-sm font-semibold mb-2 flex items-center gap-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  স্বাক্ষর <span className={`font-normal text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>(ঐচ্ছিক)</span>
                  {fileData.sign.url && (
                    <span className="text-xs text-green-600 font-normal ml-2">(Auto-loaded)</span>
                  )}
                </label>
                <input 
                  type="file" 
                  ref={signInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={(e) => handleFileChange(e, 'sign')}
                  disabled={loading}
                />
                <div className={`border rounded-xl overflow-hidden shadow-sm ${loading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer group'} transition-colors duration-300 ${
                  isDarkMode ? 'border-gray-700' : 'border-gray-300'
                }`}>
                  <div 
                    onClick={() => {
                      if (!loading) {
                        if (fileData.sign.preview || fileData.sign.url) {
                          viewImageFullscreen('sign');
                        } else {
                          signInputRef.current.click();
                        }
                      }
                    }}
                    className={`h-48 flex flex-col items-center justify-center relative border-b overflow-hidden transition-colors duration-300 ${
                      isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-[#eeeeee] border-gray-300'
                    }`}
                  >
                    {(fileData.sign.preview || fileData.sign.url) ? (
                      <img 
                        src={fileData.sign.preview || fileData.sign.url} 
                        alt="Sign" 
                        className="w-full h-full object-contain" 
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://via.placeholder.com/300x200?text=Signature`;
                        }}
                      />
                    ) : (
                      <>
                        <ImageIcon size={48} className="mb-2 text-theme_color transition-colors" />
                        <span className={`font-bold text-xs tracking-widest uppercase ${
                          isDarkMode ? 'text-gray-500' : 'text-gray-400'
                        }`}>
                          No Signature Selected
                        </span>
                      </>
                    )}
                    
                    <div className="absolute top-3 right-3 flex gap-2">
                      {(fileData.sign.preview || fileData.sign.url) ? (
                        <>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              viewImageFullscreen('sign');
                            }}
                            className={`p-1.5 rounded-lg shadow-sm border transition-colors duration-300 ${
                              isDarkMode 
                                ? 'bg-gray-800 border-gray-700 text-blue-400 hover:bg-gray-700' 
                                : 'bg-white border-gray-200 text-blue-500 hover:bg-blue-50'
                            }`}
                            title="View Full Screen"
                          >
                            <ImageIcon size={16} />
                          </button>
                          <button 
                            onClick={(e) => clearFile(e, 'sign')}
                            className={`p-1.5 rounded-lg shadow-md border transition-colors duration-300 ${
                              isDarkMode 
                                ? 'bg-gray-800 border-gray-700 text-red-400 hover:bg-red-900/30' 
                                : 'bg-white border-gray-200 text-red-500 hover:bg-red-50'
                            }`}
                            title="Remove"
                          >
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <div 
                          onClick={() => !loading && signInputRef.current.click()}
                          className={`p-1.5 rounded-lg shadow-sm border cursor-pointer transition-colors duration-300 ${
                            isDarkMode 
                              ? 'bg-gray-800 border-gray-700 text-blue-400 hover:bg-gray-700' 
                              : 'bg-white border-gray-200 text-blue-500 hover:bg-blue-50'
                          }`}
                          title="Upload"
                        >
                          <Upload size={16} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Form Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <InputField 
                label="নাম (বাংলা)" 
                placeholder="সম্পূর্ণ নাম বাংলায়" 
                required 
                value={formData.nameBangla}
                onChange={(e) => handleInputChange('nameBangla', e.target.value)}
                disabled={loading}
                icon={<User size={18} />}
                isDarkMode={isDarkMode}
              />
              <InputField 
                label="নাম (ইংরেজী)" 
                placeholder="সম্পূর্ণ নাম ইংরেজীতে" 
                required 
                value={formData.nameEnglish}
                onChange={(e) => handleInputChange('nameEnglish', e.target.value)}
                disabled={loading}
                icon={<User size={18} />}
                isDarkMode={isDarkMode}
              />
              <InputField 
                label="এনআইডি নম্বর" 
                placeholder="এনআইডি নাম্বার" 
                required 
                value={formData.nationalId}
                onChange={(e) => handleInputChange('nationalId', e.target.value)}
                disabled={loading}
                icon={<Fingerprint size={18} />}
                isDarkMode={isDarkMode}
              />
              <InputField 
                label="পিন নম্বর" 
                placeholder="পিন নাম্বার" 
                required 
                value={formData.pin}
                onChange={(e) => handleInputChange('pin', e.target.value)}
                disabled={loading}
                icon={<Fingerprint size={18} />}
                isDarkMode={isDarkMode}
              />
              <InputField 
                label="পিতার নাম" 
                placeholder="পিতার নাম বাংলায়" 
                required 
                value={formData.fatherName}
                onChange={(e) => handleInputChange('fatherName', e.target.value)}
                disabled={loading}
                icon={<User size={18} />}
                isDarkMode={isDarkMode}
              />
              <InputField 
                label="মাতার নাম" 
                placeholder="মাতার নাম বাংলায়" 
                required 
                value={formData.motherName}
                onChange={(e) => handleInputChange('motherName', e.target.value)}
                disabled={loading}
                icon={<User size={18} />}
                isDarkMode={isDarkMode}
              />
              <InputField 
                label="জন্মস্থান" 
                placeholder="জন্মস্থান (অঞ্চল)" 
                required 
                value={formData.birthPlace}
                onChange={(e) => handleInputChange('birthPlace', e.target.value)}
                disabled={loading}
                icon={<Home size={18} />}
                isDarkMode={isDarkMode}
              />
              <InputField 
                label="জন্ম তারিখ" 
                placeholder="20 Mar 1987" 
                required 
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                disabled={loading}
                icon={<Calendar size={18} />}
                isDarkMode={isDarkMode}
              />
              <InputField 
                label="রক্তের গ্রুপ" 
                placeholder="B+" 
                value={formData.bloodGroup}
                onChange={(e) => handleInputChange('bloodGroup', e.target.value)}
                disabled={loading}
                isDarkMode={isDarkMode}
              />
              <InputField 
                label="প্রদানের তারিখ" 
                placeholder="24/12/2025" 
                required 
                value={formData.dateOfToday}
                onChange={(e) => handleInputChange('dateOfToday', e.target.value)}
                disabled={loading}
                icon={<Calendar size={18} />}
                isDarkMode={isDarkMode}
              />
            </div>

            {/* Additional Fields */}
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div className="flex flex-col">
                <label className={`text-sm font-bold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>লিঙ্গ</label>
                <select 
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  disabled={loading}
                  className={`border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1abc9c]/20 focus:border-[#1abc9c] transition-all ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <option value="">Select Gender</option>
                  <option value="male">পুরুষ</option>
                  <option value="female">মহিলা</option>
                  <option value="other">অন্যান্য</option>
                </select>
              </div>
              <div className="flex flex-col">
                <label className={`text-sm font-bold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>ধর্ম</label>
                <select 
                  value={formData.religion}
                  onChange={(e) => handleInputChange('religion', e.target.value)}
                  disabled={loading}
                  className={`border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1abc9c]/20 focus:border-[#1abc9c] transition-all ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <option value="">Select Religion</option>
                  <option value="Islam">ইসলাম</option>
                  <option value="hinduism">হিন্দু</option>
                  <option value="Christianity">খ্রিস্টান</option>
                  <option value="Buddhism">বৌদ্ধ</option>
                  <option value="Other">অন্যান্য</option>
                </select>
              </div>
            </div>
            
            {/* Address Area */}
            <div className="mt-5">
              <label className={`text-sm font-bold mb-2 block flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <Home size={16} className={isDarkMode ? 'text-gray-400' : 'text-gray-400'} />
                ঠিকানা <span className="text-red-500">*</span>
              </label>
              <textarea 
                className={`w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1abc9c]/20 focus:border-[#1abc9c] transition-all min-h-[100px] ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
                placeholder="বাসা/হোল্ডিং, গ্রাম/রাস্তা, ডাকঘর, উপজেলা, জেলা..."
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Payment Notification */}
            <div className={`mt-6 mb-6 p-4 border rounded-md flex justify-start items-start gap-3 transition-colors duration-300 ${
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

            {/* Submit Action */}
            <button 
              onClick={handleSubmit}
              disabled={loading}
              className={`w-full mt-8 text-white cursor-pointer font-bold py-4 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 uppercase ${
                loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : isDarkMode
                    ? 'bg-theme_color'
                    : 'bg-theme_color'
              }`}
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
                    <Save size={20} /> ডাউনলোড করুন </>
              )}
            </button>

            {/* Previous Smart NID Orders Table */}
            <div className="mt-12">
              <div className="flex justify-between items-center mb-6">
                <h2 className={`text-lg md:text-xl font-bold ${isDarkMode ? 'text-green-400' : 'text-[#1abc9c]'}`}>
                স্মার্ট এনআইডি অর্ডার তালিকা
                </h2>
                
                {/* Search Bar */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="স্মার্ট এনআইডি অর্ডার খুঁজুন..."
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
                  <Search
                    className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                  />
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto">
                {ordersLoading ? (
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
                          নাম (বাংলা)
                        </th>
                        <th className={`p-3 text-sm font-semibold border-r transition-colors duration-300 ${
                          isDarkMode
                            ? 'text-gray-300 border-gray-700'
                            : 'text-gray-600 border-gray-200'
                        }`}>
                          নাম (ইংরেজী)
                        </th>
                        <th className={`p-3 text-sm font-semibold border-r transition-colors duration-300 ${
                          isDarkMode
                            ? 'text-gray-300 border-gray-700'
                            : 'text-gray-600 border-gray-200'
                        }`}>
                          এনআইডি নম্বর
                        </th>
                        <th className={`p-3 text-sm font-semibold border-r transition-colors duration-300 ${
                          isDarkMode
                            ? 'text-gray-300 border-gray-700'
                            : 'text-gray-600 border-gray-200'
                        }`}>
                          মূল্য
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
                      {orders.length === 0 ? (
                        <tr className="">
                          <td colSpan="9" className="p-8 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <FileText className={isDarkMode ? 'text-gray-600' : 'text-gray-400'} size={48} />
                              <p className={`font-medium mb-2 transition-colors duration-300 ${
                                isDarkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                কোন স্মার্ট এনআইডি অর্ডার পাওয়া যায়নি
                              </p>
                              <p className={`text-sm max-w-md transition-colors duration-300 ${
                                isDarkMode ? 'text-gray-500' : 'text-gray-500'
                              }`}>
                                {searchTerm ? 'আপনার সার্চের সাথে মিলছে এমন কোনো স্মার্ট এনআইডি অর্ডার নেই' : 'আপনার প্রথম স্মার্ট এনআইডি অর্ডার এখনই তৈরি করুন!'}
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
                        orders.map((order, index) => (
                          <tr 
                            key={order._id || index} 
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
                              {(currentPage - 1) * itemsPerPage + index + 1}
                            </td>
                            <td className={`p-3 text-sm border-r transition-colors duration-300 ${
                              isDarkMode
                                ? 'text-gray-200 border-gray-700'
                                : 'text-gray-800 border-gray-200'
                            }`}>
                              {order.nameBangla || 'N/A'}
                            </td>
                            <td className={`p-3 text-sm border-r transition-colors duration-300 ${
                              isDarkMode
                                ? 'text-gray-200 border-gray-700'
                                : 'text-gray-800 border-gray-200'
                            }`}>
                              {order.nameEnglish || 'N/A'}
                            </td>
                            <td className={`p-3 text-sm font-bold border-r transition-colors duration-300 ${
                              isDarkMode
                                ? 'text-gray-200 border-gray-700'
                                : 'text-gray-800 border-gray-200'
                            }`}>
                              {order.nationalId || 'N/A'}
                            </td>
                            <td className={`p-3 text-sm border-r transition-colors duration-300 ${
                              isDarkMode
                                ? 'text-gray-200 border-gray-700'
                                : 'text-gray-800 border-gray-200'
                            }`}>
                              {order.servicePrice || servicePrice} টাকা
                            </td>
                            <td className={`p-3 text-sm text-nowrap border-r transition-colors duration-300 ${
                              isDarkMode
                                ? 'text-gray-400 border-gray-700'
                                : 'text-gray-600 border-gray-200'
                            }`}>
                              <div className="flex items-center justify-center gap-1">
                                <Calendar size={12} />
                                {formatDate(order.createdAt)}
                              </div>
                            </td>
                            <td className="p-3">
                              <ActionButtons order={order} />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination */}
              {orders.length > 0 && (
                <div className={`flex flex-wrap justify-between items-center mt-4 pt-4 border-t text-sm transition-colors duration-300 ${
                  isDarkMode 
                    ? 'border-gray-700 text-gray-400' 
                    : 'border-gray-200 text-gray-500'
                }`}>
                  <div className="mb-3 md:mb-0">
                    প্রদর্শন <span className={`font-bold transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {(currentPage - 1) * itemsPerPage + 1}
                    </span> থেকে{' '}
                    <span className={`font-bold transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {Math.min(currentPage * itemsPerPage, totalOrders)}
                    </span> এর{' '}
                    <span className={`font-bold transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {totalOrders}
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
     {showDeletePopup && orderToDelete && (
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
          স্মার্ট এনআইডি অর্ডার ডিলিট করুন
        </h3>
        
        <p className={`text-xs mb-3 transition-colors duration-300 ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          আপনি কি নিশ্চিত যে আপনি এই স্মার্ট এনআইডি অর্ডারটি ডিলিট করতে চান?
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
                {orderToDelete.receiptId}
              </p>
            </div>
            <div className="text-left">
              <p className={`text-xs transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                নাম (বাংলা)
              </p>
              <p className={`font-semibold text-xs truncate transition-colors duration-300 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>
                {orderToDelete.nameBangla}
              </p>
            </div>
            <div className="text-left">
              <p className={`text-xs transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                এনআইডি নম্বর
              </p>
              <p className={`font-semibold text-xs truncate transition-colors duration-300 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>
                {orderToDelete.nationalId}
              </p>
            </div>
            <div className="text-left">
              <p className={`text-xs transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                তারিখ
              </p>
              <p className={`font-semibold text-xs transition-colors duration-300 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>
                {formatDate(orderToDelete.createdAt)}
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
            onClick={deleteOrder}
            disabled={deletingId === orderToDelete._id}
            className={`flex-1 font-semibold py-2 px-3 rounded-lg transition duration-200 text-xs cursor-pointer ${
              deletingId === orderToDelete._id
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {deletingId === orderToDelete._id ? (
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

// Enhanced Input Field with icon support
function InputField({ label, placeholder, type = "text", required = false, value, onChange, disabled = false, icon = null, isDarkMode }) {
  return (
    <div className="flex flex-col">
      <label className={`text-sm font-bold mb-2 flex items-center gap-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        {icon && <span className={`mr-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>{icon}</span>}
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input 
        type={type} 
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1abc9c]/20 focus:border-[#1abc9c] transition-all placeholder:text-gray-400 ${
          disabled 
            ? isDarkMode ? 'bg-gray-800 cursor-not-allowed' : 'bg-gray-50 cursor-not-allowed'
            : isDarkMode 
              ? 'bg-gray-700 border-gray-600 text-white' 
              : 'bg-white border-gray-300'
        }`}
      />
    </div>
  );
}

export default Smartnid;