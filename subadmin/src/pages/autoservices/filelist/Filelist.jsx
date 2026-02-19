import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight 
} from 'lucide-react';
import Header from '../../../components/header/Header';
import Sidebar from '../../../components/sidebar/Sidebar';

function Filelist() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="font-anek text-gray-700 lg:ml-72 mt-[9vh]">
      <Header toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />

      <main className="min-h-[91vh] bg-[#f4f6f9] p-4 md:p-6">
        {/* Page Title */}
        <h1 className="text-[#1abc9c] text-xl font-bold mb-4">ফাইল লিস্ট</h1>

        <div className="bg-white border border-gray-200 rounded-sm shadow-sm p-4">
          
          {/* Table Controls */}
          <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
            <div className="flex items-center text-[13px]">
              <select className="border border-gray-300 rounded px-1.5 py-1 mr-2 focus:outline-none focus:border-[#1abc9c]">
                <option>10</option>
                <option>25</option>
                <option>50</option>
                <option>100</option>
              </select>
              <span>entries per page</span>
            </div>

            <div className="flex items-center text-[13px]">
              <span className="mr-2">Search:</span>
              <input 
                type="text" 
                className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#1abc9c]" 
              />
            </div>
          </div>

          {/* Data Table with Specific Headers */}
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse border border-gray-200">
              <thead>
                <tr className="bg-[#d1f2eb] text-nowrap">
                  <TableHeading label="SL" />
                  <TableHeading label="TYPE" />
                  <TableHeading label="FULL NAME" />
                  <TableHeading label="NID/BRN NUMBER" />
                  <TableHeading label="DOB" />
                  <TableHeading label="ACTION" />
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td colSpan="6" className="p-4 text-gray-500 text-sm italic">
                    No data available in table
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-wrap justify-between items-center mt-4 text-[13px] text-gray-500">
            <div>Showing 0 to 0 of 0 entries</div>
            <div className="flex items-center space-x-1">
              <PaginationButton icon={<ChevronsLeft size={14} />} disabled />
              <PaginationButton icon={<ChevronLeft size={14} />} disabled />
              <PaginationButton icon={<ChevronRight size={14} />} disabled />
              <PaginationButton icon={<ChevronsRight size={14} />} disabled />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Sub-component for Sortable Table Headings
function TableHeading({ label }) {
  return (
    <th className="p-2 text-[11px] font-bold text-gray-600 border border-gray-300 uppercase tracking-tight">
      <div className="flex items-center justify-between px-2">
        <span>{label}</span>
        <div className="flex flex-col gap-0.5 opacity-30">
          <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[4px] border-b-gray-800"></div>
          <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-gray-800"></div>
        </div>
      </div>
    </th>
  );
}

// Sub-component for Pagination Buttons
function PaginationButton({ icon, disabled }) {
  return (
    <button 
      className={`p-1.5 border border-gray-200 rounded hover:bg-gray-50 ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`} 
      disabled={disabled}
    >
      {icon}
    </button>
  );
}

export default Filelist;