const mongoose = require('mongoose');

const autoNidMakerSchema = new mongoose.Schema({
    // User Information
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    userId: {
        type: String,
        required: true,
        index: true
    },
    username: {
        type: String,
        required: true
    },
    userEmail: {
        type: String,
        required: true
    },
    receiptId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    
    // Personal Information
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
    nationalId: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    pin: {
        type: String,
        required: true,
        trim: true
    },
    dateOfBirth: {
        type: String,
        required: true
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
    birthPlace: {
        type: String,
        required: true,
        trim: true
    },
    bloodGroup: {
        type: String,
        default: '',
        trim: true
    },
    dateOfToday: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true,
        trim: true
    },
    gender: {
        type: String,
        default: ''
    },
    religion: {
        type: String,
        default: ''
    },
    
    // File Information
    pdfFile: {
        type: String,
        default: null
    },
    pdfFileName: {
        type: String,
        default: null
    },
    nidPhoto: {
        type: String,
        required: true
    },
    nidPhotoType: {
        type: String,
        default: 'file'
    },
    nidPhotoFileName: {
        type: String,
        default: null
    },
    signature: {
        type: String,
        default: null
    },
    signatureType: {
        type: String,
        default: 'none'
    },
    signatureFileName: {
        type: String,
        default: null
    },
    
    // Extraction Information (from PDF)
    extractionId: {
        type: String,
        default: null
    },
    extractionData: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    extractedFromPdf: {
        type: Boolean,
        default: false
    },
    
    // Payment Information
    servicePrice: {
        type: Number,
        required: true,
        default: 200
    },
    transactionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction',
        default: null
    },
    paymentStatus: {
        type: String,
        default: 'paid'
    },
    
    // Order Status
    status: {
        type: String,
        default: 'pending'
    },
    adminNotes: {
        type: String,
        default: null
    },
    
    // Download Tracking
    downloadCount: {
        type: Number,
        default: 0
    },
    lastDownloadedAt: {
        type: Date,
        default: null
    },
    
    // Metadata
    ipAddress: {
        type: String,
        default: null
    },
    userAgent: {
        type: String,
        default: null
    },
    
    // API Response (if any)
    apiResponse: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    collection: 'autonidmakers'
});

// Create indexes for better query performance
autoNidMakerSchema.index({ userId: 1, createdAt: -1 });
autoNidMakerSchema.index({ receiptId: 1 });
autoNidMakerSchema.index({ nationalId: 1 });
autoNidMakerSchema.index({ status: 1 });
autoNidMakerSchema.index({ paymentStatus: 1 });

// Pre-save middleware to update updatedAt
autoNidMakerSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
});

// Method to increment download count
autoNidMakerSchema.methods.incrementDownload = async function() {
    this.downloadCount += 1;
    this.lastDownloadedAt = new Date();
    return this.save();
};

// Method to get safe response (without sensitive data)
autoNidMakerSchema.methods.toSafeResponse = function() {
    return {
        _id: this._id,
        receiptId: this.receiptId,
        nameBangla: this.nameBangla,
        nameEnglish: this.nameEnglish,
        nationalId: this.nationalId,
        pin: this.pin,
        dateOfBirth: this.dateOfBirth,
        fatherName: this.fatherName,
        motherName: this.motherName,
        birthPlace: this.birthPlace,
        bloodGroup: this.bloodGroup,
        dateOfToday: this.dateOfToday,
        address: this.address,
        gender: this.gender,
        religion: this.religion,
        nidPhotoType: this.nidPhotoType,
        signatureType: this.signatureType,
        hasPdfFile: !!this.pdfFile,
        servicePrice: this.servicePrice,
        status: this.status,
        downloadCount: this.downloadCount,
        lastDownloadedAt: this.lastDownloadedAt,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
    };
};

// Static method to get statistics for a user
autoNidMakerSchema.statics.getUserStatistics = async function(userId) {
    const stats = await this.aggregate([
        { $match: { userId: userId } },
        {
            $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalSpent: { $sum: '$servicePrice' },
                pendingOrders: {
                    $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
                },
                completedOrders: {
                    $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                },
                cancelledOrders: {
                    $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
                },
                totalDownloads: { $sum: '$downloadCount' }
            }
        }
    ]);
    
    return stats.length > 0 ? stats[0] : {
        totalOrders: 0,
        totalSpent: 0,
        pendingOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0,
        totalDownloads: 0
    };
};

const AutoNidMaker = mongoose.model('AutoNidMaker', autoNidMakerSchema);

module.exports = AutoNidMaker;