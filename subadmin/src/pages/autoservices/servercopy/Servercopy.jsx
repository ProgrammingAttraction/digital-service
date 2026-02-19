import React, { useState } from 'react';
import Header from '../../../components/header/Header';
import Sidebar from '../../../components/sidebar/Sidebar';

function Servercopy() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copyType, setCopyType] = useState('old'); // Default as per image

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="font-anek text-gray-700 lg:ml-72 mt-[9vh]">
      <Header toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />

      <main className="min-h-[91vh] bg-[#f4f6f9] p-4 md:p-6 flex flex-col items-center">
        
        {/* Page Title - Top Left Style */}
        <div className="w-full max-w-4xl self-start mb-10">
           <h1 className="text-[#1abc9c] text-lg font-bold">সার্ভার কপি আন-অফিসিয়াল</h1>
        </div>

        <div className="w-full max-w-2xl bg-white p-8 md:p-12 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center">
          
          {/* Header Title */}
          <h2 className="text-[#1abc9c] text-2xl font-bold mb-6">সার্ভার কপি টাইপ</h2>

          {/* Copy Type Selection - Radio Buttons */}
          <div className="flex flex-col gap-3 mb-8 w-full items-center">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-600">
              <input 
                type="radio" 
                name="copyType" 
                checked={copyType === 'old'} 
                onChange={() => setCopyType('old')}
                className="accent-[#1abc9c] w-4 h-4" 
              />
              Old (With QR Code)
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-600">
              <input 
                type="radio" 
                name="copyType" 
                checked={copyType === 'new_no_qr'} 
                onChange={() => setCopyType('new_no_qr')}
                className="accent-[#1abc9c] w-4 h-4" 
              />
              New (Without QR Code)
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-600">
              <input 
                type="radio" 
                name="copyType" 
                checked={copyType === 'new_dark'} 
                onChange={() => setCopyType('new_dark')}
                className="accent-[#1abc9c] w-4 h-4" 
              />
              New (Dark Background)
            </label>
          </div>

          {/* Form Fields */}
          <div className="w-full space-y-5">
            <div className="flex flex-col">
              <label className="text-xs font-bold text-gray-700 mb-1">
                এনআইডি নম্বর <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                placeholder="10/13/17 Digit Nid" 
                className="w-full border border-gray-300 rounded-md py-2 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#1abc9c] bg-white"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-bold text-gray-700 mb-1">
                জন্ম তারিখ <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                placeholder="DD-MM-YYYY" 
                className="w-full border border-gray-300 rounded-md py-2 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#1abc9c] bg-white"
              />
            </div>

            {/* Action Button */}
            <button className="w-full bg-[#1abc9c] hover:bg-[#16a085] text-white font-bold py-3 rounded-md transition-all text-sm shadow-sm mt-4">
              Save & Download
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Servercopy;