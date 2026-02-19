import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const DashboardContext = createContext();

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};

export const DashboardProvider = ({ children }) => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const token = localStorage.getItem('adminToken');
  
  // Admin profile state
  const [adminProfile, setAdminProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  
  // Dashboard states
  const [dashboardData, setDashboardData] = useState(null);
  const [usersHistory, setUsersHistory] = useState([]);
  const [ordersHistory, setOrdersHistory] = useState([]);
  const [depositsHistory, setDepositsHistory] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initial empty state for dashboard
  const initialDashboardData = {
    currentDate: new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    users: {
      total: 0,
      active: 0,
      pending: 0,
      suspended: 0,
      verified: 0,
      totalBalance: 0,
      totalDeposit: 0,
      newUsersToday: 0
    },
    deposits: {
      total: 0,
      totalAmount: 0,
      totalBonus: 0,
      approved: { count: 0, amount: 0, bonus: 0 },
      pending: { count: 0, amount: 0 },
      rejected: 0,
      today: { count: 0, amount: 0, bonus: 0 },
      weekly: { count: 0, amount: 0, bonus: 0 },
      monthly: { count: 0, amount: 0, bonus: 0 },
      breakdown: []
    },
    orders: {
      total: 0,
      totalAmount: 0,
      completed: { count: 0, amount: 0 },
      pending: { count: 0, amount: 0 },
      processing: { count: 0, amount: 0 },
      cancelled: 0,
      today: { count: 0, amount: 0 },
      weekly: { count: 0, amount: 0 },
      monthly: { count: 0, amount: 0 },
      breakdown: []
    },
    systemTotals: {
      totalRevenue: 0,
      totalTransactions: 0,
      totalClients: 0,
      averageOrderValue: 0,
      averageDepositValue: 0
    },
    quickStats: {
      pendingActions: 0,
      revenueToday: 0,
      depositsToday: 0,
      totalPendingDeposits: 0,
      totalPendingOrders: 0
    },
    recentActivity: {
      deposits: [],
      orders: [],
      users: []
    }
  };

  // Initialize with empty data
  useEffect(() => {
    if (!isInitialized) {
      setDashboardData(initialDashboardData);
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // ========== ADMIN PROFILE FUNCTIONS ==========

  // Fetch admin profile
  const fetchAdminProfile = async () => {
    if (!token) {
      console.warn('No token found for fetching admin profile');
      return null;
    }
    
    try {
      setProfileLoading(true);
      const response = await axios.get(`${base_url}/api/sub-admin/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setAdminProfile(response.data.data);
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching admin profile:', error);
      const errorMessage = error.response?.data?.error || 'Failed to load profile';
      toast.error(errorMessage);
      return null;
    } finally {
      setProfileLoading(false);
    }
  };

  // Update admin profile
  const updateAdminProfile = async (profileData) => {
    if (!token) {
      toast.error('No authentication token found');
      throw new Error('No authentication token');
    }
    
    try {
      const response = await axios.put(`${base_url}/api/sub-admin/profile`, profileData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setAdminProfile(response.data.data);
        toast.success('Profile updated successfully!');
        return response.data.data;
      }
      throw new Error('Failed to update profile');
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMessage = error.response?.data?.error || 'Failed to update profile';
      toast.error(errorMessage);
      throw error;
    }
  };

  // Change admin password
  const changeAdminPassword = async (passwordData) => {
    if (!token) {
      toast.error('No authentication token found');
      throw new Error('No authentication token');
    }
    
    try {
      const response = await axios.put(`${base_url}/api/sub-admin/change-password`, passwordData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        toast.success('Password changed successfully!');
        return response.data;
      }
      throw new Error('Failed to change password');
    } catch (error) {
      console.error('Error changing password:', error);
      const errorMessage = error.response?.data?.error || 'Failed to change password';
      toast.error(errorMessage);
      throw error;
    }
  };

  // Refresh admin profile
  const refreshAdminProfile = async () => {
    return await fetchAdminProfile();
  };

  // ========== DASHBOARD FUNCTIONS ==========

  // Fetch dashboard data (background fetch - doesn't show loading)
  const fetchDashboardData = async () => {
    if (!token) {
      console.warn('No token found for fetching dashboard data');
      return;
    }
    
    try {
      const response = await axios.get(`${base_url}/api/sub-admin/dashboard/overview`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setDashboardData(response.data.data);
        return response.data.data;
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    }
  };

  // Fetch history data in background
  const fetchHistoryData = async (type, params = {}) => {
    if (!token) {
      console.warn('No token found for fetching history data');
      return;
    }
    
    try {
      let endpoint = '';
      
      switch(type) {
        case 'users':
          endpoint = `${base_url}/api/sub-admin/users`;
          break;
        case 'orders':
          endpoint = `${base_url}/api/sub-admin/orders`;
          break;
        case 'deposits':
          endpoint = `${base_url}/api/sub-admin/deposits`;
          break;
        default:
          console.error('Invalid history type:', type);
          return;
      }

      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      if (response.data.success) {
        switch(type) {
          case 'users':
            setUsersHistory(response.data.data || response.data.users || []);
            break;
          case 'orders':
            setOrdersHistory(response.data.data || response.data.orders || []);
            break;
          case 'deposits':
            setDepositsHistory(response.data.data || response.data.deposits || []);
            break;
        }
      }
    } catch (error) {
      console.error(`Error fetching ${type} history:`, error);
    }
  };

  // Load all data in background on mount
  useEffect(() => {
    if (isInitialized && token) {
      // Fetch admin profile first
      fetchAdminProfile();
      
      // Fetch dashboard data
      fetchDashboardData();
      
      // Fetch initial history data
      const today = new Date().toISOString().split('T')[0];
      fetchHistoryData('users', { startDate: today, endDate: today });
      fetchHistoryData('orders', { startDate: today, endDate: today });
      fetchHistoryData('deposits', { startDate: today, endDate: today });
    }
  }, [isInitialized, token]);

  // Refresh all data
  const refreshDashboard = async () => {
    await Promise.all([
      fetchAdminProfile(),
      fetchDashboardData(),
      fetchHistoryData('users'),
      fetchHistoryData('orders'),
      fetchHistoryData('deposits')
    ]);
    toast.success('Dashboard refreshed');
  };

  // Fetch with custom date filter
  const fetchWithDateFilter = async (startDate, endDate) => {
    await Promise.all([
      fetchHistoryData('users', { startDate, endDate }),
      fetchHistoryData('orders', { startDate, endDate }),
      fetchHistoryData('deposits', { startDate, endDate })
    ]);
  };

  // Get admin role badge color
  const getAdminRoleBadgeColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'superadmin': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'admin': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'moderator': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Format date utility function
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get profile image URL
  const getProfileImageUrl = () => {
    return "https://i.ibb.co.com/RTkGPXtm/Whats-App-Image-2026-01-01-at-6-38-12-PM.jpg";
  };

  // Clear all data (for logout)
  const clearDashboardData = () => {
    setAdminProfile(null);
    setDashboardData(initialDashboardData);
    setUsersHistory([]);
    setOrdersHistory([]);
    setDepositsHistory([]);
  };

  const value = {
    // Admin profile
    adminProfile,
    profileLoading,
    fetchAdminProfile,
    updateAdminProfile,
    changeAdminPassword,
    refreshAdminProfile,
    
    // Dashboard data
    dashboardData: dashboardData || initialDashboardData,
    usersHistory,
    ordersHistory,
    depositsHistory,
    
    // Functions
    fetchDashboardData,
    fetchHistoryData,
    refreshDashboard,
    fetchWithDateFilter,
    clearDashboardData,
    
    // Utility functions
    getAdminRoleBadgeColor,
    formatDate,
    getProfileImageUrl
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};