const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    orderId: {
        type: String,
        required: true
    },
    paymentId: {
        type: String,
        required: true,
        unique: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'BDT'
    },
    status: {
        type: String,
        enum: ['initiated', 'pending', 'completed', 'failed', 'cancelled'],
        default: 'initiated'
    },
    paymentMethod: {
        type: String,
        default: 'bkash'
    },
    serviceType: {
        type: String,
        enum: ['deposit', 'order', 'service'],
        default: 'deposit'
    },
    transactionId: {
        type: String
    },
    bkashData: {
        type: Object,
        default: {}
    },
    completedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Create indexes
paymentSchema.index({ user: 1, status: 1 });
paymentSchema.index({ paymentId: 1 }, { unique: true });
paymentSchema.index({ orderId: 1 });
paymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);