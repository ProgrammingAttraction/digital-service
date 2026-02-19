const mongoose = require('mongoose');

const birthCertificateSchema = new mongoose.Schema({
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
  
  // ===== HEADER SECTION =====
  governmentHeader: {
    english: {
      type: String,
      default: "Government of the People's Republic of Bangladesh"
    },
    bangla: {
      type: String,
      default: "গণপ্রজাতন্ত্রী বাংলাদেশ সরকার"
    }
  },
  
  officeOfRegistrar: {
    english: {
      type: String,
      default: "Office of the Registrar, Birth and Death Registration"
    },
    bangla: {
      type: String,
      default: "জন্ম ও মৃত্যু নিবন্ধন অফিস"
    }
  },
  
  zoneCityCorporation: {
    english: {
      type: String,
      required: true,
      trim: true
    },
    bangla: {
      type: String,
      required: true,
      trim: true
    }
  },
  
  cityCorporation: {
    english: {
      type: String,
      required: true,
      trim: true
    },
    bangla: {
      type: String,
      required: true,
      trim: true
    }
  },
  
  rule: {
    english: {
      type: String,
      default: "Rule 9, 10"
    },
    bangla: {
      type: String,
      default: "নিয়ম ৯, ১০"
    }
  },
  
  // ===== CERTIFICATE TITLES =====
  certificateTitle: {
    english: {
      type: String,
      default: "Birth Registration Certificate"
    },
    bangla: {
      type: String,
      default: "জন্ম নিবন্ধন সনদ"
    }
  },
  
  // ===== REGISTRATION DETAILS =====
  dateOfRegistration: {
    type: Date,
    required: true
  },
  
  birthRegistrationNumber: {
    type: String,
    required: true,
    unique: true
  },
  
  dateOfIssuance: {
    type: Date,
    required: true
  },
  
  // ===== PERSONAL INFORMATION =====
  name: {
    english: {
      type: String,
      required: true,
      trim: true
    },
    bangla: {
      type: String,
      required: true,
      trim: true
    }
  },
  
  sex: {
    english: {
      type: String,
      required: true
    },
    bangla: {
      type: String,
      required: true
    }
  },
  
  motherName: {
    english: {
      type: String,
      required: true,
      trim: true
    },
    bangla: {
      type: String,
      required: true,
      trim: true
    }
  },
  
  motherNationality: {
    english: {
      type: String,
      default: "Bangladeshi"
    },
    bangla: {
      type: String,
      default: "বাংলাদেশি"
    }
  },
  
  fatherName: {
    english: {
      type: String,
      required: true,
      trim: true
    },
    bangla: {
      type: String,
      required: true,
      trim: true
    }
  },
  
  fatherNationality: {
    english: {
      type: String,
      default: "Bangladeshi"
    },
    bangla: {
      type: String,
      default: "বাংলাদেশি"
    }
  },
  
  placeOfBirth: {
    english: {
      type: String,
      required: true,
      trim: true
    },
    bangla: {
      type: String,
      required: true,
      trim: true
    }
  },
  
  permanentAddress: {
    english: {
      type: String,
      required: true,
      trim: true
    },
    bangla: {
      type: String,
      required: true,
      trim: true
    }
  },
  
  // ===== ADDITIONAL INFORMATION =====
  dateOfBirth: {
    type: Date,
    required: true
  },
  
  dateOfBirthInWords: {
    english: {
      type: String,
      trim: true
    },
    bangla: {
      type: String,
      trim: true
    }
  },
  
  // ===== SIGNATURE SECTION =====
  sealSignature: {
    english: {
      type: String,
      default: "Seal & Signature"
    },
    bangla: {
      type: String,
      default: "সিল ও স্বাক্ষর"
    }
  },
  
  assistantRegistrar: {
    english: {
      type: String,
      default: "Assistant to Registrar"
    },
    bangla: {
      type: String,
      default: "নিবন্ধকের সহকারী"
    }
  },
  
  preparationVerification: {
    english: {
      type: String,
      default: "(Preparation, Verification)"
    },
    bangla: {
      type: String,
      default: "(প্রস্তুতি, যাচাই)"
    }
  },
  
  // ===== FOOTER INFORMATION =====
  generatedFrom: {
    english: {
      type: String,
      default: "bdris.gov.bd"
    },
    bangla: {
      type: String,
      default: "bdris.gov.bd"
    }
  },
  
  verificationNote: {
    english: {
      type: String,
      default: "This certificate is generated from bdris.gov.bd, and to verify this certificate, please scan the above QR Code & Bar Code."
    },
    bangla: {
      type: String,
      default: "এই সনদটি bdris.gov.bd থেকে তৈরি করা হয়েছে, এবং এই সনদটি যাচাই করতে উপরের কিউআর কোড ও বার কোড স্ক্যান করুন।"
    }
  },
  
  // ===== VERIFICATION & TECHNICAL =====
  verificationUrl: {
    type: String
  },
  
  qrCodeData: {
    type: String
  },
  
  barcodeData: {
    type: String
  },
  
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  
  status: {
    type: String,
    default: 'completed'
  },
  
  // ===== METADATA =====
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
birthCertificateSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
});

// Indexes for better query performance
birthCertificateSchema.index({ user: 1, createdAt: -1 });
birthCertificateSchema.index({ receiptId: 1 });
birthCertificateSchema.index({ birthRegistrationNumber: 1 });
birthCertificateSchema.index({ 'name.english': 1 });
birthCertificateSchema.index({ 'name.bangla': 1 });
birthCertificateSchema.index({ 'fatherName.english': 1 });
birthCertificateSchema.index({ 'fatherName.bangla': 1 });
birthCertificateSchema.index({ 'motherName.english': 1 });
birthCertificateSchema.index({ 'motherName.bangla': 1 });

const BirthCertificate = mongoose.model('BirthCertificate', birthCertificateSchema);

module.exports = BirthCertificate;