import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Phone, 
  Calendar, 
  DollarSign, 
  Shield, 
  ShieldOff,
  CheckCircle,
  XCircle,
  User,
  Edit,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  MapPin,
  Globe,
  CreditCard,
  TrendingUp,
  Clock,
  FileText,
  Activity,
  Package,
  ShoppingBag,
  Star,
  Award,
  ChevronRight,
  Download,
  Printer
} from 'lucide-react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../../components/header/Header';
import Sidebar from '../../../components/sidebar/Sidebar';
import toast, { Toaster } from 'react-hot-toast';
import { FaBangladeshiTakaSign } from "react-icons/fa6";
import { TbPhoneCall } from "react-icons/tb";
import profile_img from "../../../assets/profile.png"

function Userdetails() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [transactions, setTransactions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    avgOrderValue: 0,
    lastOrderDate: null,
    activeDays: 0
  });
  
  const { id } = useParams();
  const navigate = useNavigate();
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const token = localStorage.getItem('adminToken');

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    const baseClass = "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium";
    switch (status?.toLowerCase()) {
      case 'active':
        return `${baseClass} bg-green-100 text-green-800`;
      case 'inactive':
        return `${baseClass} bg-yellow-100 text-yellow-800`;
      case 'suspended':
        return `${baseClass} bg-red-100 text-red-800`;
      case 'pending':
        return `${baseClass} bg-blue-100 text-blue-800`;
      default:
        return `${baseClass} bg-gray-100 text-gray-800`;
    }
  };

  // Calculate account age
  const calculateAccountAge = (createdAt) => {
    if (!createdAt) return 'N/A';
    
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now - created);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day';
    if (diffDays < 30) return `${diffDays} days`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;
    return `${Math.floor(diffDays / 365)} years`;
  };

  // Fetch user details
  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${base_url}/api/admin/users/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setUser(response.data.data);
        
        // Calculate stats
        if (response.data.data) {
          const userData = response.data.data;
          const totalOrders = userData.orders?.length || 0;
          const totalSpent = userData.totaldeposit || 0;
          const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
          
          // Calculate active days
          const created = new Date(userData.createdAt);
          const now = new Date();
          const diffTime = Math.abs(now - created);
          const activeDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          setStats({
            totalOrders,
            totalSpent,
            avgOrderValue,
            lastOrderDate: userData.lastOrderDate || null,
            activeDays
          });
        }
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      setError(error.response?.data?.error || 'Failed to fetch user details');
      toast.error(error.response?.data?.error || 'Failed to fetch user details');
    } finally {
      setLoading(false);
    }
  };

  // Fetch user transactions
  const fetchUserTransactions = async () => {
    try {
      setLoadingTransactions(true);
      
      const response = await axios.get(`${base_url}/api/admin/users/${id}/transactions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setTransactions(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to fetch transactions');
    } finally {
      setLoadingTransactions(false);
    }
  };

  // Fetch user orders
  const fetchUserOrders = async () => {
    try {
      setLoadingOrders(true);
      
      const response = await axios.get(`${base_url}/api/admin/users/${id}/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setOrders(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setLoadingOrders(false);
    }
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    
    if (tab === 'transactions') {
      fetchUserTransactions();
    } else if (tab === 'orders') {
      fetchUserOrders();
    }
  };

  // Handle edit user
  const handleEditUser = () => {
    navigate(`/admin/user/edit-details/${id}`);
  };

  // Handle back to users list
  const handleBackToList = () => {
    navigate('/admin/users');
  };

  // Export user data
  const handleExportData = () => {
    if (!user) return;
    
    const data = {
      userDetails: user,
      transactions: transactions,
      orders: orders,
      statistics: stats,
      exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `user-${user.email}-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('User data exported successfully');
  };

  // Print user details
  const handlePrint = () => {
    window.print();
  };

  // Initial fetch
  useEffect(() => {
    if (id) {
      fetchUserDetails();
    }
  }, [id]);

  // Statistics Cards Component
  const StatisticsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Orders</p>
            <p className="text-2xl font-bold text-gray-800">{stats.totalOrders}</p>
          </div>
          <ShoppingBag className="w-8 h-8 text-blue-500" />
        </div>
        <div className="mt-2 text-xs text-gray-500">
          <span className="text-green-600">Active customer</span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Spent</p>
            <p className="text-2xl font-bold text-gray-800">
              ৳{stats.totalSpent?.toLocaleString()}
            </p>
          </div>
          <DollarSign className="w-8 h-8 text-green-500" />
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Avg: ৳{stats.avgOrderValue?.toFixed(0)?.toLocaleString()}/order
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Account Age</p>
            <p className="text-2xl font-bold text-gray-800">
              {calculateAccountAge(user?.createdAt)}
            </p>
          </div>
          <Calendar className="w-8 h-8 text-purple-500" />
        </div>
        <div className="mt-2 text-xs text-gray-500">
          {formatDate(user?.createdAt)}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Account Status</p>
            <div className="text-2xl font-bold">
              <span className={getStatusBadge(user?.status)}>
                {user?.status || 'N/A'}
              </span>
            </div>
          </div>
          <Activity className="w-8 h-8 text-orange-500" />
        </div>
        <div className="mt-2 text-xs text-gray-500">
          {user?.lastLogin ? `Last login: ${formatDate(user.lastLogin)}` : 'Never logged in'}
        </div>
      </div>
    </div>
  );

  // Transactions Tab Component
  const TransactionsTab = () => (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">Recent Transactions</h3>
      </div>
      
      {loadingTransactions ? (
        <div className="text-center py-12">
          <RefreshCw className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
          <h3 className="text-lg font-medium text-gray-700">Loading transactions...</h3>
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-12">
          <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700">No transactions found</h3>
          <p className="text-gray-500 mt-1">This user hasn't made any transactions yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reference
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.slice(0, 10).map((transaction) => (
                <tr key={transaction._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(transaction.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      transaction.type === 'deposit' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {transaction.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {formatCurrency(transaction.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      transaction.status === 'completed' 
                        ? 'bg-green-100 text-green-800'
                        : transaction.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {transaction.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.referenceId || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {transaction.description || 'No description'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // Orders Tab Component
  const OrdersTab = () => (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">Recent Orders</h3>
      </div>
      
      {loadingOrders ? (
        <div className="text-center py-12">
          <RefreshCw className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
          <h3 className="text-lg font-medium text-gray-700">Loading orders...</h3>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700">No orders found</h3>
          <p className="text-gray-500 mt-1">This user hasn't placed any orders yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.slice(0, 10).map((order) => (
                <tr key={order._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{order.orderId || order._id.slice(-8)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.items?.length || 0} items
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {formatCurrency(order.totalAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      order.status === 'delivered' 
                        ? 'bg-green-100 text-green-800'
                        : order.status === 'processing'
                        ? 'bg-blue-100 text-blue-800'
                        : order.status === 'shipped'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      order.paymentStatus === 'paid' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-800">User Details</h1>
                <p className="text-gray-600 text-[13px] md:text-[15px] mt-1">
                  View and manage user account information
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleEditUser}
                  className="inline-flex items-center px-4 py-2 cursor-pointer bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors duration-150"
                >
                  <Edit size={16} className="mr-2" />
                  Edit User
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <RefreshCw className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-medium text-gray-700">Loading user details...</h3>
              <p className="text-gray-500 mt-1">Please wait while we fetch user information</p>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700">Error Loading User</h3>
              <p className="text-gray-500 mt-1">{error}</p>
              <button
                onClick={fetchUserDetails}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-150 inline-flex items-center"
              >
                <RefreshCw size={16} className="mr-2" />
                Retry
              </button>
            </div>
          ) : !user ? (
            <div className="text-center py-20">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700">User Not Found</h3>
              <p className="text-gray-500 mt-1">The requested user does not exist</p>
            </div>
          ) : (
            <>
              {/* User Profile Header */}
              <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-6">
                <div className="flex flex-col md:flex-row md:items-start space-y-6 md:space-y-0 md:space-x-6">
                  {/* Profile Image */}
                  <div className="flex-shrink-0">
                    <img
                      src={profile_img}
                      alt={user.fullname}
                      className="w-32 h-32 rounded-full object-cover border-4 border-gray-100 shadow-sm"
                    />
                  </div>

                  {/* User Info */}
                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">{user.fullname}</h2>
                        <div className="flex flex-wrap items-center gap-4 mb-4">
                          <div className="flex items-center text-gray-600">
                            <Mail className="w-4 h-4 mr-2" />
                            <span>{user.email}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <TbPhoneCall className="w-4 h-4 mr-2" />
                            <span>{user.whatsappnumber || 'Not provided'}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Verification Status */}
                      <div className="mt-4 md:mt-0">
                        {user.emailverified ? (
                          <div className="inline-flex items-center px-4 py-2 border-[1px] border-green-500 bg-green-100 text-green-800 rounded-lg">
                            <CheckCircle className="w-5 h-5 mr-2" />
                            Email Verified
                          </div>
                        ) : (
                          <div className="inline-flex items-center px-4 py-2 bg-yellow-100 border-[1px] border-yellow-500 text-yellow-800 rounded-lg">
                            Email Not Verified
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                      <div className="flex items-center">
                        <FaBangladeshiTakaSign className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm text-gray-500">Current Balance</p>
                          <p className="font-semibold text-gray-800">
                            <FaBangladeshiTakaSign className="inline mr-1" />
                            {user.balance?.toLocaleString() || 0}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <TrendingUp className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm text-gray-500">Total Deposits</p>
                          <p className="font-semibold text-gray-800">
                            <FaBangladeshiTakaSign className="inline mr-1" />
                            {user.totaldeposit?.toLocaleString() || 0}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm text-gray-500">Member Since</p>
                          <p className="font-semibold text-gray-800">{formatDate(user.createdAt)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <Clock className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm text-gray-500">Last Login</p>
                          <p className="font-semibold text-gray-800">
                            {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <Activity className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm text-gray-500">Account Age</p>
                          <p className="font-semibold text-gray-800">{calculateAccountAge(user.createdAt)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <Shield className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm text-gray-500">Account ID</p>
                          <p className="font-semibold text-gray-800 font-mono text-sm">
                            {user._id?.slice(-12)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistics Cards */}
              <StatisticsCards />

              {/* Tabs Navigation */}
              <div className="mb-6">
                <div className="border-b border-gray-200">
                  <nav className="flex space-x-8">
                    <button
                      onClick={() => handleTabChange('overview')}
                      className={`py-3 px-1 inline-flex items-center cursor-pointer border-b-2 font-medium text-sm ${
                        activeTab === 'overview'
                          ? 'border-teal-500 text-teal-600'
                          : 'border-transparent text-gray-500  hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <User className="w-4 h-4 mr-2" />
                      Overview
                    </button>
                    <button
                      onClick={() => handleTabChange('activity')}
                      className={`py-3 px-1 inline-flex items-center cursor-pointer border-b-2 font-medium text-sm ${
                        activeTab === 'activity'
                          ? 'border-teal-500 text-teal-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Activity className="w-4 h-4 mr-2" />
                      Activity Log
                    </button>
                  </nav>
                </div>
              </div>

              {/* Tab Content */}
              <div className="tab-content">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Account Details Card */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <User className="w-5 h-5 mr-2" />
                        Account Details
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium text-gray-700 mb-3">Basic Information</h4>
                          <dl className="space-y-3">
                            <div className="flex justify-between">
                              <dt className="text-sm text-gray-500">Full Name</dt>
                              <dd className="text-sm font-medium text-gray-900">{user.fullname}</dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-sm text-gray-500">Email Address</dt>
                              <dd className="text-sm font-medium text-gray-900">{user.email}</dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-sm text-gray-500">Phone Number</dt>
                              <dd className="text-sm font-medium text-gray-900">
                                {user.whatsappnumber || 'Not provided'}
                              </dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-sm text-gray-500">Account Status</dt>
                              <dd>
                                <span className={getStatusBadge(user.status)}>
                                  {user.status}
                                </span>
                              </dd>
                            </div>
                          </dl>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-700 mb-3">Account Information</h4>
                          <dl className="space-y-3">
                            <div className="flex justify-between">
                              <dt className="text-sm text-gray-500">Account Created</dt>
                              <dd className="text-sm font-medium text-gray-900">{formatDate(user.createdAt)}</dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-sm text-gray-500">Last Updated</dt>
                              <dd className="text-sm font-medium text-gray-900">
                                {user.updatedAt ? formatDate(user.updatedAt) : 'Never'}
                              </dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-sm text-gray-500">Last Login</dt>
                              <dd className="text-sm font-medium text-gray-900">
                                {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                              </dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-sm text-gray-500">Email Verification</dt>
                              <dd>
                                {user.emailverified ? (
                                  <span className="inline-flex items-center text-green-600 text-sm">
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Verified
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center text-yellow-600 text-sm">
                                    <XCircle className="w-4 h-4 mr-1" />
                                    Pending
                                  </span>
                                )}
                              </dd>
                            </div>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'transactions' && <TransactionsTab />}
                {activeTab === 'orders' && <OrdersTab />}
                
                {activeTab === 'activity' && (
                  <div className="bg-white rounded-lg  border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">Account Created</p>
                          <p className="text-sm text-gray-500">{formatDate(user.createdAt)}</p>
                        </div>
                      </div>
                      
                      {user.lastLogin && (
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                              <Clock className="w-4 h-4 text-green-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-900">Last Login</p>
                            <p className="text-sm text-gray-500">{formatDate(user.lastLogin)}</p>
                          </div>
                        </div>
                      )}
                      
                      {user.emailverified && (
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                              <CheckCircle className="w-4 h-4 text-purple-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-900">Email Verified</p>
                            <p className="text-sm text-gray-500">
                              {user.emailVerifiedAt ? formatDate(user.emailVerifiedAt) : 'N/A'}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {stats.lastOrderDate && (
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                              <ShoppingBag className="w-4 h-4 text-orange-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-900">Last Order Placed</p>
                            <p className="text-sm text-gray-500">{formatDate(stats.lastOrderDate)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default Userdetails;