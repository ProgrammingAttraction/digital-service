const mongoose = require('mongoose');

const taxReturnAcknowledgementSchema = new mongoose.Schema({
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
  referenceNo: {
    type: String,
    unique: true,
    required: true
  },
  
  // Taxpayer Information (from image)
  taxpayerName: {
    type: String,
    required: true,
    trim: true
  },
  
  nidNumber: {
    type: String,
    required: true,
    trim: true
  },
  
  passportNumber: {
    type: String,
    trim: true
  },
  
  tinNumber: {
    type: String,
    required: true,
    trim: true
  },
  
  // Assessment Information
  assessmentYear: {
    type: String,
    required: true,
    default: '2025-2026'
  },
  
  // Tax Office Information
  circle: {
    type: String,
    required: true,
    trim: true
  },
  
  taxZone: {
    type: String,
    required: true,
    trim: true
  },
  
  // Income and Tax Details
  totalIncome: {
    type: Number,
    required: true,
    default: 0
  },
  
  totalTaxPaid: {
    type: Number,
    required: true,
    default: 0
  },
  
  // Return Registration Details (from image)
  returnRegisterSerialNo: {
    type: String,
    required: true
  },
  
  returnRegisterVolumeNo: {
    type: String,
    default: ''
  },
  
  returnSubmissionDate: {
    type: String,
    required: true
  },
  
  // Additional Information
  taxOfficeName: {
    type: String,
    default: 'National Board of Revenue',
    trim: true
  },
  
  taxOfficeAddress: {
    type: String,
    default: 'Income Tax Office',
    trim: true
  },
  
  // Verification Information
  verificationUrl: {
    type: String
  },
  
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
    enum: ['submitted', 'acknowledged', 'pending', 'completed'],
    default: 'completed'
  },
  
  // Document type
  documentType: {
    type: String,
    default: 'Acknowledgement Receipt/Certificate of Return of Income'
  },
  
  // Certificate generation date
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
taxReturnAcknowledgementSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Generate verification URL
  if (!this.verificationUrl) {
    this.verificationUrl = `https://etaxnbr.gov.bd/verify/${this.receiptId}`;
  }
});

// Indexes for better query performance
taxReturnAcknowledgementSchema.index({ user: 1, createdAt: -1 });
taxReturnAcknowledgementSchema.index({ receiptId: 1 });
taxReturnAcknowledgementSchema.index({ tinNumber: 1 });
taxReturnAcknowledgementSchema.index({ nidNumber: 1 });
taxReturnAcknowledgementSchema.index({ assessmentYear: 1 });

const TaxReturnAcknowledgement = mongoose.model('TaxReturnAcknowledgement', taxReturnAcknowledgementSchema);

module.exports = TaxReturnAcknowledgement;