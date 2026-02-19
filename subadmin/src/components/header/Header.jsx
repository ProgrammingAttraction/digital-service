import React, { useState, useEffect, useRef } from 'react';
import { FaBars, FaCog, FaSignOutAlt, FaChevronDown, FaUser, FaEdit } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import man_img from "../../assets/man.png"
const Header = ({ toggleSidebar, onProfileUpdate }) => {
  const navigate = useNavigate();
  
  // Check localStorage for dark mode on initial load
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return savedTheme === 'dark' || (!savedTheme && prefersDark);
  });

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    email: ''
  });
  
  const profileMenuRef = useRef(null);
  const hoverTimeoutRef = useRef(null);

  // Get admin data from localStorage on component mount
  useEffect(() => {
    const storedAdmin = localStorage.getItem('admin');
    if (storedAdmin) {
      try {
        const parsedAdmin = JSON.parse(storedAdmin);
        setAdminData(parsedAdmin);
        
        // Set initial edit form values
        setEditForm({
          username: parsedAdmin.username || '',
          email: parsedAdmin.email || ''
        });
      } catch (error) {
        console.error('Error parsing admin data:', error);
      }
    }
    setLoading(false);
  }, []);

  // Fetch updated admin profile data
  const fetchAdminProfile = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      const response = await axios.get('/api/admin/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        const updatedAdmin = {
          ...adminData,
          ...response.data.data
        };
        
        setAdminData(updatedAdmin);
        localStorage.setItem('admin', JSON.stringify(updatedAdmin));
        
        // Notify parent component if needed
        if (onProfileUpdate) {
          onProfileUpdate(updatedAdmin);
        }

        // Update edit form
        setEditForm({
          username: response.data.data.username || '',
          email: response.data.data.email || ''
        });
      }
    } catch (error) {
      console.error('Error fetching admin profile:', error);
      if (error.response?.status === 401) {
        // Token expired or invalid
        handleLogout();
        toast.error('Session expired. Please login again.');
      }
    }
  };

  // Sync theme with document AND saves to localStorage
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Listen for system theme changes (optional)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      if (!localStorage.getItem('theme')) {
        setIsDarkMode(e.matches);
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Handle hover for profile dropdown
  const handleMouseEnter = () => {
    clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setProfileMenuOpen(true);
    }, 150);
  };

  const handleMouseLeave = () => {
    clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setProfileMenuOpen(false);
    }, 200);
  };

  // Clear timeouts on unmount
  useEffect(() => {
    return () => {
      clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  const handleLogout = () => {
    // Clear all admin-related data from localStorage
    localStorage.removeItem('adminToken');
    localStorage.removeItem('admin');
    
    // Clear any other admin-related data
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('admin_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Close profile menu
    setProfileMenuOpen(false);
    
    // Show logout success message
    toast.success('Logged out successfully');
    
    // Redirect to login page
    setTimeout(() => {
      navigate('/login');
    }, 500);
  };

  const handleSettings = () => {
    console.log('Opening settings...');
    // You can navigate to settings page or open a modal
    navigate('/admin/settings');
    setProfileMenuOpen(false);
  };

  const handleProfileClick = () => {
    navigate('/admin/profile');
    setProfileMenuOpen(false);
  };

  const handleEditProfile = () => {
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const response = await axios.put('/api/admin/profile', editForm, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        toast.success('Profile updated successfully');
        setIsEditing(false);
        fetchAdminProfile(); // Refresh admin data
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.error || 'Failed to update profile');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset form to original values
    if (adminData) {
      setEditForm({
        username: adminData.username || '',
        email: adminData.email || ''
      });
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Format balance with commas
  const formatBalance = (balance) => {
    if (!balance) return '৳ 0';
    return `৳ ${parseFloat(balance).toLocaleString('en-US')}`;
  };

  // Get admin initials for avatar fallback
  const getInitials = (name) => {
    if (!name) return 'A';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="bg-white h-[9vh] dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 py-3 md:py-4 px-4 md:px-6 flex items-center justify-between fixed top-0 right-0 left-0 lg:left-72 z-[10] transition-all duration-300">
      
      {/* Left Side: Brand Name */}
      <div className="flex items-center space-x-3 md:space-x-4">
        <button 
          onClick={toggleSidebar}
          className="lg:hidden text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:outline-none transition-colors duration-300"
          aria-label="Toggle sidebar"
        >
          <FaBars size={20} className="md:w-6 md:h-6" />
        </button>
        
        <h1 className="hidden md:block text-xl font-bold text-gray-900 dark:text-white tracking-tight">
          Admin Dashboard
        </h1>
      </div>
      
      {/* Right Side: Controls */}
      <div className="flex items-center space-x-4 md:space-x-6">
        {/* Profile Picture with Hover Dropdown */}
        <div 
          className="relative"
          ref={profileMenuRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="flex items-center space-x-2 cursor-pointer group">
            <div className="relative">
              {/* Active Status Indicator */}
              <div className="absolute -top-1 -right-1 z-20">
                <div className="relative">
                  <div className="absolute inset-0 animate-ping bg-green-500 rounded-full opacity-75" />
                  <div className="relative w-3 h-3 md:w-4 md:h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
                </div>
              </div>
              
              {/* Profile Image */}
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden border-2 border-white dark:border-gray-800 group-hover:border-blue-400 transition-all duration-300 bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
               <img 
                    src={man_img} 
                    alt={adminData?.username || 'Admin'}
                    className="w-full h-full object-cover"
                  />
              </div>
            </div>
            
            
          </div>

          {/* Profile Dropdown Menu */}
          <AnimatePresence>
            {profileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-900 rounded-lg shadow-xl py-2 border border-gray-200 dark:border-gray-800 z-50"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                {/* Profile Info */}
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white dark:border-gray-800 bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          <img 
                    src={man_img} 
                    alt={adminData?.username || 'Admin'}
                    className=""
                  />
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
                      </div>
                      <div>
                        {isEditing ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              name="username"
                              value={editForm.username}
                              onChange={handleEditChange}
                              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-700 rounded bg-transparent"
                              placeholder="Username"
                            />
                            <input
                              type="email"
                              name="email"
                              value={editForm.email}
                              onChange={handleEditChange}
                              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-700 rounded bg-transparent"
                              placeholder="Email"
                            />
                          </div>
                        ) : (
                          <>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {adminData?.username || 'Admin'}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {adminData?.email || 'admin@example.com'}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <button
                    onClick={handleProfileClick}
                    className="w-full px-4 py-3 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center space-x-3 transition-colors duration-200"
                  >
                    <FaUser className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span>View Profile</span>
                  </button>
                  
                  <button
                    onClick={handleSettings}
                    className="w-full px-4 py-3 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center space-x-3 transition-colors duration-200"
                  >
                    <FaCog className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span>Settings</span>
                  </button>
                  
                  <div className="border-t border-gray-100 dark:border-gray-800 my-1"></div>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 text-sm text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-3 transition-colors duration-200"
                  >
                    <FaSignOutAlt className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Header;