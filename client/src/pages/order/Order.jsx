import React, { useState, useEffect, useCallback, memo } from 'react';
import { 
  Power, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  Download,
  FileText,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  File,
  Image,
  FileType,
  Eye,
  Copy,
  Package,
  DollarSign,
  Send,
  Check,
  X,
  Info,
  MessageSquare,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import Header from '../../components/header/Header';
import Sidebar from '../../components/sidebar/Sidebar';
import { Toaster, toast } from 'react-hot-toast';
import { useOrder } from '../../context/Ordercontext';
import ApertureLoader from '../../components/loader/ApertureLoader';
import { FaBangladeshiTakaSign } from "react-icons/fa6";
import { useTheme } from '../../context/ThemeContext';
import { NavLink, useNavigate } from 'react-router-dom';

// Memoized components for better performance

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

const OrderViewModal = memo(({ 
  showViewModal, 
  selectedOrder, 
  onClose, 
  formatDate, 
  formatCurrency, 
  getStatusColor, 
  getStatusText, 
  getOrderTypeIcon, 
  getOrderTypeText,
  hasAdminOutput,
  openTextView,
  downloadAdminOutput,
  loading,
  openReasonModal,
  onDeleteClick,
  isDarkMode 
}) => {
  if (!showViewModal || !selectedOrder) return null;

  const IconComponent = {
    CheckCircle, XCircle, Clock, AlertCircle, FileText, File, Image, FileType, Send, MessageSquare
  };

  const StatusIcon = IconComponent[selectedOrder.status === 'completed' ? 'CheckCircle' : 
    selectedOrder.status === 'processing' ? 'Clock' : 
    selectedOrder.status === 'cancelled' ? 'XCircle' : 'AlertCircle'] || AlertCircle;

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
                      অর্ডার ধরন:
                    </span>
                    <div className="flex items-center font-medium">
                      <span className="ml-2">{getOrderTypeText(selectedOrder.orderType)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className={`transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      পরিশোধ:
                    </span>
                    <span className="font-medium">{formatCurrency(selectedOrder.serviceRate)}</span>
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
                    <Send className="text-green-600 mr-2" size={20} />
                    <h5 className={`font-bold transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                      অ্যাডমিনের আউটপুট
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
                
                {selectedOrder.orderType === 'text_file' && selectedOrder.adminTextContent && (
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
                
                {selectedOrder.orderType === 'pdf_file' && selectedOrder.adminPdfFile && (
                  <div className={`p-3 rounded border transition-colors duration-300 ${
                    isDarkMode 
                      ? 'bg-gray-900 border-gray-600' 
                      : 'bg-white border-gray-300'
                  }`}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <File className="text-red-600 mr-2" size={18} />
                        <div>
                          <p className="font-medium">{selectedOrder.adminPdfFile.fileName}</p>
                          <p className={`text-xs transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-500' : 'text-gray-500'
                          }`}>
                            {(selectedOrder.adminPdfFile.fileSize / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* জিরো রিটার্ন ফাইল সেকশন */}
                {selectedOrder.serviceName === 'জিরো রিটার্ন' && 
                 selectedOrder.zeroReturnDocument && 
                 selectedOrder.zeroReturnDocument.files && 
                 selectedOrder.zeroReturnDocument.files.length > 0 && (
                  <div className={`p-3 rounded border transition-colors duration-300 ${
                    isDarkMode 
                      ? 'bg-gray-900 border-gray-600' 
                      : 'bg-white border-gray-300'
                  }`}>
                    <div className="flex items-center mb-2">
                      <File className="text-blue-600 mr-2" size={18} />
                      <h6 className={`font-medium transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-200' : 'text-gray-700'
                      }`}>
                        জিরো রিটার্ন ডকুমেন্টস ({selectedOrder.zeroReturnDocument.files.length} টি ফাইল)
                      </h6>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {selectedOrder.zeroReturnDocument.files.map((file, index) => (
                        <div key={file._id || index} 
                          className={`p-2 rounded border transition-colors duration-300 ${
                            isDarkMode 
                              ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-800' 
                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                          }`}>
                          <div className="flex justify-between items-center mb-1">
                            <span className={`text-sm font-medium truncate transition-colors duration-300 ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              ফাইল {index + 1}
                            </span>
                            <NavLink 
                              target='_blank'
                              to={`${import.meta.env.VITE_API_KEY_Base_URL}${file.filePath}`}
                              className="bg-green-600 text-white p-1 rounded hover:bg-green-700 transition-colors cursor-pointer"
                              title="ডাউনলোড করুন"
                            >
                              <Download size={12} />
                            </NavLink>
                          </div>
                          <p className={`text-xs truncate transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {file.originalName}
                          </p>
                          <p className={`text-xs transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-500' : 'text-gray-600'
                          }`}>
                            {(file.fileSize / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      ))}
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

function Order() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isWorkActive, setIsWorkActive] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const { isDarkMode } = useTheme();
  const navigate=useNavigate()
  const {
    orders,
    loading,
    selectedOrder,
    showViewModal,
    viewingText,
    showReasonModal,
    fetchOrders,
    openViewModal,
    closeViewModal,
    openTextView,
    closeTextView,
    openReasonModal,
    closeReasonModal,
    downloadAdminOutput,
    formatDate,
    formatCurrency,
    getStatusColor: contextGetStatusColor,
    getStatusText,
    getStatusIcon,
    getOrderTypeIcon,
    getOrderTypeText,
    hasAdminOutput,
    copyTextToClipboard
  } = useOrder();

  const toggleSidebar = useCallback(() => setSidebarOpen(prev => !prev), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

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

  // Filter orders based on search term
  const filteredOrders = React.useMemo(() => 
    orders.filter(order =>
      order.serviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.orderType?.toLowerCase().includes(searchTerm.toLowerCase())
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

  // Fetch orders when work is active
  useEffect(() => {
    if (isWorkActive) {
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

  // Get order type icon component
  const OrderTypeIcon = useCallback(({ type }) => {
    const IconComponent = {
      'text_file': FileText,
      'pdf_file': File,
      'image_file': Image,
      'document_file': FileType
    }[type] || FileText;
    
    return <IconComponent size={14} className={
      type === 'text_file' ? 'text-[#00a8ff]' :
      type === 'pdf_file' ? 'text-red-600' :
      type === 'image_file' ? 'text-green-600' :
      type === 'document_file' ? 'text-purple-600' : 'text-gray-600'
    } />;
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
        toast.success('অর্ডার সফলভাবে মুছে ফেলা হয়েছে');
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
    // জিরো রিটার্ন এর জন্য বিশেষ হ্যান্ডলিং
    if (order.serviceName === 'জিরো রিটার্ন' && 
        order.zeroReturnDocument && 
        order.zeroReturnDocument.files && 
        order.zeroReturnDocument.files.length > 0) {
      
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
        return (
          <div className="flex space-x-1">
            <button
              onClick={() => openViewModal(order)}
              className="bg-[#00a8ff] text-white p-2 rounded-sm hover:bg-[#0097e6] transition duration-200 cursor-pointer"
              title="বিস্তারিত দেখুন"
            >
              <Eye size={14} />
            </button>
            
            {/* জিরো রিটার্ন ফাইল ডাউনলোড বাটন */}
            {order.zeroReturnDocument.files.slice(0, 3).map((file, index) => (
              <NavLink 
                key={file._id || index}
                target='_blank'
                to={`${base_url}${file.filePath}`}
                className="bg-green-600 text-white p-2 rounded-sm hover:bg-green-700 transition duration-200 cursor-pointer"
                title={`ফাইল ${index + 1} ডাউনলোড করুন`}
              >
                <Download size={14} />
              </NavLink>
            ))}
            
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
    }

    // রেগুলার অর্ডার হ্যান্ডলিং (আপনার মূল কোড)
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
          
          {hasOutput && order.orderType === 'text_file' && (
            <button
              onClick={() => openTextView(order)}
              className="bg-green-600 text-white p-2 rounded-sm hover:bg-green-700 transition duration-200 cursor-pointer"
              title="টেক্সট দেখুন"
            >
              <FileText size={14} />
            </button>
          )}
          
          {hasOutput && order.orderType === 'pdf_file' && (
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
        
        {hasOutput && order.orderType === 'text_file' && (
          <button
            onClick={() => openTextView(order)}
            className="bg-green-600 text-white p-2 rounded-sm hover:bg-green-700 transition duration-200 cursor-pointer"
            title="টেক্সট দেখুন"
          >
            <FileText size={14} />
          </button>
        )}
        
        {hasOutput && order.orderType === 'pdf_file' && (
          <button
            onClick={() => downloadAdminOutput(order._id)}
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
          isDarkMode ? 'bg-gray-900' : 'bg-[#f8f9fa]'
        }`}>
          <h1 className={`text-xl font-bold mb-4 transition-colors duration-300 ${
            isDarkMode ? 'text-[#00a8ff]' : 'text-[#00a8ff]'
          }`}>
            অর্ডার সিস্টেম
          </h1>
          
          <div className={`border rounded-sm p-8 mb-6 flex flex-col items-center justify-center shadow-sm max-w-4xl mx-auto transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-gray-800/50 border-gray-700' 
              : 'bg-white border-gray-300'
          }`}>
            <div className="bg-[#ff4d4d] rounded-full p-4 mb-4">
              <Power size={48} color="white" strokeWidth={3} />
            </div>
            <h2 className={`text-[#ff4d4d] text-3xl font-bold mb-2 transition-colors duration-300 ${
              isDarkMode ? 'text-[#ff4d4d]' : 'text-[#ff4d4d]'
            }`}>
              কাজ বন্ধ
            </h2>
            <p className={`text-sm mb-6 transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              সিস্টেমটি বর্তমানে অকার্যকর অবস্থায় রয়েছে। কাজ চালু হলে এখানে আপনার অর্ডার ইতিহাস দেখতে পারবেন।
            </p>
            <button
              onClick={handleStartWork}
              className="bg-[#00a8ff] hover:bg-[#0097e6] text-white font-semibold py-2 px-6 rounded-sm transition duration-200 cursor-pointer"
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
        : 'text-gray-700'
    }`}>
      <Header toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />
      <Toaster />

      <main className={`min-h-[93vh] p-4 md:p-6 transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-900' : 'bg-[#f8f9fa]'
      }`}>
        {/* Page Title with Work Control */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className={`text-2xl font-bold mb-1 transition-colors duration-300 ${
              isDarkMode ? 'text-[#00a8ff]' : 'text-[#00a8ff]'
            }`}>
              অর্ডার সিস্টেম
            </h1>
            <p className={`text-sm transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              আপনার সকল অর্ডারের ইতিহাস এবং স্ট্যাটাস
            </p>
          </div>
        </div>

        {/* Order Summary */}
        {orders.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className={`border rounded-sm p-4 shadow-sm transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-gray-800/50 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-sm transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    মোট অর্ডার
                  </div>
                  <div className={`text-2xl font-bold transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    {orders.length}
                  </div>
                </div>
                <Package className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} size={24} />
              </div>
            </div>
            <div className={`border rounded-sm p-4 shadow-sm transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-gray-800/50 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-sm transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    সম্পন্ন
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {orders.filter(o => o.status === 'completed').length}
                  </div>
                </div>
                <CheckCircle className={isDarkMode ? 'text-green-500' : 'text-green-400'} size={24} />
              </div>
            </div>
            <div className={`border rounded-sm p-4 shadow-sm transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-gray-800/50 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-sm transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    বাতিল
                  </div>
                  <div className="text-2xl font-bold text-red-600">
                    {orders.filter(o => o.status === 'cancelled').length}
                  </div>
                </div>
                <XCircle className={isDarkMode ? 'text-red-500' : 'text-red-400'} size={24} />
              </div>
            </div>
            <div className={`border rounded-sm p-4 shadow-sm transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-gray-800/50 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-sm transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    সর্বমোট টাকা
                  </div>
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0))}
                  </div>
                </div>
                <FaBangladeshiTakaSign className={isDarkMode ? 'text-purple-500' : 'text-purple-400'} size={24} />
              </div>
            </div>
          </div>
        )}

        {/* Table Section */}
        <div className={`mt-[30px] border rounded-sm shadow-sm p-4 transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-gray-800/50 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          
          {/* Table Controls */}
          <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
            <div className={`flex items-center text-sm transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-700'
            }`}>
              <span className="mr-2">প্রদর্শন:</span>
              <select 
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(parseInt(e.target.value));
                  setCurrentPage(1);
                }}
                className={`border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#00a8ff] cursor-pointer transition-colors ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-600 text-gray-100'
                    : 'bg-white border-gray-300 text-gray-700'
                }`}
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
              <span className="ml-2">এন্ট্রি</span>
            </div>

            <div className={`flex items-center text-sm transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-700'
            }`}>
              <span className="mr-2">খুঁজুন:</span>
              <div className="relative">
                <Search size={16} className={`absolute left-2 top-1/2 transform -translate-y-1/2 ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`} />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className={`border rounded px-2 py-1 pl-8 focus:outline-none focus:ring-1 focus:ring-[#00a8ff] w-48 md:w-64 transition-colors ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                  placeholder="অর্ডার আইডি, সেবা, বা ধরন খুঁজুন..."
                />
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto">
            {loading.orders ? (
              <div className="flex justify-center items-center py-12">
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
                      ধরন
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
                      <td colSpan="8" className="p-8 text-center">
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
                            <div className="flex items-center gap-1">
                              <OrderTypeIcon type={order.orderType} />
                              <span className={`text-sm font-medium transition-colors duration-300 ${
                                isDarkMode ? 'text-gray-200' : 'text-gray-800'
                              }`}>
                                {getOrderTypeText(order.orderType)}
                              </span>
                            </div>
                            {hasAdminOutput(order) && order.status !== 'cancelled' && (
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                isDarkMode
                                  ? 'bg-green-900/40 text-green-300 border border-green-700/50'
                                  : 'bg-green-100 text-green-800 border-[1px] border-green-500 mt-1'
                              }`}>
                                {order.orderType === 'text_file' ? 'টেক্সট প্রাপ্ত' : 'ফাইল প্রাপ্ত'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className={`p-3 border-r text-nowrap transition-colors duration-300 ${
                          isDarkMode ? 'border-gray-700' : 'border-gray-200'
                        }`}>
                          <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full font-medium ${getStatusColor(order.status, isDarkMode)}`}>
                            <StatusIcon status={order.status} />
                            {getStatusText(order.status)}
                          </span>
                          {order.status === 'cancelled' && order.cancellationReason && (
                            <div className="text-xs text-red-600 mt-1">
                              <Info size={10} className="inline mr-1" />
                              কারণ দেখুন
                            </div>
                          )}
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
          {filteredOrders.length > 0 && (
            <div className={`flex flex-wrap justify-between items-center mt-4 pt-4 border-t text-sm transition-colors duration-300 ${
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
              <div className="flex items-center space-x-1">
                <button 
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className={`p-2 border rounded hover:transition-colors duration-200 cursor-pointer ${
                    isDarkMode
                      ? 'border-gray-700 hover:bg-gray-800 disabled:opacity-50'
                      : 'border-gray-200 hover:bg-gray-50 disabled:opacity-50'
                  } disabled:cursor-not-allowed`}
                >
                  <ChevronsLeft size={14} />
                </button>
                <button 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`p-2 border rounded hover:transition-colors duration-200 cursor-pointer ${
                    isDarkMode
                      ? 'border-gray-700 hover:bg-gray-800 disabled:opacity-50'
                      : 'border-gray-200 hover:bg-gray-50 disabled:opacity-50'
                  } disabled:cursor-not-allowed`}
                >
                  <ChevronLeft size={14} />
                </button>
                
                {/* Page Numbers */}
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
                      className={`px-3 py-1 border rounded transition duration-200 cursor-pointer ${
                        currentPage === pageNum 
                          ? 'bg-[#00a8ff] text-white border-[#00a8ff]' 
                          : isDarkMode
                            ? 'border-gray-700 hover:bg-gray-800'
                            : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`p-2 border rounded hover:transition-colors duration-200 cursor-pointer ${
                    isDarkMode
                      ? 'border-gray-700 hover:bg-gray-800 disabled:opacity-50'
                      : 'border-gray-200 hover:bg-gray-50 disabled:opacity-50'
                  } disabled:cursor-not-allowed`}
                >
                  <ChevronRight size={14} />
                </button>
                <button 
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  className={`p-2 border rounded hover:transition-colors duration-200 cursor-pointer ${
                    isDarkMode
                      ? 'border-gray-700 hover:bg-gray-800 disabled:opacity-50'
                      : 'border-gray-200 hover:bg-gray-50 disabled:opacity-50'
                  } disabled:cursor-not-allowed`}
                >
                  <ChevronsRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
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
        getOrderTypeIcon={getOrderTypeIcon}
        getOrderTypeText={getOrderTypeText}
        hasAdminOutput={hasAdminOutput}
        openTextView={openTextView}
        downloadAdminOutput={downloadAdminOutput}
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

export default Order;