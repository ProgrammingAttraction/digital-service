const mongoose = require('mongoose');

const policeClearanceSchema = new mongoose.Schema({
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
  
  // Police Clearance Information (from the image)
  referenceNo: {
    type: String,
    required: true,
    default: '1C4GGZZ'
  },
  
  policeStation: {
    type: String,
    required: true,
    trim: true
  },
  
  passportNo: {
    type: String,
    required: true,
    trim: true
  },
  
  fatherName: {
    type: String,
    required: true,
    trim: true
  },
  
  po: {
    type: String,
    default: 'P/O'
  },
  
  psUpozila: {
    type: String,
    default: 'P/S Upozila'
  },
  
  issueDate: {
    type: String,
    required: true
  },
  
  villageArea: {
    type: String,
    required: true,
    trim: true
  },
  
  postCode: {
    type: String,
    required: true,
    trim: true
  },
  
  district: {
    type: String,
    required: true,
    trim: true
  },
  
  issuePlace: {
    type: String,
    required: true,
    trim: true
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
policeClearanceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
});

// Indexes for better query performance
policeClearanceSchema.index({ user: 1, createdAt: -1 });
policeClearanceSchema.index({ receiptId: 1 });
policeClearanceSchema.index({ passportNo: 1 });

const PoliceClearance = mongoose.model('PoliceClearance', policeClearanceSchema);

module.exports = PoliceClearance;