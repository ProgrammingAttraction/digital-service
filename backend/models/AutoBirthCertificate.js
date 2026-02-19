const mongoose = require('mongoose');

const autoBirthCertificateSchema = new mongoose.Schema({
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
  
  // Auto-generated information
  ubrn: {
    type: String,
    trim: true
  },
  birthDate: {
    type: String,
    trim: true
  },
  
  // ===== PERSONAL INFORMATION =====
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
  fatherNameBangla: {
    type: String,
    required: true,
    trim: true
  },
  fatherNameEnglish: {
    type: String,
    required: true,
    trim: true
  },
  fatherNationalityBangla: {
    type: String,
    required: true,
    trim: true
  },
  fatherNationalityEnglish: {
    type: String,
    required: true,
    trim: true
  },
  motherNameBangla: {
    type: String,
    required: true,
    trim: true
  },
  motherNameEnglish: {
    type: String,
    required: true,
    trim: true
  },
  motherNationalityBangla: {
    type: String,
    required: true,
    trim: true
  },
  motherNationalityEnglish: {
    type: String,
    required: true,
    trim: true
  },
  birthPlaceBangla: {
    type: String,
    required: true,
    trim: true
  },
  birthPlaceEnglish: {
    type: String,
    required: true,
    trim: true
  },
  gender: {
    type: String,
    required: true
  },
  
  // ===== BIRTH REGISTRATION DETAILS =====
  birthRegistrationNumber: {
    type: String,
    required: true,
    trim: true
  },
  dateOfRegistration: {
    type: String,
    required: true,
    trim: true
  },
  dateOfBirth: {
    type: String,
    required: true,
    trim: true
  },
  dateOfBirthInWords: {
    type: String,
    trim: true
  },
  dateOfIssuance: {
    type: String,
    required: true,
    trim: true
  },
  
  // ===== LOCATION DETAILS =====
  registerOfficeAddress: {
    type: String,
    required: true,
    trim: true
  },
  upazilaPourashavaCityCorporationZila: {
    type: String,
    required: true,
    trim: true
  },
  permanentAddressBangla: {
    type: String,
    required: true,
    trim: true
  },
  permanentAddressEnglish: {
    type: String,
    required: true,
    trim: true
  },
  
  // ===== TECHNICAL DETAILS =====
  qrLink: {
    type: String,
    required: true,
    trim: true
  },
  leftBarcode: {
    type: String,
    required: true,
    trim: true
  },
  autoBarcode: {
    type: String,
    trim: true
  },
  
  // ===== PAYMENT & SERVICE DETAILS =====
  serviceName: {
    type: String,
    default: 'অটো জন্মানিবন্ধন মেক'
  },
  servicePrice: {
    type: Number,
    required: true,
    default: 200
  },
  
  // ===== TRANSACTION & VERIFICATION =====
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  verificationKey: {
    type: String,
    unique: true
  },
  
  // ===== API CAPTCHA DATA =====
  sessionId: {
    type: String,
    trim: true
  },
  captchaValue: {
    type: String,
    trim: true
  },
  
  // ===== STATUS & METADATA =====
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed'
  },
  apiSource: {
    type: String,
    default: 'bdris'
  },
  apiResponse: {
    type: mongoose.Schema.Types.Mixed
  },
  
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
autoBirthCertificateSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Generate receiptId if not present
  if (!this.receiptId) {
    this.receiptId = generateAutoBirthReceiptId();
  }
  
  // Generate verification key if not present
  if (!this.verificationKey) {
    this.verificationKey = generateVerificationKey();
  }
});

// Helper function to generate receipt ID
function generateAutoBirthReceiptId() {
  const prefix = 'ABTH';
  const timestamp = Date.now().toString().slice(-8);
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${randomStr}`;
}

// Helper function to generate verification key
function generateVerificationKey() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// Indexes for better query performance
autoBirthCertificateSchema.index({ user: 1, createdAt: -1 });
autoBirthCertificateSchema.index({ receiptId: 1 });
autoBirthCertificateSchema.index({ birthRegistrationNumber: 1 });
autoBirthCertificateSchema.index({ ubrn: 1 });
autoBirthCertificateSchema.index({ verificationKey: 1 });
autoBirthCertificateSchema.index({ status: 1 });

const AutoBirthCertificate = mongoose.model('AutoBirthCertificate', autoBirthCertificateSchema);

module.exports = AutoBirthCertificate;