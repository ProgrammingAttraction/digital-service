import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios';
import logo from "../../../assets/logo.png";

const Register = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    
    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'নাম প্রয়োজন';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'নাম অবশ্যই কমপক্ষে ২ অক্ষরের হতে হবে';
    }
    
    // Email validation
    if (!formData.email) {
      newErrors.email = 'ইমেইল প্রয়োজন';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'ইমেইল ঠিকানা অবৈধ';
    }
    
    // WhatsApp number validation
    if (!formData.whatsapp) {
      newErrors.whatsapp = 'হোয়াটসঅ্যাপ নম্বর প্রয়োজন';
    } else if (!/^01[3-9]\d{8}$/.test(formData.whatsapp)) {
      newErrors.whatsapp = 'বৈধ বাংলাদেশী মোবাইল নম্বর লিখুন (01XXXXXXXXX)';
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'পাসওয়ার্ড প্রয়োজন';
    } else if (formData.password.length < 6) {
      newErrors.password = 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে';
    }
    
    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'পাসওয়ার্ড নিশ্চিত করুন';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'পাসওয়ার্ড মিলছে না';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsLoading(true);
      
      try {
        const response = await axios.post(`${base_url}/api/auth/admin-register`, {
          name: formData.name.trim(),
          email: formData.email,
          whatsapp: formData.whatsapp,
          password: formData.password
        });

        const data = response.data;

        if (data.success) {
          console.log('Registration successful:', data);
          
          toast.success('রেজিস্ট্রেশন সফল!', {
            duration: 3000,
            position: 'top-right',
          });

          // Auto login after successful registration
          try {
            const loginResponse = await axios.post(`${base_url}/api/auth/admin-login`, {
              email: formData.email,
              password: formData.password
            });

            const loginData = loginResponse.data;

            if (loginData.success) {
              localStorage.setItem('adminToken', loginData.data.token);
              localStorage.setItem('admin', JSON.stringify(loginData.data));
              
              setTimeout(() => {
                navigate('/dashboard');
              }, 1000);
            }
          } catch (loginError) {
            // If auto-login fails, redirect to login page
            setTimeout(() => {
              navigate('/login');
            }, 1000);
          }
        } else {
          toast.error(data.message || 'রেজিস্ট্রেশন ব্যর্থ', {
            duration: 4000,
            position: 'top-right',
          });
        }
      } catch (error) {
        console.error('Registration error:', error);
        
        let errorMessage = 'একটি ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন।';
        
        if (error.response) {
          if (error.response.status === 409) {
            errorMessage = 'এই ইমেইল বা হোয়াটসঅ্যাপ নম্বর ইতিমধ্যে ব্যবহৃত হয়েছে';
          } else if (error.response.data?.message) {
            errorMessage = error.response.data.message;
          }
        }
        
        toast.error(errorMessage, {
          duration: 4000,
          position: 'top-right',
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const togglePasswordVisibility = (field) => {
    if (field === 'password') {
      setShowPassword(!showPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  return (
    <div className="min-h-screen font-anek flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      <Toaster />
      <div className="max-w-md w-full bg-white rounded-[10px] border-[1px] border-gray-200 overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center">
              <img src={logo} className='w-[80%] sm:w-[90%] max-w-xs' alt="লোগো" />
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-gray-900">
              নতুন অ্যাকাউন্ট তৈরি করুন
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              নিম্নলিখিত তথ্য প্রদান করে রেজিস্ট্রেশন করুন
            </p>
          </div>
          
          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  পূর্ণ নাম
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  className={`relative block w-full px-4 py-2.5 border ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  } rounded-[5px] outline-theme_color2 transition duration-300 focus:ring-1 focus:ring-theme_color2 focus:border-theme_color2`}
                  placeholder="আপনার পূর্ণ নাম লিখুন"
                  value={formData.name}
                  onChange={handleInputChange}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>
              
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  ইমেইল ঠিকানা
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={`relative block w-full px-4 py-2.5 border ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  } rounded-[5px] outline-theme_color2 transition duration-300 focus:ring-1 focus:ring-theme_color2 focus:border-theme_color2`}
                  placeholder="আপনার ইমেইল লিখুন"
                  value={formData.email}
                  onChange={handleInputChange}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>
              
              {/* WhatsApp Field */}
              <div>
                <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700 mb-1">
                  হোয়াটসঅ্যাপ নম্বর
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-[5px] border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    +88
                  </span>
                  <input
                    id="whatsapp"
                    name="whatsapp"
                    type="tel"
                    autoComplete="tel"
                    required
                    className={`relative block w-full px-4 py-2.5 border ${
                      errors.whatsapp ? 'border-red-500' : 'border-gray-300'
                    } rounded-r-[5px] outline-theme_color2 transition duration-300 focus:ring-1 focus:ring-theme_color2 focus:border-theme_color2`}
                    placeholder="01XXXXXXXXX"
                    value={formData.whatsapp}
                    onChange={handleInputChange}
                    maxLength="11"
                  />
                </div>
                {errors.whatsapp && (
                  <p className="mt-1 text-sm text-red-600">{errors.whatsapp}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  বাংলাদেশী মোবাইল নম্বর (11 ডিজিট)
                </p>
              </div>
              
              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  পাসওয়ার্ড
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    className={`relative block w-full px-4 py-2.5 border ${
                      errors.password ? 'border-red-500' : 'border-gray-300'
                    } rounded-[5px] outline-theme_color2 transition duration-300 focus:ring-1 focus:ring-theme_color2 focus:border-theme_color2 pr-10`}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 cursor-pointer flex items-center"
                    onClick={() => togglePasswordVisibility('password')}
                    title={showPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখান'}
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  কমপক্ষে ৬ অক্ষরের হতে হবে
                </p>
              </div>
              
              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  পাসওয়ার্ড নিশ্চিত করুন
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    className={`relative block w-full px-4 py-2.5 border ${
                      errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                    } rounded-[5px] outline-theme_color2 transition duration-300 focus:ring-1 focus:ring-theme_color2 focus:border-theme_color2 pr-10`}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 cursor-pointer flex items-center"
                    onClick={() => togglePasswordVisibility('confirmPassword')}
                    title={showConfirmPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখান'}
                  >
                    {showConfirmPassword ? (
                      <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`group relative w-full flex justify-center py-3 px-4 border border-transparent rounded-[5px] cursor-pointer text-sm font-medium text-white bg-theme_color2 transition duration-300 hover:bg-opacity-90 ${
                  isLoading ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    রেজিস্ট্রেশন করা হচ্ছে...
                  </span>
                ) : (
                  <span>রেজিস্টার করুন</span>
                )}
              </button>
            </div>
          </form>
          
          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ইতিমধ্যে একটি অ্যাকাউন্ট আছে?{' '}
              <Link 
                to="/login" 
                className="font-medium text-theme_color2 hover:text-opacity-80 transition duration-300"
              >
                লগইন করুন
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;