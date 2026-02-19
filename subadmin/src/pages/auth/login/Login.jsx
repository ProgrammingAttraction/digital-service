import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios';
import logo from "../../../assets/logo.png";

const Login = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    
    if (!email) {
      newErrors.email = 'ইমেইল প্রয়োজন';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'ইমেইল ঠিকানা অবৈধ';
    }
    
    if (!password) {
      newErrors.password = 'পাসওয়ার্ড প্রয়োজন';
    } else if (password.length < 6) {
      newErrors.password = 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsLoading(true);
      
      try {
        const response = await axios.post(`${base_url}/api/auth/subadmin-login`, {
          email,
          password
        });

        const data = response.data;

        if (data.success) {
          // Store token and subadmin data
          localStorage.setItem('adminToken', data.token);
          localStorage.setItem('admin', JSON.stringify(data.subadmin));
          
          toast.success('লগইন সফল!', {
            duration: 3000,
            position: 'top-right',
          });

          setTimeout(() => {
            navigate('/dashboard');
          }, 1000);
        } else {
          toast.error(data.message || 'লগইন ব্যর্থ', {
            duration: 4000,
            position: 'top-right',
          });
        }
      } catch (error) {
        // Handle different types of errors
        if (error.response) {
          // Server responded with an error
          const errorMessage = error.response.data?.message || 
            'লগইন ব্যর্থ। অনুগ্রহ করে আবার চেষ্টা করুন।';
          
          if (error.response.status === 401) {
            toast.error('ভুল ইমেইল বা পাসওয়ার্ড', {
              duration: 4000,
              position: 'top-right',
            });
          } else if (error.response.status === 403) {
            toast.error('সাবএডমিন অ্যাকাউন্ট নিষ্ক্রিয় করা হয়েছে', {
              duration: 4000,
              position: 'top-right',
            });
          } else if (error.response.status === 400) {
            toast.error('ইমেইল এবং পাসওয়ার্ড প্রয়োজন', {
              duration: 4000,
              position: 'top-right',
            });
          } else {
            toast.error(errorMessage, {
              duration: 4000,
              position: 'top-right',
            });
          }
        } else if (error.request) {
          // Request was made but no response
          toast.error('সার্ভার থেকে কোনও প্রতিক্রিয়া পাওয়া যায়নি', {
            duration: 4000,
            position: 'top-right',
          });
        } else {
          // Other errors
          toast.error('একটি ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন।', {
            duration: 4000,
            position: 'top-right',
          });
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen font-anek flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      <Toaster />
      <div className="max-w-md w-full bg-white rounded-[10px] border-[1px] border-gray-200 overflow-hidden">
        <div className="p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center ">
              <img src={logo} className='w-[90%]' alt="লোগো" />
            </div>
            <h2 className="mt-1 text-2xl font-bold text-gray-900">
              সাবএডমিন লগইন
            </h2>
          </div>
          <form className="mt-5 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
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
                  className={`relative block w-full px-4 py-2.5 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-[5px] outline-theme_color transition duration-300`}
                  placeholder="আপনার ইমেইল লিখুন"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) {
                      setErrors(prev => ({ ...prev, email: '' }));
                    }
                  }}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  পাসওয়ার্ড
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    className={`relative block w-full px-4 py-2.5 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-[5px] outline-theme_color transition duration-300 pr-10`}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) {
                        setErrors(prev => ({ ...prev, password: '' }));
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 cursor-pointer flex items-center"
                    onClick={togglePasswordVisibility}
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
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`group relative w-full flex justify-center py-3 px-4 border border-transparent rounded-[5px] cursor-pointer text-sm font-medium text-white bg-theme_color transition duration-300 ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    সাইন ইন করা হচ্ছে...
                  </span>
                ) : (
                  <span>সাবএডমিন হিসেবে সাইন ইন</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;