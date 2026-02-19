const mongoose = require('mongoose');

const tradeLicenseSchema = new mongoose.Schema({
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
  
  // Trade License Information (from the image)
  referenceNo: {
    type: String,
    required: true,
    default: 'TRADE'
  },
  
  // License Type Information
  licenseType: {
    type: String,
    required: true,
    trim: true,
    enum: ['Mugging/Service/Shop', 'Industry', 'Others']
  },
  
  licenseName: {
    type: String,
    required: true,
    trim: true
  },
  
  // Applicant Information
  applicantName: {
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
  
  spouseName: {
    type: String,
    trim: true
  },
  
  // Contact Information
  mobileNumber: {
    type: String,
    required: true,
    trim: true
  },
  
  businessType: {
    type: String,
    required: true,
    trim: true
  },
  
  businessAddress: {
    type: String,
    required: true,
    trim: true
  },
  
  establishmentCount: {
    type: Number,
    required: true,
    default: 1
  },
  
  // License Information
  licenseNumber: {
    type: String,
    required: true
  },
  
  issueYear: {
    type: String,
    required: true
  },
  
  // Location Information
  union: {
    type: String,
    required: true,
    trim: true
  },
  
  postOffice: {
    type: String,
    required: true,
    trim: true
  },
  
  postCode: {
    type: String,
    required: true,
    trim: true
  },
  
  upazila: {
    type: String,
    required: true,
    trim: true
  },
  
  // Fees and Payment
  licenseFee: {
    type: Number,
    required: true,
    default: 0.00
  },
  
  signboardFee: {
    type: Number,
    required: true,
    default: 0.00
  },
  
  serviceCharge: {
    type: Number,
    required: true,
    default: 0.00
  },
  
  developmentFee: {
    type: Number,
    required: true,
    default: 0.00
  },
  
  otherFees: {
    type: Number,
    required: true,
    default: 0.00
  },
  
  totalFees: {
    type: Number,
    required: true,
    default: 0.00
  },
  
  // Additional Information
  serialNumber2013: {
    type: String,
    required: true
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
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'active', 'expired', 'renewed', 'cancelled'],
    default: 'active'
  },
  
  // Validity Period
  validFrom: {
    type: Date,
    default: Date.now
  },
  
  validUntil: {
    type: Date,
    required: true
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
tradeLicenseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
});

// Virtual for calculating remaining days
tradeLicenseSchema.virtual('remainingDays').get(function() {
  const today = new Date();
  const validUntil = new Date(this.validUntil);
  const diffTime = validUntil - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
});

// Indexes for better query performance
tradeLicenseSchema.index({ user: 1, createdAt: -1 });
tradeLicenseSchema.index({ receiptId: 1 });
tradeLicenseSchema.index({ licenseNumber: 1 });
tradeLicenseSchema.index({ applicantName: 1 });
tradeLicenseSchema.index({ mobileNumber: 1 });
tradeLicenseSchema.index({ status: 1 });

const TradeLicense = mongoose.model('TradeLicense', tradeLicenseSchema);

module.exports = TradeLicense;