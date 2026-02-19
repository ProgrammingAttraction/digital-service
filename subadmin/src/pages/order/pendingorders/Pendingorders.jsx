import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search,
  Package,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  Mail,
  Phone,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  User,
  FileText,
  File,
  Image,
  FileType,
  Calendar,
  Users,
  AlertTriangle,
  X,
  Clock,
  DollarSign,
  Check,
  X as XIcon,
  Loader2,
  Upload,
  MessageSquare,
  FileUp,
  FileDown,
  Eye as EyeIcon,
  Edit2,
  Send,
  Copy,
  Paperclip
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Header from '../../../components/header/Header';
import Sidebar from '../../../components/sidebar/Sidebar';
import toast,{Toaster} from 'react-hot-toast';
import { FaBangladeshiTakaSign } from "react-icons/fa6";

function Pendingorders() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [statistics, setStatistics] = useState(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState({
    status: false,
    orderType: false,
    sort: false
  });
  const [selectedFilters, setSelectedFilters] = useState({
    status: '',
    orderType: '',
    sort: 'newest'
  });
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [deleteAllConfirmation, setDeleteAllConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [orderStats, setOrderStats] = useState({
    totalOrders: 0,
    totalAmount: 0,
    completedOrders: 0,
    pendingOrders: 0,
    processingOrders: 0,
    cancelledOrders: 0
  });
  
  // NEW STATES FOR CANCELLATION MODAL
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const token = localStorage.getItem('adminToken');
  
  // Refs for dropdown elements
  const statusDropdownRef = useRef(null);
  const orderTypeDropdownRef = useRef(null);
  const sortDropdownRef = useRef(null);
  
  // Handle click outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setShowFilterDropdown(prev => ({ ...prev, status: false }));
      }
      if (orderTypeDropdownRef.current && !orderTypeDropdownRef.current.contains(event.target)) {
        setShowFilterDropdown(prev => ({ ...prev, orderType: false }));
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
        setShowFilterDropdown(prev => ({ ...prev, sort: false }));
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Calculate statistics from orders data
  const calculateStatistics = (ordersData) => {
    const totalOrders = ordersData.length;
    const totalAmount = ordersData.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const completedOrders = ordersData.filter(order => order.status === 'completed').length;
    const pendingOrders = ordersData.filter(order => order.status === 'pending').length;
    const processingOrders = ordersData.filter(order => order.status === 'processing').length;
    const cancelledOrders = ordersData.filter(order => order.status === 'cancelled').length;
   
    // Calculate by order type
    const textOrders = ordersData.filter(order => order.orderType === 'text_file').length;
    const pdfOrders = ordersData.filter(order => order.orderType === 'pdf_file').length;
    const imageOrders = ordersData.filter(order => order.orderType === 'image_file').length;
    const documentOrders = ordersData.filter(order => order.orderType === 'document_file').length;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentOrders = ordersData.filter(order => new Date(order.createdAt) > weekAgo).length;
    
    return {
      totalOrders,
      totalAmount,
      completedOrders,
      pendingOrders,
      processingOrders,
      cancelledOrders,
      textOrders,
      pdfOrders,
      imageOrders,
      documentOrders,
      recentOrders
    };
  };
  
  // Filter and sort orders based on filters
  const filterAndSortOrders = (ordersData) => {
    let filteredOrders = [...ordersData];
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filteredOrders = filteredOrders.filter(order =>
        order.orderId?.toLowerCase().includes(searchLower) ||
        order.username?.toLowerCase().includes(searchLower) ||
        order.userEmail?.toLowerCase().includes(searchLower) ||
        order.serviceName?.toLowerCase().includes(searchLower)
      );
    }
    
    if (selectedFilters.status) {
      filteredOrders = filteredOrders.filter(order => order.status === selectedFilters.status);
    }
    
    if (selectedFilters.orderType) {
      filteredOrders = filteredOrders.filter(order => order.orderType === selectedFilters.orderType);
    }
    
    if (selectedFilters.sort === 'amount-high') {
      filteredOrders.sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0));
    } else if (selectedFilters.sort === 'amount-low') {
      filteredOrders.sort((a, b) => (a.totalAmount || 0) - (b.totalAmount || 0));
    } else if (selectedFilters.sort === 'oldest') {
      filteredOrders.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else {
      filteredOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    
    return filteredOrders;
  };
  
  // Fetch pending orders function
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
     
      const response = await axios.get(`${base_url}/api/sub-admin/orders/pending`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        const allOrdersData = response.data.data || [];
        setAllOrders(allOrdersData);
       
        const stats = calculateStatistics(allOrdersData);
        setStatistics(stats);
       
        const filteredOrders = filterAndSortOrders(allOrdersData);
       
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedOrders = filteredOrders.slice(startIndex, endIndex);
       
        setOrders(paginatedOrders);
        setTotalItems(filteredOrders.length);
        setTotalPages(Math.ceil(filteredOrders.length / itemsPerPage));
       
        // Set order stats from response if available, otherwise calculate
        if (response.data.count !== undefined) {
          setOrderStats(prev => ({
            ...prev,
            totalOrders: response.data.count,
            pendingOrders: response.data.count
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching pending orders:', error);
      toast.error(error.response?.data?.error || 'Failed to fetch pending orders');
    } finally {
      setLoading(false);
    }
  }, [base_url, token, currentPage, itemsPerPage, searchTerm, selectedFilters]);
  
  // Initial fetch and on dependencies change
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);
  
  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchOrders();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  // Handle filter changes
  useEffect(() => {
    setCurrentPage(1);
    fetchOrders();
  }, [selectedFilters]);
  
  // Check if all orders on current page are selected
  const allOrdersSelected = selectedOrders.length === orders.length && orders.length > 0;
  
  // Check if all filtered orders are selected
  const allFilteredOrdersSelected = selectedOrders.length === totalItems && totalItems > 0;
  
  // Handle delete single order
  const handleDeleteOrder = async () => {
    if (!selectedOrder) {
      toast.error('No order selected for deletion');
      return;
    }
    
    try {
      setIsDeleting(true);
      const response = await axios.delete(`${base_url}/api/sub-admin/orders/${selectedOrder._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        toast.success('Order deleted successfully');
        setShowDeleteModal(false);
        setSelectedOrder(null);
        fetchOrders();
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error(error.response?.data?.error || 'Failed to delete order');
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Handle delete all orders
  const handleDeleteAllOrders = async () => {
    if (deleteAllConfirmation !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }
   
    if (selectedOrders.length === 0) {
      toast.error('No orders selected for deletion');
      return;
    }
    
    try {
      setIsDeleting(true);
     
      const response = await axios.delete(`${base_url}/api/sub-admin/orders/delete-all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: {
          orderIds: selectedOrders
        }
      });
      
      if (response.data.success) {
        toast.success(`Successfully deleted ${selectedOrders.length} orders`);
        setShowDeleteAllModal(false);
        setDeleteAllConfirmation('');
        setSelectedOrders([]);
        fetchOrders();
      }
    } catch (error) {
      console.error('Error deleting orders:', error);
      toast.error(error.response?.data?.error || 'Failed to delete orders');
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Handle bulk actions
  const handleBulkAction = async () => {
    if (!bulkAction || selectedOrders.length === 0) {
      toast.error('Please select an action and orders');
      return;
    }
    
    try {
      const response = await axios.put(
        `${base_url}/api/sub-admin/orders/bulk/status`,
        {
          orderIds: selectedOrders,
          status: bulkAction
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.success) {
        toast.success(`Successfully updated ${selectedOrders.length} orders to ${bulkAction}`);
        setBulkAction('');
        setSelectedOrders([]);
        fetchOrders();
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast.error(error.response?.data?.error || 'Failed to perform bulk action');
    }
  };
  
  // Handle mark order as completed
  const handleMarkAsCompleted = async (orderId) => {
    try {
      const response = await axios.post(
        `${base_url}/api/sub-admin/orders/${orderId}/complete`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.success) {
        toast.success('Order marked as completed');
        fetchOrders();
      }
    } catch (error) {
      console.error('Error marking order as completed:', error);
      toast.error(error.response?.data?.error || 'Failed to mark order as completed');
    }
  };
  
  // NEW: Handle order cancellation with reason
  const handleOrderCancellation = async () => {
    if (!cancellingOrder) {
      toast.error('No order selected for cancellation');
      return;
    }
    
    // Validate cancellation reason
    if (!cancellationReason || cancellationReason.trim() === '') {
      toast.error('Please provide a cancellation reason');
      return;
    }
    
    if (cancellationReason.trim().length < 5) {
      toast.error('Cancellation reason must be at least 5 characters long');
      return;
    }
    
    try {
      setIsCancelling(true);
      
      // Make API call to cancel order with reason
      const response = await axios.post(
        `${base_url}/api/sub-admin/orders/${cancellingOrder._id}/cancel`,
        {
          cancellationReason: cancellationReason.trim()
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.success) {
        toast.success('Order cancelled successfully');
        
        // Close modal and reset state
        setShowCancelModal(false);
        setCancellingOrder(null);
        setCancellationReason('');
        
        // Refresh orders list
        fetchOrders();
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      
      // Show detailed error message
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to cancel order. Please try again.');
      }
    } finally {
      setIsCancelling(false);
    }
  };
  
  // NEW: Open cancellation modal
  const openCancelModal = (order) => {
    setCancellingOrder(order);
    setCancellationReason('');
    setShowCancelModal(true);
  };
  
  // NEW: Close cancellation modal
  const closeCancelModal = () => {
    setShowCancelModal(false);
    setCancellingOrder(null);
    setCancellationReason('');
  };
  
  // Open delete modal for single order
  const openDeleteModal = (order) => {
    setSelectedOrder(order);
    setShowDeleteModal(true);
  };
  
  // Close delete modal
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedOrder(null);
  };
  
  // Navigate to view order page
  const navigateToViewOrder = (order) => {
    navigate(`/admin/orders/view/${order._id}`);
  };
  
  // Navigate to update order page
  const navigateToUpdateOrder = (order) => {
    navigate(`/admin/orders/update/${order._id}`);
  };
  
  // Toggle select order for bulk action
  const toggleSelectOrder = (orderId) => {
    setSelectedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };
  
  // Select all orders on current page
  const selectAllOrders = () => {
    if (allOrdersSelected) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map(order => order._id));
    }
  };
  
  // Select all filtered orders
  const selectAllFilteredOrders = () => {
    const filteredOrders = filterAndSortOrders(allOrders);
    const filteredOrderIds = filteredOrders.map(order => order._id);
   
    if (allFilteredOrdersSelected) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrderIds);
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Get status badge color
  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 border-[1px] border-green-500 text-green-800';
      case 'processing': return 'bg-blue-100 border-[1px] border-blue-500 text-blue-800';
      case 'pending': return 'bg-yellow-100 border-[1px] border-yellow-500 text-yellow-800';
      case 'cancelled': return 'bg-red-100 border-[1px] border-red-500 text-red-800';
      default: return 'bg-gray-100 border-[1px] border-gray-500 text-gray-800';
    }
  };
  
  // Get order type icon
  const getOrderTypeIcon = (type) => {
    switch (type) {
      case 'text_file': return <FileText className="w-4 h-4" />;
      case 'pdf_file': return <File className="w-4 h-4" />;
      case 'image_file': return <Image className="w-4 h-4" />;
      case 'document_file': return <FileType className="w-4 h-4" />;
      default: return <File className="w-4 h-4" />;
    }
  };
  
  // Get order type text
  const getOrderTypeText = (type) => {
    switch (type) {
      case 'text_file': return 'Text File';
      case 'pdf_file': return 'PDF File';
      case 'image_file': return 'Image File';
      case 'document_file': return 'Document File';
      default: return type;
    }
  };
  
  // Check if order has admin output
  const hasAdminOutput = (order) => {
    if (order.orderType === 'pdf_file') {
      return !!(order.adminPdfFile && order.adminPdfFile.fileName);
    } else if (order.orderType === 'text_file') {
      return !!order.adminTextContent;
    }
    return false;
  };
  
  // Download PDF file
  const downloadPdfFile = async (orderId) => {
    try {
      const response = await axios.get(
        `${base_url}/api/admin/orders/${orderId}/download-pdf`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          responseType: 'blob'
        }
      );
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `order-${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
     
      toast.success('PDF file downloaded successfully');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error(error.response?.data?.error || 'Failed to download PDF file');
    }
  };
  
  // View PDF file
  const viewPdfFile = async (orderId) => {
    try {
      const response = await axios.get(
        `${base_url}/api/admin/orders/${orderId}/view-pdf`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          responseType: 'blob'
        }
      );
      
      // Open PDF in new tab
      const url = window.URL.createObjectURL(new Blob([response.data]));
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error viewing PDF:', error);
      toast.error(error.response?.data?.error || 'Failed to view PDF file');
    }
  };
  
  // Toggle filter dropdown
  const toggleFilterDropdown = (filterType) => {
    setShowFilterDropdown(prev => ({
      ...prev,
      [filterType]: !prev[filterType]
    }));
  };
  
  // Handle filter selection
  const handleFilterSelect = (filterType, value) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    setShowFilterDropdown(prev => ({
      ...prev,
      [filterType]: false
    }));
  };
  
  // Clear all filters
  const clearAllFilters = () => {
    setSelectedFilters({
      status: '',
      orderType: '',
      sort: 'newest'
    });
    setSearchTerm('');
  };
  
  // Copy order ID to clipboard
  const copyOrderId = (orderId) => {
    navigator.clipboard.writeText(orderId);
    toast.success('Order ID copied to clipboard');
  };
  
  // Custom scrollbar CSS
  const customScrollbarStyles = `
    .custom-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: #cbd5e1 #f1f5f9;
    }
   
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
   
    .custom-scrollbar::-webkit-scrollbar-track {
      background: #f1f5f9;
      border-radius: 3px;
    }
   
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background-color: #cbd5e1;
      border-radius: 3px;
    }
   
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background-color: #94a3b8;
    }
  `;
  
  // Statistics Cards Component
  const StatisticsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Pending Orders</p>
            <p className="text-2xl font-bold text-gray-800">{statistics?.totalOrders || 0}</p>
          </div>
          <Package className="w-8 h-8 text-yellow-500" />
        </div>
        <div className="mt-2 text-xs text-gray-500">
          <span className="text-green-600">Amount: ৳{(statistics?.totalAmount || 0)?.toLocaleString()}</span>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Order Types</p>
            <div className="flex flex-wrap gap-1 mt-1">
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">Text: {statistics?.textOrders || 0}</span>
              <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded">PDF: {statistics?.pdfOrders || 0}</span>
            </div>
          </div>
          <FileText className="w-8 h-8 text-blue-500" />
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Recent (7 days)</p>
            <p className="text-2xl font-bold text-gray-800">
              {statistics?.recentOrders || 0}
            </p>
          </div>
          <Calendar className="w-8 h-8 text-orange-500" />
        </div>
        <div className="mt-2 text-xs text-gray-500">
          New orders this week
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Avg. Amount</p>
            <p className="text-2xl font-bold text-gray-800">
              ৳{statistics?.totalOrders ? Math.round(statistics.totalAmount / statistics.totalOrders) : 0}
            </p>
          </div>
          <FaBangladeshiTakaSign className="w-8 h-8 text-green-500" />
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Per order average
        </div>
      </div>
    </div>
  );

  return (
    <div className="font-anek text-gray-700 lg:ml-72 mt-[9vh]">
      <style>{customScrollbarStyles}</style>
      <Header toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />
      <Toaster />
    
      <main className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="w-full mx-auto">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-theme_color2 mb-1">Pending Orders</h1>
            <p className="text-gray-600 mt-1">Manage and process pending customer orders</p>
          </div>
          
          {/* Statistics Cards */}
         <StatisticsCards />
          
          {/* Main Content Card */}
          <div className="bg-white rounded-lg border-[1px] border-gray-200 overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Search and Filters */}
                <div className="flex flex-col md:flex-row md:items-center gap-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search pending orders by order ID, customer, service..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme_color2"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {/* Status Filter - Only show pending status or hide it since all are pending */}
                    <div className="relative" ref={statusDropdownRef}>
                      <button
                        onClick={() => toggleFilterDropdown('status')}
                        className="inline-flex items-center px-4 py-2 cursor-pointer border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                      >
                        <Filter size={16} />
                        <span className="ml-2 text-sm">
                          {selectedFilters.status ? `Status: ${selectedFilters.status}` : "Status"}
                        </span>
                        {selectedFilters.status && (
                          <span className="ml-2 w-2 h-2 bg-theme_color2 rounded-full"></span>
                        )}
                      </button>
                     
                      {showFilterDropdown.status && (
                        <div className="absolute top-full left-0 mt-1 w-48 cursor-pointer  max-h-[200px] overflow-y-auto bg-white rounded-lg shadow-lg border border-gray-200 z-50 custom-scrollbar">
                          <div className="p-2">
                            {[
                              { value: 'pending', label: 'Pending' },
                              { value: 'processing', label: 'Processing' },
                              { value: 'completed', label: 'Completed' },
                              { value: 'cancelled', label: 'Cancelled' }
                            ].map((option) => (
                              <button
                                key={option.value}
                                onClick={() => handleFilterSelect('status', option.value)}
                                className={`w-full text-left px-3 text-nowrap py-2 mb-1 rounded  cursor-pointer transition-colors duration-150 ${
                                  selectedFilters.status === option.value ? 'text-theme_color2 font-medium' : 'text-gray-700'
                                }`}
                              >
                                {option.label}
                              </button>
                            ))}
                            <div className="border-t border-gray-200 mt-2 pt-2">
                              <button
                                onClick={() => handleFilterSelect('status', '')}
                                className="w-full text-left px-3 py-2 text-red-600  rounded transition-colors duration-150"
                              >
                                Clear
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Order Type Filter - Directly in JSX */}
                    <div className="relative" ref={orderTypeDropdownRef}>
                      <button
                        onClick={() => toggleFilterDropdown('orderType')}
                        className="inline-flex items-center px-4 py-2 border cursor-pointer border-gray-300 rounded-lg transition-colors duration-200"
                      >
                        <Package size={16} />
                        <span className="ml-2 text-sm">
                          {selectedFilters.orderType ? `Type: ${getOrderTypeText(selectedFilters.orderType)}` : "Order Type"}
                        </span>
                        {selectedFilters.orderType && (
                          <span className="ml-2 w-2 h-2 bg-theme_color2 rounded-full"></span>
                        )}
                      </button>
                     
                      {showFilterDropdown.orderType && (
                        <div className="absolute top-full left-0 mt-1 cursor-pointer w-48 max-h-[200px] overflow-y-auto bg-white rounded-lg shadow-lg border border-gray-200 z-50 custom-scrollbar">
                          <div className="p-2">
                            {[
                              { value: 'text_file', label: 'Text File' },
                              { value: 'pdf_file', label: 'PDF File' },
                              { value: 'image_file', label: 'Image File' },
                              { value: 'document_file', label: 'Document File' }
                            ].map((option) => (
                              <button
                                key={option.value}
                                onClick={() => handleFilterSelect('orderType', option.value)}
                                className={`w-full text-left px-3 text-nowrap py-2 mb-1 rounded  cursor-pointer transition-colors duration-150 ${
                                  selectedFilters.orderType === option.value ? 'text-theme_color2 font-medium' : 'text-gray-700'
                                }`}
                              >
                                {option.label}
                              </button>
                            ))}
                            <div className="border-t border-gray-200 mt-2 pt-2">
                              <button
                                onClick={() => handleFilterSelect('orderType', '')}
                                className="w-full text-left px-3 py-2 text-red-600  rounded transition-colors duration-150"
                              >
                                Clear
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Sort Filter - Directly in JSX */}
                    <div className="relative" ref={sortDropdownRef}>
                      <button
                        onClick={() => toggleFilterDropdown('sort')}
                        className="inline-flex items-center px-4 cursor-pointer py-2 border border-gray-300 rounded-lg  transition-colors duration-200"
                      >
                        <Download size={16} />
                        <span className="ml-2 text-sm">
                          {selectedFilters.sort === 'amount-high' ? 'Sort: Amount High' :
                           selectedFilters.sort === 'amount-low' ? 'Sort: Amount Low' :
                           selectedFilters.sort === 'oldest' ? 'Sort: Oldest First' :
                           'Sort: Newest First'}
                        </span>
                        {selectedFilters.sort !== 'newest' && (
                          <span className="ml-2 w-2 h-2 bg-theme_color2 rounded-full"></span>
                        )}
                      </button>
                     
                      {showFilterDropdown.sort && (
                        <div className="absolute top-full left-0 mt-1 w-48 cursor-pointer max-h-[200px] overflow-y-auto bg-white rounded-lg shadow-lg border border-gray-200 z-50 custom-scrollbar">
                          <div className="p-2">
                            {[
                              { value: 'newest', label: 'Newest First' },
                              { value: 'oldest', label: 'Oldest First' },
                              { value: 'amount-high', label: 'Amount (High to Low)' },
                              { value: 'amount-low', label: 'Amount (Low to High)' }
                            ].map((option) => (
                              <button
                                key={option.value}
                                onClick={() => handleFilterSelect('sort', option.value)}
                                className={`w-full text-left px-3 text-nowrap py-2 mb-1 rounded cursor-pointer transition-colors duration-150 ${
                                  selectedFilters.sort === option.value ? 'text-theme_color2 font-medium' : 'text-gray-700'
                                }`}
                              >
                                {option.label}
                              </button>
                            ))}
                            <div className="border-t border-gray-200 mt-2 pt-2">
                              <button
                                onClick={() => handleFilterSelect('sort', 'newest')}
                                className="w-full text-left px-3 py-2 text-red-600  rounded transition-colors duration-150"
                              >
                                Clear
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Clear All Filters Button */}
                    {(selectedFilters.status || selectedFilters.orderType || selectedFilters.sort !== 'newest' || searchTerm) && (
                      <button
                        onClick={clearAllFilters}
                        className="inline-flex items-center cursor-pointer px-4 py-2 border border-gray-300 text-red-600 rounded-lg  transition-colors duration-200"
                      >
                        <X size={16} className="mr-2" />
                        Clear All
                      </button>
                    )}
                  </div>
                </div>
                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  {selectedOrders.length > 0 && (
                    <div className="flex items-center gap-3">
                      {/* Bulk Complete Button */}
                      <button
                        onClick={() => {
                          setBulkAction('completed');
                          handleBulkAction();
                        }}
                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-[5px] cursor-pointer hover:bg-green-700 text-sm font-medium transition-colors duration-200"
                      >
                        <Check size={16} className="mr-2" />
                        Mark as Completed ({selectedOrders.length})
                      </button>
                      {/* Delete Selected Orders Button */}
                      <button
                        onClick={() => setShowDeleteAllModal(true)}
                        className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-[5px] cursor-pointer hover:bg-red-700 text-sm font-medium transition-colors duration-200"
                      >
                        <Trash2 size={16} className="mr-2" />
                        Delete Selected ({selectedOrders.length})
                      </button>
                    </div>
                  )}
                  <button
                    onClick={fetchOrders}
                    className="inline-flex items-center px-4 cursor-pointer py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    <RefreshCw size={16} className="mr-2" />
                    Refresh
                  </button>
                </div>
              </div>
            </div>
            
            {/* Orders Table */}
            <div className="overflow-x-auto">
              {loading ? (
                 <div className="flex justify-center items-center py-8">
      <div className="flex space-x-2">
        <div className="animate-bounce h-3 w-3 bg-green-500 rounded-full" style={{ animationDelay: '0ms' }}></div>
        <div className="animate-bounce h-3 w-3 bg-green-500 rounded-full" style={{ animationDelay: '150ms' }}></div>
        <div className="animate-bounce h-3 w-3 bg-green-500 rounded-full" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-700">No pending orders found</h3>
                  <p className="text-gray-500 mt-1">All orders have been processed or try adjusting your search</p>
                  <button
                    onClick={clearAllFilters}
                    className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg cursor-pointer transition-colors duration-200"
                  >
                    Clear All Filters
                  </button>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={allOrdersSelected}
                            onChange={selectAllOrders}
                            className="rounded border-gray-300"
                          />
                          {allFilteredOrdersSelected && (
                            <span className="ml-2 text-xs text-red-600 font-medium">
                              All Filtered
                            </span>
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Order ID
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Service
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order._id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedOrders.includes(order._id)}
                            onChange={() => toggleSelectOrder(order._id)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="font-medium text-gray-900">#{order.orderId}</span>
                            <button
                              onClick={() => copyOrderId(order.orderId)}
                              className="ml-2 text-gray-400 hover:text-gray-600"
                              title="Copy Order ID"
                            >
                              <Copy size={14} />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="font-medium text-gray-900">
                              {order.user?.fullname || order.username || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {order.user?.email || order.userEmail || 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {order.service?.workName || order.serviceName || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            ৳{(order.totalAmount || 0)?.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getOrderTypeIcon(order.orderType)}
                            <span className="ml-2 text-sm text-gray-700">
                              {getOrderTypeText(order.orderType)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col space-y-2 ">
                            <span className={`flex justify-center items-center px-2 py-1   text-xs font-semibold rounded-full ${getStatusBadge(order.status)}`}>
                              {order.status}
                            </span>
                            {hasAdminOutput(order) && (
                              <span className="flex justify-center items-center px-2 py-1 text-xs font-semibold rounded-full border-green-500 border-[1px] bg-green-100 text-green-800">
                                Output Submitted
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => navigateToViewOrder(order)}
                              className="bg-blue-600  rounded-[5px] cursor-pointer text-white px-[10px] py-[8px] hover:bg-blue-700 transition-colors duration-150"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                               <button
                                                     onClick={() => navigateToUpdateOrder(order)}
                                                     className={`rounded-[5px] cursor-pointer text-white px-[10px] py-[8px] transition-colors duration-150 ${
                                                       hasAdminOutput(order)
                                                         ? 'bg-green-600 hover:bg-green-700'
                                                         : 'bg-yellow-600 hover:bg-yellow-700'
                                                     }`}
                                                     title={hasAdminOutput(order) ? 'Update Output' : 'Submit Output'}
                                                   >
                                                     <Send size={16} />
                                                   </button>
                            {/* Updated Cancel Button */}
                            <button
                              onClick={() => openCancelModal(order)}
                              className="bg-red-600 rounded-[5px] cursor-pointer text-white px-[10px] py-[8px] hover:bg-red-700 transition-colors duration-150"
                              title="Cancel Order"
                            >
                              <XIcon size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            
            {/* Pagination */}
            {orders.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-700">
                      Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * itemsPerPage, totalItems)}
                      </span>{' '}
                      of <span className="font-medium">{totalItems}</span> pending orders
                    </div>
                   
                    {/* Select All Filtered Orders Button */}
                    {totalItems > itemsPerPage && (
                      <button
                        onClick={selectAllFilteredOrders}
                        className="text-sm text-blue-600 hover:text-blue-800 transition-colors duration-150"
                      >
                        {allFilteredOrdersSelected ? 'Deselect All' : 'Select All'} ({totalItems} orders)
                      </button>
                    )}
                  </div>
                 
                  <div className="flex items-center space-x-2">
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={5}>5 per page</option>
                      <option value={10}>10 per page</option>
                      <option value={20}>20 per page</option>
                      <option value={50}>50 per page</option>
                    </select>
                    <nav className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 h-[35px] cursor-pointer border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-150"
                      >
                        <ChevronLeft size={16} />
                      </button>
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
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 h-[35px] border rounded-lg text-sm transition-colors duration-150 ${
                              currentPage === pageNum
                                ? 'bg-blue-600 text-white cursor-pointer border-blue-600'
                                : 'border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 h-[35px] border cursor-pointer border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-150"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      
      {/* NEW: Cancel Order Modal */}
      {showCancelModal && cancellingOrder && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <AlertTriangle className="w-6 h-6 text-red-500 mr-3" />
                  <h2 className="text-xl font-bold text-gray-800">Cancel Order</h2>
                </div>
                <button
                  onClick={closeCancelModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-150 hover:bg-gray-100 p-1 rounded"
                  disabled={isCancelling}
                >
                  <X size={20} />
                </button>
              </div>
             
              {/* Order Information */}
              <div className="mb-6">
                
                {/* Warning Message */}
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div>
                      <p className="text-sm text-red-700 font-medium">
                        This will mark the order as "Cancelled"
                      </p>
                      <p className="text-xs text-red-600 mt-1">
                        You cannot undo this action. Please provide a clear cancellation reason.
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Cancellation Reason Input */}
                <div className="space-y-2">
                  <label htmlFor="cancellationReason" className="block text-sm font-medium text-gray-700">
                    Cancellation Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="cancellationReason"
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    placeholder="Enter the reason for cancellation (minimum 5 characters)..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none h-32"
                    disabled={isCancelling}
                    autoFocus
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-gray-500">
                      Minimum 5 characters required
                    </p>
                    <p className={`text-xs ${cancellationReason.length < 5 ? 'text-red-500' : 'text-green-500'}`}>
                      {cancellationReason.length}/5
                    </p>
                  </div>
                </div>
              </div>
             
              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeCancelModal}
                  disabled={isCancelling}
                  className="px-4 py-2 text-sm font-medium cursor-pointer border-[1px] border-gray-200 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-150"
                >
                  Cancel
                </button>
                <button
                  onClick={handleOrderCancellation}
                  disabled={isCancelling || cancellationReason.trim().length < 5}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors duration-150 flex items-center ${
                    isCancelling || cancellationReason.trim().length < 5 
                      ? 'bg-red-400 cursor-not-allowed' 
                      : 'bg-red-600 hover:bg-red-700 cursor-pointer'
                  }`}
                >
                  {isCancelling ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    <>
                      Cancel Order
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Single Order Modal */}
      {showDeleteModal  ? <>
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <AlertTriangle className="w-6 h-6 text-red-500 mr-3" />
              <h2 className="text-xl font-bold text-gray-800">Delete Order</h2>
            </div>
            <button
              onClick={closeDeleteModal}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-150 hover:bg-gray-100 p-1 rounded"
            >
              <X size={20} />
            </button>
          </div>
         
          <div className="mb-6">
            <div className="py-4 mb-4">
              <div className="flex">
                <div>
                  <p className="text-sm text-red-700 mt-1">
                    This action will permanently delete this order and all associated files.
                    This cannot be undone!
                  </p>
                </div>
              </div>
            </div>
     
          </div>
         
          <div className="flex justify-end space-x-3">
            <button
              onClick={closeDeleteModal}
              className="px-4 py-2 text-sm font-medium border-[1px] border-gray-200 cursor-pointer text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-150"
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteOrder}
              disabled={isDeleting}
              className={`px-4 py-2 text-sm font-medium cursor-pointer text-white rounded-lg transition-colors duration-150 flex items-center ${
                isDeleting ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 cursor-pointer'
              }`}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Order
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
      </>:""}

      {/* Delete All Orders Modal */}
      {showDeleteAllModal ?
      <>
       <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <AlertTriangle className="w-6 h-6 text-red-500 mr-3" />
              <h2 className="text-xl font-bold text-gray-800">Delete Selected Orders</h2>
            </div>
            <button
              onClick={() => {
                setShowDeleteAllModal(false);
                setDeleteAllConfirmation('');
              }}
              className="text-gray-400 cursor-pointer hover:text-gray-600 transition-colors duration-150 hover:bg-gray-100 p-1 rounded"
            >
              <X size={20} />
            </button>
          </div>
         
          <div className="mb-6">
            <div className=" mb-4 bg-red-50 border-[1px] border-red-500 rounded-[10px] p-[20px]">
              <div className="flex">
              
                  <p className="text-sm text-red-700 mt-1">
                    This action will permanently delete {selectedOrders.length} selected orders and all associated files.
                    This cannot be undone!
                  </p>
              </div>
            </div>
            {/* Confirmation input */}
            <div className="mt-4">
              <p className="text-sm text-gray-700 mb-2">
                Type <span className="font-bold text-red-600">DELETE</span> to confirm:
              </p>
              <input
                type="text"
                value={deleteAllConfirmation}
                onChange={(e) => setDeleteAllConfirmation(e.target.value)}
                placeholder="Type DELETE here"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>
         
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setShowDeleteAllModal(false);
                setDeleteAllConfirmation('');
              }}
              className="px-4 py-2 text-sm font-medium cursor-pointer border-[1px] border-gray-200 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-150"
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteAllOrders}
              disabled={isDeleting || deleteAllConfirmation !== 'DELETE'}
              className={`px-4 py-2 text-sm font-medium text-white cursor-pointer rounded-lg transition-colors duration-150 flex items-center ${
                (isDeleting || deleteAllConfirmation !== 'DELETE') ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 cursor-pointer'
              }`}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete {selectedOrders.length} Orders
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
      </>:""}
    </div>
  );
}

export default Pendingorders;