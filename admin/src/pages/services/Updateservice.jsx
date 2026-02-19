import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/header/Header';
import Sidebar from '../../components/sidebar/Sidebar';
import toast, { Toaster } from "react-hot-toast";
import axios from 'axios';
import {
  ArrowLeft,
  Save,
  RefreshCw,
  Layers,
  FileText,
  DollarSign,
  Tag,
  Star,
  Hash,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

function Updateservice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [originalData, setOriginalData] = useState(null);

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
    { name: '', placeholder: '' }
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

  // Fetch service data on component mount
  useEffect(() => {
    if (id) {
      fetchServiceData();
    }
  }, [id]);

  const fetchServiceData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/api/admin/services/${id}`);
      
      if (response.data.success) {
        const service = response.data.data;
        setOriginalData(service);
        
        // Populate form data
        setFormData({
          workName: service.workName || '',
          workNameEnglish: service.workNameEnglish || '',
          workRate: service.workRate || '',
          workType: service.workType || 'text_file',
          workStatus: service.workStatus || 'active',
          description: service.description || '',
          isFeatured: service.isFeatured || false,
          order: service.order || 0
        });
        
        // Populate field names
        if (service.fieldNames && Array.isArray(service.fieldNames)) {
          setFieldNames(service.fieldNames.map(field => ({
            name: field.name || '',
            placeholder: field.placeholder || ''
          })));
        }
        
        toast.success('Service data loaded successfully');
      } else {
        throw new Error(response.data.error || 'Failed to load service');
      }
    } catch (err) {
      console.error('Error fetching service:', err);
      
      let errorMessage = 'Failed to load service data.';
      
      if (err.response) {
        if (err.response.status === 404) {
          errorMessage = 'Service not found.';
          toast.error(errorMessage);
          setTimeout(() => navigate('/admin/services'), 2000);
        } else {
          errorMessage = err.response.data?.error || `Error: ${err.response.status}`;
        }
      } else if (err.request) {
        errorMessage = 'Network error. Please check your connection.';
      } else {
        errorMessage = err.message || errorMessage;
      }
      
      setError(errorMessage);
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
    
    // Clear success message
    if (successMessage) {
      setSuccessMessage(null);
    }
  };

  // Handle field name changes
  const handleFieldNameChange = (index, field, value) => {
    const updatedFieldNames = [...fieldNames];
    updatedFieldNames[index][field] = value;
    setFieldNames(updatedFieldNames);
    
    // Clear error for this field
    if (fieldErrors[index]) {
      const updatedFieldErrors = [...fieldErrors];
      updatedFieldErrors[index] = { ...updatedFieldErrors[index], [field]: '' };
      setFieldErrors(updatedFieldErrors);
    }
  };

  // Add new field
  const handleAddField = () => {
    setFieldNames([...fieldNames, { name: '', placeholder: '' }]);
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
      const fieldError = {};
      
      if (!field.name.trim()) {
        fieldError.name = 'Field name is required';
        hasFieldErrors = true;
      }
      
      if (!field.placeholder.trim()) {
        fieldError.placeholder = 'Placeholder is required';
        hasFieldErrors = true;
      }
      
      fieldErrorsArray[index] = fieldError;
    });
    
    setFieldErrors(fieldErrorsArray);
    
    if (hasFieldErrors) {
      errors.fieldNames = 'All fields must have name and placeholder';
    }
    
    return errors;
  };

  // Handle form submission for update
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setError(null);
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Please fix all form errors before submitting.', {
        duration: 4000,
        position: 'top-right',
      });
      return;
    }
    
    try {
      setUpdating(true);
      
      // Prepare data for submission
      const submitData = {
        ...formData,
        workRate: parseFloat(formData.workRate),
        order: parseInt(formData.order) || 0,
        fieldNames: fieldNames.filter(field => field.name.trim() && field.placeholder.trim())
      };
      
      // Remove unchanged fields to avoid unnecessary updates
      if (originalData) {
        Object.keys(submitData).forEach(key => {
          if (JSON.stringify(submitData[key]) === JSON.stringify(originalData[key])) {
            delete submitData[key];
          }
        });
        
        // Check if fieldNames changed
        const originalFieldNames = originalData.fieldNames || [];
        const currentFieldNames = fieldNames.filter(f => f.name.trim() && f.placeholder.trim());
        
        if (JSON.stringify(originalFieldNames) === JSON.stringify(currentFieldNames)) {
          delete submitData.fieldNames;
        }
      }
      
      // If no changes, show message and return
      if (Object.keys(submitData).length === 0) {
        toast.error('No changes detected. Service data is up to date.');
        return;
      }
      
      // Make API call using Axios
      const response = await api.put(`/api/admin/services/${id}`, submitData);
      
      if (response.data && response.data.success) {
        // Update original data with new data
        setOriginalData(response.data.data);
        
        setSuccessMessage('Service updated successfully!');
        toast.success('Service updated successfully!');
        
        // Navigate back to services list after 2 seconds
        setTimeout(() => {
          navigate('/admin/services/all');
        }, 2000);
      } else {
        throw new Error(response.data?.error || 'Update failed');
      }
      
    } catch (err) {
      console.error('Update error:', err);
      
      let errorMessage = 'Failed to update service. Please try again.';
      
      if (err.response) {
        // Server responded with error status
        errorMessage = err.response.data?.message || 
                      err.response.data?.error || 
                      `Error: ${err.response.status} ${err.response.statusText}`;
        
        // Handle validation errors
        if (err.response.status === 400 && err.response.data.details) {
          errorMessage = err.response.data.details.join(', ');
        }
      } else if (err.request) {
        // Request made but no response received
        errorMessage = 'Network error. Please check your connection.';
      } else {
        // Something happened in setting up the request
        errorMessage = err.message || errorMessage;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  // Reset form to original data
  const handleReset = () => {
    if (originalData) {
      setFormData({
        workName: originalData.workName || '',
        workNameEnglish: originalData.workNameEnglish || '',
        workRate: originalData.workRate || '',
        workType: originalData.workType || 'text_file',
        workStatus: originalData.workStatus || 'active',
        description: originalData.description || '',
        isFeatured: originalData.isFeatured || false,
        order: originalData.order || 0
      });
      
      // Reset field names
      if (originalData.fieldNames && Array.isArray(originalData.fieldNames)) {
        setFieldNames(originalData.fieldNames.map(field => ({
          name: field.name || '',
          placeholder: field.placeholder || ''
        })));
      }
      
      setFormErrors({});
      setFieldErrors([]);
      setError(null);
      setSuccessMessage(null);
      
      toast.success('Form has been reset to original values');
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return {
          className: 'bg-green-100 text-green-800 border-[1px] border-green-500',
          icon: <CheckCircle className="w-4 h-4 mr-1" />,
          label: 'Active'
        };
      case 'inactive':
        return {
          className: 'bg-red-100 text-red-800 border-[1px] border-red-500',
          icon: <XCircle className="w-4 h-4 mr-1" />,
          label: 'Inactive'
        };
      case 'pending':
        return {
          className: 'bg-yellow-100 text-yellow-800 border-[1px] border-yellow-500',
          icon: <Clock className="w-4 h-4 mr-1" />,
          label: 'Pending'
        };
      default:
        return {
          className: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <AlertCircle className="w-4 h-4 mr-1" />,
          label: status
        };
    }
  };

  // Get work type badge
  const getWorkTypeBadge = (type) => {
    switch (type) {
      case 'text_file':
        return {
          className: 'bg-purple-100 text-purple-800 border-[1px] border-purple-500',
          icon: <FileText className="w-4 h-4 mr-1" />,
          label: 'Text File'
        };
      case 'pdf_file':
        return {
          className: 'bg-indigo-100 text-indigo-800 border-[1px] border-indigo-500',
          icon: <FileText className="w-4 h-4 mr-1" />,
          label: 'PDF File'
        };
      default:
        return {
          className: 'bg-gray-100 text-gray-800 border-[1px] border-gray-200',
          icon: <FileText className="w-4 h-4 mr-1" />,
          label: type
        };
    }
  };

  if (loading) {
    return (
      <div className="font-anek text-gray-700 lg:ml-72 mt-[9vh]">
        <Header toggleSidebar={toggleSidebar} />
        <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />
        <Toaster />
        <main className="min-h-[93vh] bg-[#f8f9fa] p-4 md:p-6 flex items-center justify-center">
                   <div className="flex justify-center items-center py-8">
      <div className="flex space-x-2">
        <div className="animate-bounce h-3 w-3 bg-green-500 rounded-full" style={{ animationDelay: '0ms' }}></div>
        <div className="animate-bounce h-3 w-3 bg-green-500 rounded-full" style={{ animationDelay: '150ms' }}></div>
        <div className="animate-bounce h-3 w-3 bg-green-500 rounded-full" style={{ animationDelay: '300ms' }}></div>
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
      <main className="min-h-[93vh] bg-[#f8f9fa] p-4 md:p-6">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-[#00a65a] text-2xl font-bold mb-2">Update Service</h1>
              <p className="text-gray-600">Update service information and fields.</p>
            </div>
            <button
              onClick={() => navigate('/admin/services')}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Services
            </button>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
                <div>
                  <p className="text-sm text-green-700 font-medium">{successMessage}</p>
                  <p className="text-xs text-green-600 mt-1">Redirecting to services list...</p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
                <div className="ml-3">
                  <p className="text-sm text-red-700 font-medium">Error</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Service Info Card */}
          {originalData && (
            <div className="mb-6 bg-white border border-gray-200 rounded-lg shadow-sm p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg mr-3">
                    <Layers className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Service ID</p>
                    <p className="text-sm font-medium text-gray-900 truncate">{originalData._id}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg mr-3">
                    <Tag className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Work Type</p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getWorkTypeBadge(originalData.workType).className}`}>
                      {getWorkTypeBadge(originalData.workType).icon}
                      {getWorkTypeBadge(originalData.workType).label}
                    </span>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg mr-3">
                    <Hash className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Fields Count</p>
                    <p className="text-sm font-medium text-gray-900">{originalData.fieldNames?.length || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Form Card */}
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

                {/* Work Status */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Work Status *
                  </label>
                  <select
                    name="workStatus"
                    value={formData.workStatus}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium ${
                      getStatusBadge(formData.workStatus).className
                    }`}>
                      {getStatusBadge(formData.workStatus).icon}
                      {getStatusBadge(formData.workStatus).label}
                    </span>
                  </div>
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
                    className="px-4 py-2 bg-theme_color2 text-white rounded-md transition-colors flex items-center gap-2"
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
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center">
                          <Hash className="w-4 h-4 text-gray-400 mr-2" />
                          <h4 className="font-medium text-gray-700">Field {index + 1}</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                            Required
                          </span>
                          {fieldNames.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveField(index)}
                              className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded"
                              aria-label={`Remove field ${index + 1}`}
                              title="Remove field"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Field Name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Field Name *
                          </label>
                          <input
                            type="text"
                            value={field.name}
                            onChange={(e) => handleFieldNameChange(index, 'name', e.target.value)}
                            className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-1 ${
                              fieldErrors[index]?.name 
                                ? 'border-red-300 focus:ring-red-500' 
                                : 'border-gray-300 focus:ring-green-500'
                            }`}
                            placeholder=""
                          />
                          {fieldErrors[index]?.name && (
                            <p className="mt-1 text-sm text-red-600">{fieldErrors[index].name}</p>
                          )}
                        </div>

                        {/* Placeholder */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Placeholder *
                          </label>
                          <input
                            type="text"
                            value={field.placeholder}
                            onChange={(e) => handleFieldNameChange(index, 'placeholder', e.target.value)}
                            className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-1 ${
                              fieldErrors[index]?.placeholder 
                                ? 'border-red-300 focus:ring-red-500' 
                                : 'border-gray-300 focus:ring-green-500'
                            }`}
                            placeholder=""
                          />
                          {fieldErrors[index]?.placeholder && (
                            <p className="mt-1 text-sm text-red-600">{fieldErrors[index].placeholder}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-3 text-xs text-gray-500">
                        <p><span className="font-medium">Note:</span> Field name is used for data processing, placeholder is displayed to users.</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row justify-end gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-5 py-2.5 border border-gray-300 cursor-pointer rounded-md text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  disabled={updating}
                >
                  Reset Changes
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2.5 bg-green-600 text-white cursor-pointer rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[140px]"
                >
                  {updating ? (
                    <>
                      Updating...
                    </>
                  ) : (
                    <>
                      Update Service
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
          </div>
        </main>
      </div>
    );
  }
  
  export default Updateservice;