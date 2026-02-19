const mongoose = require('mongoose');

const surokkhaCertificateSchema = new mongoose.Schema({
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
  // Certificate identification
  certificateId: {
    type: String,
    unique: true,
    required: true
  },
  
  // Certificate information (from the image)
  certificateNo: {
    type: String,
    required: true,
    default: 'BD6277228992062'
  },
  
  // Beneficiary Details
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  nationality: {
    type: String,
    default: 'Bangladeshi'
  },
  
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true
  },
  
  nationalId: {
    type: String,
    trim: true
  },
  
  birthNo: {
    type: String,
    trim: true
  },
  
  passportNo: {
    type: String,
    trim: true
  },
  
  dateOfBirth: {
    type: String,
    required: true
  },
  
  vaccinatedBy: {
    type: String,
    default: 'Directorate General of Health Services (DGHS)'
  },
  
  // Vaccination Details - Dose 1
  dose1Date: {
    type: String,
    required: true
  },
  
  dose1VaccineName: {
    type: String,
    required: true
  },
  
  dose1OtherVaccine: {
    type: String
  },
  
  // Vaccination Details - Dose 2
  dose2Date: {
    type: String,
    required: true
  },
  
  dose2VaccineName: {
    type: String,
    required: true
  },
  
  dose2OtherVaccine: {
    type: String
  },
  
  // Vaccination Details - Dose 3
  dose3Date: {
    type: String
  },
  
  dose3VaccineName: {
    type: String
  },
  
  dose3OtherVaccine: {
    type: String
  },
  
  // Vaccination Center
  vaccinationCenter: {
    type: String,
    required: true,
    trim: true
  },
  
  totalDoses: {
    type: String,
    required: true
  },
  
  // Verification URLs
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
surokkhaCertificateSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
});

// Indexes for better query performance
surokkhaCertificateSchema.index({ user: 1, createdAt: -1 });
surokkhaCertificateSchema.index({ certificateId: 1 });
surokkhaCertificateSchema.index({ passportNo: 1 });
surokkhaCertificateSchema.index({ certificateNo: 1 });

const SurokkhaCertificate = mongoose.model('SurokkhaCertificate', surokkhaCertificateSchema);

module.exports = SurokkhaCertificate;