const mongoose = require('mongoose');

const sscCertificateSchema = new mongoose.Schema({
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
  
  // Certificate Information
  serialNo: {
    type: String,
    required: true,
    trim: true,
    default: 'DBS 5001144'
  },
  
  registrationNo: {
    type: String,
    required: true,
    trim: true,
    default: '804466/2012'
  },
  
  dbcscNo: {
    type: String,
    required: true,
    trim: true,
    default: '08001332'
  },
  
  // Student Details
  studentName: {
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
  
  schoolName: {
    type: String,
    required: true,
    trim: true
  },
  
  schoolLocation: {
    type: String,
    required: true,
    trim: true
  },
  
  district: {
    type: String,
    required: true,
    trim: true,
    default: 'Kishorganj'
  },
  
  rollNo: {
    type: String,
    required: true,
    trim: true
  },
  
  // Examination Details
  group: {
    type: String,
    enum: ['Science', 'Commerce', 'Arts', 'Vocational'],
    default: 'Science'
  },
  
  gpa: {
    type: String,
    required: true,
    default: '4.18'
  },
  
  // Date of Birth
  dateOfBirth: {
    type: Date,
    required: true
  },
  
  birthDateInWords: {
    type: String,
    required: true,
    default: 'Twenty First October Nineteen Ninety Three'
  },
  
  // Examination Details
  board: {
    type: String,
    required: true,
    default: 'Dhaka'
  },
  
  resultPublicationDate: {
    type: Date,
    required: true
  },
  
  examinationYear: {
    type: String,
    required: true,
    default: '2012'
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
    enum: ['issued', 'verified', 'archived'],
    default: 'issued'
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
sscCertificateSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
});

// Indexes for better query performance
sscCertificateSchema.index({ user: 1, createdAt: -1 });
sscCertificateSchema.index({ receiptId: 1 });
sscCertificateSchema.index({ rollNo: 1 });
sscCertificateSchema.index({ registrationNo: 1 });
sscCertificateSchema.index({ studentName: 'text', schoolName: 'text' });

const SscCertificate = mongoose.model('SscCertificate', sscCertificateSchema);

module.exports = SscCertificate;