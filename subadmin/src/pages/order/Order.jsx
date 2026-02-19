import React, { useState } from 'react';
import { 
  Power, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight 
} from 'lucide-react';
import Header from '../../components/header/Header';
import Sidebar from '../../components/sidebar/Sidebar';

function Order() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="font-anek text-gray-700 lg:ml-72 mt-[9vh] ">
      <Header toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />

      <main className="min-h-[93vh] bg-[#f8f9fa] p-4 md:p-6">
        {/* Page Title */}
        <h1 className="text-[#00a65a] text-xl font-bold mb-4">অর্ডার সিস্টেম</h1>

        {/* Status Card (Work Stopped) */}
        <div className="bg-white border border-gray-300 rounded-sm p-8 mb-6 flex flex-col items-center justify-center shadow-sm max-w-4xl mx-auto">
          <div className="bg-[#ff4d4d] rounded-full p-4 mb-4">
            <Power size={48} color="white" strokeWidth={3} />
          </div>
          <h2 className="text-[#ff4d4d] text-3xl font-bold mb-2">কাজ বন্ধ</h2>
          <p className="text-gray-600 text-sm">
            কাজ চালু হলে এখানে অপশন গুলো দেখতে পারবেন।
          </p>
        </div>

        {/* Table Section */}
        <div className="bg-white border border-gray-200 rounded-sm shadow-sm p-4">
          
          {/* Table Controls */}
          <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
            <div className="flex items-center text-sm">
              <select className="border border-gray-300 rounded px-2 py-1 mr-2 focus:outline-none">
                <option>10</option>
                <option>25</option>
                <option>50</option>
              </select>
              <span>entries per page</span>
            </div>

            <div className="flex items-center text-sm">
              <span className="mr-2">Search:</span>
              <input 
                type="text" 
                className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-green-500" 
              />
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr className="bg-[#d1f2eb] text-nowrap border-t border-b border-gray-300">
                  <th className="p-3 text-xs font-semibold text-gray-600 border-r border-gray-200 uppercase tracking-wider">
                    SL 
                  </th>
                  <th className="p-3 text-sm font-semibold text-gray-600 border-r border-gray-200">টাইপ</th>
                  <th className="p-3 text-sm font-semibold text-gray-600 border-r border-gray-200">অ্যাকশন</th>
                  <th className="p-3 text-sm font-semibold text-gray-600 border-r border-gray-200">স্ট্যাটাস</th>
                  <th className="p-3 text-sm font-semibold text-gray-600 border-r border-gray-200">সংযোজন/বিয়োজন</th>
                  <th className="p-3 text-sm font-semibold text-gray-600 border-r border-gray-200">পূর্বের ব্যালেন্স</th>
                  <th className="p-3 text-sm font-semibold text-gray-600">ডাউনলোড</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-[#fde8e8]">
                  <td colSpan="7" className="p-3 text-[#ff4d4d] text-sm font-medium">
                    কোন অর্ডার পাওয়া যায়নি
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-wrap justify-between items-center mt-4 text-sm text-gray-500">
            <div>Showing 0 to 0 of 0 entries</div>
            <div className="flex items-center space-x-1">
              <button className="p-2 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50" disabled>
                <ChevronsLeft size={14} />
              </button>
              <button className="p-2 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50" disabled>
                <ChevronLeft size={14} />
              </button>
              <button className="p-2 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50" disabled>
                <ChevronRight size={14} />
              </button>
              <button className="p-2 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50" disabled>
                <ChevronsRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Order;