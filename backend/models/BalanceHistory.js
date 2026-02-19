const mongoose = require('mongoose');

const balanceHistorySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    },
    type: {
        type: String,
        enum: ['add', 'subtract', 'adjustment', 'refund', 'purchase', 'withdrawal'],
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    oldBalance: {
        type: Number,
        required: true,
        default: 0
    },
    newBalance: {
        type: Number,
        required: true,
        default: 0
    },
    transactionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction'
    },
    notes: {
        type: String,
        trim: true
    },
    ipAddress: String,
    userAgent: String,
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better query performance
balanceHistorySchema.index({ user: 1, createdAt: -1 });
balanceHistorySchema.index({ admin: 1 });
balanceHistorySchema.index({ type: 1 });
balanceHistorySchema.index({ createdAt: -1 });

// Virtual for balance change (positive for add, negative for subtract)
balanceHistorySchema.virtual('balanceChange').get(function() {
    return this.type === 'add' ? this.amount : -this.amount;
});

const BalanceHistory = mongoose.model('BalanceHistory', balanceHistorySchema);

module.exports = BalanceHistory;