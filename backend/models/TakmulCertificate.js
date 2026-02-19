const mongoose = require('mongoose');

const takmulCertificateSchema = new mongoose.Schema({
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
  
  // Certificate Information (from your form fields)
  certificateNumber: {
    type: String,
    required: true,
    trim: true
  },
  
  passportNumber: {
    type: String,
    required: true,
    trim: true
  },
  
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  nationality: {
    type: String,
    required: true,
    trim: true,
    default: 'Bangladesh'
  },
  
  workType: {
    type: String,
    required: true,
    enum: ['Domestic Worker', 'General Labor', 'Other']
  },
  
  labourNumber: {
    type: String,
    required: true,
    trim: true
  },
  
  issueDate: {
    type: String,
    required: true
  },
  
  expiryDate: {
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
takmulCertificateSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
});

// Indexes for better query performance
takmulCertificateSchema.index({ user: 1, createdAt: -1 });
takmulCertificateSchema.index({ receiptId: 1 });
takmulCertificateSchema.index({ certificateNumber: 1 });
takmulCertificateSchema.index({ passportNumber: 1 });

const TakmulCertificate = mongoose.model('TakmulCertificate', takmulCertificateSchema);

module.exports = TakmulCertificate;