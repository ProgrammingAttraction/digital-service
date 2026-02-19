const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  serviceName: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true
  },
  notice: {
    type: String,
    required: [true, 'Notice text is required'],
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
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

// Index for better search performance
noticeSchema.index({ serviceName: 'text', notice: 'text' });

// Static method to get active notices
noticeSchema.statics.getActiveNotices = function() {
  return this.find({ isActive: true }).sort({ serviceName: 1 });
};

// Static method for bulk update
noticeSchema.statics.bulkUpdate = function(notices) {
  const bulkOps = notices.map(notice => ({
    updateOne: {
      filter: { _id: notice.id },
      update: { $set: notice.updateData }
    }
  }));
  return this.bulkWrite(bulkOps);
};

const Notice = mongoose.model('Notice', noticeSchema);

module.exports = Notice;