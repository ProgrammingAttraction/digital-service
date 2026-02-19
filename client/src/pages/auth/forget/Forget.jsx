import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios';
import logo from "../../../assets/logo.png";
import { Mail, Lock, Key, Eye, EyeOff, Loader2, ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';

const Forget = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('email');
  const [email, setEmail] = useState('');
  const [isEmailLoading, setIsEmailLoading] = useState(false);

  const [otp, setOtp] = useState('');
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [otpExpiryTime, setOtpExpiryTime] = useState(null);
  const [otpAttemptsRemaining, setOtpAttemptsRemaining] = useState(5);
  const [resetToken, setResetToken] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState({});
  const [resendCooldown, setResendCooldown] = useState(0);

  // Timer Effect
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const startResendCooldown = () => setResendCooldown(30);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setErrors({ email: 'সঠিক ইমেইল ঠিকানা দিন' });
      return;
    }

    setIsEmailLoading(true);
    try {
      const response = await axios.post(`${base_url}/api/auth/send-otp`, { email });
      if (response.data.success) {
        toast.success('OTP আপনার ইমেইলে পাঠানো হয়েছে');
        setActiveTab('otp');
        startResendCooldown();
      }
    } catch (error) {
      setErrors({ email: error.response?.data?.message || 'এই ইমেইলে কোনো অ্যাকাউন্ট নেই' });
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setErrors({ otp: '৬ ডিজিটের OTP দিন' });
      return;
    }

    setIsOtpLoading(true);
    try {
      const response = await axios.post(`${base_url}/api/auth/verify-otp`, { email, otp });
      if (response.data.success) {
        toast.success('OTP সফলভাবে যাচাই হয়েছে');
        setResetToken(response.data.resetToken);
        setActiveTab('password');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'OTP ভুল');
      setOtpAttemptsRemaining(error.response?.data?.attemptsRemaining || 0);
    } finally {
      setIsOtpLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setErrors({ newPassword: 'কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দিন' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrors({ confirmPassword: 'পাসওয়ার্ড মিলছে না' });
      return;
    }

    setIsPasswordLoading(true);
    try {
      const response = await axios.post(`${base_url}/api/auth/reset-password`, {
        resetToken,
        newPassword,
        confirmPassword
      });
      if (response.data.success) {
        toast.success('পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে');
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (error) {
      toast.error('লিঙ্কের সময় শেষ হয়েছে, আবার চেষ্টা করুন');
      setActiveTab('email');
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const renderStepIcon = (step, current) => {
    const steps = ['email', 'otp', 'password'];
    const stepIdx = steps.indexOf(step);
    const currentIdx = steps.indexOf(current);

    if (stepIdx < currentIdx) return <CheckCircle2 className="w-6 h-6 text-emerald-500" />;
    return (
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
        step === current ? 'bg-amber-400 border-amber-400 text-slate-900 shadow-lg shadow-amber-100' : 'bg-white border-slate-200 text-slate-400'
      }`}>
        {stepIdx + 1}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-anek flex items-center justify-center p-4">
      <Toaster />
      <div className="w-full max-w-[450px]">
        <div className="bg-white rounded-[15px] border-[1px] border-gray-200 overflow-hidden">
          <div className="p-8 sm:p-10">
            
            <div className="flex flex-col items-center text-center mb-8">
              <img src={logo} className="w-[40%] mb-6" alt="Logo" />
              <h2 className="text-2xl font-bold text-slate-800">পাসওয়ার্ড রিসেট</h2>
              <p className="text-slate-500 text-sm mt-1">আপনার অ্যাকাউন্ট সুরক্ষিত করুন</p>
            </div>

            {/* Stepper UI */}
            <div className="relative flex justify-between items-center mb-10 px-4">
              <div className="absolute top-4 left-10 right-10 h-[2px] bg-slate-100 -z-0"></div>
              {['email', 'otp', 'password'].map((step) => (
                <div key={step} className="relative z-10 flex flex-col items-center">
                  {renderStepIcon(step, activeTab)}
                  <span className={`text-[10px] uppercase tracking-tighter mt-2 font-bold ${activeTab === step ? 'text-amber-600' : 'text-slate-400'}`}>
                    {step === 'email' ? 'ইমেইল' : step === 'otp' ? 'যাচাই' : 'নতুন পাসওয়ার্ড'}
                  </span>
                </div>
              ))}
            </div>

            {/* Form Content */}
            {activeTab === 'email' && (
              <form onSubmit={handleSendOtp} className="space-y-6 animate-in fade-in duration-500">
                <div className="text-center bg-slate-50 p-4 border-[1px] border-gray-200 rounded-[10px] mb-4 text-slate-600 text-sm leading-relaxed">
                  আপনার ইমেইল ঠিকানা লিখুন। আমরা আপনাকে পাসওয়ার্ড রিসেট করার জন্য একটি OTP পাঠাব।
                </div>
                <div className="group">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                    </div>
                    <input
                      type="email"
                      className={`w-full pl-12 pr-4 py-3.5 bg-slate-50 border-[1px] ${errors.email ? 'border-red-400' : 'border-gray-200'} rounded-[10px] focus:bg-white focus:border-amber-400 outline-none transition-all`}
                      placeholder="আপনার ইমেইল লিখুন"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setErrors({}); }}
                    />
                  </div>
                  {errors.email && <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.email}</p>}
                </div>
                <button type="submit" disabled={isEmailLoading} className="w-full bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold py-4 rounded-2xl shadow-lg shadow-amber-100 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70">
                  {isEmailLoading ? <Loader2 className="animate-spin w-5 h-5" /> : 'OTP পাঠান'}
                </button>
              </form>
            )}

            {activeTab === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="space-y-6 animate-in slide-in-from-right duration-500">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-50 rounded-full mb-3">
                    <ShieldCheck className="text-amber-500" />
                  </div>
                  <p className="text-slate-600 text-sm">আপনার ইমেইলে একটি ৬ ডিজিটের কোড পাঠানো হয়েছে</p>
                </div>
                
                <div className="group">
                  <input
                    type="text"
                    maxLength="6"
                    className="w-full px-4 py-4 bg-slate-50 border-[1px] border-gray-200 rounded-2xl focus:bg-white focus:border-amber-400 outline-none transition-all text-center text-2xl font-bold tracking-[0.5em] text-slate-700"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  />
                  {otpAttemptsRemaining < 5 && (
                    <p className="text-[11px] text-amber-600 text-center mt-2 font-medium">
                      অবশিষ্ট চেষ্টা: {otpAttemptsRemaining} বার
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  <button type="submit" disabled={isOtpLoading} className="w-full bg-slate-900 text-white font-bold py-4 cursor-pointer rounded-[10px] flex items-center justify-center gap-2 hover:bg-slate-800 transition-all">
                    {isOtpLoading ? <Loader2 className="animate-spin w-5 h-5" /> : 'OTP যাচাই করুন'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setResendCooldown === 0 && handleSendOtp()} 
                    disabled={resendCooldown > 0}
                    className="text-sm font-bold text-amber-600 hover:underline disabled:text-slate-300 disabled:no-underline"
                  >
                    {resendCooldown > 0 ? `${resendCooldown} সেকেন্ড পরে কোড পাঠান` : 'আবার কোড পাঠান'}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'password' && (
              <form onSubmit={handleResetPassword} className="space-y-5 animate-in slide-in-from-right duration-500">
                <div className="bg-emerald-50 text-emerald-700 border-[1px] border-green-300 p-4 rounded-[10px] text-xs font-medium text-center mb-4">
                  অ্যাকাউন্ট যাচাই সম্পন্ন। এখন নতুন পাসওয়ার্ড সেট করুন।
                </div>

                <div className="space-y-4">
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border-[1px] border-gray-200 rounded-[10px] focus:bg-white focus:border-amber-400 outline-none transition-all"
                      placeholder="নতুন পাসওয়ার্ড"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border-[1px] border-gray-200 rounded-[10px] focus:bg-white focus:border-amber-400 outline-none transition-all"
                      placeholder="পাসওয়ার্ড নিশ্চিত করুন"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={isPasswordLoading} className="w-full bg-amber-400 hover:bg-amber-500 cursor-pointer text-slate-900 font-bold py-4 rounded-2xl shadow-lg shadow-amber-100 flex items-center justify-center gap-2">
                  {isPasswordLoading ? <Loader2 className="animate-spin w-5 h-5" /> : 'পাসওয়ার্ড পরিবর্তন করুন'}
                </button>
              </form>
            )}

            <div className="mt-8 pt-6 border-t border-slate-50 text-center">
              <Link to="/login" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-amber-600 transition-colors">
                <ArrowLeft size={16} />
                লগইন ফিরে যান
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Forget;