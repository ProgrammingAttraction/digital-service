import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../../components/header/Header';
import Sidebar from '../../components/sidebar/Sidebar';
import toast, { Toaster } from 'react-hot-toast';
import ApertureLoader from '../../components/loader/ApertureLoader';
import { FaUserPlus, FaUserCheck, FaUserTimes, FaEdit, FaSave, FaTimes } from 'react-icons/fa';

function RegistrationStatus() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [message, setMessage] = useState('');
  const [originalMessage, setOriginalMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editingMessage, setEditingMessage] = useState(false);

  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const token = localStorage.getItem('adminToken');

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  // Get registration status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await axios.get(`${base_url}/api/admin/registration-status`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setIsActive(res.data.data.isActive);
          setMessage(res.data.data.message);
          setOriginalMessage(res.data.data.message);
        }
      } catch (error) {
        toast.error('Failed to load registration status');
        console.error('Fetch error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, []);

  // Toggle registration status
  const toggleStatus = async () => {
    try {
      setUpdating(true);
      const res = await axios.patch(`${base_url}/api/admin/registration-status/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setIsActive(res.data.data.isActive);
        setMessage(res.data.data.message);
        setOriginalMessage(res.data.data.message);
        toast.success(res.data.message);
      }
    } catch (error) {
      toast.error('Failed to toggle registration status');
      console.error('Toggle error:', error);
    } finally {
      setUpdating(false);
    }
  };

  // Update registration status with custom settings
  const updateStatus = async (newStatus, newMessage) => {
    try {
      setUpdating(true);
      const res = await axios.put(`${base_url}/api/admin/registration-status`, {
        isActive: newStatus,
        message: newMessage
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setIsActive(res.data.data.isActive);
        setMessage(res.data.data.message);
        setOriginalMessage(res.data.data.message);
        setEditingMessage(false);
        toast.success(res.data.message);
      }
    } catch (error) {
      toast.error('Failed to update registration status');
      console.error('Update error:', error);
    } finally {
      setUpdating(false);
    }
  };

  // Update only the message
  const updateMessage = async () => {
    if (message.trim() === '') {
      toast.error('Message cannot be empty');
      return;
    }
    
    try {
      setUpdating(true);
      const res = await axios.patch(`${base_url}/api/admin/registration-status/message`, {
        message: message.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setMessage(res.data.data.message);
        setOriginalMessage(res.data.data.message);
        setEditingMessage(false);
        toast.success('Message updated successfully');
      }
    } catch (error) {
      toast.error('Failed to update message');
      console.error('Message update error:', error);
    } finally {
      setUpdating(false);
    }
  };

  // Enable registration
  const enableRegistration = async () => {
    try {
      setUpdating(true);
      const res = await axios.post(`${base_url}/api/admin/registration-status/enable`, {
        message: message
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setIsActive(res.data.data.isActive);
        setMessage(res.data.data.message);
        setOriginalMessage(res.data.data.message);
        toast.success(res.data.message);
      }
    } catch (error) {
      toast.error('Failed to enable registration');
      console.error('Enable error:', error);
    } finally {
      setUpdating(false);
    }
  };

  // Disable registration
  const disableRegistration = async () => {
    try {
      setUpdating(true);
      const res = await axios.post(`${base_url}/api/admin/registration-status/disable`, {
        message: message
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setIsActive(res.data.data.isActive);
        setMessage(res.data.data.message);
        setOriginalMessage(res.data.data.message);
        toast.success(res.data.message);
      }
    } catch (error) {
      toast.error('Failed to disable registration');
      console.error('Disable error:', error);
    } finally {
      setUpdating(false);
    }
  };

  const cancelEdit = () => {
    setMessage(originalMessage);
    setEditingMessage(false);
  };

  return (
    <div className="font-anek text-gray-700 lg:ml-72 mt-[9vh]">
      <Header toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />
      <Toaster position="top-right" />

      <main className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-teal-600">Registration Page Management</h1>
              <p className="text-gray-600">Control user registration - Open or Close registration</p>
            </div>
            <div className="flex gap-2">
              {!loading && (
                <>
                  {isActive ? (
                    <button
                      onClick={disableRegistration}
                      disabled={updating}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2 text-sm disabled:opacity-50"
                    >
                      <FaUserTimes /> Close Registration
                    </button>
                  ) : (
                    <button
                      onClick={enableRegistration}
                      disabled={updating}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 text-sm disabled:opacity-50"
                    >
                      <FaUserCheck /> Open Registration
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Main Status Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="text-center py-16">
                <ApertureLoader />
              </div>
            ) : (
              <>
                {/* Status Banner */}
                <div className={`p-6 text-center ${
                  isActive ? 'bg-green-50 border-b border-green-200' : 'bg-red-50 border-b border-red-200'
                }`}>
                  <div className="inline-flex items-center gap-3 mb-2">
                    <div className={`p-3 rounded-full ${
                      isActive ? 'bg-green-200' : 'bg-red-200'
                    }`}>
                      {isActive ? (
                        <FaUserCheck className={`w-8 h-8 text-green-700`} />
                      ) : (
                        <FaUserTimes className={`w-8 h-8 text-red-700`} />
                      )}
                    </div>
                    <h2 className={`text-3xl font-bold ${
                      isActive ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {isActive ? 'REGISTRATION OPEN' : 'REGISTRATION CLOSED'}
                    </h2>
                  </div>
                  <p className="text-gray-600">
                    {isActive 
                      ? 'New users can register and create accounts.'
                      : 'New user registration is currently disabled.'}
                  </p>
                </div>

                {/* Message Section */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-gray-700">Display Message</h3>
                    {!editingMessage && (
                      <button
                        onClick={() => setEditingMessage(true)}
                        className="text-teal-600 hover:text-teal-800 flex items-center gap-1 text-sm"
                      >
                        <FaEdit /> Edit Message
                      </button>
                    )}
                  </div>

                  {editingMessage ? (
                    <div className="space-y-3">
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        rows="3"
                        placeholder="Enter message to display when registration is closed..."
                        disabled={updating}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={updateMessage}
                          disabled={updating || message.trim() === ''}
                          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg flex items-center gap-2 text-sm disabled:opacity-50"
                        >
                          <FaSave /> Save Message
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={updating}
                          className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg flex items-center gap-2 text-sm disabled:opacity-50"
                        >
                          <FaTimes /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="text-gray-700 italic">
                        "{message || 'Registration is currently closed. Please try again later.'}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="p-6 bg-gray-50">
                  <h3 className="font-semibold text-gray-700 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                      onClick={toggleStatus}
                      disabled={updating}
                      className={`p-4 rounded-lg border-2 transition-all flex items-center justify-center gap-3 ${
                        isActive 
                          ? 'border-red-300 bg-red-50 hover:bg-red-100 text-red-700' 
                          : 'border-green-300 bg-green-50 hover:bg-green-100 text-green-700'
                      } disabled:opacity-50`}
                    >
                      {isActive ? <FaUserTimes size={20} /> : <FaUserCheck size={20} />}
                      <span className="font-medium">
                        {isActive ? 'Close Registration' : 'Open Registration'}
                      </span>
                    </button>
                    
                    <button
                      onClick={() => window.location.href = '/admin/users/all'}
                      className="p-4 rounded-lg border-2 border-teal-300 bg-teal-50 hover:bg-teal-100 text-teal-700 transition-all flex items-center justify-center gap-3"
                    >
                      <FaUserPlus size={20} />
                      <span className="font-medium">View All Users</span>
                    </button>
                  </div>
                </div>

                {/* Toggle Switch Alternative */}
                <div className="p-6 border-t border-gray-200 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-700">Registration Status</p>
                    <p className="text-sm text-gray-500">Toggle to quickly open/close registration</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm ${!isActive ? 'font-bold text-gray-900' : 'text-gray-500'}`}>
                      CLOSED
                    </span>
                    <button
                      onClick={toggleStatus}
                      disabled={updating}
                      className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
                        isActive ? 'bg-green-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                          isActive ? 'translate-x-8' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className={`text-sm ${isActive ? 'font-bold text-gray-900' : 'text-gray-500'}`}>
                      OPEN
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default RegistrationStatus;