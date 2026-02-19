const mongoose = require('mongoose');

const depositSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    depositMethod: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DepositMethod',
    },
    accountNumber: {
        type: String,
        required: true,
        trim: true
    },
    transactionId: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    bonusAmount: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        default: 'pending'
    },
    statusChangedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    statusChangedAt: {
        type: Date
    },
    adminNotes: {
        type: String,
        trim: true
    },
    userNotes: {
        type: String,
        trim: true
    },
    screenshot: {
        type: String // URL to uploaded screenshot
    },
    depositMethodDetails: {
        // Store snapshot of deposit method at the time of deposit
        name: String,
        agentNumber: String,
        minimumDeposit: Number,
        maximumDeposit: Number
    }
}, {
    timestamps: true
});

// Indexes for better query performance
depositSchema.index({ user: 1, createdAt: -1 });
depositSchema.index({ status: 1 });
depositSchema.index({ transactionId: 1 }, { unique: true });
depositSchema.index({ createdAt: -1 });

// Virtual for total amount (deposit + bonus)
depositSchema.virtual('totalAmount').get(function() {
    return this.amount + this.bonusAmount;
});

// Middleware to save deposit method details before saving
depositSchema.pre('save', async function(next) {
    if (this.isNew) {
        try {
            const DepositMethod = mongoose.model('DepositMethod');
            const method = await DepositMethod.findById(this.depositMethod);
            
            if (method) {
                this.depositMethodDetails = {
                    name: method.name,
                    agentNumber: method.agentNumber,
                    minimumDeposit: method.minimumDeposit,
                    maximumDeposit: method.maximumDeposit
                };
            }
        } catch (error) {
            console.error('Error fetching deposit method details:', error);
        }
    }
});

const Deposit = mongoose.model('Deposit', depositSchema);

module.exports = Deposit;