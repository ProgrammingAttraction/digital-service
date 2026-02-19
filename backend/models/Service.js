const mongoose = require('mongoose');

const fieldNameSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Field name is required'],
        trim: true
    },
    placeholder: {
        type: String,
        required: [true, 'Field placeholder is required'],
        trim: true
    }
}, { _id: false });

const serviceSchema = new mongoose.Schema({
    workName: {
        type: String,
        required: [true, 'Work name is required'],
        trim: true
    },
    workNameEnglish: {
        type: String,
        required: [true, 'Work name in English is required'],
        trim: true
    },
    workRate: {
        type: Number,
        required: [true, 'Work rate is required'],
        min: [0, 'Work rate cannot be negative']
    },
    workType: {
        type: String,
        required: [true, 'Work type is required'],
        trim: true,
    },
    workStatus: {
        type: String,
        required: [true, 'Work status is required'],
        trim: true,
        default: 'active'
    },
    fieldNames: {
        type: [fieldNameSchema],
        required: [true, 'At least one field name is required'],
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    order: {
        type: Number,
        default: 0,
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

// Update the updatedAt field before saving
serviceSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
});

// Static method to get active services
serviceSchema.statics.getActiveServices = function() {
    return this.find({ workStatus: 'active' }).sort({ order: 1, createdAt: -1 });
};

// Static method to get featured services
serviceSchema.statics.getFeaturedServices = function() {
    return this.find({ workStatus: 'active', isFeatured: true }).sort({ order: 1, createdAt: -1 });
};

// Static method to get service by ID with populated field names
serviceSchema.statics.getServiceById = function(id) {
    return this.findById(id);
};

// Static method to get services by type
serviceSchema.statics.getServicesByType = function(workType, status = 'active') {
    const filter = { workType };
    if (status) filter.workStatus = status;
    return this.find(filter).sort({ order: 1, createdAt: -1 });
};

const Service = mongoose.model('Service', serviceSchema);

module.exports = Service;