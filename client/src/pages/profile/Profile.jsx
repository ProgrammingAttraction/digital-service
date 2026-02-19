import React, { useState, useEffect } from 'react';
import { 
  User, 
  CreditCard, 
  ShoppingCart, 
  Calendar, 
  Save, 
  Lock,
  CheckCircle,
  Mail,
  Phone,
  Edit2,
  Shield,
  RefreshCw,
  X
} from 'lucide-react';
import Header from '../../components/header/Header';
import Sidebar from '../../components/sidebar/Sidebar';
import axios from "axios";
import { toast, Toaster } from 'react-hot-toast';
import { BiSolidPhoneCall } from "react-icons/bi";
import { useUser } from '../../context/UserContext';
import ApertureLoader from '../../components/loader/ApertureLoader';
import { useTheme } from '../../context/ThemeContext';
import man_img from "../../assets/man.png"
function Profile() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const { isDarkMode } = useTheme();
  
  // Use User Context
  const { 
    userData, 
    loading: contextLoading, 
    refreshUserData, 
    updateUserData
  } = useUser();
  
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [emailOTP, setEmailOTP] = useState('');
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [showVerifyEmail, setShowVerifyEmail] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user?.id;

  // Form states
  const [profileForm, setProfileForm] = useState({
    fullname: '',
    whatsappnumber: ''
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Initialize form with user data
  useEffect(() => {
    if (userData) {
      setProfileForm({
        fullname: userData.fullname || '',
        whatsappnumber: userData.whatsappnumber || ''
      });
    }
  }, [userData]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Update profile
  const updateProfile = async () => {
    if (!profileForm.fullname.trim()) {
      toast.error('Full name is required');
      return;
    }

    try {
      const response = await axios.post(`${base_url}/api/user/update-profile`, 
        { ...profileForm, userId },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        toast.success('Profile updated successfully');
        
        // Update context with new data
        updateUserData(response.data.data);
        
        // Refresh user data
        await refreshUserData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  // Update password
  const updatePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('All fields are required');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      const response = await axios.post(`${base_url}/api/user/update-password`, 
        { ...passwordForm, userId },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        toast.success('Password updated successfully');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update password');
    }
  };

  // Email verification functions
  const sendVerificationEmail = async () => {
    try {
      setVerificationLoading(true);
      const response = await axios.post(`${base_url}/api/user/send-email-verification`, 
        { userId },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        toast.success('Verification code sent to your email');
        setResendCooldown(60);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send verification email');
    } finally {
      setVerificationLoading(false);
    }
  };

  const verifyEmailOTP = async () => {
    if (!emailOTP) {
      toast.error('Please enter the verification code');
      return;
    }

    try {
      setVerificationLoading(true);
      const response = await axios.post(`${base_url}/api/user/verify-email-otp`, 
        { otp: emailOTP, userId },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        toast.success('Email verified successfully!');
        setShowVerifyEmail(false);
        setEmailOTP('');
        
        // Update context and refresh data
        updateUserData({ emailverified: true });
        await refreshUserData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to verify email');
    } finally {
      setVerificationLoading(false);
    }
  };

  const resendVerificationEmail = async () => {
    if (resendCooldown > 0) {
      toast.error(`Please wait ${resendCooldown} seconds before resending`);
      return;
    }

    try {
      setVerificationLoading(true);
      const response = await axios.post(`${base_url}/api/user/resend-email-verification`, 
        { email: userData?.email },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        toast.success('New verification code sent to your email');
        setResendCooldown(60);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend verification email');
    } finally {
      setVerificationLoading(false);
    }
  };

  // Tabs content with dark mode support
  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Personal Information */}
            <div className="space-y-6">
              {/* Personal Information */}
              <div className={`rounded-lg border p-6 transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-gray-800/50 border-gray-700' 
                  : 'bg-white border-gray-200'
              }`}>
                <h3 className={`text-lg font-bold mb-6 flex items-center gap-2 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-100' : 'text-gray-800'
                }`}>
                  <User className="text-theme_color" size={20} />
                  Personal Information
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className={`block text-xs font-bold mb-2 transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={profileForm.fullname}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, fullname: e.target.value }))}
                      className={`w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#1abc9c] focus:ring-2 focus:ring-[#1abc9c]/20 transition-colors ${
                        isDarkMode
                          ? 'bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-500'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-bold mb-2 transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      Email Address
                    </label>
                    <div className={`flex items-center gap-2 border rounded-lg px-4 py-3 transition-colors ${
                      isDarkMode
                        ? 'bg-gray-800 border-gray-600'
                        : 'bg-gray-50 border-gray-300'
                    }`}>
                      <Mail className={isDarkMode ? 'text-gray-400' : 'text-gray-400'} size={16} />
                      <span className={`text-sm transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {userData?.email}
                      </span>
                      {userData?.emailverified ? (
                        <span className={`ml-auto text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 ${
                          isDarkMode 
                            ? 'bg-green-900/40 text-green-300 border border-green-700/50' 
                            : 'bg-green-100 text-green-600'
                        }`}>
                          <CheckCircle size={12} />
                          Verified
                        </span>
                      ) : (
                        <button
                          onClick={() => setShowVerifyEmail(true)}
                          className={`ml-auto text-xs font-bold px-2 py-1 rounded-full transition-colors ${
                            isDarkMode
                              ? 'bg-yellow-900/40 text-yellow-300 hover:bg-yellow-900/60 border border-yellow-700/50'
                              : 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                          }`}
                        >
                          Verify Now
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs font-bold mb-2 transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      WhatsApp Number <span className="text-red-500">*</span>
                    </label>
                    
                    <div className={`flex items-center gap-2 border rounded-lg px-4 py-3 transition-colors ${
                      isDarkMode
                        ? 'bg-gray-800 border-gray-600'
                        : 'bg-gray-50 border-gray-300'
                    }`}>
                      <BiSolidPhoneCall className={isDarkMode ? 'text-gray-400' : 'text-gray-400'} size={16} />
                      <input
                        type="text"
                        value={profileForm.whatsappnumber}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, whatsappnumber: e.target.value }))}
                        className={`flex-1 text-sm outline-none transition-colors duration-300 ${
                          isDarkMode 
                            ? 'bg-transparent text-gray-100' 
                            : 'bg-transparent text-gray-900'
                        }`}
                        placeholder="Enter WhatsApp number"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <button
                    onClick={updateProfile}
                    className="px-6 py-3 bg-theme_color text-white font-bold rounded-lg hover:bg-theme_color transition-colors flex items-center gap-2 w-full justify-center"
                  >
                    <Save size={16} />
                    Update Profile
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column - Change Password */}
            <div className="space-y-6">
              <div className={`rounded-lg border p-6 transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-gray-800/50 border-gray-700' 
                  : 'bg-white border-gray-200'
              }`}>
                <h3 className={`text-lg font-bold mb-6 flex items-center gap-2 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-100' : 'text-gray-800'
                }`}>
                  <Lock className="text-theme_color" size={20} />
                  Change Password
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className={`block text-xs font-bold mb-2 transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className={`w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-theme_color focus:ring-2 focus:ring-[#1abc9c]/20 transition-colors ${
                        isDarkMode
                          ? 'bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-500'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                      placeholder="Enter current password"
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-bold mb-2 transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      className={`w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-theme_color focus:ring-2 focus:ring-[#1abc9c]/20 transition-colors ${
                        isDarkMode
                          ? 'bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-500'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                      placeholder="Enter new password"
                    />
                    <p className={`text-xs mt-1 transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-500'
                    }`}>
                      Must be at least 6 characters
                    </p>
                  </div>

                  <div>
                    <label className={`block text-xs font-bold mb-2 transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className={`w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-theme_color focus:ring-2 focus:ring-[#1abc9c]/20 transition-colors ${
                        isDarkMode
                          ? 'bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-500'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                      placeholder="Confirm new password"
                    />
                  </div>

                  <button
                    onClick={updatePassword}
                    className="px-6 py-3 bg-theme_color text-white font-bold rounded-lg hover:bg-theme_color transition-colors flex items-center gap-2 w-full justify-center mt-6"
                  >
                    Update Password
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            {/* Email Verification */}
            <div className={`rounded-lg border p-6 transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-gray-800/50 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <h3 className={`text-lg font-bold mb-6 flex items-center gap-2 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-100' : 'text-gray-800'
              }`}>
                <Shield className="text-[#1abc9c]" size={20} />
                Email Verification
              </h3>

              <div className="space-y-4">
                <div className={`flex items-center justify-between p-4 rounded-lg transition-colors duration-300 ${
                  isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
                }`}>
                  <div>
                    <h4 className={`font-bold transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-800'
                    }`}>
                      Email Address
                    </h4>
                    <p className={`text-sm transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {userData?.email}
                    </p>
                  </div>
                  <div>
                    {userData?.emailverified ? (
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 ${
                        isDarkMode 
                          ? 'bg-green-900/40 text-green-300 border border-green-700/50' 
                          : 'bg-green-100 text-green-600'
                      }`}>
                        <CheckCircle size={14} />
                        Verified
                      </span>
                    ) : (
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                        isDarkMode 
                          ? 'bg-yellow-900/40 text-yellow-300 border border-yellow-700/50' 
                          : 'bg-yellow-100 text-yellow-600'
                      }`}>
                        Not Verified
                      </span>
                    )}
                  </div>
                </div>

                {!userData?.emailverified && (
                  <div className={`p-4 rounded-lg border transition-colors duration-300 ${
                    isDarkMode 
                      ? 'bg-yellow-900/10 border-yellow-800/50' 
                      : 'bg-yellow-50 border-yellow-200'
                  }`}>
                    <h4 className={`font-bold mb-2 transition-colors duration-300 ${
                      isDarkMode ? 'text-yellow-300' : 'text-yellow-800'
                    }`}>
                      Verify Your Email
                    </h4>
                    <p className={`text-sm mb-4 transition-colors duration-300 ${
                      isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                    }`}>
                      Please verify your email address to access all features and secure your account.
                    </p>
                    
                    <button
                      onClick={() => setShowVerifyEmail(true)}
                      className="px-4 py-2 bg-yellow-600 text-white text-sm font-bold rounded-lg hover:bg-yellow-700 transition-colors flex items-center gap-2"
                    >
                      Verify Email Now
                    </button>
                  </div>
                )}
         
              </div>
            </div>
          </div>
        );

      case 'stats':
        return (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`rounded-lg border p-6 flex flex-col items-center justify-center transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-gray-800/50 border-gray-700' 
                  : 'bg-white border-gray-200'
              }`}>
                <CreditCard className="text-[#1abc9c] mb-4" size={32} />
                <div className={`text-3xl font-bold mb-2 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-100' : 'text-gray-800'
                }`}>
                  {userData?.totaldeposit || 0}
                </div>
                <div className={`text-sm uppercase tracking-wider transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-400'
                }`}>
                  Total Deposit
                </div>
              </div>

              <div className={`rounded-lg border p-6 flex flex-col items-center justify-center transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-gray-800/50 border-gray-700' 
                  : 'bg-white border-gray-200'
              }`}>
                <ShoppingCart className="text-[#1abc9c] mb-4" size={32} />
                <div className={`text-3xl font-bold mb-2 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-100' : 'text-gray-800'
                }`}>
                  {userData?.balance || 0}
                </div>
                <div className={`text-sm uppercase tracking-wider transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-400'
                }`}>
                  Current Balance
                </div>
              </div>

              <div className={`rounded-lg border p-6 flex flex-col items-center justify-center transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-gray-800/50 border-gray-700' 
                  : 'bg-white border-gray-200'
              }`}>
                <Calendar className="text-[#2ecc71] mb-4" size={32} />
                <div className={`text-3xl font-bold mb-2 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-100' : 'text-gray-800'
                }`}>
                  {userData?.createdAt ? new Date(userData.createdAt).getDate() : '...'}
                </div>
                <div className={`text-sm uppercase tracking-wider transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-400'
                }`}>
                  Member Since Day
                </div>
              </div>
            </div>

            {/* Profile Completion */}
            <div className={`rounded-lg border p-6 transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-gray-800/50 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className={`text-lg font-bold transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-100' : 'text-gray-800'
                }`}>
                  Profile Completion
                </h3>
                <span className="text-sm text-[#1abc9c] font-bold">75% Complete</span>
              </div>
              
              <div className={`w-full rounded-full h-2 mb-6 transition-colors duration-300 ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <div className="bg-[#1abc9c] h-2 rounded-full w-[75%]"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className={`${
                    userData?.emailverified 
                      ? isDarkMode ? 'text-green-400' : 'text-green-500' 
                      : isDarkMode ? 'text-gray-500' : 'text-gray-300'
                  }`} size={16} />
                  <span className={`text-sm ${
                    userData?.emailverified 
                      ? isDarkMode ? 'text-green-300' : 'text-green-600' 
                      : isDarkMode ? 'text-gray-500' : 'text-gray-500'
                  }`}>
                    Email Verified
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <CheckCircle className={isDarkMode ? 'text-green-400' : 'text-green-500'} size={16} />
                  <span className={`text-sm ${
                    isDarkMode ? 'text-green-300' : 'text-green-600'
                  }`}>
                    Account Created
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <CheckCircle className={`${
                    userData?.whatsappnumber 
                      ? isDarkMode ? 'text-green-400' : 'text-green-500' 
                      : isDarkMode ? 'text-gray-500' : 'text-gray-300'
                  }`} size={16} />
                  <span className={`text-sm ${
                    userData?.whatsappnumber 
                      ? isDarkMode ? 'text-green-300' : 'text-green-600' 
                      : isDarkMode ? 'text-gray-500' : 'text-gray-500'
                  }`}>
                    Phone Number Added
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <CheckCircle className={`${
                    (userData?.totaldeposit || 0) > 0 
                      ? isDarkMode ? 'text-green-400' : 'text-green-500' 
                      : isDarkMode ? 'text-gray-500' : 'text-gray-300'
                  }`} size={16} />
                  <span className={`text-sm ${
                    (userData?.totaldeposit || 0) > 0 
                      ? isDarkMode ? 'text-green-300' : 'text-green-600' 
                      : isDarkMode ? 'text-red-400' : 'text-red-500'
                  }`}>
                    {(userData?.totaldeposit || 0) > 0 ? 'Deposit Made' : 'No Deposit Yet'}
                  </span>
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div className={`rounded-lg border p-6 transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-gray-800/50 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <h3 className={`text-lg font-bold mb-4 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-100' : 'text-gray-800'
              }`}>
                Account Information
              </h3>
              
              <div className="space-y-3">
                <div className={`flex justify-between items-center py-2 border-b transition-colors duration-300 ${
                  isDarkMode ? 'border-gray-700' : 'border-gray-100'
                }`}>
                  <span className={`text-sm transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Member Since
                  </span>
                  <span className={`text-sm font-bold transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    }) : 'N/A'}
                  </span>
                </div>
                
                <div className={`flex justify-between items-center py-2 border-b transition-colors duration-300 ${
                  isDarkMode ? 'border-gray-700' : 'border-gray-100'
                }`}>
                  <span className={`text-sm transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Last Updated
                  </span>
                  <span className={`text-sm font-bold transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    {userData?.updatedAt ? new Date(userData.updatedAt).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    }) : 'N/A'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-2">
                  <span className={`text-sm transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Account Status
                  </span>
                  <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                    userData?.status === 'active' 
                      ? isDarkMode ? 'bg-green-900/40 text-green-300 border border-green-700/50' : 'bg-green-100 text-green-600' :
                    userData?.status === 'pending' 
                      ? isDarkMode ? 'bg-yellow-900/40 text-yellow-300 border border-yellow-700/50' : 'bg-yellow-100 text-yellow-600' :
                      isDarkMode ? 'bg-red-900/40 text-red-300 border border-red-700/50' : 'bg-red-100 text-red-600'
                  }`}>
                    {userData?.status?.charAt(0).toUpperCase() + userData?.status?.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Use context loading state
  if (contextLoading) {
    return (
      <div className={`font-anek lg:ml-72 mt-[9vh] transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-gray-900 text-gray-100' 
          : 'text-gray-700'
      }`}>
        <Header toggleSidebar={toggleSidebar} />
        <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />
        <main className={`min-h-[91vh] flex items-center justify-center transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-900' : 'bg-[#f4f6f9]'
        }`}>
            <ApertureLoader/>          
        </main>
      </div>
    );
  }

  return (
    <div className={`font-anek lg:ml-72 mt-[9vh] transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gray-900 text-gray-100' 
        : 'text-gray-700'
    }`}>
      <Toaster position="top-right" />
      <Header toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />

      <main className={`min-h-[91vh] p-4 md:p-6 transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-900' : 'bg-[#f4f6f9]'
      }`}>
        <div className="w-full mx-auto space-y-6">
          {/* Email Verification Modal */}
          {showVerifyEmail && (
            <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
              <div className={`rounded-xl max-w-md w-full p-6 transition-colors duration-300 ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className={`text-lg font-bold flex items-center gap-2 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-100' : 'text-gray-800'
                  }`}>
                    <Mail className="text-[#1abc9c]" size={20} />
                    Verify Your Email
                  </h3>
                  <button
                    onClick={() => setShowVerifyEmail(false)}
                    className={`transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <p className={`text-sm mb-6 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  We've sent a 6-digit verification code to <strong className={isDarkMode ? 'text-gray-300' : 'text-gray-800'}>{userData?.email}</strong>. 
                  Please enter the code below:
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className={`block text-xs font-bold mb-2 transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      Verification Code
                    </label>
                    <input
                      type="text"
                      value={emailOTP}
                      onChange={(e) => setEmailOTP(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className={`w-full border rounded-lg px-4 py-3 text-center text-xl font-bold tracking-widest focus:outline-none focus:border-[#1abc9c] focus:ring-2 focus:ring-[#1abc9c]/20 transition-colors ${
                        isDarkMode
                          ? 'bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-500'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                      placeholder="000000"
                      maxLength={6}
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={verifyEmailOTP}
                      disabled={verificationLoading || emailOTP.length !== 6}
                      className="flex-1 px-4 py-3 bg-[#1abc9c] text-white font-bold rounded-lg hover:bg-[#16a085] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {verificationLoading ? 'Verifying...' : 'Verify Code'}
                    </button>
                    
                    <button
                      onClick={resendCooldown > 0 ? undefined : sendVerificationEmail}
                      disabled={verificationLoading || resendCooldown > 0}
                      className={`px-4 py-3 font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                        isDarkMode
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {resendCooldown > 0 ? (
                        <>
                          <RefreshCw size={16} className="animate-spin" />
                          {resendCooldown}s
                        </>
                      ) : (
                        <>
                          <RefreshCw size={16} />
                          Resend
                        </>
                      )}
                    </button>
                  </div>
                  
                  {resendCooldown === 0 && (
                    <p className={`text-xs text-center transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-500'
                    }`}>
                      Didn't receive the code? Check your spam folder or try resending.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Profile Header */}
          <div className={`rounded-xl border p-6 md:p-8 transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-gray-800/50 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="relative">
                <div className={`w-32 h-32 rounded-full overflow-hidden border-4 flex items-center justify-center ${
                  isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-100'
                }`}>
                  <img src={man_img} alt="" />
                </div>
                {!userData?.emailverified && (
                  <div className="absolute -top-2 -right-2 w-[30px] flex justify-center items-center h-[30px] bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                    !
                  </div>
                )}
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <h1 className={`text-2xl font-bold mb-2 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-100' : 'text-gray-800'
                }`}>
                  {userData?.fullname}
                </h1>
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-4">
                  <p className={`text-sm flex items-center gap-2 justify-center md:justify-start transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    <Mail size={14} />
                    {userData?.email}
                    {userData?.emailverified ? (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        isDarkMode 
                          ? 'bg-green-900/40 text-green-300 border border-green-700/50' 
                          : 'bg-green-100 text-green-600 border-[1px] border-green-500'
                      }`}>
                        <CheckCircle size={10} />
                        Verified
                      </span>
                    ) : (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        isDarkMode 
                          ? 'bg-yellow-900/40 text-yellow-300 border border-yellow-700/50' 
                          : 'bg-yellow-100 text-yellow-600 border-[1px] border-yellow-500'
                      }`}>
                        Not Verified
                      </span>
                    )}
                  </p>
                  <p className={`text-sm flex items-center gap-2 justify-center md:justify-start transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    <BiSolidPhoneCall size={14} />
                    {userData?.whatsappnumber}
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                    userData?.status === 'active' 
                      ? isDarkMode 
                        ? 'bg-green-900/40 text-green-300 border border-green-700/50' 
                        : 'bg-green-100 text-green-600 border-[1px] border-green-600' :
                    userData?.status === 'pending' 
                      ? isDarkMode 
                        ? 'bg-yellow-900/40 text-yellow-300 border border-yellow-700/50' 
                        : 'bg-yellow-100 text-yellow-600 border-[1px] border-yellow-600' :
                      isDarkMode 
                        ? 'bg-red-900/40 text-red-300 border border-red-700/50' 
                        : 'bg-red-100 text-red-600 border-[1px] border-red-600'
                  }`}>
                    Status: {userData?.status?.charAt(0).toUpperCase() + userData?.status?.slice(1)}
                  </div>
                  
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                    isDarkMode 
                      ? 'bg-blue-900/40 text-blue-300 border border-blue-700/50' 
                      : 'bg-blue-100 text-blue-600 border-[1px] border-blue-600'
                  }`}>
                    Balance: ৳{userData?.balance || 0}
                  </div>
                  
                  {!userData?.emailverified && (
                    <button
                      onClick={() => setShowVerifyEmail(true)}
                      className={`px-3 py-1 rounded-full text-xs font-bold hover:transition-colors ${
                        isDarkMode 
                          ? 'bg-red-900/40 text-red-300 border border-red-700/50 hover:bg-red-900/60' 
                          : 'bg-red-100 text-red-600 border-[1px] border-red-600 hover:bg-red-200'
                      }`}
                    >
                      Verify Email Required
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className={`rounded-xl border overflow-hidden transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-gray-800/50 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex overflow-x-auto">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-6 py-4 text-sm font-bold whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'profile'
                    ? 'border-[#1abc9c] text-[#1abc9c]'
                    : isDarkMode
                      ? 'border-transparent text-gray-400 hover:text-gray-300'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <User className="inline mr-2" size={16} />
                Profile
              </button>
              
              <button
                onClick={() => setActiveTab('security')}
                className={`px-6 py-4 text-sm font-bold whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'security'
                    ? 'border-[#1abc9c] text-[#1abc9c]'
                    : isDarkMode
                      ? 'border-transparent text-gray-400 hover:text-gray-300'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Shield className="inline mr-2" size={16} />
                Security
              </button>
            </div>
            
            {/* Tab Content */}
            <div className="p-6">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Profile;