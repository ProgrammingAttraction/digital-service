import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Header from '../../../components/header/Header';
import Sidebar from '../../../components/sidebar/Sidebar';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../context/ThemeContext';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  Download,
  FileText,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  File,
  Eye,
  Copy,
  MessageSquare,
  Trash2,
  AlertTriangle,
  X,
  Info
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import ApertureLoader from '../../../components/loader/ApertureLoader';

function TinCertificateOrder() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [noticeLoading, setNoticeLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [nidNumber, setNidNumber] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [loading, setLoading] = useState(false);
  const [pricesLoading, setPricesLoading] = useState(true);
  const [orderSuccessData, setOrderSuccessData] = useState(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [servicePrices, setServicePrices] = useState({
    tinCertificate: 0
  });
  
  // Order table states
  const [orders, setOrders] = useState([]);
  const [orderLoading, setOrderLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingText, setViewingText] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user?.id;
  const { isDarkMode } = useTheme();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  // Fetch prices from backend
  useEffect(() => {
    fetchPrices();
    fetchNotice();
    fetchOrders();
  }, []);

  // Fetch notice from backend
  const fetchNotice = async () => {
    try {
      setNoticeLoading(true);
      const response = await axios.get(`${base_url}/api/user/service/notice/tin-certificate-order`);
      if (response.data) {
        setNotice(response.data.service);
      } else {
        setNotice('⚠️ নোটিশঃ টিআইএন সার্টিফিকেট অর্ডার সার্ভিস। এনআইডি নাম্বারটি অবশ্যই সঠিক দিতে হবে।');
      }
    } catch (error) {
      console.error('Error fetching notice:', error);
      setNotice('⚠️ নোটিশঃ টিআইএন সার্টিফিকেট অর্ডার সার্ভিস। এনআইডি নাম্বারটি অবশ্যই সঠিক দিতে হবে।');
    } finally {
      setNoticeLoading(false);
    }
  };

  const fetchPrices = async () => {
    try {
      setPricesLoading(true);
      const response = await axios.get(`${base_url}/api/user/service/price/tin-certificate-order`);
      // Update service prices based on backend response
      const updatedPrices = {
        tinCertificate: response.data.price
      };
      
      setServicePrices(updatedPrices);
      
    } catch (error) {
      console.error('Error fetching prices:', error);
      toast.error('দাম লোড করতে সমস্যা হয়েছে, ডিফল্ট দাম ব্যবহার করা হচ্ছে', {
        duration: 3000,
        position: 'top-center',
      });
      // Keep default prices if API fails
    } finally {
      setPricesLoading(false);
    }
  };

  // Fetch orders for tin certificate service
  const fetchOrders = async () => {
    try {
      setOrderLoading(true);
      const response = await axios.get(`${base_url}/api/user/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'userId': userId
        }
      });
      
      if (response.data.success) {
        // Filter orders by service name containing "টিআইএন সার্টিফিকেট"
        const tinCertificateOrders = response.data.data.filter(order => 
          order.serviceName && order.serviceName.includes('টিআইএন সার্টিফিকেট')
        );
        setOrders(tinCertificateOrders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setOrderLoading(false);
    }
  };

  const handleNidNumberChange = (e) => {
    const value = e.target.value;
    setNidNumber(value);
    
    // Clear error for this field
    if (formErrors.nidNumber) {
      setFormErrors(prev => ({
        ...prev,
        nidNumber: ''
      }));
    }
    
    // Clear submit error when user starts typing
    if (submitError) {
      setSubmitError('');
    }
  };

  const handleServiceNameChange = (e) => {
    const value = e.target.value;
    setServiceName(value);
    
    // Clear error for this field
    if (formErrors.serviceName) {
      setFormErrors(prev => ({
        ...prev,
        serviceName: ''
      }));
    }
    
    // Clear submit error when user starts typing
    if (submitError) {
      setSubmitError('');
    }
  };

  // Validation function for form
  const validateForm = () => {
    const errors = {};
    
    if (!nidNumber.trim()) {
      errors.nidNumber = 'এনআইডি নাম্বার আবশ্যক';
    } else if (!/^\d{10}$|^\d{13}$|^\d{17}$/.test(nidNumber.trim())) {
      errors.nidNumber = 'সঠিক ১০, ১৩ বা ১৭ ডিজিটের এনআইডি নম্বর লিখুন';
    }
    
    if (!serviceName.trim()) {
      errors.serviceName = 'সার্ভিস নাম আবশ্যক';
    }
    
    return errors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    try {
      setLoading(true);
      setSubmitError('');
      
      // Prepare dynamic data
      const dynamicData = `এনআইডি নাম্বার - ${nidNumber}\nসার্ভিস নাম - ${serviceName}`;
      
      const fieldValues = {
        nidNumber: nidNumber.trim(),
        serviceName: serviceName.trim()
      };
      
      // Create request data object matching your backend expectations
      const requestData = {
        serviceId: 'tin_certificate',
        serviceName: 'টিআইএন সার্টিফিকেট অর্ডার',
        serviceRate: servicePrices.tinCertificate,
        serviceType: 'tin_certificate',
        orderType: 'pdf_file',
        quantity: 1,
        notes: dynamicData,
        fieldValues: fieldValues,
        totalAmount: servicePrices.tinCertificate,
        urgency: 'normal'
      };
      
      console.log('Sending order data:', requestData);
      
      // Make API call with JSON data
      const response = await axios.post(`${base_url}/api/user/create-service-order`, requestData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'userId': userId,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Order response:', response.data);
      
      if (response.data.success) {
        // Set success data
        setOrderSuccessData({
          orderId: response.data.data.orderId || response.data.data._id,
          serviceName: 'টিআইএন সার্টিফিকেট অর্ডার',
          quantity: 1,
          totalAmount: servicePrices.tinCertificate,
          date: new Date().toLocaleDateString('bn-BD')
        });
        
        // Show success popup
        setShowSuccessPopup(true);
        
        // Refresh orders list
        fetchOrders();
        
        // Reset form
        setNidNumber('');
        setServiceName('');
        setFormErrors({});
      } else {
        throw new Error(response.data.message || 'অর্ডার করতে সমস্যা হয়েছে');
      }
      
    } catch (error) {
      console.error('Error placing order:', error);
      
      // Set error message
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message ||
                          'অর্ডার করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।';
      setSubmitError(errorMessage);
      
      // Show error toast
      toast.error(errorMessage, {
        duration: 4000,
        position: 'top-center',
      });
    } finally {
      setLoading(false);
    }
  };

  // Close success popup
  const closeSuccessPopup = () => {
    setShowSuccessPopup(false);
    setOrderSuccessData(null);
    // Navigate to order history after closing popup
    navigate('/order/history');
  };

  // Order table functions
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('bn-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return `${parseFloat(amount || 0).toFixed(2)}৳`;
  };

  const getStatusColor = (status) => {
    const colors = {
      'completed': isDarkMode ? 'bg-green-900/40 text-green-300 border border-green-700/50' : 'bg-green-100 text-green-800',
      'processing': isDarkMode ? 'bg-yellow-900/40 text-yellow-300 border border-yellow-700/50' : 'bg-yellow-100 text-yellow-800',
      'pending': isDarkMode ? 'bg-blue-900/40 text-blue-300 border border-blue-700/50' : 'bg-blue-100 text-blue-800',
      'cancelled': isDarkMode ? 'bg-red-900/40 text-red-300 border border-red-700/50' : 'bg-red-100 text-red-800'
    };
    
    return colors[status] || colors.pending;
  };

  const getStatusText = (status) => {
    const texts = {
      'completed': 'সম্পন্ন',
      'processing': 'প্রক্রিয়াধীন',
      'pending': 'অপেক্ষমান',
      'cancelled': 'বাতিল'
    };
    
    return texts[status] || 'অজানা';
  };

  const getOrderTypeText = (type) => {
    const texts = {
      'text_file': 'টেক্সট ফাইল',
      'pdf_file': 'পিডিএফ ফাইল',
      'image_file': 'ছবি ফাইল',
      'document_file': 'ডকুমেন্ট ফাইল'
    };
    
    return texts[type] || type;
  };

  const hasAdminOutput = (order) => {
    return order.adminTextContent || order.adminPdfFile || order.adminImageFile || order.adminDocumentFile;
  };

  const copyTextToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('টেক্সট কপি করা হয়েছে!');
    }).catch(err => {
      toast.error('কপি করতে সমস্যা হয়েছে');
    });
  };

  const openViewModal = (order) => {
    setSelectedOrder(order);
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedOrder(null);
  };

  const openTextView = (order) => {
    setSelectedOrder(order);
    setViewingText(true);
  };

  const closeTextView = () => {
    setViewingText(false);
    setSelectedOrder(null);
  };

  const openReasonModal = (order) => {
    setSelectedOrder(order);
    setShowReasonModal(true);
  };

  const closeReasonModal = () => {
    setShowReasonModal(false);
    setSelectedOrder(null);
  };

  const downloadAdminOutput = async (orderId) => {
    try {
      // Find the order
      const order = orders.find(o => o._id === orderId);
      if (order && order.adminPdfFile && order.adminPdfFile.filePath) {
        // Create a download link
        const link = document.createElement('a');
        link.href = `${base_url}${order.adminPdfFile.filePath}`;
        link.download = order.adminPdfFile.fileName || 'document.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('ফাইল ডাউনলোড করতে সমস্যা হয়েছে');
    }
  };

  const openDeleteModal = (order) => {
    setOrderToDelete(order);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setOrderToDelete(null);
  };

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;
    
    setDeleteLoading(true);
    try {
      const response = await axios.delete(`${base_url}/api/user/orders/${orderToDelete._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'userId': userId,
        }
      });

      if (response.data.success) {
        toast.success('অর্ডার সফলভাবে মুছে ফেলা হয়েছে');
        // Refresh orders list
        fetchOrders();
        // Close modals
        closeDeleteModal();
      } else {
        toast.error(response.data.error || 'অর্ডার মুছতে সমস্যা হয়েছে');
      }
    } catch (error) {
      console.error('Delete order error:', error);
      toast.error('সার্ভার এরর হয়েছে');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Filter orders based on search term
  const filteredOrders = orders.filter(order =>
    order.serviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.orderType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination calculations
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Get icon component based on status
  const StatusIcon = ({ status }) => {
    const IconComponent = {
      'completed': CheckCircle,
      'processing': Clock,
      'pending': AlertCircle,
      'cancelled': XCircle
    }[status] || AlertCircle;
    
    return <IconComponent size={14} />;
  };

  // Get order type icon component
  const OrderTypeIcon = ({ type }) => {
    const IconComponent = {
      'text_file': FileText,
      'pdf_file': File,
      'image_file': File, // Using File for image as placeholder
      'document_file': File
    }[type] || FileText;
    
    return <IconComponent size={14} className={
      type === 'text_file' ? 'text-[#00a8ff]' :
      type === 'pdf_file' ? 'text-red-600' :
      type === 'image_file' ? 'text-green-600' :
      type === 'document_file' ? 'text-purple-600' : 'text-gray-600'
    } />;
  };

  // Action buttons component for each order
  const ActionButtons = ({ order }) => {
    if (order.status === 'cancelled') {
      return (
        <div className="flex space-x-1">
          <button
            onClick={() => openViewModal(order)}
            className="bg-[#00a8ff] text-white p-2 rounded-sm hover:bg-[#0097e6] transition duration-200 cursor-pointer"
            title="বিস্তারিত দেখুন"
          >
            <Eye size={14} />
          </button>
          
          {order.cancellationReason && (
            <button
              onClick={() => openReasonModal(order)}
              className="bg-red-600 text-white p-2 rounded-sm hover:bg-red-700 transition duration-200 cursor-pointer"
              title="বাতিলকরণের কারণ দেখুন"
            >
              <MessageSquare size={14} />
            </button>
          )}
          
          <button
            onClick={() => openDeleteModal(order)}
            className="bg-red-600 text-white p-2 rounded-sm hover:bg-red-700 transition duration-200 cursor-pointer"
            title="অর্ডার মুছুন"
          >
            <Trash2 size={14} />
          </button>
        </div>
      );
    }

    if (order.status === 'completed') {
      const hasOutput = hasAdminOutput(order);
      
      return (
        <div className="flex space-x-1">
          <button
            onClick={() => openViewModal(order)}
            className="bg-[#00a8ff] text-white p-2 rounded-sm hover:bg-[#0097e6] transition duration-200 cursor-pointer"
            title="বিস্তারিত দেখুন"
          >
            <Eye size={14} />
          </button>
          
          {hasOutput && order.orderType === 'text_file' && (
            <button
              onClick={() => openTextView(order)}
              className="bg-green-600 text-white p-2 rounded-sm hover:bg-green-700 transition duration-200 cursor-pointer"
              title="টেক্সট দেখুন"
            >
              <FileText size={14} />
            </button>
          )}
          
          {hasOutput && order.orderType === 'pdf_file' && (
            <NavLink 
              target='_blank'
              to={`${base_url}${order.adminPdfFile.filePath}`}
              className="bg-green-600 text-white p-2 rounded-sm hover:bg-green-700 transition duration-200 cursor-pointer"
              title="ফাইল ডাউনলোড"
            >
              <Download size={14} />
            </NavLink>
          )}
          
          <button
            onClick={() => openDeleteModal(order)}
            className="bg-red-600 text-white p-2 rounded-sm hover:bg-red-700 transition duration-200 cursor-pointer"
            title="অর্ডার মুছুন"
          >
            <Trash2 size={14} />
          </button>
        </div>
      );
    }
    
    const hasOutput = hasAdminOutput(order);
    
    return (
      <div className="flex space-x-1">
        <button
          onClick={() => openViewModal(order)}
          className="bg-[#00a8ff] text-white p-2 rounded-sm hover:bg-[#0097e6] transition duration-200 cursor-pointer"
          title="বিস্তারিত দেখুন"
        >
          <Eye size={14} />
        </button>
        
        {hasOutput && order.orderType === 'text_file' && (
          <button
            onClick={() => openTextView(order)}
            className="bg-green-600 text-white p-2 rounded-sm hover:bg-green-700 transition duration-200 cursor-pointer"
            title="টেক্সট দেখুন"
          >
            <FileText size={14} />
          </button>
        )}
        
        {hasOutput && order.orderType === 'pdf_file' && (
          <button
            onClick={() => downloadAdminOutput(order._id)}
            className="bg-red-600 text-white p-2 rounded-sm hover:bg-red-700 transition duration-200 cursor-pointer"
            title="ফাইল ডাউনলোড"
          >
            <Download size={14} />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className={`font-anek lg:ml-72 mt-[9vh] min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gray-900 text-gray-100' 
        : 'bg-gray-50 text-gray-700'
    }`}>
      <Header toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />

      {/* Success Popup */}
      {showSuccessPopup && orderSuccessData && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.7)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
          <div className={`rounded-2xl p-6 md:p-8 max-w-md w-full shadow-xl transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="text-center">
              <div className={`mx-auto flex items-center justify-center h-16 w-16 md:h-20 md:w-20 rounded-full mb-4 md:mb-6 ${
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
                আপনার অর্ডারটি সফলভাবে প্লেস করা হয়েছে।
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
                      অর্ডার আইডি
                    </p>
                    <p className={`font-semibold text-sm md:text-base truncate transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-800'
                    }`}>
                      {orderSuccessData.orderId}
                    </p>
                  </div>
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
                      পরিমাণ
                    </p>
                    <p className={`font-semibold text-sm md:text-base transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-800'
                    }`}>
                      {orderSuccessData.quantity}
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
              
              <button
                onClick={closeSuccessPopup}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-xl transition duration-200 text-sm md:text-base cursor-pointer"
              >
                ঠিক আছে
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Text Modal */}
      {viewingText && selectedOrder && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
          <div className={`rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className={`flex justify-between items-center p-4 border-b transition-colors duration-300 ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className="flex items-center">
                <FileText className="text-[#00a8ff] mr-2" size={20} />
                <h3 className={`text-lg font-bold transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-100' : 'text-gray-800'
                }`}>
                  টেক্সট
                </h3>
              </div>
              <button
                onClick={closeTextView}
                className={`transition-colors duration-300 cursor-pointer ${
                  isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[70vh]">
              {selectedOrder.adminTextContent && (
                <>
                  <div className={`mb-4 p-4 rounded-lg border transition-colors duration-300 ${
                    isDarkMode 
                      ? 'bg-[#00a8ff]/10 border-[#00a8ff]/30' 
                      : 'bg-[#00a8ff]/5 border-[#00a8ff]/20'
                  }`}>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className={`transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          অর্ডার আইডি:
                        </p>
                        <p className={`font-bold transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-200' : 'text-gray-800'
                        }`}>
                          #{selectedOrder.orderId}
                        </p>
                      </div>
                      <div>
                        <p className={`transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          পরিষেবা:
                        </p>
                        <p className={`font-bold transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-200' : 'text-gray-800'
                        }`}>
                          {selectedOrder.serviceName}
                        </p>
                      </div>
                      <div>
                        <p className={`transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          তারিখ:
                        </p>
                        <p className={`font-bold transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-200' : 'text-gray-800'
                        }`}>
                          {formatDate(selectedOrder.createdAt)}
                        </p>
                      </div>
                      <div>
                        <p className={`transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          অবস্থা:
                        </p>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedOrder.status)}`}>
                          {getStatusText(selectedOrder.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`p-4 rounded-lg border transition-colors duration-300 ${
                    isDarkMode 
                      ? 'bg-gray-800/50 border-gray-700' 
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center">
                        <FileText className="text-green-600 mr-2" size={18} />
                        <h4 className={`font-bold transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-200' : 'text-gray-700'
                        }`}>
                          টেক্সট কন্টেন্ট
                        </h4>
                      </div>
                      <button
                        onClick={() => copyTextToClipboard(selectedOrder.adminTextContent)}
                        className="bg-[#00a8ff] text-white px-3 py-1 rounded flex items-center text-sm hover:bg-[#0097e6] transition-colors cursor-pointer"
                      >
                        <Copy size={14} className="mr-1" />
                        কপি করুন
                      </button>
                    </div>
                    <div className={`p-4 rounded border transition-colors duration-300 ${
                      isDarkMode 
                        ? 'bg-gray-900 border-gray-600' 
                        : 'bg-white border-gray-300'
                    }`}>
                      <pre className={`whitespace-pre-wrap font-sans text-sm leading-relaxed transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-200' : 'text-gray-800'
                      }`}>
                        {selectedOrder.adminTextContent}
                      </pre>
                    </div>
                    <div className={`mt-3 text-sm flex justify-between transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-500'
                    }`}>
                      <span>অক্ষর: {selectedOrder.adminTextContent.length}</span>
                      <span>শব্দ: {selectedOrder.adminTextContent.trim().split(/\s+/).length}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <div className={`p-4 border-t flex justify-end transition-colors duration-300 ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <button
                onClick={closeTextView}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reason Modal */}
      {showReasonModal && selectedOrder && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
          <div className={`rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className={`flex justify-between items-center p-4 border-b transition-colors duration-300 ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className="flex items-center">
                <XCircle className="text-red-600 mr-2" size={20} />
                <h3 className={`text-lg font-bold transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-100' : 'text-gray-800'
                }`}>
                  বাতিলকরণের কারণ
                </h3>
              </div>
              <button
                onClick={closeReasonModal}
                className={`transition-colors duration-300 cursor-pointer ${
                  isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[70vh]">
              <div className="space-y-4">
                <div className={`p-4 rounded-lg border transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-red-900/20 border-red-800/50' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className={`transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        অর্ডার আইডি:
                      </p>
                      <p className={`font-bold transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-200' : 'text-gray-800'
                      }`}>
                        #{selectedOrder.orderId}
                      </p>
                    </div>
                    <div>
                      <p className={`transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        সেবার নাম:
                      </p>
                      <p className={`font-bold transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-200' : 'text-gray-800'
                      }`}>
                        {selectedOrder.serviceName}
                      </p>
                    </div>
                    <div>
                      <p className={`transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        বাতিলের তারিখ:
                      </p>
                      <p className={`font-bold transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-200' : 'text-gray-800'
                      }`}>
                        {formatDate(selectedOrder.cancelledAt)}
                      </p>
                    </div>
                    <div>
                      <p className={`transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        মোট টাকা:
                      </p>
                      <p className={`font-bold transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-200' : 'text-gray-800'
                      }`}>
                        {formatCurrency(selectedOrder.totalAmount)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-lg border transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-white border-gray-200'
                }`}>
                  <div className="flex items-center mb-3">
                    <MessageSquare className="text-red-600 mr-2" size={18} />
                    <h4 className={`font-bold transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                      বাতিলকরণের কারণ
                    </h4>
                  </div>
                  <div className={`p-4 rounded border transition-colors duration-300 ${
                    isDarkMode 
                      ? 'bg-gray-900/50 border-gray-600' 
                      : 'bg-gray-50 border-gray-300'
                  }`}>
                    <p className={`leading-relaxed transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-800'
                    }`}>
                      {selectedOrder.cancellationReason || 'কোন কারণ উল্লেখ করা হয়নি'}
                    </p>
                  </div>
                  <div className={`mt-3 text-sm transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    <div className="flex items-center">
                      <Info size={14} className="mr-1" />
                      <span>
                        এই অর্ডারটি {formatDate(selectedOrder.cancelledAt)} তারিখে বাতিল করা হয়েছে
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className={`p-4 border-t flex justify-end transition-colors duration-300 ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <button
                onClick={closeReasonModal}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && orderToDelete && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
          <div className={`rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className={`flex justify-between items-center p-4 border-b transition-colors duration-300 ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className="flex items-center">
                <AlertTriangle className="text-red-600 mr-2" size={20} />
                <h3 className={`text-lg font-bold transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-100' : 'text-gray-800'
                }`}>
                  অর্ডার মুছুন
                </h3>
              </div>
              <button
                onClick={closeDeleteModal}
                className={`transition-colors duration-300 cursor-pointer ${
                  isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                }`}
                disabled={deleteLoading}
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[70vh]">
              <div className="space-y-4">
                <div className={`p-4 rounded-lg border transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-800/50 border-gray-700' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className={`transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        অর্ডার আইডি:
                      </span>
                      <span className={`font-bold transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-200' : 'text-gray-800'
                      }`}>
                        #{orderToDelete.orderId}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        সেবার নাম:
                      </span>
                      <span className={`font-bold transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-200' : 'text-gray-800'
                      }`}>
                        {orderToDelete.serviceName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        অবস্থা:
                      </span>
                      <span className="font-bold text-green-600">সম্পন্ন</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        তারিখ:
                      </span>
                      <span className={`font-medium transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-800'
                      }`}>
                        {orderToDelete.createdAt ? new Date(orderToDelete.createdAt).toLocaleDateString('bn-BD') : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className={`p-4 border-t flex justify-end space-x-3 transition-colors duration-300 ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <button
                onClick={closeDeleteModal}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors cursor-pointer"
                disabled={deleteLoading}
              >
                বাতিল করুন
              </button>
              <button
                onClick={handleDeleteOrder}
                disabled={deleteLoading}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors cursor-pointer flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteLoading ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={18} />
                    মুছছি...
                  </>
                ) : (
                  <>
                    <Trash2 size={18} className="mr-2" />
                    মুছে ফেলুন
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order View Modal */}
      {showViewModal && selectedOrder && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
          <div className={`rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className={`flex justify-between items-center p-4 border-b transition-colors duration-300 ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className="flex items-center">
                <FileText className="text-[#00a8ff] mr-2" size={20} />
                <h3 className={`text-lg font-bold transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-100' : 'text-gray-800'
                }`}>
                  অর্ডার বিস্তারিত
                </h3>
              </div>
              <button
                onClick={closeViewModal}
                className={`transition-colors duration-300 cursor-pointer ${
                  isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[70vh]">
              <div className="space-y-4">
                {/* Order Header */}
                <div className={`p-4 rounded-lg border transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-[#00a8ff]/10 border-[#00a8ff]/30' 
                    : 'bg-[#00a8ff]/5 border-[#00a8ff]/20'
                }`}>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div>
                      <h4 className={`text-xl font-bold transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-100' : 'text-gray-800'
                      }`}>
                        #{selectedOrder.orderId}
                      </h4>
                      <p className={`transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {selectedOrder.serviceName}
                      </p>
                    </div>
                    <div className="mt-2 md:mt-0 text-right">
                      <p className={`text-2xl font-bold transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-100' : 'text-gray-800'
                      }`}>
                        {formatCurrency(selectedOrder.totalAmount)}
                      </p>
                      <span className={`inline-flex items-center px-3 py-1 mt-1 rounded-full text-sm font-medium ${getStatusColor(selectedOrder.status)}`}>
                        <StatusIcon status={selectedOrder.status} />
                        <span className="ml-1">{getStatusText(selectedOrder.status)}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Order Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`p-4 rounded-lg border transition-colors duration-300 ${
                    isDarkMode 
                      ? 'bg-gray-800/50 border-gray-700' 
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <h5 className={`font-bold mb-3 transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                      অর্ডার তথ্য
                    </h5>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className={`transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          অর্ডার ধরন:
                        </span>
                        <div className="flex items-center font-medium">
                          <OrderTypeIcon type={selectedOrder.orderType} />
                          <span className="ml-2">{getOrderTypeText(selectedOrder.orderType)}</span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className={`transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          পরিশোধ:
                        </span>
                        <span className="font-medium">{formatCurrency(selectedOrder.serviceRate)}</span>
                      </div>
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg border transition-colors duration-300 ${
                    isDarkMode 
                      ? 'bg-gray-800/50 border-gray-700' 
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <h5 className={`font-bold mb-3 transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-200' : 'text-gray-700'
                      }`}>
                      সময়
                    </h5>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className={`transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          তৈরি:
                        </span>
                        <span className="font-medium">{formatDate(selectedOrder.createdAt)}</span>
                      </div>
                      {selectedOrder.completedAt && (
                        <div className="flex justify-between">
                          <span className={`transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            সম্পন্ন:
                          </span>
                          <span className="font-medium">{formatDate(selectedOrder.completedAt)}</span>
                        </div>
                      )}
                      {selectedOrder.cancelledAt && (
                        <div className="flex justify-between">
                          <span className={`transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            বাতিল:
                          </span>
                          <span className="font-medium">{formatDate(selectedOrder.cancelledAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Admin Output Section */}
                {hasAdminOutput(selectedOrder) && (
                  <div className={`p-4 rounded-lg border transition-colors duration-300 ${
                    isDarkMode 
                      ? 'bg-green-900/20 border-green-800/50' 
                      : 'bg-green-50 border-green-200'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <FileText className="text-green-600 mr-2" size={20} />
                        <h5 className={`font-bold transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-200' : 'text-gray-700'
                        }`}>
                          অ্যাডমিনের আউটপুট
                        </h5>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        isDarkMode 
                          ? 'bg-green-900/40 text-green-300 border border-green-700/50' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        আপলোড করা হয়েছে
                      </span>
                    </div>
                    
                    {selectedOrder.orderType === 'text_file' && selectedOrder.adminTextContent && (
                      <div className={`p-3 rounded border transition-colors duration-300 ${
                        isDarkMode 
                          ? 'bg-gray-900 border-gray-600' 
                          : 'bg-white border-gray-300'
                      }`}>
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center">
                            <FileText className="text-[#00a8ff] mr-2" size={18} />
                            <span className="font-medium">টেক্সট কন্টেন্ট</span>
                          </div>
                          <button
                            onClick={() => openTextView(selectedOrder)}
                            className="bg-[#00a8ff] text-white px-3 py-1 rounded text-sm transition-colors cursor-pointer flex items-center"
                          >
                            <Eye size={14} className="mr-1" />
                            দেখুন
                          </button>
                        </div>
                        <p className={`text-sm mt-1 transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {selectedOrder.adminTextContent.substring(0, 100)}...
                        </p>
                      </div>
                    )}
                    
                    {selectedOrder.orderType === 'pdf_file' && selectedOrder.adminPdfFile && (
                      <div className={`p-3 rounded border transition-colors duration-300 ${
                        isDarkMode 
                          ? 'bg-gray-900 border-gray-600' 
                          : 'bg-white border-gray-300'
                      }`}>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <File className="text-red-600 mr-2" size={18} />
                            <div>
                              <p className="font-medium">{selectedOrder.adminPdfFile.fileName}</p>
                              <p className={`text-xs transition-colors duration-300 ${
                                isDarkMode ? 'text-gray-500' : 'text-gray-500'
                              }`}>
                                {(selectedOrder.adminPdfFile.fileSize / 1024).toFixed(2)} KB
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Cancellation Reason */}
                {selectedOrder.status === 'cancelled' && selectedOrder.cancellationReason && (
                  <div className={`p-4 rounded-lg border transition-colors duration-300 ${
                    isDarkMode 
                      ? 'bg-red-900/20 border-red-800/50' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <XCircle className="text-red-600 mr-2" size={20} />
                        <h5 className={`font-bold transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-200' : 'text-gray-700'
                        }`}>
                          বাতিলকরণের কারণ
                        </h5>
                      </div>
                      <button
                        onClick={() => {
                          closeViewModal();
                          openReasonModal(selectedOrder);
                        }}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors cursor-pointer flex items-center"
                      >
                        <MessageSquare size={14} className="mr-1" />
                        পূর্ণ কারণ দেখুন
                      </button>
                    </div>
                    <div className={`p-3 rounded border transition-colors duration-300 ${
                      isDarkMode 
                        ? 'bg-gray-900 border-red-600' 
                        : 'bg-white border-red-300'
                    }`}>
                      <p className={`line-clamp-2 transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-200' : 'text-gray-800'
                      }`}>
                        {selectedOrder.cancellationReason}
                      </p>
                    </div>
                    <div className={`mt-2 text-sm transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      <div className="flex items-center">
                        <Info size={14} className="mr-1" />
                        এই অর্ডারটি {formatDate(selectedOrder.cancelledAt)} তারিখে বাতিল করা হয়েছে
                      </div>
                    </div>
                  </div>
                )}

                {/* User Notes */}
                {selectedOrder.notes && (
                  <div className={`p-4 rounded-lg border transition-colors duration-300 ${
                    isDarkMode 
                      ? 'bg-gray-800/50 border-gray-700' 
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <h5 className={`font-bold mb-2 transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                      আপনার নোট
                    </h5>
                    <p className={`transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {selectedOrder.notes}
                    </p>
                  </div>
                )}

                {/* Custom Field Values */}
                {selectedOrder.fieldValues && Object.keys(selectedOrder.fieldValues).length > 0 && (
                  <div className={`p-4 rounded-lg border transition-colors duration-300 ${
                    isDarkMode 
                      ? 'bg-gray-800/50 border-gray-700' 
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <h5 className={`font-bold mb-3 transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                      অতিরিক্ত তথ্য
                    </h5>
                    <div className="space-y-2">
                      {Object.entries(selectedOrder.fieldValues).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className={`transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {key}:
                          </span>
                          <span className="font-medium">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className={`p-4 border-t flex justify-between transition-colors duration-300 ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              {selectedOrder.status === 'completed' && (
                <button
                  onClick={() => {
                    closeViewModal();
                    openDeleteModal(selectedOrder);
                  }}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors cursor-pointer flex items-center"
                >
                  <Trash2 size={18} className="mr-2" />
                  অর্ডার মুছুন
                </button>
              )}
              <button
                onClick={closeViewModal}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors cursor-pointer ml-auto"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      <main className='p-4 md:p-6'>
        <div className="mx-auto">
          {/* Main Form Container */}
          <div className={`p-4 md:p-6 w-full border rounded-lg shadow-sm transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            
            {/* Header Title */}
            <div className="flex justify-start items-center gap-2 mb-5">
              <h1 className={`text-xl md:text-2xl font-bold transition-colors duration-300 ${
                isDarkMode ? 'text-green-400' : 'text-theme_color'
              }`}>
                টিন সার্টিফিকেট অর্ডার
              </h1>
            </div>

            {/* Notice Box */}
            <div className={`border rounded-md p-2 mb-5 transition-colors duration-300 ${
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

            {/* Form Inputs */}
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                {/* NID Number Field */}
                <div>
                  <label className={`text-[13px] md:text-[15px] font-semibold font-bold block mb-1 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    এনআইডি নাম্বার *
                  </label>
                  <input 
                    type="text"
                    name="nidNumber"
                    value={nidNumber}
                    onChange={handleNidNumberChange}
                    placeholder="১০, ১৩ বা ১৭ ডিজিটের এনআইডি নম্বর" 
                    className={`w-full border rounded-md p-2 text-sm md:text-[15px] focus:outline-none focus:ring-1 h-[45px] placeholder:text-gray-400 transition-colors duration-300 ${
                      formErrors.nidNumber 
                        ? isDarkMode ? 'border-red-500 focus:ring-red-500' : 'border-red-400 focus:ring-red-400'
                        : isDarkMode 
                          ? 'border-gray-600 bg-gray-700 text-gray-100 focus:ring-green-500 focus:border-green-500' 
                          : 'border-gray-300 focus:ring-theme_color2 focus:border-theme_color2'
                    }`}
                    required
                  />
                  {formErrors.nidNumber && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.nidNumber}</p>
                  )}
                  <p className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    ১০, ১৩ বা ১৭ ডিজিটের এনআইডি নম্বর (যেমনঃ 2696403826479)
                  </p>
                </div>

                {/* Service Name Field */}
                <div>
                  <label className={`text-[13px] md:text-[15px] font-semibold font-bold block mb-1 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    সার্ভিস নাম লিখুন *
                  </label>
                  <textarea 
                    name="serviceName"
                    value={serviceName}
                    onChange={handleServiceNameChange}
                    placeholder="আপনি কোন ধরনের টিআইএন সার্ভিস চান? (যেমনঃ নতুন টিআইএন আবেদন, টিআইএন সংশোধন, টিআইএন রিনিউয়াল ইত্যাদি)" 
                    rows="3"
                    className={`w-full border rounded-md p-2 text-sm md:text-[15px] focus:outline-none focus:ring-1 placeholder:text-gray-400 transition-colors duration-300 ${
                      formErrors.serviceName 
                        ? isDarkMode ? 'border-red-500 focus:ring-red-500' : 'border-red-400 focus:ring-red-400'
                        : isDarkMode 
                          ? 'border-gray-600 bg-gray-700 text-gray-100 focus:ring-green-500 focus:border-green-500' 
                          : 'border-gray-300 focus:ring-theme_color2 focus:border-theme_color2'
                    }`}
                    required
                  />
                  {formErrors.serviceName && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.serviceName}</p>
                  )}
                  <p className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    বিস্তারিত লিখুন - কোন ধরনের টিআইএন সার্ভিস প্রয়োজন
                  </p>
                </div>
              </div>

              {/* Submit Error Display */}
              {submitError && (
                <div className={`mt-4 rounded-lg p-3 transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-red-900/20 border-red-800/50' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-red-500 text-sm">{submitError}</p>
                  </div>
                </div>
              )}

              {/* Price Information */}
              <div className={`mt-4 mb-4 p-3 text-base border rounded-md flex justify-start items-center gap-2 transition-colors duration-300 ${
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
                  এই সেবার জন্য আপনার অ্যাকাউন্ট থেকে <span className="font-bold">{pricesLoading ? '...' : servicePrices.tinCertificate} টাকা</span> কাটা হবে। 
                </p>
              </div>

              {/* Submit Button */}
              <div className="mt-6">
                <button 
                  type="submit"
                  disabled={loading || pricesLoading}
                  className={`w-full text-white font-bold py-2.5 rounded-md transition-colors text-[15px] flex items-center justify-center ${
                    loading || pricesLoading
                      ? isDarkMode 
                        ? 'bg-green-800 opacity-70 cursor-not-allowed' 
                        : 'bg-theme_color2 opacity-70 cursor-not-allowed'
                      : isDarkMode 
                        ? 'bg-green-600 hover:bg-theme_color2 cursor-pointer' 
                        : 'bg-theme_color2 hover:bg-theme_color2 cursor-pointer'
                  }`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      অর্ডার করা হচ্ছে...
                    </>
                  ) : (
                    `অর্ডার করুন (${pricesLoading ? '...' : servicePrices.tinCertificate} TK)`
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Order History Table Section */}
          <div className={`mt-8 border rounded-lg shadow-sm p-4 md:p-6 transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            
            {/* Table Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-xl font-bold transition-colors duration-300 ${
                isDarkMode ? 'text-green-400' : 'text-theme_color'
              }`}>
                টিন সার্টিফিকেট অর্ডার ইতিহাস
              </h2>
              
              <div className="flex items-center space-x-2">
                <div className={`flex items-center text-sm transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-700'
                }`}>
                  <span className="mr-2">প্রদর্শন:</span>
                  <select 
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(parseInt(e.target.value));
                      setCurrentPage(1);
                    }}
                    className={`border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#00a8ff] cursor-pointer transition-colors ${
                      isDarkMode
                        ? 'bg-gray-800 border-gray-600 text-gray-100'
                        : 'bg-white border-gray-300 text-gray-700'
                    }`}
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="25">25</option>
                  </select>
                  <span className="ml-2">এন্ট্রি</span>
                </div>
              </div>
            </div>

            {/* Search and Stats */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div className={`flex items-center text-sm transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-700'
              }`}>
                <span className="mr-2">খুঁজুন:</span>
                <div className="relative">
                  <Search size={16} className={`absolute left-2 top-1/2 transform -translate-y-1/2 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`} />
                  <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className={`border rounded px-2 py-1 pl-8 focus:outline-none focus:ring-1 focus:ring-[#00a8ff] w-48 md:w-64 transition-colors ${
                      isDarkMode
                        ? 'bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    }`}
                    placeholder="অর্ডার আইডি বা সেবা খুঁজুন..."
                  />
                </div>
              </div>
            </div>

            {/* Data Table */}
            <div className="overflow-x-auto">
              {orderLoading ? (
                <div className="flex justify-center items-center py-12">
                   <ApertureLoader/>
                </div>
              ) : (
                <table className="w-full text-center border-collapse border-[1px] border-gray-200">
                  <thead>
                    <tr className={`text-nowrap border-t border-b transition-colors duration-300 ${
                      isDarkMode
                        ? 'bg-[#00a8ff]/10 border-gray-700'
                        : 'bg-[#00a8ff]/5 border-gray-300'
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
                        সেবার নাম
                      </th>
                      <th className={`p-3 text-sm font-semibold border-r transition-colors duration-300 ${
                        isDarkMode
                          ? 'text-gray-300 border-gray-700'
                          : 'text-gray-600 border-gray-200'
                      }`}>
                        ধরন
                      </th>
                      <th className={`p-3 text-sm font-semibold border-r transition-colors duration-300 ${
                        isDarkMode
                          ? 'text-gray-300 border-gray-700'
                          : 'text-gray-600 border-gray-200'
                      }`}>
                        স্ট্যাটাস
                      </th>
                      <th className={`p-3 text-sm font-semibold border-r transition-colors duration-300 ${
                        isDarkMode
                          ? 'text-gray-300 border-gray-700'
                          : 'text-gray-600 border-gray-200'
                      }`}>
                        মোট টাকা
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
                    {filteredOrders.length === 0 ? (
                      <tr className="">
                        <td colSpan="7" className="p-8 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <FileText className={isDarkMode ? 'text-gray-600' : 'text-gray-400'} size={48} />
                            <p className={`font-medium mb-2 transition-colors duration-300 ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              কোন অর্ডার পাওয়া যায়নি
                            </p>
                            <p className={`text-sm max-w-md transition-colors duration-300 ${
                              isDarkMode ? 'text-gray-500' : 'text-gray-500'
                            }`}>
                              {searchTerm ? 'আপনার সার্চের সাথে মিলছে এমন কোনো অর্ডার নেই' : 'আপনার প্রথম টিআইএন সার্টিফিকেট অর্ডারটি এখনই করুন!'}
                            </p>
                            {searchTerm && (
                              <button
                                onClick={() => setSearchTerm('')}
                                className="mt-4 text-sm bg-[#00a8ff] text-white px-4 py-2 rounded-sm cursor-pointer"
                              >
                                সার্চ ক্লিয়ার করুন
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      currentOrders.map((order, index) => (
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
                            {startIndex + index + 1}
                          </td>
                          <td className={`p-3 text-sm border-r transition-colors duration-300 ${
                            isDarkMode
                              ? 'text-gray-200 border-gray-700'
                              : 'text-gray-800 border-gray-200'
                          }`}>
                            {order.serviceName || 'N/A'}
                          </td>
                          <td className={`p-3 border-r text-nowrap transition-colors duration-300 ${
                            isDarkMode ? 'border-gray-700' : 'border-gray-200'
                          }`}>
                            <div className="flex flex-col items-center gap-1">
                              <div className="flex items-center gap-1">
                                <OrderTypeIcon type={order.orderType} />
                                <span className={`text-sm font-medium transition-colors duration-300 ${
                                  isDarkMode ? 'text-gray-200' : 'text-gray-800'
                                }`}>
                                  {getOrderTypeText(order.orderType)}
                                </span>
                              </div>
                              {hasAdminOutput(order) && order.status !== 'cancelled' && (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  isDarkMode
                                    ? 'bg-green-900/40 text-green-300 border border-green-700/50'
                                    : 'bg-green-100 text-green-800 border-[1px] border-green-500 mt-1'
                                }`}>
                                  {order.orderType === 'text_file' ? 'টেক্সট প্রাপ্ত' : 'ফাইল প্রাপ্ত'}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className={`p-3 border-r text-nowrap transition-colors duration-300 ${
                            isDarkMode ? 'border-gray-700' : 'border-gray-200'
                          }`}>
                            <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full font-medium ${getStatusColor(order.status)}`}>
                              <StatusIcon status={order.status} />
                              {getStatusText(order.status)}
                            </span>
                            {order.status === 'cancelled' && order.cancellationReason && (
                              <div className="text-xs text-red-600 mt-1">
                                <Info size={10} className="inline mr-1" />
                                কারণ দেখুন
                              </div>
                            )}
                          </td>
                          <td className={`p-3 text-sm font-bold border-r transition-colors duration-300 ${
                            isDarkMode
                              ? 'text-gray-200 border-gray-700'
                              : 'text-gray-800 border-gray-200'
                          }`}>
                            {formatCurrency(order.totalAmount)}
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
            {filteredOrders.length > 0 && (
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
                    {Math.min(endIndex, filteredOrders.length)}
                  </span> এর{' '}
                  <span className={`font-bold transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {filteredOrders.length}
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
                            ? 'bg-[#00a8ff] text-white border-[#00a8ff]' 
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
  );
}

export default TinCertificateOrder;