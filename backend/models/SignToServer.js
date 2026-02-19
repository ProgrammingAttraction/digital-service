const mongoose = require('mongoose');

const signToServerSchema = new mongoose.Schema({
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
  
  // Copy Type (old/new server copy)
  copyType: {
    type: String,
    enum: ['old', 'new', 'server_copy', 'unofficial'],
    default: 'server_copy',
    required: true
  },
  
  // ====== PERSONAL INFORMATION ======
  // Name Information
  nameBangla: {
    type: String,
    required: true,
    trim: true
  },
  
  nameEnglish: {
    type: String,
    required: true,
    trim: true
  },
  
  // ID Information
  nationalId: {
    type: String,
    required: true,
    trim: true
  },
  
  pinNumber: {
    type: String,
    required: true,
    trim: true
  },
  
  formNumber: {
    type: String,
    required: true,
    trim: true
  },
  
  // Voter Information
  voterNumber: {
    type: String,
    required: true,
    trim: true
  },
  
  voterArea: {
    type: String,
    required: true,
    trim: true
  },
  
  // Contact Information
  mobileNumber: {
    type: String,
    trim: true
  },
  
  // ====== FAMILY INFORMATION ======
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
    trim: true
  },
  
  // ====== PERSONAL DETAILS ======
  education: {
    type: String,
    required: true,
    trim: true
  },
  
  birthPlace: {
    type: String,
    required: true,
    trim: true
  },
  
  birthDate: {
    type: String,
    required: true
  },
  
  bloodGroup: {
    type: String,
    trim: true
  },
  
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', 'Gender'],
    required: true
  },
  
  // ====== ADDRESS INFORMATION ======
  currentAddress: {
    type: String,
    required: true,
    trim: true
  },
  
  permanentAddress: {
    type: String,
    required: true,
    trim: true
  },
  
  // ====== FILE INFORMATION ======
  // PDF file (server copy)
  pdfFile: {
    originalName: String,
    fileName: String,
    filePath: String,
    fileSize: Number,
    mimeType: String
  },
  
  // NID/Photo file
  nidPhoto: {
    originalName: String,
    fileName: String,
    filePath: String,
    fileSize: Number,
    mimeType: String,
    photoUrl: String
  },
  
  nidPhotoType: {
    type: String,
    enum: ['file', 'url', 'extracted', 'none'],
    default: 'none'
  },
  
  // ====== UBRN/BIRTH REGISTRATION DATA ======
  ubrn: {
    type: String,
    trim: true
  },
  
  birthRegistrationNumber: {
    type: String,
    trim: true
  },
  
  // ====== EXTRACTED DATA ======
  extractedData: {
    type: mongoose.Schema.Types.Mixed // Stores the full extracted data from API
  },
  
  // ====== SERVICE INFORMATION ======
  servicePrice: {
    type: Number,
    default: 0
  },
  
  serviceName: {
    type: String,
    default: 'সার্ভার কপি'
  },
  
  // ====== VERIFICATION INFORMATION ======
  verificationUrl: {
    type: String
  },
  
  qrCodeData: {
    type: String
  },
  
  // ====== TRANSACTION INFORMATION ======
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  
  // ====== PROCESSING INFORMATION ======
  // API session information
  apiSessionId: {
    type: String
  },
  
  captchaValue: {
    type: String
  },
  
  apiResponse: {
    type: mongoose.Schema.Types.Mixed // Stores the full API response
  },
  
  // ====== STATUS ======
  status: {
    type: String,
    enum: ['pending', 'analyzing', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  
  // Admin notes
  adminNotes: {
    type: String,
    trim: true
  },
  
  // Processing errors
  errorMessage: {
    type: String,
    trim: true
  },
  
  // ====== TIMESTAMPS ======
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  processedAt: {
    type: Date
  },
  
  completedAt: {
    type: Date
  }
});

// Update the updatedAt field before saving
signToServerSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Set completedAt when status changes to completed
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  // Set processedAt when status changes from pending
  if (this.isModified('status') && this.status !== 'pending' && !this.processedAt) {
    this.processedAt = new Date();
  }
});

// Virtual for formatted display
signToServerSchema.virtual('displayName').get(function() {
  return this.nameEnglish || this.nameBangla || 'Unknown';
});

// Virtual for service price display
signToServerSchema.virtual('formattedPrice').get(function() {
  return `${this.servicePrice || 0}৳`;
});

// Virtual for age calculation (if birthDate is provided)
signToServerSchema.virtual('age').get(function() {
  if (!this.birthDate) return null;
  
  try {
    const birthDate = new Date(this.birthDate);
    if (isNaN(birthDate.getTime())) return null;
    
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  } catch (error) {
    return null;
  }
});

// Indexes for better query performance
signToServerSchema.index({ user: 1, createdAt: -1 });
signToServerSchema.index({ receiptId: 1 }, { unique: true });
signToServerSchema.index({ nationalId: 1 });
signToServerSchema.index({ pinNumber: 1 });
signToServerSchema.index({ status: 1 });
signToServerSchema.index({ copyType: 1 });
signToServerSchema.index({ 'extractedData.requestId': 1 });
signToServerSchema.index({ createdAt: -1 });

const SignToServer = mongoose.model('SignToServer', signToServerSchema);

module.exports = SignToServer;