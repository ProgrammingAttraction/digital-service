const mongoose = require('mongoose');

const serverCopySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // User Information
  nameBangla: { type: String, required: true },
  nameEnglish: { type: String, required: true },
  nationalId: { type: String, required: true },
  pinNumber: { type: String, required: true },
  formNumber: { type: String },
  voterNumber: { type: String },
  voterArea: { type: String },
  mobileNumber: { type: String },
    ocupation: { type: String }, // Added ocupation field
  // Family Information
  fatherName: { type: String, required: true },
  motherName: { type: String, required: true },
  spouseName: { type: String },
  
  // Personal Information
  education: { type: String },
  birthPlace: { type: String, required: true },
  birthDate: { type: String, required: true },
  bloodGroup: { type: String },
  gender: { 
    type: String, 
    enum: ['Male', 'Female', 'Other'],
    required: true 
  },
  
  // Address Information
  currentAddress: { type: String, required: true },
  permanentAddress: { type: String, required: true },
  
  // File Information
  photo: { type: String }, // URL for extracted photo
  pdfFile: { type: String }, // Original PDF file path
  nidImage: { type: String }, // NID photo file path
  signature: { type: String }, // Signature file path
  
  // PDF Analysis Data
  extractedData: { type: mongoose.Schema.Types.Mixed }, // Raw extracted data
  
  // UBRN Information
  UBRN: { type: String },
  birthDateUBRN: { type: String },
  ubrnData: { type: mongoose.Schema.Types.Mixed }, // UBRN extracted data
  
  // Service Information
  copyType: { 
    type: String, 
    enum: ['old', 'new'],
    default: 'old' 
  },
  servicePrice: { type: Number, default: 5 },
  
  // Status Information
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending' 
  },
  orderId: { type: String, unique: true },
  
  // Verification Information
  verificationKey: { type: String },
  verificationUrl: { type: String },
  qrCodeData: { type: String },
  
  // Transaction Information
  transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Generate order ID before saving
serverCopySchema.pre('save', function(next) {
  if (!this.orderId) {
    const prefix = 'SC-';
    const timestamp = Date.now().toString().slice(-8);
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.orderId = `${prefix}${timestamp}${randomStr}`;
  }
  
  if (this.orderId && !this.verificationUrl) {
    this.verificationUrl = `${process.env.FRONTEND_URL}`;
    this.qrCodeData = `Server Copy Verification\nOrder ID: ${this.orderId}\nName: ${this.nameEnglish}\nVerify at: ${this.verificationUrl}`;
  }
  
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('ServerCopy', serverCopySchema);