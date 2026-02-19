const mongoose = require('mongoose');

const socialMediaSchema = new mongoose.Schema({
  platform: {
    type: String,
    required: true,
    enum: ['facebook', 'whatsapp', 'youtube', 'telegram']
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const SocialMedia = mongoose.model('SocialMedia', socialMediaSchema);

module.exports = SocialMedia;