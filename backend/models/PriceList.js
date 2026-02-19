const mongoose = require("mongoose");

const priceListSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Service name is required"],
        trim: true
    },
    price: {
        type: Number,
        default: 0,
        min: [0, "Price cannot be negative"]
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Create indexes
priceListSchema.index({ name: 1 });
priceListSchema.index({ isActive: 1 });

// Static methods
priceListSchema.statics.getActiveServices = function() {
    return this.find({ isActive: true }).sort({ name: 1 });
};

priceListSchema.statics.bulkUpdatePrices = async function(priceUpdates) {
    const bulkOps = priceUpdates.map(update => ({
        updateOne: {
            filter: { _id: update.id },
            update: { 
                price: update.price,
                updatedAt: new Date()
            }
        }
    }));
    
    return this.bulkWrite(bulkOps);
};

const PriceList = mongoose.model("PriceList", priceListSchema);

module.exports = PriceList;