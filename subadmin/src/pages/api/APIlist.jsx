import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter,
  X,
  Shield,
  Key,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Edit,
  Trash2,
  FileText,
  Fingerprint,
  CreditCard,
  UserCheck,
  FileSignature,
  Skull,
  Globe,
  BarChart3,
  Copy,
  RefreshCw,
  AlertCircle,
  Lock,
  Unlock,
  Activity,
  Users,
  MoreVertical,
  Zap
} from 'lucide-react';
import axios from 'axios';
import Header from '../../components/header/Header';
import Sidebar from '../../components/sidebar/Sidebar';
import toast, { Toaster } from 'react-hot-toast';
import ApertureLoader from '../../components/loader/ApertureLoader';
import { FaBangladeshiTakaSign } from "react-icons/fa6";
function APIlist() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [apis, setApis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedApi, setSelectedApi] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editingApi, setEditingApi] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [stats, setStats] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const token = localStorage.getItem('adminToken');

  // API definitions with icons
  const apiDefinitions = [
    {
      id: 'birth_certificate',
      name: 'Birth Certificate',
      description: 'API for generating and validating birth certificates',
      icon: <FileText className="w-6 h-6" />,
      color: 'bg-blue-500',
      defaultPrice: 50,
      category: 'certificates'
    },
    {
      id: 'nid_make',
      name: 'NID Make',
      description: 'National ID card generation and verification API',
      icon: <CreditCard className="w-6 h-6" />,
      color: 'bg-green-500',
      defaultPrice: 75,
      category: 'identification'
    },
    {
      id: 'smart_card_make',
      name: 'Smart Card Make',
      description: 'Smart card generation and management API',
      icon: <CreditCard className="w-6 h-6" />,
      color: 'bg-purple-500',
      defaultPrice: 100,
      category: 'identification'
    },
    {
      id: 'sign_to_server_copy',
      name: 'Sign to Server Copy',
      description: 'Digital signature verification and server copy generation',
      icon: <FileSignature className="w-6 h-6" />,
      color: 'bg-orange-500',
      defaultPrice: 150,
      category: 'authentication'
    },
    {
      id: 'death_certificate',
      name: 'Death Certificate',
      description: 'API for generating death certificates',
      icon: <Skull className="w-6 h-6" />,
      color: 'bg-gray-600',
      defaultPrice: 50,
      category: 'certificates'
    },
    {
      id: 'ministry_data',
      name: 'Ministry Data',
      description: 'Access to various ministry databases and records',
      icon: <Globe className="w-6 h-6" />,
      color: 'bg-red-500',
      defaultPrice: 200,
      category: 'government'
    },
    {
      id: 'auto_biometric',
      name: 'Auto Biometric',
      description: 'Automated biometric verification and authentication',
      icon: <Fingerprint className="w-6 h-6" />,
      color: 'bg-teal-500',
      defaultPrice: 120,
      category: 'authentication'
    }
  ];

  // Categories
  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'certificates', name: 'Certificates' },
    { id: 'identification', name: 'Identification' },
    { id: 'authentication', name: 'Authentication' },
    { id: 'government', name: 'Government' }
  ];

  // Status options
  const statusOptions = [
    { id: 'all', name: 'All Status' },
    { id: 'active', name: 'Active' },
    { id: 'inactive', name: 'Inactive' }
  ];

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  // Fetch APIs
  const fetchApis = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${base_url}/api/admin/apis`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        const apiData = response.data.data || [];
        const mergedApis = apiDefinitions.map(def => {
          const existingApi = apiData.find(api => api.apiType === def.id);
          return existingApi ? { 
            ...def, 
            ...existingApi,
            price: existingApi.price || def.defaultPrice,
            status: existingApi.status || 'inactive',
            secretKey: existingApi.secretKey || '',
            usageCount: existingApi.usageCount || 0,
            lastUsed: existingApi.lastUsed || null
          } : { 
            ...def, 
            status: 'inactive', 
            secretKey: '', 
            price: def.defaultPrice,
            usageCount: 0,
            lastUsed: null 
          };
        });
        setApis(mergedApis);
      }
    } catch (error) {
      console.error('Error fetching APIs:', error);
      toast.error('Failed to load APIs');
      setApis(apiDefinitions.map(def => ({ 
        ...def, 
        status: 'inactive', 
        secretKey: '', 
        price: def.defaultPrice,
        usageCount: 0,
        lastUsed: null 
      })));
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await axios.get(`${base_url}/api/admin/apis/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchApis();
    fetchStats();
  }, []);

  // Handle API click
  const handleApiClick = (api) => {
    setSelectedApi(api);
    setShowDetailsModal(true);
  };

  // Handle edit
  const handleEditClick = (api) => {
    setEditingApi(api);
    setShowEditModal(true);
  };

  // Handle delete
  const handleDeleteClick = (api) => {
    setSelectedApi(api);
    setShowDeleteModal(true);
  };

  // Update API
  const handleUpdateApi = async (apiId, updates) => {
    try {
      const response = await axios.put(
        `${base_url}/api/admin/apis/${apiId}`,
        updates,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        toast.success('API updated successfully');
        fetchApis();
        setShowEditModal(false);
        setEditingApi(null);
      }
    } catch (error) {
      console.error('Error updating API:', error);
      toast.error(error.response?.data?.error || 'Failed to update API');
    }
  };

  // Delete API
  const handleDeleteApi = async () => {
    if (!selectedApi) return;

    try {
      const response = await axios.delete(
        `${base_url}/api/admin/apis/${selectedApi.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        toast.success('API deleted successfully');
        fetchApis();
        setShowDeleteModal(false);
        setSelectedApi(null);
      }
    } catch (error) {
      console.error('Error deleting API:', error);
      toast.error(error.response?.data?.error || 'Failed to delete API');
    }
  };

  // Toggle API status
  const toggleApiStatus = async (apiId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await handleUpdateApi(apiId, { status: newStatus });
    } catch (error) {
      toast.error('Failed to toggle API status');
    }
  };

  // Generate secret key
  const generateSecretKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'sk_';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  // Filtered APIs
  const filteredApis = apis.filter(api => {
    const matchesSearch = 
      api.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      api.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      api.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || api.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || api.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedStatus('all');
  };

  // Statistics Cards
  const StatisticsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">Total APIs</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">
              {apis.length}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className="bg-green-500 h-1.5 rounded-full" 
                  style={{ width: `${(apis.filter(a => a.status === 'active').length / apis.length) * 100}%` }}
                ></div>
              </div>
              <span className="text-xs font-medium text-green-600">
                {apis.filter(a => a.status === 'active').length} active
              </span>
            </div>
          </div>
          <div className="p-2 bg-blue-50 rounded-lg">
            <BarChart3 className="w-5 h-5 text-blue-500" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">Total Usage</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">
              {stats?.totalUsage || 0}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              <span className="font-medium text-green-600">+{stats?.dailyUsage || 0}</span> today
            </p>
          </div>
          <div className="p-2 bg-green-50 rounded-lg">
            <Activity className="w-5 h-5 text-green-500" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">Revenue</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">
              ৳{apis.reduce((sum, api) => sum + ((api.usageCount || 0) * (api.price || 0)), 0).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Avg: ৳{(apis.reduce((sum, api) => sum + (api.price || 0), 0) / apis.length).toFixed(2)}
            </p>
          </div>
          <div className="p-2 bg-yellow-50 rounded-lg">
            <DollarSign className="w-5 h-5 text-yellow-500" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">Active Users</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">
              {stats?.activeUsers || 0}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Using APIs right now
            </p>
          </div>
          <div className="p-2 bg-purple-50 rounded-lg">
            <Users className="w-5 h-5 text-purple-500" />
          </div>
        </div>
      </div>
    </div>
  );

  // API Card Component
  const ApiCard = ({ api }) => {
    const statusConfig = {
      active: {
        bg: 'bg-green-100',
        text: 'text-green-700',
        icon: <CheckCircle className="w-3 h-3" />
      },
      inactive: {
        bg: 'bg-red-100',
        text: 'text-red-700',
        icon: <XCircle className="w-3 h-3" />
      },
      pending: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-700',
        icon: <Clock className="w-3 h-3" />
      }
    };

    const status = statusConfig[api.status] || statusConfig.inactive;

    return (
      <div 
        className="group bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer"
        onClick={() => handleApiClick(api)}
      >
        {/* Header */}
        <div className={`p-4 ${api.color} text-white relative`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {api.icon}
              <div>
                <h3 className="text-sm font-bold tracking-tight">{api.name}</h3>
                <p className="text-xs opacity-90 mt-0.5 capitalize">{api.category}</p>
              </div>
            </div>
            <div className={`px-2 py-1 rounded-full ${status.bg} ${status.text} flex items-center gap-1`}>
              <span className="text-xs font-medium capitalize">{api.status}</span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-4">
          <p className="text-xs text-gray-600 mb-4 line-clamp-2">{api.description}</p>
          
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-xs text-gray-500">Price</p>
              <div className="flex items-baseline gap-1">
                <p className="text-lg font-bold text-gray-800">৳{api.price || 0}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleApiStatus(api.id, api.status);
              }}
              className={`flex-1 py-2 px-3 rounded-lg border-[1px] cursor-pointer text-xs font-medium flex items-center justify-center gap-2 transition-colors ${
                api.status === 'active'
                  ? 'bg-red-50 text-red-700 border-red-500 hover:bg-red-100'
                  : 'bg-green-50 text-green-700 border-green-500  hover:bg-green-100'
              }`}
            >
              {api.status === 'active' ? (
                <>
                  <Lock className="w-3 h-3" />
                  Disable
                </>
              ) : (
                <>
                  <Unlock className="w-3 h-3" />
                  Enable
                </>
              )}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEditClick(api);
              }}
              className="flex-1 py-2 px-3 rounded-lg bg-blue-50 cursor-pointer border-[1px] border-blue-500 text-blue-700 hover:bg-blue-100 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Edit className="w-3 h-3" />
              Edit
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Details Modal
  const DetailsModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000] p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg text-white ${selectedApi?.color}`}>
                {selectedApi?.icon}
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">{selectedApi?.name}</h2>
                <p className="text-sm text-gray-600 capitalize">{selectedApi?.category}</p>
              </div>
            </div>
            <button
              onClick={() => setShowDetailsModal(false)}
              className="p-1.5 cursor-pointer  rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* API Details */}
          <div className="space-y-4">
            {/* Secret Key */}
            <div className="bg-gray-50 rounded-lg p-4 border-[1px] border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-gray-600" />
                  <label className="text-sm font-medium text-gray-700">Secret Key</label>
                </div>
                <button
                  onClick={() => copyToClipboard(selectedApi?.secretKey || '')}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  Copy
                </button>
              </div>
              <div className="relative">
                <input
                  type="password"
                  value={selectedApi?.secretKey || ''}
                  readOnly
                  className="w-full px-3 py-2 pr-10 bg-white border border-gray-300 rounded-md text-xs font-mono"
                />
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    const input = e.target.closest('.relative').querySelector('input');
                    input.type = input.type === 'password' ? 'text' : 'password';
                  }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Price and Usage */}
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-gray-50 border-[1px] border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FaBangladeshiTakaSign className="w-4 h-4 text-gray-600" />
                  <label className="text-sm font-medium text-gray-700">Price</label>
                </div>
                <div className="flex items-baseline gap-1">
                  <p className="text-2xl font-bold text-gray-800">৳{selectedApi?.price || 0}</p>
                  <span className="text-sm text-gray-500">per request</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6 pt-2">
            <button
              onClick={() => {
                handleEditClick(selectedApi);
                setShowDetailsModal(false);
              }}
              className="flex-1 py-2.5 bg-blue-600 cursor-pointer text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Edit API
            </button>
            <button
              onClick={() => handleDeleteClick(selectedApi)}
              className="flex-1 py-2.5 border border-red-300 cursor-pointer text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
            >
              Delete
            </button>
            <button
              onClick={() => setShowDetailsModal(false)}
              className="flex-1 py-2.5 border border-gray-300 cursor-pointer text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Edit Modal
  const EditModal = () => {
    const [formData, setFormData] = useState({
      price: editingApi?.price || 0,
      status: editingApi?.status || 'inactive',
      secretKey: editingApi?.secretKey || '',
      description: editingApi?.description || ''
    });

    useEffect(() => {
      if (editingApi) {
        setFormData({
          price: editingApi.price || 0,
          status: editingApi.status || 'inactive',
          secretKey: editingApi.secretKey || '',
          description: editingApi.description || ''
        });
      }
    }, [editingApi]);

    const handleSubmit = (e) => {
      e.preventDefault();
      handleUpdateApi(editingApi.id, formData);
    };

    const generateNewKey = () => {
      setFormData(prev => ({
        ...prev,
        secretKey: generateSecretKey()
      }));
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10001] p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg text-white ${editingApi?.color}`}>
                  {editingApi?.icon}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Edit {editingApi?.name}</h2>
                  <p className="text-sm text-gray-600">Update API settings</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingApi(null);
                }}
                className="p-1.5 cursor-pointer transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price per Request (৳)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-theme_color2"
                    min="0"
                    step="0.01"
                    required
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">BDT</span>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <div className="flex gap-2">
                  {['active', 'inactive'].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, status }))}
                      className={`flex-1 py-2 px-3 cursor-pointer rounded-lg border text-sm font-medium ${
                        formData.status === status
                          ? status === 'active'
                            ? 'bg-green-50 border-green-500 text-green-700'
                            : 'bg-red-50 border-red-500 text-red-700'
                          : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {status === 'active' ? 'Active' : 'Inactive'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Secret Key */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Secret Key
                  </label>
                  <button
                    type="button"
                    onClick={generateNewKey}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Generate
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.secretKey}
                    onChange={(e) => setFormData(prev => ({ ...prev, secretKey: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-theme_color2 text-xs font-mono"
                    placeholder=""
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 cursor-pointer text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingApi(null);
                  }}
                  className="flex-1 py-2.5 border border-gray-300 cursor-pointer text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  // Delete Modal
  const DeleteModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10002] p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">Delete API</h2>
              <p className="text-sm text-gray-600">This action cannot be undone</p>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm font-medium text-red-800 mb-1">Warning</p>
            <p className="text-sm text-red-700">
              Deleting "{selectedApi?.name}" will permanently remove all associated data.
              Users will no longer be able to access this API.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleDeleteApi}
              className="flex-1 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              Delete API
            </button>
            <button
              onClick={() => setShowDeleteModal(false)}
              className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="font-anek text-gray-700 lg:ml-72 mt-[9vh]">
      <Header toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />
      <Toaster position="top-right" />

      <main className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="w-full mx-auto">
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-gray-800">API Management</h1>
                <p className="text-sm text-gray-600 mt-1">Manage all available APIs and their configurations</p>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mb-6 space-y-3">
            {/* Main Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search APIs by name, description, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {(searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all') && (
                <button
                  onClick={clearFilters}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Results Info */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">
              Showing <span className="font-medium">{filteredApis.length}</span> of <span className="font-medium">{apis.length}</span> APIs
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {selectedCategory !== 'all' && `${selectedCategory} • `}
                {selectedStatus !== 'all' && `${selectedStatus} • `}
                {searchTerm && `"${searchTerm}"`}
              </span>
            </div>
          </div>

          {/* API Grid */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <ApertureLoader/>
            </div>
          ) : filteredApis.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <Shield className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-medium text-gray-700">No APIs found</h3>
              <p className="text-gray-500 text-sm mt-1">Try adjusting your search or filters</p>
              <button
                onClick={clearFilters}
                className="mt-4 px-4 py-2 text-sm text-blue-600 hover:text-blue-800 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredApis.map((api) => (
                <ApiCard key={api.id} api={api} />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {showDetailsModal && <DetailsModal />}
      {showEditModal && <EditModal />}
      {showDeleteModal && <DeleteModal />}
    </div>
  );
}

export default APIlist;