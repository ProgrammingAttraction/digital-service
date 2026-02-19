import React, { useState, useEffect } from 'react';
import { 
  Search,
  RefreshCw,
  Save,
  CheckCircle,
  FileText,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  X
} from 'lucide-react';
import axios from 'axios';
import Header from '../../components/header/Header';
import Sidebar from '../../components/sidebar/Sidebar';
import toast, { Toaster } from 'react-hot-toast';

function Socialmedia() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [socialMediaList, setSocialMediaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    platform: 'facebook',
    url: '',
    isActive: true
  });
  const [editingId, setEditingId] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const token = localStorage.getItem('adminToken');

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  // Fetch social media links
  const fetchSocialMedia = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${base_url}/api/admin/social-media`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setSocialMediaList(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching social media:', error);
      toast.error('Failed to load social media links');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSocialMedia();
  }, []);

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.url.trim()) {
      toast.error('URL is required');
      return;
    }

    try {
      setSaving(true);
      let response;

      if (editingId) {
        // Update existing
        response = await axios.put(
          `${base_url}/api/admin/social-media/${editingId}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Updated successfully');
      } else {
        // Create new
        response = await axios.post(
          `${base_url}/api/admin/social-media`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Added successfully');
      }

      if (response.data.success) {
        fetchSocialMedia();
        resetForm();
      }
    } catch (error) {
      console.error('Error saving:', error);
      toast.error(error.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      platform: 'facebook',
      url: '',
      isActive: true
    });
    setEditingId(null);
  };

  // Edit social media link
  const handleEdit = (item) => {
    setFormData({
      platform: item.platform,
      url: item.url,
      isActive: item.isActive
    });
    setEditingId(item._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Open delete confirmation modal
  const openDeleteModal = (item) => {
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };

  // Close delete confirmation modal
  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setItemToDelete(null);
    setDeleting(false);
  };

  // Delete social media link
  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      setDeleting(true);
      await axios.delete(`${base_url}/api/admin/social-media/${itemToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Deleted successfully');
      fetchSocialMedia();
      closeDeleteModal();
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error(error.response?.data?.error || 'Failed to delete');
      setDeleting(false);
    }
  };

  // Toggle active status
  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await axios.patch(
        `${base_url}/api/admin/social-media/${id}/toggle`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Status changed to ${!currentStatus ? 'active' : 'inactive'}`);
      fetchSocialMedia();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Failed to update status');
    }
  };

  // Filtered list
  const filteredList = socialMediaList.filter(item =>
    item.platform.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Platform icons
  const getPlatformIcon = (platform) => {
    const icons = {
      facebook: 'text-blue-600',
      whatsapp: 'text-green-600',
      youtube: 'text-red-600',
      telegram: 'text-blue-500'
    };
    return icons[platform] || 'text-gray-600';
  };

  // Platform display names
  const getPlatformDisplayName = (platform) => {
    const names = {
      facebook: 'Facebook',
      whatsapp: 'WhatsApp',
      youtube: 'YouTube',
      telegram: 'Telegram'
    };
    return names[platform] || platform;
  };

  return (
    <div className="font-anek text-gray-700 lg:ml-72 mt-[9vh]">
      <Header toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />
      <Toaster />

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 transition-opacity"
            onClick={closeDeleteModal}
          />
          
          {/* Modal */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full transform transition-all">
              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Delete Link</h3>
                      <p className="text-sm text-gray-600">Confirm deletion</p>
                    </div>
                  </div>
                  <button
                    onClick={closeDeleteModal}
                    className="text-gray-400 hover:text-gray-500 transition p-1 rounded-full hover:bg-gray-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-start mb-6">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-gray-800 mb-2">
                      Are you sure you want to delete this social media link?
                    </p>
                    {itemToDelete && (
                      <div className="bg-red-50 border border-red-100 rounded-lg p-3 mt-2">
                        <div className="flex items-center mb-1">
                          <div className={`w-3 h-3 rounded-full mr-2 ${getPlatformIcon(itemToDelete.platform)}`} />
                          <span className="font-medium text-gray-800">
                            {getPlatformDisplayName(itemToDelete.platform)}
                          </span>
                          <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                            itemToDelete.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {itemToDelete.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 truncate" title={itemToDelete.url}>
                          {itemToDelete.url}
                        </p>
                      </div>
                    )}
                    <p className="text-sm text-gray-500 mt-3">
                      This action cannot be undone. The link will be permanently removed.
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={closeDeleteModal}
                    disabled={deleting}
                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleting ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Link
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="w-full mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Social Media Links</h1>
            <p className="text-gray-600 mt-1">Manage your social media links</p>
          </div>

          {/* Add/Edit Form */}
          <div className="bg-white rounded-xl shadow-sm p-5 md:p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                {editingId ? 'Edit Social Media Link' : 'Add New Social Media Link'}
              </h2>
              {editingId && (
                <button
                  onClick={resetForm}
                  className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* Platform Select */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Platform *
                  </label>
                  <select
                    name="platform"
                    value={formData.platform}
                    onChange={handleInputChange}
                    className="w-full px-3 h-[45px] border border-gray-300 rounded-lg outline-teal-500 transition"
                    required 
                  >
                    <option value="facebook">Facebook</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="youtube">YouTube</option>
                    <option value="telegram">Telegram</option>
                  </select>
                </div>

                {/* URL Input */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL *
                  </label>
                  <input
                    type="url"
                    name="url"
                    value={formData.url}
                    onChange={handleInputChange}
                    placeholder="https://example.com/profile"
                    className="w-full px-3 py-2.5 border h-[45px] border-gray-300 rounded-lg outline-teal-500 transition"
                    required
                  />
                </div>
              </div>

              {/* Active Checkbox */}
              <div className="flex items-center mb-6">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                />
                <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                  Active (visible to users)
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-teal-600 cursor-pointer hover:bg-teal-700 text-white font-medium rounded-lg transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    {editingId ? 'Updating...' : 'Adding...'}
                  </>
                ) : (
                  <>
                    {editingId ? (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Update Link
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Link
                      </>
                    )}
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Social Media List */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Header with search */}
            <div className="p-5 md:p-6 border-b border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Social Media Links</h2>
                  <p className="text-gray-600 text-sm mt-1">
                    {filteredList.length} link{filteredList.length !== 1 ? 's' : ''} found
                  </p>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="p-8 text-center">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                <p className="mt-2 text-gray-600">Loading social media links...</p>
              </div>
            ) : (
              /* Table */
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Platform</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">URL</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Status</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredList.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="py-8 px-4 text-center text-gray-500">
                          <AlertCircle className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                          <p>No social media links found</p>
                          <p className="text-sm mt-1">Add your first link using the form above</p>
                        </td>
                      </tr>
                    ) : (
                      filteredList.map((item) => (
                        <tr key={item._id} className="hover:bg-gray-50 transition">
                          {/* Platform */}
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <div className={`w-3 h-3 rounded-full mr-3 ${getPlatformIcon(item.platform)}`} />
                              <span className="font-medium capitalize">{item.platform}</span>
                            </div>
                          </td>

                          {/* URL */}
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 hover:underline truncate max-w-xs"
                                title={item.url}
                              >
                                {item.url}
                              </a>
                              <ExternalLink className="w-3 h-3 ml-2 text-gray-400" />
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4">
                            <button
                              onClick={() => handleToggleStatus(item._id, item.isActive)}
                              className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                                item.isActive
                                  ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                  : 'bg-red-100 text-red-800 hover:bg-red-200'
                              }`}
                            >
                              {item.isActive ? 'Active' : 'Inactive'}
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEdit(item)}
                                className="p-2 text-white bg-blue-600 cursor-pointer rounded-lg hover:bg-blue-700 transition"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openDeleteModal(item)}
                                className="p-2 text-white bg-red-600 cursor-pointer rounded-lg hover:bg-red-700 transition"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Socialmedia;