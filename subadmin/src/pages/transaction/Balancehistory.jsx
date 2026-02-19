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
  CreditCard,
  X,
  ArrowUpDown,
  Check,
  XCircle as XCircleIcon,
  AlertCircle,
  BarChart3,
  TrendingUp,
  ShieldCheck,
  FileText,
  ArrowUp,
  ArrowDown,
  Receipt,
  PlusCircle,
  MinusCircle,
  Settings,
  Undo
} from 'lucide-react';
import axios from 'axios';
import Header from '../../components/header/Header';
import Sidebar from '../../components/sidebar/Sidebar';
import toast, { Toaster } from 'react-hot-toast';
import { FaBangladeshiTakaSign } from "react-icons/fa6";

function Balancehistory() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [balanceHistory, setBalanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [filters, setFilters] = useState({
    type: '',
    userId: '',
    adminId: '',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: ''
  });
  const [sortConfig, setSortConfig] = useState({
    field: 'createdAt',
    direction: 'desc'
  });
  const [users, setUsers] = useState([]);
  const [admins, setAdmins] = useState([]);

  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const token = localStorage.getItem('adminToken');

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  // Fetch all users for filter dropdown
  const fetchUsers = useCallback(async () => {
    try {
      const response = await axios.get(`${base_url}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          limit: 100,
          sortBy: 'fullname',
          sortOrder: 'asc'
        }
      });
      if (response.data.success) {
        setUsers(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, [base_url, token]);

  // Fetch all admins for filter dropdown
  const fetchAdmins = useCallback(async () => {
    try {
      const response = await axios.get(`${base_url}/api/admin/admins`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.data.success) {
        setAdmins(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
      // If /admins endpoint doesn't exist, use current admin
      const admin = JSON.parse(localStorage.getItem('admin') || '{}');
      if (admin._id) {
        setAdmins([admin]);
      }
    }
  }, [base_url, token]);

  // Fetch balance history with filters
  const fetchBalanceHistory = useCallback(async () => {
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

      const response = await axios.get(`${base_url}/api/admin/balance-history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: params
      });

      if (response.data.success) {
        setBalanceHistory(response.data.data);
        setTotalPages(response.data.pagination?.pages || 1);
        setTotalItems(response.data.pagination?.total || 0);
        setStatistics(response.data.totals);
      }
    } catch (error) {
      console.error('Error fetching balance history:', error);
      toast.error(error.response?.data?.error || 'Failed to fetch balance history');
      setBalanceHistory([]);
    } finally {
      setLoading(false);
    }
  }, [base_url, token, currentPage, itemsPerPage, searchTerm, sortConfig, filters]);

  // Initial fetch
  useEffect(() => {
    fetchBalanceHistory();
    fetchUsers();
    fetchAdmins();
  }, []);

  // Handle filter changes
  useEffect(() => {
    setCurrentPage(1);
    const timer = setTimeout(() => {
      fetchBalanceHistory();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, filters, sortConfig]);

  // Handle pagination changes
  useEffect(() => {
    fetchBalanceHistory();
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get type badge
  const getTypeBadge = (type) => {
    switch (type) {
      case 'add':
        return {
          className: 'bg-emerald-100 text-emerald-800 border-[1px] border-emerald-500',
          icon: <PlusCircle className="w-4 h-4 mr-1" />,
          label: 'Addition',
          sign: '+'
        };
      case 'subtract':
        return {
          className: 'bg-rose-100 text-rose-800 border-[1px] border-rose-500',
          icon: <MinusCircle className="w-4 h-4 mr-1" />,
          label: 'Subtraction',
          sign: '-'
        };
      case 'adjustment':
        return {
          className: 'bg-amber-100 text-amber-800 border-[1px] border-amber-500',
          icon: <Settings className="w-4 h-4 mr-1" />,
          label: 'Adjustment',
          sign: '±'
        };
      case 'refund':
        return {
          className: 'bg-blue-100 text-blue-800 border-[1px] border-blue-500',
          icon: <Undo className="w-4 h-4 mr-1" />,
          label: 'Refund',
          sign: '+'
        };
      case 'purchase':
        return {
          className: 'bg-purple-100 text-purple-800 border-[1px] border-purple-500',
          icon: <ShoppingBag className="w-4 h-4 mr-1" />,
          label: 'Purchase',
          sign: '-'
        };
      case 'withdrawal':
        return {
          className: 'bg-indigo-100 text-indigo-800 border-[1px] border-indigo-500',
          icon: <CreditCard className="w-4 h-4 mr-1" />,
          label: 'Withdrawal',
          sign: '-'
        };
      default:
        return {
          className: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <AlertCircle className="w-4 h-4 mr-1" />,
          label: type,
          sign: ''
        };
    }
  };

  // Open view modal
  const openViewModal = (record) => {
    setSelectedRecord(record);
    setShowViewModal(true);
  };

  // Toggle select record
  const toggleSelectRecord = (recordId) => {
    setSelectedRecords(prev =>
      prev.includes(recordId)
        ? prev.filter(id => id !== recordId)
        : [...prev, recordId]
    );
  };

  // Select all records on current page
  const selectAllRecords = () => {
    if (selectedRecords.length === balanceHistory.length) {
      setSelectedRecords([]);
    } else {
      setSelectedRecords(balanceHistory.map(r => r._id));
    }
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      type: '',
      userId: '',
      adminId: '',
      startDate: '',
      endDate: '',
      minAmount: '',
      maxAmount: ''
    });
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Calculate showing range
  const getShowingRange = () => {
    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, totalItems);
    return `Showing ${start} to ${end} of ${totalItems} records`;
  };

  // Statistics Cards Component
  const StatisticsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Records</p>
            <p className="text-2xl font-bold text-gray-800">
              {statistics?.totalRecords || 0}
            </p>
          </div>
          <BarChart3 className="w-8 h-8 text-blue-500" />
        </div>
        <div className="mt-2 text-xs text-gray-500">
          <span className="text-emerald-600">Add: {statistics?.totalAdditions || 0}</span>
          {' | '}
          <span className="text-rose-600">Subtract: {statistics?.totalSubtractions || 0}</span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Additions</p>
            <p className="text-2xl font-bold text-emerald-600">
              {formatCurrency(statistics?.totalAdditions || 0)}
            </p>
          </div>
          <ArrowUp className="w-8 h-8 text-emerald-500" />
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Positive balance changes
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Subtractions</p>
            <p className="text-2xl font-bold text-rose-600">
              {formatCurrency(statistics?.totalSubtractions || 0)}
            </p>
          </div>
          <ArrowDown className="w-8 h-8 text-rose-500" />
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Negative balance changes
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Net Change</p>
            <p className={`text-2xl font-bold ${
              (statistics?.totalAdditions || 0) > (statistics?.totalSubtractions || 0)
                ? 'text-emerald-600'
                : 'text-rose-600'
            }`}>
              {formatCurrency((statistics?.totalAdditions || 0) - (statistics?.totalSubtractions || 0))}
            </p>
          </div>
          <TrendingUp className="w-8 h-8 text-gray-500" />
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Overall system balance change
        </div>
      </div>
    </div>
  );

  // View Record Modal
  const ViewRecordModal = () => (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Receipt className="w-6 h-6 text-blue-500 mr-3" />
              <h2 className="text-xl font-bold text-gray-800">Balance History Details</h2>
            </div>
            <button
              onClick={() => setShowViewModal(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-150"
            >
              <X size={20} />
            </button>
          </div>
          
          {selectedRecord && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Record #{selectedRecord._id.slice(-8)}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Created: {formatDate(selectedRecord.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full ${getTypeBadge(selectedRecord.type).className}`}>
                    {getTypeBadge(selectedRecord.type).icon}
                    <span className="font-medium">{getTypeBadge(selectedRecord.type).label}</span>
                  </span>
                </div>
              </div>

              {/* Main Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    User Information
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{selectedRecord.user?.fullname || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{selectedRecord.user?.email || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium">{selectedRecord.user?.whatsappnumber || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    Admin Information
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Admin:</span>
                      <span className="font-medium">{selectedRecord.admin?.username || selectedRecord.admin?.name || 'System'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{selectedRecord.admin?.email || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Balance Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-700 mb-3">Balance Information</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount:</span>
                      <span className={`font-medium ${
                        selectedRecord.type === 'add' || selectedRecord.type === 'refund'
                          ? 'text-emerald-600'
                          : 'text-rose-600'
                      }`}>
                        {getTypeBadge(selectedRecord.type).sign}{formatCurrency(selectedRecord.amount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Old Balance:</span>
                      <span className="font-medium">{formatCurrency(selectedRecord.oldBalance)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">New Balance:</span>
                      <span className="font-medium">{formatCurrency(selectedRecord.newBalance)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Change:</span>
                      <span className={`font-medium ${
                        selectedRecord.type === 'add' || selectedRecord.type === 'refund'
                          ? 'text-emerald-600'
                          : 'text-rose-600'
                      }`}>
                        {getTypeBadge(selectedRecord.type).sign}{formatCurrency(selectedRecord.amount)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-700 mb-3">Transaction Details</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium capitalize">{selectedRecord.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium">{formatDate(selectedRecord.createdAt)}</span>
                    </div>
                    {selectedRecord.notes && (
                      <div className="mt-2">
                        <span className="text-gray-600 block mb-1">Notes:</span>
                        <p className="text-sm bg-yellow-50 p-2 rounded border border-yellow-200">
                          {selectedRecord.notes}
                        </p>
                      </div>
                    )}
                    {selectedRecord.transactionId && (
                      <div className="mt-2">
                        <span className="text-gray-600 block mb-1">Transaction ID:</span>
                        <p className="font-mono text-sm">{selectedRecord.transactionId}</p>
                      </div>
                    )}
                  </div>
                </div>
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
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-teal-600 mb-1">Balance History</h1>
            <p className="text-gray-600 mt-1">View all balance modifications and adjustments</p>
          </div>

          {/* Statistics */}
          {statistics && <StatisticsCards />}

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
                      placeholder="Search by notes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme_color2"
                    />
                  </div>

                  {/* Quick Filters */}
                  <div className="flex flex-wrap gap-2">
                    {/* Type Filter */}
                    <select
                      value={filters.type}
                      onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme_color2 text-sm"
                    >
                      <option value="">All Types</option>
                      <option value="add">Addition</option>
                      <option value="subtract">Subtraction</option>
                      <option value="adjustment">Adjustment</option>
                      <option value="refund">Refund</option>
                      <option value="purchase">Purchase</option>
                      <option value="withdrawal">Withdrawal</option>
                    </select>

                    {/* User Filter */}
                    <select
                      value={filters.userId}
                      onChange={(e) => setFilters(prev => ({ ...prev, userId: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme_color2 text-sm"
                    >
                      <option value="">All Users</option>
                      {users.slice(0, 50).map(user => (
                        <option key={user._id} value={user._id}>
                          {user.fullname}
                        </option>
                      ))}
                    </select>

                    {/* Clear Filters Button */}
                    {(filters.type || filters.userId || searchTerm) && (
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
                  {selectedRecords.length > 0 && (
                    <div className="flex items-center bg-blue-50 border-[1px] border-blue-500 rounded-lg px-3 py-1.5">
                      <span className="text-sm font-medium text-blue-700">
                        {selectedRecords.length} selected
                      </span>
                    </div>
                  )}

                  {/* Refresh Button */}
                  <button
                    onClick={fetchBalanceHistory}
                    className="inline-flex items-center px-3 py-2 gap-2 cursor-pointer border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    <RefreshCw className="w-4 h-4" /> Refresh
                  </button>
                </div>
              </div>

              {/* Advanced Filters */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* Admin Filter */}
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Admin</label>
                  <select
                    value={filters.adminId}
                    onChange={(e) => setFilters(prev => ({ ...prev, adminId: e.target.value }))}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-theme_color2"
                  >
                    <option value="">All Admins</option>
                    {admins.map(admin => (
                      <option key={admin._id} value={admin._id}>
                        {admin.username || admin.name} ({admin.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Range */}
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-theme_color2"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">End Date</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-theme_color2"
                  />
                </div>

                {/* Amount Range */}
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Min Amount</label>
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minAmount}
                    onChange={(e) => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-theme_color2"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Max Amount</label>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxAmount}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-theme_color2"
                  />
                </div>
              </div>
            </div>

            {/* Balance History Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
                  <h3 className="text-lg font-medium text-gray-700">Loading balance history...</h3>
                </div>
              ) : balanceHistory.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-700">No balance history found</h3>
                  <p className="text-gray-500 mt-1">Try adjusting your search or filters</p>
                  <button
                    onClick={clearFilters}
                    className="mt-4 px-4 py-2 bg-teal-600 cursor-pointer text-white rounded-lg hover:bg-teal-700 transition-colors duration-200"
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
                          checked={selectedRecords.length === balanceHistory.length && balanceHistory.length > 0}
                          onChange={selectAllRecords}
                          className="rounded border-gray-300"
                        />
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('user.fullname')}
                      >
                        <div className="flex items-center">
                          User
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('amount')}
                      >
                        <div className="flex items-center">
                          Amount
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Balance
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Admin
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('createdAt')}
                      >
                        <div className="flex items-center">
                          Date
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {balanceHistory.map((record) => (
                      <tr key={record._id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedRecords.includes(record._id)}
                            onChange={() => toggleSelectRecord(record._id)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex justify-center items-center w-8 h-8 rounded-full bg-gray-300 overflow-hidden mr-3">
                                <User className="w-5 h-5 text-gray-400 m-auto" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{record.user?.fullname || 'N/A'}</div>
                              <div className="text-sm text-gray-500">{record.user?.email || 'N/A'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium ${getTypeBadge(record.type).className}`}>
                            {getTypeBadge(record.type).icon}
                            {getTypeBadge(record.type).label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-semibold ${
                            record.type === 'add' || record.type === 'refund'
                              ? 'text-emerald-600'
                              : 'text-rose-600'
                          }`}>
                            {getTypeBadge(record.type).sign}{formatCurrency(record.amount)}
                          </div>
                          <div className="text-xs text-gray-500 truncate max-w-xs" title={record.notes || 'No notes'}>
                            {record.notes || 'No notes'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="text-sm">
                            <span className="text-gray-600">Old: </span>
                            <span className="font-medium">{formatCurrency(record.oldBalance)}</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-600">New: </span>
                            <span className="font-medium">{formatCurrency(record.newBalance)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.admin?.username || record.admin?.name || 'System'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(record.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => openViewModal(record)}
                              className="bg-blue-600 cursor-pointer text-white p-2 rounded-lg hover:bg-blue-700 transition-colors duration-150"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
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
            {balanceHistory.length > 0 && (
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
                            className={`px-3 py-1 border rounded-lg cursor-pointer text-sm transition-colors duration-150 ${
                              currentPage === pageNum
                                ? 'bg-theme_color2 text-white cursor-pointer'
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
      {showViewModal && <ViewRecordModal />}
    </div>
  );
}

export default Balancehistory;