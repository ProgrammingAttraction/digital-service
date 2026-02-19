import React, { useState, useEffect, useCallback, memo } from 'react';
import { 
  Power, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  Download,
  X,
  FileText,
  Calendar,
  CheckCircle,
  AlertCircle,
  Loader2,
  Info,
  Eye,
  Copy,
  MessageSquare,
  Trash2,
  AlertTriangle,
  Package,
  Check,
  Clock,
  XCircle
} from 'lucide-react';

import Header from '../../components/header/Header';
import Sidebar from '../../components/sidebar/Sidebar';
import { NavLink, useNavigate } from 'react-router-dom';
import file_img from "../../assets/file.png";
import { useFileOrder } from '../../context/FileOrderContext';
import ApertureLoader from '../../components/loader/ApertureLoader';
import { Toaster, toast } from 'react-hot-toast';
import { FaBangladeshiTakaSign } from "react-icons/fa6";
import { useTheme } from '../../context/ThemeContext';

// Memoize the success popup component
const SuccessPopup = memo(({ showSuccessPopup, orderSuccessData, onClose, isDarkMode }) => {
  if (!showSuccessPopup || !orderSuccessData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-2xl p-6 md:p-8 max-w-md w-full shadow-xl transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="text-center">
          <div className={`mx-auto flex items-center justify-center h-16 w-16 md:h-20 md:w-20 rounded-full mb-4 md:mb-6 ${
            isDarkMode ? 'bg-green-900/40' : 'bg-green-100'
          }`}>
            <CheckCircle className="h-10 w-10 md:h-12 md:w-12 text-green-600" />
          </div>
          
          <h3 className={`text-xl md:text-2xl font-bold mb-2 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-100' : 'text-gray-900'
          }`}>
            অর্ডার সফল!
          </h3>
          
          <p className={`text-sm md:text-base mb-4 md:mb-6 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            আপনার অর্ডারটি সফলভাবে প্লেস করা হয়েছে।
          </p>
          
          <div className={`rounded-xl p-4 mb-4 md:mb-6 border transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-gray-700/50 border-gray-600' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div className="text-left">
                <p className={`text-xs md:text-sm transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  অর্ডার আইডি
                </p>
                <p className={`font-semibold text-sm md:text-base truncate transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-800'
                }`}>
                  {orderSuccessData.orderId}
                </p>
              </div>
              <div className="text-left">
                <p className={`text-xs md:text-sm transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  সেবা
                </p>
                <p className={`font-semibold text-sm md:text-base truncate transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-800'
                }`}>
                  {orderSuccessData.serviceName}
                </p>
              </div>
              <div className="text-left">
                <p className={`text-xs md:text-sm transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  পরিমাণ
                </p>
                <p className={`font-semibold text-sm md:text-base transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-800'
                }`}>
                  {orderSuccessData.quantity}
                </p>
              </div>
              <div className="text-left">
                <p className={`text-xs md:text-sm transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  মোট টাকা
                </p>
                <p className="font-semibold text-sm md:text-base text-green-600">
                  {orderSuccessData.totalAmount}৳
                </p>
              </div>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="w-full bg-[#00a8ff] hover:bg-[#0097e6] text-white font-semibold py-3 px-4 rounded-xl transition duration-200 text-sm md:text-base"
          >
            ঠিক আছে
          </button>
        </div>
      </div>
    </div>
  );
});

// Memoize the error display component
const ErrorDisplay = memo(({ error, onClose, isDarkMode }) => {
  if (!error) return null;
  
  return (
    <div className={`mb-6 p-4 rounded-xl border transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-red-900/20 border-red-800/50' 
        : 'bg-red-50 border-red-200'
    }`}>
      <div className="flex items-center">
        <AlertCircle className="text-red-500 mr-2" size={20} />
        <p className="text-red-600 text-sm">{error}</p>
        <button 
          onClick={onClose}
          className={`ml-auto transition-colors duration-300 ${
            isDarkMode ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-700'
          }`}
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
});

// TextView Modal Component
const TextViewModal = memo(({ viewingText, selectedOrder, onClose, formatDate, getStatusColor, getStatusText, copyTextToClipboard, isDarkMode }) => {
  if (!viewingText || !selectedOrder) return null;

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
      <div className={`rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className={`flex justify-between items-center p-4 border-b transition-colors duration-300 ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center">
            <FileText className="text-[#00a8ff] mr-2" size={20} />
            <h3 className={`text-lg font-bold transition-colors duration-300 ${
              isDarkMode ? 'text-gray-100' : 'text-gray-800'
            }`}>
              টেক্সট
            </h3>
          </div>
          <button
            onClick={onClose}
            className={`transition-colors duration-300 cursor-pointer ${
              isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-[70vh]">
          {selectedOrder.adminTextContent && (
            <>
              <div className={`mb-4 p-4 rounded-lg border transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-[#00a8ff]/10 border-[#00a8ff]/30' 
                  : 'bg-[#00a8ff]/5 border-[#00a8ff]/20'
              }`}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className={`transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      অর্ডার আইডি:
                    </p>
                    <p className={`font-bold transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-800'
                    }`}>
                      #{selectedOrder.orderId}
                    </p>
                  </div>
                  <div>
                    <p className={`transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      পরিষেবা:
                    </p>
                    <p className={`font-bold transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-800'
                    }`}>
                      {selectedOrder.serviceName}
                    </p>
                  </div>
                  <div>
                    <p className={`transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      তারিখ:
                    </p>
                    <p className={`font-bold transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-800'
                    }`}>
                      {formatDate(selectedOrder.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className={`transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      অবস্থা:
                    </p>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedOrder.status, isDarkMode)}`}>
                      {getStatusText(selectedOrder.status)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className={`p-4 rounded-lg border transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-gray-800/50 border-gray-700' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center">
                    <FileText className="text-green-600 mr-2" size={18} />
                    <h4 className={`font-bold transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                      টেক্সট কন্টেন্ট
                    </h4>
                  </div>
                  <button
                    onClick={() => copyTextToClipboard(selectedOrder.adminTextContent)}
                    className="bg-[#00a8ff] text-white px-3 py-1 rounded flex items-center text-sm hover:bg-[#0097e6] transition-colors cursor-pointer"
                  >
                    <Copy size={14} className="mr-1" />
                    কপি করুন
                  </button>
                </div>
                <div className={`p-4 rounded border transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-900 border-gray-600' 
                    : 'bg-white border-gray-300'
                }`}>
                  <pre className={`whitespace-pre-wrap font-sans text-sm leading-relaxed transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    {selectedOrder.adminTextContent}
                  </pre>
                </div>
                <div className={`mt-3 text-sm flex justify-between transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-500'
                }`}>
                  <span>অক্ষর: {selectedOrder.adminTextContent.length}</span>
                  <span>শব্দ: {selectedOrder.adminTextContent.trim().split(/\s+/).length}</span>
                </div>
              </div>
            </>
          )}
        </div>
        
        <div className={`p-4 border-t flex justify-end transition-colors duration-300 ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <button
            onClick={onClose}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
});

// Reason Modal Component
const ReasonModal = memo(({ showReasonModal, selectedOrder, onClose, formatDate, formatCurrency, isDarkMode }) => {
  if (!showReasonModal || !selectedOrder) return null;

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
      <div className={`rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className={`flex justify-between items-center p-4 border-b transition-colors duration-300 ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center">
            <XCircle className="text-red-600 mr-2" size={20} />
            <h3 className={`text-lg font-bold transition-colors duration-300 ${
              isDarkMode ? 'text-gray-100' : 'text-gray-800'
            }`}>
              বাতিলকরণের কারণ
            </h3>
          </div>
          <button
            onClick={onClose}
            className={`transition-colors duration-300 cursor-pointer ${
              isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-[70vh]">
          <div className="space-y-4">
            <div className={`p-4 rounded-lg border transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-red-900/20 border-red-800/50' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    অর্ডার আইডি:
                  </p>
                  <p className={`font-bold transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    #{selectedOrder.orderId}
                  </p>
                </div>
                <div>
                  <p className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    সেবার নাম:
                  </p>
                  <p className={`font-bold transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    {selectedOrder.serviceName}
                  </p>
                </div>
                <div>
                  <p className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    বাতিলের তারিখ:
                  </p>
                  <p className={`font-bold transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    {formatDate(selectedOrder.cancelledAt)}
                  </p>
                </div>
                <div>
                  <p className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    মোট টাকা:
                  </p>
                  <p className={`font-bold transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    {formatCurrency(selectedOrder.totalAmount)}
                  </p>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-lg border transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center mb-3">
                <MessageSquare className="text-red-600 mr-2" size={18} />
                <h4 className={`font-bold transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  বাতিলকরণের কারণ
                </h4>
              </div>
              <div className={`p-4 rounded border transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-gray-900/50 border-gray-600' 
                  : 'bg-gray-50 border-gray-300'
              }`}>
                <p className={`leading-relaxed transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-800'
                }`}>
                  {selectedOrder.cancellationReason || 'কোন কারণ উল্লেখ করা হয়নি'}
                </p>
              </div>
              <div className={`mt-3 text-sm transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <div className="flex items-center">
                  <Info size={14} className="mr-1" />
                  <span>
                    এই অর্ডারটি {formatDate(selectedOrder.cancelledAt)} তারিখে বাতিল করা হয়েছে
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className={`p-4 border-t flex justify-end transition-colors duration-300 ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <button
            onClick={onClose}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
});

// Delete Confirmation Modal Component
const DeleteConfirmationModal = memo(({ 
  showDeleteModal, 
  orderToDelete, 
  onClose, 
  onConfirm,
  loading,
  isDarkMode 
}) => {
  if (!showDeleteModal || !orderToDelete) return null;

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
      <div className={`rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className={`flex justify-between items-center p-4 border-b transition-colors duration-300 ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center">
            <AlertTriangle className="text-red-600 mr-2" size={20} />
            <h3 className={`text-lg font-bold transition-colors duration-300 ${
              isDarkMode ? 'text-gray-100' : 'text-gray-800'
            }`}>
              অর্ডার মুছুন
            </h3>
          </div>
          <button
            onClick={onClose}
            className={`transition-colors duration-300 cursor-pointer ${
              isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
            }`}
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-[70vh]">
          <div className="space-y-4">

            <div className={`p-4 rounded-lg border transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-gray-800/50 border-gray-700' 
                : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    অর্ডার আইডি:
                  </span>
                  <span className={`font-bold transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    #{orderToDelete.orderId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    সেবার নাম:
                  </span>
                  <span className={`font-bold transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    {orderToDelete.serviceName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    অবস্থা:
                  </span>
                  <span className="font-bold text-green-600">সম্পন্ন</span>
                </div>
                <div className="flex justify-between">
                  <span className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    তারিখ:
                  </span>
                  <span className={`font-medium transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-800'
                  }`}>
                    {orderToDelete.createdAt ? new Date(orderToDelete.createdAt).toLocaleDateString('bn-BD') : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className={`p-4 border-t flex justify-end space-x-3 transition-colors duration-300 ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <button
            onClick={onClose}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors cursor-pointer"
            disabled={loading}
          >
            বাতিল করুন
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors cursor-pointer flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin mr-2" size={18} />
                মুছছি...
              </>
            ) : (
              <>
                <Trash2 size={18} className="mr-2" />
                মুছে ফেলুন
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

// Order View Modal Component
const OrderViewModal = memo(({ 
  showViewModal, 
  selectedOrder, 
  onClose, 
  formatDate, 
  formatCurrency, 
  getStatusColor, 
  getStatusText, 
  hasAdminOutput,
  openTextView,
  downloadAdminOutput,
  loading,
  openReasonModal,
  onDeleteClick,
  isDarkMode 
}) => {
  if (!showViewModal || !selectedOrder) return null;

  const StatusIcon = selectedOrder.status === 'completed' ? CheckCircle : 
    selectedOrder.status === 'processing' ? Clock : 
    selectedOrder.status === 'cancelled' ? XCircle : AlertCircle;

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
      <div className={`rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className={`flex justify-between items-center p-4 border-b transition-colors duration-300 ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center">
            <FileText className="text-[#00a8ff] mr-2" size={20} />
            <h3 className={`text-lg font-bold transition-colors duration-300 ${
              isDarkMode ? 'text-gray-100' : 'text-gray-800'
            }`}>
              অর্ডার বিস্তারিত
            </h3>
          </div>
          <button
            onClick={onClose}
            className={`transition-colors duration-300 cursor-pointer ${
              isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-[70vh]">
          <div className="space-y-4">
            {/* Order Header */}
            <div className={`p-4 rounded-lg border transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-[#00a8ff]/10 border-[#00a8ff]/30' 
                : 'bg-[#00a8ff]/5 border-[#00a8ff]/20'
            }`}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                  <h4 className={`text-xl font-bold transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-100' : 'text-gray-800'
                  }`}>
                    #{selectedOrder.orderId}
                  </h4>
                  <p className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {selectedOrder.serviceName}
                  </p>
                </div>
                <div className="mt-2 md:mt-0 text-right">
                  <p className={`text-2xl font-bold transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-100' : 'text-gray-800'
                  }`}>
                    {formatCurrency(selectedOrder.totalAmount)}
                  </p>
                  <span className={`inline-flex items-center px-3 py-1 mt-1 rounded-full text-sm font-medium ${getStatusColor(selectedOrder.status, isDarkMode)}`}>
                    <StatusIcon size={14} />
                    <span className="ml-1">{getStatusText(selectedOrder.status)}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Order Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-4 rounded-lg border transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-gray-800/50 border-gray-700' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <h5 className={`font-bold mb-3 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  অর্ডার তথ্য
                </h5>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className={`transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      সেবার হার:
                    </span>
                    <span className="font-medium">{formatCurrency(selectedOrder.serviceRate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      পরিমাণ:
                    </span>
                    <span className="font-medium">{selectedOrder.quantity || 1}</span>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-lg border transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-gray-800/50 border-gray-700' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <h5 className={`font-bold mb-3 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  সময়
                </h5>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className={`transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      তৈরি:
                    </span>
                    <span className="font-medium">{formatDate(selectedOrder.createdAt)}</span>
                  </div>
                  {selectedOrder.completedAt && (
                    <div className="flex justify-between">
                      <span className={`transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        সম্পন্ন:
                      </span>
                      <span className="font-medium">{formatDate(selectedOrder.completedAt)}</span>
                    </div>
                  )}
                  {selectedOrder.cancelledAt && (
                    <div className="flex justify-between">
                      <span className={`transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        বাতিল:
                      </span>
                      <span className="font-medium">{formatDate(selectedOrder.cancelledAt)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Admin Output Section */}
            {hasAdminOutput(selectedOrder) && (
              <div className={`p-4 rounded-lg border transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-green-900/20 border-green-800/50' 
                  : 'bg-green-50 border-green-200'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <CheckCircle className="text-green-600 mr-2" size={20} />
                    <h5 className={`font-bold transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                      ফাইল আউটপুট
                    </h5>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    isDarkMode 
                      ? 'bg-green-900/40 text-green-300 border border-green-700/50' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    <Check size={12} className="inline mr-1" />
                    আপলোড করা হয়েছে
                  </span>
                </div>
                
                {selectedOrder.adminTextContent && (
                  <div className={`p-3 rounded border transition-colors duration-300 ${
                    isDarkMode 
                      ? 'bg-gray-900 border-gray-600' 
                      : 'bg-white border-gray-300'
                  }`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center">
                        <FileText className="text-[#00a8ff] mr-2" size={18} />
                        <span className="font-medium">টেক্সট কন্টেন্ট</span>
                      </div>
                      <button
                        onClick={() => openTextView(selectedOrder)}
                        className="bg-[#00a8ff] text-white px-3 py-1 rounded text-sm transition-colors cursor-pointer flex items-center"
                      >
                        <Eye size={14} className="mr-1" />
                        দেখুন
                      </button>
                    </div>
                    <p className={`text-sm mt-1 transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {selectedOrder.adminTextContent.substring(0, 100)}...
                    </p>
                  </div>
                )}
                
                {selectedOrder.adminFile && (
                  <div className={`p-3 rounded border transition-colors duration-300 ${
                    isDarkMode 
                      ? 'bg-gray-900 border-gray-600' 
                      : 'bg-white border-gray-300'
                  }`}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <FileText className="text-red-600 mr-2" size={18} />
                        <div>
                          <p className="font-medium">{selectedOrder.adminFile.fileName}</p>
                          <p className={`text-xs transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-500' : 'text-gray-500'
                          }`}>
                            {(selectedOrder.adminFile.fileSize / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => downloadAdminOutput(selectedOrder._id)}
                        disabled={loading.downloading}
                        className={`px-3 py-1 rounded text-sm flex items-center transition-colors cursor-pointer ${
                          loading.downloading
                            ? 'bg-gray-400 text-white cursor-not-allowed'
                            : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                      >
                        <Download size={14} className="mr-1" />
                        {loading.downloading ? 'ডাউনলোড হচ্ছে...' : 'ডাউনলোড'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Cancellation Reason */}
            {selectedOrder.status === 'cancelled' && selectedOrder.cancellationReason && (
              <div className={`p-4 rounded-lg border transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-red-900/20 border-red-800/50' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <XCircle className="text-red-600 mr-2" size={20} />
                    <h5 className={`font-bold transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                      বাতিলকরণের কারণ
                    </h5>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      openReasonModal(selectedOrder);
                    }}
                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors cursor-pointer flex items-center"
                  >
                    <MessageSquare size={14} className="mr-1" />
                    পূর্ণ কারণ দেখুন
                  </button>
                </div>
                <div className={`p-3 rounded border transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-900 border-red-600' 
                    : 'bg-white border-red-300'
                }`}>
                  <p className={`line-clamp-2 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    {selectedOrder.cancellationReason}
                  </p>
                </div>
                <div className={`mt-2 text-sm transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  <div className="flex items-center">
                    <Info size={14} className="mr-1" />
                    এই অর্ডারটি {formatDate(selectedOrder.cancelledAt)} তারিখে বাতিল করা হয়েছে
                  </div>
                </div>
              </div>
            )}

            {/* User Notes */}
            {selectedOrder.notes && (
              <div className={`p-4 rounded-lg border transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-gray-800/50 border-gray-700' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <h5 className={`font-bold mb-2 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  আপনার নোট
                </h5>
                <p className={`transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {selectedOrder.notes}
                </p>
              </div>
            )}

            {/* Custom Field Values */}
            {selectedOrder.fieldValues && Object.keys(selectedOrder.fieldValues).length > 0 && (
              <div className={`p-4 rounded-lg border transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-gray-800/50 border-gray-700' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <h5 className={`font-bold mb-3 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  অতিরিক্ত তথ্য
                </h5>
                <div className="space-y-2">
                  {Object.entries(selectedOrder.fieldValues).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className={`transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {key}:
                      </span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className={`p-4 border-t flex justify-between transition-colors duration-300 ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          {selectedOrder.status === 'completed' && (
            <button
              onClick={() => {
                onClose();
                onDeleteClick(selectedOrder);
              }}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors cursor-pointer flex items-center"
            >
              <Trash2 size={18} className="mr-2" />
              অর্ডার মুছুন
            </button>
          )}
          <button
            onClick={onClose}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors cursor-pointer ml-auto"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
});

function Fileorder() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isWorkActive, setIsWorkActive] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  const navigate = useNavigate();
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const { isDarkMode } = useTheme();
  
  // Use context hooks
  const { 
    services, 
    orders, 
    loading, 
    error, 
    orderSuccessData,
    selectedOrder,
    showViewModal,
    viewingText,
    showReasonModal,
    fetchServices,
    fetchOrders,
    downloadOrderFile,
    getStatusColor: contextGetStatusColor,
    getStatusText,
    clearOrderSuccessData,
    clearError,
    openViewModal,
    closeViewModal,
    openTextView,
    closeTextView,
    openReasonModal,
    closeReasonModal
  } = useFileOrder();

  // Memoize handlers to prevent unnecessary re-renders
  const toggleSidebar = useCallback(() => setSidebarOpen(prev => !prev), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const closeSuccessPopup = useCallback(() => {
    setShowSuccessPopup(false);
    clearOrderSuccessData();
  }, [clearOrderSuccessData]);

  const handleServiceClick = useCallback((service) => {
    navigate(`/service/details/${service._id}`);
  }, [navigate]);

  const handleStartWork = useCallback(() => {
    setIsWorkActive(true);
  }, []);

  const handleStopWork = useCallback(() => {
    setIsWorkActive(false);
  }, []);

  // Enhanced getStatusColor with dark mode support
  const getStatusColor = useCallback((status, darkMode = isDarkMode) => {
    const colors = {
      'completed': darkMode ? 'bg-green-900/40 text-green-300 border border-green-700/50' : 'bg-green-100 text-green-800',
      'processing': darkMode ? 'bg-yellow-900/40 text-yellow-300 border border-yellow-700/50' : 'bg-yellow-100 text-yellow-800',
      'pending': darkMode ? 'bg-blue-900/40 text-blue-300 border border-blue-700/50' : 'bg-blue-100 text-blue-800',
      'cancelled': darkMode ? 'bg-red-900/40 text-red-300 border border-red-700/50' : 'bg-red-100 text-red-800'
    };
    
    return colors[status] || colors.pending;
  }, [isDarkMode]);

  // Handle download order file
  const handleDownload = useCallback(async (orderId, e) => {
    e.stopPropagation();
    await downloadOrderFile(orderId);
  }, [downloadOrderFile]);

  // Show success popup when orderSuccessData changes
  useEffect(() => {
    if (orderSuccessData) {
      setShowSuccessPopup(true);
    }
  }, [orderSuccessData]);

  // Calculate derived data - memoize if complex
  const filteredOrders = React.useMemo(() => 
    orders.filter(order =>
      order.serviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.orderId?.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [orders, searchTerm]
  );

  // Pagination calculations
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  const handlePageChange = useCallback((page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  // Only fetch data when isWorkActive changes to true
  useEffect(() => {
    if (isWorkActive) {
      // These will check cache internally and only fetch if needed
      fetchServices();
      fetchOrders();
    }
  }, []);

  // Reset page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Get icon component based on status
  const StatusIcon = useCallback(({ status }) => {
    const IconComponent = {
      'completed': CheckCircle,
      'processing': Clock,
      'pending': AlertCircle,
      'cancelled': XCircle
    }[status] || AlertCircle;
    
    return <IconComponent size={14} />;
  }, []);

  // Format currency
  const formatCurrency = useCallback((amount) => {
    if (!amount) return '0৳';
    return `${parseFloat(amount).toLocaleString('bn-BD')}৳`;
  }, []);

  // Format date
  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('bn-BD');
  }, []);

  // Check if order has admin output
  const hasAdminOutput = useCallback((order) => {
    return order.adminTextContent || order.adminFile;
  }, []);

  // Copy text to clipboard
  const copyTextToClipboard = useCallback((text) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success('টেক্সট কপি করা হয়েছে!'))
      .catch(() => toast.error('কপি করতে সমস্যা হয়েছে'));
  }, []);

  // Handle delete order
  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;
    const user = JSON.parse(localStorage.getItem('user'));
    const userId = user?.id;
    
    setDeleteLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${base_url}/api/user/orders/${orderToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'userId': userId,
        }
      });

      const data = await response.json();

      if (data.success) {
        toast.success('ফাইল অর্ডার সফলভাবে মুছে ফেলা হয়েছে');
        // Refresh orders list
        fetchOrders();
        // Close modals
        setShowDeleteModal(false);
        setOrderToDelete(null);
      } else {
        toast.error(data.error || 'অর্ডার মুছতে সমস্যা হয়েছে');
      }
    } catch (error) {
      console.error('Delete order error:', error);
      toast.error('সার্ভার এরর হয়েছে');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = useCallback((order) => {
    setOrderToDelete(order);
    setShowDeleteModal(true);
  }, []);

  // Close delete confirmation modal
  const closeDeleteModal = useCallback(() => {
    setShowDeleteModal(false);
    setOrderToDelete(null);
  }, []);

  // Action buttons component for each order
  const ActionButtons = memo(({ order }) => {
    if (order.status === 'cancelled') {
      return (
        <div className="flex space-x-1">
          <button
            onClick={() => openViewModal(order)}
            className="bg-[#00a8ff] text-white p-2 rounded-sm hover:bg-[#0097e6] transition duration-200 cursor-pointer"
            title="বিস্তারিত দেখুন"
          >
            <Eye size={14} />
          </button>
          
          {order.cancellationReason && (
            <button
              onClick={() => openReasonModal(order)}
              className="bg-red-600 text-white p-2 rounded-sm hover:bg-red-700 transition duration-200 cursor-pointer"
              title="বাতিলকরণের কারণ দেখুন"
            >
              <MessageSquare size={14} />
            </button>
          )}
          
          <button
            onClick={() => openDeleteModal(order)}
            className="bg-red-600 text-white p-2 rounded-sm hover:bg-red-700 transition duration-200 cursor-pointer"
            title="অর্ডার মুছুন"
          >
            <Trash2 size={14} />
          </button>
        </div>
      );
    }

    if (order.status === 'completed') {
      const hasOutput = hasAdminOutput(order);
      
      return (
        <div className="flex space-x-1">
          <button
            onClick={() => openViewModal(order)}
            className="bg-[#00a8ff] text-white p-2 rounded-sm hover:bg-[#0097e6] transition duration-200 cursor-pointer"
            title="বিস্তারিত দেখুন"
          >
            <Eye size={14} />
          </button>
          
          {hasOutput && order.adminTextContent && (
            <button
              onClick={() => openTextView(order)}
              className="bg-green-600 text-white p-2 rounded-sm hover:bg-green-700 transition duration-200 cursor-pointer"
              title="টেক্সট দেখুন"
            >
              <FileText size={14} />
            </button>
          )}
          
          {order.adminPdfFile && (
            <NavLink
            target='_blank'
                 to={`${base_url}${order.adminPdfFile.filePath}`}
              disabled={loading.downloading}
              className={`p-2 rounded-sm transition duration-200 cursor-pointer ${
                loading.downloading
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
              title="ফাইল ডাউনলোড"
            >
              <Download size={14} />
            </NavLink>
          )}
          
          <button
            onClick={() => openDeleteModal(order)}
            className="bg-red-600 text-white p-2 rounded-sm hover:bg-red-700 transition duration-200 cursor-pointer"
            title="অর্ডার মুছুন"
          >
            <Trash2 size={14} />
          </button>
        </div>
      );
    }
    
    const hasOutput = hasAdminOutput(order);
    
    return (
      <div className="flex space-x-1">
        <button
          onClick={() => openViewModal(order)}
          className="bg-[#00a8ff] text-white p-2 rounded-sm hover:bg-[#0097e6] transition duration-200 cursor-pointer"
          title="বিস্তারিত দেখুন"
        >
          <Eye size={14} />
        </button>
        
        {hasOutput && order.adminTextContent && (
          <button
            onClick={() => openTextView(order)}
            className="bg-green-600 text-white p-2 rounded-sm hover:bg-green-700 transition duration-200 cursor-pointer"
            title="টেক্সট দেখুন"
          >
            <FileText size={14} />
          </button>
        )}
        
        {hasOutput && order.adminFile && (
          <button
            onClick={() => downloadOrderFile(order._id)}
            disabled={loading.downloading}
            className={`p-2 rounded-sm transition duration-200 cursor-pointer ${
              loading.downloading
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
            title="ফাইল ডাউনলোড"
          >
            <Download size={14} />
          </button>
        )}
      </div>
    );
  });

  // If work is stopped
  if (!isWorkActive) {
    return (
      <div className={`font-anek lg:ml-72 mt-[9vh] transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-gray-900 text-gray-100' 
          : 'text-gray-700'
      }`}>
        <Header toggleSidebar={toggleSidebar} />
        <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />
        <Toaster />

        <main className={`min-h-[93vh] p-4 md:p-6 transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-gradient-to-br from-gray-900 to-gray-800' 
            : 'bg-gradient-to-br from-gray-50 to-gray-100'
        }`}>
          <h1 className={`text-xl md:text-2xl font-bold mb-4 transition-colors duration-300 ${
            isDarkMode ? 'text-[#00a8ff]' : 'text-[#00a8ff]'
          }`}>
            ফাইল অর্ডার সিস্টেম
          </h1>
          
          <div className={`border rounded-xl p-6 md:p-12 mb-6 flex flex-col items-center justify-center shadow-lg max-w-4xl mx-auto transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-gradient-to-r from-gray-800 to-gray-900 border-gray-700' 
              : 'bg-gradient-to-r from-white to-gray-50 border-gray-200'
          }`}>
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-full p-4 md:p-6 mb-4 md:mb-6 shadow-lg">
              <Power size={40} md:size={56} color="white" strokeWidth={2.5} />
            </div>
            <h2 className="text-red-600 text-2xl md:text-4xl font-bold mb-2 md:mb-3">কাজ বন্ধ</h2>
            <p className={`text-sm md:text-lg mb-6 md:mb-8 text-center max-w-md transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              সিস্টেমটি বর্তমানে অকার্যকর অবস্থায় রয়েছে। কাজ চালু হলে এখানে সব সেবা অপশন দেখতে পারবেন।
            </p>
            <button
              onClick={handleStartWork}
              className="bg-gradient-to-r from-[#00a8ff] to-[#0097e6] hover:from-[#0097e6] hover:to-[#0088cc] text-white font-semibold py-3 px-6 rounded-xl transition duration-200"
            >
              কাজ চালু করুন
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={`font-anek lg:ml-72 mt-[9vh] transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gray-900 text-gray-100' 
        : 'text-gray-800'
    }`}>
      <Header toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />
      <Toaster />
      
      <SuccessPopup 
        showSuccessPopup={showSuccessPopup} 
        orderSuccessData={orderSuccessData} 
        onClose={closeSuccessPopup}
        isDarkMode={isDarkMode}
      />
      <main className={`min-h-[93vh] p-4 md:p-6 transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-gray-900 to-gray-800' 
          : 'bg-gradient-to-br from-gray-50 to-gray-100'
      }`}>
        {/* Page Header with Work Control */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
          <div>
            <h1 className={`text-xl md:text-2xl lg:text-3xl font-bold transition-colors duration-300 ${
              isDarkMode ? 'text-[#00a8ff]' : 'text-[#00a8ff]'
            }`}>
              ফাইল অর্ডার সিস্টেম
            </h1>
            <p className={`text-xs md:text-sm lg:text-base mt-1 md:mt-2 transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              আপনার প্রয়োজনীয় ফাইল সেবা নির্বাচন করুন এবং দ্রুত অর্ডার সম্পন্ন করুন
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className={`text-xs md:text-sm transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              মোট সেবা: <span className="font-bold text-green-600">{services.length}</span>
            </div>
          </div>
        </div>

        {/* Services Grid */}
        <div className="mb-8 md:mb-10">
          {loading.services ? (
            <div className="flex justify-center items-center py-8">
              <ApertureLoader/>
            </div>
          ) : services.length === 0 ? (
            <div className={`border-2 border-dashed rounded-2xl p-6 md:p-12 text-center shadow-sm transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-gradient-to-r from-gray-800 to-gray-900 border-gray-700' 
                : 'bg-gradient-to-r from-white to-gray-50 border-gray-300'
            }`}>
              <Info className={`mx-auto mb-3 md:mb-4 size-12 md:size-16 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-600' : 'text-gray-400'
              }`} />
              <p className={`text-base md:text-xl font-medium mb-1 md:mb-2 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                কোন সেবা পাওয়া যায়নি
              </p>
              <p className={`text-xs md:text-sm max-w-md mx-auto transition-colors duration-300 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-500'
              }`}>
                বর্তমানে কোনো সেবা উপলব্ধ নেই। দয়া করে পরে আবার চেষ্টা করুন।
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
              {services.map((service) => (
                <ServiceCard 
                  key={service._id}
                  service={service}
                  onClick={() => handleServiceClick(service)}
                  isDarkMode={isDarkMode}
                />
              ))}
            </div>
          )}
        </div>

        {/* Orders History Table - Always show if there are orders */}
        {orders.length > 0 && (
          <div className={`border rounded-[5px] p-4 md:p-6 transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' 
              : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'
          }`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4 md:gap-6">
              <div>
                <h2 className={`text-lg md:text-xl lg:text-2xl font-bold transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-800'
                }`}>
                  ফাইল অর্ডার সমূহ
                </h2>
                <p className={`text-xs md:text-sm lg:text-base mt-1 md:mt-2 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  আপনার সকল ফাইল অর্ডারের ইতিহাস এবং স্ট্যাটাস
                </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-3 md:gap-4">
                <div className={`flex items-center text-xs md:text-sm px-2 md:px-3 py-1.5 md:py-2 rounded-lg md:rounded-xl border transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-600' 
                    : 'bg-white border-gray-300'
                }`}>
                  <span className={`mr-1 md:mr-2 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    প্রদর্শন:
                  </span>
                  <select 
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(parseInt(e.target.value));
                      setCurrentPage(1);
                    }}
                    className={`border-0 focus:outline-none focus:ring-1 focus:ring-[#00a8ff] bg-transparent text-xs md:text-sm cursor-pointer transition-colors ${
                      isDarkMode 
                        ? 'text-gray-200' 
                        : 'text-gray-700'
                    }`}
                  >
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                  </select>
                </div>

                <div className={`flex items-center text-xs md:text-sm px-2 md:px-3 py-1.5 md:py-2 rounded-lg md:rounded-xl border transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-600' 
                    : 'bg-white border-gray-300'
                }`}>
                  <span className={`mr-1 md:mr-2 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    খুঁজুন:
                  </span>
                  <div className="relative">
                    <Search size={14} md:size={16} className={`absolute left-2 top-1/2 transform -translate-y-1/2 ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-400'
                    }`} />
                    <input 
                      type="text" 
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                      className={`border-0 pl-7 md:pl-8 pr-2 md:pr-3 py-1 focus:outline-none focus:ring-1 focus:ring-[#00a8ff] w-36 md:w-48 text-xs md:text-sm transition-colors ${
                        isDarkMode
                          ? 'bg-transparent text-gray-200 placeholder-gray-500'
                          : 'bg-transparent text-gray-900 placeholder-gray-400'
                      }`}
                      placeholder="অর্ডার খুঁজুন..."
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto ">
              {loading.orders ? (
                 <div className="flex justify-center items-center py-8 md:py-12">
                   <ApertureLoader/>
                </div>
              ) : (
                <table className="w-full text-center border-collapse border-[1px] border-gray-200">
                  <thead>
                    <tr className={`text-nowrap border-t border-b transition-colors duration-300 ${
                      isDarkMode
                        ? 'bg-[#00a8ff]/10 border-gray-700'
                        : 'bg-[#00a8ff]/5 border-gray-300'
                    }`}>
                      <th className={`p-3 text-xs font-semibold uppercase tracking-wider border-r transition-colors duration-300 ${
                        isDarkMode
                          ? 'text-gray-300 border-gray-700'
                          : 'text-gray-600 border-gray-200'
                      }`}>
                        ক্রম 
                      </th>
                      <th className={`p-3 text-sm font-semibold border-r transition-colors duration-300 ${
                        isDarkMode
                          ? 'text-gray-300 border-gray-700'
                          : 'text-gray-600 border-gray-200'
                      }`}>
                        সেবার নাম
                      </th>
                      <th className={`p-3 text-sm font-semibold border-r transition-colors duration-300 ${
                        isDarkMode
                          ? 'text-gray-300 border-gray-700'
                          : 'text-gray-600 border-gray-200'
                      }`}>
                        স্ট্যাটাস
                      </th>
                      <th className={`p-3 text-sm font-semibold border-r transition-colors duration-300 ${
                        isDarkMode
                          ? 'text-gray-300 border-gray-700'
                          : 'text-gray-600 border-gray-200'
                      }`}>
                        মোট টাকা
                      </th>
                      <th className={`p-3 text-sm font-semibold border-r transition-colors duration-300 ${
                        isDarkMode
                          ? 'text-gray-300 border-gray-700'
                          : 'text-gray-600 border-gray-200'
                      }`}>
                        তারিখ
                      </th>
                      <th className={`p-3 text-sm font-semibold transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        অ্যাকশন
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.length === 0 ? (
                      <tr className="">
                        <td colSpan="7" className="p-8 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <FileText className={isDarkMode ? 'text-gray-600' : 'text-gray-400'} size={48} />
                            <p className={`font-medium mb-2 transition-colors duration-300 ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              কোন অর্ডার পাওয়া যায়নি
                            </p>
                            <p className={`text-sm max-w-md transition-colors duration-300 ${
                              isDarkMode ? 'text-gray-500' : 'text-gray-500'
                            }`}>
                              {searchTerm ? 'আপনার সার্চের সাথে মিলছে এমন কোনো অর্ডার নেই' : 'আপনার প্রথম অর্ডারটি এখনই করুন!'}
                            </p>
                            {searchTerm && (
                              <button
                                onClick={() => setSearchTerm('')}
                                className="mt-4 text-sm bg-[#00a8ff] text-white px-4 py-2 rounded-sm cursor-pointer"
                              >
                                সার্চ ক্লিয়ার করুন
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      currentOrders.map((order, index) => (
                        <tr 
                          key={order._id || index} 
                          className={`border-b hover:transition-colors duration-300 ${
                            index % 2 === 0 
                              ? isDarkMode ? 'bg-gray-800/30 hover:bg-gray-800/50' : 'bg-white hover:bg-gray-50'
                              : isDarkMode ? 'bg-gray-900/30 hover:bg-gray-900/50' : 'bg-gray-50 hover:bg-gray-100'
                          } ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
                        >
                          <td className={`p-3 text-sm font-medium border-r transition-colors duration-300 ${
                            isDarkMode
                              ? 'text-gray-300 border-gray-700'
                              : 'text-gray-700 border-gray-200'
                          }`}>
                            {startIndex + index + 1}
                          </td>
                          <td className={`p-3 text-sm border-r transition-colors duration-300 ${
                            isDarkMode
                              ? 'text-gray-200 border-gray-700'
                              : 'text-gray-800 border-gray-200'
                          }`}>
                            {order.serviceName || 'N/A'}
                          </td>
                          <td className={`p-3 border-r text-nowrap transition-colors duration-300 ${
                            isDarkMode ? 'border-gray-700' : 'border-gray-200'
                          }`}>
                            <div className="flex flex-col items-center gap-1">
                              <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full font-medium ${getStatusColor(order.status, isDarkMode)}`}>
                                <StatusIcon status={order.status} />
                                {getStatusText(order.status)}
                              </span>
                              {hasAdminOutput(order) && order.status !== 'cancelled' && (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  isDarkMode
                                    ? 'bg-green-900/40 text-green-300 border border-green-700/50 mt-1'
                                    : 'bg-green-100 text-green-800 border-[1px] border-green-500 mt-1'
                                }`}>
                                  {order.adminTextContent ? 'টেক্সট প্রাপ্ত' : 'ফাইল প্রাপ্ত'}
                                </span>
                              )}
                              {order.status === 'cancelled' && order.cancellationReason && (
                                <div className="text-xs text-red-600 mt-1">
                                  <Info size={10} className="inline mr-1" />
                                  কারণ দেখুন
                                </div>
                              )}
                            </div>
                          </td>
                          <td className={`p-3 text-sm font-bold border-r transition-colors duration-300 ${
                            isDarkMode
                              ? 'text-gray-200 border-gray-700'
                              : 'text-gray-800 border-gray-200'
                          }`}>
                            {formatCurrency(order.totalAmount)}
                          </td>
                          <td className={`p-3 text-sm text-nowrap border-r transition-colors duration-300 ${
                            isDarkMode
                              ? 'text-gray-400 border-gray-700'
                              : 'text-gray-600 border-gray-200'
                          }`}>
                            <div className="flex items-center justify-center gap-1">
                              <Calendar size={12} />
                              {formatDate(order.createdAt)}
                            </div>
                          </td>
                          <td className="p-3">
                            <ActionButtons order={order} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {filteredOrders.length > 0 && totalPages > 1 && (
              <div className={`flex flex-col md:flex-row justify-between items-center mt-6 md:mt-8 pt-4 md:pt-6 border-t text-xs md:text-sm transition-colors duration-300 ${
                isDarkMode 
                  ? 'border-gray-700 text-gray-400' 
                  : 'border-gray-200 text-gray-500'
              }`}>
                <div className="mb-3 md:mb-0">
                  প্রদর্শন <span className={`font-bold transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {startIndex + 1}
                  </span> থেকে{' '}
                  <span className={`font-bold transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {Math.min(endIndex, filteredOrders.length)}
                  </span> এর{' '}
                  <span className={`font-bold transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {filteredOrders.length}
                  </span> টি এন্ট্রি
                </div>
                <div className="flex items-center space-x-1 md:space-x-2">
                  <button 
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className={`p-1.5 md:p-2.5 border rounded-lg hover:transition-colors disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 cursor-pointer ${
                      isDarkMode
                        ? 'bg-gray-800 border-gray-600 hover:bg-gray-700'
                        : 'bg-gradient-to-r from-gray-100 to-gray-200 border-gray-300 hover:from-gray-200 hover:to-gray-300'
                    }`}
                  >
                    <ChevronsLeft size={14} md:size={16} />
                  </button>
                  <button 
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`p-1.5 md:p-2.5 border rounded-lg hover:transition-colors disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 cursor-pointer ${
                      isDarkMode
                        ? 'bg-gray-800 border-gray-600 hover:bg-gray-700'
                        : 'bg-gradient-to-r from-gray-100 to-gray-200 border-gray-300 hover:from-gray-200 hover:to-gray-300'
                    }`}
                  >
                    <ChevronLeft size={14} md:size={16} />
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 md:px-4 py-1.5 md:py-2 border rounded-lg transition-all duration-300 text-xs md:text-sm cursor-pointer ${
                          currentPage === pageNum 
                            ? 'bg-gradient-to-r from-[#00a8ff] to-[#0097e6] text-white border-[#00a8ff] shadow-md' 
                            : isDarkMode
                              ? 'bg-gray-800 border-gray-600 hover:bg-gray-700'
                              : 'bg-gradient-to-r from-gray-100 to-gray-200 border-gray-300 hover:from-gray-200 hover:to-gray-300'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button 
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`p-1.5 md:p-2.5 border rounded-lg hover:transition-colors disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 cursor-pointer ${
                      isDarkMode
                        ? 'bg-gray-800 border-gray-600 hover:bg-gray-700'
                        : 'bg-gradient-to-r from-gray-100 to-gray-200 border-gray-300 hover:from-gray-200 hover:to-gray-300'
                    }`}
                  >
                    <ChevronRight size={14} md:size={16} />
                  </button>
                  <button 
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className={`p-1.5 md:p-2.5 border rounded-lg hover:transition-colors disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 cursor-pointer ${
                      isDarkMode
                        ? 'bg-gray-800 border-gray-600 hover:bg-gray-700'
                        : 'bg-gradient-to-r from-gray-100 to-gray-200 border-gray-300 hover:from-gray-200 hover:to-gray-300'
                    }`}
                  >
                    <ChevronsRight size={14} md:size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      <TextViewModal 
        viewingText={viewingText}
        selectedOrder={selectedOrder}
        onClose={closeTextView}
        formatDate={formatDate}
        getStatusColor={getStatusColor}
        getStatusText={getStatusText}
        copyTextToClipboard={copyTextToClipboard}
        isDarkMode={isDarkMode}
      />
      
      <OrderViewModal 
        showViewModal={showViewModal}
        selectedOrder={selectedOrder}
        onClose={closeViewModal}
        formatDate={formatDate}
        formatCurrency={formatCurrency}
        getStatusColor={getStatusColor}
        getStatusText={getStatusText}
        hasAdminOutput={hasAdminOutput}
        openTextView={openTextView}
        downloadAdminOutput={downloadOrderFile}
        loading={loading}
        openReasonModal={openReasonModal}
        onDeleteClick={openDeleteModal}
        isDarkMode={isDarkMode}
      />
      
      <ReasonModal 
        showReasonModal={showReasonModal}
        selectedOrder={selectedOrder}
        onClose={closeReasonModal}
        formatDate={formatDate}
        formatCurrency={formatCurrency}
        isDarkMode={isDarkMode}
      />
      
      <DeleteConfirmationModal
        showDeleteModal={showDeleteModal}
        orderToDelete={orderToDelete}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteOrder}
        loading={deleteLoading}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}

// Memoize the service card component
const ServiceCard = memo(({ service, onClick, isDarkMode }) => (
  <div 
    onClick={onClick}
    className={`group relative flex justify-center items-center flex-col border-[1px] rounded-xl md:rounded-2xl p-4 md:p-5 cursor-pointer transition-all duration-300 hover:shadow-lg md:hover:shadow-2xl hover:scale-[1.02] ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 hover:border-gray-600' 
        : 'bg-gradient-to-br from-white to-gray-50 border-gray-200 hover:border-gray-300'
    }`}
  >
    <div className="flex justify-between items-start mb-3 md:mb-4">
      <img className='w-[60px] md:w-[75px]' src={file_img} alt={service.workName} />
    </div>
    
    <div className="mb-3 md:mb-4">
      <h3 className={`font-bold text-sm text-center md:text-[22px] mb-1 line-clamp-2 leading-tight transition-colors duration-300 ${
        isDarkMode ? 'text-gray-200' : 'text-gray-900'
      }`}>
        {service.workName || service.workNameEnglish}
      </h3>
    </div>
    <div className="bg-gradient-to-r w-auto from-green-500 to-green-600 text-white text-xs md:text-sm font-bold px-2 md:px-3 py-1 md:py-1.5 rounded-lg">
      {service.workRate || '0'} টাকা
    </div>
    
    <div className={`absolute inset-0 border-2 rounded-xl md:rounded-2xl group-hover:border-green-200 transition-all duration-300 pointer-events-none ${
      isDarkMode ? 'border-transparent' : 'border-transparent'
    }`}></div>
  </div>
));

export default Fileorder;