const mongoose = require('mongoose');

const nagorikSonodSchema = new mongoose.Schema({
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
  
  // Certificate Information (from the image)
  certificateNo: {
    type: String,
    required: true,
    default: '116770007784'
  },
  
  issueDate: {
    type: String,
    required: true
  },
  
  // Personal Information
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
  
  spouseName: {
    type: String,
    default: '',
    trim: true
  },
  
  birthDate: {
    type: String,
    required: true
  },
  
  nidNumber: {
    type: String,
    default: '',
    trim: true
  },
  
  grandfatherName: {
    type: String,
    default: '',
    trim: true
  },
  
  // Permanent Address
  wardNo: {
    type: String,
    required: true,
    trim: true
  },
  
  villageArea: {
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
  
  thana: {
    type: String,
    required: true,
    trim: true
  },
  
  upazila: {
    type: String,
    required: true,
    trim: true
  },
  
  district: {
    type: String,
    required: true,
    trim: true
  },
  
  // Municipality Information
  municipalityName: {
    type: String,
    required: true,
    trim: true
  },
  
  municipalityEmail: {
    type: String,
    required: true,
    trim: true
  },
  
  municipalityMobile: {
    type: String,
    required: true,
    trim: true
  },
  
  // Verification
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
    enum: ['draft', 'completed', 'archived'],
    default: 'completed'
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
nagorikSonodSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
});

// Indexes for better query performance
nagorikSonodSchema.index({ user: 1, createdAt: -1 });
nagorikSonodSchema.index({ receiptId: 1 });
nagorikSonodSchema.index({ certificateNo: 1 });
nagorikSonodSchema.index({ nidNumber: 1 });

const NagorikSonod = mongoose.model('NagorikSonod', nagorikSonodSchema);

module.exports = NagorikSonod;