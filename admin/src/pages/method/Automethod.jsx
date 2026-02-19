import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../../components/header/Header';
import Sidebar from '../../components/sidebar/Sidebar';
import toast, { Toaster } from 'react-hot-toast';
import ApertureLoader from '../../components/loader/ApertureLoader';

function Automethod() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [status, setStatus] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const token = localStorage.getItem('adminToken');

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  // Get status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await axios.get(`${base_url}/api/admin/auto-method`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setStatus(res.data.status);
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
      const res = await axios.patch(`${base_url}/api/admin/auto-method/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setStatus(res.data.status);
        toast.success(res.data.message);
      }
    } catch (error) {
      toast.error('Failed to toggle');
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
            <h1 className="text-2xl font-bold text-teal-600">Auto Payment Method</h1>
            <p className="text-gray-600">Turn ON/OFF automatic deposit processing</p>
          </div>

          {/* Status Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
            {loading ? (
              <div className="text-center py-8">
               <ApertureLoader/>
              </div>
            ) : (
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
                  {status ? 'ACTIVE' : 'INACTIVE'}
                </h2>
                <p className="text-gray-600 text-center mb-8">
                  {status 
                    ? 'Auto payment system is ON. Deposits are processed automatically.'
                    : 'Auto payment system is OFF. Deposits need manual approval.'}
                </p>

                {/* Toggle Button */}
                <button
                  onClick={toggleStatus}
                  disabled={updating}
                  className={`px-12 py-4 rounded-lg text-white font-bold text-lg transition-all transform hover:scale-105 ${
                    status 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-green-600 hover:bg-green-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {updating ? 'Processing...' : status ? 'TURN OFF' : 'TURN ON'}
                </button>

                {/* Simple Toggle Switch Alternative */}
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
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Automethod;