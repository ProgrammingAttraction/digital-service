import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { 
  ArrowLeft,
  Save,
  Upload, 
  Image as ImageIcon, 
  Eye,
  Loader2,
  DollarSign,
  Phone,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Trash2,
  Shield,
  User,
  Building,
  Briefcase,
  Store,
  Users
} from 'lucide-react';
import Header from '../../components/header/Header';
import Sidebar from '../../components/sidebar/Sidebar';
import { IoClose } from "react-icons/io5";
import ApertureLoader from '../../components/loader/ApertureLoader';

function Editmethod() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [method, setMethod] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);
  
  // Account types configuration
  const accountTypes = [
    { value: 'agent', label: 'Agent Account', icon: Briefcase, description: 'For registered agents or representatives', color: 'bg-blue-100 text-blue-800' },
    { value: 'personal', label: 'Personal Account', icon: User, description: 'For individual users', color: 'bg-green-100 text-green-800' },
    { value: 'merchant', label: 'Merchant Account', icon: Store, description: 'For commercial merchants', color: 'bg-yellow-100 text-yellow-800' },
  ];

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    accountType: 'agent',
    agentNumber: '',
    minimumDeposit: '',
    maximumDeposit: '',
    status: 'active'
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);
  const [removeImageFlag, setRemoveImageFlag] = useState(false);
  
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const token = localStorage.getItem('adminToken');

  // Fetch deposit method data
  useEffect(() => {
    fetchMethodData();
  }, [id]);

  // GET: Fetch method data
  const fetchMethodData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${base_url}/api/admin/deposit-methods/${id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        const methodData = response.data.data;
        setMethod(methodData);
        setFormData({
          name: methodData.name,
          description: methodData.description,
          accountType: methodData.accountType || 'agent', // Default to 'agent' if not present
          agentNumber: methodData.agentNumber,
          minimumDeposit: methodData.minimumDeposit.toString(),
          maximumDeposit: methodData.maximumDeposit.toString(),
          status: methodData.status
        });
      }
    } catch (error) {
      console.error('Error fetching deposit method:', error);
      toast.error(error.response?.data?.error || 'Failed to load deposit method');
    } finally {
      setLoading(false);
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Clear error for this field
    setFormErrors(prev => ({ ...prev, [name]: '' }));
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Validate maximum >= minimum
    if (name === 'minimumDeposit' || name === 'maximumDeposit') {
      const minDeposit = name === 'minimumDeposit' ? parseFloat(value) : parseFloat(formData.minimumDeposit);
      const maxDeposit = name === 'maximumDeposit' ? parseFloat(value) : parseFloat(formData.maximumDeposit);
      
      if (!isNaN(minDeposit) && !isNaN(maxDeposit) && maxDeposit < minDeposit) {
        setFormErrors(prev => ({
          ...prev,
          maximumDeposit: 'Maximum deposit must be greater than or equal to minimum deposit'
        }));
      }
    }
  };

  // Handle image change
  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only image files are allowed (JPEG, JPG, PNG, GIF, WebP)');
        return;
      }
      
      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      
      setEditImageFile(file);
      setRemoveImageFlag(false); // Reset remove flag if new image is selected
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setEditImagePreview(previewUrl);
    }
  };

  // Remove uploaded image (new image)
  const handleRemoveEditImage = () => {
    if (editImagePreview) {
      URL.revokeObjectURL(editImagePreview);
    }
    setEditImageFile(null);
    setEditImagePreview(null);
  };

  // Remove existing image (mark for deletion)
  const handleRemoveExistingImage = () => {
    setRemoveImageFlag(true);
  };

  // Restore existing image
  const handleRestoreImage = () => {
    setRemoveImageFlag(false);
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
    
    if (isNaN(minDeposit) || minDeposit < 0) {
      errors.minimumDeposit = 'Valid minimum deposit is required';
    }
    
    if (isNaN(maxDeposit) || maxDeposit < 0) {
      errors.maximumDeposit = 'Valid maximum deposit is required';
    }
    
    if (!isNaN(minDeposit) && !isNaN(maxDeposit) && maxDeposit < minDeposit) {
      errors.maximumDeposit = 'Maximum deposit must be greater than or equal to minimum deposit';
    }
    
    return errors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Please fix the form errors');
      return;
    }
    
    try {
      setSaving(true);
      
      // Prepare data for PUT request
      const updateData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        accountType: formData.accountType,
        agentNumber: formData.agentNumber.trim(),
        minimumDeposit: parseFloat(formData.minimumDeposit),
        maximumDeposit: parseFloat(formData.maximumDeposit),
        status: formData.status
      };
      
      // Handle image scenarios
      if (editImageFile) {
        // New image uploaded - use FormData
        const formDataObj = new FormData();
        formDataObj.append('image', editImageFile);
        
        // Append other fields
        Object.keys(updateData).forEach(key => {
          formDataObj.append(key, updateData[key]);
        });
        
        // PUT request with FormData
        await axios.put(
          `${base_url}/api/admin/deposit-methods/${id}`,
          formDataObj,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
      } else {
        // No new image uploaded
        if (removeImageFlag && method.image) {
          // User wants to remove existing image
          updateData.removeImage = 'true';
        }
        // If not removing and no new image, existing image will be kept automatically
        
        // PUT request with JSON
        await axios.put(
          `${base_url}/api/admin/deposit-methods/${id}`,
          updateData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
      }
      
      // Success
      toast.success('Deposit method updated successfully');
      
      // Clean up
      if (editImagePreview) {
        URL.revokeObjectURL(editImagePreview);
      }
      
      // Navigate back after a short delay
      setTimeout(() => {
        navigate('/admin/payment-methods/all');
      }, 1500);
      
    } catch (error) {
      console.error('Error updating deposit method:', error);
      
      if (error.response?.data?.error) {
        const errorMsg = error.response.data.error;
        toast.error(errorMsg);
        
        // Handle validation errors from server
        if (error.response.data.details) {
          const serverErrors = {};
          error.response.data.details.forEach(detail => {
            if (detail.includes('name')) serverErrors.name = detail;
            if (detail.includes('description')) serverErrors.description = detail;
            if (detail.includes('account type')) serverErrors.accountType = detail;
            if (detail.includes('agent')) serverErrors.agentNumber = detail;
            if (detail.includes('minimum')) serverErrors.minimumDeposit = detail;
            if (detail.includes('maximum')) serverErrors.maximumDeposit = detail;
          });
          setFormErrors(serverErrors);
        }
      } else {
        toast.error('Failed to update deposit method');
      }
    } finally {
      setSaving(false);
    }
  };

  // Get selected account type details
  const getSelectedAccountTypeDetails = () => {
    return accountTypes.find(type => type.value === formData.accountType) || accountTypes[0];
  };

  // Status toggle component
  const StatusToggle = () => {
    const isActive = formData.status === 'active';
    
    return (
      <div className="flex items-center space-x-4">
        <button
          type="button"
          className={`relative inline-flex h-8 w-16 items-center rounded-full transition-all duration-300 ${
            isActive 
              ? 'bg-gradient-to-r from-emerald-500 to-green-500 shadow-lg shadow-green-200/50' 
              : 'bg-gradient-to-r from-gray-400 to-gray-500'
          } cursor-pointer hover:shadow-md`}
          onClick={() => setFormData(prev => ({ 
            ...prev, 
            status: prev.status === 'active' ? 'inactive' : 'active' 
          }))}
        >
          <span
            className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-all duration-300 ${
              isActive ? 'translate-x-9' : 'translate-x-1'
            }`}
          />
        </button>
        <div className="flex items-center space-x-2">
          {isActive ? (
            <CheckCircle size={20} className="text-green-600" />
          ) : (
            <XCircle size={20} className="text-red-600" />
          )}
          <span className={`text-sm font-medium ${isActive ? 'text-green-600' : 'text-red-600'}`}>
            {isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="font-anek text-gray-700 lg:ml-72 mt-[9vh]">
        <Header toggleSidebar={toggleSidebar} />
        <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />
        <main className="min-h-[93vh] bg-[#f8f9fa] p-4 md:p-6 flex items-center justify-center">
          <div className="text-center">
            <ApertureLoader/>
            <p className="mt-2 text-gray-600">Loading</p>
          </div>
        </main>
      </div>
    );
  }

  if (!method) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
          <p className="mt-4 text-gray-600">Deposit method not found</p>
          <button
            onClick={() => navigate('/admin/deposit-methods')}
            className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const existingImageUrl = method.image ? `${base_url}${method.image}` : null;
  const selectedAccountType = getSelectedAccountTypeDetails();

  return (
    <div className="font-anek text-gray-700 lg:ml-72 mt-[9vh]">
      <Header toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />
      <Toaster />
      <main className="min-h-[93vh] bg-[#f8f9fa] p-4 md:p-6">
        <div className="mb-8">
          <h1 className="text-[#00a65a] text-2xl font-bold mb-2">Edit Deposit Method</h1>
          <div className="flex items-center text-sm text-gray-600">
            <span>Editing: </span>
            <span className="font-medium ml-1">{method.name}</span>
          </div>
        </div>


        {/* Main Form */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-6 md:p-8">
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {/* Method Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Method Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                      formErrors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    required
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                  )}
                </div>

                {/* Account Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Type *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {accountTypes.map((type) => {
                      const IconComponent = type.icon;
                      const isSelected = formData.accountType === type.value;
                      
                      return (
                        <div
                          key={type.value}
                          onClick={() => {
                            setFormData(prev => ({ ...prev, accountType: type.value }));
                            setFormErrors(prev => ({ ...prev, accountType: '' }));
                          }}
                          className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                            isSelected 
                              ? `border-teal-500 bg-teal-50 ${type.color.replace('text-', '').replace('bg-', 'bg-opacity-20')}`
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${type.color}`}>
                              <IconComponent size={20} />
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">{type.label}</p>
                              <p className="text-xs text-gray-500 mt-1">{type.description}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {formErrors.accountType && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.accountType}</p>
                  )}
                </div>

                {/* Agent Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Agent Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      name="agentNumber"
                      value={formData.agentNumber}
                      onChange={handleInputChange}
                      className={`w-full border rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                        formErrors.agentNumber ? 'border-red-300' : 'border-gray-300'
                      }`}
                      required
                    />
                  </div>
                  {formErrors.agentNumber && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.agentNumber}</p>
                  )}
                </div>

                {/* Deposit Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Deposit (৳) *
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="number"
                        name="minimumDeposit"
                        value={formData.minimumDeposit}
                        onChange={handleInputChange}
                        min="0"
                        step="1"
                        className={`w-full border rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                          formErrors.minimumDeposit ? 'border-red-300' : 'border-gray-300'
                        }`}
                        required
                      />
                    </div>
                    {formErrors.minimumDeposit && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.minimumDeposit}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Deposit (৳) *
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="number"
                        name="maximumDeposit"
                        value={formData.maximumDeposit}
                        onChange={handleInputChange}
                        min="0"
                        step="1"
                        className={`w-full border rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                          formErrors.maximumDeposit ? 'border-red-300' : 'border-gray-300'
                        }`}
                        required
                      />
                    </div>
                    {formErrors.maximumDeposit && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.maximumDeposit}</p>
                    )}
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <StatusToggle />
                </div>

                {/* Image Section */}
                <div className="border-t border-gray-200 pt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Method Image
                  </label>
                  
                  <div className="space-y-4">
                    {/* Current Image */}
                    {existingImageUrl && !removeImageFlag && (
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-700">Current Image</span>
                          <button
                            type="button"
                            onClick={handleRemoveExistingImage}
                            className="text-sm text-red-600 hover:text-red-700 flex items-center"
                          >
                            <Trash2 size={14} className="mr-1" />
                            Remove Image
                          </button>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="relative group">
                            <img 
                              src={existingImageUrl} 
                              alt="Current" 
                              className="w-24 h-24 object-cover rounded-lg border border-gray-300"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="%239ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
                              }}
                            />
                            <a 
                              href={existingImageUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100"
                            >
                              <Eye size={20} className="text-white" />
                            </a>
                          </div>
                          <div className="text-sm text-gray-600">
                            <p>Current image will be kept if you don't upload a new one.</p>
                            <p className="text-xs text-gray-500 mt-1">Click "View" to see full size image.</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Image Removal Notice */}
                    {removeImageFlag && (
                      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <AlertTriangle size={16} className="text-yellow-600 mr-2" />
                            <span className="text-sm font-medium text-yellow-700">Image will be removed</span>
                          </div>
                          <button
                            type="button"
                            onClick={handleRestoreImage}
                            className="text-sm text-blue-600 hover:text-blue-700"
                          >
                            Keep Image
                          </button>
                        </div>
                        <p className="text-sm text-yellow-600 mt-1">Existing image will be deleted when you save changes.</p>
                      </div>
                    )}

                    {/* No Image Message */}
                    {!existingImageUrl && !editImagePreview && (
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-center">
                          <ImageIcon size={20} className="text-gray-400 mr-2" />
                          <span className="text-sm text-gray-600">No image currently set</span>
                        </div>
                      </div>
                    )}

                    {/* New Image Preview */}
                    {editImagePreview && (
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-green-700">New Image (Preview)</span>
                          <button
                            type="button"
                            onClick={handleRemoveEditImage}
                            className="text-sm text-red-600 hover:text-red-700 flex items-center"
                          >
                            <Trash2 size={14} className="mr-1" />
                            Remove
                          </button>
                        </div>
                        <div className="flex items-center space-x-4">
                          <img 
                            src={editImagePreview} 
                            alt="New" 
                            className="w-24 h-24 object-cover rounded-lg border-2 border-green-500"
                          />
                          <div className="text-sm text-green-700">
                            <p>This image will replace the current one.</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Upload Button */}
                    <div>
                      <input
                        type="file"
                        id="editImageUpload"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        onChange={handleEditImageChange}
                        className="hidden"
                      />
                      <label
                        htmlFor="editImageUpload"
                        className="cursor-pointer inline-flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors"
                      >
                        <Upload size={16} className="mr-2" />
                        {editImagePreview ? 'Change Image' : 'Upload New Image'}
                      </label>
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        JPEG, PNG, GIF, WebP (Max 5MB)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="border-t border-gray-200 pt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 text-gray-400" size={20} />
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="5"
                      className={`w-full border rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                        formErrors.description ? 'border-red-300' : 'border-gray-300'
                      }`}
                      required
                    />
                  </div>
                  {formErrors.description && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.description}</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => navigate('/admin/deposit-methods')}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center shadow-md hover:shadow-lg"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 size={18} className="mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} className="mr-2" />
                      Save Changes
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

export default Editmethod;