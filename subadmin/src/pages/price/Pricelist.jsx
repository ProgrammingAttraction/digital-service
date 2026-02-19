import React, { useState, useEffect } from 'react';
import { 
  Search,
  RefreshCw,
  Save,
  CheckCircle,
  FileText,
  AlertCircle
} from 'lucide-react';
import axios from 'axios';
import Header from '../../components/header/Header';
import Sidebar from '../../components/sidebar/Sidebar';
import toast, { Toaster } from 'react-hot-toast';
import { FaBangladeshiTakaSign } from "react-icons/fa6";

function Pricelist() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pricelist, setPricelist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedServices, setSelectedServices] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [selectedCount, setSelectedCount] = useState(0);

  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const token = localStorage.getItem('adminToken');

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  // Default services from the image
const defaultServices = [
  // Government Services
  { name: "এনআইডি মেক", price: "0", isActive: true },
  { name: "স্মার্ট  কাড PDF মেক", price: "0", isActive: true },
  { name: "মৃত্যনিবন্ধন", price: "0", isActive: true },
  { name: "ম্যানুয়ালি জন্মানিবন্ধন মেক", price: "0", isActive: true },
  { name: "অটো জন্মানিবন্ধন মেক", price: "0", isActive: true },
  { name: "সার্ভার কপি Unofficial", price: "0", isActive: true },
  { name: "সাইন টু সার্ভার কপি", price: "0", isActive: true },
  { name: "টিন সার্টিকেট", price: "0", isActive: true },
  { name: "ভূমি উন্নয়ন কর", price: "0", isActive: true },
  { name: "পুলিশ ক্লিয়ারেন্স ক্লোন", price: "0", isActive: true },
  { name: "উত্তরাধিকার সনদ", price: "0", isActive: true },
  { name: "তাকামূল সাটিফিকেট ক্লোন", price: "0", isActive: true },
  { name: "সুরক্ষা ক্লোন", price: "0", isActive: true },
  { name: "ট্রেড লাইসেন্স ক্লোন", price: "0", isActive: true },
  { name: "রিটার্ন ক্লোন", price: "0", isActive: true },
  { name: "একনলেজ রিটার্ন ক্লোন", price: "0", isActive: true },
  { name: "নাগরিক সনদ", price: "0", isActive: true },
  { name: "টিন সাটিফিকেট ক্লোন", price: "0", isActive: true },
  { name: "এসএসসি সাটিফিকেট ক্লোন", price: "0", isActive: true },
  { name: "এইচএসসি সাটিফিকেট ক্লোন", price: "0", isActive: true },
  
  // FORM Services (from first image)
  { name: "FORM No", price: "0", isActive: true },
  { name: "NID No", price: "0", isActive: true },
  { name: "Birth Number", price: "0", isActive: true },
  { name: "Voter Number", price: "0", isActive: true },
  
  // Mobile Recharge Services (from second image)
  { name: "banglalink", price: "0", isActive: true },
  { name: "Robi", price: "0", isActive: true },
  { name: "Teletalk", price: "0", isActive: true },
  
  // Cool Limit Services (from third image)
  { name: "কল লিমিটে ৩ মাস", price: "0", isActive: true },
  { name: "কল লিমিটে ৬ মাস", price: "0", isActive: true },
  
  // Passport Services (from fourth image)
  { name: "ই-পাসপাউ", price: "0", isActive: true },
  { name: "এফআরসি পাসপোর্ট", price: "0", isActive: true },
];
  // Fetch price list from API or use defaults
  const fetchPriceList = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${base_url}/api/sub-admin/pricelist`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success && response.data.data.length > 0) {
        // Transform API data to match component structure
        const transformedData = response.data.data.map(item => ({
          id: item._id,
          name: item.name,
          price: item.price !== undefined ? item.price.toString() : "0",
          isChecked: false,
          isActive: item.isActive
        }));
        setPricelist(transformedData);
      } else {
        // If no data from API, use default services
        const defaultData = defaultServices.map((service, index) => ({
          id: `default-${index}`,
          name: service.name,
          price: service.price,
          isChecked: false,
          isActive: service.isActive
        }));
        setPricelist(defaultData);
        
        // Optionally save defaults to API
        setTimeout(() => saveDefaultsToAPI(defaultData), 1000);
      }
    } catch (error) {
      console.error('Error fetching price list:', error);
      
      // On error, use default services
      const defaultData = defaultServices.map((service, index) => ({
        id: `default-${index}`,
        name: service.name,
        price: service.price,
        isChecked: false,
        isActive: service.isActive
      }));
      setPricelist(defaultData);
      
      toast.error('Failed to load price list. Using default services.');
    } finally {
      setLoading(false);
    }
  };

  // Save default services to API
  const saveDefaultsToAPI = async (defaultData) => {
    if (!token) return;
    
    try {
      // Create default services in API
      for (const service of defaultServices) {
        await axios.post(
          `${base_url}/api/sub-admin/pricelist`,
          {
            name: service.name,
            price: parseFloat(service.price) || 0,
            isActive: service.isActive
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
      }
      console.log('Default services saved to API');
    } catch (error) {
      console.error('Error saving defaults to API:', error);
    }
  };

  // Calculate total amount and selected count whenever pricelist changes
  useEffect(() => {
    const selected = pricelist.filter(item => item.isChecked);
    const total = selected.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      return sum + price;
    }, 0);
    setTotalAmount(total);
    setSelectedCount(selected.length);
    setSelectedServices(selected.map(item => item.id));
  }, [pricelist]);

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '৳ 0';
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0
    }).format(amount).replace('BDT', '৳');
  };

  // Handle price change
  const handlePriceChange = (id, value) => {
    // Allow only numbers and decimal point
    const numericValue = value.replace(/[^\d.]/g, '');
    // Ensure only one decimal point
    const parts = numericValue.split('.');
    if (parts.length > 2) return;
    
    setPricelist(prev => prev.map(item => 
      item.id === id ? { ...item, price: numericValue } : item
    ));
  };

  // Toggle service selection
  const toggleServiceSelection = (id) => {
    setPricelist(prev => prev.map(item => 
      item.id === id ? { ...item, isChecked: !item.isChecked } : item
    ));
  };

  // Select all services
  const selectAllServices = () => {
    const allSelected = pricelist.every(item => item.isChecked);
    setPricelist(prev => prev.map(item => ({ 
      ...item, 
      isChecked: !allSelected 
    })));
  };

  // Handle save price
  const handleSavePrice = async (id) => {
    const service = pricelist.find(item => item.id === id);
    if (!service) return;

    // Check if it's a default service (not saved to API yet)
    if (id.startsWith('default-')) {
      // For default services, add them to API
      try {
        setLoading(true);
        const response = await axios.post(
          `${base_url}/api/sub-admin/pricelist`,
          {
            name: service.name,
            price: parseFloat(service.price) || 0,
            isActive: service.isActive
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data.success) {
          toast.success(`Service added: ${service.name}`);
          // Refresh the list to get the real ID from API
          fetchPriceList();
        }
      } catch (error) {
        console.error('Error saving default service:', error);
        toast.error(error.response?.data?.error || 'Failed to save service');
      } finally {
        setLoading(false);
      }
      return;
    }

    // For existing services, update price
    try {
      setLoading(true);
      const priceValue = service.price ? parseFloat(service.price) : 0;
      const response = await axios.patch(
        `${base_url}/api/sub-admin/pricelist/${id}/price`,
        { price: priceValue },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        toast.success(`Price saved for ${service.name}`);
        // Refresh the list to get updated data
        fetchPriceList();
      }
    } catch (error) {
      console.error('Error saving price:', error);
      toast.error(error.response?.data?.error || 'Failed to save price');
    } finally {
      setLoading(false);
    }
  };

  // Handle save all
  const handleSaveAll = async () => {
    try {
      setSaving(true);
      
      // Filter out default services that need to be created first
      const defaultServicesToCreate = pricelist.filter(item => item.id.startsWith('default-'));
      const existingServices = pricelist.filter(item => !item.id.startsWith('default-'));
      
      // Create default services first
      for (const service of defaultServicesToCreate) {
        await axios.post(
          `${base_url}/api/sub-admin/pricelist`,
          {
            name: service.name,
            price: parseFloat(service.price) || 0,
            isActive: service.isActive
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
      }
      
      // Prepare bulk update data for existing services
      if (existingServices.length > 0) {
        const priceUpdates = existingServices.map(item => ({
          id: item.id,
          price: parseFloat(item.price) || 0
        }));
        
        const response = await axios.put(
          `${base_url}/api/sub-admin/pricelist/bulk/price`,
          { priceUpdates },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data.success) {
          const createdCount = defaultServicesToCreate.length;
          const updatedCount = response.data.data?.modifiedCount || 0;
          toast.success(`Successfully saved ${createdCount + updatedCount} price(s)`);
        }
      } else if (defaultServicesToCreate.length > 0) {
        toast.success(`Successfully created ${defaultServicesToCreate.length} service(s)`);
      }
      
      // Refresh the list to get updated data
      fetchPriceList();
    } catch (error) {
      console.error('Error saving all prices:', error);
      toast.error(error.response?.data?.error || 'Failed to save prices');
    } finally {
      setSaving(false);
    }
  };

  // Handle bulk delete selected services
  const handleBulkDelete = async () => {
    if (selectedServices.length === 0) {
      toast.error('Please select services to delete');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedServices.length} selected services?`)) {
      return;
    }

    // Filter out default services (they're not in API yet)
    const defaultServicesToRemove = selectedServices.filter(id => id.startsWith('default-'));
    const apiServicesToDelete = selectedServices.filter(id => !id.startsWith('default-'));
    
    // Remove default services from state
    if (defaultServicesToRemove.length > 0) {
      setPricelist(prev => prev.filter(item => !defaultServicesToRemove.includes(item.id)));
    }
    
    // Delete API services
    if (apiServicesToDelete.length > 0) {
      try {
        setLoading(true);
        const response = await axios.post(
          `${base_url}/api/sub-admin/pricelist/bulk-delete`,
          { ids: apiServicesToDelete },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data.success) {
          toast.success(`Successfully deleted ${response.data.data.deletedCount + defaultServicesToRemove.length} service(s)`);
        }
      } catch (error) {
        console.error('Error bulk deleting services:', error);
        toast.error(error.response?.data?.error || 'Failed to delete services');
      } finally {
        setLoading(false);
      }
    } else if (defaultServicesToRemove.length > 0) {
      toast.success(`Removed ${defaultServicesToRemove.length} default service(s)`);
    }
    
    // Clear selected services
    setSelectedServices([]);
  };

  // Toggle service active status
  const handleToggleStatus = async (id) => {
    // For default services, just update state
    if (id.startsWith('default-')) {
      setPricelist(prev => prev.map(item => 
        item.id === id ? { ...item, isActive: !item.isActive } : item
      ));
      toast.success('Service status updated locally');
      return;
    }

    // For API services
    try {
      setLoading(true);
      const response = await axios.patch(
        `${base_url}/api/sub-admin/pricelist/${id}/toggle-status`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        toast.success(`Service status changed to ${response.data.data.isActive ? 'active' : 'inactive'}`);
        // Refresh the list
        fetchPriceList();
      }
    } catch (error) {
      console.error('Error toggling service status:', error);
      toast.error(error.response?.data?.error || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  // Add new service
  const handleAddService = async () => {
    const newServiceName = prompt('Enter new service name:');
    if (!newServiceName || newServiceName.trim() === '') return;

    try {
      setLoading(true);
      const response = await axios.post(
        `${base_url}/api/sub-admin/pricelist`,
        {
          name: newServiceName.trim(),
          price: 0,
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
        toast.success('Service added successfully');
        fetchPriceList();
      }
    } catch (error) {
      console.error('Error adding service:', error);
      toast.error(error.response?.data?.error || 'Failed to add service');
    } finally {
      setLoading(false);
    }
  };

  // Filter services based on search term
  const filteredServices = pricelist.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Load price list on component mount
  useEffect(() => {
    fetchPriceList();
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
            <h1 className="text-2xl font-bold text-teal-600 mb-1">Price List Management</h1>
            <p className="text-gray-600 mt-1">Manage service prices and configurations</p>
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
                      placeholder="Search services..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme_color2"
                    />
                  </div>

                  {/* Selected Count Badge */}
                  {selectedCount > 0 && (
                    <div className="flex items-center bg-blue-50 border-[1px] border-blue-500 rounded-lg px-3 py-1.5">
                      <span className="text-sm font-medium text-blue-700">
                        {selectedCount} selected • Total: {formatCurrency(totalAmount)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  {/* Save All Button */}
                  <button
                    onClick={handleSaveAll}
                    disabled={saving || loading}
                    className={`inline-flex items-center px-4 py-2 gap-2 cursor-pointer rounded-lg transition-colors duration-200 ${
                      saving || loading
                        ? 'bg-blue-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {saving ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save All
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Price List Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
                  <h3 className="text-lg font-medium text-gray-700">Loading price list...</h3>
                </div>
              ) : filteredServices.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-700">No services found</h3>
                  <p className="text-gray-500 mt-1">Try adjusting your search or add a new service</p>
                  <button
                    onClick={handleAddService}
                    className="mt-4 px-4 py-2 bg-teal-600 cursor-pointer text-white rounded-lg hover:bg-teal-700 transition-colors duration-200"
                  >
                    Add New Service
                  </button>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={pricelist.every(item => item.isChecked) && pricelist.length > 0}
                          onChange={selectAllServices}
                          className="rounded border-gray-300"
                          disabled={loading}
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Service Name
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Price (৳)
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredServices.map((service) => (
                      <tr key={service.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={service.isChecked}
                            onChange={() => toggleServiceSelection(service.id)}
                            className="rounded border-gray-300"
                            disabled={loading}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center mr-3 ${
                              service.isChecked ? 'bg-green-100' : 'bg-gray-100'
                            }`}>
                              {service.isChecked ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              ) : (
                                <FileText className="h-5 w-5 text-gray-400" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{service.name}</div>
                              {service.id.startsWith('default-') && (
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                  Default Service
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaBangladeshiTakaSign className="text-gray-400" />
                              </div>
                              <input
                                type="text"
                                value={service.price}
                                onChange={(e) => handlePriceChange(service.id, e.target.value)}
                                className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-32"
                                placeholder="0"
                                disabled={loading}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleSavePrice(service.id)}
                              disabled={loading}
                              className={`inline-flex items-center px-3 py-1.5 text-sm rounded-lg transition-colors duration-150 ${
                                loading
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  : 'bg-blue-600 text-white hover:bg-blue-700'
                              }`}
                            >
                              <Save className="w-4 h-4 mr-1" />
                              {service.id.startsWith('default-') ? 'Add' : 'Save'}
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
            {filteredServices.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {filteredServices.length} of {pricelist.length} services
                    {selectedCount > 0 && ` • ${selectedCount} selected`}
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-sm">
                      <span className="text-gray-600">Active Services:</span>
                      <span className="font-semibold ml-2">{pricelist.filter(item => item.isActive).length}</span>
                    </div>
                    {selectedCount > 0 && (
                      <div className="text-sm">
                        <span className="text-gray-600">Selected Amount:</span>
                        <span className="font-semibold text-green-600 ml-2">{formatCurrency(totalAmount)}</span>
                      </div>
                    )}
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

export default Pricelist;