import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Search, 
  UserPlus, 
  Edit, 
  Trash2, 
  Eye, 
  ChevronLeft, 
  ChevronRight, 
  Filter,
  Download,
  Mail,
  Shield,
  ShieldOff,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  User,
  DollarSign,
  Calendar,
  Users,
  AlertTriangle,
  X,
  Key,
  Info,
  Percent,
  Activity,
  UserCheck,
  UserX,
  TrendingUp,
  CreditCard,
  MoreVertical,
  Save,
  Lock
} from 'lucide-react';
import axios from 'axios';
import Header from '../../components/header/Header';
import Sidebar from '../../components/sidebar/Sidebar';
import toast,{Toaster} from 'react-hot-toast';
import { NavLink } from 'react-router-dom';
import { FaBangladeshiTakaSign } from "react-icons/fa6";

// Modern Toggle Switch Component
const ModernToggleSwitch = ({ currentStatus, onChange, disabled, subadminId }) => {
  const isActive = currentStatus;
  
  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        className={`relative inline-flex h-7 w-14 items-center rounded-full transition-all duration-500 ${
          isActive 
            ? 'bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-600 shadow-lg shadow-green-200/50' 
            : 'bg-gradient-to-r from-gray-300 via-gray-400 to-gray-500'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}`}
        onClick={() => !disabled && onChange(subadminId, !isActive)}
        disabled={disabled}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-all duration-500 ${
            isActive ? 'translate-x-8 scale-110' : 'translate-x-1 scale-100'
          }`}
        >
          <span className={`absolute inset-1 rounded-full transition-colors duration-300 ${
            isActive ? 'bg-green-400' : 'bg-gray-400'
          }`}></span>
        </span>
      </button>
      <span className={`text-xs font-medium mt-1 transition-colors duration-300 ${
        isActive ? 'text-green-600' : 'text-gray-500'
      }`}>
        {isActive ? 'ACTIVE' : 'INACTIVE'}
      </span>
    </div>
  );
};

// Commission Display Component
const CommissionBadge = ({ commission }) => (
  <div className="flex items-center justify-start">
    <div className="relative">
      <div className="w-12 h-12 rounded-full border-4 border-teal-200 flex items-center justify-center">
        <div className="text-center">
          <span className="text-lg font-bold text-teal-700">{commission}</span>
        </div>
      </div>
      <div className="absolute -right-1 -top-1 w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center">
        <Percent size={10} className="text-white" />
      </div>
    </div>
  </div>
);

// Commission Update Popup Component
const CommissionUpdatePopup = ({ 
  isOpen, 
  onClose, 
  subadmin, 
  onUpdate,
  loading 
}) => {
  const [commission, setCommission] = useState(subadmin?.commission || '');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && subadmin) {
      setCommission(subadmin.commission || '');
      setError('');
    }
  }, [isOpen, subadmin]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const commissionValue = parseFloat(commission);
    
    if (isNaN(commissionValue)) {
      setError('Please enter a valid number');
      return;
    }
    
    if (commissionValue < 0 || commissionValue > 100) {
      setError('Commission must be between 0 and 100');
      return;
    }

    onUpdate(subadmin._id, commissionValue);
  };

  if (!isOpen || !subadmin) return null;

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Percent className="w-6 h-6 text-purple-500 mr-3" />
              <h2 className="text-xl font-bold text-gray-800">Update Commission</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-150 cursor-pointer p-1 rounded"
              disabled={loading}
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-xl mr-3">
                {subadmin.name?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div>
                <p className="font-semibold text-gray-800">{subadmin.name}</p>
                <p className="text-sm text-gray-600">{subadmin.email}</p>
              </div>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Commission Rate (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={commission}
                    onChange={(e) => setCommission(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter commission percentage"
                    disabled={loading}
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <Percent className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
                {error && (
                  <p className="mt-1 text-sm text-red-600">{error}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Enter a value between 0 and 100
                </p>
              </div>
              
              <div className="bg-purple-50 border-l-4 border-purple-500 p-4 mb-4">
                <div className="flex">
                  <Info className="h-5 w-5 text-purple-500 mr-3" />
                  <div>
                    <p className="text-sm text-purple-800 font-semibold">Current Commission: {subadmin.commission}%</p>
                    <p className="text-sm text-purple-700 mt-1">
                      This will affect all future transactions for this sub admin
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-150 cursor-pointer"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors duration-150 flex items-center ${
                    loading ? 'bg-purple-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 cursor-pointer'
                  }`}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Update Commission
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

// Password Reset Popup Component
const PasswordResetPopup = ({ 
  isOpen, 
  onClose, 
  subadmin, 
  onUpdate,
  loading 
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && subadmin) {
      setNewPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setError('');
    }
  }, [isOpen, subadmin]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    onUpdate(subadmin._id, newPassword);
  };

  if (!isOpen || !subadmin) return null;

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Key className="w-6 h-6 text-yellow-500 mr-3" />
              <h2 className="text-xl font-bold text-gray-800">Reset Password</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-150 cursor-pointer p-1 rounded"
              disabled={loading}
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-xl mr-3">
                {subadmin.name?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div>
                <p className="font-semibold text-gray-800">{subadmin.name}</p>
                <p className="text-sm text-gray-600">{subadmin.email}</p>
              </div>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="Enter new password"
                    disabled={loading}
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <Lock className="w-4 h-4 text-gray-400" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="Confirm new password"
                    disabled={loading}
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <Lock className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>
              
              {error && (
                <div className="mb-4">
                  <div className="bg-red-50 border-l-4 border-red-500 p-3">
                    <div className="flex">
                      <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                      <div>
                        <p className="text-sm text-red-800">{error}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3" />
                  <div>
                    <p className="text-sm text-yellow-800 font-semibold">Important Note</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      The sub admin will need to use this new password immediately for their next login.
                      Make sure to communicate this change securely.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-150 cursor-pointer"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors duration-150 flex items-center ${
                    loading ? 'bg-yellow-400 cursor-not-allowed' : 'bg-yellow-600 hover:bg-yellow-700 cursor-pointer'
                  }`}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Reset Password
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

function Subadminlist() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [subadmins, setSubadmins] = useState([]);
  const [allSubadmins, setAllSubadmins] = useState([]);
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
  const [selectedSubadmins, setSelectedSubadmins] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [selectedSubadmin, setSelectedSubadmin] = useState(null);
  const [deleteAllConfirmation, setDeleteAllConfirmation] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState({
    status: false,
    sort: false
  });
  const [selectedFilters, setSelectedFilters] = useState({
    status: '',
    sort: 'newest'
  });
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [isDeletingSingle, setIsDeletingSingle] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  
  // New states for custom popups
  const [showCommissionPopup, setShowCommissionPopup] = useState(false);
  const [showPasswordPopup, setShowPasswordPopup] = useState(false);
  const [updatingCommission, setUpdatingCommission] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const token = localStorage.getItem('adminToken');

  // Refs for dropdown elements
  const statusDropdownRef = useRef(null);
  const sortDropdownRef = useRef(null);

  // Handle click outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        statusDropdownRef.current && !statusDropdownRef.current.contains(event.target) &&
        sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)
      ) {
        setShowFilterDropdown({
          status: false,
          sort: false
        });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Calculate statistics
  const calculateStatistics = (subadminsData) => {
    const totalSubadmins = subadminsData.length;
    const activeSubadmins = subadminsData.filter(subadmin => subadmin.active === true).length;
    const totalCommission = subadminsData.reduce((sum, subadmin) => sum + (subadmin.commission || 0), 0);
    const avgCommission = totalSubadmins > 0 ? (totalCommission / totalSubadmins).toFixed(1) : 0;
    const maxCommission = Math.max(...subadminsData.map(s => s.commission || 0), 0);
    
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentSubadmins = subadminsData.filter(subadmin => new Date(subadmin.createdAt) > weekAgo).length;

    return {
      totalSubadmins,
      activeSubadmins,
      inactiveSubadmins: totalSubadmins - activeSubadmins,
      totalCommission,
      avgCommission,
      maxCommission,
      recentSubadmins
    };
  };

  // Filter and sort subadmins
  const filterAndSortSubadmins = (subadminsData) => {
    let filteredSubadmins = [...subadminsData];

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filteredSubadmins = filteredSubadmins.filter(subadmin =>
        subadmin.name?.toLowerCase().includes(searchLower) ||
        subadmin.email?.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (selectedFilters.status) {
      const isActive = selectedFilters.status === 'active';
      filteredSubadmins = filteredSubadmins.filter(subadmin => subadmin.active === isActive);
    }

    // Sort filter
    if (selectedFilters.sort === 'name') {
      filteredSubadmins.sort((a, b) => a.name?.localeCompare(b.name));
    } else if (selectedFilters.sort === 'commission-high') {
      filteredSubadmins.sort((a, b) => (b.commission || 0) - (a.commission || 0));
    } else if (selectedFilters.sort === 'commission-low') {
      filteredSubadmins.sort((a, b) => (a.commission || 0) - (b.commission || 0));
    } else {
      filteredSubadmins.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return filteredSubadmins;
  };

  // Fetch subadmins
  const fetchSubadmins = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await axios.get(`${base_url}/api/admin/subadmins`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        const allSubadminsData = response.data.data || [];
        setAllSubadmins(allSubadminsData);
        
        const stats = calculateStatistics(allSubadminsData);
        setStatistics(stats);
        
        const filteredSubadmins = filterAndSortSubadmins(allSubadminsData);
        
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedSubadmins = filteredSubadmins.slice(startIndex, endIndex);
        
        setSubadmins(paginatedSubadmins);
        setTotalItems(filteredSubadmins.length);
        setTotalPages(Math.ceil(filteredSubadmins.length / itemsPerPage));
      }
    } catch (error) {
      console.error('Error fetching subadmins:', error);
      toast.error(error.response?.data?.error || 'Failed to fetch subadmins');
    } finally {
      setLoading(false);
    }
  }, [base_url, token, currentPage, itemsPerPage, searchTerm, selectedFilters]);

  // Initial fetch and on dependencies change
  useEffect(() => {
    fetchSubadmins();
  }, [fetchSubadmins]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchSubadmins();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Handle filter changes
  useEffect(() => {
    setCurrentPage(1);
    fetchSubadmins();
  }, [selectedFilters]);

  // Handle status update
  const handleStatusUpdate = async (subadminId, newStatus) => {
    try {
      setUpdatingStatus(subadminId);
      
      const response = await axios.patch(
        `${base_url}/api/admin/subadmins/${subadminId}/toggle-status`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        toast.success(`Sub admin status updated to ${newStatus ? 'active' : 'inactive'}`);
        
        // Update local state
        setSubadmins(prevSubadmins => 
          prevSubadmins.map(subadmin => 
            subadmin._id === subadminId 
              ? { ...subadmin, active: newStatus }
              : subadmin
          )
        );
        
        setAllSubadmins(prevAllSubadmins =>
          prevAllSubadmins.map(subadmin =>
            subadmin._id === subadminId
              ? { ...subadmin, active: newStatus }
              : subadmin
          )
        );
      }
    } catch (error) {
      console.error('Error updating sub admin status:', error);
      toast.error(error.response?.data?.error || 'Failed to update status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Handle commission update
  const handleCommissionUpdate = async (subadminId, newCommission) => {
    try {
      setUpdatingCommission(true);
      
      const response = await axios.patch(
        `${base_url}/api/admin/subadmins/${subadminId}/commission`,
        { commission: newCommission },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        toast.success(`Commission updated to ${newCommission}%`);
        
        // Update local state
        setSubadmins(prevSubadmins => 
          prevSubadmins.map(subadmin => 
            subadmin._id === subadminId 
              ? { ...subadmin, commission: newCommission }
              : subadmin
          )
        );
        
        setAllSubadmins(prevAllSubadmins =>
          prevAllSubadmins.map(subadmin =>
            subadmin._id === subadminId
              ? { ...subadmin, commission: newCommission }
              : subadmin
          )
        );
        
        // Update statistics
        if (statistics) {
          const updatedStats = calculateStatistics(
            allSubadmins.map(subadmin => 
              subadmin._id === subadminId 
                ? { ...subadmin, commission: newCommission }
                : subadmin
            )
          );
          setStatistics(updatedStats);
        }
        
        setShowCommissionPopup(false);
        setSelectedSubadmin(null);
      }
    } catch (error) {
      console.error('Error updating commission:', error);
      toast.error(error.response?.data?.error || 'Failed to update commission');
    } finally {
      setUpdatingCommission(false);
    }
  };

  // Handle password reset
  const handlePasswordReset = async (subadminId, newPassword) => {
    try {
      setResettingPassword(true);
      
      const response = await axios.put(
        `${base_url}/api/admin/subadmins/${subadminId}/password`,
        { newPassword, confirmPassword: newPassword },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        toast.success('Password reset successfully');
        setShowPasswordPopup(false);
        setSelectedSubadmin(null);
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error(error.response?.data?.error || 'Failed to reset password');
    } finally {
      setResettingPassword(false);
    }
  };

  // Open commission update popup
  const openCommissionPopup = (subadmin) => {
    setSelectedSubadmin(subadmin);
    setShowCommissionPopup(true);
  };

  // Open password reset popup
  const openPasswordPopup = (subadmin) => {
    setSelectedSubadmin(subadmin);
    setShowPasswordPopup(true);
  };

  // Handle delete single subadmin
  const handleDeleteSubadmin = async () => {
    try {
      setIsDeletingSingle(true);
      const response = await axios.delete(`${base_url}/api/admin/subadmins/${selectedSubadmin._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        toast.success('Sub admin deleted successfully');
        setShowDeleteModal(false);
        setSelectedSubadmin(null);
        fetchSubadmins();
      }
    } catch (error) {
      console.error('Error deleting sub admin:', error);
      toast.error(error.response?.data?.error || 'Failed to delete sub admin');
    } finally {
      setIsDeletingSingle(false);
    }
  };

  // Handle delete all selected subadmins
  const handleDeleteAllSubadmins = async () => {
    if (deleteAllConfirmation !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }
    
    try {
      setIsDeletingAll(true);
      
      const response = await axios.delete(`${base_url}/api/admin/subadmins`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: {
          confirmation: deleteAllConfirmation
        }
      });

      if (response.data.success) {
        toast.success(`Successfully deleted ${response.data.data?.deletedCount || 0} sub admins`);
        setShowDeleteAllModal(false);
        setDeleteAllConfirmation('');
        setSelectedSubadmins([]);
        fetchSubadmins();
      }
    } catch (error) {
      console.error('Error deleting sub admins:', error);
      toast.error(error.response?.data?.error || 'Failed to delete sub admins');
    } finally {
      setIsDeletingAll(false);
    }
  };

  // Check if all subadmins on current page are selected
  const allSubadminsSelected = selectedSubadmins.length === subadmins.length && subadmins.length > 0;

  // Check if all filtered subadmins are selected
  const allFilteredSubadminsSelected = selectedSubadmins.length === totalItems && totalItems > 0;

  // Toggle select subadmin
  const toggleSelectSubadmin = (subadminId) => {
    setSelectedSubadmins(prev =>
      prev.includes(subadminId)
        ? prev.filter(id => id !== subadminId)
        : [...prev, subadminId]
    );
  };

  // Select all subadmins on current page
  const selectAllSubadmins = () => {
    if (allSubadminsSelected) {
      setSelectedSubadmins([]);
    } else {
      setSelectedSubadmins(subadmins.map(subadmin => subadmin._id));
    }
  };

  // Select all filtered subadmins
  const selectAllFilteredSubadmins = () => {
    const filteredSubadmins = filterAndSortSubadmins(allSubadmins);
    const filteredSubadminIds = filteredSubadmins.map(subadmin => subadmin._id);
    
    if (allFilteredSubadminsSelected) {
      setSelectedSubadmins([]);
    } else {
      setSelectedSubadmins(filteredSubadminIds);
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

  // Toggle filter dropdown
  const toggleFilterDropdown = (filterType) => {
    setShowFilterDropdown(prev => ({
      status: filterType === 'status' ? !prev.status : false,
      sort: filterType === 'sort' ? !prev.sort : false
    }));
  };

  // Handle filter selection
  const handleFilterSelect = (filterType, value, label) => {
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
      sort: 'newest'
    });
    setSearchTerm('');
  };

  // Open delete modal for single subadmin
  const openDeleteModal = (subadmin) => {
    setSelectedSubadmin(subadmin);
    setShowDeleteModal(true);
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

  // Filter dropdown component
  const FilterDropdown = ({ type, icon, label, options, dropdownRef }) => (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => toggleFilterDropdown(type)}
        className="inline-flex items-center cursor-pointer px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
      >
        {icon}
        <span className="ml-2 text-sm">{label}</span>
        {selectedFilters[type] && (
          <span className="ml-2 w-2 h-2 bg-teal-600 rounded-full"></span>
        )}
      </button>
      
      {showFilterDropdown[type] && (
        <div className="absolute top-full left-0 mt-1 w-48 max-h-[200px] overflow-y-auto bg-white rounded-lg shadow-lg border border-gray-200 z-50 custom-scrollbar">
          <div className="p-2">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleFilterSelect(type, option.value, option.label)}
                className={`w-full text-left px-3 text-nowrap py-2 cursor-pointer mb-1 rounded transition-colors duration-150 ${
                  selectedFilters[type] === option.value ? 'text-teal-600 font-medium' : 'text-gray-700'
                }`}
              >
                {option.label}
              </button>
            ))}
            <div className="border-t border-gray-200 mt-2 pt-2">
              <button
                onClick={() => handleFilterSelect(type, '', 'All')}
                className="w-full text-left px-3 py-2 text-red-600 cursor-pointer rounded transition-colors duration-150"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Statistics Cards Component
  const StatisticsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Sub Admins</p>
            <p className="text-2xl font-bold text-gray-800">{statistics?.totalSubadmins || 0}</p>
          </div>
          <Users className="w-8 h-8 text-blue-500" />
        </div>
        <div className="mt-2 text-xs text-gray-500">
          <span className="text-green-600">Active: {statistics?.activeSubadmins || 0}</span>
          {' | '}
          <span className="text-gray-600">Inactive: {statistics?.inactiveSubadmins || 0}</span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Avg. Commission</p>
            <p className="text-2xl font-bold text-gray-800">
              {statistics?.avgCommission || 0}%
            </p>
          </div>
          <TrendingUp className="w-8 h-8 text-green-500" />
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Max Commission: {statistics?.maxCommission || 0}%
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Commission</p>
            <p className="text-2xl font-bold text-gray-800">
              {statistics?.totalCommission || 0}%
            </p>
          </div>
          <FaBangladeshiTakaSign className="w-8 h-8 text-purple-500" />
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Sum of all commission rates
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Recent (7d)</p>
            <p className="text-2xl font-bold text-gray-800">
              {statistics?.recentSubadmins || 0}
            </p>
          </div>
          <Calendar className="w-8 h-8 text-orange-500" />
        </div>
        <div className="mt-2 text-xs text-gray-500">
          New sub admins added this week
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
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-teal-600 mb-1">Sub Admin Management</h1>
                <p className="text-gray-600 mt-1">Manage all sub admin accounts and commission rates</p>
              </div>
              <NavLink
                to="/admin/sub-admin/new"
                className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors duration-200"
              >
                <UserPlus size={18} className="mr-2" />
                Add New Sub Admin
              </NavLink>
            </div>
          </div>

          {/* Statistics Cards */}
          {statistics && <StatisticsCards />}

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
                      placeholder="Search by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {/* Status Filter */}
                    <FilterDropdown
                      type="status"
                      icon={<Filter size={16} />}
                      label={selectedFilters.status ? `Status: ${selectedFilters.status}` : "Status"}
                      options={[
                        { value: 'active', label: 'Active' },
                        { value: 'inactive', label: 'Inactive' }
                      ]}
                      dropdownRef={statusDropdownRef}
                    />

                    {/* Sort Filter */}
                    <FilterDropdown
                      type="sort"
                      icon={<Download size={16} />}
                      label={
                        selectedFilters.sort === 'name' ? 'Sort: Name' :
                        selectedFilters.sort === 'commission-high' ? 'Sort: Commission High' :
                        selectedFilters.sort === 'commission-low' ? 'Sort: Commission Low' :
                        'Sort: Newest'
                      }
                      options={[
                        { value: 'newest', label: 'Newest First' },
                        { value: 'name', label: 'By Name' },
                        { value: 'commission-high', label: 'Commission (High to Low)' },
                        { value: 'commission-low', label: 'Commission (Low to High)' }
                      ]}
                      dropdownRef={sortDropdownRef}
                    />

                    {/* Clear All Filters Button */}
                    {(selectedFilters.status || selectedFilters.sort !== 'newest' || searchTerm) && (
                      <button
                        onClick={clearAllFilters}
                        className="inline-flex items-center cursor-pointer px-4 py-1.5 border border-gray-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors duration-200"
                      >
                        <X size={16} className="mr-2" />
                        Clear All
                      </button>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  {selectedSubadmins.length > 0 && (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setShowDeleteAllModal(true)}
                        disabled={isDeletingAll}
                        className={`inline-flex items-center px-4 py-2 text-white rounded-[5px] text-sm font-medium transition-colors duration-200 ${
                          isDeletingAll ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 cursor-pointer'
                        }`}
                      >
                        <Trash2 size={16} className="mr-2" />
                        Delete Selected ({selectedSubadmins.length})
                      </button>
                    </div>
                  )}

                  <button
                    onClick={fetchSubadmins}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    <RefreshCw size={16} className="mr-2" />
                    Refresh
                  </button>
                </div>
              </div>
            </div>

            {/* Sub Admins Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
                  <h3 className="text-lg font-medium text-gray-700">Loading sub admins...</h3>
                </div>
              ) : subadmins.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-700">No sub admins found</h3>
                  <p className="text-gray-500 mt-1">Try adjusting your search or filters</p>
                  <NavLink
                    to="/admin/sub-admin/new"
                    className="inline-flex items-center mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors duration-200"
                  >
                    Create First Sub Admin
                  </NavLink>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={allSubadminsSelected}
                            onChange={selectAllSubadmins}
                            className="rounded border-gray-300"
                          />
                          {allFilteredSubadminsSelected && (
                            <span className="ml-2 text-xs text-red-600 font-medium">
                              All Filtered
                            </span>
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Sub Admin
                      </th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Balance
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Commission
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {subadmins.map((subadmin) => (
                      <tr key={subadmin._id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedSubadmins.includes(subadmin._id)}
                            onChange={() => toggleSelectSubadmin(subadmin._id)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-r from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                              {subadmin.name?.charAt(0).toUpperCase() || 'A'}
                            </div>
                            <div className="ml-3">
                              <div className="font-medium text-gray-900">{subadmin.name}</div>
                              <div className="text-sm text-gray-500">{subadmin.email}</div>
                            </div>
                          </div>
                        </td>
                            <td className="px-6 py-4 whitespace-nowrap text-[18px] font-bold">
                          {subadmin.balance} BDT
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <CommissionBadge commission={subadmin.commission} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(subadmin.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <ModernToggleSwitch
                            currentStatus={subadmin.active}
                            onChange={handleStatusUpdate}
                            disabled={updatingStatus === subadmin._id}
                            subadminId={subadmin._id}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {/* Commission Button */}
                            <button
                              onClick={() => openCommissionPopup(subadmin)}
                              className="inline-flex items-center bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-[5px] transition-colors duration-150"
                              title="Edit Commission"
                            >
                              <Percent size={14} className="mr-1" />
                              Commission
                            </button>
                            
                            {/* Edit Profile Button */}
                            <NavLink
                              to={`/admin/subadmins/${subadmin._id}/edit`}
                              className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-[5px] transition-colors duration-150"
                              title="Edit Profile"
                            >
                              <Edit size={14} className="mr-1" />
                              Edit
                            </NavLink>
                            
                            {/* Password Button */}
                            <button
                              onClick={() => openPasswordPopup(subadmin)}
                              className="inline-flex items-center bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1.5 rounded-[5px] transition-colors duration-150"
                              title="Reset Password"
                            >
                              <Key size={14} className="mr-1" />
                              Password
                            </button>
                            
                            {/* Delete Button */}
                            <button
                              onClick={() => openDeleteModal(subadmin)}
                              className="inline-flex items-center bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-[5px] transition-colors duration-150"
                              title="Delete"
                            >
                              <Trash2 size={14} className="mr-1" />
                              Delete
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
            {subadmins.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="hidden md:flex items-center gap-4">
                    <div className="text-sm text-gray-700">
                      Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * itemsPerPage, totalItems)}
                      </span>{' '}
                      of <span className="font-medium">{totalItems}</span> sub admins
                    </div>
                    
                    {/* Select All Filtered Subadmins Button */}
                    {totalItems > itemsPerPage && (
                      <button
                        onClick={selectAllFilteredSubadmins}
                        className="text-sm text-teal-600 hover:text-teal-800 transition-colors duration-150 cursor-pointer"
                      >
                        {allFilteredSubadminsSelected ? 'Deselect All' : 'Select All'} ({totalItems} sub admins)
                      </button>
                    )}
                  </div>
                  
                  <div className="flex justify-between w-full md:w-auto items-center space-x-2">
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
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
                        className="px-3 h-[35px] border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
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
                                ? 'bg-teal-600 text-white border-teal-600 cursor-pointer'
                                : 'border-gray-300 hover:bg-gray-50 cursor-pointer'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}

                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 h-[35px] border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
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

      {/* Commission Update Popup */}
      <CommissionUpdatePopup
        isOpen={showCommissionPopup}
        onClose={() => {
          setShowCommissionPopup(false);
          setSelectedSubadmin(null);
        }}
        subadmin={selectedSubadmin}
        onUpdate={handleCommissionUpdate}
        loading={updatingCommission}
      />

      {/* Password Reset Popup */}
      <PasswordResetPopup
        isOpen={showPasswordPopup}
        onClose={() => {
          setShowPasswordPopup(false);
          setSelectedSubadmin(null);
        }}
        subadmin={selectedSubadmin}
        onUpdate={handlePasswordReset}
        loading={resettingPassword}
      />

      {/* Delete Single Subadmin Modal */}
      {showDeleteModal && selectedSubadmin && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <AlertTriangle className="w-6 h-6 text-red-500 mr-3" />
                  <h2 className="text-xl font-bold text-gray-800">Delete Sub Admin</h2>
                </div>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedSubadmin(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-150 cursor-pointer p-1 rounded"
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
                        This action will permanently delete this sub admin from the database.
                        This cannot be undone!
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center mb-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-xl mr-3">
                      {selectedSubadmin.name?.charAt(0).toUpperCase() || 'A'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{selectedSubadmin.name}</p>
                      <p className="text-sm text-gray-600">{selectedSubadmin.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500">Commission:</p>
                      <p className="font-medium text-teal-600">{selectedSubadmin.commission}%</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Status:</p>
                      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                        selectedSubadmin.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedSubadmin.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-500">Created:</p>
                      <p className="font-medium">{formatDate(selectedSubadmin.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedSubadmin(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-150 cursor-pointer"
                  disabled={isDeletingSingle}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteSubadmin}
                  disabled={isDeletingSingle}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors duration-150 flex items-center ${
                    isDeletingSingle ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 cursor-pointer'
                  }`}
                >
                  {isDeletingSingle ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Sub Admin
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Subadmins Modal */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <AlertTriangle className="w-6 h-6 text-red-500 mr-3" />
                  <h2 className="text-xl font-bold text-gray-800">Delete Selected Sub Admins</h2>
                </div>
                <button
                  onClick={() => {
                    setShowDeleteAllModal(false);
                    setDeleteAllConfirmation('');
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-150 cursor-pointer p-1 rounded"
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
                        This action will permanently delete {selectedSubadmins.length} selected sub admins from the database.
                        This cannot be undone!
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="font-medium text-gray-700 mb-2">Selected Sub Admins ({selectedSubadmins.length}):</p>
                  <div className="max-h-40 overflow-y-auto custom-scrollbar">
                    {subadmins
                      .filter(subadmin => selectedSubadmins.includes(subadmin._id))
                      .slice(0, 5)
                      .map(subadmin => (
                        <div key={subadmin._id} className="flex items-center py-2 border-b border-gray-200 last:border-b-0">
                          <div className="w-8 h-8 bg-gradient-to-r from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-2">
                            {subadmin.name?.charAt(0).toUpperCase() || 'A'}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium truncate">{subadmin.name}</p>
                            <p className="text-xs text-gray-500 truncate">Commission: {subadmin.commission}%</p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            subadmin.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {subadmin.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      ))}
                    {selectedSubadmins.length > 5 && (
                      <div className="text-center py-2 text-sm text-gray-500">
                        + {selectedSubadmins.length - 5} more sub admins
                      </div>
                    )}
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 cursor-text"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteAllModal(false);
                    setDeleteAllConfirmation('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-150 cursor-pointer"
                  disabled={isDeletingAll}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAllSubadmins}
                  disabled={isDeletingAll || deleteAllConfirmation !== 'DELETE'}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors duration-150 flex items-center ${
                    (isDeletingAll || deleteAllConfirmation !== 'DELETE') ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 cursor-pointer'
                  }`}
                >
                  {isDeletingAll ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete {selectedSubadmins.length} Sub Admins
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Subadminlist;