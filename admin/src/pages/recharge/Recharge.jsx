import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight 
} from 'lucide-react';
import Header from '../../components/header/Header';
import Sidebar from '../../components/sidebar/Sidebar';

function Recharge() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null); // 'bkash' or 'nagad'

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  const paymentMethods = [
    { id: 'bkash', name: 'bKash', logo: 'https://xxxbetgames.com/casino/icons-xxx/payments/63.svg' },
    { id: 'nagad', name: 'Nagad', logo: 'https://xxxbetgames.com/casino/icons-xxx/payments/76.svg' },
  ];

  return (
    <div className="font-anek text-gray-700 lg:ml-72 mt-[9vh]">
      <Header toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />

      <main className="min-h-[93vh] bg-[#f8f9fa] p-4 md:p-6">
        {/* Page Title */}
        <h1 className="text-[#00a65a] text-xl font-bold mb-6">রিচার্জ</h1>

        {/* Step 1: Select Payment Method */}
        <div className="bg-white border border-gray-200 rounded-sm p-6 mb-8 shadow-sm max-w-4xl mx-auto">
          <p className="text-center text-gray-600 mb-4 font-semibold">পেমেন্ট মেথড নির্বাচন করুন</p>
          <div className="flex justify-center gap-6 mb-8">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className={`p-2 border-2 rounded-[8px] cursor-pointer transition-all ${
                  selectedMethod === method.id ? 'border-[#00a65a] bg-green-50' : 'border-gray-200'
                }`}
              >
                <img src={method.logo} alt={method.name} className="h-16 w-32 object-contain" />
              </button>
            ))}
          </div>

          {/* Step 2: Form Fields (Only visible when a method is selected) */}
          {selectedMethod && (
            <div className="space-y-4 max-w-md mx-auto">
              <div>
                <input
                  type="text"
                  placeholder="Account Number"
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Transaction Id"
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="সর্বনিম্ন রিচার্জ ১০০ টাকা"
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
              <button className="w-full bg-[#1abc9c] hover:bg-[#16a085] text-white font-bold py-2 px-4 rounded transition-colors uppercase">
                Recharge
              </button>
            </div>
          )}
        </div>

        {/* Recharge History Table Section */}
        <h2 className="text-[#00a65a] text-xl font-bold mb-4">রিচার্জ ইতিহাস</h2>
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
                  <th className="p-3 text-xs font-bold text-gray-600 border-r border-gray-200 uppercase tracking-wider">SL</th>
                  <th className="p-3 text-xs font-bold text-gray-600 border-r border-gray-200 uppercase">Number</th>
                  <th className="p-3 text-xs font-bold text-gray-600 border-r border-gray-200 uppercase">Trxid</th>
                  <th className="p-3 text-xs font-bold text-gray-600 border-r border-gray-200 uppercase">Amount</th>
                  <th className="p-3 text-xs font-bold text-gray-600 border-r border-gray-200 uppercase">Type</th>
                  <th className="p-3 text-xs font-bold text-gray-600 border-r border-gray-200 uppercase">Status</th>
                  <th className="p-3 text-xs font-bold text-gray-600 uppercase">Date</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <td colSpan="7" className="p-4 text-gray-500 text-sm">
                    No data available in table
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

export default Recharge;