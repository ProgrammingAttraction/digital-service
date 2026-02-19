const mongoose = require('mongoose');

const deathCertificateSchema = new mongoose.Schema({
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
  
  unionParishad: {
    english: {
      type: String,
      required: true,
      trim: true
    },
    bangla: {
      type: String,
      trim: true
    }
  },
  
  upazila: {
    english: {
      type: String,
      required: true,
      trim: true
    },
    bangla: {
      type: String,
      trim: true
    }
  },
  
  district: {
    english: {
      type: String,
      required: true,
      trim: true
    },
    bangla: {
      type: String,
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
      default: "Death Registration Certificate"
    },
    bangla: {
      type: String,
      default: "মৃত্যু নিবন্ধন সনদ"
    }
  },
  
  // ===== REGISTRATION DETAILS =====
  dateOfRegistration: {
    type: Date,
    required: true
  },
  
  deathRegistrationNumber: {
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
  
  personNationality: {
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
  
  placeOfDeath: {
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
  
  sex: {
    english: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      required: true
    },
    bangla: {
      type: String,
      enum: ['পুরুষ', 'মহিলা', 'অন্যান্য'],
      required: true
    }
  },
  
  dateOfDeath: {
    type: Date,
    required: true
  },
  
  dateOfDeathInWords: {
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
  
  causeOfDeath: {
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
  
  registrar: {
    english: {
      type: String,
      default: "Registrar"
    },
    bangla: {
      type: String,
      default: "নিবন্ধক"
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
    enum: ['draft', 'completed', 'archived'],
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
deathCertificateSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
});

// Indexes for better query performance
deathCertificateSchema.index({ user: 1, createdAt: -1 });
deathCertificateSchema.index({ receiptId: 1 });
deathCertificateSchema.index({ deathRegistrationNumber: 1 });
deathCertificateSchema.index({ 'name.english': 1 });
deathCertificateSchema.index({ 'name.bangla': 1 });
deathCertificateSchema.index({ 'fatherName.english': 1 });
deathCertificateSchema.index({ 'fatherName.bangla': 1 });

const DeathCertificate = mongoose.model('DeathCertificate', deathCertificateSchema);

module.exports = DeathCertificate;