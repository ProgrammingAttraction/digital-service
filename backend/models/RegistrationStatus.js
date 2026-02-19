const mongoose = require('mongoose');

const registrationStatusSchema = new mongoose.Schema({
    isActive: {
        type: Boolean,
        default: true,
        description: 'true = registration allowed, false = registration closed'
    },
    message: {
        type: String,
        default: 'Registration is currently closed. Please try again later.',
        trim: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Ensure only one document exists (singleton pattern)
registrationStatusSchema.statics.getStatus = async function() {
    let status = await this.findOne();
    if (!status) {
        status = await this.create({
            isActive: true,
            message: 'Registration is currently closed. Please try again later.'
        });
    }
    return status;
};

// Toggle registration status
registrationStatusSchema.statics.toggle = async function(adminId) {
    let status = await this.findOne();
    if (!status) {
        status = await this.create({
            isActive: true,
            message: 'Registration is currently closed. Please try again later.',
            updatedBy: adminId
        });
    } else {
        status.isActive = !status.isActive;
        status.updatedBy = adminId;
        status.updatedAt = new Date();
        await status.save();
    }
    return status;
};

// Update message only
registrationStatusSchema.statics.updateMessage = async function(message, adminId) {
    let status = await this.findOne();
    if (!status) {
        status = await this.create({
            isActive: true,
            message: message,
            updatedBy: adminId
        });
    } else {
        status.message = message;
        status.updatedBy = adminId;
        status.updatedAt = new Date();
        await status.save();
    }
    return status;
};

const RegistrationStatus = mongoose.model('RegistrationStatus', registrationStatusSchema);

module.exports = RegistrationStatus;