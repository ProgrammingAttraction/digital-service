const mongoose = require('mongoose');

const autoMethodSchema = new mongoose.Schema({
    status: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Ensure only one document exists
autoMethodSchema.statics.getSettings = async function() {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({ status: false });
    }
    return settings;
};

module.exports = mongoose.model('AutoMethod', autoMethodSchema);