import React, { useState, useEffect } from 'react';
import { 
  Save, 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Shield, 
  ShieldOff, 
  DollarSign,
  Plus,
  Minus,
  History,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Calendar,
  Eye,
  EyeOff,
  Key,
  Upload,
  X,
  TrendingUp,
  Activity,
  Clock
} from 'lucide-react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Header from '../../../components/header/Header';
import Sidebar from '../../../components/sidebar/Sidebar';
import toast, { Toaster } from 'react-hot-toast';
import { FaBangladeshiTakaSign } from "react-icons/fa6";
import profile_img from "../../../assets/profile.png"
function Updateuser() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [balanceHistory, setBalanceHistory] = useState([]);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [balanceAction, setBalanceAction] = useState('add'); // 'add' or 'subtract'
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceNotes, setBalanceNotes] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasswordUpdateModal, setShowPasswordUpdateModal] = useState(false);
  const [passwordUpdateData, setPasswordUpdateData] = useState({
    newPassword: '',
    confirmNewPassword: ''
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  
  const { id } = useParams();
  const navigate = useNavigate();
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const token = localStorage.getItem('adminToken');

  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    password: '',
    confirmPassword: '',
    whatsappnumber: '',
    status: 'pending',
    balance: 0,
    totaldeposit: 0,
    emailverified: false,
    profile: ''
  });

  const [originalData, setOriginalData] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  // Check if form has changes
  useEffect(() => {
    if (originalData) {
      const changed = Object.keys(formData).some(key => {
        if (key === 'password' || key === 'confirmPassword') return false;
        return formData[key] !== originalData[key];
      });
      setHasChanges(changed);
    }
  }, [formData, originalData]);

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
        const userData = response.data.data;
        setFormData({
          fullname: userData.fullname || '',
          email: userData.email || '',
          password: '',
          confirmPassword: '',
          whatsappnumber: userData.whatsappnumber || '',
          status: userData.status || 'pending',
          balance: userData.balance || 0,
          totaldeposit: userData.totaldeposit || 0,
          emailverified: userData.emailverified || false,
          profile: userData.profile || ''
        });
        setOriginalData({ ...userData, password: '', confirmPassword: '' });
        
        // Fetch balance history if you have that endpoint
        fetchBalanceHistory();
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      setError(error.response?.data?.error || 'Failed to fetch user details');
      toast.error('Failed to fetch user details');
    } finally {
      setLoading(false);
    }
  };

  // Fetch balance history
  const fetchBalanceHistory = async () => {
    try {
      // If you have a separate endpoint for balance history
      // const response = await axios.get(`${base_url}/api/admin/users/${id}/balance-history`, {
      //   headers: { 'Authorization': `Bearer ${token}` }
      // });
      // if (response.data.success) {
      //   setBalanceHistory(response.data.data || []);
      // }
      
      // For now, let's use a mock or empty array
      setBalanceHistory([]);
    } catch (error) {
      console.error('Error fetching balance history:', error);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle password update modal input changes
  const handlePasswordUpdateChange = (e) => {
    const { name, value } = e.target;
    setPasswordUpdateData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle password update
  const handlePasswordUpdate = async () => {
    const { newPassword, confirmNewPassword } = passwordUpdateData;

    // Validation
    if (!newPassword || newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setSaving(true);
      
      const response = await axios.put(
        `${base_url}/api/admin/users/${id}/password`,
        { newPassword },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.success) {
        toast.success('Password updated successfully');
        setSuccessMessage('Password has been updated successfully');
        
        // Reset password fields
        setPasswordUpdateData({
          newPassword: '',
          confirmNewPassword: ''
        });
        setShowPasswordUpdateModal(false);
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 5000);
      }
    } catch (error) {
      console.error('Error updating password:', error);
      const errorMessage = error.response?.data?.error || 'Failed to update password';
      toast.error(errorMessage);
      
      // Specific handling for invalid ID
      if (error.response?.status === 400 && error.response?.data?.error?.includes('Invalid user ID')) {
        toast.error('Invalid user ID. Please check and try again.');
      } else if (error.response?.status === 404 && error.response?.data?.error?.includes('User not found')) {
        toast.error('User not found. The user may have been deleted.');
      }
    } finally {
      setSaving(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.fullname.trim()) {
      toast.error('Full name is required');
      return;
    }
    
    if (!formData.email.trim()) {
      toast.error('Email is required');
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    // Password validation (only if password is being changed)
    if (formData.password) {
      if (formData.password.length < 6) {
        toast.error('Password must be at least 6 characters long');
        return;
      }
      
      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
    }
    
    // WhatsApp number validation
    if (formData.whatsappnumber && !/^[0-9+]+$/.test(formData.whatsappnumber)) {
      toast.error('Please enter a valid phone number');
      return;
    }
    
    try {
      setSaving(true);
      
      // Prepare data for API
      const updateData = {
        fullname: formData.fullname.trim(),
        email: formData.email.trim(),
        whatsappnumber: formData.whatsappnumber.trim(),
        status: formData.status,
        emailverified: formData.emailverified
      };
      
      // Only include password if it's being changed
      if (formData.password) {
        updateData.password = formData.password;
      }
      
      const response = await axios.put(
        `${base_url}/api/admin/users/${id}`,
        updateData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.success) {
        toast.success('User updated successfully');
        setSuccessMessage('User information has been updated successfully');
        setOriginalData({ ...formData, password: '', confirmPassword: '' });
        setHasChanges(false);
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 5000);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error(error.response?.data?.error || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  // Handle balance management
  const handleBalanceAction = async () => {
    if (!balanceAmount || isNaN(balanceAmount) || parseFloat(balanceAmount) <= 0) {
      toast.error('Please enter a valid positive amount');
      return;
    }
    
    const amount = parseFloat(balanceAmount);
    const endpoint = balanceAction === 'add' 
      ? `${base_url}/api/admin/users/${id}/add-balance`
      : `${base_url}/api/admin/users/${id}/subtract-balance`;
    
    try {
      setSaving(true);
      
      const response = await axios.post(
        endpoint,
        {
          amount: amount,
          notes: balanceNotes || `Admin ${balanceAction === 'add' ? 'added' : 'subtracted'} balance`
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.success) {
        const actionText = balanceAction === 'add' ? 'added to' : 'subtracted from';
        toast.success(`Balance ${actionText} successfully`);
        
        // Update local form data with new balance
        const newBalance = response.data.data.newBalance;
        setFormData(prev => ({
          ...prev,
          balance: parseFloat(newBalance)
        }));
        
        // Reset balance form
        setBalanceAmount('');
        setBalanceNotes('');
        setShowBalanceModal(false);
        
        // Update original data to reflect changes
        setOriginalData(prev => ({
          ...prev,
          balance: parseFloat(newBalance)
        }));
        
        // Refresh balance history
        fetchBalanceHistory();
      }
    } catch (error) {
      console.error(`Error ${balanceAction}ing balance:`, error);
      toast.error(error.response?.data?.error || `Failed to ${balanceAction} balance`);
    } finally {
      setSaving(false);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-BD', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  // Handle back to user details
  const handleBack = () => {
    navigate(`/admin/users/${id}`);
  };

  // Handle reset form
  const handleReset = () => {
    if (originalData) {
      setFormData({
        ...originalData,
        password: '',
        confirmPassword: ''
      });
      setHasChanges(false);
      toast.success('Form reset to original values');
    }
  };

  // Initial fetch
  useEffect(() => {
    if (id) {
      fetchUserDetails();
    }
  }, [id]);

  // Balance Management Modal
  const BalanceModal = () => (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <FaBangladeshiTakaSign className="w-6 h-6 text-theme_color2 mr-3" />
              <h2 className="text-xl font-bold text-gray-800">
                {balanceAction === 'add' ? 'Add Balance' : 'Subtract Balance'}
              </h2>
            </div>
            <button
              onClick={() => {
                setShowBalanceModal(false);
                setBalanceAmount('');
                setBalanceNotes('');
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-150 cursor-pointer p-1 rounded"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="space-y-4">
            {/* Warning for subtract */}
            {balanceAction === 'subtract' && (
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
                <div className="flex">
                  <div>
                    <p className="text-sm text-yellow-800 font-semibold">Warning</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      This will permanently subtract balance from the user's account.
                      Ensure the user has sufficient balance before proceeding.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Amount Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount to {balanceAction === 'add' ? 'Add' : 'Subtract'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaBangladeshiTakaSign className="text-gray-400" />
                </div>
                <input
                  type="number"
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme_color2"
                  step="0.01"
                  min="0.01"
                  required
                />
              </div>
            </div>
            
            {/* Notes Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={balanceNotes}
                onChange={(e) => setBalanceNotes(e.target.value)}
                placeholder={`Reason for ${balanceAction === 'add' ? 'adding' : 'subtracting'} balance...`}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme_color2"
              />
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => {
                  setShowBalanceModal(false);
                  setBalanceAmount('');
                  setBalanceNotes('');
                }}
                className="px-4 py-2 text-sm font-medium cursor-pointer text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-150"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleBalanceAction}
                disabled={saving}
                className={`px-4 py-2 text-sm font-medium cursor-pointer text-white rounded-lg transition-colors duration-150 flex items-center ${
                  saving ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'
                } ${
                  balanceAction === 'add' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {balanceAction === 'add' ? (
                      <Plus className="w-4 h-4 mr-2" />
                    ) : (
                      <Minus className="w-4 h-4 mr-2" />
                    )}
                    {balanceAction === 'add' ? 'Add Balance' : 'Subtract Balance'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Password Update Modal
  const PasswordUpdateModal = () => (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Key className="w-6 h-6 text-red-500 mr-3" />
              <h2 className="text-xl font-bold text-gray-800">
                Update User Password
              </h2>
            </div>
            <button
              onClick={() => {
                setShowPasswordUpdateModal(false);
                setPasswordUpdateData({
                  newPassword: '',
                  confirmNewPassword: ''
                });
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-150 cursor-pointer  p-1 rounded"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="space-y-4">
            
            {/* Warning Message */}
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
              <div className="flex">
                <div>
                  <p className="text-sm text-yellow-800 font-semibold">Important Notice</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    This action will change the user's password immediately. 
                    The user will need to use the new password to log in.
                    Password must be at least 6 characters long.
                  </p>
                </div>
              </div>
            </div>
            
            {/* New Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password *
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  name="newPassword"
                  value={passwordUpdateData.newPassword}
                  onChange={handlePasswordUpdateChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Enter new password"
                  minLength="6"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Must be at least 6 characters long
              </p>
            </div>
            
            {/* Confirm New Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password *
              </label>
              <div className="relative">
                <input
                  type={showConfirmNewPassword ? "text" : "password"}
                  name="confirmNewPassword"
                  value={passwordUpdateData.confirmNewPassword}
                  onChange={handlePasswordUpdateChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Confirm new password"
                  minLength="6"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
              <button
                onClick={() => {
                  setShowPasswordUpdateModal(false);
                  setPasswordUpdateData({
                    newPassword: '',
                    confirmNewPassword: ''
                  });
                }}
                className="px-4 py-2 text-sm font-medium border-[1px] border-gray-200 cursor-pointer text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-150"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordUpdate}
                disabled={saving}
                className={`px-4 py-2 text-sm font-medium cursor-pointer text-white rounded-lg transition-colors duration-150 flex items-center ${
                  saving ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'
                } bg-red-600 hover:bg-red-700`}
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    Update Password
                  </>
                )}
              </button>
            </div>
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
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-800">Edit User</h1>
                <p className="text-gray-600 text-[13px] md:text-[15px] mt-1">
                  Update user information and manage account settings
                </p>
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
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - User Info & Balance Management */}
              <div className="lg:col-span-2 space-y-6">
                {/* Quick Actions Card */}
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <Activity className="w-5 h-5 mr-2" />
                    Quick Actions
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setShowPasswordUpdateModal(true)}
                      className="w-full bg-red-50 cursor-pointer text-red-600 border border-red-200 py-2.5 rounded-lg hover:bg-red-100 transition-colors duration-150 flex items-center justify-center"
                    >
                      <Key className="w-4 h-4 mr-2" />
                      Change Password
                    </button>
                    
                    <button
                      onClick={handleReset}
                      disabled={!hasChanges}
                      className={`w-full py-2.5 rounded-lg transition-colors duration-150 flex items-center justify-center ${
                        hasChanges
                          ? 'bg-blue-50 cursor-pointer text-blue-600 border border-blue-200 hover:bg-blue-100'
                          : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                      }`}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reset Form
                    </button>
                  </div>
                </div>

                {/* Main Form Card */}
                <div className="bg-white rounded-lg shadow border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                      <User className="w-5 h-5 mr-2" />
                      User Information
                    </h3>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="p-6">
                    <div className="space-y-6">
                      {/* Profile Image Section */}
                      <div className="flex items-center space-x-6">
                        <div className="relative w-full flex justify-center items-center">
                          <img
                            src={profile_img}
                            alt={formData.fullname}
                            className="w-24 h-24 md:w-[120px] md:h-[120px] rounded-full object-cover border-4 border-gray-100"
                          />
                        </div>
                      </div>

                      {/* Form Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Full Name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            name="fullname"
                            value={formData.fullname}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme_color2"
                            required
                          />
                        </div>

                        {/* Email */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address *
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme_color2"
                            required
                          />
                        </div>

                        {/* WhatsApp Number */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            WhatsApp Number
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Phone size={16} className="text-gray-400" />
                            </div>
                            <input
                              type="tel"
                              name="whatsappnumber"
                              value={formData.whatsappnumber}
                              onChange={handleInputChange}
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme_color2"
                              placeholder="+8801XXXXXXXXX"
                            />
                          </div>
                        </div>

                        {/* Status */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Account Status
                          </label>
                          <select
                            name="status"
                            value={formData.status}
                            onChange={handleInputChange}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme_color2"
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </div>
                      </div>

                      {/* Form Actions */}
                      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                        <button
                          type="submit"
                          disabled={saving || !hasChanges}
                          className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors duration-150 flex items-center ${
                            saving || !hasChanges
                              ? 'bg-teal-400 cursor-not-allowed'
                              : 'bg-teal-600 hover:bg-teal-700 cursor-pointer'
                          }`}
                        >
                          {saving ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              Save Changes
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>

              {/* Right Column - Balance & Quick Actions */}
              <div className="space-y-6">
                {/* Balance Card */}
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <FaBangladeshiTakaSign className="w-5 h-5 mr-2" />
                    Account Balance
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-blue-50 border-[1px] border-blue-500 rounded-lg">
                      <p className="text-sm text-blue-600 mb-1">Current Balance</p>
                      <p className="text-3xl font-bold text-blue-800">
                        <FaBangladeshiTakaSign className="inline mr-1" />
                        {formatCurrency(formData.balance)}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => {
                          setBalanceAction('add');
                          setShowBalanceModal(true);
                        }}
                        className="w-full bg-green-600 cursor-pointer text-white py-2.5 rounded-lg hover:bg-green-700 transition-colors duration-150 flex items-center justify-center"
                      >
                        <Plus size={18} className="mr-2" />
                        Add Balance
                      </button>
                      
                      <button
                        onClick={() => {
                          setBalanceAction('subtract');
                          setShowBalanceModal(true);
                        }}
                        className="w-full bg-red-600 text-white py-2.5 cursor-pointer rounded-lg hover:bg-red-700 transition-colors duration-150 flex items-center justify-center"
                      >
                        <Minus size={18} className="mr-2" />
                        Subtract Balance
                      </button>
                    </div>
                  </div>
                </div>

                {/* User Stats Card */}
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <Activity className="w-5 h-5 mr-2" />
                    User Statistics
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Account Status:</span>
                      <span className={getStatusBadge(formData.status)}>
                        {formData.status}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Email Status:</span>
                      <span className={`text-sm px-2 py-1 rounded-full ${
                        formData.emailverified 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {formData.emailverified ? 'Verified' : 'Not Verified'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Member Since:</span>
                      <span className="text-sm font-medium text-gray-800">
                        {originalData?.createdAt ? formatDate(originalData.createdAt) : 'N/A'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Last Updated:</span>
                      <span className="text-sm font-medium text-gray-800">
                        {originalData?.updatedAt ? formatDate(originalData.updatedAt) : 'Never'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recent Balance History */}
                {balanceHistory.length > 0 && (
                  <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <History className="w-5 h-5 mr-2" />
                      Recent Balance Changes
                    </h3>
                    
                    <div className="space-y-3">
                      {balanceHistory.slice(0, 5).map((record, index) => (
                        <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {record.type === 'add' ? '+' : '-'} 
                              <FaBangladeshiTakaSign className="inline mx-1" />
                              {formatCurrency(record.amount)}
                            </p>
                            <p className="text-xs text-gray-500">{record.notes}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">{formatDate(record.date)}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              record.type === 'add' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {record.type}
                            </span>
                          </div>
                        </div>
                      ))}
                      
                      <button className="w-full text-center text-sm text-blue-600 hover:text-blue-800 pt-2">
                        View All History →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Balance Management Modal */}
      {showBalanceModal && <BalanceModal />}
      
      {/* Password Update Modal */}
      {showPasswordUpdateModal && <PasswordUpdateModal />}
    </div>
  );
}

export default Updateuser;