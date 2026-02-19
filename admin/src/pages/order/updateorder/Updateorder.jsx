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
  CreditCard,
  Wallet,
  FileUp,
  AlertCircle,
  MessageSquare,
  CheckCircle,
  XCircle,
  DollarSign,
  Save,
  RefreshCw,
  Info,
  Percent,
  Tag,
  Clock as ClockIcon,
  Layers,
  Package as PackageIcon,
  Upload,
  FileArchive
} from 'lucide-react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../../components/header/Header';
import Sidebar from '../../../components/sidebar/Sidebar';
import toast, { Toaster } from 'react-hot-toast';
import { FaBangladeshiTakaSign } from "react-icons/fa6";

function Updateorder() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [submittingOutput, setSubmittingOutput] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Form states
  const [formData, setFormData] = useState({
    serviceName: '',
    serviceType: '',
    serviceRate: '',
    quantity: 1,
    totalAmount: '',
    urgency: 'normal',
    status: '',
    paymentStatus: '',
    adminNotes: '',
    cancellationReason: ''
  });

  // Zero Return specific states
  const [zeroReturnNotes, setZeroReturnNotes] = useState('');
  const [zeroReturnFiles, setZeroReturnFiles] = useState([]);
  const [uploadingZeroReturn, setUploadingZeroReturn] = useState(false);
  const [showZeroReturnModal, setShowZeroReturnModal] = useState(false);

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  
  // File upload state
  const [pdfFile, setPdfFile] = useState(null);
  const [adminTextContent, setAdminTextContent] = useState('');

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const token = localStorage.getItem('adminToken');

  // Check if order is zero return
  const isZeroReturnOrder = () => {
    return order?.serviceName === 'জিরো রিটার্ন';
  };

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
        const orderData = response.data.data;
        setOrder(orderData);
        
        // Populate form data
        setFormData({
          serviceName: orderData.serviceName || '',
          serviceType: orderData.serviceType || '',
          serviceRate: orderData.serviceRate || '',
          quantity: orderData.quantity || 1,
          totalAmount: orderData.totalAmount || '',
          urgency: orderData.urgency || 'normal',
          status: orderData.status || '',
          paymentStatus: orderData.paymentStatus || '',
          adminNotes: orderData.adminNotes || '',
          cancellationReason: orderData.cancellationReason || ''
        });
        
        // Set admin output data
        setAdminTextContent(orderData.adminTextContent || '');
        
        // Set zero return notes if exists
        if (orderData.zeroReturnDocument?.notes) {
          setZeroReturnNotes(orderData.zeroReturnDocument.notes);
        }
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

  // Handle zero return file selection
  const handleZeroReturnFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate file count
    if (zeroReturnFiles.length + files.length > 3) {
      toast.error('Maximum 3 files allowed');
      e.target.value = '';
      return;
    }
    
    // Validate file types
    const validFiles = files.filter(file => {
      const validTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'application/msword', // .doc
        'application/vnd.ms-excel', // .xls
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // .xlsx
      ];
      
      if (!validTypes.includes(file.type)) {
        toast.error(`Invalid file type: ${file.name}. Please upload PDF, images, or document files.`);
        return false;
      }
      
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File too large: ${file.name}. Maximum size is 10MB.`);
        return false;
      }
      
      return true;
    });
    
    setZeroReturnFiles(prev => [...prev, ...validFiles]);
    e.target.value = '';
  };

  // Remove zero return file
  const removeZeroReturnFile = (index) => {
    setZeroReturnFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Submit zero return documents
  const handleSubmitZeroReturn = async () => {
    if (zeroReturnFiles.length === 0) {
      toast.error('Please select at least one file');
      return;
    }

    try {
      setUploadingZeroReturn(true);
      
      const formData = new FormData();
      
      // Append files
      zeroReturnFiles.forEach(file => {
        formData.append('files', file);
      });
      
      // Append notes if provided
      if (zeroReturnNotes.trim()) {
        formData.append('notes', zeroReturnNotes);
      }
      
      const response = await axios.put(
        `${base_url}/api/admin/orders/${id}/zero-return`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        toast.success('Zero return documents uploaded successfully');
        setShowZeroReturnModal(false);
        setZeroReturnFiles([]);
        setZeroReturnNotes('');
        fetchOrderDetails();
      }
    } catch (error) {
      console.error('Error uploading zero return documents:', error);
      
      // Handle specific errors
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else if (error.code === 'ERR_NETWORK') {
        toast.error('Network error. Please check your connection.');
      } else {
        toast.error('Failed to upload zero return documents');
      }
    } finally {
      setUploadingZeroReturn(false);
    }
  };

  // Download zero return file
  const downloadZeroReturnFile = async (filePath, fileName) => {
    try {
      const response = await axios.get(
        `${base_url}${filePath}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          responseType: 'blob'
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || `zero-return-${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('File downloaded successfully');
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error(error.response?.data?.error || 'Failed to download file');
    }
  };

  // View zero return file
  const viewZeroReturnFile = async (filePath) => {
    try {
      const response = await axios.get(
        `${base_url}${filePath}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          responseType: 'blob'
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error viewing file:', error);
      toast.error(error.response?.data?.error || 'Failed to view file');
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Update order details
  const handleUpdateOrder = async () => {
    try {
      setSaving(true);
      
      const response = await axios.put(
        `${base_url}/api/admin/orders/${id}`,
        {
          urgency: formData.urgency,
          adminNotes: formData.adminNotes,
          paymentStatus: formData.paymentStatus
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        toast.success('Order updated successfully');
        fetchOrderDetails();
      }
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error(error.response?.data?.error || 'Failed to update order');
    } finally {
      setSaving(false);
    }
  };

  // Update order status
  const handleUpdateStatus = async (newStatus, cancellationReason = '') => {
    try {
      setUpdatingStatus(true);
      
      const response = await axios.put(
        `${base_url}/api/admin/orders/${id}/status`,
        {
          status: newStatus,
          cancellationReason: cancellationReason || undefined
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        toast.success(`Order status updated to ${newStatus}`);
        setFormData(prev => ({ ...prev, status: newStatus }));
        setShowStatusModal(false);
        setShowCancelModal(false);
        setShowCompleteModal(false);
        fetchOrderDetails();
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error(error.response?.data?.error || 'Failed to update order status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Handle delete order
  const handleDeleteOrder = async () => {
    try {
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
      setShowDeleteModal(false);
    }
  };

  // Handle submit order output (file/text)
  const handleSubmitOrderOutput = async () => {
    try {
      setSubmittingOutput(true);
      
      let response;
      
      if (order.orderType === 'pdf_file') {
        if (!pdfFile) {
          toast.error('Please select a PDF file to upload');
          setSubmittingOutput(false);
          return;
        }
        
        // Submit PDF file
        const formData = new FormData();
        formData.append('pdfFile', pdfFile);
        if (formData.adminNotes) {
          formData.append('adminNotes', formData.adminNotes);
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
        if (!adminTextContent.trim()) {
          toast.error('Please enter text content');
          setSubmittingOutput(false);
          return;
        }
        
        // Submit text content
        response = await axios.post(
          `${base_url}/api/admin/orders/${id}/submit-text`,
          {
            adminTextContent: adminTextContent,
            adminNotes: formData.adminNotes
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
            adminNotes: formData.adminNotes
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
        setPdfFile(null);
        fetchOrderDetails();
      }
    } catch (error) {
      console.error('Error submitting order output:', error);
      toast.error(error.response?.data?.error || 'Failed to submit order output');
    } finally {
      setSubmittingOutput(false);
    }
  };

  // Handle file input change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type === 'application/pdf') {
        setPdfFile(file);
      } else {
        toast.error('Only PDF files are allowed');
        e.target.value = '';
      }
    }
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

      const url = window.URL.createObjectURL(new Blob([response.data]));
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error viewing PDF:', error);
      toast.error(error.response?.data?.error || 'Failed to view PDF file');
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

  // Reset form to original values
  const resetForm = () => {
    if (order) {
      setFormData({
        serviceName: order.serviceName || '',
        serviceType: order.serviceType || '',
        serviceRate: order.serviceRate || '',
        quantity: order.quantity || 1,
        totalAmount: order.totalAmount || '',
        urgency: order.urgency || 'normal',
        status: order.status || '',
        paymentStatus: order.paymentStatus || '',
        adminNotes: order.adminNotes || '',
        cancellationReason: order.cancellationReason || ''
      });
      setAdminTextContent(order.adminTextContent || '');
    }
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

  // Zero Return Modal Component
  const ZeroReturnModal = () => (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <FileArchive className="w-6 h-6 text-blue-500 mr-3" />
              <h2 className="text-xl font-bold text-gray-800">Upload Zero Return Documents</h2>
            </div>
            <button
              onClick={() => setShowZeroReturnModal(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-150 cursor-pointer p-1 rounded"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg border-[1px] border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-bold text-gray-800">#{order.orderId}</h3>
                  <p className="text-gray-600">জিরো রিটার্ন</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(order.status)}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            </div>

            {/* File Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Documents (Max 3 files, 10MB each)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors duration-150">
                <input
                  type="file"
                  id="zeroReturnFiles"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                  onChange={handleZeroReturnFileChange}
                  className="hidden"
                />
                <label htmlFor="zeroReturnFiles" className="cursor-pointer">
                  <div className="flex flex-col items-center">
                    <Upload className="w-12 h-12 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 mb-1">Click to upload files</p>
                    <p className="text-xs text-gray-500">PDF, Images, DOC, DOCX, XLS, XLSX</p>
                  </div>
                </label>
              </div>
              
              {/* Selected Files List */}
              {zeroReturnFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    Selected Files ({zeroReturnFiles.length}/3):
                  </p>
                  {zeroReturnFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded border border-gray-200">
                      <div className="flex items-center">
                        <File className="w-4 h-4 text-gray-500 mr-2" />
                        <div>
                          <p className="text-sm font-medium truncate max-w-[200px]">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeZeroReturnFile(index)}
                        className="text-red-500 hover:text-red-700 cursor-pointer p-1"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                value={zeroReturnNotes}
                onChange={(e) => setZeroReturnNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter any notes or instructions..."
              />
            </div>

            {/* Note about auto-completion */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-blue-500 mr-3" />
                <div>
                  <p className="text-sm text-blue-800 font-medium">Note</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Uploading zero return documents will automatically mark the order as completed if it's currently pending or processing.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowZeroReturnModal(false)}
                className="px-4 py-2 text-sm font-medium border-[1px] cursor-pointer border-gray-200 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-150"
                disabled={uploadingZeroReturn}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitZeroReturn}
                disabled={uploadingZeroReturn || zeroReturnFiles.length === 0}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg cursor-pointer transition-colors duration-150 flex items-center ${
                  uploadingZeroReturn || zeroReturnFiles.length === 0
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                }`}
              >
                {uploadingZeroReturn ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Documents
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Zero Return Documents Section Component
  const ZeroReturnDocumentsSection = () => {
    if (!order?.zeroReturnDocument?.files || order.zeroReturnDocument.files.length === 0) {
      return null;
    }

    return (
      <div className="bg-white rounded-lg shadow mt-6">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-medium text-gray-700 flex items-center">
            <FileArchive className="w-5 h-5 mr-2" />
            Zero Return Documents
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Submitted on {formatDate(order.zeroReturnDocument.submittedAt)}
          </p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {order.zeroReturnDocument.files.map((file, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <File className="w-5 h-5 text-blue-500 mr-2" />
                    <div>
                      <p className="font-medium text-sm truncate max-w-[150px]">{file.originalName}</p>
                      <p className="text-xs text-gray-500">
                        {(file.fileSize / 1024 / 1024).toFixed(2)} MB • {file.mimeType}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => viewZeroReturnFile(file.filePath)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors duration-150"
                      title="View File"
                    >
                      <EyeIcon size={14} />
                    </button>
                    <button
                      onClick={() => downloadZeroReturnFile(file.filePath, file.originalName)}
                      className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors duration-150"
                      title="Download File"
                    >
                      <FileDown size={14} />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Uploaded: {formatDate(file.uploadedAt)}
                </p>
              </div>
            ))}
          </div>
          
          {order.zeroReturnDocument.notes && (
            <div className="mt-4 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <p className="text-sm font-medium text-gray-700 mb-1">Notes:</p>
              <p className="text-sm text-gray-600">{order.zeroReturnDocument.notes}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Delete Order Modal Component
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
              className="text-gray-400 hover:text-gray-600 transition-colors duration-150 cursor-pointer p-1 rounded"
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
              className="px-4 py-2 text-sm font-medium border-[1px] border-gray-200 text-gray-700 cursor-pointer bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-150"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteOrder}
              className="px-4 py-2 text-sm font-medium text-white border-[1px] border-red-200 cursor-pointer bg-red-600 rounded-lg hover:bg-red-700 transition-colors duration-150 flex items-center"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Status Update Modal Component
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
              onClick={() => setShowStatusModal(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-150 cursor-pointer p-1 rounded"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="space-y-6">
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
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select New Status
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['pending', 'processing', 'completed', 'cancelled'].map((status) => (
                  <button
                    key={status}
                    onClick={() => handleUpdateStatus(status)}
                    disabled={updatingStatus || status === order.status}
                    className={`p-3 rounded-lg border transition-colors cursor-pointer duration-150 flex items-center justify-center ${
                      status === order.status
                        ? 'border-theme_color2 bg-blue-50 text-theme_color2 cursor-not-allowed'
                        : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {updatingStatus && status === formData.status ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span className="capitalize">{status}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Cancel Order Modal Component
  const CancelOrderModal = () => {
    const [cancellationReason, setCancellationReason] = useState(order?.cancellationReason || '');

    return (
      <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <AlertTriangle className="w-6 h-6 text-red-500 mr-3" />
                <h2 className="text-xl font-bold text-gray-800">Cancel Order</h2>
              </div>
              <button
                onClick={() => setShowCancelModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-150 hover:bg-gray-100 p-1 rounded"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-6">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cancellation Reason (Optional)
                </label>
                <textarea
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter reason for cancellation..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-150"
                  disabled={updatingStatus}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdateStatus('cancelled', cancellationReason)}
                  disabled={updatingStatus}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors duration-150 flex items-center"
                >
                  {updatingStatus ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <XIcon className="w-4 h-4 mr-2" />
                      Confirm Cancellation
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Complete Order Modal Component
  const CompleteOrderModal = () => (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
              <h2 className="text-xl font-bold text-gray-800">Complete Order</h2>
            </div>
            <button
              onClick={() => setShowCompleteModal(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-150 hover:bg-gray-100 p-1 rounded"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="space-y-6">
            <div className="bg-green-50 border-l-4 border-green-500 p-4">
              <div className="flex">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                <div>
                  <p className="text-sm text-green-800 font-medium">Complete Order</p>
                  <p className="text-sm text-green-700 mt-1">
                    Marking this order as completed will notify the customer and finalize the order.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">
                Are you sure you want to mark this order as completed?
              </p>
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
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowCompleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-150"
                disabled={updatingStatus}
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateStatus('completed')}
                disabled={updatingStatus}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors duration-150 flex items-center"
              >
                {updatingStatus ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Completing...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Mark as Completed
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Submit Order Modal Component
  const SubmitOrderModal = () => {
    const [localTextContent, setLocalTextContent] = useState(adminTextContent);
    const [localPdfFile, setLocalPdfFile] = useState(pdfFile);

    // Handle file change locally
    const handleLocalFileChange = (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.type === 'application/pdf') {
          setLocalPdfFile(file);
        } else {
          toast.error('Only PDF files are allowed');
          e.target.value = '';
        }
      }
    };

    // Handle submit with local state
    const handleLocalSubmit = async () => {
      try {
        setSubmittingOutput(true);
        
        let response;
        
        if (order.orderType === 'pdf_file') {
          if (!localPdfFile) {
            toast.error('Please select a PDF file to upload');
            setSubmittingOutput(false);
            return;
          }
          
          // Submit PDF file
          const formData = new FormData();
          formData.append('pdfFile', localPdfFile);
          if (formData.adminNotes) {
            formData.append('adminNotes', formData.adminNotes);
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
          if (!localTextContent.trim()) {
            toast.error('Please enter text content');
            setSubmittingOutput(false);
            return;
          }
          
          // Submit text content
          response = await axios.post(
            `${base_url}/api/admin/orders/${id}/submit-text`,
            {
              adminTextContent: localTextContent,
              adminNotes: formData.adminNotes
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
              adminNotes: formData.adminNotes
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
          setPdfFile(localPdfFile);
          setAdminTextContent(localTextContent);
          fetchOrderDetails();
        }
      } catch (error) {
        console.error('Error submitting order output:', error);
        toast.error(error.response?.data?.error || 'Failed to submit order output');
      } finally {
        setSubmittingOutput(false);
      }
    };

    return (
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
                onClick={() => setShowSubmitModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-150 cursor-pointer p-1 rounded"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg border-[1px] border-gray-200">
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
                        onChange={handleLocalFileChange}
                        className="hidden"
                      />
                      <label htmlFor="pdfFile" className="cursor-pointer">
                        <div className="flex flex-col items-center">
                          <File className="w-12 h-12 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600 mb-1">
                            {localPdfFile 
                              ? `Selected: ${localPdfFile.name}`
                              : 'Click to upload PDF file'
                            }
                          </p>
                          <p className="text-xs text-gray-500">Maximum file size: 10MB</p>
                        </div>
                      </label>
                    </div>
                    {localPdfFile && (
                      <div className="mt-2 flex items-center text-sm text-green-600">
                        <Check className="w-4 h-4 mr-1" />
                        Ready to upload: {localPdfFile.name}
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
                      value={localTextContent}
                      onChange={(e) => setLocalTextContent(e.target.value)}
                      rows={8}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter the text content here..."
                      autoFocus
                    />
                    <div className="mt-1 text-sm text-gray-500">
                      Character count: {localTextContent.length}
                    </div>
                  </div>
                )}

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
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 text-sm font-medium border-[1px] cursor-pointer border-gray-200 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-150"
                  disabled={submittingOutput}
                >
                  Cancel
                </button>
                <button
                  onClick={handleLocalSubmit}
                  disabled={submittingOutput || 
                    (order.orderType === 'pdf_file' && !localPdfFile) || 
                    (order.orderType === 'text_file' && !localTextContent.trim())}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg cursor-pointer transition-colors duration-150 flex items-center ${
                    (submittingOutput || 
                     (order.orderType === 'pdf_file' && !localPdfFile) || 
                     (order.orderType === 'text_file' && !localTextContent.trim()))
                      ? 'bg-blue-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                  }`}
                >
                  {submittingOutput ? (
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
  };

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
          <div className="w-full max-w-4xl mx-auto">
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
            <div className="flex items-center justify-between">
              <div>
                <button
                  onClick={goBack}
                  className="inline-flex items-center text-blue-600 cursor-pointer hover:text-blue-800 mb-3 transition-colors duration-150"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back to Orders
                </button>
                <h1 className="text-2xl font-bold text-blue-600 mb-1">Update Order</h1>
                <p className="text-gray-600">Edit order details for #{order.orderId}</p>
              </div>
            </div>
          </div>

          {/* Quick Actions Bar - Add Zero Return Button */}
          <div className="bg-white rounded-lg shadow mb-6 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(order.status)}`}>
                  {order.status === 'completed' && <Check className="w-4 h-4 mr-1" />}
                  {order.status === 'cancelled' && <XIcon className="w-4 h-4 mr-1" />}
                  {order.status}
                </div>
                <span className="mx-3 text-gray-400">|</span>
                <div className="flex items-center text-gray-600">
                  {getOrderTypeIcon(order.orderType)}
                  <span className="ml-2 text-sm">{getOrderTypeText(order.orderType)}</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {/* Zero Return Button - Only show for zero return orders */}
                {isZeroReturnOrder() && (
                  <button
                    onClick={() => setShowZeroReturnModal(true)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg border-[1px] cursor-pointer transition-colors duration-150 flex items-center ${
                      order.zeroReturnDocument?.files?.length > 0
                        ? 'bg-green-50 text-green-600 hover:bg-green-100 border-green-500'
                        : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-500'
                    }`}
                  >
                    <FileArchive className="w-4 h-4 mr-1" />
                    {order.zeroReturnDocument?.files?.length > 0 ? 'Update Zero Return' : 'Upload Zero Return'}
                  </button>
                )}
                
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg border-[1px] cursor-pointer transition-colors duration-150 flex items-center ${
                    hasAdminOutput()
                      ? 'bg-green-50 text-green-600 hover:bg-green-100 border-green-500'
                      : 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100 border-yellow-500'
                  }`}
                >
                  <Send className="w-4 h-4 mr-1" />
                  {hasAdminOutput() ? 'Update Output' : 'Submit Output'}
                </button>
                
                {order.status === 'pending' || order.status === 'processing' ? (
                  <>
                    <button
                      onClick={() => setShowCancelModal(true)}
                      className="px-3 py-1.5 text-sm font-medium cursor-pointer text-red-600 border-[1px] border-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors duration-150 flex items-center"
                    >
                      <XIcon className="w-4 h-4 mr-1" />
                      Cancel Order
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="px-3 py-1.5 text-sm font-medium text-red-600 border-[1px] border-red-500 cursor-pointer bg-red-50 rounded-lg hover:bg-red-100 transition-colors duration-150 flex items-center"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete Order
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Edit Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Information Card */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-medium text-gray-700 flex items-center">
                    <PackageIcon className="w-5 h-5 mr-2" />
                    Order Information
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">Service details (read-only)</p>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Service Name - READ-ONLY */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Service Name
                      </label>
                      <div className="w-full rounded-lg text-gray-800">
                        {order.serviceName || 'N/A'}
                        {isZeroReturnOrder() && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                            জিরো রিটার্ন
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Total Amount - READ-ONLY */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total Amount
                      </label>
                      <div className="relative">
                        <div className="w-full pl-5 pr-3 text-gray-800">
                          {order.totalAmount ? `৳${parseFloat(order.totalAmount).toFixed(2)}` : 'N/A'}
                        </div>
                      </div>
                    </div>

                    {/* Order Type - READ-ONLY */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Order Type
                      </label>
                      <div className="w-full text-gray-800 flex items-center">
                        {getOrderTypeIcon(order.orderType)}
                        <span className="ml-2">{getOrderTypeText(order.orderType)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-medium text-gray-700 flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Customer Information
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">Customer details (read-only)</p>
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
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Order ID</p>
                      <div className="flex items-center">
                        <p className="font-medium text-gray-800">{order.orderId}</p>
                        <button
                          onClick={() => copyToClipboard(order.orderId)}
                          className="ml-2 text-gray-400 hover:text-gray-600"
                          title="Copy Order ID"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
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

              {/* Zero Return Documents Section */}
              {isZeroReturnOrder() && <ZeroReturnDocumentsSection />}
            </div>

            {/* Right Column - Status & Actions */}
            <div className="space-y-6">
              {/* Order Status Card */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 flex justify-between items-center border-b border-gray-200">
                  <h3 className="font-medium text-gray-700 flex items-center">
                    <ClockIcon className="w-5 h-5 mr-2" />
                    Order Status
                  </h3>
                  <div className={`inline-flex items-center px-4 py-1 rounded-full text-[14px] font-medium ${getStatusBadge(order.status)}`}>
                    {order.status === 'completed' && <Check className="w-5 h-5 mr-2" />}
                    {order.status === 'cancelled' && <XIcon className="w-5 h-5 mr-2" />}
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Created:</span>
                      <span className="text-sm font-medium">{formatDate(order.createdAt)}</span>
                    </div>
                    
                    {order.processingAt && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Processing Started:</span>
                        <span className="text-sm font-medium">{formatDate(order.processingAt)}</span>
                      </div>
                    )}
                    
                    {order.completedAt && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Completed:</span>
                        <span className="text-sm font-medium">{formatDate(order.completedAt)}</span>
                      </div>
                    )}
                    
                    {order.cancelledAt && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Cancelled:</span>
                        <span className="text-sm font-medium">{formatDate(order.cancelledAt)}</span>
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
                        formData.paymentStatus === 'paid' ? 'text-green-600' :
                        formData.paymentStatus === 'pending' ? 'text-yellow-600' :
                        formData.paymentStatus === 'failed' ? 'text-red-600' :
                        'text-blue-600'
                      }`}>
                        {formData.paymentStatus?.toUpperCase()}
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
                    
                    <button
                      onClick={() => setShowSubmitModal(true)}
                      className="w-full mt-4 px-4 py-2 text-sm border-[1px] border-blue-200 cursor-pointer font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-150 flex items-center justify-center"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Update Output
                    </button>
                  </div>
                </div>
              )}

              {/* User Files */}
              {order.userFiles && order.userFiles.length > 0 && (
                <div className="bg-white rounded-lg shadow">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-medium text-gray-700 flex items-center">
                      <Paperclip className="w-5 h-5 mr-2" />
                      User Files ({order.userFiles.length})
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-3">
                      {order.userFiles.slice(0, 3).map((file, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded border flex items-center justify-between">
                          <div className="flex items-center">
                            <File className="w-4 h-4 text-gray-500 mr-2" />
                            <div>
                              <p className="font-medium text-sm truncate max-w-[150px]">{file.originalName}</p>
                              <p className="text-xs text-gray-500">
                                {(file.fileSize / 1024).toFixed(2)} KB
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {order.userFiles.length > 3 && (
                        <p className="text-sm text-gray-500 text-center">
                          + {order.userFiles.length - 3} more files
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      {showZeroReturnModal && <ZeroReturnModal />}
      {showDeleteModal && <DeleteOrderModal />}
      {showStatusModal && <StatusUpdateModal />}
      {showCancelModal && <CancelOrderModal />}
      {showCompleteModal && <CompleteOrderModal />}
      {showSubmitModal && <SubmitOrderModal />}
    </div>
  );
}

export default Updateorder;