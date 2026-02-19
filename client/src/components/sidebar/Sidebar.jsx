import React, { useState, useEffect, useRef } from 'react';
import { 
  FaHome, FaPlusSquare, FaHeadset, FaIdCard, FaFileInvoice, FaBaby, FaServer, 
  FaSignInAlt, FaFileContract, FaShieldAlt, FaMapMarkedAlt, FaSignature, 
  FaUserCircle, FaSignOutAlt, FaHistory, FaFileAlt, FaFileWord, FaFingerprint,
  FaFacebook, FaWhatsapp, FaTelegram, FaCreditCard, FaPhoneAlt, FaFilePdf, 
  FaFileExcel, FaRegFileAlt, FaRegAddressCard, FaPassport, FaClone, FaSearch,
  FaYoutube, FaCommentDots, FaLocationArrow, FaMobileAlt, FaUserLock, 
  FaCertificate, FaCalculator, FaListAlt, FaAddressCard, FaIdBadge
} from 'react-icons/fa';
import { 
  MdOutlineSdCard, 
  MdOutlineAssignmentInd, 
  MdLocationOn, 
  MdPhoneIphone,
  MdLocationSearching,
  MdNumbers,
  MdAccountCircle
} from 'react-icons/md';
import { BsCash, BsFillPhoneFill } from 'react-icons/bs';
import { RiSmartphoneLine, RiUserSearchLine } from 'react-icons/ri';
import { BiIdCard, BiSearchAlt, BiData } from 'react-icons/bi';
import { TbFileInvoice, TbPhoneCall, TbMapPinSearch } from 'react-icons/tb';
import { GiSmartphone, GiDatabase } from 'react-icons/gi';
import { RiFolderHistoryLine } from "react-icons/ri";
import { HiDocumentDuplicate } from 'react-icons/hi';
import logo from "../../assets/logo.png"
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { FaBangladeshiTakaSign } from "react-icons/fa6";
import toast from 'react-hot-toast';
import { useTheme } from '../../context/ThemeContext';
import { useMenuContext } from '../../context/MenuContext'; // Import the context
import axios from 'axios';

const Sidebar = ({ isOpen, closeSidebar }) => {
  const { isDarkMode } = useTheme();
  const { activeMenus } = useMenuContext(); // Use context
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  
  const [clickedItem, setClickedItem] = useState(null);
  const [socialMediaLinks, setSocialMediaLinks] = useState([]);
  const [loadingSocial, setLoadingSocial] = useState(true);
  const sidebarRef = useRef(null);
  const activeItemRef = useRef(null);
  const animationTimeoutRef = useRef(null);

  // WhatsApp number for admin support
  const adminWhatsAppNumber = '8801853825711';
  const adminWhatsAppMessage = 'Hello%20Admin,%20I%20need%20assistance%20with%20my%20account.';

  // Fetch social media links from backend
  useEffect(() => {
    const fetchSocialMedia = async () => {
      try {
        setLoadingSocial(true);
        const response = await axios.get(`${base_url}/api/user/social-media`);
        
        if (response.data.success) {
          const formattedLinks = response.data.data.map(item => {
            let icon;
            let gradient;
            let hoverGradient;
            let shadow;
            
            switch(item.platform) {
              case 'facebook':
                icon = <FaFacebook />;
                gradient = 'linear-gradient(135deg, #1877F2 0%, #0D5F9A 100%)';
                hoverGradient = 'linear-gradient(135deg, #1877F2 0%, #0D5F9A 100%)';
                shadow = '0 4px 15px rgba(24, 119, 242, 0.3)';
                break;
              case 'whatsapp':
                icon = <FaWhatsapp />;
                gradient = 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)';
                hoverGradient = 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)';
                shadow = '0 4px 15px rgba(37, 211, 102, 0.3)';
                break;
              case 'telegram':
                icon = <FaTelegram />;
                gradient = 'linear-gradient(135deg, #0088cc 0%, #005580 100%)';
                hoverGradient = 'linear-gradient(135deg, #0088cc 0%, #005580 100%)';
                shadow = '0 4px 15px rgba(0, 136, 204, 0.3)';
                break;
              case 'youtube':
                icon = <FaYoutube />;
                gradient = 'linear-gradient(135deg, #FF0000 0%, #CC0000 100%)';
                hoverGradient = 'linear-gradient(135deg, #FF0000 0%, #CC0000 100%)';
                shadow = '0 4px 15px rgba(255, 0, 0, 0.3)';
                break;
              default:
                icon = <FaFacebook />;
                gradient = 'linear-gradient(135deg, #666 0%, #333 100%)';
                hoverGradient = 'linear-gradient(135deg, #666 0%, #333 100%)';
                shadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
            }
            
            return {
              name: item.platform.charAt(0).toUpperCase() + item.platform.slice(1),
              icon: icon,
              url: item.url,
              gradient: gradient,
              hoverGradient: hoverGradient,
              shadow: shadow
            };
          });
          
          setSocialMediaLinks(formattedLinks);
        }
      } catch (error) {
        console.error('Error fetching social media links:', error);
        setSocialMediaLinks([
          {
            name: 'WhatsApp',
            icon: <FaWhatsapp />,
            url: 'https://wa.me/+8801853825711',
            gradient: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
            hoverGradient: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
            shadow: '0 4px 15px rgba(37, 211, 102, 0.3)'
          }
        ]);
      } finally {
        setLoadingSocial(false);
      }
    };

    fetchSocialMedia();
  }, [base_url]);

  // --- CENTER SCROLL LOGIC ---
  useEffect(() => {
    if (activeItemRef.current && sidebarRef.current) {
      const container = sidebarRef.current;
      const activeItem = activeItemRef.current;

      const scrollPosition = 
        activeItem.offsetTop - 
        container.clientHeight / 2 + 
        activeItem.clientHeight / 2;

      container.scrollTo({
        top: scrollPosition,
        behavior: 'smooth',
      });
    }
  }, [currentPath, isOpen]);

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    toast.success('সফলভাবে লগ আউট হয়েছে!');
    setTimeout(() => navigate('/login'), 500);
    if (isOpen) closeSidebar();
  };

  // Handle Admin Support Click - Open WhatsApp
  const handleAdminSupportClick = () => {
    const whatsappUrl = `https://wa.me/${adminWhatsAppNumber}?text=${adminWhatsAppMessage}`;
    
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    
    setClickedItem('admin-support');
    if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
    animationTimeoutRef.current = setTimeout(() => setClickedItem(null), 800);
    
    if (isOpen) closeSidebar();
  };

  const handleMenuClick = (itemId, itemUrl) => {
    if (currentPath !== itemUrl) {
      setClickedItem(itemId);
      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = setTimeout(() => setClickedItem(null), 800);
    }
    if (isOpen) closeSidebar();
  };

  const isActive = (url) => currentPath === url || currentPath.startsWith(url + '/');

  // Function to filter menu items based on active menus from context
  const filterMenuItems = (items) => {
    return items.filter(item => {
      // Always show these items regardless of backend
      if (['dashboard', 'recharge', 'order-history', 'admin-support', 'profile', 'logout'].includes(item.id)) {
        return true;
      }
      
      // For other items, check if they exist in activeMenus from context
      return activeMenus.includes(item.text);
    });
  };

  // Complete menu structure (keeping all original menus)
  const menuGroups = [
    {
      items: [
        { icon: <FaHome />, text: 'ড্যাশবোর্ড', url: '/dashboard', id: 'dashboard' },
        { icon: <FaBangladeshiTakaSign />, text: 'রিচার্জ', url: '/recharge', id: 'recharge' },
        { icon: <RiFolderHistoryLine />, text: 'অর্ডার ইতিহাস', url: '/order/history', id: 'order-history' },
        { 
          icon: <FaCommentDots />, 
          text: 'অ্যাডমিন সাপোর্ট', 
          id: 'admin-support',
          onClick: handleAdminSupportClick,
          external: true
        },
      ]
    },
       {
      title: 'অটো সার্ভিস',
      items: [
        { icon: <MdOutlineAssignmentInd />, text: 'এনআইডি মেক', url: '/auto-services/new-nid', id: 'new-nid' },
        { icon: <MdOutlineAssignmentInd />, text: 'এনআইডি মেক 2', url: '/auto-services/new-nid2', id: 'new-nid2' },
        { icon: <GiDatabase />, text: 'অটো আইডি মেকার', url: '/auto-services/auto-id-maker', id: 'auto-id-maker' },
             { icon: <BiData />, text: 'জন্মনিবন্ধন ডাটা', url: '/auto-services/birth-data', id: 'birth-data' }, // New menu item added here
        { icon: <MdOutlineSdCard />, text: 'স্মার্ট কার্ড PDF মেক', url: '/auto-services/smart-nid', id: 'smart-nid' },
        { icon: <FaFileInvoice />, text: 'অটো জন্মনিবন্ধন মেক', url: '/auto-services/auto-birth-registration', id: 'auto-birth' },
        { icon: <FaSignInAlt />, text: 'সাইন টু সার্ভার কপি', url: '/auto-services/sign-to-server-copy', id: 'sign-server' },
        { icon: <FaFileContract />, text: 'অটো টিন সার্টিফিকেট', url: '/auto-services/tin-certificate-auto', id: 'auto-tin-cert' },
        { icon: <GiDatabase />, text: 'সার্ভার কপি', url: '/auto-services/server-copy-unofficial', id: 'server-copy-uno' },
      ]
    },
    {
      title: 'অর্ডার সার্ভিসেস',
      items: [
        { icon: <FaSignature />, text: 'সাইন কপি', url: '/order-services/sign-copy', id: 'sign-copy' },
        { icon: <FaIdBadge />, text: 'এনআইডি কার্ড অর্ডার', url: '/order-services/nid-card-order', id: 'card-order' },
        { icon: <MdOutlineSdCard />, text: 'স্মার্ট কার্ড অর্ডার', url: '/order-services/smart-card-order', id: 'smart-card-order' },
        { icon: <GiDatabase />, text: 'সার্ভার কপি অর্ডার', url: '/order-services/server-copy-order', id: 'server-copy-order' },
        { icon: <TbMapPinSearch />, text: 'নাম্বার টু লোকেশন', url: '/order-services/number-to-location', id: 'number-location' },
        { icon: <MdPhoneIphone />, text: 'IMEI টু নাম্বার', url: '/order-services/imei-to-number', id: 'imei-number' },
        { icon: <FaUserLock />, text: 'এনআইডি ইউজার পাস', url: '/order-services/nid-user-pass', id: 'nid-user-pass' },
        { icon: <FaBaby />, text: 'নতুন জন্ম নিবন্ধন', url: '/order-services/new-birth-registration', id: 'new-birth-reg' },
        { icon: <FaCertificate />, text: 'টিন সার্টিফিকেট অর্ডার', url: '/order-services/tin-certificate-order', id: 'tin-cert-order' },
        { icon: <FaCalculator />, text: 'জিরো রিটার্ন', url: '/order-services/zero-return', id: 'zero-return' },
        { icon: <MdNumbers />, text: 'এনআইডি টু অল নাম্বার', url: '/order-services/nid-to-all-number', id: 'nid-all-number' },
        { icon: <FaFingerprint />, text: 'জিপি বায়োমেট্রিক', url: '/order-services/gp-biometric', id: 'gp-biometric' },
        { icon: <RiUserSearchLine />, text: 'নাম ঠিকানা ২ এনআইডি', url: '/order-services/name-address-to-nid', id: 'name-address-nid' },
        { icon: <TbPhoneCall />, text: 'কল লিস্ট', url: '/order-services/call-list', id: 'call-list' },
      ]
    },
    {
      title: 'ক্লোন সার্ভিস',
      items: [
        { icon: <FaShieldAlt />, text: 'ভূমি উন্নয়ন কর', url: '/clone-services/vomi-unnoyon-kor', id: 'vomi-unnoyon-kor' },
        { icon: <FaShieldAlt />, text: 'পুলিশ ক্লিয়ারেন্স ক্লোন', url: '/clone-services/police-clearance-clone', id: 'police-clone' },
        { icon: <FaFileContract />, text: 'তাকামুল সার্টিফিকেট ক্লোন', url: '/clone-services/takamul-certificate-clone', id: 'takamul-clone' },
        { icon: <FaPlusSquare />, text: 'সুরক্ষা ক্লোন', url: '/clone-services/suraksha-clone', id: 'suraksha-clone' },
        { icon: <FaIdCard />, text: 'ট্রেড লাইসেন্স ক্লোন', url: '/clone-services/trade-license-clone', id: 'trade-license-clone' },
        { icon: <FaClone />, text: 'রিটার্ন ক্লোন', url: '/clone-services/tax-return-clone', id: 'tax-return-clone' },
        { icon: <FaRegAddressCard />, text: 'নাগরিক সনদ', url: '/clone-services/citizen-certificate', id: 'citizen-certificate' },
        { icon: <FaFileContract />, text: 'উত্তরাধিকার সনদ', url: '/clone-services/inheritance-certificate', id: 'inheritance-certificate' },
        { icon: <FaFileContract />, text: 'টিন সার্টিফিকেট ক্লোন', url: '/clone-services/tin-certificate-clone', id: 'tin-certificate-clone' },
        { icon: <FaFileInvoice />, text: 'জন্মনিবন্ধন মেক', url: '/auto-services/manually-birth-registration', id: 'manual-birth' },
        { icon: <FaFileContract />, text: 'মৃত্যনিবন্ধন', url: '/auto-services/death-certificate', id: 'death-certificate' },
        { icon: <FaFileContract />, text: 'এসএসসি সার্টিফিকেট ক্লোন', url: '/clone-services/ssc-certificate-clone', id: 'ssc-cert-clone' },
        { icon: <FaFileContract />, text: 'এইচএসসি সার্টিফিকেট ক্লোন', url: '/clone-services/hsc-certificate-clone', id: 'hsc-cert-clone' },
      ]
    },
 
    {
      title: 'অ্যাকাউন্ট',
      items: [
        { icon: <FaUserCircle />, text: 'প্রোফাইল', url: '/account/profile', id: 'profile' },
        { icon: <FaSignOutAlt />, text: 'লগআউট', url: '#', id: 'logout', onClick: handleLogout },
      ]
    }
  ];

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.6)] z-[40] lg:hidden" onClick={closeSidebar} />
      )}

      <aside 
        ref={sidebarRef}
        className={`
          fixed top-0 left-0 font-anek no-scrollbar h-full w-[65%] md:w-72 border-r
          transform transition-all duration-300 ease-in-out z-50
          overflow-y-auto custom-scrollbar shadow-sm flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
          ${isDarkMode ? 'bg-[#111827] border-gray-800' : 'bg-white border-gray-100'}
        `}
      >
        <NavLink to="/" className="p-5 flex items-center space-x-2">
          <img src={logo} alt="Logo" className={`w-[220px] transition-all ${isDarkMode ? 'brightness-110' : ''}`} />
        </NavLink>

        <nav className="px-3 flex-1">
          {menuGroups.map((group, gIndex) => {
            // Filter items based on active menus from context
            const filteredItems = filterMenuItems(group.items);
            
            // Don't render the group if it has no items after filtering
            if (filteredItems.length === 0) {
              return null;
            }
            
            return (
              <div key={gIndex} className="mb-4">
                {group.title && (
                  <h3 className="flex items-center px-2 py-3 text-[#00a8ff] text-[15px] font-bold uppercase tracking-widest">
                    {group.title}
                  </h3>
                )}
                <ul className="space-y-2">
                  {filteredItems.map((item, iIndex) => {
                    const active = isActive(item.url);
                    const isClicked = clickedItem === item.id;
                    const isExternal = item.url?.startsWith('http') || item.external;
                    
                    const commonClass = `
                      flex items-center px-4 py-2.5 rounded-[3px] text-[15px] md:text-[16px] transition-all
                      cursor-pointer
                      ${isClicked ? 'click-animation' : ''}
                      ${active 
                        ? (isDarkMode 
                            ? 'bg-[#0066A620] text-[#00a8ff] font-medium' 
                            : ' text-[#00a8ff] font-medium')
                        : (isDarkMode 
                            ? 'text-gray-300 hover:bg-gray-800 hover:text-white' 
                            : 'text-[#4A5568] hover:bg-gray-50 hover:text-[#00a8ff]')
                      }
                      ${item.id === 'admin-support' ? 'hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/20 dark:hover:text-green-400' : ''}
                    `;

                    return (
                      <li key={iIndex}>
                        {item.onClick ? (
                          <button 
                            onClick={item.onClick} 
                            className={`w-full text-left ${commonClass}`}
                          >
                            <span className={`mr-3 text-lg ${
                              item.id === 'admin-support' 
                                ? 'text-green-500 group-hover:text-green-600' 
                                : (active 
                                    ? 'text-[#00a8ff]' 
                                    : (isDarkMode ? 'text-gray-500' : 'text-[#5A6A85]'))
                            }`}>
                              {item.icon}
                            </span>
                            {item.text}
                          </button>
                        ) : isExternal ? (
                          <a 
                            href={item.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className={commonClass}
                            onClick={() => handleMenuClick(item.id, item.url)}
                          >
                            <span className={`mr-3 text-lg ${active ? 'text-[#00a8ff]' : (isDarkMode ? 'text-gray-500' : 'text-[#5A6A85]')}`}>
                              {item.icon}
                            </span>
                            {item.text}
                          </a>
                        ) : (
                          <NavLink
                            to={item.url}
                            ref={active ? activeItemRef : null}
                            onClick={() => handleMenuClick(item.id, item.url)}
                            className={commonClass}
                          >
                            <span className={`mr-3 text-lg ${active ? 'text-[#00a8ff]' : (isDarkMode ? 'text-gray-500' : 'text-[#5A6A85]')}`}>
                              {item.icon}
                            </span>
                            {item.text}
                          </NavLink>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* Social Media Section */}
        {!loadingSocial && socialMediaLinks.length > 0 && (
          <div className="p-4 mt-4 border-t border-gray-700">
            <h3 className="text-center text-sm font-semibold text-gray-400 mb-3">সামাজিক যোগাযোগ</h3>
            <div className="flex justify-center space-x-3">
              {socialMediaLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-10 h-10 rounded-full text-white transition-all duration-300 hover:scale-110 hover:shadow-lg"
                  style={{
                    background: social.gradient,
                    boxShadow: social.shadow,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = social.hoverGradient;
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = social.gradient;
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        )}
      </aside>

      <style jsx>{`
        .menu-title::before, .menu-title::after {
          content: ""; flex: 1; height: 2px;
          background: linear-gradient(to right, transparent, #00a8ff, transparent);
          background-size: 200% 100%; animation: shine 3s infinite linear;
          opacity: ${isDarkMode ? '0.5' : '0.6'};
        }
        .menu-title::before { margin-right: 15px; }
        .menu-title::after { margin-left: 15px; }
        @keyframes shine { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: ${isDarkMode ? '#111827' : '#f1f1f1'}; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${isDarkMode ? '#374151' : '#ccc'}; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: ${isDarkMode ? '#4B5563' : '#999'}; }
        .click-animation { animation: clickEffect 0.8s ease-out; }
        @keyframes clickEffect {
          0% { transform: scale(1); }
          50% { transform: scale(0.97); background-color: #E6F7FF; }
          100% { transform: scale(1); }
        }
      `}</style>
    </>
  );
};

export default Sidebar;