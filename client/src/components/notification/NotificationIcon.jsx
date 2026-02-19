import React, { useState, useRef, useEffect } from 'react';
import { FaBell, FaTimes, FaCheck, FaTrash, FaCircle, FaVolumeUp, FaVolumeMute, FaExclamationCircle, FaCog, FaCheckCircle, FaInfoCircle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from "../../context/NotificationContext";
import { useTheme } from '../../context/ThemeContext';
import axios from 'axios';
import notification_img from "../../assets/notification.png"
// Import the audio file
import notificationSound from "../../assets/audio.mp3";

const NotificationIcon = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  const dropdownRef = useRef(null);
  const audioRef = useRef(null);
  const hasPlayedRef = useRef(false);
  const socketRef = useRef(null);
  const audioTimeoutRef = useRef(null);
  
  const { isDarkMode } = useTheme();
  const notificationContext = useNotification();
  
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user?.id;

  // Check if device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener for resize
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // Initialize audio with 1-second duration
  useEffect(() => {
    try {
      audioRef.current = new Audio(notificationSound);
      audioRef.current.preload = 'auto';
      audioRef.current.volume = 0.6;
      
      // Set initial mute state
      const savedMuteState = localStorage.getItem('notificationSoundMuted');
      if (savedMuteState !== null) {
        setIsMuted(savedMuteState === 'true');
      }
      
      // Set initial sound enabled state
      const savedSoundEnabled = localStorage.getItem('notificationSoundEnabled');
      if (savedSoundEnabled !== null) {
        setSoundEnabled(savedSoundEnabled === 'true');
      } else {
        setSoundEnabled(true);
        localStorage.setItem('notificationSoundEnabled', 'true');
      }
      
    } catch (error) {
      console.error('Error initializing audio:', error);
      setSoundEnabled(false);
    }

    // Cleanup
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (audioTimeoutRef.current) {
        clearTimeout(audioTimeoutRef.current);
      }
    };
  }, []);

  // Save mute state
  useEffect(() => {
    localStorage.setItem('notificationSoundMuted', isMuted.toString());
  }, [isMuted]);

  // Save sound enabled state
  useEffect(() => {
    localStorage.setItem('notificationSoundEnabled', soundEnabled.toString());
  }, [soundEnabled]);

  // Fetch notifications on component mount
  useEffect(() => {
    if (userId && token) {
      fetchNotifications();
    }
  }, [userId, token]);

  // Play sound for new notifications (only 1 second)
  useEffect(() => {
    if (unreadCount > 0 && soundEnabled && !isMuted && isInitialLoad) {
      playNotificationSound();
      setIsInitialLoad(false);
    }
  }, [unreadCount, soundEnabled, isMuted]);

  // Sync with notification context
  useEffect(() => {
    if (notificationContext && notificationContext.notifications) {
      setNotifications(notificationContext.notifications);
      setUnreadCount(notificationContext.unreadCount);
    }
  }, [notificationContext]);

  // Play notification sound for exactly 1 second
  const playNotificationSound = () => {
    if (!soundEnabled || isMuted || !audioRef.current || hasPlayedRef.current) {
      return;
    }

    try {
      hasPlayedRef.current = true;
      
      // Reset audio
      audioRef.current.currentTime = 0;
      audioRef.current.volume = 0.6;
      
      // Play the sound
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn('Audio play failed:', error);
          if (error.name === 'NotAllowedError') {
            console.log('Autoplay blocked. User interaction required.');
          }
        });
      }
      
      // Stop after exactly 1 second
      audioTimeoutRef.current = setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          hasPlayedRef.current = false;
        }
      }, 1000);
      
    } catch (error) {
      console.error('Error playing sound:', error);
      hasPlayedRef.current = false;
    }
  };

  // Initialize Socket.io for real-time notifications
  useEffect(() => {
    if (!userId || !window.io) return;

    try {
      const socket = window.io(base_url, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        query: { userId }
      });

      socketRef.current = socket;

      // Listen for new notifications
      socket.on('new_notification', (notificationData) => {
        console.log('New notification received:', notificationData);
        
        // Add notification to list
        setNotifications(prev => [notificationData.notification, ...prev.slice(0, 49)]);
        
        // Increase unread count
        setUnreadCount(prev => prev + 1);
        
        // Play sound for new notification (1 second)
        if (soundEnabled && !isMuted) {
          playNotificationSound();
        }
        
        // Show desktop notification
        if (Notification.permission === 'granted' && document.hidden) {
          new Notification('New Notification', {
            body: notificationData.notification.message,
            icon: '/favicon.ico',
            tag: 'notification'
          });
        }
      });

      socket.on('connect', () => {
        console.log('Socket connected for notifications');
      });

      socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    } catch (error) {
      console.error('Socket initialization error:', error);
    }
  }, [userId, base_url, soundEnabled, isMuted]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  // Prevent body scroll when mobile dropdown is open
  useEffect(() => {
    if (dropdownOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [dropdownOpen, isMobile]);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (dropdownOpen) {
      fetchNotifications();
    }
  }, [dropdownOpen]);

  const fetchNotifications = async () => {
    if (!userId || !token) return;

    try {
      const response = await axios.get(`${base_url}/api/user/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'userId': userId
        },
        params: {
          filter: 'all',
          limit: 50
        }
      });

      if (response.data.success) {
        setNotifications(response.data.data.notifications);
        setUnreadCount(response.data.data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'order_created':
        return <FaExclamationCircle className="w-5 h-5" />;
      case 'order_processing':
        return <FaCog className="w-5 h-5" />;
      case 'order_completed':
        return <FaCheckCircle className="w-5 h-5" />;
      case 'order_cancelled':
        return <FaTimes className="w-5 h-5" />;
      case 'admin_submission':
        return '📄';
      case 'admin_notes':
        return '📝';
      case 'system_notice':
        return <FaInfoCircle className="w-5 h-5" />;
      case 'general_notice':
        return '📢';
      default:
        return <FaBell className="w-5 h-5" />;
    }
  };

  const getNotificationColor = (type) => {
    switch(type) {
      case 'order_created':
        return 'bg-blue-500/20 border-blue-500/30 text-blue-600 dark:text-blue-400';
      case 'order_processing':
        return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-600 dark:text-yellow-400';
      case 'order_completed':
        return 'bg-green-500/20 border-green-500/30 text-green-600 dark:text-green-400';
      case 'order_cancelled':
        return 'bg-red-500/20 border-red-500/30 text-red-600 dark:text-red-400';
      case 'admin_submission':
        return 'bg-purple-500/20 border-purple-500/30 text-purple-600 dark:text-purple-400';
      case 'admin_notes':
        return 'bg-indigo-500/20 border-indigo-500/30 text-indigo-600 dark:text-indigo-400';
      case 'system_notice':
        return 'bg-orange-500/20 border-orange-500/30 text-orange-600 dark:text-orange-400';
      case 'general_notice':
        return 'bg-teal-500/20 border-teal-500/30 text-teal-600 dark:text-teal-400';
      default:
        return 'bg-gray-500/20 border-gray-500/30 text-gray-600 dark:text-gray-400';
    }
  };

  const getIconContainerColor = (type) => {
    switch(type) {
      case 'order_created':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
      case 'order_processing':
        return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400';
      case 'order_completed':
        return 'bg-green-500/10 text-green-600 dark:text-green-400';
      case 'order_cancelled':
        return 'bg-red-500/10 text-red-600 dark:text-red-400';
      case 'admin_submission':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400';
      case 'admin_notes':
        return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400';
      case 'system_notice':
        return 'bg-orange-500/10 text-orange-600 dark:text-orange-400';
      case 'general_notice':
        return 'bg-teal-500/10 text-teal-600 dark:text-teal-400';
      default:
        return 'bg-gray-500/10 text-gray-600 dark:text-gray-400';
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }
    
    if (notification.orderId) {
      window.location.href = `/orders/${notification.orderId}`;
    }
    setDropdownOpen(false);
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`${base_url}/api/user/notifications/${notificationId}/read`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'userId': userId
        }
      });

      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { ...notif, isRead: true, readAt: new Date() }
            : notif
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(`${base_url}/api/user/notifications/read-all`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'userId': userId
        }
      });

      setNotifications(prev => 
        prev.map(notif => ({ 
          ...notif, 
          isRead: true, 
          readAt: new Date() 
        }))
      );
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await axios.delete(`${base_url}/api/user/notifications/${notificationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'userId': userId
        }
      });

      const deletedNotif = notifications.find(n => n._id === notificationId);
      setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
      
      if (deletedNotif && !deletedNotif.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const deleteAllNotifications = async () => {
    try {
      await axios.delete(`${base_url}/api/user/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'userId': userId
        }
      });

      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error deleting all notifications:', error);
    }
  };

  const toggleSound = () => {
    if (!soundEnabled) {
      setSoundEnabled(true);
      setIsMuted(false);
    } else {
      setIsMuted(!isMuted);
    }
  };

  const testNotificationSound = () => {
    playNotificationSound();
  };

  const NotificationItem = ({ notification }) => (
    <motion.div
      key={notification._id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={`px-4 py-3 border-b cursor-pointer transition-all duration-200 group ${
        notification.isRead 
          ? (isDarkMode ? 'bg-gray-900/50 border-gray-700/50' : 'bg-white border-gray-100')
          : (isDarkMode ? 'bg-blue-900/10 border-blue-700/30' : 'bg-blue-50/80 border-blue-200/50')
      } hover:${
        isDarkMode ? 'bg-gray-800/80' : 'bg-gray-50/80'
      }`}
      onClick={() => handleNotificationClick(notification)}
    >
      <div className="flex items-start gap-3">
        {/* Notification Icon */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${getIconContainerColor(notification.type)}`}>
          {getNotificationIcon(notification.type)}
        </div>
        
        {/* Notification Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className={`text-sm font-medium leading-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {notification.message}
              </p>
              
              {/* Tags and metadata */}
              {(notification.serviceName || notification.orderId) && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {notification.serviceName && (
                    <span className={`text-xs px-2 py-1 rounded-full border ${
                      isDarkMode 
                        ? 'bg-gray-800/50 border-gray-700 text-gray-300' 
                        : 'bg-gray-100/80 border-gray-200 text-gray-700'
                    }`}>
                      {notification.serviceName}
                    </span>
                  )}
                  {notification.orderId && (
                    <span className={`text-xs px-2 py-1 rounded-full border ${
                      isDarkMode 
                        ? 'bg-gray-800/30 border-gray-700 text-gray-400' 
                        : 'bg-gray-50/80 border-gray-200 text-gray-600'
                    }`}>
                      Order #{notification.orderId}
                    </span>
                  )}
                </div>
              )}
              
              {/* Time and status */}
              <div className="flex items-center justify-between mt-2">
                <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {formatTime(notification.createdAt)}
                </p>
                
                <div className="flex items-center gap-2">
                  {!notification.isRead && (
                    <span className={`inline-block w-2 h-2 rounded-full animate-pulse ${
                      isDarkMode ? 'bg-blue-400' : 'bg-blue-500'
                    }`} />
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification._id);
                    }}
                    className={`p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 ${
                      isDarkMode 
                        ? 'text-gray-500 hover:text-red-400 hover:bg-gray-800/50' 
                        : 'text-gray-400 hover:text-red-600 hover:bg-gray-100/80'
                    }`}
                    aria-label="Delete notification"
                  >
                    <FaTrash className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  // Mobile Fullscreen Popup Component
  const MobileNotificationsPopup = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex flex-col"
    >
      {/* Background overlay */}
      <div 
        className={`absolute inset-0 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}
        onClick={() => setDropdownOpen(false)}
      />
      
      {/* Mobile notification panel */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={`relative flex-1 flex flex-col mt-16 rounded-t-3xl overflow-hidden ${
          isDarkMode 
            ? 'bg-gray-900 border-gray-700' 
            : 'bg-white border-gray-200'
        } border`}
      >
        {/* Mobile Header */}
        <div className={`flex items-center justify-between px-4 py-4 border-b ${
          isDarkMode ? 'border-gray-700/50' : 'border-gray-200/80'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'
            }`}>
              <FaBell className={`w-6 h-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <div>
              <h3 className={`font-bold text-xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Notifications
              </h3>
              {unreadCount > 0 && (
                <p className={`text-sm font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                  {unreadCount} unread
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Sound toggle for mobile */}
            <button
              onClick={toggleSound}
              className={`p-3 rounded-full transition-all duration-200 ${
                isDarkMode 
                  ? soundEnabled && !isMuted 
                    ? 'text-green-400 hover:bg-gray-800/60' 
                    : 'text-gray-500 hover:bg-gray-800/60 hover:text-gray-400'
                  : soundEnabled && !isMuted 
                    ? 'text-green-600 hover:bg-gray-100/80' 
                    : 'text-gray-400 hover:bg-gray-100/80 hover:text-gray-600'
              }`}
              title={`${soundEnabled && !isMuted ? 'Sound enabled' : 'Sound disabled'}`}
            >
              {soundEnabled && !isMuted ? 
                <FaVolumeUp className="w-6 h-6" /> : 
                <FaVolumeMute className="w-6 h-6" />
              }
            </button>
            
            {/* Close button for mobile */}
            <button
              onClick={() => setDropdownOpen(false)}
              className={`p-3 rounded-full transition-all duration-200 ${
                isDarkMode 
                  ? 'text-gray-400 hover:text-white hover:bg-gray-800/60' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/80'
              }`}
            >
              <FaTimes className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mobile Action Buttons */}
        <div className={`flex items-center justify-between px-4 py-3 border-b ${
          isDarkMode ? 'border-gray-700/50' : 'border-gray-200/80'
        }`}>
          <div className="flex gap-2">
            {notifications.length > 0 && unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  isDarkMode 
                    ? 'text-blue-400 hover:bg-gray-800/60' 
                    : 'text-blue-600 hover:bg-gray-100/80'
                }`}
              >
                <FaCheck className="w-4 h-4" />
                Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={deleteAllNotifications}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  isDarkMode 
                    ? 'text-red-400 hover:bg-gray-800/60' 
                    : 'text-red-600 hover:bg-gray-100/80'
                }`}
              >
                <FaTrash className="w-4 h-4" />
                Clear all
              </button>
            )}
          </div>
          
          <button
            onClick={fetchNotifications}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
              isDarkMode 
                ? 'text-gray-400 hover:bg-gray-800/60' 
                : 'text-gray-600 hover:bg-gray-100/80'
            }`}
          >
            Refresh
          </button>
        </div>

        {/* Mobile Notification List */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {notifications.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-6 ${
                isDarkMode ? 'bg-gray-800/50' : 'bg-gray-100/80'
              }`}>
                <FaBell className={`w-10 h-10 ${isDarkMode ? 'text-gray-700' : 'text-gray-300'}`} />
              </div>
              <p className={`text-lg font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-3`}>
                No notifications yet
              </p>
              <p className={`text-base ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} mb-8`}>
                You're all caught up
              </p>
            </div>
          ) : (
            <div>
              <AnimatePresence>
                {notifications.map((notification) => (
                  <NotificationItem key={notification._id} notification={notification} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Mobile Footer */}
        {notifications.length > 0 && (
          <div className={`px-4 py-4 border-t ${
            isDarkMode ? 'border-gray-700/50' : 'border-gray-200/80'
          }`}>
            <div className="flex items-center justify-center">
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <span className="font-medium">{notifications.length}</span> total notifications
                {unreadCount > 0 && (
                  <span className={`ml-3 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    • <span className="font-medium">{unreadCount}</span> unread
                  </span>
                )}
              </span>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell */}
      <div className="relative">
        <button
          onClick={toggleDropdown}
          className={`relative p-2.5 rounded-xl transition-all duration-200 group ${
            isDarkMode 
              ? 'hover:bg-gray-800/80 text-gray-300' 
              : 'hover:bg-gray-100/80 text-gray-700'
          } ${dropdownOpen ? (isDarkMode ? 'bg-gray-800/80' : 'bg-gray-100/80') : ''}`}
          aria-label="Notifications"
        >
          <div className="relative">
            <img className='w-[28px] md:w-[35px]' src={notification_img} alt="" />
            
            {/* Sound indicator */}
            <div className={`absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border-2 ${
              isDarkMode ? 'border-gray-900' : 'border-white'
            } ${soundEnabled && !isMuted ? 'bg-green-500' : 'bg-gray-400'}`} />
          </div>
          
          {/* Unread badge */}
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1"
            >
              <span className="relative flex h-5 w-5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500/75 opacity-75"></span>
                <span className="relative inline-flex items-center justify-center rounded-full h-5 w-5 bg-gradient-to-br from-red-500 to-red-600 text-xs font-bold text-white shadow-sm">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              </span>
            </motion.div>
          )}
        </button>
      </div>

      {/* Dropdown for Desktop */}
      <AnimatePresence>
        {dropdownOpen && !isMobile && (
          <>
            {/* Desktop dropdown panel */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className={`absolute right-0 mt-2 no-scrollbar w-[500px] max-h-[500px] overflow-hidden rounded-xl shadow-2xl z-50 border ${
                isDarkMode 
                  ? 'bg-gray-900/95 backdrop-blur-xl border-gray-700/50' 
                  : 'bg-white/95 backdrop-blur-xl border-gray-200/80'
              }`}
            >
              {/* Header */}
              <div className={`px-4 py-3.5 flex items-center justify-between border-b ${
                isDarkMode ? 'border-gray-700/50' : 'border-gray-200/80'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'
                  }`}>
                    <FaBell className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <div>
                    <h3 className={`font-semibold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Notifications
                    </h3>
                    {unreadCount > 0 && (
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                        {unreadCount} unread
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  {/* Sound toggle */}
                  <button
                    onClick={toggleSound}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      isDarkMode 
                        ? soundEnabled && !isMuted 
                          ? 'text-green-400 hover:bg-gray-800/60' 
                          : 'text-gray-500 hover:bg-gray-800/60 hover:text-gray-400'
                        : soundEnabled && !isMuted 
                          ? 'text-green-600 hover:bg-gray-100/80' 
                          : 'text-gray-400 hover:bg-gray-100/80 hover:text-gray-600'
                    }`}
                    title={`${soundEnabled && !isMuted ? 'Sound enabled' : 'Sound disabled'}`}
                  >
                    {soundEnabled && !isMuted ? 
                      <FaVolumeUp className="w-5 h-5" /> : 
                      <FaVolumeMute className="w-5 h-5" />
                    }
                  </button>
                  
                  {/* Actions */}
                  {notifications.length > 0 && (
                    <>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                            isDarkMode 
                              ? 'text-blue-400 hover:bg-gray-800/60' 
                              : 'text-blue-600 hover:bg-gray-100/80'
                          }`}
                        >
                          Mark all
                        </button>
                      )}
                      <button
                        onClick={deleteAllNotifications}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                          isDarkMode 
                            ? 'text-red-400 hover:bg-gray-800/60' 
                            : 'text-red-600 hover:bg-gray-100/80'
                        }`}
                      >
                        Clear all
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Notification List */}
              <div className="overflow-y-auto no-scrollbar max-h-[380px]">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4 ${
                      isDarkMode ? 'bg-gray-800/50' : 'bg-gray-100/80'
                    }`}>
                      <FaBell className={`w-8 h-8 ${isDarkMode ? 'text-gray-700' : 'text-gray-300'}`} />
                    </div>
                    <p className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                      No notifications yet
                    </p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} mb-6`}>
                      You're all caught up
                    </p>
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={fetchNotifications}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          isDarkMode 
                            ? 'text-blue-400 hover:bg-gray-800/60' 
                            : 'text-blue-600 hover:bg-gray-100/80'
                        }`}
                      >
                        Refresh
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <AnimatePresence>
                      {notifications.map((notification) => (
                        <NotificationItem key={notification._id} notification={notification} />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className={`px-4 py-3 border-t ${
                  isDarkMode ? 'border-gray-700/50' : 'border-gray-200/80'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <span className="font-medium">{notifications.length}</span> total
                        {unreadCount > 0 && (
                          <span className={`ml-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                            • <span className="font-medium">{unreadCount}</span> unread
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Fullscreen Mobile Popup */}
      <AnimatePresence>
        {dropdownOpen && isMobile && <MobileNotificationsPopup />}
      </AnimatePresence>
    </div>
  );
};

export default NotificationIcon;