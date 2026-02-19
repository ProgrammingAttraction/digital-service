import React, { useState, useEffect } from 'react';
import { 
  Power, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  Download,
  X,
  FileText,
  Clock,
  User,
  Calendar,
  CheckCircle,
  AlertCircle,
  Check,
  ArrowLeft,
  Loader2,
  FileUp,
  Info,
  Star,
  Tag,
  CreditCard,
  Shield,
  Zap
} from 'lucide-react';

import Header from '../../components/header/Header';
import Sidebar from '../../components/sidebar/Sidebar';
import axios from "axios";
import { IoChevronBackOutline } from "react-icons/io5";
import {useParams, useNavigate} from "react-router-dom"
import ApertureLoader from '../../components/loader/ApertureLoader';
import { useTheme } from '../../context/ThemeContext';

function Orderdetails() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isWorkActive, setIsWorkActive] = useState(true);
  const [selectedService, setSelectedService] = useState(null);
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [orderSuccessData, setOrderSuccessData] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const {id} = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user?.id;

  // Fetch single service from API by ID
  useEffect(() => {
    if (id) {
      fetchService();
    }
  }, [id]);

  const fetchService = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${base_url}/api/user/services/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'userId': user.id
        }
      });
      
      console.log('Service response:', response.data);

      if (response.data.success) {
        const serviceData = response.data.data;
        setService(serviceData);
        
        // Auto-select the service since we're viewing its details
        setSelectedService(serviceData);
        
        // Initialize form data for this service
        const initialFormData = {
          [serviceData._id]: {
            quantity: 1,
            notes: '',
            urgency: 'normal',
            files: [],
            // Initialize dynamic data as a single string
            dynamicData: ''
          }
        };
        setFormData(initialFormData);
      }
    } catch (error) {
      console.error('Error fetching service:', error);
      // If service not found or error, redirect back or show error
      if (error.response?.status === 404) {
        navigate('/services'); // Adjust this route as needed
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  const handleBackToServices = () => {
    navigate('/services'); // Adjust this route as needed
  };

  const handleInputChange = (serviceId, field, value) => {
    setFormData(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        [field]: value
      }
    }));

    // Clear error for this field
    if (formErrors[serviceId]?.[field]) {
      setFormErrors(prev => ({
        ...prev,
        [serviceId]: {
          ...prev[serviceId],
          [field]: ''
        }
      }));
    }
    
    // Clear general submit error when user starts typing
    if (submitError) {
      setSubmitError('');
    }
  };

  const handleFileUpload = (serviceId, e) => {
    const files = Array.from(e.target.files);
    handleInputChange(serviceId, 'files', files);
  };

  const validateForm = (serviceId) => {
    const errors = {};
    const serviceForm = formData[serviceId];
    
    // Validate dynamic data
    if (!serviceForm.dynamicData || serviceForm.dynamicData.trim() === '') {
      errors.dynamicData = 'Please enter all required information';
    } else {
      // Parse lines and check if we have enough lines for all fields
      const lines = serviceForm.dynamicData.split(/\r?\n/).filter(line => line.trim() !== '');
      if (lines.length < service.fieldNames.length) {
        errors.dynamicData = `Please fill in all required fields. Expected ${service.fieldNames.length} fields, got ${lines.length}`;
      }
    }

    return errors;
  };

  const handleSubmitOrder = async (service) => {
    const serviceId = service._id;
    const serviceForm = formData[serviceId];
    const dynamicData = serviceForm.dynamicData || '';
    
    // Parse lines
    const lines = dynamicData.split(/\r?\n/).filter(line => line.trim() !== '');
    
    // Validate form
    const errors = validateForm(serviceId);
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(prev => ({
        ...prev,
        [serviceId]: errors
      }));
      return;
    }
    
    // Combine field names with values
    const formattedData = service.fieldNames.map((field, index) => {
      const value = lines[index] || '';
      return `${field.name} - ${value.trim()}`;
    }).join('\n');
    
    try {
      setSubmitting(true);
      setSubmitError(''); // Clear any previous submit errors
      
      const formDataToSend = new FormData();
      formDataToSend.append('serviceId', service._id);
      formDataToSend.append('totalAmount', service.workRate);
      formDataToSend.append('dynamicData', formattedData); // Send with field names
      
      console.log('Sending formatted data:', formattedData);
      
      const response = await axios.post(`${base_url}/api/user/create-order`, formDataToSend, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'userId': userId,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log(response);
      
      if (response.data.success) {
        // Set success data
        setOrderSuccessData({
          orderId: response.data.data.orderId,
          serviceName: service.workName || service.workNameEnglish,
          quantity: serviceForm.quantity,
          totalAmount: service.workRate,
          date: new Date().toLocaleDateString('bn-BD')
        });
        
        // Show success popup
        setShowSuccessPopup(true);
        
        // Reset form for this service
        setFormData(prev => ({
          ...prev,
          [serviceId]: {
            quantity: 1,
            notes: '',
            urgency: 'normal',
            files: [],
            dynamicData: ''
          }
        }));
        
        setFormErrors(prev => ({
          ...prev,
          [serviceId]: {}
        }));
      }
    } catch (error) {
      console.error('Error placing order:', error);
      // Set error message to display below submit button
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Failed to place order. Please try again.';
      setSubmitError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartWork = () => {
    setIsWorkActive(true);
  };

  const handleStopWork = () => {
    setIsWorkActive(false);
    setSelectedService(null);
  };

  const getServiceIcon = (serviceType) => {
    switch(serviceType?.toLowerCase()) {
      case 'pdf_file':
        return <FileText className="text-white" size={24} />;
      case 'document':
        return <FileText className="text-green-500" size={24} />;
      case 'passport':
        return <Shield className="text-purple-500" size={24} />;
      case 'nid':
        return <CreditCard className="text-red-500" size={24} />;
      default:
        return <FileText className="text-gray-500" size={24} />;
    }
  };

  // Success Popup Component
  const SuccessPopup = () => {
    if (!showSuccessPopup || !orderSuccessData) return null;

    return (
      <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[100000] p-4">
        <div className={`rounded-2xl p-6 md:p-8 max-w-md w-full shadow-xl transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="text-center">
            <div className={`mx-auto flex items-center justify-center h-16 w-16 md:h-20 md:w-20 rounded-full mb-4 md:mb-6 ${
              isDarkMode ? 'bg-green-900/40' : 'bg-green-100'
            }`}>
              <CheckCircle className="h-10 w-10 md:h-12 md:w-12 text-green-600" />
            </div>
            
            <h3 className={`text-xl md:text-2xl font-bold mb-2 transition-colors duration-300 ${
              isDarkMode ? 'text-gray-100' : 'text-gray-900'
            }`}>
              অর্ডার সফল!
            </h3>
            
            <p className={`text-sm md:text-base mb-4 md:mb-6 transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              আপনার অর্ডারটি সফলভাবে প্লেস করা হয়েছে।
            </p>
            
            <div className={`rounded-xl p-4 mb-4 md:mb-6 border transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-gray-700/50 border-gray-600' 
                : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="grid grid-cols-1 gap-3 md:gap-4">
                <div className="text-left">
                  <p className={`text-xs md:text-sm transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    অর্ডার আইডি
                  </p>
                  <p className={`font-semibold text-sm md:text-base truncate transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    {orderSuccessData.orderId}
                  </p>
                </div>
                <div className="text-left">
                  <p className={`text-xs md:text-sm transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    সেবা
                  </p>
                  <p className={`font-semibold text-sm md:text-base truncate transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    {orderSuccessData.serviceName}
                  </p>
                </div>
                <div className="text-left">
                  <p className={`text-xs md:text-sm transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    মোট টাকা
                  </p>
                  <p className="font-semibold text-sm md:text-base text-green-600">
                    {orderSuccessData.totalAmount}৳
                  </p>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => {
                setShowSuccessPopup(false);
                navigate('/order/history');
              }}
              className="w-full bg-green-600 hover:bg-green-700 cursor-pointer text-white font-semibold py-3 px-4 rounded-xl transition duration-200 text-sm md:text-base"
            >
              ঠিক আছে
            </button>
          </div>
        </div>
      </div>
    );
  };

  // If work is stopped
  if (!isWorkActive) {
    return (
      <div className={`font-anek lg:ml-72 mt-[9vh] transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-gray-900 text-gray-100' 
          : 'text-gray-700'
      }`}>
        <Header toggleSidebar={toggleSidebar} />
        <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />

        <main className={`min-h-[93vh] p-4 md:p-6 transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-gradient-to-br from-gray-900 to-gray-800' 
            : 'bg-gradient-to-br from-gray-50 to-gray-100'
        }`}>
          <h1 className={`text-xl md:text-2xl font-bold mb-4 transition-colors duration-300 ${
            isDarkMode ? 'text-green-400' : 'text-[#00a65a]'
          }`}>
            ফাইল অর্ডার সিস্টেম
          </h1>
          
          <div className={`border rounded-xl p-6 md:p-12 mb-6 flex flex-col items-center justify-center shadow-lg max-w-4xl mx-auto transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-gradient-to-r from-gray-800 to-gray-900 border-gray-700' 
              : 'bg-gradient-to-r from-white to-gray-50 border-gray-200'
          }`}>
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-full p-4 md:p-6 mb-4 md:mb-6 shadow-lg">
              <Power size={40} md:size={56} color="white" strokeWidth={2.5} />
            </div>
            <h2 className="text-red-600 text-2xl md:text-4xl font-bold mb-2 md:mb-3">কাজ বন্ধ</h2>
            <p className={`text-sm md:text-lg mb-6 md:mb-8 text-center max-w-md transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              সিস্টেমটি বর্তমানে অকার্যকর অবস্থায় রয়েছে। কাজ চালু হলে এখানে সব সেবা অপশন দেখতে পারবেন।
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={`font-anek lg:ml-72 mt-[9vh] transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gray-900 text-gray-100' 
        : 'text-gray-800'
    }`}>
      <Header toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />
      <SuccessPopup />

      <main className={`min-h-[93vh] p-4 md:p-6 transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-gray-900 to-gray-800' 
          : 'bg-gradient-to-br from-gray-50 to-gray-100'
      }`}>
        {/* Page Header with Work Control */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
          <div>
            <h1 className={`text-xl md:text-2xl lg:text-3xl font-bold transition-colors duration-300 ${
              isDarkMode ? 'text-green-400' : 'text-[#00a65a]'
            }`}>
               অর্ডার সিস্টেম
            </h1>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-16">
            <div className="flex flex-col items-center">
              <ApertureLoader/>
              <p className={`text-sm md:text-base mt-1 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                সেবা লোড হচ্ছে...
              </p>
            </div>
          </div>
        )}

        {/* Error State - Service not found */}
        {!loading && !service && (
          <div className={`border-2 border-dashed rounded-2xl p-6 md:p-12 text-center shadow-sm max-w-2xl mx-auto transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-gradient-to-r from-gray-800 to-gray-900 border-gray-700' 
              : 'bg-gradient-to-r from-white to-gray-50 border-gray-300'
          }`}>
            <Info className={`mx-auto mb-3 md:mb-4 size-12 md:size-16 transition-colors duration-300 ${
              isDarkMode ? 'text-gray-600' : 'text-gray-400'
            }`} />
            <p className={`text-base md:text-xl font-medium mb-1 md:mb-2 transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              সেবা পাওয়া যায়নি
            </p>
            <p className={`text-xs md:text-sm max-w-md mx-auto mb-4 md:mb-6 transition-colors duration-300 ${
              isDarkMode ? 'text-gray-500' : 'text-gray-500'
            }`}>
              অনুরোধকৃত সেবাটি পাওয়া যায়নি। এটি মুছে ফেলা হতে পারে বা অস্থায়ীভাবে অনুপলব্ধ।
            </p>
            <button
              onClick={handleBackToServices}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 md:py-3 px-4 md:px-6 rounded-lg md:rounded-xl transition duration-200 text-sm md:text-base flex items-center gap-2 mx-auto"
            >
              <ArrowLeft size={16} md:size={18} />
              <span>সকল সেবা দেখুন</span>
            </button>
          </div>
        )}

        {/* Service Details and Form */}
        {!loading && service && selectedService && (
          <div className={`border rounded-lg md:rounded-[10px] p-4 md:p-6 lg:p-8 mb-6 md:mb-8 transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' 
              : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'
          }`}>
            {/* Header with Back Button */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 md:mb-8 gap-4 md:gap-6">
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 lg:gap-6">
                  <div>
                    <h2 className={`text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold mb-1 md:mb-2 transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-900'
                    }`}>
                      {service.workName || service.workNameEnglish}
                    </h2>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-lg md:text-xl px-4 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl">
                {service.workRate || '0'} টাকা
              </div>
            </div>

            <div className="w-full">
              {/* Order Form */}
              <div>
                
                <div className="space-y-4 md:space-y-6">
                  {/* Dynamic Fields displayed in a single textarea */}
                  {selectedService.fieldNames && selectedService.fieldNames.length > 0 && (
                    <div className="">
                      <label className={`block text-md md:text-lg font-semibold mb-1 md:mb-2 flex items-center gap-1 md:gap-2 transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        <span className="text-red-500">*</span>
                        Enter Data:
                      </label>
                      
                      {/* Textarea with field labels as placeholders */}
                      <div className="relative">
                        <textarea
                          value={formData[selectedService._id]?.dynamicData || ''}
                          onChange={(e) => handleInputChange(selectedService._id, 'dynamicData', e.target.value)}
                          className={`w-full border ${formErrors[selectedService._id]?.dynamicData ? 'border-red-400' : isDarkMode ? 'border-gray-600' : 'border-gray-200'} rounded-[5px] px-3 md:px-4 py-2 md:py-3 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 min-h-[150px] md:min-h-[180px] font-mono ${
                            isDarkMode 
                              ? 'bg-gray-800 text-gray-200 placeholder-gray-500' 
                              : 'bg-white text-gray-900 placeholder-gray-400'
                          }`}
                          placeholder={
                            selectedService.fieldNames.map(field => 
                              `${field.name} -\n`
                            ).join('') + ''
                          }
                        />
                      </div>
                      
                      {formErrors[selectedService._id]?.dynamicData && (
                        <p className="mt-1 md:mt-2 text-xs md:text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle size={12} md:size={14} />
                          {formErrors[selectedService._id].dynamicData}
                        </p>
                      )}
                      
                      {/* Field instructions */}
                      <p className={`mt-1 text-xs transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-500' : 'text-gray-500'
                      }`}>
                        Enter each value on a new line. Expected fields: {selectedService.fieldNames.length}
                      </p>
                    </div>
                  )}

                  {/* Submit Error Display - Shows API errors */}
                  {submitError && (
                    <div className={`rounded-lg p-4 border transition-colors duration-300 ${
                      isDarkMode 
                        ? 'bg-red-900/20 border-red-800/50' 
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-start gap-3">
                        <AlertCircle className="text-red-500 flex-shrink-0" size={18} />
                          <p className="text-red-600 text-sm ">{submitError}</p>
                      </div>
                    </div>
                  )}

                  {/* Money Deduction Notice - ADDED HERE */}
                  <div className={`mt-4 md:mt-6 mb-3 md:mb-4 p-3 md:p-4 text-sm md:text-base rounded-md flex justify-start items-center gap-2 transition-colors duration-300 ${
                    isDarkMode 
                      ? 'bg-blue-900/20 border border-blue-800/30' 
                      : 'bg-blue-50 border border-blue-200'
                  }`}>
                    <div className="flex items-center">
                      <svg className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className={`transition-colors duration-300 ${
                      isDarkMode ? 'text-blue-300' : 'text-blue-700'
                    }`}>
                      এই সেবার জন্য আপনার অ্যাকাউন্ট থেকে <span className="font-bold">{service?.workRate || '0'} টাকা</span> কাটা হবে। 
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-1 md:pt-2">
                    <button
                      onClick={() => handleSubmitOrder(selectedService)}
                      disabled={submitting}
                      className="flex-1 bg-gradient-to-r from-green-500 to-green-600 cursor-pointer hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 md:py-4 px-4 md:px-6 rounded-lg md:rounded-xl transition-all duration-300 flex items-center cursor-pointer justify-center gap-2 md:gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-green-500 disabled:hover:to-green-600 text-sm md:text-base"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="animate-spin" size={18} md:size={20} />
                          <span>প্রক্রিয়াকরণ হচ্ছে...</span>
                        </>
                      ) : (
                        <>
                          <span>অর্ডার নিশ্চিত করুন</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Orderdetails;