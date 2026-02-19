const mongoose = require('mongoose');

const taxReturnSchema = new mongoose.Schema({
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
  referenceNo:{
  type: String,
  },
  // Tax Return Information (from the image)
  assessmentYear: {
    type: String,
    required: true,
    default: '2025-2026'
  },
  
  taxpayerName: {
    type: String,
    required: true,
    trim: true
  },
  
  // New fields from the image
  fathersName: {
    type: String,
    required: true,
    trim: true
  },
  
  mothersName: {
    type: String,
    required: true,
    trim: true
  },
  
  // Address fields from the image
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
  
  // Status field from the image
  taxpayerStatus: {
    type: String,
    required: true,
    default: 'Individual -> Bangladesh -> Having NID'
  },
  
  nidNumber: {
    type: String,
    required: true,
    trim: true
  },
  
  tinNumber: {
    type: String,
    required: true,
    trim: true
  },
  
  circle: {
    type: String,
    required: true,
    default: 'Circle-114'
  },
  
  taxZone: {
    type: String,
    required: true,
    default: 'Taxes Zone-06, Dhaka'
  },
  
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
  
  // Return Register Information
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
  
  // Financial Year
  financialYear: {
    type: String,
    required: true
  },
  
  // Additional Information
  taxOfficeName: {
    type: String,
    default: 'National Board of Revenue'
  },
  
  taxOfficeAddress: {
    type: String,
    default: 'Income Tax Department, Dhaka'
  },
  
  // Calculation fields
  taxableIncome: {
    type: Number,
    default: 0
  },
  
  taxLiability: {
    type: Number,
    default: 0
  },
  
  taxRebate: {
    type: Number,
    default: 0
  },
  
  netTaxPayable: {
    type: Number,
    default: 0
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
    enum: ['submitted', 'verified', 'pending', 'rejected', 'completed'],
    default: 'completed'
  },
  
  // Certificate generation date
  certificateDate: {
    type: Date,
    default: Date.now
  },
  
  // Certificate issuer
  certificateIssuer: {
    type: String,
    default: 'System Generated'
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
taxReturnSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
});

// Calculate tax liability based on Bangladesh tax slab (2025-2026)
taxReturnSchema.pre('save', function(next) {
  if (this.totalIncome > 0) {
    let tax = 0;
    const income = this.totalIncome;
    
    // Bangladesh Tax Slabs for 2025-2026
    if (income <= 350000) {
      tax = 0;
    } else if (income <= 450000) {
      tax = (income - 350000) * 0.05;
    } else if (income <= 750000) {
      tax = 5000 + (income - 450000) * 0.10;
    } else if (income <= 1150000) {
      tax = 35000 + (income - 750000) * 0.15;
    } else if (income <= 1650000) {
      tax = 95000 + (income - 1150000) * 0.20;
    } else {
      tax = 195000 + (income - 1650000) * 0.25;
    }
    
    this.taxLiability = tax;
    this.taxableIncome = income > 350000 ? income - 350000 : 0;
    this.netTaxPayable = Math.max(0, tax - (this.taxRebate || 0));
  }
});

// Indexes for better query performance
taxReturnSchema.index({ user: 1, createdAt: -1 });
taxReturnSchema.index({ receiptId: 1 });
taxReturnSchema.index({ tinNumber: 1 });
taxReturnSchema.index({ nidNumber: 1 });
taxReturnSchema.index({ assessmentYear: 1 });

const TaxReturn = mongoose.model('TaxReturn', taxReturnSchema);

module.exports = TaxReturn;