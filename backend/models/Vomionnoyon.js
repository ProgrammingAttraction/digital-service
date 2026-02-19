const mongoose = require('mongoose');

const ownerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  portion: {
    type: String,
    required: true,
    trim: true
  }
}, { _id: false });

const landSchema = new mongoose.Schema({
  dagNo: {
    type: String,
    required: true,
    trim: true
  },
  class: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: String,
    required: true,
    trim: true
  }
}, { _id: false });

const vomionnoyonSchema = new mongoose.Schema({
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
  
  // General Information
  formNo: {
    type: String,
    required: true
  },
  porishishto: {
    type: String,
    required: true
  },
  slNo: {
    type: String,
    required: true
  },
  onuchhed: {
    type: String,
    required: true
  },
  officeName: {
    type: String,
    required: true
  },
  mouza: {
    type: String,
    required: true
  },
  upazila: {
    type: String,
    required: true
  },
  district: {
    type: String,
    required: true
  },
  
  // Holding Information
  khatian: {
    type: String,
    required: true
  },
  holding: {
    type: String,
    required: true
  },
  totalLand: {
    type: String,
    required: true
  },
  
  // Payment Details
  arrear3Plus: {
    type: String,
    required: true
  },
  arrearLast3: {
    type: String,
    required: true
  },
  interest: {
    type: String,
    required: true
  },
  currentDemand: {
    type: String,
    required: true
  },
  totalDemand: {
    type: String,
    required: true
  },
  totalCollect: {
    type: String,
    required: true
  },
  totalArrear: {
    type: String,
    required: true
  },
  
  // Additional Information
  inWords: {
    type: String,
    required: true
  },
  note: {
    type: String,
    required: true
  },
  chalanNo: {
    type: String,
    default: ''
  },
  dateBn: {
    type: String,
    required: true
  },
  dateEn: {
    type: String,
    required: true
  },
  
  // Arrays for owners and lands
  owners: [ownerSchema],
  lands: [landSchema],
  
  // QR Code data
  qrCodeData: {
    type: String
  },
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
vomionnoyonSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
});

const Vomionnoyon = mongoose.model('Vomionnoyon', vomionnoyonSchema);

module.exports = Vomionnoyon;