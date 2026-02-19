const mongoose = require('mongoose');

const websiteStatusSchema = new mongoose.Schema({
    isActive: {
        type: Boolean,
        default: true,
        required: true
    },
    message: {
        type: String,
        default: 'Website is under maintenance. Please check back later.',
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
});

// Ensure only one document exists
websiteStatusSchema.statics.getStatus = async function() {
    let status = await this.findOne();
    if (!status) {
        status = await this.create({ isActive: true });
    }
    return status;
};

module.exports = mongoose.model('WebsiteStatus', websiteStatusSchema);