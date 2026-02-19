import React, { useState } from 'react';
import Header from '../../components/header/Header';
import Sidebar from '../../components/sidebar/Sidebar';
import toast, { Toaster } from "react-hot-toast";
import ApertureLoader from '../../components/loader/ApertureLoader';

function Depositmethod() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const token = localStorage.getItem('adminToken');
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  // Account types configuration
  const accountTypes = [
    { value: 'agent', label: 'Agent Account', description: 'For registered agents or representatives' },
    { value: 'personal', label: 'Personal Account', description: 'For individual users' },
    { value: 'merchant', label: 'Merchant Account', description: 'For commercial merchants' },
  ];

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    accountType: 'agent', // Default to 'agent'
    agentNumber: '',
    minimumDeposit: '',
    maximumDeposit: '',
    status: 'active'
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Clear success message
    if (successMessage) {
      setSuccessMessage(null);
    }
  };

  // Handle image file selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only image files are allowed (JPEG, JPG, PNG, GIF, WebP)');
        return;
      }
      
      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      
      setImageFile(file);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      
      // Clear image error if any
      if (formErrors.image) {
        setFormErrors(prev => ({
          ...prev,
          image: ''
        }));
      }
    }
  };

  // Remove selected image
  const handleRemoveImage = () => {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    // Clear image error
    if (formErrors.image) {
      setFormErrors(prev => ({
        ...prev,
        image: ''
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.description.trim()) errors.description = 'Description is required';
    if (!formData.accountType) errors.accountType = 'Account type is required';
    if (!formData.agentNumber.trim()) errors.agentNumber = 'Agent number is required';
    
    const minDeposit = parseFloat(formData.minimumDeposit);
    const maxDeposit = parseFloat(formData.maximumDeposit);
    
    if (!formData.minimumDeposit || isNaN(minDeposit) || minDeposit < 0) {
      errors.minimumDeposit = 'Valid minimum deposit is required (≥ 0)';
    }
    
    if (!formData.maximumDeposit || isNaN(maxDeposit) || maxDeposit < 0) {
      errors.maximumDeposit = 'Valid maximum deposit is required (≥ 0)';
    }
    
    if (!errors.minimumDeposit && !errors.maximumDeposit && maxDeposit < minDeposit) {
      errors.maximumDeposit = 'Maximum deposit must be greater than or equal to minimum deposit';
    }
    
    // Validate image
    if (!imageFile) {
      errors.image = 'Image is required';
    }
    
    return errors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Please fix all form errors before submitting.', {
        duration: 4000,
        position: 'top-right',
      });
      return;
    }
    
    setLoading(true);
    setImageUploading(true);
    
    try {
      // Create FormData object for file upload
      const formDataObj = new FormData();
      
      // Append form fields
      formDataObj.append('name', formData.name);
      formDataObj.append('description', formData.description);
      formDataObj.append('accountType', formData.accountType);
      formDataObj.append('agentNumber', formData.agentNumber);
      formDataObj.append('minimumDeposit', formData.minimumDeposit);
      formDataObj.append('maximumDeposit', formData.maximumDeposit);
      formDataObj.append('status', formData.status);
      
      // Append image file
      if (imageFile) {
        formDataObj.append('image', imageFile);
      }
      
      const response = await fetch(`${base_url}/api/admin/deposit-methods`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type header for FormData - browser will set it with boundary
        },
        body: formDataObj
      });

      const data = await response.json();
      
      if (!response.ok) {
        // Server returned an error status (4xx, 5xx)
        const errorMessage = data.message || data.error || `Error: ${response.status} ${response.statusText}`;
        throw new Error(errorMessage);
      }
      
      if (!data.success) {
        // Server returned success status but with success: false
        throw new Error(data.message || 'Operation failed');
      }
      
      // Success case - reset form
      setFormData({
        name: '',
        description: '',
        accountType: 'agent',
        agentNumber: '',
        minimumDeposit: '',
        maximumDeposit: '',
        status: 'active'
      });
      
      // Clean up image preview
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      setImageFile(null);
      setImagePreview(null);
      setFormErrors({});
      setError(null);
      
      toast.success(data.message || 'Deposit method created successfully!', {
        duration: 5000,
        position: 'top-right',
      });
      
    } catch (err) {
      console.error('Submission error:', err);
      setError(err.message);
      toast.error(err.message || 'Failed to create deposit method. Please try again.', {
        duration: 5000,
        position: 'top-right',
      });
    } finally {
      setLoading(false);
      setImageUploading(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setFormData({
      name: '',
      description: '',
      accountType: 'agent',
      agentNumber: '',
      minimumDeposit: '',
      maximumDeposit: '',
      status: 'active'
    });
    
    // Clean up image preview URL
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview(null);
    
    setFormErrors({});
    setError(null);
    setSuccessMessage(null);
    
    toast.success('Form has been reset', {
      duration: 3000,
      position: 'top-right',
    });
  };

  // Get selected account type details
  const getSelectedAccountTypeDetails = () => {
    const selectedType = accountTypes.find(type => type.value === formData.accountType);
    return selectedType || accountTypes[0];
  };

  if (loading) {
    return (
      <div className="font-anek text-gray-700 lg:ml-72 mt-[9vh]">
        <Header toggleSidebar={toggleSidebar} />
        <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />
        <main className="min-h-[93vh] bg-[#f8f9fa] p-4 md:p-6 flex items-center justify-center">
          <div className="text-center">
            <ApertureLoader/>
            <p className="text-gray-600 mt-[10px]">Creating deposit method...</p>
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
          <h1 className="text-[#00a65a] text-2xl font-bold mb-2">Create Deposit Method</h1>
          <p className="text-gray-600">Create a new deposit method here. Once created, it will be available for users.</p>
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

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800">Deposit Method Form</h2>
            <p className="text-sm text-gray-600 mt-1">Fields marked with * are required</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Method Name *
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
                  placeholder="bKash, Nagad, Rocket, Upay"
                />
                {formErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                )}
              </div>

              {/* Account Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Type *
                </label>
                <select
                  name="accountType"
                  value={formData.accountType}
                  onChange={handleInputChange}
                  className={`w-full border rounded  h-[40px] px-3 focus:outline-none focus:ring-1 ${
                    formErrors.accountType 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-green-500'
                  }`}
                >
                  {accountTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {formErrors.accountType && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.accountType}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  {getSelectedAccountTypeDetails().description}
                </p>
              </div>

              {/* Agent Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Agent Number *
                </label>
                <input
                  type="text"
                  name="agentNumber"
                  value={formData.agentNumber}
                  onChange={handleInputChange}
                  className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-1 ${
                    formErrors.agentNumber 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-green-500'
                  }`}
                  placeholder="017XXXXXXXX"
                />
                {formErrors.agentNumber && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.agentNumber}</p>
                )}
              </div>

              {/* Minimum Deposit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Deposit *
                </label>
                <input
                  type="number"
                  name="minimumDeposit"
                  value={formData.minimumDeposit}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-1 ${
                    formErrors.minimumDeposit 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-green-500'
                  }`}
                  placeholder="50"
                />
                {formErrors.minimumDeposit && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.minimumDeposit}</p>
                )}
              </div>

              {/* Maximum Deposit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Deposit *
                </label>
                <input
                  type="number"
                  name="maximumDeposit"
                  value={formData.maximumDeposit}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-1 ${
                    formErrors.maximumDeposit 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-green-500'
                  }`}
                  placeholder="50000"
                />
                {formErrors.maximumDeposit && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.maximumDeposit}</p>
                )}
              </div>

              {/* Image Upload - Full width */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Method Image *
                </label>
                
                {/* Image Preview */}
                {imagePreview ? (
                  <div className="mb-4">
                    <div className="relative inline-block">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-48 h-48 object-cover rounded-lg border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">Click to change image</p>
                  </div>
                ) : null}

                {/* File Input */}
                <div className={`border-2 border-dashed rounded-lg p-6 text-center ${
                  formErrors.image ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-green-400 hover:bg-green-50'
                } transition-colors cursor-pointer`}>
                  <input
                    type="file"
                    id="imageUpload"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <label htmlFor="imageUpload" className="cursor-pointer block">
                    {imagePreview ? (
                      <div className="flex flex-col items-center">
                        <svg className="w-10 h-10 text-green-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-green-600 font-medium">Change Image</p>
                      </div>
                    ) : (
                      <>
                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-gray-600 font-medium mb-1">Click to upload image</p>
                        <p className="text-sm text-gray-500">
                          Supports: JPEG, JPG, PNG, GIF, WebP (Max 5MB)
                        </p>
                      </>
                    )}
                  </label>
                </div>
                
                {formErrors.image && (
                  <p className="mt-2 text-sm text-red-600">{formErrors.image}</p>
                )}
                
                {/* Upload Progress (if needed) */}
                {imageUploading && (
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Uploading image...</p>
                  </div>
                )}
              </div>

              {/* Description - Full width */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-1 ${
                    formErrors.description 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-green-500'
                  }`}
                  placeholder="Enter detailed description about the deposit method..."
                />
                {formErrors.description && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.description}</p>
                )}
              </div>

            </div>

            <div className="mt-8 flex flex-col sm:flex-row justify-end gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="px-5 py-2.5 border border-gray-300 cursor-pointer rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                Reset Form
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-theme_color2 text-white rounded-md cursor-pointer hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[140px]"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    Create Method
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Example Preview (optional) */}
        <div className="mt-8 bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">What users will see:</h3>
          <div className="border border-gray-300 rounded-lg p-4 max-w-md">
            {imagePreview ? (
              <div className="flex items-center space-x-4 p-3">
                <div className="w-16 h-16 flex-shrink-0">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-800">{formData.name || "Method Name"}</h4>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {getSelectedAccountTypeDetails().label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {formData.description ? 
                      (formData.description.length > 80 ? 
                        formData.description.substring(0, 80) + "..." : 
                        formData.description) 
                      : "Method description will appear here"}
                  </p>
                  <div className="flex items-center mt-2 space-x-4">
                    <span className="text-sm text-gray-500">Min: ৳{formData.minimumDeposit || "0"}</span>
                    <span className="text-sm text-gray-500">Max: ৳{formData.maximumDeposit || "0"}</span>
                  </div>
                  <div className="mt-2">
                    <p className="text-xs text-gray-500">
                      Account: {formData.agentNumber || "Agent number"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p>Upload an image to see preview</p>
              </div>
            )}
          </div>
        </div>

 
      </main>
    </div>
  );
}

export default Depositmethod;