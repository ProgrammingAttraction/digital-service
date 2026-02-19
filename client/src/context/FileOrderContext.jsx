import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import axios from 'axios';

const FileOrderContext = createContext();

export const FileOrderProvider = ({ children }) => {
  const [services, setServices] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState({
    services: false,
    orders: false,
    placingOrder: false,
    downloading: false
  });
  const [error, setError] = useState(null);
  const [orderSuccessData, setOrderSuccessData] = useState(null);
  
  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingText, setViewingText] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Add caching with timestamps
  const lastFetchTime = useRef({
    services: 0,
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

  // Fetch services from API with caching
  const fetchServices = async (forceRefresh = false) => {
    // Check if we should fetch or use cache
    if (!forceRefresh && !shouldFetchData('services') && services.length > 0) {
      console.log('Using cached services');
      return;
    }

    try {
      setLoading(prev => ({ ...prev, services: true }));
      setError(null);
      
      const response = await axios.get(`${base_url}/api/user/order-file-services`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'userId': userId
        }
      });
      
      if (response.data.success) {
        setServices(response.data.data || []);
        lastFetchTime.current.services = Date.now(); // Update timestamp
      } else {
        throw new Error(response.data.message || 'Failed to fetch services');
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      setError(error.response?.data?.message || error.message || 'Error fetching services');
      // Don't clear services on error if we have cached data
      if (services.length === 0) {
        setServices([]);
      }
    } finally {
      setLoading(prev => ({ ...prev, services: false }));
    }
  };

  // Fetch user orders with caching
  const fetchOrders = async (forceRefresh = false) => {
    // Check if we should fetch or use cache
    if (!forceRefresh && !shouldFetchData('orders') && orders.length > 0) {
      console.log('Using cached orders');
      return;
    }

    try {
      setLoading(prev => ({ ...prev, orders: true }));
      setError(null);
      
      const response = await axios.get(`${base_url}/api/user/pdffile-orders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'userId': userId
        }
      });

      if (response.data.success) {
        setOrders(response.data.data || []);
        lastFetchTime.current.orders = Date.now(); // Update timestamp
      } else {
        throw new Error(response.data.message || 'Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError(error.response?.data?.message || error.message || 'Error fetching orders');
      // Don't clear orders on error if we have cached data
      if (orders.length === 0) {
        setOrders([]);
      }
    } finally {
      setLoading(prev => ({ ...prev, orders: false }));
    }
  };

  // Place a new order
  const placeOrder = async (orderData) => {
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
        // Set success data for popup
        setOrderSuccessData({
          orderId: response.data.data.orderId,
          serviceName: orderData.serviceName,
          quantity: orderData.quantity,
          totalAmount: orderData.totalAmount,
          createdAt: new Date().toISOString()
        });
        
        // Force refresh orders after placing new order
        await fetchOrders(true);
        
        return {
          success: true,
          data: response.data.data,
          message: response.data.message || 'Order placed successfully'
        };
      } else {
        throw new Error(response.data.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      setError(error.response?.data?.message || error.message || 'Error placing order');
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Error placing order'
      };
    } finally {
      setLoading(prev => ({ ...prev, placingOrder: false }));
    }
  };

  // Download admin output file
  const downloadAdminOutput = async (orderId) => {
    try {
      setLoading(prev => ({ ...prev, downloading: true }));
      
      const response = await axios.get(`${base_url}/api/user/download-admin-output/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'userId': userId
        },
        responseType: 'blob'
      });

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from headers
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'admin-output.pdf';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      console.error('Download error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Download failed'
      };
    } finally {
      setLoading(prev => ({ ...prev, downloading: false }));
    }
  };

  // Clear all cache
  const clearCache = () => {
    lastFetchTime.current = {
      services: 0,
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
    await Promise.all([fetchServices(true), fetchOrders(true)]);
  };

  // Modal functions
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

  // Initial data fetch - only if not already loaded
  useEffect(() => {
    if (userId && token) {
      // Only fetch if we don't have data already
      if (services.length === 0) {
        fetchServices();
      }
      if (orders.length === 0) {
        fetchOrders();
      }
    }
  }, [userId, token]); // Only run when userId or token changes

  const value = {
    services,
    orders,
    loading,
    error,
    orderSuccessData,
    
    // Modal states
    showViewModal,
    viewingText,
    showReasonModal,
    selectedOrder,
    
    // Actions
    fetchServices,
    fetchOrders,
    placeOrder,
    downloadAdminOutput,
    clearCache,
    clearOrderSuccessData,
    clearError,
    refreshAllData,
    
    // Modal actions
    openViewModal,
    closeViewModal,
    openTextView,
    closeTextView,
    openReasonModal,
    closeReasonModal,
    
    // Helper functions
    getStatusColor: (status) => {
      switch(status?.toLowerCase()) {
        case 'completed':
        case 'সম্পন্ন':
          return 'text-green-600 bg-green-100';
        case 'processing':
        case 'প্রক্রিয়াধীন':
          return 'text-yellow-600 bg-yellow-100';
        case 'pending':
        case 'বিচারাধীন':
          return 'text-blue-600 bg-blue-100';
        case 'cancelled':
        case 'বাতিল':
          return 'text-red-600 bg-red-100';
        default:
          return 'text-gray-600 bg-gray-100';
      }
    },
    
    getStatusText: (status) => {
      const statusMap = {
        'pending': 'বিচারাধীন',
        'processing': 'প্রক্রিয়াধীন',
        'completed': 'সম্পন্ন',
        'cancelled': 'বাতিল'
      };
      return statusMap[status] || status;
    }
  };

  return (
    <FileOrderContext.Provider value={value}>
      {children}
    </FileOrderContext.Provider>
  );
};

// Custom hook to use the file order context
export const useFileOrder = () => {
  const context = useContext(FileOrderContext);
  if (context === undefined) {
    throw new Error('useFileOrder must be used within a FileOrderProvider');
  }
  return context;
};