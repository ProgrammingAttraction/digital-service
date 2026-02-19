import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  ChevronLeft, 
  ChevronRight, 
  Filter,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertTriangle,
  X,
  Info,
  Plus,
  Activity,
  DollarSign,
  TrendingUp,
  Calendar,
  Tag,
  Percent,
  Clock
} from 'lucide-react';
import axios from 'axios';
import Header from '../../components/header/Header';
import Sidebar from '../../components/sidebar/Sidebar';
import toast, { Toaster } from 'react-hot-toast';

function Bonushistory() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bonuses, setBonuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [statistics, setStatistics] = useState(null);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedBonuses, setSelectedBonuses] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [selectedBonus, setSelectedBonus] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    minimumDeposit: '',
    bonusAmount: '',
    description: '',
    status: 'active'
  });
  const [deleteAllConfirmation, setDeleteAllConfirmation] = useState('');
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [isDeletingSingle, setIsDeletingSingle] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const token = localStorage.getItem('adminToken');

  // Fetch bonuses
  const fetchBonuses = useCallback(async () => {
    try {
      setLoading(true);
      
      let url = `${base_url}/api/admin/bonuses`;
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        ...(statusFilter && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      };

      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params
      });

      if (response.data.success) {
        // Handle both array response and object with data property
        const bonusesData = Array.isArray(response.data) 
          ? response.data 
          : (response.data.data || []);
        
        setBonuses(bonusesData);
        
        // Set pagination info if available
        if (response.data.count !== undefined) {
          setTotalItems(response.data.count);
          setTotalPages(Math.ceil(response.data.count / itemsPerPage));
        } else {
          // Default values if no pagination info
          setTotalItems(bonusesData.length);
          setTotalPages(1);
        }
      } else {
        // Handle error response
        toast.error(response.data.error || 'Failed to load bonuses');
      }
    } catch (error) {
      console.error('Error fetching bonuses:', error);
      toast.error(error.response?.data?.error || 'Failed to load bonuses');
      setBonuses([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, statusFilter, searchTerm, base_url, token]);

  // Fetch statistics
  const fetchStatistics = useCallback(async () => {
    try {
      const response = await axios.get(`${base_url}/api/admin/bonuses/stats/overview`, {
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
    fetchBonuses();
    fetchStatistics();
  }, [fetchBonuses, fetchStatistics]);

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

  // Toggle bonus selection
  const toggleSelectBonus = (bonusId) => {
    if (selectedBonuses.includes(bonusId)) {
      setSelectedBonuses(selectedBonuses.filter(id => id !== bonusId));
    } else {
      setSelectedBonuses([...selectedBonuses, bonusId]);
    }
  };

  // Select all bonuses
  const selectAllBonuses = () => {
    if (selectedBonuses.length === bonuses.length) {
      setSelectedBonuses([]);
    } else {
      setSelectedBonuses(bonuses.map(bonus => bonus._id));
    }
  };

  // Open edit modal
  const openEditModal = (bonus) => {
    setSelectedBonus(bonus);
    setFormData({
      title: bonus.title || '',
      minimumDeposit: bonus.minimumDeposit ? bonus.minimumDeposit.toString() : '',
      bonusAmount: bonus.bonusAmount ? bonus.bonusAmount.toString() : '',
      description: bonus.description || '',
      status: bonus.status || 'active'
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  // Open view modal
  const openViewModal = (bonus) => {
    setSelectedBonus(bonus);
    setShowViewModal(true);
  };

  // Open delete modal
  const openDeleteModal = (bonus) => {
    setSelectedBonus(bonus);
    setShowDeleteModal(true);
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!formData.title.trim()) errors.title = 'Bonus title is required';
    
    const minDeposit = parseFloat(formData.minimumDeposit);
    const bonusAmount = parseFloat(formData.bonusAmount);
    
    if (!formData.minimumDeposit || isNaN(minDeposit) || minDeposit < 0) {
      errors.minimumDeposit = 'Valid minimum deposit is required (≥ 0)';
    }
    
    if (!formData.bonusAmount || isNaN(bonusAmount) || bonusAmount < 0) {
      errors.bonusAmount = 'Valid bonus amount is required (≥ 0)';
    }
    
    return errors;
  };

  // Handle form submission (update)
  const handleUpdate = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Please fix all form errors before submitting.', {
        duration: 4000,
        position: 'top-right',
      });
      return;
    }
    
    try {
      setIsUpdating(true);
      const response = await axios.put(
        `${base_url}/api/admin/bonuses/${selectedBonus._id}`,
        {
          ...formData,
          minimumDeposit: parseFloat(formData.minimumDeposit),
          bonusAmount: parseFloat(formData.bonusAmount)
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        toast.success(response.data.message || 'Bonus updated successfully');
        fetchBonuses();
        fetchStatistics();
        setShowEditModal(false);
      }
    } catch (error) {
      console.error('Error updating bonus:', error);
      toast.error(error.response?.data?.error || 'Failed to update bonus');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle delete bonus
  const handleDeleteBonus = async () => {
    try {
      setIsDeletingSingle(true);
      const response = await axios.delete(
        `${base_url}/api/admin/bonuses/${selectedBonus._id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        toast.success(response.data.message || 'Bonus deleted successfully');
        fetchBonuses();
        fetchStatistics();
        setShowDeleteModal(false);
      }
    } catch (error) {
      console.error('Error deleting bonus:', error);
      toast.error(error.response?.data?.error || 'Failed to delete bonus');
    } finally {
      setIsDeletingSingle(false);
    }
  };

  // Handle toggle status
  const handleToggleStatus = async (bonusId, currentStatus) => {
    try {
      setIsTogglingStatus(true);
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      
      const response = await axios.patch(
        `${base_url}/api/admin/bonuses/${bonusId}/toggle-status`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        toast.success(`Status changed to ${newStatus}`);
        fetchBonuses();
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
    if (!bulkAction || selectedBonuses.length === 0) {
      toast.error('Please select an action and bonuses');
      return;
    }

    try {
      if (bulkAction === 'delete') {
        setShowDeleteAllModal(true);
      } else if (bulkAction === 'activate') {
        // Activate all selected
        await Promise.all(selectedBonuses.map(id => 
          axios.patch(`${base_url}/api/admin/bonuses/${id}/toggle-status`, 
            {},
            { headers: { 'Authorization': `Bearer ${token}` } }
          )
        ));
        toast.success('Selected bonuses activated successfully');
        fetchBonuses();
        fetchStatistics();
        setSelectedBonuses([]);
        setBulkAction('');
      } else if (bulkAction === 'deactivate') {
        // Deactivate all selected
        await Promise.all(selectedBonuses.map(id => 
          axios.patch(`${base_url}/api/admin/bonuses/${id}/toggle-status`, 
            {},
            { headers: { 'Authorization': `Bearer ${token}` } }
          )
        ));
        toast.success('Selected bonuses deactivated successfully');
        fetchBonuses();
        fetchStatistics();
        setSelectedBonuses([]);
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
      await Promise.all(selectedBonuses.map(id => 
        axios.delete(`${base_url}/api/admin/bonuses/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ));
      toast.success('Selected bonuses deleted successfully');
      fetchBonuses();
      fetchStatistics();
      setSelectedBonuses([]);
      setShowDeleteAllModal(false);
      setDeleteAllConfirmation('');
      setBulkAction('');
    } catch (error) {
      console.error('Error deleting bonuses:', error);
      toast.error('Failed to delete selected bonuses');
    } finally {
      setIsDeletingAll(false);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setSortBy('createdAt');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
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
      case 'active':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'inactive':
        return 'bg-red-100 text-red-800 border border-red-200';
      case 'expired':
        return 'bg-gray-100 text-gray-800 border border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle size={14} className="text-green-500" />;
      case 'inactive':
        return <XCircle size={14} className="text-red-500" />;
      case 'expired':
        return <Clock size={14} className="text-gray-500" />;
      default:
        return <Info size={14} className="text-gray-500" />;
    }
  };

  // Modern Toggle Switch
  const ModernToggleSwitch = ({ isActive, onChange, disabled, bonusId }) => {
    return (
      <div className="flex flex-col items-center">
        <button
          type="button"
          className={`relative inline-flex h-7 w-14 items-center rounded-full transition-all duration-500 ${
            isActive 
              ? 'bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-600 shadow-lg shadow-green-200/50' 
              : 'bg-gradient-to-r from-gray-300 via-gray-400 to-gray-500'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}`}
          onClick={() => !disabled && onChange(bonusId, isActive ? 'active' : 'inactive')}
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
              <p className="text-sm text-gray-600">Total Bonuses</p>
              <p className="text-2xl font-bold text-gray-800">{statistics.totalBonuses || 0}</p>
            </div>
            <div className="bg-blue-100 p-2 rounded-full">
              <Tag size={24} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Bonuses</p>
              <p className="text-2xl font-bold text-green-600">{statistics.activeBonuses || 0}</p>
            </div>
            <div className="bg-green-100 p-2 rounded-full">
              <CheckCircle size={24} className="text-green-600" />
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {statistics.totalBonuses > 0 && (
              <span>{Math.round((statistics.activeBonuses / statistics.totalBonuses) * 100)}% of total</span>
            )}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Min Deposit</p>
              <p className="text-lg font-bold text-gray-800">
                ৳{statistics.avgMinimumDeposit ? statistics.avgMinimumDeposit.toLocaleString() : 0}
              </p>
            </div>
            <div className="bg-purple-100 p-2 rounded-full">
              <DollarSign size={24} className="text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Bonus Amount</p>
              <p className="text-lg font-bold text-emerald-600">
                ৳{statistics.avgBonusAmount ? statistics.avgBonusAmount.toLocaleString() : 0}
              </p>
            </div>
            <div className="bg-emerald-100 p-2 rounded-full">
              <TrendingUp size={24} className="text-emerald-600" />
            </div>
          </div>
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
            <h1 className="text-2xl font-bold text-teal-600 mb-1">Bonus Management</h1>
            <p className="text-gray-600 mt-1">Manage all bonuses for user deposits</p>
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
                  placeholder="Search by title or description..."
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
                </select>

                {/* Sort Options */}
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field);
                    setSortOrder(order);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="createdAt-desc">Newest First</option>
                  <option value="createdAt-asc">Oldest First</option>
                  <option value="title-asc">Title (A-Z)</option>
                  <option value="title-desc">Title (Z-A)</option>
                  <option value="minimumDeposit-asc">Min Deposit (Low-High)</option>
                  <option value="minimumDeposit-desc">Min Deposit (High-Low)</option>
                  <option value="bonusAmount-asc">Bonus Amount (Low-High)</option>
                  <option value="bonusAmount-desc">Bonus Amount (High-Low)</option>
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
            {selectedBonuses.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="text-sm text-blue-700">
                    <span className="font-medium">{selectedBonuses.length} bonus(es) selected</span>
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
                      onClick={() => setSelectedBonuses([])}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Clear Selection
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bonuses Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="text-center py-12">
                <RefreshCw className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
                <h3 className="text-lg font-medium text-gray-700">Loading Bonuses...</h3>
              </div>
            ) : bonuses.length === 0 ? (
              <div className="p-12 text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No bonuses found</h3>
                <p className="text-gray-500">
                  {searchTerm || statusFilter ? 'Try changing your filters' : 'No bonuses have been created yet'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedBonuses.length === bonuses.length && bonuses.length > 0}
                            onChange={selectAllBonuses}
                            className="rounded border-gray-300"
                          />
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Bonus Title
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Min Deposit
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Bonus Amount
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
                    {bonuses.map((bonus) => (
                      <tr key={bonus._id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedBonuses.includes(bonus._id)}
                            onChange={() => toggleSelectBonus(bonus._id)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-gray-900">{bonus.title}</div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {bonus.description && bonus.description.length > 50 
                                ? `${bonus.description.substring(0, 50)}...` 
                                : (bonus.description || 'No description')}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            ৳{bonus.minimumDeposit?.toLocaleString() || '0'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-emerald-600">
                            ৳{bonus.bonusAmount?.toLocaleString() || '0'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <ModernToggleSwitch 
                              isActive={bonus.status === 'active'}
                              onChange={handleToggleStatus}
                              disabled={isTogglingStatus}
                              bonusId={bonus._id}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(bonus.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => openViewModal(bonus)}
                              className="bg-blue-600 rounded-[5px] text-white px-3 py-2 hover:bg-blue-700 transition-colors duration-150 flex items-center gap-1"
                              title="View Details"
                            >
                              <Eye size={14} />
                              <span className="hidden sm:inline">View</span>
                            </button>
                            <button
                              onClick={() => openEditModal(bonus)}
                              className="bg-teal-600 rounded-[5px] text-white px-3 py-2 hover:bg-teal-700 transition-colors duration-150 flex items-center gap-1"
                              title="Edit"
                            >
                              <Edit size={14} />
                              <span className="hidden sm:inline">Edit</span>
                            </button>
                            <button
                              onClick={() => openDeleteModal(bonus)}
                              className="bg-red-600 rounded-[5px] text-white px-3 py-2 hover:bg-red-700 transition-colors duration-150 flex items-center gap-1"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                              <span className="hidden sm:inline">Delete</span>
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
            {bonuses.length > 0 && totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="text-sm text-gray-700">
                    Showing <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of{' '}
                    <span className="font-medium">{totalItems}</span> bonuses
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
      {showViewModal && selectedBonus && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Bonus Details</h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-2xl font-bold text-gray-900">{selectedBonus.title}</h4>
                    <div className={`inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-sm font-medium ${getStatusBadge(selectedBonus.status)}`}>
                      {getStatusIcon(selectedBonus.status)}
                      <span className="ml-1 capitalize">{selectedBonus.status}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">Minimum Deposit</div>
                    <div className="text-2xl font-bold text-gray-800">
                      ৳{selectedBonus.minimumDeposit?.toLocaleString() || '0'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Required to get bonus</div>
                  </div>
                  
                  <div className="bg-emerald-50 p-4 rounded-lg">
                    <div className="text-sm text-emerald-600 mb-1">Bonus Amount</div>
                    <div className="text-2xl font-bold text-emerald-700">
                      ৳{selectedBonus.bonusAmount?.toLocaleString() || '0'}
                    </div>
                    <div className="text-xs text-emerald-600 mt-1">Extra amount credited</div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded whitespace-pre-wrap">
                    {selectedBonus.description || 'No description provided'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Created Date</label>
                    <p className="text-gray-900">{formatDate(selectedBonus.createdAt)}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Updated Date</label>
                    <p className="text-gray-900">{formatDate(selectedBonus.updatedAt)}</p>
                  </div>
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
      {showEditModal && selectedBonus && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Edit Bonus</h3>
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
                      Bonus Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-1 ${
                        formErrors.title 
                          ? 'border-red-300 focus:ring-red-500' 
                          : 'border-gray-300 focus:ring-teal-500'
                      }`}
                      placeholder="e.g., Welcome Bonus, Deposit Bonus"
                      required
                    />
                    {formErrors.title && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.title}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Minimum Deposit *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          name="minimumDeposit"
                          value={formData.minimumDeposit}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                          className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-1 ${
                            formErrors.minimumDeposit 
                              ? 'border-red-300 focus:ring-red-500' 
                              : 'border-gray-300 focus:ring-teal-500'
                          }`}
                          placeholder="500"
                          required
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-gray-500">৳</span>
                        </div>
                      </div>
                      {formErrors.minimumDeposit && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.minimumDeposit}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bonus Amount *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          name="bonusAmount"
                          value={formData.bonusAmount}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                          className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-1 ${
                            formErrors.bonusAmount 
                              ? 'border-red-300 focus:ring-red-500' 
                              : 'border-gray-300 focus:ring-teal-500'
                          }`}
                          placeholder="50"
                          required
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-gray-500">৳</span>
                        </div>
                      </div>
                      {formErrors.bonusAmount && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.bonusAmount}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <div className="flex items-center space-x-4">
                      <ModernToggleSwitch 
                        isActive={formData.status === 'active'}
                        onChange={(bonusId, newStatus) => {
                          setFormData(prev => ({ ...prev, status: newStatus }));
                        }}
                        disabled={false}
                        bonusId={selectedBonus._id}
                      />
                      <span className="text-sm text-gray-600">
                        {formData.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description (Optional)
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="4"
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      placeholder="Enter bonus description or terms..."
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
                    {isUpdating ? 'Updating...' : 'Update Bonus'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedBonus && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
                Delete Bonus
              </h3>
              <p className="text-sm text-gray-500 text-center mb-6">
                Are you sure you want to delete <span className="font-semibold">{selectedBonus.title}</span>? This action cannot be undone.
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
                  onClick={handleDeleteBonus}
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

      {/* Delete All Modal */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
                Delete Selected Bonuses
              </h3>
              <p className="text-sm text-gray-500 text-center mb-4">
                You are about to delete {selectedBonuses.length} bonus(es). This action cannot be undone.
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

export default Bonushistory;