const mongoose = require('mongoose');

const nidOrderSchema = new mongoose.Schema({
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
  
  // File Information
  pdfFile: {
    type: String, // Can be null
    default: null
  },
  
  // NID Photo - Can be either file path or URL
  nidPhoto: {
    type: String,
    required: true
  },
  nidPhotoType: {
    type: String,
    enum: ['file', 'url'],
    required: true
  },
  
  // Signature - Can be either file path or URL or null
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
nidOrderSchema.index({ user: 1, createdAt: -1 });
nidOrderSchema.index({ receiptId: 1 }, { unique: true });
nidOrderSchema.index({ nationalId: 1 });

const NidOrder = mongoose.model('NidOrder', nidOrderSchema);

module.exports = NidOrder;