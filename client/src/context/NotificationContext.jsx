import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlayingSound, setIsPlayingSound] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);
  const initializedRef = useRef(false);

  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user?.id;

  // Initialize Socket.io connection
  const initializeSocket = useCallback(() => {
    if (!userId || !token || socketRef.current) return;

    try {
      // Connect to Socket.io server
      socketRef.current = io(base_url, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling']
      });

      // Connection events
      socketRef.current.on('connect', () => {
        console.log('Socket.io connected');
        setIsConnected(true);
        
        // Authenticate with user ID
        socketRef.current.emit('authenticate', userId);
      });

      socketRef.current.on('disconnect', () => {
        console.log('Socket.io disconnected');
        setIsConnected(false);
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('Socket.io connection error:', error);
        setIsConnected(false);
      });

      // Notification events
      socketRef.current.on('new_notification', (data) => {
        console.log('New notification received:', data);
        
        if (data.type === 'new-notification') {
          // Add new notification to the top
          setNotifications(prev => [data.notification, ...prev]);
          
          // Update unread count
          setUnreadCount(prev => prev + 1);
          
          // Play sound
          playNotificationSound();
        }
      });

      socketRef.current.on('notification_read', (data) => {
        console.log('Notification read:', data);
        
        if (data.type === 'notification-read') {
          setNotifications(prev => 
            prev.map(notif => 
              notif._id === data.notificationId 
                ? { ...notif, isRead: true, readAt: data.readAt }
                : notif
            )
          );
          
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      });

      socketRef.current.on('all_notifications_read', () => {
        console.log('All notifications read');
        setNotifications(prev => 
          prev.map(notif => ({ 
            ...notif, 
            isRead: true, 
            readAt: new Date() 
          }))
        );
        setUnreadCount(0);
      });

      socketRef.current.on('notification_deleted', (data) => {
        console.log('Notification deleted:', data);
        
        if (data.type === 'notification-deleted') {
          setNotifications(prev => prev.filter(notif => notif._id !== data.notificationId));
          
          if (data.wasUnread) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        }
      });

      socketRef.current.on('all_notifications_deleted', () => {
        console.log('All notifications deleted');
        setNotifications([]);
        setUnreadCount(0);
      });

    } catch (error) {
      console.error('Error initializing socket:', error);
    }
  }, [userId, token, base_url]);

  // Clean up socket connection
  const cleanupSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsConnected(false);
  }, []);

  // Notification sound
  const playNotificationSound = useCallback(() => {
    if (isPlayingSound) return;
    
    setIsPlayingSound(true);
    try {
      const audio = new Audio('/notification-sound.mp3');
      audio.play().catch(e => console.error('Error playing sound:', e));
      
      setTimeout(() => {
        setIsPlayingSound(false);
      }, 1000);
    } catch (error) {
      console.error('Error playing notification sound:', error);
      setIsPlayingSound(false);
    }
  }, [isPlayingSound]);

  // Fetch initial notifications
  const fetchInitialNotifications = useCallback(async () => {
    if (!userId || !token) return;

    try {
      setIsLoading(true);
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
        const newNotifications = response.data.data.notifications;
        const newUnreadCount = response.data.data.unreadCount;

        setNotifications(newNotifications);
        setUnreadCount(newUnreadCount);
        initializedRef.current = true;
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, token, base_url]);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`${base_url}/api/user/notifications/${notificationId}/read`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'userId': userId
        }
      });

      // The socket event will handle the state update
    } catch (error) {
      console.error('Error marking notification as read:', error);
      
      // Fallback: update local state if API fails
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { ...notif, isRead: true, readAt: new Date() }
            : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await axios.put(`${base_url}/api/user/notifications/read-all`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'userId': userId
        }
      });

      // The socket event will handle the state update
    } catch (error) {
      console.error('Error marking all as read:', error);
      
      // Fallback: update local state if API fails
      setNotifications(prev => 
        prev.map(notif => ({ 
          ...notif, 
          isRead: true, 
          readAt: new Date() 
        }))
      );
      setUnreadCount(0);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      await axios.delete(`${base_url}/api/user/notifications/${notificationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'userId': userId
        }
      });

      // The socket event will handle the state update
    } catch (error) {
      console.error('Error deleting notification:', error);
      
      // Fallback: update local state if API fails
      const deletedNotif = notifications.find(n => n._id === notificationId);
      setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
      
      if (deletedNotif && !deletedNotif.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    }
  };

  // Delete all notifications
  const deleteAllNotifications = async () => {
    try {
      await axios.delete(`${base_url}/api/user/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'userId': userId
        }
      });

      // The socket event will handle the state update
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      
      // Fallback: update local state if API fails
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  // Manually refresh notifications
  const refreshNotifications = async () => {
    await fetchInitialNotifications();
  };

  // Initialize and cleanup
  useEffect(() => {
    if (userId && token) {
      // Fetch initial notifications
      fetchInitialNotifications();
      
      // Setup Socket.io connection
      initializeSocket();
    }

    return () => {
      // Cleanup socket connection
      cleanupSocket();
    };
  }, [userId, token, fetchInitialNotifications, initializeSocket, cleanupSocket]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        isConnected,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        deleteAllNotifications,
        refreshNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};