import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const RechargeContext = createContext();

export const RechargeProvider = ({ children }) => {
  const [depositMethods, setDepositMethods] = useState([]);
  const [bonuses, setBonuses] = useState([]);
  const [rechargeHistory, setRechargeHistory] = useState([]);
  const [loading, setLoading] = useState({
    depositMethods: false,
    bonuses: false,
    history: false,
    submitting: false
  });
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [formData, setFormData] = useState({
    accountNumber: '',
    transactionId: '',
    amount: '',
    depositMethodId: ''
  });
  
  // Pagination and filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user?.id;

  // Caching with timestamps
  const lastFetchTime = useRef({
    depositMethods: 0,
    bonuses: 0,
    history: 0
  });
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  const shouldFetchData = (dataType) => {
    const now = Date.now();
    return now - lastFetchTime.current[dataType] > CACHE_DURATION;
  };

  // Fetch deposit methods with caching
  const fetchDepositMethods = async (forceRefresh = false) => {
    if (!forceRefresh && !shouldFetchData('depositMethods') && depositMethods.length > 0) {
      console.log('Using cached deposit methods');
      return;
    }

    try {
      setLoading(prev => ({ ...prev, depositMethods: true }));
      
      const response = await axios.get(`${base_url}/api/user/deposit-methods`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setDepositMethods(response.data.data || []);
        lastFetchTime.current.depositMethods = Date.now();
      } else {
        throw new Error(response.data.message || 'Failed to fetch deposit methods');
      }
    } catch (error) {
      console.error('Error fetching deposit methods:', error);
      toast.error(error.response?.data?.message || 'Failed to load deposit methods');
      if (depositMethods.length === 0) {
        setDepositMethods([]);
      }
    } finally {
      setLoading(prev => ({ ...prev, depositMethods: false }));
    }
  };

  // Fetch bonuses with caching
  const fetchBonuses = async (forceRefresh = false) => {
    if (!forceRefresh && !shouldFetchData('bonuses') && bonuses.length > 0) {
      console.log('Using cached bonuses');
      return;
    }

    try {
      setLoading(prev => ({ ...prev, bonuses: true }));
      
      const response = await axios.get(`${base_url}/api/user/bonuses`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setBonuses(response.data.data || []);
        lastFetchTime.current.bonuses = Date.now();
      } else {
        throw new Error(response.data.message || 'Failed to fetch bonuses');
      }
    } catch (error) {
      console.error('Error fetching bonuses:', error);
      toast.error(error.response?.data?.message || 'Failed to load bonuses');
      if (bonuses.length === 0) {
        setBonuses([]);
      }
    } finally {
      setLoading(prev => ({ ...prev, bonuses: false }));
    }
  };

  // Fetch recharge history with pagination and filtering
  const fetchRechargeHistory = async (forceRefresh = false) => {
    if (!forceRefresh && !shouldFetchData('history') && rechargeHistory.length > 0 && 
        !searchTerm && !statusFilter && currentPage === 1) {
      console.log('Using cached recharge history');
      return;
    }

    try {
      setLoading(prev => ({ ...prev, history: true }));
      
      const params = {
        page: currentPage,
        limit: itemsPerPage
      };
      
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      if (statusFilter) {
        params.status = statusFilter;
      }
      
      const response = await axios.get(`${base_url}/api/user/deposit-history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'userId': userId,
        },
        params: params
      });

      if (response.data.success) {
        setRechargeHistory(response.data.data || []);
        setTotalPages(response.data.pagination?.pages || 1);
        setTotalItems(response.data.pagination?.total || 0);
        lastFetchTime.current.history = Date.now();
      } else {
        throw new Error(response.data.message || 'Failed to fetch deposit history');
      }
    } catch (error) {
      console.error('Error fetching deposit history:', error);
      toast.error(error.response?.data?.message || 'Failed to load deposit history');
      setRechargeHistory([]);
    } finally {
      setLoading(prev => ({ ...prev, history: false }));
    }
  };

  // Fetch all initial data
  const fetchAllData = async () => {
    try {
      await Promise.all([
        fetchDepositMethods(),
        fetchBonuses(),
        fetchRechargeHistory()
      ]);
    } catch (error) {
      console.error('Error fetching all data:', error);
    }
  };

  // Copy agent number to clipboard
  const handleCopyAgentNumber = async (agentNumber, methodId) => {
    try {
      await navigator.clipboard.writeText(agentNumber);
      setCopiedId(methodId);
      toast.success('Agent number copied to clipboard!');
      
      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy agent number');
    }
  };

  // Handle method selection
  const handleMethodSelect = (method) => {
    setSelectedMethod(method);
    setFormData(prev => ({
      ...prev,
      depositMethodId: method._id
    }));
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle recharge submission
  const handleRecharge = async (e) => {
    e.preventDefault();
    
    if (!formData.accountNumber.trim()) {
      toast.error('Please enter account number');
      return;
    }
    
    if (!formData.transactionId.trim()) {
      toast.error('Please enter transaction ID');
      return;
    }
    
    const amount = parseFloat(formData.amount);
    const selectedMethodData = depositMethods.find(m => m._id === selectedMethod?._id);
    
    if (!selectedMethodData) {
      toast.error('Please select a deposit method');
      return;
    }
    
    if (isNaN(amount) || amount < selectedMethodData.minimumDeposit) {
      toast.error(`Minimum deposit is ${selectedMethodData.minimumDeposit}৳`);
      return;
    }
    
    if (amount > selectedMethodData.maximumDeposit) {
      toast.error(`Maximum deposit is ${selectedMethodData.maximumDeposit}৳`);
      return;
    }
    
    try {
      setLoading(prev => ({ ...prev, submitting: true }));
      
      const response = await axios.post(
        `${base_url}/api/user/deposit`,
        {
          accountNumber: formData.accountNumber,
          transactionId: formData.transactionId,
          amount: amount,
          depositMethodId: formData.depositMethodId
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'userId': userId,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        toast.success(response.data.message || 'Deposit request submitted successfully!');
        
        // Reset form
        setFormData({
          accountNumber: '',
          transactionId: '',
          amount: '',
          depositMethodId: ''
        });
        setSelectedMethod(null);
        
        // Fetch updated history
        await fetchRechargeHistory(true);
      }
    } catch (error) {
      console.error('Recharge error:', error);
      toast.error(error.response?.data?.message || 'Failed to process deposit request');
    } finally {
      setLoading(prev => ({ ...prev, submitting: false }));
    }
  };

  // Pagination handlers
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  // Search and filter handlers
  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (value) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setCurrentPage(1);
  };

  // Helper functions
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '0 ৳';
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0
    }).format(amount);
  };

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

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getShowingRange = () => {
    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, totalItems);
    return `Showing ${start} to ${end} of ${totalItems} entries`;
  };

  // Clear cache
  const clearCache = () => {
    lastFetchTime.current = {
      depositMethods: 0,
      bonuses: 0,
      history: 0
    };
  };

  // Refresh all data
  const refreshAllData = async () => {
    await Promise.all([
      fetchDepositMethods(true),
      fetchBonuses(true),
      fetchRechargeHistory(true)
    ]);
  };

  // Initial data fetch
  useEffect(() => {
    if (userId && token) {
      fetchAllData();
    }
  }, []);

  // Fetch history when filters/pagination changes
  useEffect(() => {
    if (userId && token) {
      fetchRechargeHistory();
    }
  }, [currentPage, itemsPerPage, searchTerm, statusFilter]);

  const value = {
    // State
    depositMethods,
    bonuses,
    rechargeHistory,
    loading,
    selectedMethod,
    copiedId,
    formData,
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    searchTerm,
    statusFilter,
    
    // Actions
    fetchDepositMethods,
    fetchBonuses,
    fetchRechargeHistory,
    fetchAllData,
    handleCopyAgentNumber,
    handleMethodSelect,
    handleInputChange,
    handleRecharge,
    handlePageChange,
    handleItemsPerPageChange,
    handleSearch,
    handleStatusFilter,
    clearFilters,
    clearCache,
    refreshAllData,
    
    // Helper functions
    formatCurrency,
    formatDate,
    getStatusColor,
    getShowingRange,
    
    // Setters
    setSelectedMethod,
    setFormData,
    setCurrentPage,
    setItemsPerPage,
    setSearchTerm,
    setStatusFilter
  };

  return (
    <RechargeContext.Provider value={value}>
      {children}
    </RechargeContext.Provider>
  );
};

// Custom hook to use the recharge context
export const useRecharge = () => {
  const context = useContext(RechargeContext);
  if (context === undefined) {
    throw new Error('useRecharge must be used within a RechargeProvider');
  }
  return context;
};