import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../../components/header/Header';
import Sidebar from '../../components/sidebar/Sidebar';
import toast, { Toaster } from 'react-hot-toast';
import ApertureLoader from '../../components/loader/ApertureLoader';

function WebsiteStatus() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [status, setStatus] = useState(false);
  const [message, setMessage] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [messageUpdating, setMessageUpdating] = useState(false);
  const [showMessageInput, setShowMessageInput] = useState(false);

  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const token = localStorage.getItem('adminToken');

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  // Get status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await axios.get(`${base_url}/api/admin/website-status`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setStatus(res.data.data.isActive);
          setMessage(res.data.data.message || '');
          setNewMessage(res.data.data.message || '');
        }
      } catch (error) {
        toast.error('Failed to load status');
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, []);

  // Toggle status
  const toggleStatus = async () => {
    try {
      setUpdating(true);
      const res = await axios.patch(`${base_url}/api/admin/website-status/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setStatus(res.data.data.isActive);
        setMessage(res.data.data.message);
        setNewMessage(res.data.data.message);
        toast.success(res.data.message);
      }
    } catch (error) {
      toast.error('Failed to toggle status');
    } finally {
      setUpdating(false);
    }
  };

  // Update message
  const updateMessage = async () => {
    if (!newMessage.trim()) {
      toast.error('Message cannot be empty');
      return;
    }

    try {
      setMessageUpdating(true);
      const res = await axios.patch(
        `${base_url}/api/admin/website-status/message`,
        { message: newMessage.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setMessage(res.data.data.message);
        setNewMessage(res.data.data.message);
        setShowMessageInput(false);
        toast.success('Maintenance message updated');
      }
    } catch (error) {
      toast.error('Failed to update message');
    } finally {
      setMessageUpdating(false);
    }
  };

  // Direct update status with boolean
  const setWebsiteStatus = async (active) => {
    try {
      setUpdating(true);
      const res = await axios.put(
        `${base_url}/api/admin/website-status`,
        { isActive: active, message: message },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setStatus(res.data.data.isActive);
        setMessage(res.data.data.message);
        setNewMessage(res.data.data.message);
        toast.success(res.data.message);
      }
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="font-anek text-gray-700 lg:ml-72 mt-[9vh]">
      <Header toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />
      <Toaster position="top-right" />

      <main className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-teal-600">Website Status Management</h1>
            <p className="text-gray-600">Control website visibility and maintenance messages</p>
          </div>

          {loading ? (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
              <div className="text-center py-8">
                <ApertureLoader />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Status Card */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
                <div className="flex flex-col items-center">
                  {/* Status Icon */}
                  <div className={`p-6 rounded-full mb-4 ${
                    status ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {status ? (
                      <svg className="w-16 h-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-16 h-16 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>

                  {/* Status Text */}
                  <h2 className="text-3xl font-bold mb-2">
                    {status ? 'WEBSITE ACTIVE' : 'MAINTENANCE MODE'}
                  </h2>
                  
                  {/* Display current message if in maintenance */}
                  {!status && message && (
                    <div className="bg-gray-100 p-4 rounded-lg mb-4 max-w-md text-center">
                      <p className="text-sm text-gray-500 mb-1">Current Maintenance Message:</p>
                      <p className="text-gray-700 font-medium">{message}</p>
                    </div>
                  )}

                  <p className="text-gray-600 text-center mb-8">
                    {status 
                      ? 'Website is accessible to all visitors.'
                      : 'Website is in maintenance mode. Visitors see the maintenance page with your message.'}
                  </p>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <button
                      onClick={toggleStatus}
                      disabled={updating}
                      className={`px-8 py-3 rounded-lg text-white font-bold transition-all transform hover:scale-105 ${
                        status 
                          ? 'bg-red-600 hover:bg-red-700' 
                          : 'bg-green-600 hover:bg-green-700'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {updating ? 'Processing...' : status ? 'ENTER MAINTENANCE' : 'ACTIVATE WEBSITE'}
                    </button>

                    {!status && (
                      <button
                        onClick={() => setShowMessageInput(!showMessageInput)}
                        className="px-8 py-3 rounded-lg font-bold bg-blue-600 text-white hover:bg-blue-700 transition-all transform hover:scale-105"
                      >
                        {showMessageInput ? 'CANCEL' : 'UPDATE MESSAGE'}
                      </button>
                    )}
                  </div>

                  {/* Message Input Field */}
                  {showMessageInput && !status && (
                    <div className="w-full border-t border-gray-200 pt-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maintenance Message
                      </label>
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        placeholder="Enter maintenance message..."
                      />
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={updateMessage}
                          disabled={messageUpdating}
                          className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
                        >
                          {messageUpdating ? 'Updating...' : 'Save Message'}
                        </button>
                        <button
                          onClick={() => {
                            setShowMessageInput(false);
                            setNewMessage(message);
                          }}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Quick Action Buttons */}
                  <div className="mt-6 flex gap-4">
                    <button
                      onClick={() => setWebsiteStatus(true)}
                      disabled={updating || status}
                      className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50"
                    >
                      Set Active
                    </button>
                    <button
                      onClick={() => setWebsiteStatus(false)}
                      disabled={updating || !status}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50"
                    >
                      Set Maintenance
                    </button>
                  </div>

                  {/* Toggle Switch */}
                  <div className="mt-6 flex items-center gap-3">
                    <span className={`text-sm ${!status ? 'font-bold text-gray-900' : 'text-gray-500'}`}>
                      OFF
                    </span>
                    <button
                      onClick={toggleStatus}
                      disabled={updating}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        status ? 'bg-green-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          status ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className={`text-sm ${status ? 'font-bold text-gray-900' : 'text-gray-500'}`}>
                      ON
                    </span>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default WebsiteStatus;