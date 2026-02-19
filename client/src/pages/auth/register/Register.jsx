import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import logo from "../../../assets/logo.png";
import toast, { Toaster } from "react-hot-toast";
import { Eye, EyeOff, Loader2, Mail, Lock, User, Phone, UserPlus, ArrowRight, AlertCircle } from 'lucide-react';

const Register = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    whatsappnumber: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // New state for registration status
  const [registrationAllowed, setRegistrationAllowed] = useState(true);
  const [registrationMessage, setRegistrationMessage] = useState('');
  const [checkingStatus, setCheckingStatus] = useState(true);
  
  const navigate = useNavigate();

  // Check registration status on component mount
  useEffect(() => {
    const checkRegistrationStatus = async () => {
      try {
        const response = await axios.get(`${base_url}/api/user/registration-status`);
        if (response.data.success) {
          setRegistrationAllowed(response.data.isActive);
          setRegistrationMessage(response.data.message);
        }
      } catch (error) {
        console.error('Failed to check registration status:', error);
        // Default to allowing registration if we can't check status
        setRegistrationAllowed(true);
      } finally {
        setCheckingStatus(false);
      }
    };

    checkRegistrationStatus();
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullname.trim()) newErrors.fullname = 'নাম প্রয়োজন';
    if (!formData.email) newErrors.email = 'ইমেইল প্রয়োজন';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'ইমেইল ঠিকানা অবৈধ';
    
    if (!formData.whatsappnumber) newErrors.whatsappnumber = 'হোয়াটসঅ্যাপ নম্বর প্রয়োজন';
    else if (!/^01[3-9]\d{8}$/.test(formData.whatsappnumber)) newErrors.whatsappnumber = 'বৈধ নম্বর লিখুন (01XXXXXXXXX)';
    
    if (!formData.password) newErrors.password = 'পাসওয়ার্ড প্রয়োজন';
    else if (formData.password.length < 6) newErrors.password = 'কমপক্ষে ৬ অক্ষরের হতে হবে';
    
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'পাসওয়ার্ড মিলছে না';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Double-check registration status before submitting
    if (!registrationAllowed) {
      toast.error(registrationMessage || 'Registration is currently closed');
      return;
    }
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await axios.post(`${base_url}/api/auth/register`, {
        fullname: formData.fullname,
        email: formData.email,
        whatsappnumber: formData.whatsappnumber,
        password: formData.password
      });
      
      if (response.data.success) {
        toast.success("সফলভাবে নিবন্ধন করা হয়েছে");
        setTimeout(() => navigate('/login'), 1800);
      }
    } catch (error) {
      const msg = error.response?.data?.message || "নিবন্ধনে সমস্যা হয়েছে";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking registration status
  if (checkingStatus) {
    return (
      <div className="min-h-screen bg-slate-50 font-anek flex items-center justify-center p-4 py-12">
        <Toaster position="top-center" />
        <div className="w-full max-w-[600px]">
          <div className="bg-white rounded-[15px] border border-gray-200 overflow-hidden p-12">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="animate-spin h-12 w-12 text-amber-500 mb-4" />
              <p className="text-slate-600">Checking registration status...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show closed registration message if registration is not allowed
  if (!registrationAllowed) {
    return (
      <div className="min-h-screen bg-slate-50 font-anek flex items-center justify-center p-4 py-12">
        <Toaster position="top-center" />
        
        <div className="w-full max-w-[600px]">
          <div className="bg-white rounded-[15px] border border-gray-200 overflow-hidden">
            <div className="p-8">
              {/* Logo */}
              <div className="flex flex-col items-center mb-8">
                <img src={logo} className="w-[40%] mb-2" alt="Logo" />
              </div>

              {/* Closed Registration Message */}
              <div className="text-center">
                <div className="bg-red-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-10 h-10 text-red-500" />
                </div>
                
                <h1 className="text-2xl font-bold text-red-600 mb-3">
                  রেজিস্ট্রেশন বন্ধ আছে
                </h1>
                
                <p className="text-slate-600 mb-8">
                  নতুন নিবন্ধন সাময়িকভাবে বন্ধ রয়েছে। পরে আবার চেষ্টা করুন।
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                <p className="text-slate-500 text-sm">
                  ইতিমধ্যে অ্যাকাউন্ট আছে?{' '}
                  <Link to="/login" className="text-amber-600 font-bold hover:underline ml-1">
                    লগইন করুন
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Normal registration form (your original code, unchanged)
  return (
    <div className="min-h-screen bg-slate-50 font-anek flex items-center justify-center p-4 py-12">
      <Toaster position="top-center" />
      
      <div className="w-full max-w-[600px]">
        <div className="bg-white rounded-[15px] border border-gray-200 overflow-hidden">
          
          <div className="p-6">
            {/* Logo inside the box */}
            <div className="flex flex-col items-center mb-8">
              <img src={logo} className="w-[40%] mb-2" alt="Logo" />
              <h1 className="text-2xl font-bold text-slate-800">নতুন অ্যাকাউন্ট</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Full Name */}
              <div className="group">
                <label className="text-sm uppercase tracking-widest font-bold text-gray-600 ml-1 mb-1.5 block">পূর্ণ নাম</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                  </div>
                  <input
                    name="fullname"
                    type="text"
                    value={formData.fullname}
                    onChange={handleInputChange}
                    className={`w-full pl-12 pr-4 py-3 bg-slate-50 border-[1px] ${errors.fullname ? 'border-red-400' : 'border-gray-200'} rounded-[10px] focus:bg-white focus:border-amber-400 outline-none transition-all placeholder:text-slate-300`}
                    placeholder="আপনার নাম"
                  />
                </div>
                {errors.fullname && <p className="text-[11px] text-red-500 mt-1 ml-1">{errors.fullname}</p>}
              </div>

              {/* Email & WhatsApp Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="group">
                  <label className="text-sm uppercase tracking-widest font-bold text-gray-600 ml-1 mb-1.5 block">ইমেইল</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-slate-400 group-focus-within:text-amber-500" />
                    </div>
                    <input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border-[1px] border-gray-200 rounded-[10px] focus:bg-white focus:border-amber-400 outline-none transition-all"
                      placeholder="ইমেইল"
                    />
                  </div>
                  {errors.email && <p className="text-[11px] text-red-500 mt-1 ml-1">{errors.email}</p>}
                </div>

                <div className="group">
                  <label className="text-sm uppercase tracking-widest font-bold text-slate-400 ml-1 mb-1.5 block">হোয়াটসঅ্যাপ</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Phone className="h-4 w-4 text-slate-400 group-focus-within:text-amber-500" />
                    </div>
                    <input
                      name="whatsappnumber"
                      type="tel"
                      value={formData.whatsappnumber}
                      onChange={handleInputChange}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border-[1px] border-gray-200 rounded-[10px] focus:bg-white focus:border-amber-400 outline-none transition-all"
                      placeholder="হোয়াটসঅ্যাপ"
                    />
                  </div>
                  {errors.whatsappnumber && <p className="text-[11px] text-red-500 mt-1 ml-1">{errors.whatsappnumber}</p>}
                </div>
              </div>

              {/* Password */}
              <div className="group">
                <label className="text-sm uppercase tracking-widest font-bold text-slate-400 ml-1 mb-1.5 block">পাসওয়ার্ড</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                  </div>
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-12 py-3 bg-slate-50 border-[1px] border-gray-200 rounded-[10px] focus:bg-white focus:border-amber-400 outline-none transition-all"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-4 text-slate-400 hover:text-amber-600">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className="text-[11px] text-red-500 mt-1 ml-1">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div className="group">
                <label className="text-sm uppercase tracking-widest font-bold text-slate-400 ml-1 mb-1.5 block">পাসওয়ার্ড নিশ্চিত করুন</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                  </div>
                  <input
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-12 py-3 bg-slate-50 border-[1px] border-gray-200 rounded-[10px] focus:bg-white focus:border-amber-400 outline-none transition-all"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-4 text-slate-400 hover:text-amber-600">
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-[11px] text-red-500 mt-1 ml-1">{errors.confirmPassword}</p>}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold py-4 rounded-[10px] cursor-pointer shadow-amber-100 flex items-center justify-center gap-3 transition-all active:scale-[0.97] disabled:opacity-70 mt-4"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  <>
                    <span>রেজিস্ট্রেশন করুন</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-50 text-center">
              <p className="text-slate-500 text-sm font-medium">
                ইতিমধ্যে অ্যাকাউন্ট আছে?{' '}
                <Link to="/login" className="text-amber-600 font-bold hover:underline ml-1">
                  লগইন করুন
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;