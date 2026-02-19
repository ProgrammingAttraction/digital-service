import React, { useState } from 'react';
import { Shuffle, Send, Info } from 'lucide-react';
import Header from '../../../components/header/Header';
import Sidebar from '../../../components/sidebar/Sidebar';

function Takmulcertificate() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="font-anek text-gray-700 lg:ml-72 mt-[9vh]">
      <Header toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />

      <main className="min-h-[91vh] bg-[#f4f6f9] p-4 md:p-6">
        {/* Page Title - Top Left */}
        <div className="mb-4">
          <h1 className="text-[#1abc9c] text-lg font-bold">তাকামুল সার্টিফিকেট</h1>
        </div>

        <div className="w-full bg-white p-6 border border-gray-200 shadow-sm rounded-lg">
          
          {/* Top Auto Load Section - Dashed Box */}
          <div className="flex justify-center mb-8">
            <div className="border-2 border-dashed border-[#1abc9c] rounded-xl p-6 flex flex-col items-center justify-center w-full max-w-md cursor-pointer hover:bg-teal-50 transition-all">
              <div className="text-[#1abc9c] mb-2 bg-[#e0f2f1] p-2 rounded-lg">
                 <Info size={24} />
              </div>
              <p className="text-[#1abc9c] font-bold text-sm text-center">
                স্বয়ংক্রিয়ভাবে ডাটা লোড করতে <br/> এখানে ক্লিক করুন
              </p>
            </div>
          </div>

          {/* Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            
            {/* Row 1 */}
            <div className="flex flex-col">
              <label className="text-[11px] font-bold text-gray-600 mb-1">Certificate Number:</label>
              <div className="flex gap-0">
                <input className="flex-1 border border-gray-300 rounded-l-sm px-3 py-1.5 text-xs focus:outline-none focus:border-[#1abc9c]" placeholder="XXXXXXXXX" />
                <button className="bg-white border border-l-0 border-gray-300 px-3 rounded-r-sm text-[#1abc9c] hover:bg-gray-50">
                  <Shuffle size={14} />
                </button>
              </div>
            </div>
            <InputField label="Passport Number:" placeholder="Passport Number" />

            {/* Row 2 */}
            <InputField label="Name:" placeholder="Full Name" />
            <InputField label="Nationality:" placeholder="Bangladesh" />

            {/* Row 3 */}
            <div className="flex flex-col">
              <label className="text-[11px] font-bold text-gray-600 mb-1">Work Type:</label>
              <select className="border border-gray-300 rounded-sm px-3 py-1.5 text-xs focus:outline-none focus:border-[#1abc9c] bg-white text-gray-500">
                <option>-- Select Work Type --</option>
                <option>Domestic Worker</option>
                <option>General Labor</option>
              </select>
            </div>
            <InputField label="Labour Number:" placeholder="XXXXX" />

            {/* Row 4 */}
            <InputField label="Issue Date:" placeholder="24-12-2025" />
            <InputField label="Expiry Date:" placeholder="24-12-2030" />

          </div>

          {/* Action Button */}
          <div className="mt-8">
            <button className="w-full bg-[#1abc9c] hover:bg-[#16a085] text-white font-bold py-2.5 rounded shadow-sm flex items-center justify-center gap-2 transition-all text-sm">
              <Send size={16} fill="currentColor" /> ক্রিয়েট সনদ
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

// Reusable Input Component
function InputField({ label, placeholder, required = false }) {
  return (
    <div className="flex flex-col">
      <label className="text-[11px] font-bold text-gray-600 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input 
        className="border border-gray-300 rounded-sm px-3 py-1.5 text-xs focus:outline-none focus:border-[#1abc9c] placeholder:text-gray-300 bg-white"
        placeholder={placeholder}
      />
    </div>
  );
}

export default Takmulcertificate;