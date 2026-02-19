import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Filter,
  Download,
  Eye, 
  Edit, 
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  DollarSign,
  Calendar,
  AlertTriangle,
  ChevronLeft, 
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  User,
  X,
  ArrowUpDown,
  Check,
  XCircle as XCircleIcon,
  AlertCircle,
  BarChart3,
  TrendingUp,
  ShieldCheck,
  FileText,
  Star,
  Layers,
  FileType,
  Hash,
  File,
  Info,
  Activity,
  Image as ImageIcon,
  Plus,
  Upload,
  Camera
} from 'lucide-react';
import axios from 'axios';
import Header from '../../components/header/Header';
import Sidebar from '../../components/sidebar/Sidebar';
import toast, { Toaster } from 'react-hot-toast';
import { FaBangladeshiTakaSign } from "react-icons/fa6";
import {NavLink} from "react-router-dom"

function Serviceslist() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedServices, setSelectedServices] = useState([]);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [statusAction, setStatusAction] = useState('');
  const [filters, setFilters] = useState({
    workStatus: '',
    workType: '',
    isFeatured: '',
    minRate: '',
    maxRate: ''
  });
  const [sortConfig, setSortConfig] = useState({
    field: 'createdAt',
    direction: 'desc'
  });
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const token = localStorage.getItem('adminToken');

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  // Fetch service statistics
  const fetchStatistics = useCallback(async () => {
    try {
      const response = await axios.get(`${base_url}/api/sub-admin/services/stats/overview`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.data.success) {
        setStatistics(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
      toast.error('Failed to load service statistics');
    }
  }, [base_url, token]);

  // Fetch services with filters
  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        sortBy: sortConfig.field,
        sortOrder: sortConfig.direction,
        ...filters
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await axios.get(`${base_url}/api/sub-admin/services`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: params
      });

      if (response.data.success) {
        setServices(response.data.data);
        setTotalPages(response.data.pagination?.pages || 1);
        setTotalItems(response.data.pagination?.total || 0);
        
        // Fetch statistics on initial load
        if (!statistics) {
          fetchStatistics();
        }
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error(error.response?.data?.error || 'Failed to fetch services');
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, [base_url, token, currentPage, itemsPerPage, searchTerm, sortConfig, filters, statistics, fetchStatistics]);

  // Initial fetch
  useEffect(() => {
    fetchServices();
  }, []);

  // Handle filter changes
  useEffect(() => {
    setCurrentPage(1);
    const timer = setTimeout(() => {
      fetchServices();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, filters, sortConfig]);

  // Handle pagination changes
  useEffect(() => {
    fetchServices();
  }, [currentPage, itemsPerPage]);

  // Handle sort
  const handleSort = (field) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0
    }).format(amount);
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

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return {
          className: 'bg-green-100 text-green-800 border-[1px] border-green-500',
          icon: <CheckCircle className="w-4 h-4 mr-1" />,
          label: 'Active'
        };
      case 'inactive':
        return {
          className: 'bg-red-100 text-red-800 border-[1px] border-red-500',
          icon: <XCircle className="w-4 h-4 mr-1" />,
          label: 'Inactive'
        };
      case 'pending':
        return {
          className: 'bg-yellow-100 text-yellow-800 border-[1px] border-yellow-500',
          icon: <Clock className="w-4 h-4 mr-1" />,
          label: 'Pending'
        };
      case 'completed':
        return {
          className: 'bg-blue-100 text-blue-800 border-[1px] border-blue-500',
          icon: <CheckCircle className="w-4 h-4 mr-1" />,
          label: 'Completed'
        };
      default:
        return {
          className: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <AlertCircle className="w-4 h-4 mr-1" />,
          label: status
        };
    }
  };

  // Get work type badge
  const getWorkTypeBadge = (type) => {
    switch (type) {
      case 'text_file':
        return {
          className: 'bg-purple-100 text-purple-800 border-[1px] border-purple-500',
          icon: <FileType className="w-4 h-4 mr-1" />,
          label: 'Text File'
        };
      case 'pdf_file':
        return {
          className: 'bg-indigo-100 text-indigo-800 border-[1px] border-indigo-500',
          icon: <File className="w-4 h-4 mr-1" />,
          label: 'PDF File'
        };
      default:
        return {
          className: 'bg-gray-100 text-gray-800 border-[1px] border--gray-200',
          icon: <FileText className="w-4 h-4 mr-1" />,
          label: type
        };
    }
  };

  // Open view modal
  const openViewModal = (service) => {
    setSelectedService(service);
    setShowViewModal(true);
  };

  // Open status update modal
  const openStatusModal = (service, action) => {
    setSelectedService(service);
    setStatusAction(action);
    setShowStatusModal(true);
  };

  // Open delete modal
  const openDeleteModal = (service) => {
    setSelectedService(service);
    setShowDeleteModal(true);
  };

  // Handle status update (via toggle switch)
  const handleToggleStatus = async (serviceId, currentStatus) => {
    try {
      setIsTogglingStatus(true);
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      
      const response = await axios.patch(
        `${base_url}/api/sub-admin/services/${serviceId}/toggle-status`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        toast.success(`Service status updated to ${newStatus}`);
        fetchServices();
        fetchStatistics();
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(error.response?.data?.error || 'Failed to update status');
    } finally {
      setIsTogglingStatus(false);
    }
  };

  // Handle delete service
  const handleDeleteService = async () => {
    try {
      const response = await axios.delete(
        `${base_url}/api/sub-admin/services/${selectedService._id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        toast.success('Service deleted successfully');
        setShowDeleteModal(false);
        setSelectedService(null);
        fetchServices();
        fetchStatistics();
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error(error.response?.data?.error || 'Failed to delete service');
    }
  };

  // Handle toggle featured status
  const handleToggleFeatured = async (serviceId) => {
    try {
      const response = await axios.patch(
        `${base_url}/api/sub-admin/services/${serviceId}/toggle-featured`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        toast.success('Service featured status updated');
        fetchServices();
      }
    } catch (error) {
      console.error('Error toggling featured status:', error);
      toast.error(error.response?.data?.error || 'Failed to update featured status');
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (action) => {
    if (selectedServices.length === 0) {
      toast.error('Please select services to perform this action');
      return;
    }

    try {
      if (action === 'delete') {
        if (!window.confirm(`Are you sure you want to delete ${selectedServices.length} services?`)) {
          return;
        }
        
        let successCount = 0;
        let failCount = 0;
        
        for (const serviceId of selectedServices) {
          try {
            await axios.delete(`${base_url}/api/sub-admin/services/${serviceId}`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            successCount++;
          } catch (error) {
            console.error(`Failed to delete service ${serviceId}:`, error);
            failCount++;
          }
        }
        
        toast.success(`Deleted ${successCount} services, failed: ${failCount}`);
        setSelectedServices([]);
        fetchServices();
        fetchStatistics();
        return;
      } else if (action === 'activate') {
        const response = await axios.put(`${base_url}/api/sub-admin/services/bulk/status`, {
          serviceIds: selectedServices,
          workStatus: 'active'
        }, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.data.success) {
          toast.success(`Activated ${response.data.data.modifiedCount} services`);
          setSelectedServices([]);
          fetchServices();
          fetchStatistics();
        }
      } else if (action === 'deactivate') {
        const response = await axios.put(`${base_url}/api/sub-admin/services/bulk/status`, {
          serviceIds: selectedServices,
          workStatus: 'inactive'
        }, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.data.success) {
          toast.success(`Deactivated ${response.data.data.modifiedCount} services`);
          setSelectedServices([]);
          fetchServices();
          fetchStatistics();
        }
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast.error(error.response?.data?.error || `Failed to ${action} services`);
    }
  };

  // Toggle select service
  const toggleSelectService = (serviceId) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  // Select all services on current page
  const selectAllServices = () => {
    if (selectedServices.length === services.length) {
      setSelectedServices([]);
    } else {
      setSelectedServices(services.map(s => s._id));
    }
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      workStatus: '',
      workType: '',
      isFeatured: '',
      minRate: '',
      maxRate: ''
    });
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Calculate showing range
  const getShowingRange = () => {
    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, totalItems);
    return `Showing ${start} to ${end} of ${totalItems} services`;
  };

  // Modern Toggle Switch Component
  const ModernToggleSwitch = ({ isActive, onChange, disabled, serviceId }) => {
    return (
      <div className="flex flex-col items-center">
        <button
          type="button"
          className={`relative inline-flex h-7 w-14 items-center rounded-full transition-all duration-500 ${
            isActive 
              ? 'bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-600 shadow-lg shadow-green-200/50' 
              : 'bg-gradient-to-r from-gray-300 via-gray-400 to-gray-500'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}`}
          onClick={() => !disabled && onChange(serviceId, isActive ? 'active' : 'inactive')}
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
  const StatisticsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Services</p>
            <p className="text-2xl font-bold text-gray-800">
              {statistics?.overview?.totalServices || 0}
            </p>
          </div>
          <Layers className="w-8 h-8 text-blue-500" />
        </div>
        <div className="mt-2 text-xs text-gray-500">
          <span className="text-green-600">Active: {statistics?.overview?.activeServices || 0}</span>
          {' | '}
          <span className="text-red-600">Inactive: {statistics?.overview?.inactiveServices || 0}</span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Average Rate</p>
            <p className="text-2xl font-bold text-gray-800">
              {formatCurrency(statistics?.overview?.avgWorkRate || 0)}
            </p>
          </div>
          <FaBangladeshiTakaSign className="w-8 h-8 text-green-500" />
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Min: {formatCurrency(statistics?.overview?.minWorkRate || 0)} | Max: {formatCurrency(statistics?.overview?.maxWorkRate || 0)}
        </div>
      </div>
    </div>
  );

  // Status Update Modal
  const StatusUpdateModal = () => (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <ShieldCheck className="w-6 h-6 text-blue-500 mr-3" />
              <h2 className="text-xl font-bold text-gray-800 capitalize">
                Update Service Status
              </h2>
            </div>
            <button
              onClick={() => setShowStatusModal(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-150"
            >
              <X size={20} />
            </button>
          </div>
          
          {selectedService && (
            <div className="mb-6">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                <p className="text-sm text-gray-600 mb-2">Service Details:</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Name:</span>
                    <p className="font-medium">{selectedService.workName}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">English Name:</span>
                    <p className="font-medium">{selectedService.workNameEnglish}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Rate:</span>
                    <p className="font-medium">{formatCurrency(selectedService.workRate)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Type:</span>
                    <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${getWorkTypeBadge(selectedService.workType).className}`}>
                      {getWorkTypeBadge(selectedService.workType).label}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Current Status:</span>
                    <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusBadge(selectedService.workStatus).className}`}>
                      {selectedService.workStatus}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Featured:</span>
                    <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${selectedService.isFeatured ? 'bg-yellow-100 text-yellow-800 border-yellow-500' : 'bg-gray-100 text-gray-800 border-gray-500'}`}>
                      {selectedService.isFeatured ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-700 mb-2">
                  This will toggle the service status between <span className="font-semibold">Active</span> and <span className="font-semibold">Inactive</span>
                </p>
                <div className="flex items-center justify-center">
                  <ModernToggleSwitch 
                    isActive={selectedService.workStatus === 'active'}
                    onChange={(id, status) => handleToggleStatus(id, status)}
                    disabled={isTogglingStatus}
                    serviceId={selectedService._id}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowStatusModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-150"
            >
              Cancel
            </button>
            <button
              onClick={() => handleToggleStatus(selectedService._id, selectedService.workStatus)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-150"
              disabled={isTogglingStatus}
            >
              {isTogglingStatus ? 'Updating...' : 'Confirm Status Change'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Delete Modal
  const DeleteModal = () => (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <AlertTriangle className="w-6 h-6 text-red-500 mr-3" />
              <h2 className="text-xl font-bold text-gray-800">Delete Service</h2>
            </div>
            <button
              onClick={() => setShowDeleteModal(false)}
              className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors duration-150"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="mb-6">
            <div className="bg-red-50 border-l[1px] rounded-[10px] border-red-500 p-4 mb-4">
              <div className="flex">
                <div>
                  <p className="text-sm text-red-800 font-semibold">Warning</p>
                  <p className="text-sm text-red-700 mt-1">
                    This action will permanently delete this service and all associated data.
                    This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>

          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 text-sm font-medium border-[1px] cursor-pointer border-gray-200 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-150"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteService}
              className="px-4 py-2 text-sm font-medium text-white cursor-pointer bg-red-600 rounded-lg hover:bg-red-700 transition-colors duration-150 flex items-center"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Service
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // View Service Modal
  const ViewServiceModal = () => (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <FileText className="w-6 h-6 text-blue-500 mr-3" />
              <h2 className="text-xl font-bold text-gray-800">Service Details</h2>
            </div>
            <button
              onClick={() => setShowViewModal(false)}
              className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors duration-150"
            >
              <X size={20} />
            </button>
          </div>
          
          {selectedService && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{selectedService.workName}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedService.workNameEnglish}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Created: {formatDate(selectedService.createdAt)}
                  </p>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <div className="flex items-center space-x-2">
                    <ModernToggleSwitch 
                      isActive={selectedService.workStatus === 'active'}
                      onChange={handleToggleStatus}
                      disabled={isTogglingStatus}
                      serviceId={selectedService._id}
                    />
                  </div>
                  {selectedService.isFeatured && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 border-[1px] border-yellow-500">
                      <Star className="w-4 h-4 mr-1" />
                      <span className="font-medium">Featured</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Main Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                    <Layers className="w-4 h-4 mr-2" />
                    Service Information
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Work Rate:</span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(selectedService.workRate)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Work Type:</span>
                      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full ${getWorkTypeBadge(selectedService.workType).className}`}>
                        {getWorkTypeBadge(selectedService.workType).icon}
                        {getWorkTypeBadge(selectedService.workType).label}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Display Order:</span>
                      <span className="font-medium">{selectedService.order}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fields Count:</span>
                      <span className="font-medium">{selectedService.fieldNames?.length || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-700 mb-3">Timestamps</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium">{formatDate(selectedService.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Updated:</span>
                      <span className="font-medium">
                        {selectedService.updatedAt ? formatDate(selectedService.updatedAt) : 'Never'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedService.description && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-700 mb-2">Description</h4>
                  <p className="text-gray-600 whitespace-pre-line">{selectedService.description}</p>
                </div>
              )}

              {/* Field Names */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-700 mb-3 flex items-center justify-between">
                  <span className="flex items-center">
                    <Hash className="w-4 h-4 mr-2" />
                    Service Fields ({selectedService.fieldNames?.length || 0})
                  </span>
                </h4>
                
                {selectedService.fieldNames && selectedService.fieldNames.length > 0 ? (
                  <div className="space-y-3">
                    {selectedService.fieldNames.map((field, index) => (
                      <div key={index} className="bg-white p-3 rounded border border-gray-200">
                        <div className="flex justify-between items-start mb-1">
                          <div>
                            <span className="text-sm font-medium text-gray-700">
                              Field {index + 1}: {field.name}
                            </span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Placeholder:</span> {field.placeholder}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <p>No fields defined for this service</p>
                  </div>
                )}
              </div>

      
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="font-anek text-gray-700 lg:ml-72 mt-[9vh]">
      <Header toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />
      <Toaster />

      <main className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="w-full mx-auto">
          {/* Page Header */}
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-teal-600 mb-1">Service Management</h1>
              <p className="text-gray-600 mt-1">View and manage all services</p>
            </div>
            <NavLink
              to="/admin/services/new"
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors duration-200 flex items-center"
            >
              Add New Service
            </NavLink>
          </div>

          {/* Statistics */}
           <StatisticsCards />

          {/* Main Content Card */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Search and Filters */}
                <div className="flex flex-col md:flex-row md:items-center gap-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search by service name, English name, or description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme_color2"
                    />
                  </div>

                  {/* Quick Filters */}
                  <div className="flex flex-wrap gap-2">
                    {/* Status Filter */}
                    <select
                      value={filters.workStatus}
                      onChange={(e) => setFilters(prev => ({ ...prev, workStatus: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme_color2 text-sm"
                    >
                      <option value="">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                    </select>

                    {/* Work Type Filter */}
                    <select
                      value={filters.workType}
                      onChange={(e) => setFilters(prev => ({ ...prev, workType: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme_color2 text-sm"
                    >
                      <option value="">All Types</option>
                      <option value="text_file">Text File</option>
                      <option value="order_file">Order File</option>
                    </select>

                    {/* Featured Filter */}
                    <select
                      value={filters.isFeatured}
                      onChange={(e) => setFilters(prev => ({ ...prev, isFeatured: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme_color2 text-sm"
                    >
                      <option value="">All Services</option>
                      <option value="true">Featured Only</option>
                      <option value="false">Non-Featured</option>
                    </select>

                    {/* Clear Filters Button */}
                    {(filters.workStatus || filters.workType || filters.isFeatured || searchTerm) && (
                      <button
                        onClick={clearFilters}
                        className="px-3 py-2 border border-gray-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors duration-200 text-sm"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  {selectedServices.length > 0 && (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center bg-blue-50 rounded-lg px-3 py-1.5">
                        <span className="text-sm font-medium text-blue-700">
                          {selectedServices.length} selected
                        </span>
                      </div>
                      
                      {/* Bulk Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleBulkAction('activate')}
                          className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 text-sm"
                        >
                          Activate
                        </button>
                        <button
                          onClick={() => handleBulkAction('deactivate')}
                          className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 text-sm"
                        >
                          Deactivate
                        </button>
                        <button
                          onClick={() => handleBulkAction('delete')}
                          className="px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Refresh Button */}
                  <button
                    onClick={fetchServices}
                    className="inline-flex items-center px-3 py-2 gap-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    <RefreshCw className="w-4 h-4" /> Refresh
                  </button>
                </div>
              </div>

              {/* Advanced Filters */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Rate Range */}
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Min Rate (৳)</label>
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minRate}
                    onChange={(e) => setFilters(prev => ({ ...prev, minRate: e.target.value }))}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-theme_color2"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Max Rate (৳)</label>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxRate}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxRate: e.target.value }))}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-theme_color2"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Services Table */}
            <div className="overflow-x-auto">
              {loading ? (
                             <div className="flex justify-center items-center py-8">
      <div className="flex space-x-2">
        <div className="animate-bounce h-3 w-3 bg-green-500 rounded-full" style={{ animationDelay: '0ms' }}></div>
        <div className="animate-bounce h-3 w-3 bg-green-500 rounded-full" style={{ animationDelay: '150ms' }}></div>
        <div className="animate-bounce h-3 w-3 bg-green-500 rounded-full" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
              ) : services.length === 0 ? (
                <div className="text-center py-12">
                  <Layers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-700">No services found</h3>
                  <p className="text-gray-500 mt-1">Try adjusting your search or filters</p>
                  <button
                    onClick={clearFilters}
                    className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors duration-200"
                  >
                    Clear All Filters
                  </button>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedServices.length === services.length && services.length > 0}
                          onChange={selectAllServices}
                          className="rounded border-gray-300"
                        />
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('workName')}
                      >
                        <div className="flex items-center">
                          Service Name
                          {sortConfig.field === 'workName' && (
                            <ArrowUpDown className="w-4 h-4 ml-1" />
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('workRate')}
                      >
                        <div className="flex items-center">
                          Rate
                          {sortConfig.field === 'workRate' && (
                            <ArrowUpDown className="w-4 h-4 ml-1" />
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('createdAt')}
                      >
                        <div className="flex items-center">
                          Created
                          {sortConfig.field === 'createdAt' && (
                            <ArrowUpDown className="w-4 h-4 ml-1" />
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {services.map((service) => (
                      <tr key={service._id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedServices.includes(service._id)}
                            onChange={() => toggleSelectService(service._id)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{service.workName}</div>
                          <div className="text-sm text-gray-500">{service.workNameEnglish}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            {formatCurrency(service.workRate)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Order: {service.order}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium ${getWorkTypeBadge(service.workType).className}`}>
                            {getWorkTypeBadge(service.workType).icon}
                            {getWorkTypeBadge(service.workType).label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <ModernToggleSwitch 
                              isActive={service.workStatus === 'active'}
                              onChange={handleToggleStatus}
                              disabled={isTogglingStatus}
                              serviceId={service._id}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(service.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => openViewModal(service)}
                              className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors duration-150"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <a
                              href={`/admin/service/edit/${service._id}`}
                              className="bg-teal-600 text-white p-2 rounded-lg hover:bg-teal-700 transition-colors duration-150"
                              title="Edit Service"
                            >
                              <Edit className="w-4 h-4" />
                            </a>
                            <button
                              onClick={() => openDeleteModal(service)}
                              className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition-colors duration-150"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
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
            {services.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    {getShowingRange()}
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
                      <option value={10}>10 per page</option>
                      <option value={20}>20 per page</option>
                      <option value={50}>50 per page</option>
                      <option value={100}>100 per page</option>
                    </select>

                    <nav className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-150"
                      >
                        <ChevronsLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-150"
                      >
                        <ChevronLeft className="w-4 h-4" />
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
                            className={`px-3 py-1 border rounded-lg text-sm transition-colors duration-150 ${
                              currentPage === pageNum
                                ? 'bg-blue-600 text-white border-blue-600'
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
                        className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-150"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-150"
                      >
                        <ChevronsRight className="w-4 h-4" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      {showStatusModal && <StatusUpdateModal />}
      {showDeleteModal && <DeleteModal />}
      {showViewModal && <ViewServiceModal />}
    </div>
  );
}

export default Serviceslist;