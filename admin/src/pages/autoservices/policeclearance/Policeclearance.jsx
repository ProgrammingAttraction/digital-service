import React, { useState } from 'react';
import { Shuffle, Send } from 'lucide-react';
import Header from '../../../components/header/Header';
import Sidebar from '../../../components/sidebar/Sidebar';

function Policeclearance() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="font-anek text-gray-700 lg:ml-72 mt-[9vh]">
      <Header toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />

      <main className="min-h-[91vh] bg-[#f4f6f9] p-4 md:p-6">
        {/* Page Title */}
        <div className="mb-4">
          <h1 className="text-[#1abc9c] text-lg font-bold">পুলিশ ক্লিয়ারেন্স ক্লোন</h1>
        </div>

        <div className="w-full bg-white p-6 border border-gray-200 shadow-sm rounded-lg">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            
            {/* Row 1 */}
            <div className="flex flex-col">
              <label className="text-[11px] font-bold text-gray-600 mb-1">Reference No</label>
              <div className="flex gap-0">
                <input className="flex-1 border border-gray-300 rounded-l-sm px-3 py-1.5 text-xs focus:outline-none focus:border-[#1abc9c]" placeholder="1CEIA36" />
                <button className="bg-white border border-l-0 border-gray-300 px-3 rounded-r-sm text-[#1abc9c] hover:bg-gray-50">
                  <Shuffle size={14} />
                </button>
              </div>
            </div>
            <InputField label="Police Station" placeholder="Enter Police Station Name" required />

            {/* Row 2 */}
            <InputField label="Passport No" placeholder="Enter Passport Number" required />
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-gray-600 mb-1">Salutation <span className="text-red-500">*</span></label>
                <select className="border border-gray-300 rounded-sm px-3 py-1.5 text-xs focus:outline-none focus:border-[#1abc9c] bg-white">
                  <option>-- Select --</option>
                  <option>Mr.</option>
                  <option>Ms.</option>
                </select>
              </div>
              <InputField label="Full Name" placeholder="As it appears in your passport" required />
            </div>

            {/* Row 3 */}
            <InputField label="Father Name" placeholder="Enter Father or Husband Name" required />
            <InputField label="Village/ Area" placeholder="Village/ Area" required />

            {/* Row 4 */}
            <InputField label="P/O" placeholder="P/O" required />
            <InputField label="Post Code" placeholder="Post Code" required />

            {/* Row 5 */}
            <InputField label="P/S Upozila" placeholder="P/S Upozila" required />
            <InputField label="District" placeholder="District" required />

            {/* Row 6 */}
            <div className="flex flex-col">
              <label className="text-[11px] font-bold text-gray-600 mb-1">Issue Date <span className="text-red-500">*</span></label>
              <input type="date" className="border border-gray-300 rounded-sm px-3 py-1.5 text-xs focus:outline-none focus:border-[#1abc9c] uppercase" />
            </div>
            <InputField label="Issue Place" placeholder="Enter Passport Issue Place" required />

          </div>

          {/* Action Button */}
          <div className="mt-8">
            <button className="w-full bg-[#1abc9c] hover:bg-[#16a085] text-white font-bold py-2.5 rounded shadow-sm flex items-center justify-center gap-2 transition-all text-sm">
              <Send size={16} fill="currentColor" /> Save & Download
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

export default Policeclearance;