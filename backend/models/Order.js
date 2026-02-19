const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  // User Information
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  
  // Service Information
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  serviceName: {
    type: String,
    required: true
  },
  serviceRate: {
    type: Number,
    required: true
  },
  serviceType: {
    type: String,
    required: true
  },
  
  // Order Information
  orderId: {
    type: String,
    unique: true,
    required: true
  },
  orderType: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 1
  },
  notes: {
    type: String,
    default: ''
  },
  urgency: {
    type: String,
    enum: ['normal', 'urgent', 'very_urgent'],
    default: 'normal'
  },
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'cancelled'],
    default: 'pending'
  },
  
  // Dynamic Fields from user
  fieldValues: {
    type: Map,
    of: String,
    default: {}
  },
    zeroReturnDocument: {
    files: [{
      originalName: String,
      fileName: String,
      filePath: String,
      fileSize: Number,
      mimeType: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      },
    }],
    submittedAt: Date,
  },
  // User uploaded files
  userFiles: [{
    originalName: String,
    fileName: String,
    filePath: String,
    fileSize: Number,
    mimeType: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // ========== ADMIN SUBMISSION FIELDS ==========
  
  // For PDF file orders - Admin uploads PDF
  adminPdfFile: {
    fileName: String,
    filePath: String,
    fileSize: Number,
    uploadedAt: Date,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // For text file orders - Admin provides text
  adminTextContent: {
    type: String,
    default: ''
  },
  textSubmittedAt: Date,
  textSubmittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // For any order type - Admin can add notes
  adminNotes: {
    type: String,
    default: ''
  },
  adminNotesUpdatedAt: Date,
  
  // Completion details
  completedAt: Date,
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Cancellation details
  cancellationReason: {
    type: String,
    default: ''
  },
  cancelledAt: Date,
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Payment Information
  paymentStatus: {
    type: String,
    enum: ['paid', 'pending', 'refunded'],
    default: 'paid'
  },
  paymentMethod: {
    type: String,
    default: 'wallet'
  },
  
  // Version tracking for updates
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

// Generate unique order ID before saving
orderSchema.pre('save', function(next) {
  if (!this.orderId) {
    const date = new Date();
    const timestamp = date.getTime();
    const random = Math.floor(Math.random() * 1000);
    this.orderId = `ORD-${timestamp}-${random}`;
  }
});

// Update version when admin submits content
orderSchema.pre('save', function(next) {
  if (this.isModified('adminPdfFile.fileName') || 
      this.isModified('adminTextContent') ||
      this.isModified('adminNotes')) {
    this.version += 1;
  }
});

// Virtual for getting output based on order type
orderSchema.virtual('adminOutput').get(function() {
  if (this.orderType === 'pdf_file' && this.adminPdfFile && this.adminPdfFile.fileName) {
    return {
      type: 'pdf',
      file: this.adminPdfFile,
      submittedAt: this.adminPdfFile.uploadedAt
    };
  } else if (this.orderType === 'text_file' && this.adminTextContent) {
    return {
      type: 'text',
      content: this.adminTextContent,
      submittedAt: this.textSubmittedAt
    };
  }
  return null;
});

// Virtual for checking if admin has submitted output
orderSchema.virtual('hasAdminOutput').get(function() {
  if (this.orderType === 'pdf_file') {
    return !!(this.adminPdfFile && this.adminPdfFile.fileName);
  } else if (this.orderType === 'text_file') {
    return !!this.adminTextContent;
  }
  return false;
});

// Virtual for output file URL
orderSchema.virtual('outputFileUrl').get(function() {
  if (this.orderType === 'pdf_file' && this.adminPdfFile && this.adminPdfFile.filePath) {
    return `/uploads/orders/outputs/${this.adminPdfFile.fileName}`;
  }
  return null;
});

// Virtual for Bengali status
orderSchema.virtual('statusBengali').get(function() {
  const statusMap = {
    'pending': 'বিচারাধীন',
    'processing': 'প্রক্রিয়াধীন',
    'completed': 'সম্পন্ন',
    'cancelled': 'বাতিল'
  };
  return statusMap[this.status] || this.status;
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;