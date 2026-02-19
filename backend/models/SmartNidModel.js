const mongoose = require('mongoose');

const SmartNidSchema = new mongoose.Schema({
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
  
  // Order Information
  receiptId: {
    type: String,
    required: true,
    unique: true
  },
  
  // PDF Processing Information
  pdfFile: {
    type: String,
    default: null
  },
  
  // NID Photo
  nidPhoto: {
    type: String,
    required: true
  },
  nidPhotoType: {
    type: String,
    enum: ['file', 'url'],
    required: true
  },
  
  // Signature
  signature: {
    type: String,
    default: null
  },
  signatureType: {
    type: String,
    enum: ['file', 'url', 'none'],
    default: 'none'
  },
  
  // Personal Information
  nameBangla: {
    type: String,
    required: true
  },
  nameEnglish: {
    type: String,
    required: true
  },
  nationalId: {
    type: String,
    required: true
  },
  pin: {
    type: String,
    required: true
  },
  dateOfBirth: {
    type: String,
    required: true
  },
  fatherName: {
    type: String,
    required: true
  },
  motherName: {
    type: String,
    required: true
  },
  birthPlace: {
    type: String,
    required: true
  },
  bloodGroup: {
    type: String,
    default: ''
  },
  dateOfToday: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  gender: {
    type: String,
    default: ''
  },
  religion: {
    type: String,
    default: ''
  },
  
  // Payment Information
  servicePrice: {
    type: Number,
    required: true
  },
  transactionId: {
    type: String,
    default: null
  },
  
  // Order Status
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'cancelled'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Indexes
SmartNidSchema.index({ user: 1, createdAt: -1 });
SmartNidSchema.index({ receiptId: 1 }, { unique: true });
SmartNidSchema.index({ nationalId: 1 });

const SmartNid = mongoose.model('SmartNid', SmartNidSchema);

module.exports = SmartNid;