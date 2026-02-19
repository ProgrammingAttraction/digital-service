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
  Phone,
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
  Info
} from 'lucide-react';
import axios from 'axios';
import Header from '../../../components/header/Header';
import Sidebar from '../../../components/sidebar/Sidebar';
import toast,{Toaster} from 'react-hot-toast';
import { FaBangladeshiTakaSign } from "react-icons/fa6";
import { NavLink } from 'react-router-dom';
import { TbPhoneCall } from "react-icons/tb";
import profile_img from "../../../assets/profile.png"

// Modern Toggle Switch Component
const ModernToggleSwitch = ({ currentStatus, onChange, disabled, userId }) => {
  // Determine if switch should show as active (ON position)
  const isActive = currentStatus === 'active';
  
  // Determine new status when toggled
  const newStatus = isActive ? 'inactive' : 'active';
  
  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        className={`relative inline-flex h-7 w-14 items-center rounded-full transition-all duration-500 ${
          isActive 
            ? 'bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-600 shadow-lg shadow-green-200/50' 
            : 'bg-gradient-to-r from-gray-300 via-gray-400 to-gray-500'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}`}
        onClick={() => !disabled && onChange(userId, newStatus)}
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
        {currentStatus.toUpperCase()}
      </span>
    </div>
  );
};

function Inactiveusers() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]); // Store all users for filtering
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [statistics, setStatistics] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    password: '',
    whatsappnumber: '',
    status: 'inactive',
    balance: 0,
    totaldeposit: 0,
    emailverified: false,
    profile: ''
  });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deleteAllConfirmation, setDeleteAllConfirmation] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState({
    status: false,
    verified: false,
    sort: false
  });
  const [selectedFilters, setSelectedFilters] = useState({
    status: '',
    verified: '',
    sort: 'newest'
  });
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [isDeletingSingle, setIsDeletingSingle] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(null); // Track which user is being updated

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const token = localStorage.getItem('adminToken');

  // Refs for dropdown elements
  const statusDropdownRef = useRef(null);
  const verifiedDropdownRef = useRef(null);
  const sortDropdownRef = useRef(null);

  // Handle click outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        statusDropdownRef.current && !statusDropdownRef.current.contains(event.target) &&
        verifiedDropdownRef.current && !verifiedDropdownRef.current.contains(event.target) &&
        sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)
      ) {
        setShowFilterDropdown({
          status: false,
          verified: false,
          sort: false
        });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Calculate statistics from users data
  const calculateStatistics = (usersData) => {
    const totalUsers = usersData.length;
    const activeUsers = usersData.filter(user => user.status === 'active').length;
    const pendingUsers = usersData.filter(user => user.status === 'pending').length;
    const totalBalance = usersData.reduce((sum, user) => sum + (user.balance || 0), 0);
    const totalDeposit = usersData.reduce((sum, user) => sum + (user.totaldeposit || 0), 0);
    const verifiedUsers = usersData.filter(user => user.emailverified === true).length;
    
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentUsers = usersData.filter(user => new Date(user.createdAt) > weekAgo).length;

    return {
      totalUsers,
      activeUsers,
      pendingUsers,
      totalBalance,
      totalDeposit,
      verifiedUsers,
      recentUsers
    };
  };

  // Filter and sort users based on filters
  const filterAndSortUsers = (usersData) => {
    let filteredUsers = [...usersData];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filteredUsers = filteredUsers.filter(user =>
        user.fullname?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.whatsappnumber?.includes(searchTerm)
      );
    }

    if (selectedFilters.status) {
      filteredUsers = filteredUsers.filter(user => user.status === selectedFilters.status);
    }

    if (selectedFilters.verified !== '') {
      const isVerified = selectedFilters.verified === 'verified';
      filteredUsers = filteredUsers.filter(user => user.emailverified === isVerified);
    }

    if (selectedFilters.sort === 'name') {
      filteredUsers.sort((a, b) => a.fullname?.localeCompare(b.fullname));
    } else if (selectedFilters.sort === 'balance-high') {
      filteredUsers.sort((a, b) => (b.balance || 0) - (a.balance || 0));
    } else if (selectedFilters.sort === 'balance-low') {
      filteredUsers.sort((a, b) => (a.balance || 0) - (b.balance || 0));
    } else {
      filteredUsers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return filteredUsers;
  };

  // Fetch inactive users function
  const fetchInactiveUsers = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await axios.get(`${base_url}/api/admin/inactive-users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        const allUsersData = response.data.data || [];
        setAllUsers(allUsersData);
        
        const stats = calculateStatistics(allUsersData);
        setStatistics(stats);
        
        const filteredUsers = filterAndSortUsers(allUsersData);
        
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
        
        setUsers(paginatedUsers);
        setTotalItems(filteredUsers.length);
        setTotalPages(Math.ceil(filteredUsers.length / itemsPerPage));
      }
    } catch (error) {
      console.error('Error fetching inactive users:', error);
      toast.error(error.response?.data?.error || 'Failed to fetch inactive users');
    } finally {
      setLoading(false);
    }
  }, [base_url, token, currentPage, itemsPerPage, searchTerm, selectedFilters]);

  // Initial fetch and on dependencies change
  useEffect(() => {
    fetchInactiveUsers();
  }, [fetchInactiveUsers]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchInactiveUsers();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Handle filter changes
  useEffect(() => {
    setCurrentPage(1);
    fetchInactiveUsers();
  }, [selectedFilters]);

  // Handle user status update
  const handleStatusUpdate = async (userId, newStatus) => {
    try {
      setUpdatingStatus(userId);
      
      // Find the user to get current status
      const userToUpdate = users.find(user => user._id === userId);
      if (!userToUpdate) {
        toast.error('User not found');
        return;
      }
      
      const response = await axios.put(
        `${base_url}/api/admin/users/${userId}/status`,
        { status: newStatus },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        toast.success(`User status updated to ${newStatus}`);
        
        // Update local state
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user._id === userId 
              ? { ...user, status: newStatus }
              : user
          )
        );
        
        // Update allUsers for statistics
        setAllUsers(prevAllUsers =>
          prevAllUsers.map(user =>
            user._id === userId
              ? { ...user, status: newStatus }
              : user
          )
        );
        
        // If user is now active, remove from current view (since this is inactive users page)
        if (newStatus === 'active') {
          // Remove from current users list
          setUsers(prevUsers => prevUsers.filter(user => user._id !== userId));
          // Update total items count
          setTotalItems(prev => prev - 1);
        }
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error(error.response?.data?.error || 'Failed to update user status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Check if all users on current page are selected
  const allUsersSelected = selectedUsers.length === users.length && users.length > 0;

  // Check if all filtered users are selected
  const allFilteredUsersSelected = selectedUsers.length === totalItems && totalItems > 0;

  // Handle delete single user
  const handleDeleteUser = async () => {
    try {
      setIsDeletingSingle(true);
      const response = await axios.delete(`${base_url}/api/admin/users/${selectedUser._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        toast.success('User deleted successfully');
        setShowDeleteModal(false);
        setSelectedUser(null);
        fetchInactiveUsers();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(error.response?.data?.error || 'Failed to delete user');
    } finally {
      setIsDeletingSingle(false);
    }
  };

  // Handle delete all users
  const handleDeleteAllUsers = async () => {
    if (deleteAllConfirmation !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }
    
    try {
      setIsDeletingAll(true);
      
      const response = await axios.delete(`${base_url}/api/admin/users/delete-all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: {
          userIds: selectedUsers
        }
      });

      if (response.data.success) {
        toast.success(`Successfully deleted ${selectedUsers.length} users`);
        setShowDeleteAllModal(false);
        setDeleteAllConfirmation('');
        setSelectedUsers([]);
        fetchInactiveUsers();
      }
    } catch (error) {
      console.error('Error deleting users:', error);
      toast.error(error.response?.data?.error || 'Failed to delete users');
    } finally {
      setIsDeletingAll(false);
    }
  };

  // Handle delete all filtered users
  const handleDeleteAllFilteredUsers = async () => {
    try {
      setShowDeleteAllModal(true);
      
      const response = await axios.delete(`${base_url}/api/admin/users/delete-all-filtered`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: {
          filters: selectedFilters,
          searchTerm: searchTerm
        }
      });

      if (response.data.success) {
        toast.success(`Successfully deleted ${response.data.deletedCount || 0} users`);
        setSelectedUsers([]);
        fetchInactiveUsers();
      }
    } catch (error) {
      console.error('Error deleting filtered users:', error);
      toast.error(error.response?.data?.error || 'Failed to delete filtered users');
    } finally {
      setIsDeletingAll(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      fullname: '',
      email: '',
      password: '',
      whatsappnumber: '',
      status: 'inactive',
      balance: 0,
      totaldeposit: 0,
      emailverified: false,
      profile: ''
    });
  };

  // Open delete modal for single user
  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  // Toggle select user for bulk action
  const toggleSelectUser = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Select all users on current page
  const selectAllUsers = () => {
    if (allUsersSelected) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user._id));
    }
  };

  // Select all filtered users
  const selectAllFilteredUsers = () => {
    const filteredUsers = filterAndSortUsers(allUsers);
    const filteredUserIds = filteredUsers.map(user => user._id);
    
    if (allFilteredUsersSelected) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUserIds);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 border-[1px] border-green-500 text-green-800';
      case 'inactive': return 'bg-yellow-100 border-[1px] border-yellow-500 text-yellow-800';
      case 'suspended': return 'bg-red-100 border-[1px] border-red-500 text-red-800';
      case 'pending': return 'bg-blue-100 border-[1px] border-blue-500 text-blue-800';
      default: return 'bg-gray-100 border-[1px] border-gray-500 text-gray-800';
    }
  };

  // Toggle filter dropdown
  const toggleFilterDropdown = (filterType) => {
    setShowFilterDropdown(prev => ({
      status: filterType === 'status' ? !prev.status : false,
      verified: filterType === 'verified' ? !prev.verified : false,
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
      verified: '',
      sort: 'newest'
    });
    setSearchTerm('');
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
          <span className="ml-2 w-2 h-2 bg-theme_color2 rounded-full"></span>
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
                  selectedFilters[type] === option.value ? ' text-theme_color2 font-medium' : 'text-gray-700'
                }`}
              >
                {option.label}
              </button>
            ))}
            <div className="border-t border-gray-200 mt-2 pt-2">
              <button
                onClick={() => handleFilterSelect(type, '', 'All')}
                className="w-full text-left px-3 py-2  text-red-600 cursor-pointer rounded transition-colors duration-150"
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
            <p className="text-sm text-gray-600">Inactive Users</p>
            <p className="text-2xl font-bold text-gray-800">{statistics?.totalUsers || 0}</p>
          </div>
          <User className="w-8 h-8 text-yellow-500" />
        </div>
        <div className="mt-2 text-xs text-gray-500">
          <span className="text-yellow-600">All Inactive Users</span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Balance</p>
            <p className="text-2xl font-bold text-gray-800">
              ৳{(statistics?.totalBalance || 0)?.toLocaleString()}
            </p>
          </div>
          <FaBangladeshiTakaSign className="w-8 h-8 text-green-500" />
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Total Deposits: ৳{(statistics?.totalDeposit || 0)?.toLocaleString()}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Verified Users</p>
            <p className="text-2xl font-bold text-gray-800">
              {statistics?.verifiedUsers || 0}
            </p>
          </div>
          <Shield className="w-8 h-8 text-purple-500" />
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Verification Rate: {statistics?.totalUsers ? 
            Math.round((statistics.verifiedUsers / statistics.totalUsers) * 100) : 0}%
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Recent Users (7d)</p>
            <p className="text-2xl font-bold text-gray-800">
              {statistics?.recentUsers || 0}
            </p>
          </div>
          <Calendar className="w-8 h-8 text-orange-500" />
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Last updated: {new Date().toLocaleTimeString()}
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
            <h1 className="text-2xl font-bold text-yellow-600 mb-1">Inactive Users</h1>
            <p className="text-gray-600 mt-1">Manage all inactive registered users and their accounts</p>
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
                      placeholder="Search inactive users by name, email, or phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {/* Verified Filter */}
                    <FilterDropdown
                      type="verified"
                      icon={<Shield size={16} />}
                      label={selectedFilters.verified ? `Verified: ${selectedFilters.verified}` : "Verified"}
                      options={[
                        { value: 'verified', label: 'Verified' },
                        { value: 'not-verified', label: 'Not Verified' }
                      ]}
                      dropdownRef={verifiedDropdownRef}
                    />

                    {/* Sort Filter */}
                    <FilterDropdown
                      type="sort"
                      icon={<Download size={16} />}
                      label={
                        selectedFilters.sort === 'name' ? 'Sort: Name' :
                        selectedFilters.sort === 'balance-high' ? 'Sort: Balance High' :
                        selectedFilters.sort === 'balance-low' ? 'Sort: Balance Low' :
                        'Sort: Newest'
                      }
                      options={[
                        { value: 'newest', label: 'Newest First' },
                        { value: 'name', label: 'By Name' },
                        { value: 'balance-high', label: 'Balance (High to Low)' },
                        { value: 'balance-low', label: 'Balance (Low to High)' }
                      ]}
                      dropdownRef={sortDropdownRef}
                    />

                    {/* Clear All Filters Button */}
                    {(selectedFilters.verified || selectedFilters.sort !== 'newest' || searchTerm) && (
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
                  {selectedUsers.length > 0 && (
                    <div className="flex items-center gap-3">
                      
                      {/* Delete All Button when all filtered users are selected */}
                      {allFilteredUsersSelected && (
                        <button
                          onClick={handleDeleteAllFilteredUsers}
                          disabled={isDeletingAll}
                          className={`inline-flex items-center px-4 py-2 text-white rounded-[5px] cursor-pointer text-sm font-medium transition-colors duration-200 ${
                            isDeletingAll ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
                          }`}
                        >
                          <Trash2 size={16} className="mr-2" />
                          Delete All ({totalItems})
                        </button>
                      )}
                    </div>
                  )}

                  <button
                    onClick={fetchInactiveUsers}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                  >
                    <RefreshCw size={16} className="mr-2" />
                    Refresh
                  </button>
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
                  <h3 className="text-lg font-medium text-gray-700">Loading inactive users...</h3>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-12">
                  <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-700">No inactive users found</h3>
                  <p className="text-gray-500 mt-1">Try adjusting your search or filters</p>
                  <button
                    onClick={clearAllFilters}
                    className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-lg cursor-pointer transition-colors duration-200"
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
                            checked={allUsersSelected}
                            onChange={selectAllUsers}
                            className="rounded border-gray-300"
                          />
                          {allFilteredUsersSelected && (
                            <span className="ml-2 text-xs text-red-600 font-medium">
                              All Filtered
                            </span>
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Balance
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Activate
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user._id)}
                            onChange={() => toggleSelectUser(user._id)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <img
                              src={profile_img}
                              alt={user.fullname}
                              className="w-10 h-10 rounded-full mr-3 object-cover"
                            />
                            <div>
                              <div className="font-medium text-gray-900">{user.fullname}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm md:text-[15px] text-gray-900">
                            <div className="flex items-center">
                              <TbPhoneCall size={16} className="mr-2 text-gray-400" />
                              {user.whatsappnumber}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm md:text-[18px] font-semibold text-gray-900">
                            ৳{(user.balance || 0)?.toLocaleString()}
                          </div>
                          <div className="text-xs md:text-[15px] text-gray-500">
                            Deposit: ৳{(user.totaldeposit || 0)?.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm md:text-[15px] text-gray-500">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <ModernToggleSwitch
                            currentStatus={user.status}
                            onChange={handleStatusUpdate}
                            disabled={updatingStatus === user._id}
                            userId={user._id}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <NavLink
                            to={`/admin/user/details/${user._id}`}
                              className="bg-blue-600 rounded-[5px] text-white px-[10px] py-[8px] hover:bg-blue-700 transition-colors duration-150"
                            >
                              <Eye size={16} />
                            </NavLink>
                           <NavLink
                            to={`/admin/user/edit-details/${user._id}`}
                              className="bg-teal-600 rounded-[5px] text-white px-[10px] py-[8px] hover:bg-teal-700 transition-colors duration-150"
                              title="Edit"
                            >
                              <Edit size={16} />
                            </NavLink>
                            <button
                              onClick={() => openDeleteModal(user)}
                              className="bg-red-600 cursor-pointer rounded-[5px] text-white px-[10px] py-[8px] hover:bg-red-700 transition-colors duration-150"
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
              )}
            </div>

            {/* Pagination */}
            {users.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="hidden md:flex items-center gap-4">
                    <div className="text-sm text-gray-700">
                      Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * itemsPerPage, totalItems)}
                      </span>{' '}
                      of <span className="font-medium">{totalItems}</span> inactive users
                    </div>
                    
                    {/* Select All Filtered Users Button */}
                    {totalItems > itemsPerPage && (
                      <button
                        onClick={selectAllFilteredUsers}
                        className="text-sm text-yellow-600 hover:text-yellow-800 transition-colors duration-150 cursor-pointer"
                      >
                        {allFilteredUsersSelected ? 'Deselect All' : 'Select All'} ({totalItems} users)
                      </button>
                    )}
                  </div>
                  
                  <div className="flex justify-between  w-full md:w-auto items-center space-x-2">
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 cursor-pointer"
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
                            className={`px-3 h-[35px] border rounded-lg text-sm transition-colors duration-150 cursor-pointer ${
                              currentPage === pageNum
                                ? 'bg-yellow-600 text-white border-yellow-600'
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

      {/* Delete Single User Modal */}
      {showDeleteModal ? <>
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <AlertTriangle className="w-6 h-6 text-red-500 mr-3" />
              <h2 className="text-xl font-bold text-gray-800">Delete User</h2>
            </div>
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedUser(null);
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
                    This action will permanently delete this user from the database.
                    This cannot be undone!
                  </p>
                </div>
              </div>
            </div>
            
            {selectedUser && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center mb-3">
                  <img
                    src={selectedUser.profile}
                    alt={selectedUser.fullname}
                    className="w-12 h-12 rounded-full mr-3 object-cover"
                    onError={(e) => {
                      e.target.src = 'https://img.freepik.com/premium-vector/flat-vector-illustration-administrator_1033579-56435.jpg';
                    }}
                  />
                  <div>
                    <p className="font-semibold text-gray-800">{selectedUser.fullname}</p>
                    <p className="text-sm text-gray-600">{selectedUser.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-500">Phone:</p>
                    <p className="font-medium">{selectedUser.whatsappnumber}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Balance:</p>
                    <p className="font-medium">৳{(selectedUser.balance || 0)?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Status:</p>
                    <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusBadge(selectedUser.status)}`}>
                      {selectedUser.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-gray-500">Joined:</p>
                    <p className="font-medium">{formatDate(selectedUser.createdAt)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedUser(null);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-150 cursor-pointer"
              disabled={isDeletingSingle}
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteUser}
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
                  Delete User
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div> 
      </>:"" }

      {/* Delete All Users Modal */}
      {showDeleteAllModal ? 
      <>
   <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <AlertTriangle className="w-6 h-6 text-red-500 mr-3" />
              <h2 className="text-xl font-bold text-gray-800">Delete Selected Users</h2>
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
                    This action will permanently delete {selectedUsers.length} selected users from the database.
                    This cannot be undone!
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="font-medium text-gray-700 mb-2">Selected Users ({selectedUsers.length}):</p>
              <div className="max-h-40 overflow-y-auto custom-scrollbar">
                {users
                  .filter(user => selectedUsers.includes(user._id))
                  .slice(0, 5) // Show only first 5 users to avoid too long list
                  .map(user => (
                    <div key={user._id} className="flex items-center py-2 border-b border-gray-200 last:border-b-0">
                      <div className="w-8 h-8 rounded-full bg-gray-300 mr-2 overflow-hidden">
                        <img
                          src={user.profile}
                          alt={user.fullname}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = 'https://img.freepik.com/premium-vector/flat-vector-illustration-administrator_1033579-56435.jpg';
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium truncate">{user.fullname}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadge(user.status)}`}>
                        {user.status}
                      </span>
                    </div>
                  ))}
                {selectedUsers.length > 5 && (
                  <div className="text-center py-2 text-sm text-gray-500">
                    + {selectedUsers.length - 5} more users
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
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-150 cursor-pointer"
              disabled={isDeletingAll}
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteAllUsers}
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
                  Delete {selectedUsers.length} Users
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
      </>
      :""}
    </div>
  );
}

export default Inactiveusers;