import React, { useState } from 'react';
import Header from '../../components/header/Header';
import Sidebar from '../../components/sidebar/Sidebar';
import toast, { Toaster } from "react-hot-toast";
import axios from 'axios';

function Newsubadmin() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  const [formErrors, setFormErrors] = useState({});

  // Create axios instance with default config
  const api = axios.create({
    baseURL: base_url,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

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
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Confirm password is required';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
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

  // Handle form submission with Axios
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setLoading(false);
      toast.error('Please fix all form errors before submitting.', {
        duration: 4000,
        position: 'top-right',
      });
      return;
    }
    
    try {
      // Prepare data for submission (exclude confirmPassword)
      const submitData = {
        name: formData.name.trim(),
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        commission: parseFloat(formData.commission),
        active: formData.active
      };
      
      console.log('Submitting data:', submitData);
      
      // Make API call using Axios
      const response = await api.post('/api/admin/subadmins', submitData);
      
      if (response.data && response.data.success) {
        // Success case - reset form
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          commission: '',
          active: true
        });
        
        setFormErrors({});
        
        toast.success(response.data.message || 'Sub Admin created successfully!', {
          duration: 5000,
          position: 'top-right',
        });
        
        // Optional: Redirect after success
        // setTimeout(() => {
        //   window.location.href = '/admin/subadmins';
        // }, 2000);
        
      } else {
        throw new Error(response.data?.message || 'Operation failed');
      }
      
    } catch (err) {
      console.error('Submission error:', err);
      
      let errorMessage = 'Failed to create sub admin. Please try again.';
      
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
      setLoading(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      commission: '',
      active: true
    });
    
    setFormErrors({});
    setError(null);
    
    toast.success('Form has been reset', {
      duration: 3000,
      position: 'top-right',
    });
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

  if (loading) {
    return (
      <div className="font-anek text-gray-700 lg:ml-72 mt-[9vh]">
        <Header toggleSidebar={toggleSidebar} />
        <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />
        <main className="min-h-[93vh] bg-[#f8f9fa] p-4 md:p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Creating sub admin...</p>
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
      <main className="min-h-[93vh] bg-[#f8f9fa] p-4 md:p-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-[#00a65a] text-2xl font-bold mb-2">Create New Sub Admin</h1>
          <p className="text-gray-600">Create a new sub admin account with specific commission rate and permissions.</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800">Sub Admin Information</h2>
            <p className="text-sm text-gray-600 mt-1">Fields marked with * are required</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-1 ${
                    formErrors.name 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-green-500'
                  }`}
                  placeholder="Enter full name"
                />
                {formErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-1 ${
                    formErrors.email 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-green-500'
                  }`}
                  placeholder="admin@example.com"
                />
                {formErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-1 ${
                    formErrors.password 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-green-500'
                  }`}
                  placeholder="Minimum 6 characters"
                />
                {formErrors.password && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
                )}
                
                {/* Password strength indicator */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">Password strength:</span>
                      <span className={`text-xs font-medium ${
                        passwordStrength.strength <= 2 ? 'text-red-600' :
                        passwordStrength.strength === 3 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${
                          passwordStrength.strength <= 2 ? 'bg-red-500' :
                          passwordStrength.strength === 3 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-1 ${
                    formErrors.confirmPassword 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-green-500'
                  }`}
                  placeholder="Re-enter password"
                />
                {formErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.confirmPassword}</p>
                )}
                
                {/* Password match indicator */}
                {formData.password && formData.confirmPassword && (
                  <div className="mt-2">
                    {formData.password === formData.confirmPassword ? (
                      <div className="flex items-center text-green-600 text-sm">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Passwords match
                      </div>
                    ) : (
                      <div className="flex items-center text-red-600 text-sm">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                        Passwords do not match
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Commission */}
        
            </div>
      <div className='mt-[20px]'>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Commission Rate (%) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="commission"
                    value={formData.commission}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    step="0.01"
                    className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-1 ${
                      formErrors.commission 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-green-500'
                    }`}
                    placeholder="0-100"
                  />
                  <span className="absolute right-3 top-2.5 text-gray-500">%</span>
                </div>
                {formErrors.commission && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.commission}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Commission rate between 0% and 100%
                </p>
              </div>

            <div className="mt-8 flex flex-col sm:flex-row justify-end gap-3">
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-theme_color2 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[140px] cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating...
                  </>
                ) : (
                  'Create Sub Admin'
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default Newsubadmin;