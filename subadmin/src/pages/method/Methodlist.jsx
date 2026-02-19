import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  ChevronLeft, 
  ChevronRight, 
  Filter,
  Download,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertTriangle,
  X,
  Info,
  Plus,
  Activity,
  Image as ImageIcon,
  Upload,
  Camera
} from 'lucide-react';
import axios from 'axios';
import Header from '../../components/header/Header';
import Sidebar from '../../components/sidebar/Sidebar';
import toast, { Toaster } from 'react-hot-toast';
import {useNavigate} from "react-router-dom";
function Methodlist() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate=useNavigate();
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [statistics, setStatistics] = useState(null);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedMethods, setSelectedMethods] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    agentNumber: '',
    minimumDeposit: '',
    maximumDeposit: '',
    status: 'active'
  });
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [deleteAllConfirmation, setDeleteAllConfirmation] = useState('');
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [isDeletingSingle, setIsDeletingSingle] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const token = localStorage.getItem('adminToken');

  // Fetch deposit methods
  const fetchMethods = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        status: statusFilter,
        sortBy,
        sortOrder,
        search: searchTerm
      };

      const response = await axios.get(`${base_url}/api/admin/deposit-methods`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params
      });

      if (response.data.success) {
        setMethods(response.data.data);
        setTotalItems(response.data.count);
        setTotalPages(Math.ceil(response.data.count / itemsPerPage));
      }
    } catch (error) {
      console.error('Error fetching deposit methods:', error);
      toast.error(error.response?.data?.error || 'Failed to load deposit methods');
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, statusFilter, sortBy, sortOrder, searchTerm, base_url, token]);

  // Fetch statistics
  const fetchStatistics = useCallback(async () => {
    try {
      const response = await axios.get(`${base_url}/api/admin/deposit-methods/stats/overview`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setStatistics(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  }, [base_url, token]);

  // Initial fetch
  useEffect(() => {
    fetchMethods();
    fetchStatistics();
  }, [fetchMethods, fetchStatistics]);

  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Handle status filter change
  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  // Handle sort change
  const handleSortChange = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  // Handle items per page change
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(parseInt(e.target.value));
    setCurrentPage(1);
  };

  // Toggle method selection
  const toggleSelectMethod = (methodId) => {
    if (selectedMethods.includes(methodId)) {
      setSelectedMethods(selectedMethods.filter(id => id !== methodId));
    } else {
      setSelectedMethods([...selectedMethods, methodId]);
    }
  };

  // Select all methods
  const selectAllMethods = () => {
    if (selectedMethods.length === methods.length) {
      setSelectedMethods([]);
    } else {
      setSelectedMethods(methods.map(method => method._id));
    }
  };

  // Open edit modal
  const openEditModal = (method) => {
    setSelectedMethod(method);
    setFormData({
      name: method.name,
      description: method.description,
      agentNumber: method.agentNumber,
      minimumDeposit: method.minimumDeposit.toString(),
      maximumDeposit: method.maximumDeposit.toString(),
      status: method.status
    });
    
    // Reset image states
    if (editImagePreview) {
      URL.revokeObjectURL(editImagePreview);
    }
    setEditImageFile(null);
    setEditImagePreview(null);
    
    setShowEditModal(true);
  };

  // Open view modal
  const openViewModal = (method) => {
    setSelectedMethod(method);
    setShowViewModal(true);
  };

  // Open delete modal
  const openDeleteModal = (method) => {
    setSelectedMethod(method);
    setShowDeleteModal(true);
  };

  // Open image modal
  const openImageModal = (method) => {
    setSelectedMethod(method);
    setShowImageModal(true);
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle edit image change
  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only image files are allowed (JPEG, JPG, PNG, GIF, WebP)');
        return;
      }
      
      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      
      setEditImageFile(file);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setEditImagePreview(previewUrl);
    }
  };

  // Handle remove edit image
  const handleRemoveEditImage = () => {
    if (editImagePreview) {
      URL.revokeObjectURL(editImagePreview);
    }
    setEditImageFile(null);
    setEditImagePreview(null);
  };

  // Handle form submission (update)
  const handleUpdate = async (e) => {
    e.preventDefault();
    
    if (editImageFile) {
      // Handle image upload first
      await handleImageUpload();
    }
    
    try {
      setIsUpdating(true);
      const response = await axios.put(
        `${base_url}/api/admin/deposit-methods/${selectedMethod._id}`,
        {
          ...formData,
          minimumDeposit: parseFloat(formData.minimumDeposit),
          maximumDeposit: parseFloat(formData.maximumDeposit),
          removeImage: editImageFile === null && selectedMethod.image ? 'true' : undefined
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        toast.success(response.data.message || 'Deposit method updated successfully');
        fetchMethods();
        fetchStatistics();
        
        // Clean up image preview
        if (editImagePreview) {
          URL.revokeObjectURL(editImagePreview);
        }
        
        setShowEditModal(false);
      }
    } catch (error) {
      console.error('Error updating deposit method:', error);
      toast.error(error.response?.data?.error || 'Failed to update deposit method');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle image upload
  const handleImageUpload = async () => {
    if (!editImageFile) return;
    
    try {
      setIsUploadingImage(true);
      const formDataObj = new FormData();
      formDataObj.append('image', editImageFile);
      
      const response = await axios.patch(
        `${base_url}/api/admin/deposit-methods/${selectedMethod._id}/image`,
        formDataObj,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        toast.success('Image updated successfully');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
      throw error;
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Handle delete image
  const handleDeleteImage = async () => {
    try {
      const response = await axios.delete(
        `${base_url}/api/admin/deposit-methods/${selectedMethod._id}/image`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        toast.success(response.data.message || 'Image deleted successfully');
        fetchMethods();
        setShowImageModal(false);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error(error.response?.data?.error || 'Failed to delete image');
    }
  };

  // Handle delete method
  const handleDeleteMethod = async () => {
    try {
      setIsDeletingSingle(true);
      const response = await axios.delete(
        `${base_url}/api/admin/deposit-methods/${selectedMethod._id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        toast.success(response.data.message || 'Deposit method deleted successfully');
        fetchMethods();
        fetchStatistics();
        setShowDeleteModal(false);
      }
    } catch (error) {
      console.error('Error deleting deposit method:', error);
      toast.error(error.response?.data?.error || 'Failed to delete deposit method');
    } finally {
      setIsDeletingSingle(false);
    }
  };

  // Handle toggle status
  const handleToggleStatus = async (methodId, currentStatus) => {
    try {
      setIsTogglingStatus(true);
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      
      const response = await axios.patch(
        `${base_url}/api/admin/deposit-methods/${methodId}/status`,
        { status: newStatus },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        toast.success(`Status changed to ${newStatus}`);
        fetchMethods();
        fetchStatistics();
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error(error.response?.data?.error || 'Failed to update status');
    } finally {
      setIsTogglingStatus(false);
    }
  };

  // Handle bulk actions
  const handleBulkAction = async () => {
    if (!bulkAction || selectedMethods.length === 0) {
      toast.error('Please select an action and methods');
      return;
    }

    try {
      if (bulkAction === 'delete') {
        setShowDeleteAllModal(true);
      } else if (bulkAction === 'activate') {
        await Promise.all(selectedMethods.map(id => 
          axios.patch(`${base_url}/api/admin/deposit-methods/${id}/status`, 
            { status: 'active' },
            { headers: { 'Authorization': `Bearer ${token}` } }
          )
        ));
        toast.success('Selected methods activated successfully');
        fetchMethods();
        fetchStatistics();
        setSelectedMethods([]);
        setBulkAction('');
      } else if (bulkAction === 'deactivate') {
        await Promise.all(selectedMethods.map(id => 
          axios.patch(`${base_url}/api/admin/deposit-methods/${id}/status`, 
            { status: 'inactive' },
            { headers: { 'Authorization': `Bearer ${token}` } }
          )
        ));
        toast.success('Selected methods deactivated successfully');
        fetchMethods();
        fetchStatistics();
        setSelectedMethods([]);
        setBulkAction('');
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast.error('Failed to perform bulk action');
    }
  };

  // Handle delete all selected
  const handleDeleteAllSelected = async () => {
    try {
      setIsDeletingAll(true);
      await Promise.all(selectedMethods.map(id => 
        axios.delete(`${base_url}/api/admin/deposit-methods/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ));
      toast.success('Selected methods deleted successfully');
      fetchMethods();
      fetchStatistics();
      setSelectedMethods([]);
      setShowDeleteAllModal(false);
      setDeleteAllConfirmation('');
      setBulkAction('');
    } catch (error) {
      console.error('Error deleting methods:', error);
      toast.error('Failed to delete selected methods');
    } finally {
      setIsDeletingAll(false);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setSortBy('name');
    setSortOrder('asc');
    setCurrentPage(1);
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'inactive':
        return <XCircle size={16} className="text-red-500" />;
      case 'maintenance':
        return <AlertTriangle size={16} className="text-yellow-500" />;
      default:
        return <Info size={16} className="text-gray-500" />;
    }
  };

  // Get image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    // If it's already a full URL, return as is
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // Otherwise, construct the full URL
    return `${base_url}${imagePath}`;
  };

  // Custom Toggle Switch Component
  const ToggleSwitch = ({ isActive, onChange, disabled, methodId }) => {
    return (
      <button
        type="button"
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
          isActive ? 'bg-green-600' : 'bg-gray-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onClick={() => !disabled && onChange(methodId, isActive ? 'active' : 'inactive')}
        disabled={disabled}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
            isActive ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
        {/* Status labels */}
        <span className={`absolute left-1.5 text-[10px] font-medium ${
          isActive ? 'text-white' : 'text-gray-700 opacity-0'
        }`}>
          ON
        </span>
        <span className={`absolute right-1.5 text-[10px] font-medium ${
          !isActive ? 'text-gray-700' : 'text-white opacity-0'
        }`}>
          OFF
        </span>
      </button>
    );
  };

  // Alternative Toggle Switch with sliding animation
  const SlidingToggleSwitch = ({ isActive, onChange, disabled, methodId }) => {
    return (
      <div className="relative inline-block">
        <button
          type="button"
          className={`relative inline-flex h-7 w-14 items-center rounded-full shadow-inner transition-colors duration-300 ${
            isActive ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-gray-300 to-gray-400'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          onClick={() => !disabled && onChange(methodId, isActive ? 'active' : 'inactive')}
          disabled={disabled}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-all duration-300 ${
              isActive ? 'translate-x-8' : 'translate-x-1'
            }`}
          />
        </button>
        <span className={`absolute -top-6 left-0 text-xs font-medium whitespace-nowrap ${
          isActive ? 'text-green-600' : 'text-gray-500'
        }`}>
          {isActive ? 'Active' : 'Inactive'}
        </span>
      </div>
    );
  };

  // Circular Toggle Switch
  const CircularToggleSwitch = ({ isActive, onChange, disabled, methodId }) => {
    return (
      <button
        type="button"
        className={`relative inline-flex items-center justify-center h-8 w-8 rounded-full transition-all duration-300 ${
          isActive 
            ? 'bg-gradient-to-br from-green-400 to-green-600 shadow-lg shadow-green-200' 
            : 'bg-gradient-to-br from-gray-300 to-gray-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
        onClick={() => !disabled && onChange(methodId, isActive ? 'active' : 'inactive')}
        disabled={disabled}
        title={isActive ? 'Active - Click to deactivate' : 'Inactive - Click to activate'}
      >
        {isActive ? (
          <CheckCircle size={16} className="text-white" />
        ) : (
          <XCircle size={16} className="text-gray-600" />
        )}
        
        {/* Animated ring for active state */}
        {isActive && (
          <span className="absolute inset-0 rounded-full border-2 border-green-300 animate-ping opacity-75"></span>
        )}
      </button>
    );
  };

  // Modern Toggle Switch with better UX
  const ModernToggleSwitch = ({ isActive, onChange, disabled, methodId }) => {
    return (
      <div className="flex flex-col items-center">
        <button
          type="button"
          className={`relative inline-flex h-7 w-14 items-center rounded-full transition-all duration-500 ${
            isActive 
              ? 'bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-600 shadow-lg shadow-green-200/50' 
              : 'bg-gradient-to-r from-gray-300 via-gray-400 to-gray-500'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}`}
          onClick={() => !disabled && onChange(methodId, isActive ? 'active' : 'inactive')}
          disabled={disabled}
        >
          {/* Knob */}
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-all duration-500 ${
              isActive ? 'translate-x-8 scale-110' : 'translate-x-1 scale-100'
            }`}
          >
            {/* Inner dot */}
            <span className={`absolute inset-1 rounded-full transition-colors duration-300 ${
              isActive ? 'bg-green-400' : 'bg-gray-400'
            }`}></span>
          </span>
          
          {/* Icon inside knob */}
          <span className={`absolute transform transition-all duration-500 ${
            isActive ? 'translate-x-2 opacity-0' : 'translate-x-10 opacity-0'
          }`}>
            {isActive ? (
              <CheckCircle size={10} className="text-green-500" />
            ) : (
              <XCircle size={10} className="text-gray-500" />
            )}
          </span>
        </button>
        
        {/* Status text */}
        <span className={`text-xs font-medium mt-1 transition-colors duration-300 ${
          isActive ? 'text-green-600' : 'text-gray-500'
        }`}>
          {isActive ? 'ACTIVE' : 'INACTIVE'}
        </span>
      </div>
    );
  };

  // Statistics Cards Component
  const StatisticsCards = () => {
    if (!statistics) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Methods</p>
              <p className="text-2xl font-bold text-gray-800">{statistics.totalMethods || 0}</p>
            </div>
            <div className="bg-blue-100 p-2 rounded-full">
              <Activity size={24} className="text-blue-600" />
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            <span className="text-green-600 font-medium">+{statistics.recentMethods || 0} recent</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Methods</p>
              <p className="text-2xl font-bold text-green-600">{statistics.activeMethods || 0}</p>
            </div>
            <div className="bg-green-100 p-2 rounded-full">
              <CheckCircle size={24} className="text-green-600" />
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {statistics.totalMethods > 0 && (
              <span>{Math.round((statistics.activeMethods / statistics.totalMethods) * 100)}% of total</span>
            )}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Inactive Methods</p>
              <p className="text-2xl font-bold text-red-600">{statistics.inactiveMethods || 0}</p>
            </div>
            <div className="bg-red-100 p-2 rounded-full">
              <XCircle size={24} className="text-red-600" />
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {statistics.totalMethods > 0 && (
              <span>{Math.round((statistics.inactiveMethods / statistics.totalMethods) * 100)}% of total</span>
            )}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Deposit Range</p>
              <p className="text-lg font-bold text-gray-800">
                ৳{statistics.avgMinimumDeposit ? statistics.avgMinimumDeposit.toLocaleString() : 0} - ৳{statistics.avgMaximumDeposit ? statistics.avgMaximumDeposit.toLocaleString() : 0}
              </p>
            </div>
            <div className="bg-purple-100 p-2 rounded-full">
              <Filter size={24} className="text-purple-600" />
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">Average min-max range</div>
        </div>
      </div>
    );
  };

  // Custom scrollbar styles
  const customScrollbarStyles = `
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 3px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 3px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #a1a1a1;
    }
  `;

  return (
    <div className="font-anek text-gray-700 lg:ml-72 mt-[9vh]">
      <style>{customScrollbarStyles}</style>
      <Header toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />
      <Toaster position="top-right" />
     
      <main className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="w-full mx-auto">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-teal-600 mb-1">Deposit Methods</h1>
            <p className="text-gray-600 mt-1">Manage all deposit methods for user transactions</p>
          </div>

          {/* Statistics Cards */}
          <StatisticsCards />

          {/* Filters and Search Bar */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by name or agent number..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-3">
                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={handleStatusFilterChange}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">Maintenance</option>
                </select>

                {/* Sort Options */}
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field);
                    setSortOrder(order);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="minimumDeposit-asc">Min Deposit (Low-High)</option>
                  <option value="minimumDeposit-desc">Min Deposit (High-Low)</option>
                  <option value="maximumDeposit-asc">Max Deposit (Low-High)</option>
                  <option value="maximumDeposit-desc">Max Deposit (High-Low)</option>
                  <option value="createdAt-desc">Newest First</option>
                  <option value="createdAt-asc">Oldest First</option>
                </select>

                {/* Items per Page */}
                <select
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="10">10 per page</option>
                  <option value="25">25 per page</option>
                  <option value="50">50 per page</option>
                  <option value="100">100 per page</option>
                </select>

                {/* Reset Filters */}
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <RefreshCw size={16} />
                  Reset
                </button>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedMethods.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="text-sm text-blue-700">
                    <span className="font-medium">{selectedMethods.length} method(s) selected</span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <select
                      value={bulkAction}
                      onChange={(e) => setBulkAction(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      <option value="">Bulk Actions</option>
                      <option value="activate">Activate</option>
                      <option value="deactivate">Deactivate</option>
                      <option value="delete">Delete</option>
                    </select>
                    <button
                      onClick={handleBulkAction}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Apply
                    </button>
                    <button
                      onClick={() => setSelectedMethods([])}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Clear Selection
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Methods Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
               <div className="text-center py-12">
                             <RefreshCw className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
                             <h3 className="text-lg font-medium text-gray-700">Loading Methods...</h3>
                           </div>
            ) : methods.length === 0 ? (
              <div className="p-12 text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No deposit methods found</h3>
                <p className="text-gray-500">
                  {searchTerm || statusFilter ? 'Try changing your filters' : 'No deposit methods have been created yet'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedMethods.length === methods.length && methods.length > 0}
                            onChange={selectAllMethods}
                            className="rounded border-gray-300"
                          />
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                        onClick={() => handleSortChange('name')}
                      >
                        <div className="flex items-center">
                          Image
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                        onClick={() => handleSortChange('name')}
                      >
                        <div className="flex items-center">
                          Name
                          {sortBy === 'name' && (
                            <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Account Number
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                        onClick={() => handleSortChange('minimumDeposit')}
                      >
                        <div className="flex items-center">
                          Min Deposit
                          {sortBy === 'minimumDeposit' && (
                            <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                        onClick={() => handleSortChange('maximumDeposit')}
                      >
                        <div className="flex items-center">
                          Max Deposit
                          {sortBy === 'maximumDeposit' && (
                            <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                        onClick={() => handleSortChange('createdAt')}
                      >
                        <div className="flex items-center">
                          Created
                          {sortBy === 'createdAt' && (
                            <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {methods.map((method) => (
                      <tr key={method._id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedMethods.includes(method._id)}
                            onChange={() => toggleSelectMethod(method._id)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div 
                              className="flex-shrink-0 h-10 w-10 rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => openImageModal(method)}
                            >
                              {method.image ? (
                                <img 
                                  src={getImageUrl(method.image)} 
                                  alt={method.name}
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="%239ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
                                  }}
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center bg-gray-200">
                                  <ImageIcon size={20} className="text-gray-400" />
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="ml-4">
                              <div className="font-medium text-gray-900">{method.name}</div>
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {method.description.length > 50 
                                  ? `${method.description.substring(0, 50)}...` 
                                  : method.description}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-mono">{method.agentNumber}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            ৳{method.minimumDeposit.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            ৳{method.maximumDeposit.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            
                            {/* Choose one of the toggle switch designs below */}
                            
                            {/* Option 1: Simple Toggle Switch */}
                            {/* <ToggleSwitch 
                              isActive={method.status === 'active'}
                              onChange={handleToggleStatus}
                              disabled={isTogglingStatus}
                              methodId={method._id}
                            /> */}
                            
                            {/* Option 2: Sliding Toggle Switch */}
                            {/* <SlidingToggleSwitch 
                              isActive={method.status === 'active'}
                              onChange={handleToggleStatus}
                              disabled={isTogglingStatus}
                              methodId={method._id}
                            /> */}
                            
                            {/* Option 3: Circular Toggle Switch */}
                            {/* <CircularToggleSwitch 
                              isActive={method.status === 'active'}
                              onChange={handleToggleStatus}
                              disabled={isTogglingStatus}
                              methodId={method._id}
                            /> */}
                            
                            {/* Option 4: Modern Toggle Switch (Recommended) */}
                            <ModernToggleSwitch 
                              isActive={method.status === 'active'}
                              onChange={handleToggleStatus}
                              disabled={isTogglingStatus}
                              methodId={method._id}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(method.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => openViewModal(method)}
                              className="bg-blue-600 rounded-[5px] text-white px-[10px] py-[8px] hover:bg-blue-700 transition-colors duration-150"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() =>navigate(`/admin/payment-methods/edit/${method._id}`)}
                              className="bg-teal-600 rounded-[5px] text-white px-[10px] py-[8px] hover:bg-teal-700 transition-colors duration-150"
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => openDeleteModal(method)}
                              className="bg-red-600 rounded-[5px] text-white px-[10px] py-[8px] hover:bg-red-700 transition-colors duration-150"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {methods.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="text-sm text-gray-700">
                    Showing <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of{' '}
                    <span className="font-medium">{totalItems}</span> methods
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
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
                          className={`px-3 py-1 rounded-md ${
                            currentPage === pageNum
                              ? 'bg-teal-600 text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* View Modal */}
      {showViewModal && selectedMethod && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Deposit Method Details</h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div 
                    className="flex-shrink-0 h-20 w-20 rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => openImageModal(selectedMethod)}
                  >
                    {selectedMethod.image ? (
                      <img 
                        src={getImageUrl(selectedMethod.image)} 
                        alt={selectedMethod.name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="%239ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
                        }}
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-gray-200">
                        <ImageIcon size={32} className="text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-gray-900">{selectedMethod.name}</h4>
                    <div className={`inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-sm font-medium ${getStatusBadge(selectedMethod.status)}`}>
                      {getStatusIcon(selectedMethod.status)}
                      <span className="ml-1 capitalize">{selectedMethod.status}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Agent Number</label>
                    <p className="text-gray-900 font-mono bg-gray-50 p-2 rounded">{selectedMethod.agentNumber}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Deposit</label>
                    <p className="text-gray-900 font-bold text-lg">৳{selectedMethod.minimumDeposit.toLocaleString()}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Deposit</label>
                    <p className="text-gray-900 font-bold text-lg">৳{selectedMethod.maximumDeposit.toLocaleString()}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Created Date</label>
                    <p className="text-gray-900">{formatDate(selectedMethod.createdAt)}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded whitespace-pre-wrap">{selectedMethod.description}</p>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedMethod && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Edit Deposit Method</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleUpdate}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Agent Number *
                    </label>
                    <input
                      type="text"
                      name="agentNumber"
                      value={formData.agentNumber}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Minimum Deposit *
                      </label>
                      <input
                        type="number"
                        name="minimumDeposit"
                        value={formData.minimumDeposit}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Maximum Deposit *
                      </label>
                      <input
                        type="number"
                        name="maximumDeposit"
                        value={formData.maximumDeposit}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <div className="flex items-center space-x-4">
                      <ModernToggleSwitch 
                        isActive={formData.status === 'active'}
                        onChange={(methodId, newStatus) => {
                          setFormData(prev => ({ ...prev, status: newStatus }));
                        }}
                        disabled={false}
                        methodId={selectedMethod._id}
                      />
                      <span className="text-sm text-gray-600">
                        {formData.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {/* Image Upload Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Method Image
                    </label>
                    
                    <div className="flex items-center space-x-6">
                      {/* Current Image */}
                      <div className="relative">
                        {selectedMethod.image ? (
                          <div className="relative group">
                            <img 
                              src={getImageUrl(selectedMethod.image)} 
                              alt="Current" 
                              className="w-24 h-24 object-cover rounded-lg border border-gray-300"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="%239ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
                              }}
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <Eye size={20} className="text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-24 h-24 bg-gray-200 rounded-lg border border-gray-300 flex items-center justify-center">
                            <ImageIcon size={24} className="text-gray-400" />
                          </div>
                        )}
                        <div className="text-xs text-gray-500 text-center mt-1">Current</div>
                      </div>

                      {/* New Image Preview */}
                      {editImagePreview && (
                        <div className="relative">
                          <img 
                            src={editImagePreview} 
                            alt="New" 
                            className="w-24 h-24 object-cover rounded-lg border-2 border-green-500"
                          />
                          <button
                            type="button"
                            onClick={handleRemoveEditImage}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                          >
                            <X size={12} />
                          </button>
                          <div className="text-xs text-green-600 text-center mt-1">New</div>
                        </div>
                      )}

                      {/* Upload Button */}
                      <div>
                        <input
                          type="file"
                          id="editImageUpload"
                          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                          onChange={handleEditImageChange}
                          className="hidden"
                        />
                        <label
                          htmlFor="editImageUpload"
                          className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                        >
                          <Upload size={16} className="mr-2" />
                          {editImagePreview ? 'Change Image' : 'Upload New Image'}
                        </label>
                        <div className="text-xs text-gray-500 mt-1">
                          JPEG, PNG, GIF, WebP (Max 5MB)
                        </div>
                        {editImagePreview === null && selectedMethod.image && (
                          <button
                            type="button"
                            onClick={handleRemoveEditImage}
                            className="mt-2 text-xs text-red-600 hover:text-red-700"
                          >
                            Remove current image
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {isUploadingImage && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div className="bg-green-600 h-1.5 rounded-full animate-pulse" style={{ width: '50%' }}></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Uploading image...</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description *
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="4"
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div className="mt-8 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                    disabled={isUpdating}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors disabled:opacity-50"
                    disabled={isUpdating}
                  >
                    {isUpdating ? 'Updating...' : 'Update Method'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedMethod && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
                Delete Deposit Method
              </h3>
              <p className="text-sm text-gray-500 text-center mb-6">
                Are you sure you want to delete <span className="font-semibold">{selectedMethod.name}</span>? This action cannot be undone.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={isDeletingSingle}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteMethod}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                  disabled={isDeletingSingle}
                >
                  {isDeletingSingle ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && selectedMethod && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.9)] flex items-center justify-center z-[10001] p-4">
          <div className="relative max-w-4xl w-full">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 bg-black bg-opacity-50 rounded-full p-2"
            >
              <X size={24} />
            </button>
            
            <div className="bg-white rounded-lg overflow-hidden">
              <div className="p-4 bg-gray-900 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">{selectedMethod.name}</h3>
                <button
                  onClick={handleDeleteImage}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                  title="Delete Image"
                >
                  <Trash2 size={14} className="inline mr-1" />
                  Delete Image
                </button>
              </div>
              
              <div className="flex items-center justify-center p-8 bg-gray-800 min-h-[400px]">
                {selectedMethod.image ? (
                  <img 
                    src={getImageUrl(selectedMethod.image)} 
                    alt={selectedMethod.name}
                    className="max-h-[70vh] max-w-full object-contain"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.innerHTML = `
                        <div class="text-center">
                          <div class="mx-auto w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-4">
                            <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                          </div>
                          <p class="text-gray-400">Image failed to load</p>
                        </div>
                      `;
                    }}
                  />
                ) : (
                  <div className="text-center">
                    <div className="mx-auto w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mb-4">
                      <ImageIcon size={48} className="text-gray-400" />
                    </div>
                    <p className="text-gray-400 text-lg">No image available</p>
                  </div>
                )}
              </div>
              
              <div className="p-4 bg-gray-900 border-t border-gray-800">
                <div className="text-sm text-gray-400">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-500">Method:</span> {selectedMethod.name}
                    </div>
                    <div>
                      <span className="text-gray-500">Status:</span> 
                      <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${getStatusBadge(selectedMethod.status)}`}>
                        {selectedMethod.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Modal */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
                Delete Selected Methods
              </h3>
              <p className="text-sm text-gray-500 text-center mb-4">
                You are about to delete {selectedMethods.length} method(s). This action cannot be undone.
              </p>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type <span className="font-mono">"CONFIRM"</span> to proceed
                </label>
                <input
                  type="text"
                  value={deleteAllConfirmation}
                  onChange={(e) => setDeleteAllConfirmation(e.target.value)}
                  placeholder="CONFIRM"
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent uppercase"
                />
              </div>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => {
                    setShowDeleteAllModal(false);
                    setDeleteAllConfirmation('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={isDeletingAll}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAllSelected}
                  disabled={deleteAllConfirmation !== 'CONFIRM' || isDeletingAll}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isDeletingAll ? 'Deleting...' : 'Delete All Selected'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Methodlist;