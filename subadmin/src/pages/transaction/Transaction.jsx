import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Receipt
} from 'lucide-react';
import axios from 'axios';
import Header from '../../components/header/Header';
import Sidebar from '../../components/sidebar/Sidebar';
import toast, { Toaster } from 'react-hot-toast';
import { FaBangladeshiTakaSign } from "react-icons/fa6";

function Transaction() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    service: '',
    userId: '',
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
  const [services, setServices] = useState([]);

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

  // Fetch all services for filter dropdown
  const fetchServices = useCallback(async () => {
    try {
      const response = await axios.get(`${base_url}/api/admin/services`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          limit: 100,
          workStatus: 'active'
        }
      });
      if (response.data.success) {
        setServices(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  }, [base_url, token]);

  // Fetch transactions with filters
  const fetchTransactions = useCallback(async () => {
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

      const response = await axios.get(`${base_url}/api/admin/transactions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: params
      });

      if (response.data.success) {
        setTransactions(response.data.data);
        setTotalPages(response.data.pagination?.pages || 1);
        setTotalItems(response.data.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error(error.response?.data?.error || 'Failed to fetch transactions');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [base_url, token, currentPage, itemsPerPage, searchTerm, sortConfig, filters, statistics]);

  // Initial fetch
  useEffect(() => {
    fetchTransactions();
    fetchUsers();
    fetchServices();
  }, []);

  // Handle filter changes
  useEffect(() => {
    setCurrentPage(1);
    const timer = setTimeout(() => {
      fetchTransactions();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, filters, sortConfig]);

  // Handle pagination changes
  useEffect(() => {
    fetchTransactions();
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

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return {
          className: 'bg-green-100 text-green-800 border-[1px] border-green-500',
          icon: <CheckCircle className="w-4 h-4 mr-1" />,
          label: 'Completed'
        };
      case 'pending':
        return {
          className: 'bg-yellow-100 text-yellow-800 border-[1px] border-yellow-500',
          icon: <Clock className="w-4 h-4 mr-1" />,
          label: 'Pending'
        };
      case 'failed':
        return {
          className: 'bg-red-100 text-red-800 border-[1px] border-red-500',
          icon: <XCircle className="w-4 h-4 mr-1" />,
          label: 'Failed'
        };
      case 'refunded':
        return {
          className: 'bg-blue-100 text-blue-800 border-[1px] border-blue-500',
          icon: <RefreshCw className="w-4 h-4 mr-1" />,
          label: 'Refunded'
        };
      default:
        return {
          className: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <AlertCircle className="w-4 h-4 mr-1" />,
          label: status
        };
    }
  };

  // Get type badge
  const getTypeBadge = (type) => {
    switch (type) {
      case 'credit':
        return {
          className: 'bg-emerald-100 text-emerald-800 border-[1px] border-emerald-500',
          icon: <ArrowUp className="w-4 h-4 mr-1" />,
          label: 'Credit'
        };
      case 'debit':
        return {
          className: 'bg-rose-100 text-rose-800 border-[1px] border-rose-500',
          icon: <ArrowDown className="w-4 h-4 mr-1" />,
          label: 'Debit'
        };
      default:
        return {
          className: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <CreditCard className="w-4 h-4 mr-1" />,
          label: type
        };
    }
  };

  // Open view modal
  const openViewModal = (transaction) => {
    setSelectedTransaction(transaction);
    setShowViewModal(true);
  };

  // Open delete modal
  const openDeleteModal = (transaction) => {
    setSelectedTransaction(transaction);
    setShowDeleteModal(true);
  };

  // Handle delete transaction
  const handleDeleteTransaction = async () => {
    try {
      const response = await axios.delete(
        `${base_url}/api/admin/transactions/${selectedTransaction._id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        toast.success('Transaction deleted successfully');
        setShowDeleteModal(false);
        setSelectedTransaction(null);
        fetchTransactions();
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error(error.response?.data?.error || 'Failed to delete transaction');
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedTransactions.length === 0) {
      toast.error('Please select transactions to delete');
      return;
    }

    // Check if any selected transactions are completed
    const completedTransactions = transactions.filter(t => 
      selectedTransactions.includes(t._id) && t.status === 'completed'
    );
    
    if (completedTransactions.length > 0) {
      toast.error('Cannot delete completed transactions. Please select only pending or failed transactions.');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedTransactions.length} transaction(s)?`)) {
      return;
    }
    
    try {
      let successCount = 0;
      let failCount = 0;
      
      for (const transactionId of selectedTransactions) {
        try {
          await axios.delete(`${base_url}/api/admin/transactions/${transactionId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          successCount++;
        } catch (error) {
          console.error(`Failed to delete transaction ${transactionId}:`, error);
          failCount++;
        }
      }
      
      toast.success(`Deleted ${successCount} transactions, failed: ${failCount}`);
      setSelectedTransactions([]);
      fetchTransactions();
    } catch (error) {
      console.error('Error in bulk delete:', error);
      toast.error('Failed to delete transactions');
    }
  };

  // Toggle select transaction
  const toggleSelectTransaction = (transactionId) => {
    setSelectedTransactions(prev =>
      prev.includes(transactionId)
        ? prev.filter(id => id !== transactionId)
        : [...prev, transactionId]
    );
  };

  // Select all transactions on current page
  const selectAllTransactions = () => {
    if (selectedTransactions.length === transactions.length) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(transactions.map(t => t._id));
    }
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      type: '',
      status: '',
      service: '',
      userId: '',
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
    return `Showing ${start} to ${end} of ${totalItems} transactions`;
  };

  // Statistics Cards Component
  const StatisticsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Transactions</p>
            <p className="text-2xl font-bold text-gray-800">
              {statistics?.total || 0}
            </p>
          </div>
          <BarChart3 className="w-8 h-8 text-blue-500" />
        </div>
        <div className="mt-2 text-xs text-gray-500">
          <span className="text-emerald-600">Credit: {statistics?.byType?.credit?.count || 0}</span>
          {' | '}
          <span className="text-rose-600">Debit: {statistics?.byType?.debit?.count || 0}</span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Amount</p>
            <p className="text-2xl font-bold text-gray-800">
              {formatCurrency(statistics?.totalAmount || 0)}
            </p>
          </div>
          <DollarSign className="w-8 h-8 text-green-500" />
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Net: {formatCurrency((statistics?.creditTotal || 0) - (statistics?.debitTotal || 0))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Credit Total</p>
            <p className="text-2xl font-bold text-emerald-600">
              {formatCurrency(statistics?.creditTotal || 0)}
            </p>
          </div>
          <ArrowUp className="w-8 h-8 text-emerald-500" />
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Transactions: {statistics?.byType?.credit?.count || 0}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Debit Total</p>
            <p className="text-2xl font-bold text-rose-600">
              {formatCurrency(statistics?.debitTotal || 0)}
            </p>
          </div>
          <ArrowDown className="w-8 h-8 text-rose-500" />
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Transactions: {statistics?.byType?.debit?.count || 0}
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
              <h2 className="text-xl font-bold text-gray-800">Delete Transaction</h2>
            </div>
            <button
              onClick={() => setShowDeleteModal(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-150"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="mb-6">
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
                <div>
                  <p className="text-sm text-red-800 font-semibold">Warning</p>
                  <p className="text-sm text-red-700 mt-1">
                    {selectedTransaction?.status === 'completed' ? 
                      "This transaction is completed and may have affected user balance. Deleting it could cause inconsistencies in user balance." :
                      "This action will permanently delete this transaction record."}
                  </p>
                </div>
              </div>
            </div>

            {selectedTransaction && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Reference:</span>
                    <p className="font-medium font-mono">{selectedTransaction.reference}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">User:</span>
                    <p className="font-medium">{selectedTransaction.user?.fullname || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Amount:</span>
                    <p className={`font-medium ${
                      selectedTransaction.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {selectedTransaction.type === 'credit' ? '+' : '-'}{formatCurrency(selectedTransaction.amount)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Service:</span>
                    <p className="font-medium">{selectedTransaction.service}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Type:</span>
                    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full ${getTypeBadge(selectedTransaction.type).className}`}>
                      {getTypeBadge(selectedTransaction.type).icon}
                      {getTypeBadge(selectedTransaction.type).label}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusBadge(selectedTransaction.status).className}`}>
                      {getStatusBadge(selectedTransaction.status).label}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-150"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteTransaction}
              disabled={selectedTransaction?.status === 'completed'}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors duration-150 flex items-center ${
                selectedTransaction?.status === 'completed'
                  ? 'bg-red-400 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700 cursor-pointer'
              }`}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {selectedTransaction?.status === 'completed' ? 'Cannot Delete Completed' : 'Delete Transaction'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // View Transaction Modal
  const ViewTransactionModal = () => (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Receipt className="w-6 h-6 text-blue-500 mr-3" />
              <h2 className="text-xl font-bold text-gray-800">Transaction Details</h2>
            </div>
            <button
              onClick={() => setShowViewModal(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-150"
            >
              <X size={20} />
            </button>
          </div>
          
          {selectedTransaction && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Reference: {selectedTransaction.reference}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Created: {formatDate(selectedTransaction.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full ${getTypeBadge(selectedTransaction.type).className}`}>
                    {getTypeBadge(selectedTransaction.type).icon}
                    <span className="font-medium">{getTypeBadge(selectedTransaction.type).label}</span>
                  </span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full ${getStatusBadge(selectedTransaction.status).className}`}>
                    {getStatusBadge(selectedTransaction.status).icon}
                    <span className="font-medium">{getStatusBadge(selectedTransaction.status).label}</span>
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
                      <span className="font-medium">{selectedTransaction.user?.fullname || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{selectedTransaction.user?.email || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium">{selectedTransaction.user?.whatsappnumber || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Transaction Information
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount:</span>
                      <span className={`font-medium ${
                        selectedTransaction.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {selectedTransaction.type === 'credit' ? '+' : '-'}{formatCurrency(selectedTransaction.amount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Service:</span>
                      <span className="font-medium">{selectedTransaction.service}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Description:</span>
                      <span className="font-medium text-right">{selectedTransaction.description || 'N/A'}</span>
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
                      <span className="text-gray-600">Balance Before:</span>
                      <span className="font-medium">{formatCurrency(selectedTransaction.balanceBefore)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Balance After:</span>
                      <span className="font-medium">{formatCurrency(selectedTransaction.balanceAfter)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Net Change:</span>
                      <span className={`font-medium ${
                        selectedTransaction.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {selectedTransaction.type === 'credit' ? '+' : '-'}{formatCurrency(selectedTransaction.amount)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-700 mb-3">Transaction Details</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reference:</span>
                      <span className="font-medium font-mono">{selectedTransaction.reference}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium">{formatDate(selectedTransaction.createdAt)}</span>
                    </div>
                    {selectedTransaction.updatedAt && selectedTransaction.updatedAt !== selectedTransaction.createdAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Updated:</span>
                        <span className="font-medium">{formatDate(selectedTransaction.updatedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    openDeleteModal(selectedTransaction);
                  }}
                  disabled={selectedTransaction.status === 'completed'}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-150 flex items-center ${
                    selectedTransaction.status === 'completed'
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-red-600 text-white hover:bg-red-700 cursor-pointer'
                  }`}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </button>
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
            <h1 className="text-2xl font-bold text-teal-600 mb-1">Transaction Management</h1>
            <p className="text-gray-600 mt-1">View and manage all user transactions</p>
          </div>

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
                      placeholder="Search by reference, description..."
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
                      <option value="credit">Credit</option>
                      <option value="debit">Debit</option>
                    </select>

                    {/* Status Filter */}
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme_color2 text-sm"
                    >
                      <option value="">All Status</option>
                      <option value="completed">Completed</option>
                      <option value="pending">Pending</option>
                      <option value="failed">Failed</option>
                      <option value="refunded">Refunded</option>
                    </select>

                    {/* Service Filter */}
                    <select
                      value={filters.service}
                      onChange={(e) => setFilters(prev => ({ ...prev, service: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme_color2 text-sm"
                    >
                      <option value="">All Services</option>
                      {Array.from(new Set(transactions.map(t => t.service).filter(Boolean))).map(service => (
                        <option key={service} value={service}>
                          {service}
                        </option>
                      ))}
                    </select>

                    {/* Clear Filters Button */}
                    {(filters.type || filters.status || filters.service || searchTerm) && (
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
                  {selectedTransactions.length > 0 && (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center bg-blue-50 border-[1px] border-blue-500 rounded-lg px-3 py-1.5">
                        <span className="text-sm font-medium text-blue-700">
                          {selectedTransactions.length} selected
                        </span>
                      </div>
                      
                      {/* Bulk Delete Button */}
                      <button
                        onClick={handleBulkDelete}
                        className="px-3 py-1.5 bg-red-600 text-white border-[1px] border-red-500 rounded-lg hover:bg-red-700 transition-colors duration-200 text-sm"
                      >
                        Delete Selected
                      </button>
                    </div>
                  )}

                  {/* Refresh Button */}
                  <button
                    onClick={fetchTransactions}
                    className="inline-flex items-center px-3 py-2 gap-2 cursor-pointer border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    <RefreshCw className="w-4 h-4" /> Refresh
                  </button>
                </div>
              </div>

              {/* Advanced Filters */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* User Filter */}
                <div>
                  <label className="block text-xs text-gray-600 mb-1">User</label>
                  <select
                    value={filters.userId}
                    onChange={(e) => setFilters(prev => ({ ...prev, userId: e.target.value }))}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-theme_color2"
                  >
                    <option value="">All Users</option>
                    {users.slice(0, 50).map(user => (
                      <option key={user._id} value={user._id}>
                        {user.fullname} ({user.email})
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

            {/* Transactions Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
                  <h3 className="text-lg font-medium text-gray-700">Loading transactions...</h3>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-700">No transactions found</h3>
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
                          checked={selectedTransactions.length === transactions.length && transactions.length > 0}
                          onChange={selectAllTransactions}
                          className="rounded border-gray-300"
                        />
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('reference')}
                      >
                        <div className="flex items-center">
                          Reference
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('user.fullname')}
                      >
                        <div className="flex items-center">
                          User
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('amount')}
                      >
                        <div className="flex items-center">
                          Amount
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('service')}
                      >
                        <div className="flex items-center">
                          Service
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Status
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
                    {transactions.map((transaction) => (
                      <tr key={transaction._id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedTransactions.includes(transaction._id)}
                            onChange={() => toggleSelectTransaction(transaction._id)}
                            className="rounded border-gray-300"
                            disabled={transaction.status === 'completed'}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-mono text-sm text-gray-900">
                            {transaction.reference}
                          </div>
                          <div className="text-xs text-gray-500">
                            {transaction.description || 'No description'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex justify-center items-center w-8 h-8 rounded-full bg-gray-300 overflow-hidden mr-3">
                                <User className="w-5 h-5 text-gray-400 m-auto" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{transaction.user?.fullname || 'N/A'}</div>
                              <div className="text-sm text-gray-500">{transaction.user?.email || 'N/A'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-semibold ${
                            transaction.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'
                          }`}>
                            {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Balance: {formatCurrency(transaction.balanceAfter)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaction.service}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium ${getStatusBadge(transaction.status).className}`}>
                            {getStatusBadge(transaction.status).icon}
                            {getStatusBadge(transaction.status).label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(transaction.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => openViewModal(transaction)}
                              className="bg-blue-600 cursor-pointer text-white p-2 rounded-lg hover:bg-blue-700 transition-colors duration-150"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {/* <button
                              onClick={() => openDeleteModal(transaction)}
                              disabled={transaction.status === 'completed'}
                              className={`p-2 rounded-lg transition-colors duration-150 ${
                                transaction.status === 'completed'
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  : 'bg-red-600 text-white hover:bg-red-700 cursor-pointer'
                              }`}
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button> */}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {transactions.length > 0 && (
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
      {showDeleteModal && <DeleteModal />}
      {showViewModal && <ViewTransactionModal />}
    </div>
  );
}

export default Transaction;