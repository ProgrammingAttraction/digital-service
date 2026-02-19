import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const token = localStorage.getItem('token');
  const localUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = localUser?.id;

  const defaultProfileImage = "https://i.ibb.co.com/RTkGPXtm/Whats-App-Image-2026-01-01-at-6-38-12-PM.jpg";

  // Fetch user data
  const fetchUserData = async () => {
    if (!userId || !token) {
      setUserData(localUser);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${base_url}/api/user/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'userId': userId
        }
      });
      
      if (response.data.success) {
        const userData = response.data.data;
        setUserData(userData);
        
        // Update localStorage
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({
          ...currentUser,
          ...userData
        }));
      }
    } catch (error) {
      console.error("UserContext fetch error:", error);
      setError(error.message);
      setUserData(localUser);
    } finally {
      setLoading(false);
    }
  };

  // Refresh user data
  const refreshUserData = async () => {
    return await fetchUserData();
  };

  // Update specific user data
  const updateUserData = (updates) => {
    setUserData(prev => {
      const updated = { ...prev, ...updates };
      
      // Update localStorage
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({
        ...currentUser,
        ...updates
      }));
      
      return updated;
    });
  };

  // Get full name
  const getFullName = () => userData?.fullname || localUser?.fullname || 'User';
  
  // Get first name
  const getUserName = () => getFullName().split(' ')[0] || 'User';
  
  // Get email
  const getUserEmail = () => userData?.email || localUser?.email || 'Email not available';
  
  // Get balance
  const getUserBalance = () => userData?.balance || localUser?.balance || 0;
  
  // Get status
  const getUserStatus = () => userData?.status || localUser?.status || 'active';
  
  // Get profile image
  const getUserProfileImage = () => {
    let profilePic = userData?.profile || localUser?.profile;
    
    if (profilePic && !profilePic.includes('default-profile') && !profilePic.startsWith('http')) {
      profilePic = `${base_url}${profilePic}`;
    } else if (!profilePic || profilePic.includes('default-profile')) {
      profilePic = defaultProfileImage;
    }
    
    return profilePic;
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUserData(null);
    window.location.href = '/login';
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchUserData();
  }, []);

  const value = {
    userData,
    loading,
    error,
    refreshUserData,
    updateUserData,
    getFullName,
    getUserName,
    getUserEmail,
    getUserBalance,
    getUserStatus,
    getUserProfileImage,
    logout,
    isAuthenticated: !!token
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use the user context
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};