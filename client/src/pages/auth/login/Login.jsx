import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios';
import { Eye, EyeOff, Loader2, Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import logo from "../../../assets/logo.png";

const Login = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const remembered = localStorage.getItem('rememberMe');
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (remembered === 'true' && rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!email) newErrors.email = 'ইমেইল প্রয়োজন';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'ইমেইল ঠিকানা সঠিক নয়';
    if (!password) newErrors.password = 'পাসওয়ার্ড প্রয়োজন';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await axios.post(`${base_url}/api/auth/login`, { email, password });

      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email);
          localStorage.setItem('rememberMe', 'true');
        } else {
          localStorage.removeItem('rememberedEmail');
          localStorage.removeItem('rememberMe');
        }
        
        toast.success('সফলভাবে লগইন হয়েছে!');
        setTimeout(() => navigate('/dashboard'), 1000);
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'লগইন ব্যর্থ হয়েছে';
      setErrors({ general: msg });
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-anek flex items-center justify-center p-4">
      <Toaster position="top-center" />
      
      <div className="w-full max-w-[450px]">
        {/* Unified Card */}
        <div className="bg-white rounded-[2rem]  border border-gray-200 overflow-hidden">
          
          <div className="p-6">
            {/* Logo inside the box */}
            <div className="flex flex-col items-center mb-10">
              <img src={logo} className=" w-[60%] mb-1" alt="Logo" />
              <p className="text-slate-500 text-sm mt-2 font-medium">আপনার ড্যাশবোর্ড অ্যাক্সেস করতে তথ্য দিন</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div className="group">
                <label className="text-xs uppercase tracking-widest font-bold text-slate-600 ml-1 mb-2 block">
                  ইমেইল এড্রেস
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full pl-12 pr-4 py-3.5 bg-slate-50 border-[1px] border-gray-200 ${errors.email ? 'border-red-400' : 'border-gray-200'} rounded-[10px] focus:bg-white focus:border-amber-400 outline-none transition-all duration-300 placeholder:text-slate-300`}
                    placeholder="ইমেইল"
                  />
                </div>
                {errors.email && <p className="text-[11px] text-red-500 mt-1.5 ml-1 font-semibold">{errors.email}</p>}
              </div>

              {/* Password Field */}
              <div className="group">
                <label className="text-xs uppercase tracking-widest font-bold text-slate-600 ml-1 mb-2 block">
                  পাসওয়ার্ড
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full pl-12 pr-12 py-3.5 bg-slate-50 border-[1px] border-gray-200 ${errors.password ? 'border-red-400' : 'border-gray-200'} rounded-[10px] focus:bg-white focus:border-amber-400 outline-none transition-all duration-300`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-amber-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && <p className="text-[11px] text-red-500 mt-1.5 ml-1 font-semibold">{errors.password}</p>}
              </div>

              {/* Extras */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500 cursor-pointer"
                  />
                  <span className="ml-2 text-slate-600 font-medium group-hover:text-amber-600 transition-colors">মনে রাখুন</span>
                </label>
                <Link to="/forget-password" size="sm" className="font-bold text-amber-600 hover:text-amber-700 transition-colors">
                  পাসওয়ার্ড ভুলে গেছেন?
                </Link>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold py-4 rounded-[10px] cursor-pointer shadow-amber-100 flex items-center justify-center gap-3 transition-all active:scale-[0.97] disabled:opacity-70 disabled:grayscale"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  <>
                    <span>সাইন ইন করুন</span>
                  </>
                )}
              </button>
            </form>

            {/* Registration Prompt */}
            <div className="mt-10 pt-8 border-t border-slate-50 text-center">
              <p className="text-slate-500 text-sm font-medium">
                নতুন ব্যবহারকারী?{' '}
                <Link to="/registration" className="text-amber-600 font-bold hover:underline ml-1">
                  একটি অ্যাকাউন্ট তৈরি করুন
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;