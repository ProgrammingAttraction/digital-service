import React, { useState } from 'react';
import Header from '../../components/header/Header';
import Sidebar from '../../components/sidebar/Sidebar';
import toast, { Toaster } from "react-hot-toast";
import axios from 'axios';

function NewService() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const token = localStorage.getItem('adminToken');
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  // Form state
  const [formData, setFormData] = useState({
    workName: '',
    workNameEnglish: '',
    workRate: '',
    workType: 'text_file',
    workStatus: 'active',
    description: '',
    isFeatured: false,
    order: 0
  });

  // Field names array state
  const [fieldNames, setFieldNames] = useState([
    { name: '' }
  ]);

  const [formErrors, setFormErrors] = useState({});
  const [fieldErrors, setFieldErrors] = useState([]);

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
    
    // Clear success message
    if (successMessage) {
      setSuccessMessage(null);
    }
  };

  // Handle field name changes
  const handleFieldNameChange = (index, value) => {
    const updatedFieldNames = [...fieldNames];
    updatedFieldNames[index].name = value;
    setFieldNames(updatedFieldNames);
    
    // Clear error for this field
    if (fieldErrors[index]) {
      const updatedFieldErrors = [...fieldErrors];
      updatedFieldErrors[index] = '';
      setFieldErrors(updatedFieldErrors);
    }
  };

  // Add new field
  const handleAddField = () => {
    setFieldNames([...fieldNames, { name: '' }]);
  };

  // Remove field
  const handleRemoveField = (index) => {
    if (fieldNames.length > 1) {
      const updatedFieldNames = fieldNames.filter((_, i) => i !== index);
      setFieldNames(updatedFieldNames);
      
      // Remove corresponding error
      if (fieldErrors[index]) {
        const updatedFieldErrors = fieldErrors.filter((_, i) => i !== index);
        setFieldErrors(updatedFieldErrors);
      }
    } else {
      toast.error('At least one field is required');
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    const fieldErrorsArray = [];
    
    // Basic form validation
    if (!formData.workName.trim()) errors.workName = 'Work name is required';
    if (!formData.workNameEnglish.trim()) errors.workNameEnglish = 'Work name in English is required';
    
    const workRate = parseFloat(formData.workRate);
    if (!formData.workRate || isNaN(workRate) || workRate < 0) {
      errors.workRate = 'Valid work rate is required (≥ 0)';
    }
    
    if (!formData.workType) errors.workType = 'Work type is required';
    
    // Field names validation
    let hasFieldErrors = false;
    fieldNames.forEach((field, index) => {
      if (!field.name.trim()) {
        fieldErrorsArray[index] = 'Field name is required';
        hasFieldErrors = true;
      } else {
        fieldErrorsArray[index] = '';
      }
    });
    
    setFieldErrors(fieldErrorsArray);
    
    if (hasFieldErrors) {
      errors.fieldNames = 'All fields must have a name';
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
      // Prepare data for submission
      const submitData = {
        ...formData,
        workRate: parseFloat(formData.workRate),
        order: parseInt(formData.order) || 0,
        fieldNames: fieldNames.map(field => ({
          name: field.name.trim(),
          placeholder: field.name.trim() // Using the same name as placeholder
        }))
      };
      
      // Make API call using Axios
      const response = await api.post('/api/sub-admin/services', submitData);
      
      if (response.data && response.data.success) {
        // Success case - reset form
        setFormData({
          workName: '',
          workNameEnglish: '',
          workRate: '',
          workType: 'text_file',
          workStatus: 'active',
          description: '',
          isFeatured: false,
          order: 0
        });
        
        setFieldNames([{ name: '' }]);
        setFormErrors({});
        setFieldErrors([]);
        
        toast.success(response.data.message || 'Service created successfully!');
      } else {
        throw new Error(response.data?.message || 'Operation failed');
      }
      
    } catch (err) {
      console.error('Submission error:', err);
      
      let errorMessage = 'Failed to create service. Please try again.';
      
      if (err.response) {
        // Server responded with error status
        errorMessage = err.response.data?.message || 
                      err.response.data?.error || 
                      `Error: ${err.response.status} ${err.response.statusText}`;
      } else if (err.request) {
        // Request made but no response received
        errorMessage = 'Network error. Please check your connection.';
      } else {
        // Something happened in setting up the request
        errorMessage = err.message || errorMessage;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  // Reset form
  const handleReset = () => {
    setFormData({
      workName: '',
      workNameEnglish: '',
      workRate: '',
      workType: 'text_file',
      workStatus: 'active',
      description: '',
      isFeatured: false,
      order: 0
    });
    
    setFieldNames([{ name: '' }]);
    setFormErrors({});
    setFieldErrors([]);
    setError(null);
    setSuccessMessage(null);
    
    toast.success('Form has been reset');
  };

  if (loading) {
    return (
      <div className="font-anek text-gray-700 lg:ml-72 mt-[9vh]">
        <Header toggleSidebar={toggleSidebar} />
        <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />
        <main className="min-h-[93vh] bg-[#f8f9fa] p-4 md:p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Creating service...</p>
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
          <h1 className="text-[#00a65a] text-2xl font-bold mb-2">Create New Service</h1>
          <p className="text-gray-600">Create a new service here. Once created, it will be available for users.</p>
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
            <h2 className="text-xl font-bold text-gray-800">Service Information</h2>
            <p className="text-sm text-gray-600 mt-1">Fields marked with * are required</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Work Name (Local Language) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Work Name (Local) *
                </label>
                <input
                  type="text"
                  name="workName"
                  value={formData.workName}
                  onChange={handleInputChange}
                  className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-1 ${
                    formErrors.workName 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-green-500'
                  }`}
                  placeholder="নাম"
                />
                {formErrors.workName && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.workName}</p>
                )}
              </div>

              {/* Work Name (English) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Work Name (English) *
                </label>
                <input
                  type="text"
                  name="workNameEnglish"
                  value={formData.workNameEnglish}
                  onChange={handleInputChange}
                  className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-1 ${
                    formErrors.workNameEnglish 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-green-500'
                  }`}
                  placeholder="Name"
                />
                {formErrors.workNameEnglish && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.workNameEnglish}</p>
                )}
              </div>

              {/* Work Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Work Rate *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500">৳</span>
                  <input
                    type="number"
                    name="workRate"
                    value={formData.workRate}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className={`w-full border rounded px-3 py-2 pl-8 focus:outline-none focus:ring-1 ${
                      formErrors.workRate 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-green-500'
                    }`}
                    placeholder="5000"
                  />
                </div>
                {formErrors.workRate && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.workRate}</p>
                )}
              </div>

              {/* Work Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Work Type *
                </label>
                <select
                  name="workType"
                  value={formData.workType}
                  onChange={handleInputChange}
                  className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-1 ${
                    formErrors.workType 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-green-500'
                  }`}
                >
                  <option value="text_file">Text File</option>
                  <option value="pdf_file">PDF File</option>
                </select>
                {formErrors.workType && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.workType}</p>
                )}
              </div>
              {/* Description - Full width */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="Enter detailed description about the service..."
                />
              </div>
            </div>

            {/* Field Names Section */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Service Fields</h3>
                  <p className="text-sm text-gray-600 mt-1">Define the form fields required for this service *</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddField}
                  className="px-4 py-2 bg-theme_color2 cursor-pointer text-white rounded-md  transition-colors flex items-center gap-2"
                >
                  Add Field
                </button>
              </div>

              {formErrors.fieldNames && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{formErrors.fieldNames}</p>
                </div>
              )}

              <div className="space-y-4">
                {fieldNames.map((field, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-gray-700">Field {index + 1}</h4>
                      {fieldNames.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveField(index)}
                          className="text-red-600 cursor-pointer hover:text-red-800 p-1"
                          aria-label={`Remove field ${index + 1}`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      {/* Field Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Field Name *
                        </label>
                        <input
                          type="text"
                          value={field.name}
                          onChange={(e) => handleFieldNameChange(index, e.target.value)}
                          className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-1 ${
                            fieldErrors[index] 
                              ? 'border-red-300 focus:ring-red-500' 
                              : 'border-gray-300 focus:ring-green-500'
                          }`}
                          placeholder="Enter field name "
                        />
                        {fieldErrors[index] && (
                          <p className="mt-1 text-sm text-red-600">{fieldErrors[index]}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-3 text-xs text-gray-500">
                      <p><span className="font-medium">Note:</span> This field name will be used as both the field identifier and the placeholder text shown to users.</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row justify-end gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="px-5 py-2.5 border cursor-pointer border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                Reset Form
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-theme_color2 cursor-pointer text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[140px]"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating...
                  </>
                ) : (
                  'Create Service'
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default NewService;