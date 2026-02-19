import React, { useState, useEffect } from 'react';
import { 
  Search,
  RefreshCw,
  CheckCircle,
  FileText,
  Menu,
  X,
  Plus,
  Folder,
  Settings,
  Shield,
  UserCheck,
  Smartphone,
  ClipboardCheck,
  FileEdit
} from 'lucide-react';
import axios from 'axios';
import Header from '../../components/header/Header';
import Sidebar from '../../components/sidebar/Sidebar';
import toast, { Toaster } from 'react-hot-toast';

function ManageMenu() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menulist, setMenulist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMenus, setSelectedMenus] = useState([]);
  const [selectedCount, setSelectedCount] = useState(0);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');

  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const token = localStorage.getItem('adminToken');

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  // Categories based on your menu structure
  const defaultCategories = [
    { id: 'all', name: 'All Menus', icon: <FileText className="w-5 h-5" /> },
    { id: 'order', name: 'অর্ডার সার্ভিসেস', icon: <ClipboardCheck className="w-5 h-5" /> },
    { id: 'clone', name: 'ক্লোন সার্ভিস', icon: <Shield className="w-5 h-5" /> },
    { id: 'auto', name: 'অটো সার্ভিস', icon: <Settings className="w-5 h-5" /> },
    { id: 'mobile', name: 'মোবাইল সার্ভিস', icon: <Smartphone className="w-5 h-5" /> },
    { id: 'form', name: 'ফর্ম সার্ভিস', icon: <FileEdit className="w-5 h-5" /> },
    { id: 'passport', name: 'পাসপোর্ট সার্ভিস', icon: <UserCheck className="w-5 h-5" /> }
  ];

  // All menus from your menu structure
const allMenus = [
    // অর্ডার সার্ভিসেস (Order Services)
    { name: 'সাইন কপি', category: 'order', isActive: true },
    { name: 'এনআইডি কার্ড অর্ডার', category: 'order', isActive: true },
    { name: 'স্মার্ট কার্ড অর্ডার', category: 'order', isActive: true },
    { name: 'সার্ভার কপি অর্ডার', category: 'order', isActive: true },
    { name: 'নাম্বার টু লোকেশন', category: 'order', isActive: true },
    { name: 'IMEI টু নাম্বার', category: 'order', isActive: true },
    { name: 'এনআইডি ইউজার পাস', category: 'order', isActive: true },
    { name: 'নতুন জন্ম নিবন্ধন', category: 'order', isActive: true },
    { name: 'টিন সার্টিফিকেট অর্ডার', category: 'order', isActive: true },
    { name: 'জিরো রিটার্ন', category: 'order', isActive: true },
    { name: 'এনআইডি টু অল নাম্বার', category: 'order', isActive: true },
    { name: 'জিপি বায়োমেট্রিক', category: 'order', isActive: true },
    { name: 'নাম ঠিকানা ২ এনআইডি', category: 'order', isActive: true },
    { name: 'কল লিস্ট', category: 'order', isActive: true },

    // ক্লোন সার্ভিস (Clone Services)
    { name: 'ভূমি উন্নয়ন কর', category: 'clone', isActive: true },
    { name: 'পুলিশ ক্লিয়ারেন্স ক্লোন', category: 'clone', isActive: true },
    { name: 'তাকামুল সার্টিফিকেট ক্লোন', category: 'clone', isActive: true },
    { name: 'সুরক্ষা ক্লোন', category: 'clone', isActive: true },
    { name: 'ট্রেড লাইসেন্স ক্লোন', category: 'clone', isActive: true },
    { name: 'রিটার্ন ক্লোন', category: 'clone', isActive: true },
    { name: 'নাগরিক সনদ', category: 'clone', isActive: true },
    { name: 'উত্তরাধিকার সনদ', category: 'clone', isActive: true },
    { name: 'টিন সার্টিফিকেট ক্লোন', category: 'clone', isActive: true },
    { name: 'জন্মনিবন্ধন মেক', category: 'clone', isActive: true },
    { name: 'মৃত্যনিবন্ধন', category: 'clone', isActive: true },
    { name: 'এসএসসি সার্টিফিকেট ক্লোন', category: 'clone', isActive: true },
    { name: 'এইচএসসি সার্টিফিকেট ক্লোন', category: 'clone', isActive: true },


    
    // অটো সার্ভিস (Auto Services)
    { name: 'এনআইডি মেক', category: 'auto', isActive: true },
    { name: 'এনআইডি মেক 2', category: 'auto', isActive: true },
    { name: 'স্মার্ট কার্ড PDF মেক', category: 'auto', isActive: true },
    { name: 'অটো জন্মনিবন্ধন মেক', category: 'auto', isActive: true },
    { name: 'সাইন টু সার্ভার কপি', category: 'auto', isActive: true },
    { name: 'অটো টিন সার্টিফিকেট', category: 'auto', isActive: true },
    { name: 'সার্ভার কপি', category: 'auto', isActive: true },
    { name: 'জন্মনিবন্ধন ডাটা', category: 'auto', isActive: true },
];


  // Fetch menu list from API or use defaults
  const fetchMenuList = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${base_url}/api/admin/menulist`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success && response.data.data.length > 0) {
        // Transform API data to match component structure
        const transformedData = response.data.data.map(item => ({
          id: item._id,
          name: item.name,
          category: item.category || 'other',
          isChecked: false,
          isActive: item.isActive
        }));
        setMenulist(transformedData);
      } else {
        // If no data from API, use default menus
        const defaultData = allMenus.map((menu, index) => ({
          id: `default-${index}`,
          name: menu.name,
          category: menu.category,
          isChecked: false,
          isActive: menu.isActive
        }));
        setMenulist(defaultData);
        
        // Optionally save defaults to API
        setTimeout(() => saveDefaultsToAPI(defaultData), 1000);
      }
    } catch (error) {
      console.error('Error fetching menu list:', error);
      
      // On error, use default menus
      const defaultData = allMenus.map((menu, index) => ({
        id: `default-${index}`,
        name: menu.name,
        category: menu.category,
        isChecked: false,
        isActive: menu.isActive
      }));
      setMenulist(defaultData);
      
      toast.error('Failed to load menu list. Using default menus.');
    } finally {
      setLoading(false);
    }
  };

  // Save default menus to API
  const saveDefaultsToAPI = async (defaultData) => {
    if (!token) return;
    
    try {
      // Create default menus in API
      for (const menu of allMenus) {
        await axios.post(
          `${base_url}/api/admin/menulist`,
          {
            name: menu.name,
            category: menu.category,
            isActive: menu.isActive
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
      }
      console.log('Default menus saved to API');
    } catch (error) {
      console.error('Error saving defaults to API:', error);
    }
  };

  // Calculate selected count whenever menulist changes
  useEffect(() => {
    const selected = menulist.filter(item => item.isChecked);
    setSelectedCount(selected.length);
    setSelectedMenus(selected.map(item => item.id));
  }, [menulist]);

  // Toggle menu selection
  const toggleMenuSelection = (id) => {
    setMenulist(prev => prev.map(item => 
      item.id === id ? { ...item, isChecked: !item.isChecked } : item
    ));
  };

  // Select all menus
  const selectAllMenus = () => {
    const allSelected = menulist.every(item => item.isChecked);
    setMenulist(prev => prev.map(item => ({ 
      ...item, 
      isChecked: !allSelected 
    })));
  };

  // Toggle menu active status
  const handleToggleStatus = async (id) => {
    // For default menus, just update state
    if (id.startsWith('default-')) {
      setMenulist(prev => prev.map(item => 
        item.id === id ? { ...item, isActive: !item.isActive } : item
      ));
      toast.success('Menu status updated locally');
      return;
    }

    // For API menus
    try {
      setLoading(true);
      const response = await axios.patch(
        `${base_url}/api/admin/menulist/${id}/toggle-status`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        toast.success(`Menu status changed to ${response.data.data.isActive ? 'active' : 'inactive'}`);
        // Refresh the list
        fetchMenuList();
      }
    } catch (error) {
      console.error('Error toggling menu status:', error);
      toast.error(error.response?.data?.error || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  // Add new menu
  const handleAddMenu = async () => {
    const newMenuName = prompt('Enter new menu name:');
    if (!newMenuName || newMenuName.trim() === '') return;

    const category = prompt('Enter category (order/clone/auto/mobile/form/passport/other):', 'other');
    
    try {
      setLoading(true);
      const response = await axios.post(
        `${base_url}/api/admin/menulist`,
        {
          name: newMenuName.trim(),
          category: category || 'other',
          isActive: true
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        toast.success('Menu added successfully');
        fetchMenuList();
      }
    } catch (error) {
      console.error('Error adding menu:', error);
      toast.error(error.response?.data?.error || 'Failed to add menu');
    } finally {
      setLoading(false);
    }
  };

  // Handle bulk delete selected menus
  const handleBulkDelete = async () => {
    if (selectedMenus.length === 0) {
      toast.error('Please select menus to delete');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedMenus.length} selected menus?`)) {
      return;
    }

    // Filter out default menus (they're not in API yet)
    const defaultMenusToRemove = selectedMenus.filter(id => id.startsWith('default-'));
    const apiMenusToDelete = selectedMenus.filter(id => !id.startsWith('default-'));
    
    // Remove default menus from state
    if (defaultMenusToRemove.length > 0) {
      setMenulist(prev => prev.filter(item => !defaultMenusToRemove.includes(item.id)));
    }
    
    // Delete API menus
    if (apiMenusToDelete.length > 0) {
      try {
        setLoading(true);
        const response = await axios.post(
          `${base_url}/api/admin/menulist/bulk-delete`,
          { ids: apiMenusToDelete },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data.success) {
          toast.success(`Successfully deleted ${response.data.data.deletedCount + defaultMenusToRemove.length} menu(s)`);
        }
      } catch (error) {
        console.error('Error bulk deleting menus:', error);
        toast.error(error.response?.data?.error || 'Failed to delete menus');
      } finally {
        setLoading(false);
      }
    } else if (defaultMenusToRemove.length > 0) {
      toast.success(`Removed ${defaultMenusToRemove.length} default menu(s)`);
    }
    
    // Clear selected menus
    setSelectedMenus([]);
  };

  // Add new category
  const handleAddCategory = () => {
    const categoryName = prompt('Enter new category name:');
    if (!categoryName || categoryName.trim() === '') return;

    const newCategory = {
      id: categoryName.toLowerCase().replace(/\s+/g, '-'),
      name: categoryName.trim(),
      icon: <Folder className="w-5 h-5" />
    };

    setCategories(prev => [...prev, newCategory]);
    toast.success(`Category "${categoryName}" added`);
  };

  // Filter menus based on search term and active category
  const filteredMenus = menulist.filter(menu => {
    const matchesSearch = menu.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'all' || menu.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // Get menus count by category
  const getCategoryCount = (categoryId) => {
    if (categoryId === 'all') return menulist.length;
    return menulist.filter(item => item.category === categoryId).length;
  };

  // Custom Switch Component
  const CustomSwitch = ({ isActive, onToggle, disabled }) => {
    return (
      <button
        onClick={onToggle}
        disabled={disabled}
        className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${
          isActive ? 'bg-teal-600' : 'bg-gray-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ${
            isActive ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    );
  };

  // Load menu list on component mount
  useEffect(() => {
    fetchMenuList();
    setCategories(defaultCategories);
  }, []);

  return (
    <div className="font-anek text-gray-700 lg:ml-72 mt-[9vh]">
      <Header toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />
      <Toaster />

      <main className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="w-full mx-auto">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-teal-600 mb-1">Menu Management</h1>
            <p className="text-gray-600 mt-1">Manage menu items and their visibility status</p>
          </div>


          {/* Main Content Card */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm mb-6">
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Search and Filters */}
                <div className="flex flex-col md:flex-row md:items-center gap-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search menus..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme_color2"
                    />
                  </div>

                  {/* Selected Count Badge */}
                  {selectedCount > 0 && (
                    <div className="flex items-center bg-blue-50 border-[1px] border-blue-500 rounded-lg px-3 py-1.5">
                      <span className="text-sm font-medium text-blue-700">
                        {selectedCount} selected
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  {/* Add Menu Button */}
                  <button
                    onClick={handleAddMenu}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 gap-2 bg-green-600 hover:bg-green-700 cursor-pointer text-white rounded-lg transition-colors duration-200"
                  >
                    <Plus className="w-4 h-4" />
                    Add Menu
                  </button>

                  {/* Delete Selected Button */}
                  {selectedCount > 0 && (
                    <button
                      onClick={handleBulkDelete}
                      disabled={loading}
                      className="inline-flex items-center px-4 py-2 gap-2 bg-red-600 hover:bg-red-700 cursor-pointer text-white rounded-lg transition-colors duration-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                      Delete Selected
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Menu List Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
                  <h3 className="text-lg font-medium text-gray-700">Loading menu list...</h3>
                </div>
              ) : filteredMenus.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-700">No menus found</h3>
                  <p className="text-gray-500 mt-1">Try adjusting your search or add a new menu</p>
                  <button
                    onClick={handleAddMenu}
                    className="mt-4 px-4 py-2 bg-teal-600 cursor-pointer text-white rounded-lg hover:bg-teal-700 transition-colors duration-200"
                  >
                    Add New Menu
                  </button>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={filteredMenus.every(item => item.isChecked) && filteredMenus.length > 0}
                          onChange={selectAllMenus}
                          className="rounded border-gray-300"
                          disabled={loading}
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Menu Name
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredMenus.map((menu) => (
                      <tr key={menu.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={menu.isChecked}
                            onChange={() => toggleMenuSelection(menu.id)}
                            className="rounded border-gray-300"
                            disabled={loading}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center mr-3 ${
                              menu.isChecked ? 'bg-green-100' : 'bg-gray-100'
                            }`}>
                              {menu.isChecked ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              ) : (
                                <FileText className="h-5 w-5 text-gray-400" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{menu.name}</div>
                              {menu.id.startsWith('default-') && (
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                  Default Menu
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <CustomSwitch
                              isActive={menu.isActive}
                              onToggle={() => handleToggleStatus(menu.id)}
                              disabled={loading}
                            />
                            <span className={`text-sm font-medium ${menu.isActive ? 'text-green-600' : 'text-red-600'}`}>
                              {menu.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleToggleStatus(menu.id)}
                              disabled={loading}
                              className={`inline-flex items-center px-3 py-1.5 text-sm rounded-lg transition-colors duration-150 ${
                                loading
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  : menu.isActive
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                            >
                              {menu.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Summary Footer */}
            {filteredMenus.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {filteredMenus.length} of {menulist.length} menus
                    {selectedCount > 0 && ` • ${selectedCount} selected`}
                    {activeCategory !== 'all' && ` in "${categories.find(c => c.id === activeCategory)?.name || activeCategory}"`}
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-sm">
                      <span className="text-gray-600">Active Menus:</span>
                      <span className="font-semibold ml-2 text-green-600">{menulist.filter(item => item.isActive).length}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">Inactive Menus:</span>
                      <span className="font-semibold ml-2 text-red-600">{menulist.filter(item => !item.isActive).length}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default ManageMenu;