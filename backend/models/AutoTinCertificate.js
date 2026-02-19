// models/AutoTinCertificate.js
const mongoose = require('mongoose');

const autoTinCertificateSchema = new mongoose.Schema({
  // User reference
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Receipt/Reference ID
  receiptId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Transaction reference
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    required: true
  },
  
  // TIN Information
  tinNumber: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  
  // Personal Information (English)
  name: {
    type: String,
    required: true,
    trim: true
  },
  fatherName: {
    type: String,
    trim: true,
    default: ''
  },
  motherName: {
    type: String,
    trim: true,
    default: ''
  },
  
  // Personal Information (Bangla - for future use)
  nameBangla: {
    type: String,
    trim: true,
    default: ''
  },
  fatherNameBangla: {
    type: String,
    trim: true,
    default: ''
  },
  motherNameBangla: {
    type: String,
    trim: true,
    default: ''
  },
  
  // Address Information
  currentAddress: {
    type: String,
    trim: true,
    default: ''
  },
  currentAddressBangla: {
    type: String,
    trim: true,
    default: ''
  },
  permanentAddress: {
    type: String,
    trim: true,
    default: ''
  },
  permanentAddressBangla: {
    type: String,
    trim: true,
    default: ''
  },
  
  // Tax Office Information
  taxesCircle: {
    type: String,
    required: true,
    default: '02'
  },
  taxesZone: {
    type: String,
    required: true,
    default: '06'
  },
  city: {
    type: String,
    required: true,
    default: 'Dhaka'
  },
  
  // Zone Contact Information
  zoneAddress: {
    type: String,
    trim: true,
    default: ''
  },
  zonePhone: {
    type: String,
    trim: true,
    default: ''
  },
  
  // Certificate Details
  issueDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  status: {
    type: String,
    default: 'Individual'
  },
  previousTIN: {
    type: String,
    default: 'Not Applicable'
  },
  
  // QR Code & Verification
  qrCode: {
    type: String,
    default: ''
  },
  qrCodeData: {
    type: String,
    default: ''
  },
  verificationUrl: {
    type: String,
    required: true
  },
  
  // API Response Data
  apiData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Service Metadata
  source: {
    type: String,
    enum: ['api', 'manual'],
    default: 'api',
    index: true
  },
  
  // Status Tracking
  systemStatus: {
    type: String,
    default: 'active',
    index: true
  },
  
  // Audit Fields
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // Additional Metadata
  metadata: {
    apiVersion: String,
    apiProvider: {
      type: String,
      default: 'ourseba'
    },
    responseTime: Number,
    retryCount: {
      type: Number,
      default: 0
    },
    lastApiCall: Date,
    dataHash: String // For data integrity verification
  }
}, {
  timestamps: true
});

// Indexes for better query performance
autoTinCertificateSchema.index({ user: 1, tinNumber: 1 });
autoTinCertificateSchema.index({ user: 1, createdAt: -1 });
autoTinCertificateSchema.index({ receiptId: 1, user: 1 });
autoTinCertificateSchema.index({ tinNumber: 1, status: 1 });
autoTinCertificateSchema.index({ createdAt: -1, systemStatus: 1 });

// Pre-save middleware to update timestamps
autoTinCertificateSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Generate data hash for integrity check
  if (this.isModified()) {
    const crypto = require('crypto');
    const dataString = JSON.stringify({
      tinNumber: this.tinNumber,
      name: this.name,
      fatherName: this.fatherName,
      issueDate: this.issueDate
    });
    this.metadata.dataHash = crypto
      .createHash('md5')
      .update(dataString)
      .digest('hex');
  }
});

// Static method to find by receipt ID
autoTinCertificateSchema.statics.findByReceiptId = function(receiptId, userId = null) {
  const query = { receiptId };
  if (userId) {
    query.user = userId;
  }
  return this.findOne(query);
};

// Static method to find by TIN number
autoTinCertificateSchema.statics.findByTinNumber = function(tinNumber, userId = null) {
  const query = { tinNumber };
  if (userId) {
    query.user = userId;
  }
  return this.findOne(query);
};

// Method to get formatted certificate data
autoTinCertificateSchema.methods.getFormattedData = function() {
  return {
    _id: this._id,
    receiptId: this.receiptId,
    tinNumber: this.tinNumber,
    name: this.name,
    nameBangla: this.nameBangla,
    fatherName: this.fatherName,
    fatherNameBangla: this.fatherNameBangla,
    motherName: this.motherName,
    motherNameBangla: this.motherNameBangla,
    currentAddress: this.currentAddress,
    currentAddressBangla: this.currentAddressBangla,
    permanentAddress: this.permanentAddress,
    permanentAddressBangla: this.permanentAddressBangla,
    taxesCircle: this.taxesCircle,
    taxesZone: this.taxesZone,
    city: this.city,
    issueDate: this.issueDate,
    status: this.status,
    previousTIN: this.previousTIN,
    zoneAddress: this.zoneAddress,
    zonePhone: this.zonePhone,
    verificationUrl: this.verificationUrl,
    source: this.source,
    systemStatus: this.systemStatus,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Method to verify certificate
autoTinCertificateSchema.methods.verifyCertificate = function() {
  return {
    isValid: this.systemStatus === 'active',
    verificationUrl: this.verificationUrl,
    verifiedAt: new Date(),
    dataHash: this.metadata.dataHash,
    tinNumber: this.tinNumber,
    name: this.name
  };
};

// Virtual for formatted issue date
autoTinCertificateSchema.virtual('formattedIssueDate').get(function() {
  return this.issueDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Export the model
const AutoTinCertificate = mongoose.model('AutoTinCertificate', autoTinCertificateSchema);

module.exports = AutoTinCertificate;