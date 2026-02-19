const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // User who will receive the notification
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Related order
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  
  // Order details for quick reference
  orderId: {
    type: String,
    required: true
  },
  
  // Service name from the order
  serviceName: {
    type: String,
    required: true
  },
  
  // Notification type based on order status changes
  type: {
    type: String,
    enum: [
      'order_created', 
      'order_processing', 
      'order_completed', 
      'order_cancelled', 
      'admin_submission', 
      'admin_notes',
      'system_notice',
      'general_notice'
    ],
    required: true
  },
  
  // Notification message
  message: {
    type: String,
    required: true
  },
  
  // Read status
  isRead: {
    type: Boolean,
    default: false
  },
  
  // Read timestamp
  readAt: Date,
  
  // Active status (for soft delete)
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Generate notification message based on type and order
notificationSchema.pre('save', function(next) {
  if (!this.message) {
    const messages = {
      'order_created': `Your order ${this.orderId} for "${this.serviceName}" has been placed successfully.`,
      'order_processing': `Order ${this.orderId} for "${this.serviceName}" is now being processed.`,
      'order_completed': `Order ${this.orderId} for "${this.serviceName}" has been completed.`,
      'order_cancelled': `Order ${this.orderId} for "${this.serviceName}" has been cancelled.`,
      'admin_submission': `Admin has submitted output for order ${this.orderId} (${this.serviceName}).`,
      'admin_notes': `Admin has added notes to order ${this.orderId} (${this.serviceName}).`,
      'system_notice': `System notice for your order ${this.orderId}`,
      'general_notice': 'New notice from the system'
    };
    this.message = messages[this.type] || `Update for order ${this.orderId} (${this.serviceName})`;
  }
});

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;