const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Menu name is required'],
        trim: true,
        unique: true
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: ['order', 'clone', 'auto', 'mobile', 'form', 'passport', 'other'],
        default: 'other'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    order: {
        type: Number,
        default: 0
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

// Indexes for better query performance
menuSchema.index({ name: 1 });
menuSchema.index({ category: 1 });
menuSchema.index({ isActive: 1 });
menuSchema.index({ order: 1 });

// Static method to get active menus by category
menuSchema.statics.getActiveMenusByCategory = function(category) {
    return this.find({ 
        isActive: true,
        category: category 
    }).sort({ order: 1, name: 1 });
};

// Static method to get all active menus
menuSchema.statics.getActiveMenus = function() {
    return this.find({ isActive: true }).sort({ order: 1, name: 1 });
};

// Static method to get all menus grouped by category
menuSchema.statics.getMenusByCategory = function() {
    return this.aggregate([
        {
            $group: {
                _id: '$category',
                menus: {
                    $push: {
                        _id: '$_id',
                        name: '$name',
                        isActive: '$isActive',
                        order: '$order',
                        createdAt: '$createdAt'
                    }
                },
                count: { $sum: 1 },
                activeCount: {
                    $sum: { $cond: ['$isActive', 1, 0] }
                }
            }
        },
        {
            $sort: { _id: 1 }
        }
    ]);
};

// Static method for bulk status update
menuSchema.statics.bulkUpdateStatus = function(ids, isActive) {
    return this.updateMany(
        { _id: { $in: ids } },
        { 
            $set: { 
                isActive: isActive,
                updatedAt: Date.now()
            }
        }
    );
};

// Static method for bulk delete
menuSchema.statics.bulkDelete = function(ids) {
    return this.deleteMany({ _id: { $in: ids } });
};

// Static method for bulk order update
menuSchema.statics.bulkUpdateOrder = function(orderUpdates) {
    const bulkOps = orderUpdates.map(update => ({
        updateOne: {
            filter: { _id: update.id },
            update: { 
                $set: { 
                    order: update.order,
                    updatedAt: Date.now()
                }
            }
        }
    }));
    
    return this.bulkWrite(bulkOps);
};

// Pre-save middleware to update updatedAt
menuSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
});

const Menu = mongoose.model('Menu', menuSchema);

module.exports = Menu;