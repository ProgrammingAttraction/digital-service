// context/MenuContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const MenuContext = createContext();

export const useMenuContext = () => {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('useMenuContext must be used within a MenuProvider');
  }
  return context;
};

export const MenuProvider = ({ children }) => {
  const [activeMenus, setActiveMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);
  
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;

  const fetchActiveMenus = async () => {
    // Check if we should refetch (if it's been more than 5 minutes since last fetch)
    const now = Date.now();
    const shouldRefetch = !lastFetched || (now - lastFetched) > 5 * 60 * 1000; // 5 minutes

    if (!shouldRefetch && activeMenus.length > 0) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${base_url}/api/user/service/active-menu`);
      
      if (response.data.success && response.data.menu && response.data.menu.length > 0) {
        // Extract all menu names from backend response
        const backendMenuNames = response.data.menu.map(menu => menu.name);
        setActiveMenus(backendMenuNames);
        setLastFetched(Date.now());
      } else {
        setActiveMenus([]);
        setLastFetched(Date.now());
      }
    } catch (error) {
      console.error('Error fetching active menus:', error);
      setError(error.message);
      setActiveMenus([]);
    } finally {
      setLoading(false);
    }
  };

  // Force refresh function
  const refreshMenus = async () => {
    setLastFetched(null);
    await fetchActiveMenus();
  };

  // Initialize on mount
  useEffect(() => {
    fetchActiveMenus();
  }, []);

  return (
    <MenuContext.Provider value={{
      activeMenus,
      loading,
      error,
      refreshMenus,
      fetchActiveMenus
    }}>
      {children}
    </MenuContext.Provider>
  );
};