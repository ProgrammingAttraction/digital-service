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
  FileText
} from 'lucide-react';
import axios from 'axios';
import Header from '../../components/header/Header';
import Sidebar from '../../components/sidebar/Sidebar';
import toast, { Toaster } from 'react-hot-toast';
import { FaBangladeshiTakaSign } from "react-icons/fa6";

function Alldeposit() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeposits, setSelectedDeposits] = useState([]);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState(null);
  const [statusAction, setStatusAction] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    depositMethod: '',
    userId: '',
    minAmount: '',
    maxAmount: ''
  });
  const [sortConfig, setSortConfig] = useState({
    field: 'createdAt',
    direction: 'desc'
  });
  const [users, setUsers] = useState([]);
  const [depositMethods, setDepositMethods] = useState([]);
  const [newDepositData, setNewDepositData] = useState({
    userId: '',
    depositMethodId: '',
    accountNumber: '',
    transactionId: '',
    amount: '',
    bonusAmount: '0',
    status: 'approved',
    adminNotes: ''
  });

  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const token = localStorage.getItem('adminToken');

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  // Fetch deposit statistics
  const fetchStatistics = useCallback(async () => {
    try {
      const response = await axios.get(`${base_url}/api/admin/deposits/stats/overview`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.data.success) {
        setStatistics(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
      toast.error('Failed to load deposit statistics');
    }
  }, [base_url, token]);

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

  // Fetch deposit methods
  const fetchDepositMethods = useCallback(async () => {
    try {
      const response = await axios.get(`${base_url}/api/admin/deposit-methods`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.data.success) {
        setDepositMethods(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching deposit methods:', error);
    }
  }, [base_url, token]);

  // Fetch deposits with filters
  const fetchDeposits = useCallback(async () => {
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

      const response = await axios.get(`${base_url}/api/admin/deposits`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: params
      });

      if (response.data.success) {
        setDeposits(response.data.data);
        setTotalPages(response.data.pagination?.pages || 1);
        setTotalItems(response.data.pagination?.total || 0);
        
        // Fetch statistics on initial load
        if (!statistics) {
          fetchStatistics();
        }
      }
    } catch (error) {
      console.error('Error fetching deposits:', error);
      toast.error(error.response?.data?.error || 'Failed to fetch deposits');
      setDeposits([]);
    } finally {
      setLoading(false);
    }
  }, [base_url, token, currentPage, itemsPerPage, searchTerm, sortConfig, filters, statistics, fetchStatistics]);

  // Initial fetch
  useEffect(() => {
    fetchDeposits();
    fetchUsers();
    fetchDepositMethods();
  }, []);

  // Handle filter changes
  useEffect(() => {
    setCurrentPage(1);
    const timer = setTimeout(() => {
      fetchDeposits();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, filters, sortConfig]);

  // Handle pagination changes
  useEffect(() => {
    fetchDeposits();
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
      case 'approved':
        return {
          className: 'bg-green-100 text-green-800 border-[1px] border-green-500',
          icon: <CheckCircle className="w-4 h-4 mr-1" />,
          label: 'Approved'
        };
      case 'pending':
        return {
          className: 'bg-yellow-100 text-yellow-800 border-[1px]  border-yellow-500',
          icon: <Clock className="w-4 h-4 mr-1" />,
          label: 'Pending'
        };
      case 'rejected':
        return {
          className: 'bg-red-100 text-red-800 border-[1px]  border-red-500',
          icon: <XCircle className="w-4 h-4 mr-1" />,
          label: 'Rejected'
        };
      default:
        return {
          className: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <AlertCircle className="w-4 h-4 mr-1" />,
          label: status
        };
    }
  };

  // Open view modal
  const openViewModal = (deposit) => {
    setSelectedDeposit(deposit);
    setShowViewModal(true);
  };

  // Open status update modal
  const openStatusModal = (deposit, action) => {
    setSelectedDeposit(deposit);
    setStatusAction(action);
    setAdminNotes('');
    setShowStatusModal(true);
  };

  // Open delete modal
  const openDeleteModal = (deposit) => {
    setSelectedDeposit(deposit);
    setShowDeleteModal(true);
  };

  // Handle status update
  const handleStatusUpdate = async () => {
    try {
      const response = await axios.put(
        `${base_url}/api/admin/deposits/${selectedDeposit._id}/status`,
        {
          status: statusAction,
          adminNotes: adminNotes
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        toast.success(`Deposit ${statusAction} successfully`);
        setShowStatusModal(false);
        setSelectedDeposit(null);
        setAdminNotes('');
        fetchDeposits();
        fetchStatistics(); // Refresh statistics
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(error.response?.data?.error || 'Failed to update status');
    }
  };

  // Handle delete deposit
  const handleDeleteDeposit = async () => {
    try {
      const response = await axios.delete(
        `${base_url}/api/admin/deposits/${selectedDeposit._id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        toast.success('Deposit deleted successfully');
        setShowDeleteModal(false);
        setSelectedDeposit(null);
        fetchDeposits();
        fetchStatistics(); // Refresh statistics
      }
    } catch (error) {
      console.error('Error deleting deposit:', error);
      toast.error(error.response?.data?.error || 'Failed to delete deposit');
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (action) => {
    if (selectedDeposits.length === 0) {
      toast.error('Please select deposits to perform this action');
      return;
    }

    try {
      let endpoint;
      let data;

      if (action === 'approve') {
        endpoint = `${base_url}/api/admin/deposits/bulk-approve`;
        data = { depositIds: selectedDeposits };
      } else if (action === 'reject') {
        endpoint = `${base_url}/api/admin/deposits/bulk-reject`;
        data = { 
          depositIds: selectedDeposits,
          adminNotes: 'Bulk rejected by admin'
        };
      } else if (action === 'delete') {
        // Handle bulk delete
        if (!window.confirm(`Are you sure you want to delete ${selectedDeposits.length} deposits?`)) {
          return;
        }
        
        // Delete one by one
        let successCount = 0;
        let failCount = 0;
        
        for (const depositId of selectedDeposits) {
          try {
            await axios.delete(`${base_url}/api/admin/deposits/${depositId}`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            successCount++;
          } catch (error) {
            console.error(`Failed to delete deposit ${depositId}:`, error);
            failCount++;
          }
        }
        
        toast.success(`Deleted ${successCount} deposits, failed: ${failCount}`);
        setSelectedDeposits([]);
        fetchDeposits();
        fetchStatistics();
        return;
      }

      const response = await axios.post(endpoint, data, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        toast.success(`Successfully ${action}d ${selectedDeposits.length} deposit(s)`);
        setSelectedDeposits([]);
        fetchDeposits();
        fetchStatistics();
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast.error(error.response?.data?.error || `Failed to ${action} deposits`);
    }
  };

  // Handle create deposit
  const handleCreateDeposit = async () => {
    try {
      const response = await axios.post(
        `${base_url}/api/admin/deposits`,
        newDepositData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        toast.success('Deposit created successfully');
        setShowCreateModal(false);
        resetNewDepositForm();
        fetchDeposits();
        fetchStatistics();
      }
    } catch (error) {
      console.error('Error creating deposit:', error);
      toast.error(error.response?.data?.error || 'Failed to create deposit');
    }
  };

  // Reset new deposit form
  const resetNewDepositForm = () => {
    setNewDepositData({
      userId: '',
      depositMethodId: '',
      accountNumber: '',
      transactionId: '',
      amount: '',
      bonusAmount: '0',
      status: 'approved',
      adminNotes: ''
    });
  };

  // Toggle select deposit
  const toggleSelectDeposit = (depositId) => {
    setSelectedDeposits(prev =>
      prev.includes(depositId)
        ? prev.filter(id => id !== depositId)
        : [...prev, depositId]
    );
  };

  // Select all deposits on current page
  const selectAllDeposits = () => {
    if (selectedDeposits.length === deposits.length) {
      setSelectedDeposits([]);
    } else {
      setSelectedDeposits(deposits.map(d => d._id));
    }
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      status: '',
      startDate: '',
      endDate: '',
      depositMethod: '',
      userId: '',
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
    return `Showing ${start} to ${end} of ${totalItems} deposits`;
  };

  // Statistics Cards Component
  const StatisticsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Deposits</p>
            <p className="text-2xl font-bold text-gray-800">
              {statistics?.overview?.totalDeposits || 0}
            </p>
          </div>
          <BarChart3 className="w-8 h-8 text-blue-500" />
        </div>
        <div className="mt-2 text-xs text-gray-500">
          <span className="text-green-600">Approved: {statistics?.overview?.approvedDeposits || 0}</span>
          {' | '}
          <span className="text-yellow-600">Pending: {statistics?.overview?.pendingDeposits || 0}</span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Amount</p>
            <p className="text-2xl font-bold text-gray-800">
              {formatCurrency(statistics?.overview?.totalAmount || 0)}
            </p>
          </div>
          <DollarSign className="w-8 h-8 text-green-500" />
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Approved: {formatCurrency(statistics?.overview?.approvedAmount || 0)}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Today's Deposits</p>
            <p className="text-2xl font-bold text-gray-800">
              {statistics?.overview?.today?.count || 0}
            </p>
          </div>
          <TrendingUp className="w-8 h-8 text-purple-500" />
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Amount: {formatCurrency(statistics?.overview?.today?.amount || 0)}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Monthly Deposits</p>
            <p className="text-2xl font-bold text-gray-800">
              {statistics?.overview?.monthly?.count || 0}
            </p>
          </div>
          <Calendar className="w-8 h-8 text-orange-500" />
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Amount: {formatCurrency(statistics?.overview?.monthly?.amount || 0)}
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
                {statusAction} Deposit
              </h2>
            </div>
            <button
              onClick={() => setShowStatusModal(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-150"
            >
              <X size={20} />
            </button>
          </div>
          
          {selectedDeposit && (
            <div className="mb-6">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                <p className="text-sm text-gray-600 mb-2">Deposit Details:</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">User:</span>
                    <p className="font-medium">{selectedDeposit.user?.fullname || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Amount:</span>
                    <p className="font-medium">{formatCurrency(selectedDeposit.amount)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Transaction ID:</span>
                    <p className="font-medium font-mono">{selectedDeposit.transactionId}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Current Status:</span>
                    <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusBadge(selectedDeposit.status).className}`}>
                      {selectedDeposit.status}
                    </span>
                  </div>
                </div>
              </div>

              {statusAction !== selectedDeposit.status && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Notes (Optional)
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes about this status change..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                  />
                </div>
              )}
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
              onClick={handleStatusUpdate}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-150"
            >
              Confirm {statusAction}
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
              <h2 className="text-xl font-bold text-gray-800">Delete Deposit</h2>
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
                    This action will permanently delete this deposit record.
                    {selectedDeposit?.status === 'approved' && 
                     " If the deposit was approved, the user's balance will be reduced accordingly."}
                  </p>
                </div>
              </div>
            </div>

            {selectedDeposit && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">User:</span>
                    <p className="font-medium">{selectedDeposit.user?.fullname || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Amount:</span>
                    <p className="font-medium">{formatCurrency(selectedDeposit.amount)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Transaction ID:</span>
                    <p className="font-medium font-mono">{selectedDeposit.transactionId}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusBadge(selectedDeposit.status).className}`}>
                      {selectedDeposit.status}
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
              onClick={handleDeleteDeposit}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors duration-150 flex items-center"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Deposit
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // View Deposit Modal
  const ViewDepositModal = () => (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <FileText className="w-6 h-6 text-blue-500 mr-3" />
              <h2 className="text-xl font-bold text-gray-800">Deposit Details</h2>
            </div>
            <button
              onClick={() => setShowViewModal(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-150"
            >
              <X size={20} />
            </button>
          </div>
          
          {selectedDeposit && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Transaction #{selectedDeposit.transactionId}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Created: {formatDate(selectedDeposit.createdAt)}
                  </p>
                </div>
                <div className={`inline-flex items-center px-3 py-1 rounded-full ${getStatusBadge(selectedDeposit.status).className}`}>
                  {getStatusBadge(selectedDeposit.status).icon}
                  <span className="font-medium">{getStatusBadge(selectedDeposit.status).label}</span>
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
                      <span className="font-medium">{selectedDeposit.user?.fullname || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{selectedDeposit.user?.email || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium">{selectedDeposit.user?.whatsappnumber || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Deposit Information
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(selectedDeposit.amount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bonus:</span>
                      <span className="font-medium text-purple-600">
                        {formatCurrency(selectedDeposit.bonusAmount || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total:</span>
                      <span className="font-medium text-blue-600">
                        {formatCurrency(selectedDeposit.amount + (selectedDeposit.bonusAmount || 0))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-700 mb-3">Payment Details</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Account Number:</span>
                      <span className="font-medium font-mono">{selectedDeposit.accountNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Method:</span>
                      <span className="font-medium">{selectedDeposit.depositMethod?.name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Agent Number:</span>
                      <span className="font-medium">{selectedDeposit.depositMethodDetails?.agentNumber || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-700 mb-3">Status Information</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Updated:</span>
                      <span className="font-medium">
                        {selectedDeposit.updatedAt ? formatDate(selectedDeposit.updatedAt) : 'Never'}
                      </span>
                    </div>
                    {selectedDeposit.adminNotes && (
                      <div>
                        <span className="text-gray-600 block mb-1">Admin Notes:</span>
                        <p className="text-sm bg-yellow-50 p-2 rounded border border-yellow-200">
                          {selectedDeposit.adminNotes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                {selectedDeposit.status !== 'approved' && (
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      openStatusModal(selectedDeposit, 'approved');
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors duration-150 flex items-center"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Approve
                  </button>
                )}
                {selectedDeposit.status !== 'rejected' && (
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      openStatusModal(selectedDeposit, 'rejected');
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors duration-150 flex items-center"
                  >
                    <XCircleIcon className="w-4 h-4 mr-2" />
                    Reject
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    openDeleteModal(selectedDeposit);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-150 flex items-center"
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

  // Create Deposit Modal
  const CreateDepositModal = () => (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <DollarSign className="w-6 h-6 text-green-500 mr-3" />
              <h2 className="text-xl font-bold text-gray-800">Create Manual Deposit</h2>
            </div>
            <button
              onClick={() => setShowCreateModal(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-150"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            {/* User Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select User *
              </label>
              <select
                value={newDepositData.userId}
                onChange={(e) => setNewDepositData(prev => ({ ...prev, userId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a user</option>
                {users.map(user => (
                  <option key={user._id} value={user._id}>
                    {user.fullname} ({user.email}) - Balance: {formatCurrency(user.balance || 0)}
                  </option>
                ))}
              </select>
            </div>

            {/* Deposit Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deposit Method (Optional)
              </label>
              <select
                value={newDepositData.depositMethodId}
                onChange={(e) => setNewDepositData(prev => ({ ...prev, depositMethodId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select deposit method</option>
                {depositMethods.map(method => (
                  <option key={method._id} value={method._id}>
                    {method.name} - {method.agentNumber}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaBangladeshiTakaSign className="text-gray-400" />
                </div>
                <input
                  type="number"
                  value={newDepositData.amount}
                  onChange={(e) => setNewDepositData(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter amount"
                  required
                  min="1"
                />
              </div>
            </div>

            {/* Bonus Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bonus Amount (Optional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaBangladeshiTakaSign className="text-gray-400" />
                </div>
                <input
                  type="number"
                  value={newDepositData.bonusAmount}
                  onChange={(e) => setNewDepositData(prev => ({ ...prev, bonusAmount: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter bonus amount"
                  min="0"
                />
              </div>
            </div>

            {/* Account Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Number (Optional)
              </label>
              <input
                type="text"
                value={newDepositData.accountNumber}
                onChange={(e) => setNewDepositData(prev => ({ ...prev, accountNumber: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter account number"
              />
            </div>

            {/* Transaction ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transaction ID (Optional)
              </label>
              <input
                type="text"
                value={newDepositData.transactionId}
                onChange={(e) => setNewDepositData(prev => ({ ...prev, transactionId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter transaction ID or leave blank for auto-generate"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select
                value={newDepositData.status}
                onChange={(e) => setNewDepositData(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Admin Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Admin Notes (Optional)
              </label>
              <textarea
                value={newDepositData.adminNotes}
                onChange={(e) => setNewDepositData(prev => ({ ...prev, adminNotes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add notes about this deposit"
                rows="3"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-150"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateDeposit}
              disabled={!newDepositData.userId || !newDepositData.amount}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors duration-150 flex items-center ${
                !newDepositData.userId || !newDepositData.amount
                  ? 'bg-green-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 cursor-pointer'
              }`}
            >
              <Check className="w-4 h-4 mr-2" />
              Create Deposit
            </button>
          </div>
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
            <h1 className="text-2xl font-bold text-teal-600 mb-1">Deposit Management</h1>
            <p className="text-gray-600 mt-1">View and manage all user deposits</p>
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
                      placeholder="Search by transaction ID, account number..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme_color2"
                    />
                  </div>

                  {/* Quick Filters */}
                  <div className="flex flex-wrap gap-2">
                    {/* Status Filter */}
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme_color2 text-sm"
                    >
                      <option value="">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
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
                    {(filters.status || filters.userId || searchTerm) && (
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
                  {selectedDeposits.length > 0 && (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center bg-blue-50 border-[1px] border-blue-500 rounded-lg px-3 py-1.5">
                        <span className="text-sm font-medium text-blue-700">
                          {selectedDeposits.length} selected
                        </span>
                      </div>
                      
                      {/* Bulk Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleBulkAction('approve')}
                          className="px-3 py-1.5 bg-green-600 text-white border-[1px] border-green-500 rounded-lg hover:bg-green-700 transition-colors duration-200 text-sm"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleBulkAction('reject')}
                          className="px-3 py-1.5 bg-red-600 text-white rounded-lg border-[1px] border-red-500 hover:bg-red-700 transition-colors duration-200 text-sm"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleBulkAction('delete')}
                          className="px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 border-[1px] border-gray-500 transition-colors duration-200 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Refresh Button */}
                  <button
                    onClick={fetchDeposits}
                    className="inline-flex items-center px-3 py-2 gap-2 cursor-pointer border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    <RefreshCw className="w-4 h-4" /> Refresh
                  </button>
                </div>
              </div>

              {/* Advanced Filters */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
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

            {/* Deposits Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
                  <h3 className="text-lg font-medium text-gray-700">Loading deposits...</h3>
                </div>
              ) : deposits.length === 0 ? (
                <div className="text-center py-12">
                  <FaBangladeshiTakaSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-700">No deposits found</h3>
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
                          checked={selectedDeposits.length === deposits.length && deposits.length > 0}
                          onChange={selectAllDeposits}
                          className="rounded border-gray-300"
                        />
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('transactionId')}
                      >
                        <div className="flex items-center">
                          Transaction ID
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
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Method
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
                    {deposits.map((deposit) => (
                      <tr key={deposit._id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedDeposits.includes(deposit._id)}
                            onChange={() => toggleSelectDeposit(deposit._id)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-mono text-sm text-gray-900">
                            {deposit.transactionId}
                          </div>
                          <div className="text-xs text-gray-500">
                            Account: {deposit.accountNumber}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex justify-center items-center w-8 h-8 rounded-full bg-gray-300 overflow-hidden mr-3">
                                <User className="w-5 h-5 text-gray-400 m-auto" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{deposit.user?.fullname || 'N/A'}</div>
                              <div className="text-sm text-gray-500">{deposit.user?.email || 'N/A'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            {formatCurrency(deposit.amount)}
                          </div>
                          {deposit.bonusAmount > 0 && (
                            <div className="text-sm text-purple-600">
                              Bonus: +{formatCurrency(deposit.bonusAmount)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {deposit.depositMethod?.name || 'Manual'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium ${getStatusBadge(deposit.status).className}`}>
                            {getStatusBadge(deposit.status).icon}
                            {getStatusBadge(deposit.status).label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(deposit.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => openViewModal(deposit)}
                              className="bg-blue-600 cursor-pointer text-white p-2 rounded-lg hover:bg-blue-700 transition-colors duration-150"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {deposit.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => openStatusModal(deposit, 'approved')}
                                  className="bg-green-600 cursor-pointer text-white p-2 rounded-lg hover:bg-green-700 transition-colors duration-150"
                                  title="Approve"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => openStatusModal(deposit, 'rejected')}
                                  className="bg-red-600 cursor-pointer text-white p-2 rounded-lg hover:bg-red-700 transition-colors duration-150"
                                  title="Reject"
                                >
                                  <XCircleIcon className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => openDeleteModal(deposit)}
                              className="bg-red-600 cursor-pointer text-white p-2 rounded-lg  transition-colors duration-150"
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
            {deposits.length > 0 && (
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
                                ? 'bg-blue-600 text-white border-blue-600 cursor-pointer'
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
      {showViewModal && <ViewDepositModal />}
      {showCreateModal && <CreateDepositModal />}
    </div>
  );
}

export default Alldeposit;