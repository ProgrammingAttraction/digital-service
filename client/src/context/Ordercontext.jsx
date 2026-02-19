import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
  const [services, setServices] = useState({
    fileServices: [],
    textServices: []
  });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState({
    fileServices: false,
    textServices: false,
    orders: false,
    placingOrder: false,
    downloading: false
  });
  const [error, setError] = useState(null);
  const [orderSuccessData, setOrderSuccessData] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingText, setViewingText] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);
  
  // Add caching with timestamps
  const lastFetchTime = useRef({
    fileServices: 0,
    textServices: 0,
    orders: 0
  });
  
  // Cache duration in milliseconds (5 minutes)
  const CACHE_DURATION = 5 * 60 * 1000;
  
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user?.id;

  // Check if data should be fetched (based on cache time)
  const shouldFetchData = (dataType) => {
    const now = Date.now();
    return now - lastFetchTime.current[dataType] > CACHE_DURATION;
  };

  // Fetch file services from API with caching
  const fetchFileServices = async (forceRefresh = false) => {
    if (!forceRefresh && !shouldFetchData('fileServices') && services.fileServices.length > 0) {
      console.log('Using cached file services');
      return;
    }

    try {
      setLoading(prev => ({ ...prev, fileServices: true }));
      setError(null);
      
      const response = await axios.get(`${base_url}/api/user/order-file-services`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'userId': userId
        }
      });
      
      if (response.data.success) {
        setServices(prev => ({ ...prev, fileServices: response.data.data || [] }));
        lastFetchTime.current.fileServices = Date.now();
      } else {
        throw new Error(response.data.message || 'Failed to fetch file services');
      }
    } catch (error) {
      console.error('Error fetching file services:', error);
      setError(error.response?.data?.message || error.message || 'Error fetching file services');
      if (services.fileServices.length === 0) {
        setServices(prev => ({ ...prev, fileServices: [] }));
      }
    } finally {
      setLoading(prev => ({ ...prev, fileServices: false }));
    }
  };

  // Fetch text services from API with caching
  const fetchTextServices = async (forceRefresh = false) => {
    if (!forceRefresh && !shouldFetchData('textServices') && services.textServices.length > 0) {
      console.log('Using cached text services');
      return;
    }

    try {
      setLoading(prev => ({ ...prev, textServices: true }));
      setError(null);
      
      const response = await axios.get(`${base_url}/api/user/text-order-services`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'userId': userId
        }
      });
      
      if (response.data.success) {
        setServices(prev => ({ ...prev, textServices: response.data.data || [] }));
        lastFetchTime.current.textServices = Date.now();
      } else {
        throw new Error(response.data.message || 'Failed to fetch text services');
      }
    } catch (error) {
      console.error('Error fetching text services:', error);
      setError(error.response?.data?.message || error.message || 'Error fetching text services');
      if (services.textServices.length === 0) {
        setServices(prev => ({ ...prev, textServices: [] }));
      }
    } finally {
      setLoading(prev => ({ ...prev, textServices: false }));
    }
  };

  // Fetch user orders with caching
  const fetchOrders = async (forceRefresh = false) => {
    if (!forceRefresh && !shouldFetchData('orders') && orders.length > 0) {
      console.log('Using cached orders');
      return;
    }

    try {
      setLoading(prev => ({ ...prev, orders: true }));
      setError(null);
      
      const response = await axios.get(`${base_url}/api/user/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'userId': userId
        }
      });

      if (response.data.success) {
        setOrders(response.data.data || []);
        lastFetchTime.current.orders = Date.now();
      } else {
        throw new Error(response.data.message || 'Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError(error.response?.data?.message || error.message || 'Error fetching orders');
      if (orders.length === 0) {
        setOrders([]);
      }
    } finally {
      setLoading(prev => ({ ...prev, orders: false }));
    }
  };

  // Place a new file order
  const placeFileOrder = async (orderData) => {
    try {
      setLoading(prev => ({ ...prev, placingOrder: true }));
      setError(null);
      
      const response = await axios.post(`${base_url}/api/user/place-order`, orderData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'userId': userId,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setOrderSuccessData({
          orderId: response.data.data.orderId,
          serviceName: orderData.serviceName,
          serviceType: 'file',
          quantity: orderData.quantity,
          totalAmount: orderData.totalAmount,
          createdAt: new Date().toISOString()
        });
        
        await fetchOrders(true);
        toast.success('ফাইল অর্ডার সফলভাবে প্লেস করা হয়েছে');
        
        return {
          success: true,
          data: response.data.data,
          message: response.data.message || 'Order placed successfully'
        };
      } else {
        throw new Error(response.data.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('Error placing file order:', error);
      setError(error.response?.data?.message || error.message || 'Error placing order');
      toast.error(error.response?.data?.message || 'অর্ডার প্লেস করতে সমস্যা হয়েছে');
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    } finally {
      setLoading(prev => ({ ...prev, placingOrder: false }));
    }
  };

  // Place a new text order
  const placeTextOrder = async (orderData) => {
    try {
      setLoading(prev => ({ ...prev, placingOrder: true }));
      setError(null);
      
      const response = await axios.post(`${base_url}/api/user/place-text-order`, orderData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'userId': userId,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setOrderSuccessData({
          orderId: response.data.data.orderId,
          serviceName: orderData.serviceName,
          serviceType: 'text',
          quantity: orderData.quantity,
          totalAmount: orderData.totalAmount,
          createdAt: new Date().toISOString()
        });
        
        await fetchOrders(true);
        toast.success('টেক্সট অর্ডার সফলভাবে প্লেস করা হয়েছে');
        
        return {
          success: true,
          data: response.data.data,
          message: response.data.message || 'Text order placed successfully'
        };
      } else {
        throw new Error(response.data.message || 'Failed to place text order');
      }
    } catch (error) {
      console.error('Error placing text order:', error);
      setError(error.response?.data?.message || error.message || 'Error placing text order');
      toast.error(error.response?.data?.message || 'টেক্সট অর্ডার প্লেস করতে সমস্যা হয়েছে');
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    } finally {
      setLoading(prev => ({ ...prev, placingOrder: false }));
    }
  };

  // Download order file
  const downloadOrderFile = async (orderId) => {
    try {
      setLoading(prev => ({ ...prev, downloading: true }));
      
      const response = await axios.get(`${base_url}/api/user/download-order/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'userId': userId
        },
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'order-file.zip';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch.length > 1) {
          filename = filenameMatch[1];
        }
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('ফাইল ডাউনলোড সম্পন্ন হয়েছে');
      return { success: true };
    } catch (error) {
      console.error('Error downloading order file:', error);
      setError(error.response?.data?.message || error.message || 'Error downloading file');
      toast.error(error.response?.data?.message || 'ফাইল ডাউনলোড ব্যর্থ হয়েছে');
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    } finally {
      setLoading(prev => ({ ...prev, downloading: false }));
    }
  };

  // Download admin output file
  const downloadAdminOutput = async (orderId) => {
    try {
      setLoading(prev => ({ ...prev, downloading: true }));
      
      const response = await axios.get(
        `${base_url}/api/user/orders/${orderId}/download-output`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          responseType: 'blob'
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `order-${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('ফাইল ডাউনলোড সম্পন্ন হয়েছে');
      return { success: true };
    } catch (error) {
      console.error('Error downloading admin output:', error);
      setError(error.response?.data?.message || error.message || 'Error downloading file');
      toast.error(error.response?.data?.message || 'ফাইল ডাউনলোড ব্যর্থ হয়েছে');
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    } finally {
      setLoading(prev => ({ ...prev, downloading: false }));
    }
  };

  // Modal management
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

  // Clear all cache
  const clearCache = () => {
    lastFetchTime.current = {
      fileServices: 0,
      textServices: 0,
      orders: 0
    };
  };

  // Clear success data
  const clearOrderSuccessData = () => {
    setOrderSuccessData(null);
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Refresh all data (force refresh)
  const refreshAllData = async () => {
    await Promise.all([
      fetchFileServices(true),
      fetchTextServices(true),
      fetchOrders(true)
    ]);
  };

  // Helper functions
  const getOrderTypeIcon = (type) => {
    switch(type) {
      case 'text_file': return 'FileText';
      case 'pdf_file': return 'File';
      case 'image_file': return 'Image';
      case 'document_file': return 'FileType';
      default: return 'FileText';
    }
  };

  const getOrderTypeText = (type) => {
    switch(type) {
      case 'text_file': return 'টেক্সট';
      case 'pdf_file': return 'PDF ফাইল';
      case 'image_file': return 'ইমেজ';
      case 'document_file': return 'ডকুমেন্ট';
      default: return type || 'সাধারণ';
    }
  };

  const hasAdminOutput = (order) => {
    if (order.orderType === 'pdf_file') {
      return !!(order.adminPdfFile && order.adminPdfFile.fileName);
    } else if (order.orderType === 'text_file') {
      return !!order.adminTextContent;
    }
    return false;
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'completed':
      case 'সম্পন্ন':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'processing':
      case 'প্রক্রিয়াধীন':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'pending':
      case 'বিচারাধীন':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'cancelled':
      case 'বাতিল':
        return 'bg-red-100 text-red-800 border border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'বিচারাধীন',
      'processing': 'প্রক্রিয়াধীন',
      'completed': 'সম্পন্ন',
      'cancelled': 'বাতিল',
      'reviewing': 'রিভিউ চলছে',
      'in_progress': 'চলমান'
    };
    return statusMap[status?.toLowerCase()] || status;
  };

  const getStatusIcon = (status) => {
    switch(status?.toLowerCase()) {
      case 'completed': return 'CheckCircle';
      case 'processing': return 'Clock';
      case 'pending': return 'AlertCircle';
      case 'cancelled': return 'XCircle';
      default: return 'AlertCircle';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('bn-BD', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0 ৳';
    return new Intl.NumberFormat('bn-BD').format(amount) + ' ৳';
  };

  const copyTextToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('টেক্সট কপি করা হয়েছে');
  };

  // Initial data fetch
  useEffect(() => {
    if (userId && token) {
      if (services.fileServices.length === 0) {
        fetchFileServices();
      }
      if (services.textServices.length === 0) {
        fetchTextServices();
      }
      if (orders.length === 0) {
        fetchOrders();
      }
    }
  }, [userId, token]);

  const value = {
    // State
    services,
    orders,
    loading,
    error,
    orderSuccessData,
    selectedOrder,
    showViewModal,
    viewingText,
    showReasonModal,
    
    // Actions
    fetchFileServices,
    fetchTextServices,
    fetchOrders,
    placeFileOrder,
    placeTextOrder,
    downloadOrderFile,
    downloadAdminOutput,
      // Add this function
  getFilteredOrders: (type = 'all') => {
    if (type === 'all') return orders;
    return orders.filter(order => 
      order.serviceType === type || 
      order.category === type ||
      (order.orderType && order.orderType.includes(type))
    );
  },
    // Modal actions
    openViewModal,
    closeViewModal,
    openTextView,
    closeTextView,
    openReasonModal,
    closeReasonModal,
    
    // Utility functions
    clearCache,
    clearOrderSuccessData,
    clearError,
    refreshAllData,
    
    // Helper functions
    getOrderTypeIcon,
    getOrderTypeText,
    hasAdminOutput,
    getStatusColor,
    getStatusText,
    getStatusIcon,
    formatDate,
    formatCurrency,
    copyTextToClipboard
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
};

// Custom hook to use the order context
export const useOrder = () => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};