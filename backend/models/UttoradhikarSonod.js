// models/UttoradhikarSonod.js
const mongoose = require('mongoose');

const uttoradhikarSonodSchema = new mongoose.Schema({
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
    type: [String], // Array of individual digits as per image format
    required: true,
    default: ['২', '০', '২', '৫', '০', '০', '৩', '৬', '১', '১', '১', '১', '১', '১', '১']
  },
  
  issueDate: {
    type: String,
    required: true
  },
  
  // Deceased Person Information
  deceasedName: {
    type: String,
    required: true,
    trim: true
  },
  
  deceasedRelation: {
    type: String,
    required: true,
    trim: true
  },
  
  deceasedFatherOrHusband: {
    type: String,
    trim: true
  },
  
  deceasedVillage: {
    type: String,
    required: true,
    trim: true
  },
  
  deceasedWardNo: {
    type: String,
    required: true,
    trim: true
  },
  
  deceasedPostOffice: {
    type: String,
    required: true,
    trim: true
  },
  
  deceasedThana: {
    type: String,
    required: true,
    trim: true
  },
  
  deceasedUpazila: {
    type: String,
    required: true,
    trim: true
  },
  
  deceasedDistrict: {
    type: String,
    required: true,
    trim: true
  },
  
  deceasedDeathDate: {
    type: String,
    required: true
  },
  
  // Heirs Information (Array of heirs)
  heirs: [
    {
      name: {
        type: String,
        required: true,
        trim: true
      },
      relation: {
        type: String,
        required: true,
        trim: true
      },
      nidNumber: {
        type: String,
        trim: true
      }
    }
  ],
  
  // Chairman Information
  chairmanName: {
    type: String,
    trim: true
  },
  
  chairmanSignature: {
    type: String,
    trim: true
  },
  
  // Union/Upazila Information
  unionName: {
    type: String,
    required: true,
    trim: true
  },
  
  unionWebsite: {
    type: String,
    trim: true
  },
  
  unionEmail: {
    type: String,
    trim: true
  },
  
  unionPhone: {
    type: String,
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
uttoradhikarSonodSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
});

// Indexes for better query performance
uttoradhikarSonodSchema.index({ user: 1, createdAt: -1 });
uttoradhikarSonodSchema.index({ receiptId: 1 });
uttoradhikarSonodSchema.index({ deceasedName: 1 });

const UttoradhikarSonod = mongoose.model('UttoradhikarSonod', uttoradhikarSonodSchema);

module.exports = UttoradhikarSonod;