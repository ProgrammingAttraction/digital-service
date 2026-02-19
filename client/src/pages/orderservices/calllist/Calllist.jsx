import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Header from '../../../components/header/Header';
import Sidebar from '../../../components/sidebar/Sidebar';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../context/ThemeContext';
import agenda_img from "../../../assets/telephone-call.png";

function Calllist() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState('3months');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderSuccessData, setOrderSuccessData] = useState(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [prices, setPrices] = useState({
    price1: 0, // Default price for 3 months
    price2: 0  // Default price for 6 months
  });
  const [loadingPrices, setLoadingPrices] = useState(true);
  
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user?.id;
  const { isDarkMode } = useTheme();
  const [noticeLoading, setNoticeLoading] = useState(true);
  const [notice, setNotice] = useState('');
  // Fetch prices from API on component mount
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        setLoadingPrices(true);
        const response = await axios.get(`${base_url}/api/user/service/price/call-list`);
        console.log(response)
        if (response.data) {
          setPrices({
            price1: response.data.price1,
            price2: response.data.price2
          });
        }
      } catch (error) {
        console.error('Error fetching prices:', error);
        toast.error('দাম লোড করতে সমস্যা হয়েছে', {
          duration: 3000,
          position: 'top-center',
        });
      } finally {
        setLoadingPrices(false);
      }
    };

    fetchPrices();
  }, [base_url]);
 useEffect(() => {
    fetchNotice();
  }, []);

  // Fetch notice from backend
  const fetchNotice = async () => {
    try {
      setNoticeLoading(true);
      const response = await axios.get(`${base_url}/api/user/service/notice/call-list`);
      if (response.data) {
        setNotice(response.data.service);
      } else {
        setNotice('⚠️ নোটিশঃ ফরম নং হলে NIDFN জন্মতারিখ তারিখ এবং ১৩ ডিজিট হলে জন্মসাল যোগ অর্ডার করবেন');
      }
    } catch (error) {
      console.error('Error fetching notice:', error);
      setNotice('⚠️ নোটিশঃ ফরম নং হলে NIDFN জন্মতারিখ তারিখ এবং ১৩ ডিজিট হলে জন্মসাল যোগ অর্ডার করবেন');
    } finally {
      setNoticeLoading(false);
    }
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  const handlePhoneNumberChange = (e) => {
    const value = e.target.value;
    const numericValue = value.replace(/\D/g, '');
    setPhoneNumber(numericValue);
    
    if (submitError) {
      setSubmitError('');
    }
  };

  // Call List options - using dynamic prices
  const callListOptions = [
    { 
      id: '3months', 
      label: 'কল লিস্ট ৩ মাস',
      price: prices.price1,
      image: agenda_img,
      description: '৩ মাসের কল লিস্ট ডেটা'
    },
    { 
      id: '6months', 
      label: 'কল লিস্ট ৬ মাস',
      price: prices.price2,
      image: agenda_img,
      description: '৬ মাসের কল লিস্ট ডেটা'
    },
  ];

  const selectedData = callListOptions.find(opt => opt.id === selectedOption);

  // Validation function
  const validateForm = () => {
    if (!phoneNumber.trim()) {
      return 'ফোন নম্বর আবশ্যক';
    }
    
    if (phoneNumber.length !== 11) {
      return 'ফোন নম্বর ১১ ডিজিট হতে হবে (01XXXXXXXXX)';
    }
    
    if (!phoneNumber.startsWith('01')) {
      return 'ফোন নম্বর 01 দিয়ে শুরু হতে হবে';
    }
    
    return '';
  };

  // Handle form submission
  const handleSubmit = async () => {
    const error = validateForm();
    if (error) {
      setSubmitError(error);
      return;
    }
    
    try {
      setLoading(true);
      setSubmitError('');
      
      // Prepare request data
      const requestData = {
        serviceId: `calllist_${selectedOption}`,
        serviceName: `কল লিস্ট - ${selectedData.label}`,
        serviceRate: selectedData.price,
        serviceType: 'calllist',
        orderType: 'pdf_file',
        quantity: 1,
        notes: `ফোন নম্বর: ${phoneNumber}\nপ্যাকেজ: ${selectedData.label}\nমূল্য: ${selectedData.price} টাকা`,
        fieldValues: {
          phoneNumber: phoneNumber,
          packageType: selectedData.label,
          duration: selectedOption === '3months' ? '3 months' : '6 months',
          price: selectedData.price
        },
        totalAmount: selectedData.price,
        urgency: 'normal'
      };
      
      console.log('Sending order data:', requestData);
      const user = JSON.parse(localStorage.getItem('user'));
      const userId = user?.id;
      
      // Make API call
      const response = await axios.post(`${base_url}/api/user/create-service-order`, requestData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'userId': userId,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Order response:', response.data);
      
      if (response.data.success) {
        // Set success data
        setOrderSuccessData({
          orderId: response.data.data.orderId || response.data.data._id,
          serviceName: selectedData.label,
          quantity: 1,
          totalAmount: selectedData.price,
          phoneNumber: phoneNumber,
          duration: selectedOption === '3months' ? '৩ মাস' : '৬ মাস',
          date: new Date().toLocaleDateString('bn-BD')
        });
        
        // Show success popup
        setShowSuccessPopup(true);
        
        // Reset form
        setPhoneNumber('');
      } else {
        throw new Error(response.data.message || 'অর্ডার করতে সমস্যা হয়েছে');
      }
      
    } catch (error) {
      console.error('Error placing order:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message ||
                          'অর্ডার করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।';
      setSubmitError(errorMessage);
      
      toast.error(errorMessage, {
        duration: 4000,
        position: 'top-center',
      });
    } finally {
      setLoading(false);
    }
  };

  // Close success popup
  const closeSuccessPopup = () => {
    setShowSuccessPopup(false);
    setOrderSuccessData(null);
    navigate('/order/history');
  };

  return (
    <div className={`font-anek lg:ml-72 mt-[9vh] min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gray-900 text-gray-100' 
        : 'bg-white text-gray-700'
    }`}>
      <Header toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />

      {/* Success Popup */}
      {showSuccessPopup && orderSuccessData && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.7)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
          <div className={`rounded-2xl p-6 md:p-8 max-w-md w-full shadow-xl transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="text-center">
              <div className={`mx-auto flex items-center justify-center h-16 w-16 md:h-20 md:w-20 rounded-full mb-4 md:mb-6 ${
                isDarkMode ? 'bg-green-900/40' : 'bg-green-100'
              }`}>
                <svg className="h-10 w-10 md:h-12 md:w-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h3 className={`text-xl md:text-2xl font-bold mb-2 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-100' : 'text-gray-900'
              }`}>
                অর্ডার সফল!
              </h3>
              
              <p className={`text-sm md:text-base mb-4 md:mb-6 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                আপনার কল লিস্ট অর্ডারটি সফলভাবে প্লেস করা হয়েছে।
              </p>
              
              <div className={`rounded-xl p-4 mb-4 md:mb-6 border transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-gray-700/50 border-gray-600' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
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
                      প্যাকেজ
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
                      ফোন নম্বর
                    </p>
                    <p className={`font-semibold text-sm md:text-base transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-800'
                    }`}>
                      {orderSuccessData.phoneNumber}
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
                <div className="mt-3 pt-3 border-t border-gray-300">
                  <p className={`text-xs md:text-sm text-center transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    ডিউরেশন: {orderSuccessData.duration}
                  </p>
                </div>
              </div>
              
              <button
                onClick={closeSuccessPopup}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-xl transition duration-200 text-sm md:text-base cursor-pointer"
              >
                ঠিক আছে
              </button>
            </div>
          </div>
        </div>
      )}

      <main className='p-4 md:p-6'>
        <div className={`p-4 md:p-6 w-full border rounded-lg shadow-sm transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          
          {/* Header Title */}
          <h1 className={`text-xl md:text-2xl font-bold mb-6 transition-colors duration-300 ${
            isDarkMode ? 'text-theme_color' : 'text-theme_color'
          }`}>
            কল লিস্ট অর্ডার
          </h1>
          
          {/* Notice Box */}
          <div className={`border rounded-md p-2 mb-6 transition-colors duration-300 ${
            isDarkMode 
              ? 'border-theme_color bg-gray-800' 
              : 'border-theme_color bg-white'
          }`}>
            <div className="flex items-center justify-between">
              <marquee className={`text-sm md:text-[17px] flex-1 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {notice}
              </marquee>
              <div className={`w-4 h-4 rounded-full flex items-center justify-center ml-2 flex-shrink-0 transition-colors duration-300 ${
                isDarkMode ? 'bg-green-600' : 'bg-green-500'
              }`}>
                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
          {/* Form Section */}
          <div className="space-y-6">
            
            {/* Type Selection */}
            <div>
              <label className={`text-[15px] font-semibold mb-3 block transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                প্যাকেজ নির্বাচন করুন *
              </label>
              <div className="flex flex-wrap gap-4">
                {callListOptions.map((option) => (
                  <div 
                    key={option.id}
                    onClick={() => setSelectedOption(option.id)}
                    className={`cursor-pointer w-44 rounded-lg border overflow-hidden transition-all duration-300 ${
                      selectedOption === option.id 
                      ? isDarkMode 
                        ? 'border-green-500 shadow-md' 
                        : 'border-theme_color2 shadow-sm'
                      : isDarkMode 
                        ? 'border-gray-700 hover:border-gray-600' 
                        : 'border-gray-200'
                    }`}
                  >
                    <div className={`flex flex-col items-center transition-colors duration-300 ${
                      isDarkMode 
                        ? selectedOption === option.id ? 'bg-gray-700' : 'bg-gray-800'
                        : 'bg-white'
                    }`}>
                      <img 
                        src={option.image} 
                        alt="icon" 
                        className="w-[70px] p-2 h-[70px] md:w-[85px] md:h-[85px] object-contain rounded-t-md"
                      />
                      <div className="py-3 text-center w-full">
                        <span className={`text-base font-bold transition-colors duration-300 ${
                          isDarkMode 
                            ? selectedOption === option.id ? 'text-gray-100' : 'text-gray-300'
                            : 'text-gray-700'
                        }`}>
                          {option.label}
                        </span> 
                        <br />
                        <span className={`text-[13px] md:text-[15px] font-semibold mt-0.5 transition-colors duration-300 ${
                          isDarkMode 
                            ? selectedOption === option.id ? 'text-green-400' : 'text-gray-400'
                            : 'text-gray-600'
                        }`}>
                          ({option.price} টাকা)
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Phone Number Input */}
            <div>
              <label className={`text-[15px] font-semibold mb-2 block transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                ফোন নম্বর *
              </label>
              <input 
                type="text"
                value={phoneNumber}
                onChange={handlePhoneNumberChange}
                placeholder="01XXXXXXXXX (11 ডিজিট)"
                className={`w-full border rounded-md text-sm md:text-[15px] px-4 py-2 focus:outline-none focus:ring-1 placeholder:text-gray-400 transition-colors duration-300 ${
                  submitError 
                    ? isDarkMode ? 'border-red-500 focus:ring-red-500' : 'border-red-400 focus:ring-red-400'
                    : isDarkMode 
                      ? 'border-gray-600 bg-gray-700 text-gray-100 focus:ring-green-500 focus:border-green-500' 
                      : 'border-gray-300 focus:ring-theme_color2 focus:border-theme_color2'
                }`}
                maxLength="11"
              />
              {submitError && (
                <p className="mt-2 text-xs text-red-500">{submitError}</p>
              )}
            </div>

            {/* Submit Error Display */}
            {submitError && !submitError.includes('আবশ্যক') && !submitError.includes('ডিজিট') && (
              <div className={`rounded-lg p-3 transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-red-900/20 border-red-800/50' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-500 text-sm">{submitError}</p>
                </div>
              </div>
            )}

            {/* Money Deduction Notice */}
            <div className={`mt-6 mb-4 p-3 text-base border rounded-md flex justify-start items-center gap-2 transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-blue-900/20 border-blue-800/50' 
                : 'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className={isDarkMode ? 'text-blue-300' : 'text-blue-700'}>
                এই সেবার জন্য আপনার অ্যাকাউন্ট থেকে <span className="font-bold">{selectedData?.price} টাকা</span> কাটা হবে। 
              </p>
            </div>

            {/* Order Button */}
            <button 
              onClick={handleSubmit}
              disabled={loading || loadingPrices}
              className={`w-full text-white font-medium py-3 rounded-md transition-colors text-lg flex items-center justify-center ${
                loading || loadingPrices
                  ? isDarkMode 
                    ? 'bg-green-800 opacity-70 cursor-not-allowed' 
                    : 'bg-theme_color2 opacity-70 cursor-not-allowed'
                  : isDarkMode 
                    ? 'bg-green-600 hover:bg-green-700 cursor-pointer' 
                    : 'bg-theme_color2 hover:bg-[#1bb386] cursor-pointer'
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  অর্ডার করা হচ্ছে...
                </>
              ) : loadingPrices ? (
                'দাম লোড হচ্ছে...'
              ) : (
                `অর্ডার করুন (${selectedData?.price || 1250} TK)`
              )}
            </button>

          </div>
          <hr className={`mt-10 transition-colors duration-300 ${
            isDarkMode ? 'border-gray-700' : 'border-gray-100'
          }`} />
        </div>
      </main>
    </div>
  );
}

export default Calllist;