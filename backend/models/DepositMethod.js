const mongoose = require('mongoose');

const depositMethodSchema = new mongoose.Schema({
    image: {
        type: String,
        required: [true, 'image is required'],
        default: null
    },
    name: {
        type: String,
        required: [true, 'Deposit method name is required'],
        trim: true,
        unique: true
    },
    description: {
        type: String,
        trim: true
    },
    accountType: {
        type: String,
        required: [true, 'Account type is required'],
        trim: true,
        default: 'agent'
    },
    agentNumber: {
        type: String,
        required: [true, 'Agent number is required'],
        trim: true
    },
    minimumDeposit: {
        type: Number,
        required: [true, 'Minimum deposit amount is required'],
        min: [0, 'Minimum deposit cannot be negative']
    },
    maximumDeposit: {
        type: Number,
        required: [true, 'Maximum deposit amount is required'],
        min: [0, 'Maximum deposit cannot be negative'],
        validate: {
            validator: function(value) {
                // When creating new document
                if (this.minimumDeposit !== undefined) {
                    return value >= this.minimumDeposit;
                }
                return true;
            },
            message: 'Maximum deposit must be greater than or equal to minimum deposit'
        }
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'maintenance'],
        default: 'active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Custom validator for update operations
depositMethodSchema.pre('findOneAndUpdate', async function(next) {
    const update = this.getUpdate();
    
    // If maximumDeposit is being updated, check if it's valid
    if (update.$set && update.$set.maximumDeposit !== undefined) {
        // Get the current document to check minimumDeposit
        const docToUpdate = await this.model.findOne(this.getQuery());
        
        if (docToUpdate) {
            // Check if maximumDeposit is less than current minimumDeposit
            const minDeposit = update.$set.minimumDeposit !== undefined 
                ? update.$set.minimumDeposit 
                : docToUpdate.minimumDeposit;
            
            if (update.$set.maximumDeposit < minDeposit) {
                const error = new Error('Maximum deposit must be greater than or equal to minimum deposit');
                error.name = 'ValidationError';
                return next(error);
            }
        }
    }
    
    // If accountType is being updated, ensure it's a valid value
    if (update.$set && update.$set.accountType !== undefined) {
        const validAccountTypes = ['agent', 'personal', 'business', 'merchant', 'corporate'];
        if (!validAccountTypes.includes(update.$set.accountType)) {
            const error = new Error(`${update.$set.accountType} is not a valid account type`);
            error.name = 'ValidationError';
            return next(error);
        }
    }
});

// Update the updatedAt field before saving
depositMethodSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
});

// Static method to get active deposit methods
depositMethodSchema.statics.getActiveMethods = function() {
    return this.find({ status: 'active' })
        .sort({ name: 1 });
};

// Static method to get deposit methods by account type
depositMethodSchema.statics.getMethodsByAccountType = function(accountType) {
    return this.find({ 
        status: 'active',
        accountType: accountType 
    }).sort({ name: 1 });
};

// Instance method to check if amount is within limits
depositMethodSchema.methods.isAmountValid = function(amount) {
    return amount >= this.minimumDeposit && amount <= this.maximumDeposit;
};

// Instance method to get account type details
depositMethodSchema.methods.getAccountTypeDetails = function() {
    const accountTypes = {
        'agent': {
            name: 'Agent Account',
            description: 'For registered agents or representatives'
        },
        'personal': {
            name: 'Personal Account',
            description: 'For individual users'
        },
        'business': {
            name: 'Business Account',
            description: 'For small to medium businesses'
        },
        'merchant': {
            name: 'Merchant Account',
            description: 'For commercial merchants'
        },
        'corporate': {
            name: 'Corporate Account',
            description: 'For large corporations'
        }
    };
    
    return accountTypes[this.accountType] || { name: 'Unknown', description: 'No description available' };
};

const DepositMethod = mongoose.model('DepositMethod', depositMethodSchema);

module.exports = DepositMethod;