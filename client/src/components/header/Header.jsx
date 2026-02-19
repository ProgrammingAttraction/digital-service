import React, { useState, useEffect, useRef } from 'react';
import { FaBars, FaCog, FaSignOutAlt, FaTimes, FaTelegram, FaWhatsapp, FaFacebook, FaYoutube } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

import NotificationIcon from "../../components/notification/NotificationIcon"
import man_image from "../../assets/man.png"
import { useTheme } from '../../context/ThemeContext';
import hibiscus_img from "../../assets/hibiscus.png"
const Header = ({ toggleSidebar }) => {
  // Get theme from context
  const { isDarkMode, toggleTheme } = useTheme();
  
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messageOpen, setMessageOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [socialMediaLinks, setSocialMediaLinks] = useState([]);
  const [socialLoading, setSocialLoading] = useState(true);
  const profileMenuRef = useRef(null);
  const hoverTimeoutRef = useRef(null);
  const messageRef = useRef(null);

  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user?.id;

  // Default profile image
  const defaultProfileImage = man_image;

  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
    fetchSocialMedia();
  }, [userId]);

  // Fetch social media links from backend
  const fetchSocialMedia = async () => {
    try {
      setSocialLoading(true);
      const response = await axios.get(`${base_url}/api/user/social-media`);
      
      if (response.data.success) {
        // Map backend data to frontend format
        const formattedLinks = response.data.data.map(item => {
          let icon;
          let gradient;
          
          switch(item.platform) {
            case 'facebook':
              icon = <FaFacebook className="w-4 h-4 text-white" />;
              gradient = 'from-blue-600 to-blue-700';
              break;
            case 'whatsapp':
              icon = <FaWhatsapp className="w-4 h-4 text-white" />;
              gradient = 'from-green-500 to-green-600';
              break;
            case 'telegram':
              icon = <FaTelegram className="w-4 h-4 text-white" />;
              gradient = 'from-blue-500 to-blue-600';
              break;
            case 'youtube':
              icon = <FaYoutube className="w-4 h-4 text-white" />;
              gradient = 'from-red-600 to-red-700';
              break;
            default:
              icon = <FaFacebook className="w-4 h-4 text-white" />;
              gradient = 'from-gray-600 to-gray-700';
          }
          
          return {
            platform: item.platform,
            icon: icon,
            url: item.url,
            gradient: gradient,
            name: item.platform.charAt(0).toUpperCase() + item.platform.slice(1)
          };
        });
        
        setSocialMediaLinks(formattedLinks);
      }
    } catch (error) {
      console.error('Error fetching social media links:', error);
      // Set default social media links in case of error
      setSocialMediaLinks([
        {
          platform: 'whatsapp',
          icon: <FaWhatsapp className="w-4 h-4 text-white" />,
          url: 'https://wa.me/1234567890',
          gradient: 'from-green-500 to-green-600',
          name: 'WhatsApp'
        },
        {
          platform: 'telegram',
          icon: <FaTelegram className="w-4 h-4 text-white" />,
          url: 'https://t.me/yourusername',
          gradient: 'from-blue-500 to-blue-600',
          name: 'Telegram'
        }
      ]);
    } finally {
      setSocialLoading(false);
    }
  };

  // Close message panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (messageRef.current && !messageRef.current.contains(event.target)) {
        setMessageOpen(false);
      }
    };

    if (messageOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [messageOpen]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${base_url}/api/user/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'userId': userId
        }
      });
      
      if (response.data.success) {
        setUserData(response.data.data);
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({
          ...currentUser,
          ...response.data.data
        }));
      }
    } catch (error) {
      console.error("Header fetch error:", error);
      const localUser = JSON.parse(localStorage.getItem('user') || '{}');
      setUserData(localUser);
    } finally {
      setLoading(false);
    }
  };

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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    setProfileMenuOpen(false);
  };

  const handleSettings = () => {
    window.location.href = '/account/profile';
    setProfileMenuOpen(false);
  };

  const toggleMessagePanel = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setMessageOpen(!messageOpen);
    
    // Reset animation flag after animation completes
    setTimeout(() => {
      setIsAnimating(false);
    }, 500);
  };

  const handleSocialClick = (url) => {
    window.open(url, '_blank');
  };

  const getFullName = () => userData?.fullname || user?.fullname || 'User';
  const getUserName = () => getFullName().split(' ')[0] || 'User';
  const getUserEmail = () => userData?.email || user?.email || 'Email not available';
  const getUserBalance = () => userData?.balance || user?.balance || 0;
  const getUserStatus = () => userData?.status || user?.status || 'active';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning!";
    if (hour < 18) return "Good afternoon!";
    return "Good evening!";
  };

  const getUserProfileImage = () => {
    let profilePic = userData?.profile || user?.profile;
    
    if (profilePic && !profilePic.includes('default-profile') && !profilePic.startsWith('http')) {
      profilePic = `${base_url}${profilePic}`;
    } else if (!profilePic || profilePic.includes('default-profile')) {
      profilePic = defaultProfileImage;
    }
    
    return profilePic;
  };

  return (
    <>
      <header className={`font-anek shadow-sm h-[9vh] border-b py-3 md:py-4 px-4 md:px-6 flex items-center justify-between fixed top-0 right-0 left-0 lg:left-72 z-[10] transition-all duration-300
        ${isDarkMode ? 
          'dark:bg-gray-900 bg-gray-900 border-gray-800 text-white' : 
          'bg-white border-gray-200 text-gray-900'
        }`}>
        
        <div className="flex items-center space-x-3 md:space-x-4">
          <button 
            onClick={toggleSidebar}
            className="lg:hidden text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:outline-none transition-colors duration-300"
            aria-label="Toggle sidebar"
          >
            <FaBars size={20} className="md:w-6 md:h-6 w-5 h-5" />
          </button>
          
          {/* Mobile version - only name */}
          <h1 className="md:hidden text-lg font-bold dark:text-white">
            {getUserName()}
          </h1>
          
          {/* Desktop version - Welcome message with waving emoji */}
          <div className="hidden md:flex items-center space-x-3">
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold dark:text-white tracking-tight">
                 Hello, {getFullName()}
                </h1>
                <motion.span
                  className="text-2xl"
                  animate={{
                    rotate: [0, 20, 0, 20, 0],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    repeatDelay: 2,
                    ease: "easeInOut"
                  }}
                  aria-label="Waving hand"
                >
                  👋
                </motion.span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 md:space-x-6">
          {/* Notification Icon */}
          <NotificationIcon />
          
          {/* Balance Display */}
          <div className="sm:flex items-center">
            <div className="bg-[#00a8ff] dark:bg-blue-800 px-2 md:px-4 py-1.5 md:py-2 rounded-lg border border-blue-100 dark:border-blue-700">
              <div className="flex items-center space-x-1 md:space-x-2">
                <span className="text-sm md:text-[17px] text-white font-medium">Balance:</span>
                <span className="text-sm md:text-[17px] font-bold text-white">৳ {getUserBalance()}</span>
              </div>
            </div>
          </div>
          
          {/* --- PROFILE DESIGN --- */}
          <div className="relative" ref={profileMenuRef} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <div className="flex items-center space-x-2 cursor-pointer group">
              <div className="relative">
                <div className="absolute -bottom-[-2px] -right-1 z-20">
                  <div className="relative w-3 h-3 md:w-4 md:h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
                </div>
                <div className="w-[40px] h-[40px] border-[2px] border-[#00a8ff] md:w-12 md:h-12 rounded-full overflow-hidden dark:border-gray-800 group-hover:border-blue-400 dark:group-hover:border-blue-500 transition-all duration-300">
                  <img 
                    src={man_image} 
                    alt={getFullName()} 
                    className="w-full h-full object-cover" 
                    onError={(e) => {
                      e.target.src = defaultProfileImage;
                    }}
                  />
                </div>
              </div>
            </div>

            <AnimatePresence>
              {profileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-56 md:w-64 bg-white dark:bg-gray-900 rounded-lg shadow-xl py-2 border border-gray-200 dark:border-gray-800 z-50"
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white dark:border-gray-900">
                        <img 
                          src={getUserProfileImage()} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = defaultProfileImage;
                          }}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[150px]">
                          {getFullName()}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[150px]">
                          {getUserEmail()}
                        </p>
                        <div className="flex items-center mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            getUserStatus() === 'active'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                          }`}>
                            {getUserStatus()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="py-2">
                    <button 
                      onClick={handleSettings}
                      className="w-full px-4 py-3 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center space-x-3 transition-colors duration-200"
                    >
                      <FaCog className="w-4 h-4 text-gray-600 dark:text-gray-400" /> 
                      <span>Profile Settings</span>
                    </button>
                    <button 
                      onClick={handleLogout}
                      className="w-full px-4 py-3 text-sm text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-3 transition-colors duration-200 mt-1"
                    >
                      <FaSignOutAlt className="w-4 h-4" /> 
                      <span>Logout</span>
                    </button>
                  </div>
                  
                  {/* Current theme indicator in profile menu */}
                  <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Theme</span>
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                        {isDarkMode ? 'Dark' : 'Light'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;