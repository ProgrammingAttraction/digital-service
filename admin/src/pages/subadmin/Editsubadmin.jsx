import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/header/Header';
import Sidebar from '../../components/sidebar/Sidebar';
import toast, { Toaster } from "react-hot-toast";
import axios from 'axios';
import { 
  ArrowLeft, 
  Save, 
  User, 
  Mail, 
  Lock, 
  Percent, 
  Loader, 
  DollarSign, 
  Plus, 
  Minus,
  Eye,
  EyeOff,
  Calendar,
  TrendingUp,
  TrendingDown,
  Wallet,
  RefreshCw,
  CreditCard,
  AlertCircle,
  Info,
  X
} from 'lucide-react';
import { FaBangladeshiTakaSign } from "react-icons/fa6";

function Editsubadmin() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [fetchError, setFetchError] = useState(null);

  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const token = localStorage.getItem('adminToken');
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    commission: '',
    active: true
  });

  const [originalData, setOriginalData] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  // Balance Management States
  const [balanceData, setBalanceData] = useState({
    currentBalance: 0,
    totalEarnings: 0,
    totalWithdrawn: 0
  });
  const [showAddBalanceModal, setShowAddBalanceModal] = useState(false);
  const [showDeductBalanceModal, setShowDeductBalanceModal] = useState(false);
  const [showSetBalanceModal, setShowSetBalanceModal] = useState(false);
  const [balanceModalData, setBalanceModalData] = useState({
    amount: '',
    description: ''
  });
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceHistory, setBalanceHistory] = useState([]);
  const [showCurrentBalance, setShowCurrentBalance] = useState(false);

  // Create axios instance with default config
  const api = axios.create({
    baseURL: base_url,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  // Fetch sub admin data on component mount
  useEffect(() => {
    if (id) {
      fetchSubAdminData();
    }
  }, [id]);

  const fetchSubAdminData = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      
      const response = await api.get(`/api/admin/subadmins/${id}`);
      
      if (response.data && response.data.success) {
        const subadmin = response.data.data;
        setOriginalData(subadmin);
        console.log(subadmin)
        setFormData({
          name: subadmin.name || '',
          email: subadmin.email || '',
          password: '',
          confirmPassword: '',
          commission: subadmin.commission?.toString() || '0',
          active: subadmin.active || true
        });

        // Set balance data
        setBalanceData({
          currentBalance: subadmin.balance,
          totalEarnings: subadmin.totalEarnings || 0,
          totalWithdrawn: subadmin.totalWithdrawn || 0
        });
      } else {
        throw new Error(response.data?.message || 'Failed to fetch sub admin data');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      let errorMessage = 'Failed to load sub admin data.';
      
      if (err.response) {
        errorMessage = err.response.data?.error || 
                      err.response.data?.message || 
                      `Error: ${err.response.status}`;
      } else if (err.request) {
        errorMessage = 'Network error. Please check your connection.';
      } else {
        errorMessage = err.message || errorMessage;
      }
      
      setFetchError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Clear any existing errors
    setError(null);
  };

  // Handle balance modal input changes
  const handleBalanceModalChange = (e) => {
    const { name, value } = e.target;
    setBalanceModalData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Toggle password fields
  const togglePasswordFields = () => {
    setShowPasswordFields(!showPasswordFields);
    if (!showPasswordFields) {
      // Clear password fields when showing
      setFormData(prev => ({
        ...prev,
        password: '',
        confirmPassword: ''
      }));
      setFormErrors(prev => ({
        ...prev,
        password: '',
        confirmPassword: ''
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    
    // Basic form validation
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    // Validate password only if password fields are shown and filled
    if (showPasswordFields) {
      if (formData.password) {
        if (formData.password.length < 6) {
          errors.password = 'Password must be at least 6 characters';
        }
        
        if (!formData.confirmPassword) {
          errors.confirmPassword = 'Confirm password is required';
        } else if (formData.password !== formData.confirmPassword) {
          errors.confirmPassword = 'Passwords do not match';
        }
      } else if (formData.confirmPassword) {
        errors.password = 'Password is required';
      }
    }
    
    const commission = parseFloat(formData.commission);
    if (formData.commission === '') {
      errors.commission = 'Commission is required';
    } else if (isNaN(commission)) {
      errors.commission = 'Commission must be a number';
    } else if (commission < 0 || commission > 100) {
      errors.commission = 'Commission must be between 0 and 100';
    }
    
    return errors;
  };

  // Validate balance modal
  const validateBalanceModal = () => {
    const errors = {};
    const amount = parseFloat(balanceModalData.amount);
    
    if (!balanceModalData.amount.trim()) {
      errors.amount = 'Amount is required';
    } else if (isNaN(amount)) {
      errors.amount = 'Amount must be a valid number';
    } else if (amount <= 0) {
      errors.amount = 'Amount must be greater than 0';
    }
    
    return errors;
  };

  // Check if form has changes
  const hasChanges = () => {
    if (!originalData) return false;
    
    return (
      formData.name !== originalData.name ||
      formData.email !== originalData.email ||
      formData.commission !== originalData.commission?.toString() ||
      formData.active !== originalData.active ||
      (showPasswordFields && formData.password)
    );
  };

  // Handle form submission with Axios
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!hasChanges()) {
      toast.error('No changes made to save.');
      return;
    }
    
    setSaving(true);
    setError(null);
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setSaving(false);
      toast.error('Please fix form errors before saving.', {
        duration: 4000,
        position: 'top-right',
      });
      return;
    }
    
    try {
      // Prepare data for submission
      const submitData = {
        name: formData.name.trim(),
        email: formData.email.toLowerCase().trim(),
        commission: parseFloat(formData.commission),
        active: formData.active
      };
      
      // Only include password if it was changed
      if (showPasswordFields && formData.password) {
        submitData.newPassword = formData.password;
        submitData.confirmPassword = formData.confirmPassword;
      }
      
      console.log('Updating data:', submitData);
      
      // Make API call using Axios
      const response = await api.put(`/api/admin/subadmins/${id}`, submitData);
      
      if (response.data && response.data.success) {
        // Update original data
        setOriginalData(response.data.data);
        
        // Clear password fields if they were updated
        if (showPasswordFields) {
          setFormData(prev => ({
            ...prev,
            password: '',
            confirmPassword: ''
          }));
          setShowPasswordFields(false);
        }
        
        toast.success(response.data.message || 'Sub Admin updated successfully!', {
          duration: 5000,
          position: 'top-right',
        });
        
      } else {
        throw new Error(response.data?.message || 'Operation failed');
      }
      
    } catch (err) {
      console.error('Update error:', err);
      
      let errorMessage = 'Failed to update sub admin. Please try again.';
      
      if (err.response) {
        // Server responded with error status
        errorMessage = err.response.data?.message || 
                      err.response.data?.error || 
                      err.response.data?.details || 
                      `Error: ${err.response.status} ${err.response.statusText}`;
        
        // Handle validation errors from server
        if (err.response.status === 400 && err.response.data?.details) {
          // Display detailed validation errors
          const details = err.response.data.details;
          if (Array.isArray(details)) {
            errorMessage = details.join(', ');
          }
        }
      } else if (err.request) {
        // Request made but no response received
        errorMessage = 'Network error. Please check your connection.';
      } else {
        // Something happened in setting up the request
        errorMessage = err.message || errorMessage;
      }
      
      setError(errorMessage);
      toast.error(errorMessage, {
        duration: 6000,
        position: 'top-right',
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle Add Balance
  const handleAddBalance = async () => {
    const errors = validateBalanceModal();
    if (Object.keys(errors).length > 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setBalanceLoading(true);
    try {
      const response = await api.post(`/api/admin/subadmins/${id}/balance/add`, {
        amount: parseFloat(balanceModalData.amount),
        description: balanceModalData.description || 'Balance added by admin'
      });

      if (response.data.success) {
        // Update balance data
        setBalanceData(prev => ({
          ...prev,
          currentBalance: response.data.data.subadmin.balance,
          totalEarnings: response.data.data.subadmin.totalEarnings
        }));
        
        toast.success(`Successfully added ${balanceModalData.amount} to balance`, {
          duration: 5000,
          position: 'top-right',
        });
        
        // Close modal and reset
        setShowAddBalanceModal(false);
        setBalanceModalData({ amount: '', description: '' });
        
        // Refresh data
        fetchSubAdminData();
      }
    } catch (err) {
      console.error('Add balance error:', err);
      toast.error(err.response?.data?.error || 'Failed to add balance', {
        duration: 5000,
        position: 'top-right',
      });
    } finally {
      setBalanceLoading(false);
    }
  };

  // Handle Deduct Balance
  const handleDeductBalance = async () => {
    const errors = validateBalanceModal();
    if (Object.keys(errors).length > 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const amount = parseFloat(balanceModalData.amount);
    if (amount > balanceData.currentBalance) {
      toast.error(`Insufficient balance. Current balance: ${balanceData.currentBalance}`);
      return;
    }

    setBalanceLoading(true);
    try {
      const response = await api.post(`/api/admin/subadmins/${id}/balance/deduct`, {
        amount: amount,
        description: balanceModalData.description || 'Balance deducted by admin'
      });

      if (response.data.success) {
        // Update balance data
        setBalanceData(prev => ({
          ...prev,
          currentBalance: response.data.data.subadmin.balance,
          totalWithdrawn: response.data.data.subadmin.totalWithdrawn
        }));
        
        toast.success(`Successfully deducted ${balanceModalData.amount} from balance`, {
          duration: 5000,
          position: 'top-right',
        });
        
        // Close modal and reset
        setShowDeductBalanceModal(false);
        setBalanceModalData({ amount: '', description: '' });
        
        // Refresh data
        fetchSubAdminData();
      }
    } catch (err) {
      console.error('Deduct balance error:', err);
      toast.error(err.response?.data?.error || 'Failed to deduct balance', {
        duration: 5000,
        position: 'top-right',
      });
    } finally {
      setBalanceLoading(false);
    }
  };

  // Handle Set Balance
  const handleSetBalance = async () => {
    const errors = validateBalanceModal();
    if (Object.keys(errors).length > 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setBalanceLoading(true);
    try {
      const response = await api.put(`/api/admin/subadmins/${id}/balance/set`, {
        balance: parseFloat(balanceModalData.amount)
      });

      if (response.data.success) {
        // Update balance data
        setBalanceData(prev => ({
          ...prev,
          currentBalance: response.data.data.balance
        }));
        
        toast.success(response.data.message, {
          duration: 5000,
          position: 'top-right',
        });
        
        // Close modal and reset
        setShowSetBalanceModal(false);
        setBalanceModalData({ amount: '', description: '' });
        
        // Refresh data
        fetchSubAdminData();
      }
    } catch (err) {
      console.error('Set balance error:', err);
      toast.error(err.response?.data?.error || 'Failed to set balance', {
        duration: 5000,
        position: 'top-right',
      });
    } finally {
      setBalanceLoading(false);
    }
  };

  // Open balance modal
  const openBalanceModal = (type) => {
    setBalanceModalData({ amount: '', description: '' });
    if (type === 'add') {
      setShowAddBalanceModal(true);
    } else if (type === 'deduct') {
      setShowDeductBalanceModal(true);
    } else if (type === 'set') {
      setShowSetBalanceModal(true);
    }
  };

  // Close all modals
  const closeAllModals = () => {
    setShowAddBalanceModal(false);
    setShowDeductBalanceModal(false);
    setShowSetBalanceModal(false);
    setBalanceModalData({ amount: '', description: '' });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Reset form to original data
  const handleReset = () => {
    if (originalData) {
      setFormData({
        name: originalData.name || '',
        email: originalData.email || '',
        password: '',
        confirmPassword: '',
        commission: originalData.commission?.toString() || '0',
        active: originalData.active || true
      });
      setShowPasswordFields(false);
      setFormErrors({});
      setError(null);
      toast.success('Form reset to original values', {
        duration: 3000,
        position: 'top-right',
      });
    }
  };

  // Navigate back
  const handleBack = () => {
    navigate('/admin/subadmins');
  };

  // Password strength indicator
  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '' };
    
    let strength = 0;
    if (password.length >= 6) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    return { strength, label: labels[strength - 1] || '' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  // Improved Loading Component
  if (loading) {
    return (
      <div className="font-anek text-gray-700 lg:ml-72 mt-[9vh]">
        <Header toggleSidebar={toggleSidebar} />
        <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />
        <Toaster />
        <main className="min-h-[93vh] bg-[#f8f9fa] p-4 md:p-6 flex items-center justify-center">
          <div className="max-w-md w-full mx-auto">
            <div className="  p-8">
              <div className="text-center">
                <div className="relative w-20 h-20 mx-auto mb-6">
                  <div className="absolute inset-0 border-4 border-teal-100 rounded-full"></div>
                  <div className="absolute inset-2 border-4 border-transparent rounded-full border-t-teal-500 border-r-teal-500 animate-spin"></div>
                  <div className="absolute inset-4 border-4 border-transparent rounded-full border-b-teal-700 border-l-teal-700 animate-spin animation-delay-300"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <User className="w-8 h-8 text-teal-600" />
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Loading Sub Admin Data</h3>
                <p className="text-gray-600">Please wait...</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="font-anek text-gray-700 lg:ml-72 mt-[9vh]">
        <Header toggleSidebar={toggleSidebar} />
        <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />
        <Toaster />
        <main className="min-h-[93vh] bg-[#f8f9fa] p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Unable to Load Sub Admin</h3>
                <p className="text-gray-600 mb-6">{fetchError}</p>
                <div className="flex justify-center space-x-3">
                  <button
                    onClick={handleBack}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer flex items-center"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to List
                  </button>
                  <button
                    onClick={fetchSubAdminData}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors cursor-pointer flex items-center"
                  >
                    <Loader className="w-4 h-4 mr-2" />
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="font-anek text-gray-700 lg:ml-72 mt-[9vh]">
      <Header toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />
      <Toaster />
      
      {/* Add Balance Modal */}
      {showAddBalanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={closeAllModals}
          />
          
          <div className="relative w-full max-w-md transform transition-all">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Plus className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Add Balance</h3>
                      <p className="text-emerald-100 text-sm">Increase sub admin's wallet balance</p>
                    </div>
                  </div>
                  <button
                    onClick={closeAllModals}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
              
              {/* Modal Body */}
              <div className="px-6 py-5">
                {/* Current Balance Display */}
                <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-emerald-600" />
                      <span className="text-sm font-medium text-emerald-700">Current Balance</span>
                    </div>
                    <span className="text-2xl font-bold text-emerald-800">
                      {balanceData.currentBalance} BDT
                    </span>
                  </div>
                </div>
                
                {/* Amount Input */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount to Add *
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaBangladeshiTakaSign className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-500" />
                      </div>
                      <input
                        type="number"
                        name="amount"
                        value={balanceModalData.amount}
                        onChange={handleBalanceModalChange}
                        className="block w-full pl-10 pr-4 py-3 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        required
                        autoFocus
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500">BDT</span>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Enter the amount you want to add to the balance
                    </p>
                  </div>
                  
                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      name="description"
                      value={balanceModalData.description}
                      onChange={handleBalanceModalChange}
                      className="block w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none transition-all"
                      placeholder="Reason for adding balance..."
                      rows="3"
                    />
                  </div>
                  
                  {/* New Balance Preview */}
                  {balanceModalData.amount && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-700">New Balance After Addition:</span>
                        <span className="text-lg font-bold text-blue-800">
                          {formatCurrency(balanceData.currentBalance + parseFloat(balanceModalData.amount || 0))}
                        </span>
                      </div>
                      <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                          style={{ 
                            width: `${Math.min(100, ((balanceData.currentBalance + parseFloat(balanceModalData.amount || 0)) / (balanceData.currentBalance + parseFloat(balanceModalData.amount || 0) + 1000)) * 100)}%` 
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Modal Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeAllModals}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddBalance}
                  disabled={balanceLoading || !balanceModalData.amount}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
                >
                  {balanceLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Add Balance
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deduct Balance Modal */}
      {showDeductBalanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={closeAllModals}
          />
          
          <div className="relative w-full max-w-md transform transition-all">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-rose-500 to-pink-600 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Minus className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Deduct Balance</h3>
                      <p className="text-rose-100 text-sm">Decrease sub admin's wallet balance</p>
                    </div>
                  </div>
                  <button
                    onClick={closeAllModals}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
              
              {/* Modal Body */}
              <div className="px-6 py-5">
                {/* Warning Alert */}
                <div className="mb-6 p-4 bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-rose-700 mb-1">Important Notice</p>
                      <p className="text-sm text-rose-600">
                        This action will permanently deduct funds from the sub admin's balance. Please ensure you have proper authorization.
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Current Balance Display */}
                <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Available Balance</span>
                    </div>
                    <span className="text-2xl font-bold text-gray-800">
                      {formatCurrency(balanceData.currentBalance)}
                    </span>
                  </div>
                </div>
                
                {/* Amount Input */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount to Deduct *
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaBangladeshiTakaSign className="h-5 w-5 text-gray-400 group-focus-within:text-rose-500" />
                      </div>
                      <input
                        type="number"
                        name="amount"
                        value={balanceModalData.amount}
                        onChange={handleBalanceModalChange}
                        className="block w-full pl-10 pr-4 py-3 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all"
                        placeholder="0.00"
                        min="0"
                        max={balanceData.currentBalance}
                        step="0.01"
                        required
                        autoFocus
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500">BDT</span>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Maximum: {formatCurrency(balanceData.currentBalance)}
                    </p>
                  </div>
                  
                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for Deduction *
                    </label>
                    <textarea
                      name="description"
                      value={balanceModalData.description}
                      onChange={handleBalanceModalChange}
                      className="block w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none resize-none transition-all"
                      placeholder="Please provide a reason for this deduction..."
                      rows="3"
                      required
                    />
                  </div>
                  
                  {/* Balance After Deduction */}
                  {balanceModalData.amount && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-amber-700">Balance After Deduction:</span>
                        <span className={`text-lg font-bold ${parseFloat(balanceModalData.amount) > balanceData.currentBalance ? 'text-red-600' : 'text-amber-800'}`}>
                          {formatCurrency(Math.max(0, balanceData.currentBalance - parseFloat(balanceModalData.amount || 0)))}
                        </span>
                      </div>
                      {parseFloat(balanceModalData.amount) > balanceData.currentBalance && (
                        <p className="mt-2 text-sm text-red-600 font-medium">
                          ❌ Insufficient balance! Amount exceeds available balance.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Modal Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeAllModals}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeductBalance}
                  disabled={balanceLoading || !balanceModalData.amount || parseFloat(balanceModalData.amount) > balanceData.currentBalance}
                  className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-medium rounded-xl hover:from-rose-600 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
                >
                  {balanceLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Minus className="w-4 h-4" />
                      Deduct Balance
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Set Balance Modal */}
      {showSetBalanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={closeAllModals}
          />
          
          <div className="relative w-full max-w-md transform transition-all">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-violet-500 to-purple-600 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Set Balance</h3>
                      <p className="text-violet-100 text-sm">Directly set sub admin's wallet balance</p>
                    </div>
                  </div>
                  <button
                    onClick={closeAllModals}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
              
              {/* Modal Body */}
              <div className="px-6 py-5">
                {/* Info Alert */}
                <div className="mb-6 p-4 bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-violet-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-violet-700 mb-1">Use with Caution</p>
                      <p className="text-sm text-violet-600">
                        This will completely replace the current balance. Typically used for balance corrections or adjustments.
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Balance Comparison */}
                <div className="mb-6 space-y-4">
                  {/* Current Balance */}
                  <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">Current Balance</span>
                      </div>
                      <span className="text-xl font-bold text-gray-800">
                        {formatCurrency(balanceData.currentBalance)}
                      </span>
                    </div>
                  </div>
                  
                  {/* New Balance Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Balance Amount *
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <DollarSign className="h-5 w-5 text-gray-400 group-focus-within:text-violet-500" />
                      </div>
                      <input
                        type="number"
                        name="amount"
                        value={balanceModalData.amount}
                        onChange={handleBalanceModalChange}
                        className="block w-full pl-10 pr-4 py-3 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        required
                        autoFocus
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500">BDT</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Difference Display */}
                  {balanceModalData.amount && (
                    <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-indigo-700">Difference:</span>
                          <span className={`text-lg font-bold ${
                            parseFloat(balanceModalData.amount) > balanceData.currentBalance
                              ? 'text-green-600'
                              : parseFloat(balanceModalData.amount) < balanceData.currentBalance
                              ? 'text-rose-600'
                              : 'text-indigo-800'
                          }`}>
                            {formatCurrency(parseFloat(balanceModalData.amount) - balanceData.currentBalance)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {parseFloat(balanceModalData.amount) > balanceData.currentBalance ? (
                            <>
                              <TrendingUp className="w-4 h-4 text-green-500" />
                              <span className="text-sm text-green-600">Balance will increase</span>
                            </>
                          ) : parseFloat(balanceModalData.amount) < balanceData.currentBalance ? (
                            <>
                              <TrendingDown className="w-4 h-4 text-rose-500" />
                              <span className="text-sm text-rose-600">Balance will decrease</span>
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-4 h-4 text-indigo-500" />
                              <span className="text-sm text-indigo-600">Balance remains unchanged</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Modal Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeAllModals}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSetBalance}
                  disabled={balanceLoading || !balanceModalData.amount}
                  className="px-5 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-medium rounded-xl hover:from-violet-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
                >
                  {balanceLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Set Balance
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="min-h-[93vh] bg-[#f8f9fa] p-4 md:p-6">
        <div className="w-full mx-auto">
          {/* Page Header */}
          <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-teal-600">Edit Sub Admin</h1>
              <p className="text-gray-600 mt-1">Update sub admin account information, commission rate, and manage balance.</p>
            </div>
            
            {/* Status Badge */}
            <div className="flex items-center gap-3">
              <div className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 ${
                formData.active 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-gray-100 text-gray-800 border border-gray-200'
              }`}>
                <div className={`w-2 h-2 rounded-full ${formData.active ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                {formData.active ? 'Active' : 'Inactive'}
              </div>
            </div>
          </div>

          {/* Balance Summary Card */}
          <div className="mb-6">
            <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg shadow-lg p-5 text-white">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Wallet className="w-6 h-6" />
                    <h2 className="text-xl font-bold">Balance Overview</h2>
                  </div>
                  <p className="text-teal-100 mb-4">Manage sub admin's financial balance</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-teal-200 text-sm">Current Balance</span>
                        <button
                          onClick={() => setShowCurrentBalance(!showCurrentBalance)}
                          className="text-teal-200 hover:text-white transition-colors cursor-pointer"
                        >
                          {showCurrentBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-2xl font-bold">
                        {showCurrentBalance ? balanceData.currentBalance : '••••••'}
                      </p>
                    </div>
                    
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-teal-200 text-sm">Total Earnings</span>
                      </div>
                      <p className="text-2xl font-bold">{balanceData.totalEarnings}</p>
                    </div>
                    
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingDown className="w-4 h-4" />
                        <span className="text-teal-200 text-sm">Total Withdrawn</span>
                      </div>
                      <p className="text-2xl font-bold">{balanceData.totalWithdrawn}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Update Failed</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sub Admin Information Form */}
            <div className="lg:col-span-2">
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-8">
                <div className="mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">Sub Admin Information</h2>
                      <p className="text-sm text-gray-600 mt-1">Update the fields you want to change</p>
                    </div>
                    {!hasChanges() && (
                      <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                        No changes made
                      </span>
                    )}
                  </div>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                        <User className="w-4 h-4 mr-2 text-gray-400" />
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 transition-colors ${
                          formErrors.name 
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                            : 'border-gray-300 focus:ring-teal-500 focus:border-teal-500'
                        }`}
                        placeholder="Enter full name"
                      />
                      {formErrors.name && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formErrors.name}
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                        <Mail className="w-4 h-4 mr-2 text-gray-400" />
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 transition-colors ${
                          formErrors.email 
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                            : 'border-gray-300 focus:ring-teal-500 focus:border-teal-500'
                        }`}
                        placeholder="admin@example.com"
                      />
                      {formErrors.email && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formErrors.email}
                        </p>
                      )}
                    </div>

                    {/* Commission */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                        <Percent className="w-4 h-4 mr-2 text-gray-400" />
                        Commission Rate (%) *
                      </label>
                      <div className="relative max-w-md">
                        <input
                          type="number"
                          name="commission"
                          value={formData.commission}
                          onChange={handleInputChange}
                          min="0"
                          max="100"
                          step="0.1"
                          className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 transition-colors ${
                            formErrors.commission 
                              ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                              : 'border-gray-300 focus:ring-teal-500 focus:border-teal-500'
                          }`}
                          placeholder="0-100"
                        />
                        <span className="absolute right-4 top-3.5 text-gray-500">%</span>
                      </div>
                      {formErrors.commission && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formErrors.commission}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        Commission rate between 0% and 100%
                      </p>
                    </div>

                    {/* Status Toggle */}
                    <div className="md:col-span-2">
                      <div className="flex items-center justify-between p-4 border-[1px] border-gray-200 bg-gray-50 rounded-lg">
                        <div>
                          <h3 className="text-sm font-medium text-gray-700">Account Status</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {formData.active 
                              ? 'Sub admin can access the system' 
                              : 'Sub admin account is deactivated'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, active: !prev.active }))}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${
                            formData.active ? 'bg-teal-600' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              formData.active ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Password Change Section */}
                    <div className="md:col-span-2">
                      <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-medium text-gray-800 flex items-center">
                              <Lock className="w-5 h-5 mr-2 text-gray-400" />
                              Change Password
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                              Leave blank to keep current password
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={togglePasswordFields}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                              showPasswordFields
                                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                : 'bg-teal-100 text-teal-700 hover:bg-teal-200'
                            }`}
                          >
                            {showPasswordFields ? 'Cancel' : 'Change Password'}
                          </button>
                        </div>

                        {showPasswordFields && (
                          <div className="space-y-4 pt-4 border-t border-gray-100">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                New Password
                              </label>
                              <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 transition-colors ${
                                  formErrors.password 
                                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                                    : 'border-gray-300 focus:ring-teal-500 focus:border-teal-500'
                                }`}
                                placeholder="Minimum 6 characters"
                              />
                              {formErrors.password && (
                                <p className="mt-1 text-sm text-red-600 flex items-center">
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {formErrors.password}
                                </p>
                              )}
                              
                              {/* Password strength indicator */}
                              {formData.password && (
                                <div className="mt-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700">Password strength:</span>
                                    <span className={`text-sm font-semibold ${
                                      passwordStrength.strength <= 2 ? 'text-red-600' :
                                      passwordStrength.strength === 3 ? 'text-yellow-600' : 'text-green-600'
                                    }`}>
                                      {passwordStrength.label}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-5 gap-1">
                                    {[...Array(5)].map((_, i) => (
                                      <div
                                        key={i}
                                        className={`h-2 rounded-full ${
                                          i < passwordStrength.strength
                                            ? passwordStrength.strength <= 2
                                              ? 'bg-red-500'
                                              : passwordStrength.strength === 3
                                              ? 'bg-yellow-500'
                                              : 'bg-green-500'
                                            : 'bg-gray-200'
                                        }`}
                                      ></div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Confirm New Password
                              </label>
                              <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 transition-colors ${
                                  formErrors.confirmPassword 
                                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                                    : 'border-gray-300 focus:ring-teal-500 focus:border-teal-500'
                                }`}
                                placeholder="Re-enter password"
                              />
                              {formErrors.confirmPassword && (
                                <p className="mt-1 text-sm text-red-600 flex items-center">
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {formErrors.confirmPassword}
                                </p>
                              )}
                              
                              {/* Password match indicator */}
                              {formData.password && formData.confirmPassword && (
                                <div className="mt-2">
                                  {formData.password === formData.confirmPassword ? (
                                    <div className="flex items-center text-green-600 text-sm font-medium">
                                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      Passwords match
                                    </div>
                                  ) : (
                                    <div className="flex items-center text-red-600 text-sm font-medium">
                                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      Passwords do not match
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-8 flex flex-col sm:flex-row justify-between gap-3 pt-6 border-t border-gray-200">
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={saving || !hasChanges()}
                        className="px-5 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[160px] cursor-pointer"
                      >
                        {saving ? (
                          <>
                            <div className="flex items-center justify-center">
                              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            </div>
                            Saving Changes...
                          </>
                        ) : (
                          <>
                            <Save className="w-5 h-5" />
                            Save Changes
                          </>
                        )}
                      </button>
                      
                      <button
                        type="button"
                        onClick={handleReset}
                        disabled={!hasChanges()}
                        className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Reset
                      </button>
                    </div>
            
                  </div>
                </form>
              </div>
            </div>

            {/* Quick Actions Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Balance Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => openBalanceModal('add')}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-3 hover:from-emerald-600 hover:to-teal-700 transition-all shadow-md hover:shadow-lg cursor-pointer group"
                  >
                    <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    Add Balance
                  </button>
                  
                  <button
                    onClick={() => openBalanceModal('deduct')}
                    className="w-full bg-gradient-to-r from-rose-500 to-pink-600 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-3 hover:from-rose-600 hover:to-pink-700 transition-all shadow-md hover:shadow-lg cursor-pointer group"
                  >
                    <Minus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    Deduct Balance
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Editsubadmin;