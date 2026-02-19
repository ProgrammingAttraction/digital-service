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
  oldNid: { type: String },
  formNumber: { type: String },
  voterNumber: { type: String },
  voterArea: { type: String },
  mobileNumber: { type: String },
  
  // Family Information
  fatherName: { type: String, required: true },
  motherName: { type: String, required: true },
  spouseName: { type: String },
  
  // Personal Information
  education: { type: String },
  birthPlace: { type: String, required: true },
  birthDate: { type: String, required: true },
  birthDay: { type: String },
  age: { type: String },
  religion: { type: String },
  bloodGroup: { type: String },
  gender: { 
    type: String, 
    enum: ['Male', 'Female', 'Other'],
    required: true 
  },
  
  // Address Information
  presentAddress: {
    division: { type: String },
    district: { type: String },
    upozila: { type: String },
    postOffice: { type: String },
    postalCode: { type: String },
    homeOrHolding: { type: String },
    region: { type: String },
    addressLine: { type: String }
  },
  permanentAddress: {
    division: { type: String },
    district: { type: String },
    upozila: { type: String },
    postOffice: { type: String },
    postalCode: { type: String },
    homeOrHolding: { type: String },
    region: { type: String },
    addressLine: { type: String }
  },
  currentAddress: { type: String }, // Keeping for backward compatibility
  permanentAddressLine: { type: String }, // Keeping for backward compatibility
  
  // Location Codes
  upazilaCode: { type: String },
  districtCode: { type: String },
  
  // File Information
  photo: { type: String }, // URL for extracted photo
  pdfFile: { type: String }, // Original PDF file path
  nidImage: { type: String }, // NID photo file path
  signature: { type: String }, // Signature file path
  
  // API Response Metadata
  apiOwner: { type: String },
  apiMessage: { type: String },
  apiSuccess: { type: Boolean },
  apiCode: { type: Number },
  
  // User Info from API
  apiUserInfo: {
    username: { type: String },
    keyType: { type: String },
    balance: { type: String },
    expDate: { type: String }
  },
  
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

module.exports = mongoose.model('ServerCopyUnofficial', serverCopySchema);