import React, { useState } from 'react';
import Header from '../../../components/header/Header';
import Sidebar from '../../../components/sidebar/Sidebar';

function Tincertificate() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchType, setSearchType] = useState('TIN');

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  // Search types based on the image
  const types = ['TIN', 'Ticket', 'Old TIN', 'NID', 'Passport', 'Mobile'];

  return (
    <div className="font-anek text-gray-700 lg:ml-72 mt-[9vh]">
      <Header toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />

      <main className="min-h-[91vh] bg-[#f4f6f9] p-4 md:p-6 flex flex-col items-center">
        
        {/* Top Left Title */}
        <div className="w-full max-w-4xl self-start mb-10">
           <h1 className="text-[#1abc9c] text-lg font-bold">টিন সার্টিফিকেট</h1>
        </div>

        <div className="w-full max-w-2xl bg-white p-8 md:p-12 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center">
          
          {/* Main System Title */}
          <h2 className="text-[#1abc9c] text-2xl font-bold mb-2">অটো টিন ডাউনলোড সিস্টেম</h2>
          <p className="text-gray-600 text-sm font-bold mb-6">টাইপ সিলেক্ট করুন</p>

          {/* Type Selection - Horizontal Radio Buttons */}
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mb-8 w-full">
            {types.map((type) => (
              <label key={type} className="flex items-center gap-1.5 cursor-pointer text-sm font-medium text-gray-700">
                <input 
                  type="radio" 
                  name="searchType" 
                  checked={searchType === type} 
                  onChange={() => setSearchType(type)}
                  className="accent-[#1abc9c] w-4 h-4" 
                />
                {type}
              </label>
            ))}
          </div>

          {/* Form Field */}
          <div className="w-full max-w-md space-y-5">
            <div className="flex flex-col">
              <label className="text-xs font-bold text-gray-700 mb-1">
                {searchType} Number<span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                placeholder={`Enter ${searchType} number`} 
                className="w-full border border-gray-300 rounded-md py-2 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#1abc9c] bg-white transition-all"
              />
            </div>

            {/* Action Button */}
            <div className="flex justify-center">
              <button className="bg-[#1abc9c] hover:bg-[#16a085] text-white font-bold py-2 px-8 rounded-md transition-all text-sm shadow-sm mt-2">
                Save & Download
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Tincertificate;