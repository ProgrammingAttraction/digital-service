import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Header from '../../../components/header/Header';
import Sidebar from '../../../components/sidebar/Sidebar';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../context/ThemeContext';
import agenda_img from "../../../assets/passport.png";

function Passportmake() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState('epassport');
  const [nidNumber, setNidNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [pricesLoading, setPricesLoading] = useState(true);
  const [orderSuccessData, setOrderSuccessData] = useState(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [submitError, setSubmitError] = useState('');
  
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user?.id;
  const { isDarkMode } = useTheme();
  const [noticeLoading, setNoticeLoading] = useState(true);
  const [notice, setNotice] = useState('');
  // State for dynamic prices
  const [passportPrices, setPassportPrices] = useState({
    epassport: 0,
    mrppassport: 0
  });

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  // Fetch prices from backend
  useEffect(() => {
    fetchPrices();
  }, []);
 useEffect(() => {
    fetchNotice();
  }, []);

  // Fetch notice from backend
  const fetchNotice = async () => {
    try {
      setNoticeLoading(true);
      const response = await axios.get(`${base_url}/api/user/service/notice/passport-make`);
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

  const fetchPrices = async () => {
    try {
      setPricesLoading(true);
      const response = await axios.get(`${base_url}/api/user/service/price/passport-make`);
      
      // Update passport prices based on backend response
      const updatedPrices = {
        epassport: response.data.price1 || 0,
        mrppassport: response.data.price2 || 0
      };
      
      setPassportPrices(updatedPrices);
      
    } catch (error) {
      console.error('Error fetching passport prices:', error);
      toast.error('পাসপোর্টের দাম লোড করতে সমস্যা হয়েছে, ডিফল্ট দাম ব্যবহার করা হচ্ছে', {
        duration: 3000,
        position: 'top-center',
      });
      // Keep default prices if API fails
    } finally {
      setPricesLoading(false);
    }
  };

  const handleNidChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 17) {
      setNidNumber(value);
    }
    
    if (submitError) {
      setSubmitError('');
    }
  };

  // Passport options with dynamic prices
  const passportOptions = [
    { 
      id: 'epassport', 
      label: 'ই-পাসপোর্ট (E-Passport)',
      description: 'আধুনিক ও নিরাপদ ইলেকট্রনিক পাসপোর্ট',
      price: passportPrices.epassport,
      image: agenda_img,
      features: [
        'বায়োমেট্রিক তথ্য সংরক্ষণ',
        '৫ বছর মেয়াদ',
        'দ্রুত প্রক্রিয়াকরণ',
        '১৭২ টি দেশে ভিসা-মুক্ত'
      ]
    },
    { 
      id: 'mrppassport', 
      label: 'এমআরপি পাসপোর্ট (MRP Passport)',
      description: 'মেশিন রিডেবল পাসপোর্ট',
      price: passportPrices.mrppassport,
      image: agenda_img,
      features: [
        'মেশিন দ্বারা পড়ার যোগ্য',
        '৫ বছর মেয়াদ',
        'সাধারণ প্রক্রিয়াকরণ',
        'আন্তর্জাতিক মানসম্পন্ন'
      ]
    },
  ];

  const selectedData = passportOptions.find(opt => opt.id === selectedOption);

  // Validation function
  const validateForm = () => {
    if (!nidNumber.trim()) {
      return 'এনআইডি নাম্বার আবশ্যক';
    }
    
    if (nidNumber.length !== 17) {
      return 'এনআইডি নাম্বার ১৭ ডিজিট হতে হবে';
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
        serviceId: `passport_${selectedOption}`,
        serviceName: `পাসপোর্ট - ${selectedData.label}`,
        serviceRate: selectedData.price,
        serviceType: 'passport',
        orderType: 'pdf_file',
        quantity: 1,
        notes: `এনআইডি নাম্বার: ${nidNumber}\nপাসপোর্ট টাইপ: ${selectedData.label}\nমূল্য: ${selectedData.price} টাকা`,
        fieldValues: {
          nidNumber: nidNumber,
          passportType: selectedData.label,
          passportTypeId: selectedOption,
          price: selectedData.price,
          duration: '5 years'
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
          nidNumber: nidNumber,
          passportType: selectedData.label,
          duration: '৫ বছর',
          date: new Date().toLocaleDateString('bn-BD')
        });
        
        // Show success popup
        setShowSuccessPopup(true);
        
        // Reset form
        setNidNumber('');
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
                পাসপোর্ট আবেদন সফল!
              </h3>
              
              <p className={`text-sm md:text-base mb-4 md:mb-6 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                আপনার পাসপোর্ট আবেদন সফলভাবে জমা দেওয়া হয়েছে।
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
                      #{orderSuccessData.orderId}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className={`text-xs md:text-sm transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      পাসপোর্ট টাইপ
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
                      এনআইডি নাম্বার
                    </p>
                    <p className={`font-semibold text-sm md:text-base transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-800'
                    }`}>
                      {orderSuccessData.nidNumber}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className={`text-xs md:text-sm transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      মোট মূল্য
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
                    মেয়াদ: {orderSuccessData.duration} | প্রক্রিয়াকরণ শুরু হবে ২৪ ঘন্টার মধ্যে
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
          <div className="mb-8">
            <h1 className={`text-xl md:text-2xl font-bold transition-colors duration-300 ${
              isDarkMode ? 'text-green-400' : 'text-[#00c689]'
            }`}>
              পাসপোর্ট তৈরির জন্য আবেদন
            </h1>
    
          </div>
        {/* Notice Box */}
          <div className={`border rounded-md p-2 mb-6 transition-colors duration-300 ${
            isDarkMode 
              ? 'border-green-500 bg-gray-800' 
              : 'border-green-400 bg-white'
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
          <div className="space-y-8">
            
            {/* Type Selection */}
            <div>
              <label className={`text-[15px] font-semibold mb-4 block transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                পাসপোর্টের ধরন নির্বাচন করুন *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {passportOptions.map((option) => (
                  <div 
                    key={option.id}
                    onClick={() => setSelectedOption(option.id)}
                    className={`cursor-pointer w-full rounded-xl border-2 p-4 transition-all duration-300 ${
                      selectedOption === option.id 
                      ? isDarkMode 
                        ? 'border-green-500 bg-gray-700/50 shadow-md' 
                        : 'border-[#00c689] bg-[#f0fdf9] shadow-md'
                      : isDarkMode 
                        ? 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/50' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                      <div className="flex-shrink-0">
                        <img 
                          src={option.image} 
                          alt="passport icon" 
                          className="w-20 h-20 md:w-24 md:h-24 object-contain rounded-lg"
                        />
                      </div>
                      
                      <div className="flex-grow">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                          <div>
                            <h3 className={`text-lg font-bold transition-colors duration-300 ${
                              isDarkMode ? 'text-gray-100' : 'text-gray-800'
                            }`}>
                              {option.label}
                            </h3>
                            <p className={`text-sm mt-1 transition-colors duration-300 ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              {option.description}
                            </p>
                          </div>
                          <div className="mt-2 md:mt-0">
                         <span className={`text-xl font-bold transition-colors duration-300 ${
                                isDarkMode ? 'text-green-400' : 'text-[#00c689]'
                              }`}>
                                {option.price} টাকা
                              </span>
                          </div>
                        </div>
                        
                        {selectedOption === option.id && (
                          <div className="mt-4 flex items-center">
                            <span className={`text-sm font-medium px-3 py-1 border-[1px] rounded-full transition-colors duration-300 ${
                              isDarkMode 
                                ? 'text-green-400 bg-green-900/30 border-green-500' 
                                : 'text-[#00c689] bg-[#e8f8f3] border-gray-200'
                            }`}>
                              নির্বাচিত
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className={`border-t transition-colors duration-300 ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}></div>

            {/* NID Number Input */}
            <div className={` rounded-lg transition-colors duration-300 ${
              isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'
            }`}>
              <label className={`text-[15px] font-semibold mb-3 block transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                আপনার জাতীয় পরিচয়পত্র (এনআইডি) নম্বর *
              </label>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-grow">
                  <input 
                    type="text"
                    value={nidNumber}
                    onChange={handleNidChange}
                    placeholder="১৭ ডিজিটের এনআইডি নাম্বার লিখুন"
                    className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 text-sm md:text-[15px] placeholder:text-gray-400 transition-colors duration-300 ${
                      submitError 
                        ? isDarkMode 
                          ? 'border-red-500 focus:ring-red-500' 
                          : 'border-red-400 focus:ring-red-400'
                        : isDarkMode 
                          ? 'border-gray-600 bg-gray-700 text-gray-100 focus:ring-green-500 focus:border-transparent' 
                          : 'border-gray-300 focus:ring-[#00c689] focus:border-transparent'
                    }`}
                    maxLength="17"
                  />
                  {submitError && (
                    <p className="mt-2 text-sm text-red-500">{submitError}</p>
                  )}
                  <p className={`text-sm mt-2 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-500'
                  }`}>
                    এই এনআইডি নম্বর ব্যবহার করে আপনার পাসপোর্ট আবেদন প্রক্রিয়া শুরু হবে
                  </p>
                </div>
        
              </div>
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
                  এই সেবার জন্য আপনার অ্যাকাউন্ট থেকে <span className="font-bold">
                    {pricesLoading ? '...' : selectedData?.price} টাকা
                  </span> কাটা হবে। 
                </p>
              </div>
            {/* Action Buttons */}
    <div className="mt-6">
                <button 
                   onClick={handleSubmit}
                  type="submit"
                  disabled={loading || pricesLoading}
                  className={`w-full text-white font-bold py-2.5 rounded-md transition-colors text-[15px] flex items-center justify-center ${
                    loading || pricesLoading
                      ? isDarkMode 
                        ? 'bg-green-800 opacity-70 cursor-not-allowed' 
                        : 'bg-theme_color2 opacity-70 cursor-not-allowed'
                      : isDarkMode 
                        ? 'bg-green-600 hover:bg-green-700 cursor-pointer' 
                        : 'bg-theme_color2 hover:bg-[#00b37a] cursor-pointer'
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
                  ) : (
                    `অর্ডার করুন (${pricesLoading ? '...' : selectedData?.price} TK)`
                  )}
                </button>
              </div>

          </div>
        </div>
      </main>
    </div>
  );
}

export default Passportmake;