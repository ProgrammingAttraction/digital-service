import React, { useState, useCallback, memo, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  Search,
  Gift,
  AlertCircle,
  CreditCard
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/header/Header';
import Sidebar from '../../components/sidebar/Sidebar';
import { Toaster } from 'react-hot-toast';
import { useRecharge } from '../../context/RechargeContext';
import { useTheme } from '../../context/ThemeContext';
import ApertureLoader from '../../components/loader/ApertureLoader';

// Memoized components for better performance

const BonusRow = memo(({ bonuses, index, isDarkMode }) => (
  <tr className={`border-b ${
    isDarkMode 
      ? 'border-gray-700 hover:bg-gray-800/50' 
      : 'border-gray-200 hover:bg-gray-50'
  }`}>
    {/* First Bonus */}
    <td className={`p-2 md:p-3 text-sm font-semibold ${
      isDarkMode ? 'text-gray-300' : 'text-gray-700'
    }`}>
      {index * 2 + 1}.
    </td>
    <td className="p-2 md:p-3">
      <div className="flex flex-col items-center">
        <span className={`text-sm md:text-sm font-bold ${
          isDarkMode ? 'text-gray-100' : 'text-gray-900'
        }`}>
          {bonuses[0].minimumDeposit} BDT
        </span>
        {bonuses[0].maximumDeposit && bonuses[0].maximumDeposit !== bonuses[0].minimumDeposit && (
          <span className={`text-xs ${
            isDarkMode ? 'text-gray-500' : 'text-gray-500'
          }`}>
            সর্বোচ্চ {bonuses[0].maximumDeposit} BDT
          </span>
        )}
      </div>
    </td>
    <td className="p-2 md:p-3">
      <div className="flex flex-col items-center">
        <span className={`text-sm md:text-sm font-bold ${
          isDarkMode ? 'text-[#00a8ff]' : 'text-[#00a8ff]'
        }`}>
          বোনাস({bonuses[0].bonusAmount}৳)
        </span>
      </div>
    </td>
    
    {/* Second Bonus */}
    {bonuses[1] && (
      <>
        <td className={`p-2 md:p-3 text-sm font-semibold ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          {index * 2 + 2}.
        </td>
        <td className="p-2 md:p-3">
          <div className="flex flex-col items-center">
            <span className={`text-sm md:text-sm font-bold ${
              isDarkMode ? 'text-gray-100' : 'text-gray-900'
            }`}>
              {bonuses[1].minimumDeposit} BDT
            </span>
            {bonuses[1].maximumDeposit && bonuses[1].maximumDeposit !== bonuses[1].minimumDeposit && (
              <span className={`text-xs ${
                isDarkMode ? 'text-gray-500' : 'text-gray-500'
              }`}>
                সর্বোচ্চ {bonuses[1].maximumDeposit} BDT
              </span>
            )}
          </div>
        </td>
        <td className="p-2 md:p-3">
          <div className="flex flex-col items-center">
            <span className={`text-sm md:text-sm font-bold ${
              isDarkMode ? 'text-[#00a8ff]' : 'text-[#00a8ff]'
            }`}>
              বোনাস({bonuses[1].bonusAmount}৳)
            </span>
          </div>
        </td>
      </>
    )}
  </tr>
));

const HistoryRow = memo(({ 
  item, 
  index, 
  currentPage, 
  itemsPerPage, 
  formatCurrency, 
  formatDate, 
  getStatusColor,
  isDarkMode 
}) => (
  <tr key={item._id} className={`border-b ${
    isDarkMode 
      ? 'border-gray-700 hover:bg-gray-800/50' 
      : 'border-gray-200 hover:bg-gray-50'
  }`}>
    <td className={`p-2 py-4 md:p-3 text-sm md:text-sm ${
      isDarkMode ? 'text-gray-300' : 'text-gray-700'
    }`}>
      {(currentPage - 1) * itemsPerPage + index + 1}
    </td>
    <td className={`p-2 py-4 md:p-3 text-sm md:text-sm ${
      isDarkMode ? 'text-gray-300' : 'text-gray-700'
    }`}>
      {item.paymentMethod || item.depositMethod?.name || 'N/A'}
    </td>
    <td className={`p-2 py-4 md:p-3 text-sm md:text-sm font-mono ${
      isDarkMode ? 'text-gray-300' : 'text-gray-700'
    }`}>
      {item.accountNumber}
    </td>
    <td className={`p-2 py-4 md:p-3 text-sm md:text-sm font-mono truncate max-w-[120px] ${
      isDarkMode ? 'text-gray-300' : 'text-gray-700'
    }`} title={item.transactionId}>
      {item.transactionId}
    </td>
    <td className={`p-2 py-4 md:p-3 text-sm md:text-sm font-semibold ${
      isDarkMode ? 'text-[#00a8ff]' : 'text-[#00a8ff]'
    }`}>
      {formatCurrency(item.amount)}
    </td>
    <td className="p-2 py-4 md:p-3 text-sm md:text-sm">
      {item.bonusAmount > 0 ? (
        <span className={`px-1.5 py-0.5 md:px-2 md:py-1 rounded text-xs ${
          isDarkMode 
            ? 'bg-[#00a8ff]/20 text-[#00a8ff] border border-[#00a8ff]/30'
            : 'bg-[#00a8ff]/10 text-[#00a8ff]'
        }`}>
          +{formatCurrency(item.bonusAmount)}
        </span>
      ) : (
        <span className={`${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>-</span>
      )}
    </td>
    <td className="p-2 py-4 md:p-3 text-sm md:text-sm">
      <span className={`px-1.5 py-0.5 md:px-2 md:py-1.5 text-sm font-medium rounded-[10px] ${getStatusColor(item.status, isDarkMode)}`}>
        {item.status}
      </span>
    </td>
    <td className={`p-2 md:p-3 text-sm md:text-sm text-nowrap ${
      isDarkMode ? 'text-gray-400' : 'text-gray-600'
    }`}>
      {formatDate(item.createdAt)}
    </td>
  </tr>
));

const Pagination = memo(({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  getShowingRange,
  isDarkMode 
}) => {
  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = startPage + maxVisiblePages - 1;
    
    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`px-2 py-1 md:px-3 md:py-1 border rounded cursor-pointer transition-colors ${
            currentPage === i
              ? 'bg-[#00a8ff] text-white border-[#00a8ff]'
              : isDarkMode
                ? 'border-gray-700 hover:bg-gray-800 text-gray-300'
                : 'border-gray-200 hover:bg-gray-50 text-gray-700'
          }`}
        >
          {i}
        </button>
      );
    }
    
    return pages;
  };
  
  return (
    <div className={`flex flex-wrap justify-between items-center font-anek mt-3 md:mt-4 text-xs md:text-sm ${
      isDarkMode ? 'text-gray-400' : 'text-gray-500'
    }`}>
      <div>{getShowingRange()}</div>
      <div className="flex items-center space-x-1">
        <button 
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className={`p-1 md:p-2 border rounded transition-colors ${
            isDarkMode
              ? 'border-gray-700 hover:bg-gray-800 text-gray-300 disabled:opacity-40'
              : 'border-gray-200 hover:bg-gray-50 text-gray-700 disabled:opacity-50'
          } disabled:cursor-not-allowed cursor-pointer`}
        >
          <ChevronsLeft size={12} className="md:size-4" />
        </button>
        <button 
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`p-1 md:p-2 border rounded transition-colors ${
            isDarkMode
              ? 'border-gray-700 hover:bg-gray-800 text-gray-300 disabled:opacity-40'
              : 'border-gray-200 hover:bg-gray-50 text-gray-700 disabled:opacity-50'
          } disabled:cursor-not-allowed cursor-pointer`}
        >
          <ChevronLeft size={12} className="md:size-4" />
        </button>
        
        {renderPageNumbers()}
        
        <button 
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`p-1 md:p-2 border rounded transition-colors ${
            isDarkMode
              ? 'border-gray-700 hover:bg-gray-800 text-gray-300 disabled:opacity-40'
              : 'border-gray-200 hover:bg-gray-50 text-gray-700 disabled:opacity-50'
          } disabled:cursor-not-allowed cursor-pointer`}
        >
          <ChevronRight size={12} className="md:size-4" />
        </button>
        <button 
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className={`p-1 md:p-2 border rounded transition-colors ${
            isDarkMode
              ? 'border-gray-700 hover:bg-gray-800 text-gray-300 disabled:opacity-40'
              : 'border-gray-200 hover:bg-gray-50 text-gray-700 disabled:opacity-50'
          } disabled:cursor-not-allowed cursor-pointer`}
        >
          <ChevronsRight size={12} className="md:size-4" />
        </button>
      </div>
    </div>
  );
});

const Loader = memo(({ isDarkMode }) => (
  <div className="flex justify-center items-center py-8">
    <div className="flex space-x-2">
      <div className={`animate-bounce h-3 w-3 rounded-full ${
        isDarkMode ? 'bg-[#00a8ff]' : 'bg-[#00a8ff]'
      }`} style={{ animationDelay: '0ms' }}></div>
      <div className={`animate-bounce h-3 w-3 rounded-full ${
        isDarkMode ? 'bg-[#00a8ff]' : 'bg-[#00a8ff]'
      }`} style={{ animationDelay: '150ms' }}></div>
      <div className={`animate-bounce h-3 w-3 rounded-full ${
        isDarkMode ? 'bg-[#00a8ff]' : 'bg-[#00a8ff]'
      }`} style={{ animationDelay: '300ms' }}></div>
    </div>
  </div>
));

function Recharge() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  
  const {
    depositMethods,
    bonuses,
    rechargeHistory,
    loading,
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    searchTerm,
    statusFilter,
    handlePageChange,
    handleItemsPerPageChange: contextHandleItemsPerPageChange,
    handleSearch: contextHandleSearch,
    handleStatusFilter: contextHandleStatusFilter,
    formatCurrency,
    formatDate,
    getStatusColor: contextGetStatusColor,
    getShowingRange,
    fetchAllData
  } = useRecharge();

  const toggleSidebar = useCallback(() => setSidebarOpen(prev => !prev), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  // Get minimum deposit amount from deposit methods
  const getMinimumDeposit = useCallback(() => {
    if (depositMethods.length === 0) return 50;
    
    const activeMethods = depositMethods.filter(method => method.status === 'active');
    if (activeMethods.length === 0) return 50;
    
    const minDeposit = Math.min(...activeMethods.map(method => method.minimumDeposit || 50));
    return minDeposit || 50;
  }, [depositMethods]);

  const minimumDeposit = getMinimumDeposit();

  const handleAmountChange = useCallback((e) => {
    const value = e.target.value;
    setAmount(value);
    
    // Validate amount
    if (value) {
      const numAmount = parseInt(value);
      if (numAmount < minimumDeposit) {
        setError(`সর্বনিম্ন রিচার্জ ${minimumDeposit} টাকা`);
      } else {
        setError('');
      }
    } else {
      setError('');
    }
  }, [minimumDeposit]);

  const handleRechargeSubmit = useCallback((e) => {
    e.preventDefault();
    
    if (!amount) {
      setError('দয়া করে রিচার্জ পরিমাণ লিখুন');
      return;
    }
    
    const numAmount = parseInt(amount);
    if (numAmount < minimumDeposit) {
      setError(`সর্বনিম্ন রিচার্জ ${minimumDeposit} টাকা`);
      return;
    }
    
    // Navigate to payment method page with amount parameter
    navigate(`/payment-method?amount=${amount}`);
  }, [amount, minimumDeposit, navigate]);

  // Wrapper functions for context handlers
  const handleItemsPerPageChange = useCallback((e) => {
    contextHandleItemsPerPageChange(parseInt(e.target.value));
  }, [contextHandleItemsPerPageChange]);

  const handleSearch = useCallback((e) => {
    contextHandleSearch(e.target.value);
  }, [contextHandleSearch]);

  const handleStatusFilter = useCallback((e) => {
    contextHandleStatusFilter(e.target.value);
  }, [contextHandleStatusFilter]);

  // Enhanced getStatusColor function with dark mode support
  const getStatusColor = useCallback((status, darkMode = isDarkMode) => {
    const colors = {
      'pending': darkMode ? 'bg-yellow-900/40 text-yellow-300 border border-yellow-700/50' : 'bg-yellow-100 text-yellow-800',
      'approved': darkMode ? 'bg-[#00a8ff]/20 text-[#00a8ff] border border-[#00a8ff]/30' : 'bg-[#00a8ff]/10 text-[#00a8ff]',
      'completed': darkMode ? 'bg-[#00a8ff]/20 text-[#00a8ff] border border-[#00a8ff]/30' : 'bg-[#00a8ff]/10 text-[#00a8ff]',
      'rejected': darkMode ? 'bg-red-900/40 text-red-300 border border-red-700/50' : 'bg-red-100 text-red-800',
      'cancelled': darkMode ? 'bg-gray-700/50 text-gray-300 border border-gray-600' : 'bg-gray-100 text-gray-800',
      'processing': darkMode ? 'bg-purple-900/40 text-purple-300 border border-purple-700/50' : 'bg-purple-100 text-purple-800'
    };
    
    return colors[status] || colors.pending;
  }, [isDarkMode]);

  // Split bonuses into pairs for 2 per row
  const getBonusPairs = useCallback(() => {
    const pairs = [];
    for (let i = 0; i < bonuses.length; i += 2) {
      pairs.push(bonuses.slice(i, i + 2));
    }
    return pairs;
  }, [bonuses]);

  // Main Loading State
  if (loading.depositMethods && loading.bonuses) {
    return (
      <div className={`font-rubik lg:ml-72 mt-[9vh] transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-gray-900 text-gray-100' 
          : 'text-gray-700'
      }`}>
        <Header toggleSidebar={toggleSidebar} />
        <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />
        <Toaster position="top-right" />
        
        <main className={`min-h-[93vh] p-3 md:p-6 transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-900' : 'bg-[#f8f9fa]'
        }`}>
          <h1 className={`text-lg md:text-xl font-bold mb-4 md:mb-6 ${
            isDarkMode ? 'text-[#00a8ff]' : 'text-[#00a8ff]'
          }`}>
            রিচার্জ
          </h1>
          <div>
            <ApertureLoader/>
          </div>
        </main>
      </div>
    );
  }

  const bonusPairs = getBonusPairs();

  return (
    <div className={`font-anek lg:ml-72 mt-[9vh] transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gray-900 text-gray-100' 
        : 'text-gray-700'
    }`}>
      <Header toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />
      <Toaster position="top-right" />

      <main className={`min-h-[93vh] p-3 md:p-6 transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-900' : 'bg-[#f8f9fa]'
      }`}>
        <h1 className={`text-2xl md:text-3xl mb-[20px] font-extrabold ${isDarkMode ? 'text-[#00a8ff]' : 'text-[#00a8ff]'} tracking-tight`}>
          রিচার্জ
        </h1>
        
        {/* Simplified Recharge Form */}
        <div className={`border rounded-sm p-4 md:p-6 mb-6 md:mb-8 shadow-sm w-full mx-auto transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-gray-800/50 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <form onSubmit={handleRechargeSubmit} className="space-y-3 md:space-y-4">
            <div>
              <label className={`block font-anek text-sm md:text-[16px] font-medium mb-1 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Amount *
              </label>
              <input
                type="number"
                value={amount}
                onChange={handleAmountChange}
                placeholder={`সর্বনিম্ন ${minimumDeposit} টাকা`}
                min={minimumDeposit}
                className={`w-full border rounded px-2.5 py-2 md:px-3 md:py-2.5 text-sm md:text-base md:text-[15px] focus:outline-none focus:ring-2 focus:ring-[#00a8ff] focus:border-transparent transition-colors ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                }`}
                required
              />
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                সর্বনিম্ন রিচার্জ {minimumDeposit} টাকা
              </p>
              {error && (
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                  {error}
                </p>
              )}
            </div>
            
            <button
              type="submit"
              className={`w-full text-white font-[600] py-2.5 md:py-3 px-4 rounded-lg transition-all uppercase text-sm md:text-[15px] ${
                isDarkMode
                  ? 'bg-[#00a8ff] hover:bg-[#0097e6]'
                  : 'bg-[#00a8ff] hover:bg-[#0097e6]'
              } hover:shadow-lg cursor-pointer`}
            >
              Recharge
            </button>
          </form>
          
          {/* Bonuses Section */}
          <h2 className={`mt-[30px] text-base md:text-lg font-bold mb-4 md:mb-6 flex items-center ${
            isDarkMode ? 'text-[#00a8ff]' : 'text-[#00a8ff]'
          }`}>
            <Gift size={18} className={`md:size-5 mr-2 ${
              isDarkMode ? 'text-[#00a8ff]' : 'text-[#00a8ff]'
            }`} />
            উপলব্ধ বোনাস
          </h2>
          
          {bonuses.length === 0 ? (
            <div className="text-center py-6 md:py-8">
              <Gift className={`mx-auto h-8 w-8 md:h-12 md:w-12 mb-3 md:mb-4 ${
                isDarkMode ? 'text-gray-600' : 'text-gray-400'
              }`} />
              <p className={`text-sm md:text-base ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                এখনো কোনো বোনাস পাওয়া যায়নি
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse border-[1px] border-gray-200">
                <thead>
                  <tr className={`border-t border-b ${
                    isDarkMode
                      ? 'bg-[#00a8ff]/10 border-gray-700'
                      : 'bg-[#00a8ff]/10 border-gray-300'
                  }`}>
                    <th className={`p-2 md:p-3 text-sm font-bold uppercase tracking-wider border-r ${
                      isDarkMode
                        ? 'text-gray-300 border-gray-700'
                        : 'text-gray-600 border-gray-200'
                    }`}>
                      ক্রম
                    </th>
                    <th className={`p-2 md:p-3 text-sm font-bold uppercase border-r ${
                      isDarkMode
                        ? 'text-gray-300 border-gray-700'
                        : 'text-gray-600 border-gray-200'
                    }`}>
                      ডিপোজিট পরিমাণ
                    </th>
                    <th className={`p-2 md:p-3 text-sm font-bold uppercase border-r  border-gray-200 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      বোনাস
                    </th>
                    {/* Second bonus columns */}
                    <th className={`p-2 md:p-3 text-sm font-bold  uppercase tracking-wider border-r  ${
                      isDarkMode
                        ? 'text-gray-300 border-gray-200'
                        : 'text-gray-600 border-gray-200'
                    }`}>
                      ক্রম
                    </th>
                    <th className={`p-2 md:p-3 text-sm font-bold uppercase border-r ${
                      isDarkMode
                        ? 'text-gray-300 border-gray-200'
                        : 'text-gray-600 border-gray-200'
                    }`}>
                      ডিপোজিট পরিমাণ
                    </th>
                    <th className={`p-2 md:p-3 text-sm font-bold uppercase ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      বোনাস
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {bonusPairs.map((bonusPair, index) => (
                    <BonusRow 
                      key={index} 
                      bonuses={bonusPair} 
                      index={index}
                      isDarkMode={isDarkMode}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recharge History Table Section */}
        <h2 className={`text-lg md:text-xl font-bold mb-3 md:mb-4 ${
          isDarkMode ? 'text-[#00a8ff]' : 'text-[#00a8ff]'
        }`}>
          রিচার্জ ইতিহাস
        </h2>
        <div className={`border rounded-sm shadow-sm p-3 md:p-4 transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-gray-800/50 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          
          {/* Table Controls */}
          <div className="flex flex-wrap justify-between items-center mb-3 md:mb-4 gap-3 md:gap-4">
            <div className="flex items-center text-sm md:text-sm">
              <select 
                value={itemsPerPage} 
                onChange={handleItemsPerPageChange}
                className={`border rounded px-1.5 py-1 md:px-2 md:py-1 mr-2 focus:outline-none text-sm md:text-sm cursor-pointer transition-colors ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-600 text-gray-100'
                    : 'bg-white border-gray-300 text-gray-700'
                }`}
                disabled={loading.history}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                প্রতি পৃষ্ঠায় এন্ট্রি
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <div className="flex items-center">
                <Search size={16} className={`mr-1 ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-500'
                }`} />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={handleSearch}
                  className={`border rounded px-1.5 py-1 md:px-2 md:py-1 focus:outline-none focus:ring-1 focus:ring-[#00a8ff] text-sm md:text-sm w-32 md:w-48 transition-colors ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                  placeholder="খুঁজুন.."
                  disabled={loading.history}
                />
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse border-[1px] border-gray-200">
              <thead>
                <tr className={`text-nowrap border-t border-b ${
                  isDarkMode
                    ? 'bg-[#00a8ff]/10 border-gray-700'
                    : 'bg-[#00a8ff]/10 border-gray-300'
                }`}>
                  <th className={`p-2 md:p-3 text-sm font-bold uppercase tracking-wider border-r ${
                    isDarkMode
                      ? 'text-gray-300 border-gray-700'
                      : 'text-gray-600 border-gray-200'
                  }`}>
                    ক্রম
                  </th>
                  <th className={`p-2 md:p-3 text-sm font-bold uppercase border-r ${
                    isDarkMode
                      ? 'text-gray-300 border-gray-700'
                      : 'text-gray-600 border-gray-200'
                  }`}>
                    পেমেন্ট মেথড
                  </th>
                  <th className={`p-2 md:p-3 text-sm font-bold uppercase border-r ${
                    isDarkMode
                      ? 'text-gray-300 border-gray-700'
                      : 'text-gray-600 border-gray-200'
                  }`}>
                    অ্যাকাউন্ট নাম্বার
                  </th>
                  <th className={`p-2 md:p-3 text-sm font-bold uppercase border-r ${
                    isDarkMode
                      ? 'text-gray-300 border-gray-700'
                      : 'text-gray-600 border-gray-200'
                  }`}>
                    লেনদেন আইডি
                  </th>
                  <th className={`p-2 md:p-3 text-sm font-bold uppercase border-r ${
                    isDarkMode
                      ? 'text-gray-300 border-gray-700'
                      : 'text-gray-600 border-gray-200'
                  }`}>
                    পরিমাণ
                  </th>
                  <th className={`p-2 md:p-3 text-sm font-bold uppercase border-r ${
                    isDarkMode
                      ? 'text-gray-300 border-gray-700'
                      : 'text-gray-600 border-gray-200'
                  }`}>
                    বোনাস
                  </th>
                  <th className={`p-2 md:p-3 text-sm font-bold uppercase border-r ${
                    isDarkMode
                      ? 'text-gray-300 border-gray-700'
                      : 'text-gray-600 border-gray-200'
                  }`}>
                    অবস্থা
                  </th>
                  <th className={`p-2 md:p-3 text-sm font-bold uppercase ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    তারিখ
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading.history ? (
                  <tr>
                    <td colSpan="8" className="p-6 md:p-8 text-center">
                      <Loader isDarkMode={isDarkMode} />
                    </td>
                  </tr>
                ) : rechargeHistory.length === 0 ? (
                  <tr className={`border-b ${
                    isDarkMode ? 'border-gray-700' : 'border-gray-200'
                  }`}>
                    <td colSpan="8" className={`p-6 md:p-8 text-center ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-500'
                    }`}>
                      <CreditCard className={`mx-auto h-8 w-8 md:h-12 md:w-12 mb-3 md:mb-4 ${
                        isDarkMode ? 'text-gray-600' : 'text-gray-400'
                      }`} />
                      <p className="text-sm md:text-base">
                        কোনো রিচার্জ ইতিহাস পাওয়া যায়নি
                      </p>
                      <p className={`text-sm md:text-sm mt-1 ${
                        isDarkMode ? 'text-gray-600' : 'text-gray-400'
                      }`}>
                        {searchTerm || statusFilter ? 'অনুসন্ধান শর্ত পরিবর্তন করুন বা ফিল্টার মুছুন' : 'আপনার রিচার্জ ইতিহাস এখানে প্রদর্শিত হবে'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  rechargeHistory.map((item, index) => (
                    <HistoryRow 
                      key={item._id}
                      item={item}
                      index={index}
                      currentPage={currentPage}
                      itemsPerPage={itemsPerPage}
                      formatCurrency={formatCurrency}
                      formatDate={formatDate}
                      getStatusColor={getStatusColor}
                      isDarkMode={isDarkMode}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            getShowingRange={getShowingRange}
            isDarkMode={isDarkMode}
          />
        </div>
      </main>
    </div>
  );
}

export default Recharge;