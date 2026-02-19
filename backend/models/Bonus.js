const mongoose = require('mongoose');

const bonusSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Bonus title is required'],
        trim: true
    },
    minimumDeposit: {
        type: Number,
        required: [true, 'Minimum deposit amount is required'],
        min: [0, 'Minimum deposit cannot be negative']
    },
    bonusAmount: {
        type: Number,
        required: [true, 'Bonus amount is required'],
        min: [0, 'Bonus amount cannot be negative']
    },
    description: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
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
});

// Update timestamp before saving
bonusSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
});

const Bonus = mongoose.model('Bonus', bonusSchema);

module.exports = Bonus;