import React, { useState, useEffect } from 'react';
import { 
  Search,
  RefreshCw,
  Save,
  Edit,
  Trash2,
  Plus,
  X,
  FileText,
  Eye,
  EyeOff
} from 'lucide-react';
import axios from 'axios';
import Header from '../../components/header/Header';
import Sidebar from '../../components/sidebar/Sidebar';
import toast, { Toaster } from 'react-hot-toast';

function Noticelist() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentNotice, setCurrentNotice] = useState(null);
  
  // Form states
  const [serviceName, setServiceName] = useState('');
  const [noticeText, setNoticeText] = useState('');
  const [isActive, setIsActive] = useState(true);

  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const token = localStorage.getItem('adminToken');

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  // Default notices
  const defaultNotices = [
    { 
      serviceName: "এনআইডি মেক", 
      notice: "এনআইডি তৈরি করা হচ্ছে...",
      isActive: true 
    },
    { 
      serviceName: "স্মার্ট  কাড PDF মেক", 
      notice: "স্মার্ট কার্ড PDF তৈরি সেবা চলছে",
      isActive: true 
    },
    { 
      serviceName: "মৃত্যনিবন্ধন", 
      notice: "মৃত্যু নিবন্ধন সেবা সক্রিয়",
      isActive: true 
    },
    { 
      serviceName: "ম্যানুয়ালি জন্মানিবন্ধন মেক", 
      notice: "ম্যানুয়াল জন্ম নিবন্ধন চলছে",
      isActive: true 
    },
    { 
      serviceName: "অটো জন্মানিবন্ধন মেক", 
      notice: "অটো জন্ম নিবন্ধন সেবা",
      isActive: true 
    },
    { 
      serviceName: "সার্ভার কপি Unofficial", 
      notice: "সার্ভার কপি সেবা পাওয়া যাচ্ছে",
      isActive: true 
    },
    { 
      serviceName: "সাইন টু সার্ভার কপি", 
      notice: "সাইন সার্ভার কপি সেবা",
      isActive: true 
    },
    { 
      serviceName: "টিন সার্টিকেট", 
      notice: "টিন সার্টিফিকেট সেবা সক্রিয়",
      isActive: true 
    },
    { 
      serviceName: "ভূমি উন্নয়ন কর", 
      notice: "ভূমি উন্নয়ন কর সেবা",
      isActive: true 
    },
    { 
      serviceName: "পুলিশ ক্লিয়ারেন্স ক্লোন", 
      notice: "পুলিশ ক্লিয়ারেন্স সেবা চলছে",
      isActive: true 
    },
    { 
      serviceName: "তাকামূল সাটিফিকেট ক্লোন", 
      notice: "তাকামূল সার্টিফিকেট সেবা",
      isActive: true 
    },
    { 
      serviceName: "সুরক্ষা ক্লোন", 
      notice: "সুরক্ষা সেবা পাওয়া যাচ্ছে",
      isActive: true 
    },
    { 
      serviceName: "ট্রেড লাইসেন্স ক্লোন", 
      notice: "ট্রেড লাইসেন্স সেবা সক্রিয়",
      isActive: true 
    },
    { 
      serviceName: "রিটার্ন ক্লোন", 
      notice: "রিটার্ন সেবা চলছে",
      isActive: true 
    },
    { 
      serviceName: "নাগরিক সনদ", 
      notice: "নাগরিক সনদ সেবা পাওয়া যাচ্ছে",
      isActive: true 
    },
    { 
      serviceName: "টিন সাটিফিকেট ক্লোন", 
      notice: "টিন সার্টিফিকেট সেবা",
      isActive: true 
    },
    { 
      serviceName: "এসএসসি সাটিফিকেট ক্লোন", 
      notice: "এসএসসি সার্টিফিকেট সেবা সক্রিয়",
      isActive: true 
    },
    { 
      serviceName: "এইচএসসি সাটিফিকেট ক্লোন", 
      notice: "এইচএসসি সার্টিফিকেট সেবা চলছে",
      isActive: true 
    },
    // New notices added here
    { 
      serviceName: "সাইন কপি", 
      notice: "সাইন কপি সেবা চলছে",
      isActive: true 
    },
    { 
      serviceName: "বায়োমেট্রিক", 
      notice: "জিপি বায়োমেট্রিক সেবা সক্রিয়",
      isActive: true 
    },
   { 
      serviceName: "কল লিস্ট", 
      notice: "কল লিস্ট সেবা সক্রিয়",
      isActive: true 
    },
    { 
      serviceName: "পাসপোর্ট মেক", 
      notice: "পাসপোর্ট তৈরি সেবা পাওয়া যাচ্ছে",
      isActive: true 
    },
        { 
      serviceName: "আয়কর রিটার্ন স্বীকারপত্র", 
      notice: "আয়কর রিটার্ন স্বীকারপত্র সেবা সক্রিয়",
      isActive: true 
    },
    { 
      serviceName: "উত্তরাধিকার সনদ", 
      notice: "উত্তরাধিকার সনদ সেবা পাওয়া যাচ্ছে",
      isActive: true 
    }
  ];

  // Save default notices to database
  const saveDefaultNoticesToDB = async () => {
    try {
      const response = await axios.post(
        `${base_url}/api/sub-admin/notices/save-defaults`,
        { notices: defaultNotices },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data.success;
    } catch (error) {
      console.error('Error saving default notices:', error);
      return false;
    }
  };

  // Check and save default notices if empty
  const checkAndSaveDefaults = async () => {
    try {
      const response = await axios.get(`${base_url}/api/sub-admin/notices/check-defaults`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.needsDefaults) {
        const saved = await saveDefaultNoticesToDB();
        if (saved) {
          console.log('Default notices saved to database');
        }
      }
    } catch (error) {
      console.error('Error checking defaults:', error);
    }
  };

  // Fetch notices from API
  const fetchNotices = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${base_url}/api/sub-admin/notices`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setNotices(response.data.data);
        
        // Check if we need to save default notices
        if (response.data.data.length === 0) {
          await checkAndSaveDefaults();
          // Refetch after saving defaults
          const newResponse = await axios.get(`${base_url}/api/sub-admin/notices`, {
            headers: {
                 'Authorization': `Bearer ${token}`,
            }
          });
          if (newResponse.data.success) {
            setNotices(newResponse.data.data);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching notices:', error);
      toast.error('Failed to load notices.');
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setServiceName('');
    setNoticeText('');
    setIsActive(true);
  };

  // Open add modal
  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  // Open edit modal
  const openEditModal = (notice) => {
    setCurrentNotice(notice);
    setServiceName(notice.serviceName);
    setNoticeText(notice.notice);
    setIsActive(notice.isActive);
    setShowEditModal(true);
  };

  // Open delete modal
  const openDeleteModal = (notice) => {
    setCurrentNotice(notice);
    setShowDeleteModal(true);
  };

  // Handle add notice
  const handleAddNotice = async () => {
    if (!serviceName.trim()) {
      toast.error('Service name is required');
      return;
    }

    if (!noticeText.trim()) {
      toast.error('Notice text is required');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        `${base_url}/api/sub-admin/notices`,
        {
          serviceName: serviceName.trim(),
          notice: noticeText.trim(),
          isActive: isActive
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        toast.success('Notice added successfully');
        setShowAddModal(false);
        resetForm();
        fetchNotices();
      }
    } catch (error) {
      console.error('Error adding notice:', error);
      toast.error(error.response?.data?.error || 'Failed to add notice');
    } finally {
      setLoading(false);
    }
  };

  // Handle edit notice
  const handleEditNotice = async () => {
    if (!serviceName.trim()) {
      toast.error('Service name is required');
      return;
    }

    if (!noticeText.trim()) {
      toast.error('Notice text is required');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.put(
        `${base_url}/api/sub-admin/notices/${currentNotice._id}`,
        {
          serviceName: serviceName.trim(),
          notice: noticeText.trim(),
          isActive: isActive
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        toast.success('Notice updated successfully');
        setShowEditModal(false);
        resetForm();
        setCurrentNotice(null);
        fetchNotices();
      }
    } catch (error) {
      console.error('Error updating notice:', error);
      toast.error(error.response?.data?.error || 'Failed to update notice');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete notice
  const handleDeleteNotice = async () => {
    try {
      setLoading(true);
      const response = await axios.delete(
        `${base_url}/api/sub-admin/notices/${currentNotice._id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        toast.success('Notice deleted successfully');
        setShowDeleteModal(false);
        setCurrentNotice(null);
        fetchNotices();
      }
    } catch (error) {
      console.error('Error deleting notice:', error);
      toast.error(error.response?.data?.error || 'Failed to delete notice');
    } finally {
      setLoading(false);
    }
  };

  // Toggle notice active status
  const handleToggleStatus = async (id, currentStatus) => {
    try {
      setLoading(true);
      const response = await axios.patch(
        `${base_url}/api/sub-admin/notices/${id}/toggle-status`,
        {},
        {
          headers: {
          'Authorization': `Bearer ${token}`,
          }
        }
      );

      if (response.data.success) {
        toast.success(`Notice status changed to ${!currentStatus ? 'active' : 'inactive'}`);
        fetchNotices();
      }
    } catch (error) {
      console.error('Error toggling notice status:', error);
      toast.error(error.response?.data?.error || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  // Filter notices based on search
  const filteredNotices = notices.filter(notice =>
    notice.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    notice.notice.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-BD', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Load notices on component mount
  useEffect(() => {
    fetchNotices();
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
            <h1 className="text-2xl font-bold text-teal-600 mb-1">Notice Management</h1>
            <p className="text-gray-600 mt-1">Manage service notices</p>
          </div>

          {/* Main Content Card */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm mb-6">
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Search */}
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search notices..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {/* Add Notice Button */}
                {/* <button
                  onClick={openAddModal}
                  className="inline-flex items-center px-4 py-2 gap-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors duration-200"
                >
                  <Plus className="w-4 h-4" />
                  Add Notice
                </button> */}
              </div>
            </div>

            {/* Notices Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
                  <h3 className="text-lg font-medium text-gray-700">Loading notices...</h3>
                </div>
              ) : filteredNotices.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-700">No notices found</h3>
                  <p className="text-gray-500 mt-1">Try adjusting your search or add a new notice</p>
                  <button
                    onClick={openAddModal}
                    className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors duration-200"
                  >
                    Add New Notice
                  </button>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Service Name
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Notice
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredNotices.map((notice) => (
                      <tr key={notice._id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center mr-3 ${
                              notice.isActive ? 'bg-teal-500' : 'bg-gray-100'
                            }`}>
                              {notice.isActive ? (
                                <Eye className="h-5 w-5 text-white" />
                              ) : (
                                <EyeOff className="h-5 w-5 text-gray-400" />
                              )}
                            </div>
                            <div className="font-medium text-gray-900">{notice.serviceName}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-700 whitespace-pre-wrap max-w-md">
                            {notice.notice}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            
                            <button
                              onClick={() => openEditModal(notice)}
                              disabled={loading}
                              className="inline-flex items-center p-2 text-white bg-blue-600 hover:bg-blue-700 cursor-pointer rounded-lg transition-colors duration-150"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => openDeleteModal(notice)}
                              disabled={loading}
                              className="inline-flex items-center p-2 text-white bg-red-600 hover:bg-red-700 cursor-pointer rounded-lg transition-colors duration-150"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
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
            {filteredNotices.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {filteredNotices.length} of {notices.length} notices
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">Active Notices:</span>
                    <span className="font-semibold ml-2">{notices.filter(item => item.isActive).length}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add Notice Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center p-4 z-[10000]">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Add New Notice</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-150"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Service Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Enter service name"
                    required
                  />
                </div>

                {/* Notice Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notice Text <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={noticeText}
                    onChange={(e) => setNoticeText(e.target.value)}
                    rows="6"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                    placeholder="Enter notice text here..."
                    required
                  />
                </div>

                {/* Active Status */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                    Active Notice
                  </label>
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-150"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddNotice}
                    disabled={loading}
                    className={`px-4 py-2 rounded-lg transition-colors duration-150 ${
                      loading
                        ? 'bg-teal-400 cursor-not-allowed'
                        : 'bg-teal-600 hover:bg-teal-700 text-white'
                    }`}
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 inline mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Notice'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Notice Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center p-4 z-[1000]">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Edit Notice</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-150"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Service Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Enter service name"
                    required
                  />
                </div>

                {/* Notice Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notice Text <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={noticeText}
                    onChange={(e) => setNoticeText(e.target.value)}
                    rows="6"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                    placeholder="Enter notice text here..."
                    required
                  />
                </div>

                {/* Active Status */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="editIsActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                  />
                  <label htmlFor="editIsActive" className="ml-2 block text-sm text-gray-700">
                    Active Notice
                  </label>
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-end space-x-4 pt-6 ">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-150"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEditNotice}
                    disabled={loading}
                    className={`px-4 py-2 rounded-lg cursor-pointer transition-colors duration-150 ${
                      loading
                        ? 'bg-teal-400 cursor-not-allowed'
                        : 'bg-teal-600 hover:bg-teal-700 text-white'
                    }`}
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 inline mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Notice'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-center mb-6">
                <div className="rounded-full bg-red-100 p-3">
                  <Trash2 className="w-8 h-8 text-red-600" />
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Delete Notice</h3>
              <p className="text-gray-600 text-center mb-6">
                Are you sure you want to delete this notice? This action cannot be undone.
              </p>

              {/* Notice Preview */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="font-medium text-gray-900 mb-1">
                  {currentNotice?.serviceName}
                </div>
                <p className="text-gray-700 whitespace-pre-wrap break-words">
                  {currentNotice?.notice}
                </p>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-150"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteNotice}
                  disabled={loading}
                  className={`px-6 py-2 rounded-lg transition-colors duration-150 ${
                    loading
                      ? 'bg-red-400 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 inline mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete Notice'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Noticelist;