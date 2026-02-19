import React, { useState, useEffect } from 'react';
import {
  Package,
  Edit2,
  Trash2,
  ChevronLeft,
  User,
  FileText,
  File,
  Image,
  FileType,
  Calendar,
  AlertTriangle,
  X,
  Clock,
  Check,
  X as XIcon,
  Loader2,
  Send,
  Copy,
  Paperclip,
  Eye,
  Download,
  Eye as EyeIcon,
  FileDown,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Wallet,
  FileUp,
  AlertCircle,
  MessageSquare,
  CheckCircle,
  XCircle,
  DollarSign
} from 'lucide-react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../../components/header/Header';
import Sidebar from '../../../components/sidebar/Sidebar';
import toast, { Toaster } from 'react-hot-toast';
import { FaBangladeshiTakaSign } from "react-icons/fa6";

function OrderDetails() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Submission data
  const [submissionData, setSubmissionData] = useState({
    pdfFile: null,
    adminTextContent: '',
    adminNotes: '',
    status: ''
  });

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const token = localStorage.getItem('adminToken');

  // Fetch order details
  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      
      const response = await axios.get(`${base_url}/api/admin/orders/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setOrder(response.data.data);
      } else {
        toast.error('Order not found');
        navigate('/admin/orders');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error(error.response?.data?.error || 'Failed to fetch order details');
      navigate('/admin/orders');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (id) {
      fetchOrderDetails();
    }
  }, [id]);

  // Handle delete order
  const handleDeleteOrder = async () => {
    try {
      setIsDeleting(true);
      const response = await axios.delete(`${base_url}/api/admin/orders/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        toast.success('Order deleted successfully');
        navigate('/admin/orders');
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error(error.response?.data?.error || 'Failed to delete order');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // Handle submit order output (file/text)
  const handleSubmitOrderOutput = async () => {
    try {
      setIsSubmitting(true);
      
      let response;
      
      if (order.orderType === 'pdf_file') {
        if (!submissionData.pdfFile) {
          toast.error('Please select a PDF file to upload');
          setIsSubmitting(false);
          return;
        }
        
        // Submit PDF file
        const formData = new FormData();
        formData.append('pdfFile', submissionData.pdfFile);
        if (submissionData.adminNotes) {
          formData.append('adminNotes', submissionData.adminNotes);
        }
        
        response = await axios.post(
          `${base_url}/api/admin/orders/${id}/submit-pdf`,
          formData,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
      } else if (order.orderType === 'text_file') {
        if (!submissionData.adminTextContent.trim()) {
          toast.error('Please enter text content');
          setIsSubmitting(false);
          return;
        }
        
        // Submit text content
        response = await axios.post(
          `${base_url}/api/admin/orders/${id}/submit-text`,
          {
            adminTextContent: submissionData.adminTextContent,
            adminNotes: submissionData.adminNotes
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
      } else {
        // For other order types, update admin notes
        response = await axios.put(
          `${base_url}/api/admin/orders/${id}/notes`,
          {
            adminNotes: submissionData.adminNotes
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
      }

      if (response.data.success) {
        const message = order.orderType === 'pdf_file' ? 'PDF file submitted successfully' :
                       order.orderType === 'text_file' ? 'Text content submitted successfully' :
                       'Admin notes updated successfully';
        
        toast.success(message);
        setShowSubmitModal(false);
        resetSubmissionData();
        fetchOrderDetails();
      }
    } catch (error) {
      console.error('Error submitting order output:', error);
      toast.error(error.response?.data?.error || 'Failed to submit order output');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle update order status
  const handleUpdateOrderStatus = async () => {
    try {
      setIsSubmitting(true);
      
      const response = await axios.put(
        `${base_url}/api/admin/orders/${id}/status`,
        {
          status: submissionData.status,
          cancellationReason: submissionData.status === 'cancelled' ? 'Cancelled by admin' : ''
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        toast.success(`Order status updated to ${submissionData.status}`);
        setShowStatusModal(false);
        resetSubmissionData();
        fetchOrderDetails();
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error(error.response?.data?.error || 'Failed to update order status');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle mark as completed
  const handleMarkAsCompleted = async () => {
    try {
      setIsSubmitting(true);
      
      const response = await axios.post(
        `${base_url}/api/admin/orders/${id}/complete`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        toast.success('Order marked as completed');
        fetchOrderDetails();
      }
    } catch (error) {
      console.error('Error marking order as completed:', error);
      toast.error(error.response?.data?.error || 'Failed to mark order as completed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle mark as cancelled
  const handleMarkAsCancelled = async () => {
    try {
      setIsSubmitting(true);
      
      const response = await axios.post(
        `${base_url}/api/admin/orders/${id}/cancel`,
        {
          cancellationReason: 'Cancelled by admin'
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        toast.success('Order cancelled successfully');
        fetchOrderDetails();
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error(error.response?.data?.error || 'Failed to cancel order');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset submission data
  const resetSubmissionData = () => {
    setSubmissionData({
      pdfFile: null,
      adminTextContent: '',
      adminNotes: '',
      status: order?.status || ''
    });
  };

  // Open submit modal
  const openSubmitModal = () => {
    setSubmissionData(prev => ({
      ...prev,
      adminNotes: order?.adminNotes || '',
      adminTextContent: order?.adminTextContent || ''
    }));
    setShowSubmitModal(true);
  };

  // Open status modal
  const openStatusModal = () => {
    setSubmissionData(prev => ({
      ...prev,
      status: order?.status || ''
    }));
    setShowStatusModal(true);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 border-[1px] border-green-500 text-green-800';
      case 'processing': return 'bg-blue-100 border-[1px] border-blue-500 text-blue-800';
      case 'pending': return 'bg-yellow-100 border-[1px] border-yellow-500 text-yellow-800';
      case 'cancelled': return 'bg-red-100 border-[1px] border-red-500 text-red-800';
      default: return 'bg-gray-100 border-[1px] border-gray-500 text-gray-800';
    }
  };

  // Get order type icon
  const getOrderTypeIcon = (type) => {
    switch (type) {
      case 'text_file': return <FileText className="w-5 h-5" />;
      case 'pdf_file': return <File className="w-5 h-5" />;
      case 'image_file': return <Image className="w-5 h-5" />;
      case 'document_file': return <FileType className="w-5 h-5" />;
      default: return <File className="w-5 h-5" />;
    }
  };

  // Get order type text
  const getOrderTypeText = (type) => {
    switch (type) {
      case 'text_file': return 'Text File';
      case 'pdf_file': return 'PDF File';
      case 'image_file': return 'Image File';
      case 'document_file': return 'Document File';
      default: return type;
    }
  };

  // Check if order has admin output
  const hasAdminOutput = () => {
    if (order?.orderType === 'pdf_file') {
      return !!(order?.adminPdfFile && order?.adminPdfFile.fileName);
    } else if (order?.orderType === 'text_file') {
      return !!order?.adminTextContent;
    }
    return false;
  };

  // Download PDF file
  const downloadPdfFile = async () => {
    try {
      const response = await axios.get(
        `${base_url}/api/admin/orders/${id}/download-pdf`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          responseType: 'blob'
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `order-${order?.orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('PDF file downloaded successfully');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error(error.response?.data?.error || 'Failed to download PDF file');
    }
  };

  // View PDF file
  const viewPdfFile = async () => {
    try {
      const response = await axios.get(
        `${base_url}/api/admin/orders/${id}/view-pdf`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          responseType: 'blob'
        }
      );

      // Open PDF in new tab
      const url = window.URL.createObjectURL(new Blob([response.data]));
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error viewing PDF:', error);
      toast.error(error.response?.data?.error || 'Failed to view PDF file');
    }
  };

  // Handle file input change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type === 'application/pdf') {
        setSubmissionData(prev => ({ ...prev, pdfFile: file }));
      } else {
        toast.error('Only PDF files are allowed');
        e.target.value = '';
      }
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  // Go back to orders list
  const goBack = () => {
    navigate('/admin/orders/all');
  };

  // Custom scrollbar CSS
  const customScrollbarStyles = `
    .custom-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: #cbd5e1 #f1f5f9;
    }
    
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    
    .custom-scrollbar::-webkit-scrollbar-track {
      background: #f1f5f9;
      border-radius: 3px;
    }
    
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background-color: #cbd5e1;
      border-radius: 3px;
    }
    
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background-color: #94a3b8;
    }
  `;

  // Loading State
  if (loading) {
    return (
      <div className="font-anek text-gray-700 lg:ml-72 mt-[9vh]">
        <Header toggleSidebar={toggleSidebar} />
        <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />
        <Toaster />
        
        <main className="min-h-screen bg-gray-50 p-4 md:p-6 flex items-center justify-center">
                       <div className="flex justify-center items-center py-8">
      <div className="flex space-x-2">
        <div className="animate-bounce h-3 w-3 bg-green-500 rounded-full" style={{ animationDelay: '0ms' }}></div>
        <div className="animate-bounce h-3 w-3 bg-green-500 rounded-full" style={{ animationDelay: '150ms' }}></div>
        <div className="animate-bounce h-3 w-3 bg-green-500 rounded-full" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
        </main>
      </div>
    );
  }

  // Order not found
  if (!order) {
    return (
      <div className="font-anek text-gray-700 lg:ml-72 mt-[9vh]">
        <Header toggleSidebar={toggleSidebar} />
        <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />
        <Toaster />
        
        <main className="min-h-screen bg-gray-50 p-4 md:p-6">
          <div className="w-full  mx-auto">
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-800 mb-2">Order Not Found</h2>
              <p className="text-gray-600 mb-6">The order you're looking for doesn't exist or has been deleted.</p>
              <button
                onClick={goBack}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-150 flex items-center mx-auto"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back to Orders
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Order Details Modal Components
  const DeleteOrderModal = () => (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <AlertTriangle className="w-6 h-6 text-red-500 mr-3" />
              <h2 className="text-xl font-bold text-gray-800">Delete Order</h2>
            </div>
            <button
              onClick={() => setShowDeleteModal(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-150 hover:bg-gray-100 p-1 rounded"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="mb-6">
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
                <div>
                  <p className="text-sm text-red-800 font-semibold">Warning</p>
                  <p className="text-sm text-red-700 mt-1">
                    This action will permanently delete this order and all associated files.
                    This cannot be undone!
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center mb-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Order #{order.orderId}</p>
                  <p className="text-sm text-gray-600">{order.serviceName}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-gray-500">Customer:</p>
                  <p className="font-medium">{order.username}</p>
                </div>
                <div>
                  <p className="text-gray-500">Amount:</p>
                  <p className="font-medium">৳{(order.totalAmount || 0)?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-500">Status:</p>
                  <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusBadge(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                <div>
                  <p className="text-gray-500">Created:</p>
                  <p className="font-medium">{formatDate(order.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-150"
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteOrder}
              disabled={isDeleting}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors duration-150 flex items-center ${
                isDeleting ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 cursor-pointer'
              }`}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Order
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const SubmitOrderModal = () => (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Send className="w-6 h-6 text-blue-500 mr-3" />
              <h2 className="text-xl font-bold text-gray-800">
                Submit {order?.orderType === 'pdf_file' ? 'PDF File' : 'Text Content'}
              </h2>
            </div>
            <button
              onClick={() => {
                setShowSubmitModal(false);
                resetSubmissionData();
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-150 hover:bg-gray-100 p-1 rounded"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="space-y-6">
            {/* Order Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-bold text-gray-800">#{order.orderId}</h3>
                  <p className="text-gray-600">{order.serviceName}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(order.status)}`}>
                    {order.status}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-gray-500">Customer:</p>
                  <p className="font-medium">{order.username}</p>
                </div>
                <div>
                  <p className="text-gray-500">Order Type:</p>
                  <p className="font-medium">{getOrderTypeText(order.orderType)}</p>
                </div>
              </div>
            </div>

            {/* Submission Form */}
            <div className="space-y-4">
              {order.orderType === 'pdf_file' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload PDF File
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors duration-150">
                    <input
                      type="file"
                      id="pdfFile"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label htmlFor="pdfFile" className="cursor-pointer">
                      <div className="flex flex-col items-center">
                        <File className="w-12 h-12 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600 mb-1">
                          {submissionData.pdfFile 
                            ? `Selected: ${submissionData.pdfFile.name}`
                            : 'Click to upload PDF file'
                          }
                        </p>
                        <p className="text-xs text-gray-500">Maximum file size: 10MB</p>
                      </div>
                    </label>
                  </div>
                  {submissionData.pdfFile && (
                    <div className="mt-2 flex items-center text-sm text-green-600">
                      <Check className="w-4 h-4 mr-1" />
                      Ready to upload: {submissionData.pdfFile.name}
                    </div>
                  )}
                </div>
              )}

              {order.orderType === 'text_file' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Text Content
                  </label>
                  <textarea
                    value={submissionData.adminTextContent}
                    onChange={(e) => setSubmissionData(prev => ({ 
                      ...prev, 
                      adminTextContent: e.target.value 
                    }))}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter the text content here..."
                  />
                  <div className="mt-1 text-sm text-gray-500">
                    Character count: {submissionData.adminTextContent.length}
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notes (Optional)
                </label>
                <textarea
                  value={submissionData.adminNotes}
                  onChange={(e) => setSubmissionData(prev => ({ 
                    ...prev, 
                    adminNotes: e.target.value 
                  }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add any notes for the customer..."
                />
              </div>

              {/* Note about auto-completion */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-blue-500 mr-3" />
                  <div>
                    <p className="text-sm text-blue-800 font-medium">Note</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Submitting content will automatically mark the order as completed if it's currently pending or processing.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowSubmitModal(false);
                  resetSubmissionData();
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-150"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitOrderOutput}
                disabled={isSubmitting || 
                  (order.orderType === 'pdf_file' && !submissionData.pdfFile) || 
                  (order.orderType === 'text_file' && !submissionData.adminTextContent.trim())}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors duration-150 flex items-center ${
                  (isSubmitting || 
                   (order.orderType === 'pdf_file' && !submissionData.pdfFile) || 
                   (order.orderType === 'text_file' && !submissionData.adminTextContent.trim()))
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit {order.orderType === 'pdf_file' ? 'PDF' : 'Text'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const StatusUpdateModal = () => (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Edit2 className="w-6 h-6 text-blue-500 mr-3" />
              <h2 className="text-xl font-bold text-gray-800">Update Order Status</h2>
            </div>
            <button
              onClick={() => {
                setShowStatusModal(false);
                resetSubmissionData();
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-150 hover:bg-gray-100 p-1 rounded"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="space-y-6">
            {/* Current Order Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center mb-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">#{order.orderId}</p>
                  <p className="text-sm text-gray-600">{order.serviceName}</p>
                </div>
              </div>
              <div className="text-sm">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-500">Current Status:</span>
                  <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusBadge(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Customer:</span>
                  <span className="font-medium">{order.username}</span>
                </div>
              </div>
            </div>

            {/* Status Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select New Status
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['pending', 'processing', 'completed', 'cancelled'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setSubmissionData(prev => ({ ...prev, status }))}
                    className={`p-3 rounded-lg border transition-colors duration-150 ${
                      submissionData.status === status
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-center">
                      <span className="capitalize">{status}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Warning for status change */}
            {submissionData.status === 'cancelled' && (
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3" />
                  <div>
                    <p className="text-sm text-yellow-800 font-medium">Cancellation Warning</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Cancelling this order cannot be undone. The customer will be notified.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  resetSubmissionData();
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-150"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateOrderStatus}
                disabled={isSubmitting || !submissionData.status || submissionData.status === order.status}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors duration-150 flex items-center ${
                  (isSubmitting || !submissionData.status || submissionData.status === order.status)
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Update Status
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="font-anek text-gray-700 lg:ml-72 mt-[9vh]">
      <style>{customScrollbarStyles}</style>
      <Header toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />
      <Toaster />
     
      <main className="min-h-screen bg-gray-50 px-2 py-4 md:p-6">
        <div className="w-full mx-auto">
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex items-center justify-start md:justify-between md:flex-row flex-col">
              <div className='md:w-auto w-full'>
                <button
                  onClick={goBack}
                  className="inline-flex items-center cursor-pointer text-blue-600 hover:text-blue-800 mb-3 transition-colors duration-150"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back to Orders
                </button>
                <h1 className="text-2xl font-bold text-blue-600 mb-1">Order Details</h1>
                <p className="text-gray-600">Detailed view of order #{order.orderId}</p>
              </div>
        
            </div>
          </div>

          {/* Order Summary Card */}
          <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center mb-2">
                    <span className="text-2xl font-bold text-gray-800">#{order.orderId}</span>
                    <button
                      onClick={() => copyToClipboard(order.orderId)}
                      className="ml-2 text-gray-400 hover:text-gray-600"
                      title="Copy Order ID"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-700">{order.serviceName}</h2>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-800 mb-2">
                    ৳{(order.totalAmount || 0)?.toLocaleString()}
                  </div>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(order.status)}`}>
                    {order.status === 'completed' && <Check className="w-4 h-4 mr-1" />}
                    {order.status === 'cancelled' && <XIcon className="w-4 h-4 mr-1" />}
                    {order.status}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
              {/* Order Type */}
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                  {getOrderTypeIcon(order.orderType)}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Order Type</p>
                  <p className="font-medium">{getOrderTypeText(order.orderType)}</p>
                </div>
              </div>

              {/* Created Date */}
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="font-medium">{formatDate(order.createdAt)}</p>
                </div>
              </div>

              {/* Payment Status */}
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                  <FaBangladeshiTakaSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment</p>
                  <p className={`font-medium ${
                    order.paymentStatus === 'paid' ? 'text-green-600' :
                    order.paymentStatus === 'pending' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {order.paymentStatus?.toUpperCase()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Customer & Service Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Customer Information */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-medium text-gray-700 flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Customer Information
                  </h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Full Name</p>
                      <p className="font-medium text-gray-800">{order.username}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Email Address</p>
                      <div className="flex items-center">
                        <p className="font-medium text-gray-800">{order.userEmail}</p>
                        <button
                          onClick={() => copyToClipboard(order.userEmail)}
                          className="ml-2 text-gray-400 hover:text-gray-600"
                          title="Copy Email"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">User ID</p>
                      <div className="flex items-center">
                        <p className="font-medium text-gray-800">{order.userId}</p>
                        <button
                          onClick={() => copyToClipboard(order.userId)}
                          className="ml-2 text-gray-400 hover:text-gray-600"
                          title="Copy User ID"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>
              
                  </div>
                </div>
              </div>

              {/* Service Information */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-medium text-gray-700 flex items-center">
                    <Package className="w-5 h-5 mr-2" />
                    Service Information
                  </h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Service Name</p>
                      <p className="font-medium text-gray-800">{order.serviceName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Service Type</p>
                      <p className="font-medium text-gray-800">{order.serviceType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Rate</p>
                      <p className="font-medium text-gray-800">৳{(order.serviceRate || 0)?.toLocaleString()} per unit</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Total Amount</p>
                      <p className="font-medium text-gray-800">৳{(order.totalAmount || 0)?.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              {order.fieldValues && Object.keys(order.fieldValues).length > 0 && (
                <div className="bg-white rounded-lg shadow">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-medium text-gray-700">Additional Information</h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-3">
                      {Object.entries(order.fieldValues).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-start py-2 border-b border-gray-100 last:border-b-0">
                          <span className="text-gray-600 text-sm">{key}:</span>
                          <span className="font-medium text-gray-800 text-right max-w-[200px] break-words">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* User Uploaded Files */}
              {order.userFiles && order.userFiles.length > 0 && (
                <div className="bg-white rounded-lg shadow">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-medium text-gray-700 flex items-center">
                      <Paperclip className="w-5 h-5 mr-2" />
                      User Uploaded Files ({order.userFiles.length})
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-3">
                      {order.userFiles.map((file, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded border flex items-center justify-between">
                          <div className="flex items-center">
                            <File className="w-4 h-4 text-gray-500 mr-2" />
                            <div>
                              <p className="font-medium text-sm">{file.originalName}</p>
                              <p className="text-xs text-gray-500">
                                {(file.fileSize / 1024).toFixed(2)} KB • {file.mimeType}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatDate(file.uploadedAt)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Timeline & Admin Output */}
            <div className="space-y-6">
              {/* Order Timeline */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-medium text-gray-700 flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    Order Timeline
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                        <Calendar className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">Order Created</p>
                        <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                      </div>
                    </div>
                    
                    {order.processingAt && (
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                          <Clock className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700">Processing Started</p>
                          <p className="text-xs text-gray-500">{formatDate(order.processingAt)}</p>
                        </div>
                      </div>
                    )}
                    
                    {order.completedAt && (
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700">Order Completed</p>
                          <p className="text-xs text-gray-500">{formatDate(order.completedAt)}</p>
                        </div>
                      </div>
                    )}
                    
                    {order.cancelledAt && (
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mr-3">
                          <XCircle className="w-4 h-4 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700">Order Cancelled</p>
                          <p className="text-xs text-gray-500">{formatDate(order.cancelledAt)}</p>
                          {order.cancellationReason && (
                            <p className="text-xs text-red-500 mt-1">Reason: {order.cancellationReason}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-medium text-gray-700 flex items-center">
                    <CreditCard className="w-5 h-5 mr-2" />
                    Payment Information
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Status:</span>
                      <span className={`text-sm font-medium ${
                        order.paymentStatus === 'paid' ? 'text-green-600' :
                        order.paymentStatus === 'pending' ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {order.paymentStatus?.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Method:</span>
                      <span className="text-sm font-medium text-gray-800">
                        {order.paymentMethod === 'wallet' ? (
                          <span className="flex items-center">
                            <Wallet className="w-4 h-4 mr-1" />
                            Wallet
                          </span>
                        ) : (
                          order.paymentMethod || 'N/A'
                        )}
                      </span>
                    </div>
                    {order.transactionId && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Transaction ID:</span>
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-800 truncate max-w-[100px]">
                            {order.transactionId}
                          </span>
                          <button
                            onClick={() => copyToClipboard(order.transactionId)}
                            className="ml-1 text-gray-400 hover:text-gray-600"
                            title="Copy Transaction ID"
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Admin Output Section */}
              {(order.adminPdfFile || order.adminTextContent) && (
                <div className="bg-white rounded-lg shadow">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-medium text-gray-700 flex items-center">
                      <FileUp className="w-5 h-5 mr-2" />
                      Admin Output
                    </h3>
                  </div>
                  <div className="p-6">
                    {order.adminPdfFile && (
                      <div className="mb-4">
                        <div className="bg-gray-50 p-3 rounded border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <File className="w-5 h-5 text-red-500 mr-2" />
                              <div>
                                <p className="font-medium text-sm">PDF File</p>
                                <p className="text-xs text-gray-500">
                                  {order.adminPdfFile.fileName} • 
                                  {(order.adminPdfFile.fileSize / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={viewPdfFile}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors duration-150"
                                title="View PDF"
                              >
                                <EyeIcon size={14} />
                              </button>
                              <button
                                onClick={downloadPdfFile}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors duration-150"
                                title="Download PDF"
                              >
                                <FileDown size={14} />
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500">
                            Uploaded: {formatDate(order.adminPdfFile.uploadedAt)}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {order.adminTextContent && (
                      <div>
                        <div className="bg-gray-50 p-3 rounded border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <FileText className="w-5 h-5 text-blue-500 mr-2" />
                              <div>
                                <p className="font-medium text-sm">Text Content</p>
                                <p className="text-xs text-gray-500">
                                  {order.adminTextContent.length} characters • 
                                  {order.adminTextContent.trim().split(/\s+/).length} words
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => copyToClipboard(order.adminTextContent)}
                              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors duration-150"
                              title="Copy to clipboard"
                            >
                              <Copy size={14} />
                            </button>
                          </div>
                          <div className="mt-2 max-h-32 overflow-y-auto custom-scrollbar">
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                              {order.adminTextContent.substring(0, 200)}
                              {order.adminTextContent.length > 200 ? '...' : ''}
                            </p>
                          </div>
                          {order.textSubmittedAt && (
                            <p className="text-xs text-gray-500 mt-2">
                              Submitted: {formatDate(order.textSubmittedAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes Section */}
              {(order.adminNotes) && (
                <div className="bg-white rounded-lg shadow">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-medium text-gray-700 flex items-center">
                      <MessageSquare className="w-5 h-5 mr-2" />
                      Notes
                    </h3>
                  </div>
                  <div className="p-6">
                    {order.adminNotes && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Admin Notes:</p>
                        <div className="bg-gray-50 p-3 rounded border border-gray-200">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{order.adminNotes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Delete Order Modal */}
      {showDeleteModal && <DeleteOrderModal />}

      {/* Submit Order Modal */}
      {showSubmitModal && <SubmitOrderModal />}

      {/* Status Update Modal */}
      {showStatusModal && <StatusUpdateModal />}
    </div>
  );
}

export default OrderDetails;