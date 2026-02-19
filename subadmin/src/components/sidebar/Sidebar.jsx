import React, { useState, useEffect, useRef } from 'react';
import { 
  FaFileAlt, FaChevronDown, FaChevronUp, FaList, FaBullhorn 
} from 'react-icons/fa';
import { AiOutlineDashboard } from 'react-icons/ai';
import { FiUsers, FiUserCheck, FiUserX } from 'react-icons/fi';
import { IoMdPerson, IoIosLogOut, IoIosPricetags } from 'react-icons/io';
import { MdPendingActions, MdCheckCircle, MdCancel } from 'react-icons/md';
import { GrServices } from "react-icons/gr";
import { IoShareSocialSharp } from "react-icons/io5";
import logo from "../../assets/logo.png"
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

const Sidebar = ({ isOpen, closeSidebar }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const [clickedItem, setClickedItem] = useState(null);
  
  // All groups open by default using their titles as identifiers
  const [openGroups, setOpenGroups] = useState([
    'Dashboard', 'User Management', 'Orders', 'Services', 'Manage List', 'Account'
  ]);

  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  
  const sidebarRef = useRef(null);
  const activeItemRef = useRef(null);
  const animationTimeoutRef = useRef(null);

  const syncTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    setIsDarkMode(savedTheme === 'dark');
  };

  useEffect(() => {
    if (activeItemRef.current && sidebarRef.current && (isOpen || currentPath)) {
      const container = sidebarRef.current;
      const activeItem = activeItemRef.current;
      setTimeout(() => {
        const scrollPosition = activeItem.offsetTop - container.clientHeight / 2 + activeItem.clientHeight / 2;
        container.scrollTo({ top: scrollPosition, behavior: 'smooth' });
      }, 100);
    }
  }, [currentPath, isOpen]);

  useEffect(() => {
    syncTheme();
    window.addEventListener('storage', syncTheme);
    const interval = setInterval(syncTheme, 500);
    return () => {
      window.removeEventListener('storage', syncTheme);
      clearInterval(interval);
    };
  }, []);

  const isActive = (url) => currentPath === url || currentPath.startsWith(url + '/');

  const handleMenuClick = (itemId, itemUrl) => {
    if (currentPath !== itemUrl) {
      setClickedItem(itemId);
      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = setTimeout(() => setClickedItem(null), 800);
    }
    if (isOpen) closeSidebar();
  };

  const toggleGroup = (title) => {
    setOpenGroups(prev => 
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    );
  };

  const handleLogoutConfirm = () => {
    localStorage.removeItem('admin');
    localStorage.removeItem('adminToken');
    toast.success("Logout Successful!");
    setShowLogoutPopup(false);
    navigate('/login');
    if (isOpen) closeSidebar();
  };

  const handleLogoutClick = (e) => {
    e.preventDefault();
    setShowLogoutPopup(true);
  };

  const menuGroups = [
    {
      title: 'Dashboard',
      items: [{ icon: <AiOutlineDashboard />, text: 'Dashboard', url: '/dashboard', id: 'dashboard' }]
    },
    {
      title: 'User Management',
      items: [
        { icon: <FiUsers />, text: 'All Users', url: '/admin/users/all', id: 'all-users' },
        { icon: <FiUserCheck />, text: 'Active Users', url: '/admin/users/active', id: 'active-users' },
        { icon: <FiUserX />, text: 'Inactive Users', url: '/admin/users/inactive', id: 'inactive-users' },
      ]
    },
    {
      title: 'Orders',
      items: [
        { icon: <FaFileAlt />, text: 'All Orders', url: '/admin/orders/all', id: 'all-orders' },
        { icon: <MdPendingActions />, text: 'Pending Orders', url: '/admin/orders/pending', id: 'pending-orders' },
        { icon: <MdCheckCircle />, text: 'Completed Orders', url: '/admin/orders/completed', id: 'completed-orders' },
        { icon: <MdCancel />, text: 'Cancelled Orders', url: '/admin/orders/cancelled', id: 'cancelled-orders' },
      ]
    },
    {
      title: 'Services',
      items: [
        { icon: <FaList />, text: 'Services List', url: '/admin/services/all', id: 'services-list' },
        { icon: <GrServices />, text: 'New Services', url: '/admin/services/new', id: 'new-services' },
      ]
    },
    {
      title: 'Manage List',
      items: [
        { icon: <IoIosPricetags />, text: 'View Price List', url: '/admin/price-list', id: 'price-list' },
        { icon: <FaBullhorn />, text: 'Notice List', url: '/admin/notice-list', id: 'notice-list' },
        { icon: <IoShareSocialSharp />, text: 'Social Media', url: '/admin/social-media', id: 'social-media' },
      ]
    },
    {
      title: 'Account',
      items: [
        { icon: <IoMdPerson />, text: 'Profile', url: '/admin/account/profile', id: 'profile' },
        { icon: <IoIosLogOut />, text: 'Logout', url: '#', id: 'logout', onClick: handleLogoutClick },
      ]
    }
  ];

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/60 z-[40] lg:hidden" onClick={closeSidebar} />}

      <aside 
        ref={sidebarRef}
        style={{ fontFamily: "'Poppins', sans-serif" }}
        className={`fixed top-0 left-0 h-full w-[65%] md:w-72 border-r transform transition-all duration-300 ease-in-out z-50 overflow-y-auto custom-scrollbar flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}
      >
        <div className={`p-5 flex items-center justify-between border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <img src={logo} alt="Logo" className={`max-h-12 transition-all ${isDarkMode ? 'brightness-110' : ''}`} />
        </div>

        <nav className="px-3 pb-10 flex-1 mt-4">
          {menuGroups.map((group, gIndex) => {
            const isGroupOpen = openGroups.includes(group.title);
            return (
              <div key={gIndex} className="mb-2">
                <button 
                  onClick={() => toggleGroup(group.title)}
                  className={`w-full flex items-center justify-between px-2 py-3 text-[12px] font-semibold uppercase tracking-[1.5px] transition-colors ${isDarkMode ? 'text-[#00a8ff] hover:opacity-80' : 'text-[#00a8ff] hover:opacity-80'}`}
                >
                  <span>{group.title}</span>
                  {isGroupOpen ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
                </button>
                
                <div className={`overflow-hidden transition-all duration-300 ${isGroupOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <ul className="space-y-1 mt-1">
                    {group.items.map((item, iIndex) => {
                      const active = isActive(item.url);
                      const isClicked = clickedItem === item.id;
                      
                      // Dynamic styling based on #00a8ff
                      const commonClass = `flex items-center px-4 py-2.5 text-[14.5px] transition-all rounded-lg ${isClicked ? 'click-animation' : ''}`;
                      const activeClass = isDarkMode ? 'text-[#00a8ff] font-semibold' : 'text-[#00a8ff] font-semibold';
                      const inactiveClass = isDarkMode ? 'text-gray-300 hover:bg-gray-800 hover:text-white' : 'text-gray-600 ';

                      return (
                        <li key={iIndex}>
                          {item.onClick ? (
                            <button onClick={item.onClick} className={`w-full ${commonClass} ${inactiveClass}`}>
                              <span className={`mr-3 text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{item.icon}</span>
                              <span>{item.text}</span>
                            </button>
                          ) : (
                            <NavLink
                              to={item.url}
                              ref={active ? activeItemRef : null}
                              onClick={() => handleMenuClick(item.id, item.url)}
                              className={`${commonClass} ${active ? activeClass : inactiveClass}`}
                            >
                              <span className={`mr-3 text-lg ${active ? 'text-[#00a8ff]' : (isDarkMode ? 'text-gray-400' : 'text-gray-500')}`}>
                                {item.icon}
                              </span>
                              <span>{item.text}</span>
                              {active && <div className={`ml-auto w-1.5 h-1.5 rounded-full animate-pulse bg-[#00a8ff]`}></div>}
                            </NavLink>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            );
          })}
        </nav>

        <div className={`border-t px-4 py-4 mt-auto ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <p className={`text-center text-[11px] font-medium tracking-wide uppercase ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Admin Panel v1.0</p>
        </div>
      </aside>

      {/* Logout Confirmation Popup */}
      {showLogoutPopup && (
        <div style={{ fontFamily: "'Poppins', sans-serif" }} className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className={`rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`px-6 py-8 text-center ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 text-red-600 mb-4">
                <IoIosLogOut size={32} />
              </div>
              <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Ready to Leave?</h3>
              <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Click logout below if you are ready to end your current session.</p>
            </div>
            <div className={`px-6 py-4 flex gap-3 ${isDarkMode ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
              <button onClick={() => setShowLogoutPopup(false)} className={`flex-1 py-2.5 text-sm font-semibold rounded-xl border transition-all ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-white'}`}>Cancel</button>
              <button onClick={handleLogoutConfirm} className="flex-1 py-2.5 text-sm font-semibold text-white bg-[#00a8ff] hover:opacity-90 rounded-xl shadow-lg transition-all">Logout</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

        .click-animation { animation: clickEffect 0.4s ease-out; }
        @keyframes clickEffect {
          0% { transform: scale(1); }
          50% { transform: scale(0.96); }
          100% { transform: scale(1); }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: ${isDarkMode ? '#111827' : '#f9fafb'}; }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
          background: ${isDarkMode ? '#374151' : '#e2e8f0'}; 
          border-radius: 10px; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #00a8ff; }
      `}</style>
    </>
  );
};

export default Sidebar;