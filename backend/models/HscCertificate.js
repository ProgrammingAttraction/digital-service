const mongoose = require('mongoose');

const hscCertificateSchema = new mongoose.Schema({
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
    default: 'DBH 6002245'
  },
  
  registrationNo: {
    type: String,
    required: true,
    trim: true,
    default: '904466/2014'
  },
  
  dbhscNo: {
    type: String,
    required: true,
    trim: true,
    default: '09002332'
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
  
  collegeName: {
    type: String,
    required: true,
    trim: true
  },
  
  collegeLocation: {
    type: String,
    required: true,
    trim: true
  },
  
  district: {
    type: String,
    required: true,
    trim: true,
    default: 'Dhaka'
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
    default: '4.50'
  },
  
  // Date of Birth
  dateOfBirth: {
    type: Date,
    required: true
  },
  
  birthDateInWords: {
    type: String,
    required: true,
    default: 'Fifteenth March Nineteen Ninety Five'
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
    default: '2014'
  },
  
  // Additional Information
  division: {
    type: String,
    enum: ['First', 'Second', 'Third'],
    default: 'First'
  },
  
  session: {
    type: String,
    required: true,
    default: '2013-2014'
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
hscCertificateSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
});

// Indexes for better query performance
hscCertificateSchema.index({ user: 1, createdAt: -1 });
hscCertificateSchema.index({ receiptId: 1 });
hscCertificateSchema.index({ rollNo: 1 });
hscCertificateSchema.index({ registrationNo: 1 });
hscCertificateSchema.index({ studentName: 'text', collegeName: 'text' });

const HscCertificate = mongoose.model('HscCertificate', hscCertificateSchema);

module.exports = HscCertificate;