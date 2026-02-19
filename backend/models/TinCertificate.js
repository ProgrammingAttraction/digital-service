const mongoose = require('mongoose');

const tinCertificateSchema = new mongoose.Schema({
  // User reference
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Receipt identification
  receiptId: {
    type: String,
    unique: true,
    required: true
  },
  
  // TIN Certificate Information (from the image)
  tinNumber: {
    type: String,
    required: true,
    trim: true
  },
  
  // Taxpayer Details
  name: {
    type: String,
    required: true,
    trim: true
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
  
  // Address Information
  currentAddress: {
    type: String,
    required: true,
    trim: true
  },
  
  permanentAddress: {
    type: String,
    required: true,
    trim: true
  },
  
  // Tax Office Information
  taxesCircle: {
    type: String,
    required: true,
    trim: true,
    default: '114'
  },
  
  taxesZone: {
    type: String,
    required: true,
    trim: true,
    default: '06'
  },
  
  city: {
    type: String,
    required: true,
    trim: true,
    default: 'Dhaka'
  },
  
  // Dates
  issueDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  // Previous TIN
  previousTin: {
    type: String,
    default: 'Not Applicable'
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'cancelled'],
    default: 'active'
  },
  
  // Type
  taxpayerType: {
    type: String,
    enum: ['Individual', 'Company', 'Firm', 'Others'],
    default: 'Individual'
  },
  
  // Verification URL
  verificationUrl: {
    type: String
  },
  
  // QR Code data
  qrCodeData: {
    type: String
  },
  
  // Transaction reference
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
tinCertificateSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
});

// Indexes for better query performance
tinCertificateSchema.index({ user: 1, createdAt: -1 });
tinCertificateSchema.index({ receiptId: 1 });
tinCertificateSchema.index({ tinNumber: 1 });
tinCertificateSchema.index({ name: 'text', fatherName: 'text' });

const TinCertificate = mongoose.model('TinCertificate', tinCertificateSchema);

module.exports = TinCertificate;