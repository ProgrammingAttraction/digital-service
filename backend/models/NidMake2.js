const mongoose = require('mongoose');

/**
 * NidMake2 Schema - For NID Make 2 service orders
 * Matches the form fields and requirements from Nidmake2 component
 */
const nidMake2Schema = new mongoose.Schema({
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
  
  // Order/Receipt Information
  receiptId: {
    type: String,
    required: true,
    unique: true
  },
  
  // Personal Information - Matches Nidmake2 formData
  nameBangla: {
    type: String,
    required: true,
    trim: true
  },
  nameEnglish: {
    type: String,
    required: true,
    trim: true
  },
  nationalId: {
    type: String,
    required: true,
    trim: true
  },
  pin: {
    type: String,
    required: true,
    trim: true
  },
  dateOfBirth: {
    type: String,
    required: true
  },
  fatherName: {
    type: String,
    required: true,
    trim: true
  },
  motherName: {
    type: String,
    required: true,
    trim: true
  },
  birthPlace: {
    type: String,
    required: true,
    trim: true
  },
  bloodGroup: {
    type: String,
    default: '',
    trim: true
  },
  dateOfToday: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  gender: {
    type: String,
    default: '',
    trim: true
  },
  religion: {
    type: String,
    default: '',
    trim: true
  },
  
  // File Information - PDF Upload
  pdfFile: {
    type: String,
    default: null
  },
  
  // NID Photo - Can be file path OR URL (from PDF extraction)
  nidPhoto: {
    type: String,
    required: true
  },
  nidPhotoType: {
    type: String,
    enum: ['file', 'url'],
    required: true
  },
  
  // Signature - Can be file path OR URL (from PDF extraction) OR null
  signature: {
    type: String,
    default: null
  },
  signatureType: {
    type: String,
    enum: ['file', 'url', 'none'],
    default: 'none'
  },
  
  // Payment Information
  servicePrice: {
    type: Number,
    required: true,
    default: 200
  },
  transactionId: {
    type: String,
    default: null
  },
  
  // Extracted Data Reference (for tracking)
  extractionId: {
    type: String,
    default: null
  },
  extractionData: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  
  // Order Status
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  
  // Admin Notes
  adminNotes: {
    type: String,
    default: null
  },
  
  // Download Tracking
  downloadCount: {
    type: Number,
    default: 0
  },
  lastDownloadedAt: {
    type: Date,
    default: null
  },
  
  // IP and User Agent for security
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  collection: 'nidmake2_orders' // Separate collection from regular NID orders
});

// Generate receipt ID before saving if not provided
nidMake2Schema.pre('save', async function(next) {
  try {
    if (!this.receiptId) {
      const prefix = 'NID2';
      const timestamp = Date.now().toString().slice(-8);
      const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
      this.receiptId = `${prefix}${timestamp}${randomStr}`;
    }
  } catch (error) {
    next(error);
  }
});

// Virtual for formatted date in Bengali
nidMake2Schema.virtual('formattedDate').get(function() {
  if (!this.createdAt) return 'N/A';
  try {
    const date = new Date(this.createdAt);
    return date.toLocaleDateString('bn-BD', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch (error) {
    return this.createdAt.toString();
  }
});

// Virtual for display name
nidMake2Schema.virtual('displayName').get(function() {
  return this.nameBangla || this.nameEnglish || 'Unknown';
});

// Method to increment download count
nidMake2Schema.methods.incrementDownload = function() {
  this.downloadCount += 1;
  this.lastDownloadedAt = new Date();
  return this.save();
};

// Method to check if order is refundable
nidMake2Schema.methods.isRefundable = function() {
  return ['pending'].includes(this.status);
};

// Method to get safe response object (exclude sensitive/internal data)
nidMake2Schema.methods.toSafeResponse = function() {
  const obj = this.toObject();
  
  // Remove internal fields
  delete obj.__v;
  
  // Keep all necessary fields for frontend display
  return {
    _id: obj._id,
    receiptId: obj.receiptId,
    nameBangla: obj.nameBangla,
    nameEnglish: obj.nameEnglish,
    nationalId: obj.nationalId,
    pin: obj.pin,
    dateOfBirth: obj.dateOfBirth,
    fatherName: obj.fatherName,
    motherName: obj.motherName,
    birthPlace: obj.birthPlace,
    bloodGroup: obj.bloodGroup,
    dateOfToday: obj.dateOfToday,
    address: obj.address,
    gender: obj.gender,
    religion: obj.religion,
    nidPhoto: obj.nidPhoto,
    nidPhotoType: obj.nidPhotoType,
    signature: obj.signature,
    signatureType: obj.signatureType,
    hasPdfFile: !!obj.pdfFile,
    servicePrice: obj.servicePrice,
    status: obj.status,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
    downloadCount: obj.downloadCount,
    lastDownloadedAt: obj.lastDownloadedAt
  };
};

// Static method to get user orders with pagination
nidMake2Schema.statics.getUserOrders = async function(userId, page = 1, limit = 10, search = '') {
  const skip = (page - 1) * limit;
  
  let query = { userId: userId.toString() };
  
  if (search && search.trim() !== '') {
    query.$or = [
      { receiptId: { $regex: search, $options: 'i' } },
      { nameBangla: { $regex: search, $options: 'i' } },
      { nameEnglish: { $regex: search, $options: 'i' } },
      { nationalId: { $regex: search, $options: 'i' } },
      { fatherName: { $regex: search, $options: 'i' } },
      { motherName: { $regex: search, $options: 'i' } }
    ];
  }
  
  const total = await this.countDocuments(query);
  const orders = await this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  
  // Convert to safe response objects
  const safeOrders = orders.map(order => order.toSafeResponse());
  
  return {
    success: true,
    data: safeOrders,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
};

// Static method to get order statistics
nidMake2Schema.statics.getOrderStatistics = async function(userId) {
  const query = { userId: userId.toString() };
  
  const total = await this.countDocuments(query);
  const pending = await this.countDocuments({ ...query, status: 'pending' });
  const processing = await this.countDocuments({ ...query, status: 'processing' });
  const completed = await this.countDocuments({ ...query, status: 'completed' });
  const cancelled = await this.countDocuments({ ...query, status: 'cancelled' });
  
  // Calculate total spent
  const spentResult = await this.aggregate([
    { $match: query },
    { $group: { _id: null, total: { $sum: "$servicePrice" } } }
  ]);
  
  const totalSpent = spentResult.length > 0 ? spentResult[0].total : 0;
  
  return {
    total,
    pending,
    processing,
    completed,
    cancelled,
    totalSpent,
    completionRate: total > 0 ? ((completed / total) * 100).toFixed(1) : 0
  };
};

// Indexes for better query performance
nidMake2Schema.index({ userId: 1, createdAt: -1 });
nidMake2Schema.index({ receiptId: 1 }, { unique: true });
nidMake2Schema.index({ nationalId: 1 });
nidMake2Schema.index({ status: 1 });
nidMake2Schema.index({ createdAt: -1 });

const NidMake2 = mongoose.model('NidMake2', nidMake2Schema);

module.exports = NidMake2;