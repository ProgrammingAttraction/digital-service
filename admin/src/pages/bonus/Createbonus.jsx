import React, { useState } from 'react';
import Header from '../../components/header/Header';
import Sidebar from '../../components/sidebar/Sidebar';
import toast, { Toaster } from "react-hot-toast";
import { FaBangladeshiTakaSign } from "react-icons/fa6";

function CreateBonus() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const token = localStorage.getItem('adminToken');
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  // Form state for Bonus (simplified)
  const [formData, setFormData] = useState({
    title: '',
    minimumDeposit: '',
    bonusAmount: '',
    description: '',
    status: 'active'
  });

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

  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!formData.title.trim()) errors.title = 'Bonus title is required';
    
    const minDeposit = parseFloat(formData.minimumDeposit);
    const bonusAmount = parseFloat(formData.bonusAmount);
    
    if (!formData.minimumDeposit || isNaN(minDeposit) || minDeposit < 0) {
      errors.minimumDeposit = 'Valid minimum deposit is required (≥ 0)';
    }
    
    if (!formData.bonusAmount || isNaN(bonusAmount) || bonusAmount < 0) {
      errors.bonusAmount = 'Valid bonus amount is required (≥ 0)';
    }
    
    return errors;
  };

  // Handle form submission for Bonus
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
    
    try {
      const response = await fetch(`${base_url}/api/admin/bonuses`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        const errorMessage = data.message || data.error || `Error: ${response.status} ${response.statusText}`;
        throw new Error(errorMessage);
      }
      
      if (!data.success) {
        throw new Error(data.message || 'Operation failed');
      }
      
      // Success case - reset form
      setFormData({
        title: '',
        minimumDeposit: '',
        bonusAmount: '',
        description: '',
        status: 'active'
      });
      
      setFormErrors({});
      setError(null);
      
      toast.success(data.message || 'Bonus created successfully!');
      
    } catch (err) {
      console.error('Submission error:', err);
      setError(err.message);
      toast.error(err.message || 'Failed to create bonus. Please try again.');
    }
  };

  // Reset form
  const handleReset = () => {
    setFormData({
      title: '',
      minimumDeposit: '',
      bonusAmount: '',
      description: '',
      status: 'active'
    });
    
    setFormErrors({});
    setError(null);
    setSuccessMessage(null);
  };

  if (loading) {
    return (
      <div className="font-anek text-gray-700 lg:ml-72 mt-[9vh]">
        <Header toggleSidebar={toggleSidebar} />
        <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />
        <main className="min-h-[93vh] bg-[#f8f9fa] p-4 md:p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Creating bonus...</p>
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
          <h1 className="text-[#00a65a] text-2xl font-bold mb-2">Create Bonus</h1>
          <p className="text-gray-600">Create a new bonus here. Users will get this bonus when they deposit the minimum amount.</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800">Bonus Form</h2>
            <p className="text-sm text-gray-600 mt-1">Fields marked with * are required</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Title */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bonus Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-1 ${
                    formErrors.title 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-green-500'
                  }`}
                  placeholder="Deposit Bonus, Special Offer"
                />
                {formErrors.title && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.title}</p>
                )}
              </div>

              {/* Minimum Deposit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Deposit Required *
                </label>
                <div className="relative">
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
                    placeholder="500"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">৳</span>
                  </div>
                </div>
                {formErrors.minimumDeposit && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.minimumDeposit}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">Minimum amount user must deposit to get this bonus</p>
              </div>

              {/* Bonus Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bonus Amount *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="bonusAmount"
                    value={formData.bonusAmount}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-1 ${
                      formErrors.bonusAmount 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-green-500'
                    }`}
                    placeholder="50"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">৳</span>
                  </div>
                </div>
                {formErrors.bonusAmount && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.bonusAmount}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">Amount of bonus user will receive</p>
              </div>
              {/* Description - Full width */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="Enter bonus description or terms (optional)..."
                />
                <p className="text-xs text-gray-500 mt-1">Optional description or terms & conditions</p>
              </div>

            </div>

            {/* Bonus Preview */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Bonus Preview</h3>
              
              {formData.title || formData.minimumDeposit || formData.bonusAmount ? (
                <div className="bg-white p-6 rounded-lg border border-gray-300">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xl font-bold text-gray-800">{formData.title || "Bonus Title"}</h4>
                      {formData.description && (
                        <p className="text-gray-600 mt-2">{formData.description}</p>
                      )}
                    </div>
                    <div className="flex-shrink-0 ml-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        {formData.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 ">
                    <div className="bg-gray-50 p-4 rounded-lg border-[1px] border-gray-200">
                      <div className="text-sm text-gray-500 mb-1">Minimum Deposit</div>
                      <div className="text-2xl font-bold text-gray-800">
                        ৳{formData.minimumDeposit || "0"}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Required to get bonus</div>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg border-[1px] border-green-200">
                      <div className="text-sm text-green-600 mb-1">Bonus You Get</div>
                      <div className="text-2xl font-bold text-green-700">
                        ৳{formData.bonusAmount || "0"}
                      </div>
                      <div className="text-xs text-green-600 mt-1">Extra amount credited</div>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      <strong>How it works:</strong> Deposit ৳{formData.minimumDeposit || "0"} or more and get ৳{formData.bonusAmount || "0"} as bonus!
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                 <FaBangladeshiTakaSign className='text-[40px] block m-auto mb-2'/>
                  <p className="text-lg">Fill the form to see bonus preview</p>
                  <p className="text-sm mt-2">The preview will show how users will see this bonus</p>
                </div>
              )}
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
                    Create Bonus
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default CreateBonus;