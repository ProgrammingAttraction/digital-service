const Notification = require("../models/Notification");
const { io, connectedUsers } = require("../index"); // Import from index.js

class NotificationService {
  // Send notification to a specific user
  static async sendNotification(userId, notificationData) {
    try {
      // Create notification in database
      const notification = new Notification({
        user: userId,
        order: notificationData.orderId,
        orderId: notificationData.orderId,
        serviceName: notificationData.serviceName,
        type: notificationData.type,
        message: notificationData.message,
        isRead: false,
        isActive: true
      });

      await notification.save();

      // Populate user info
      await notification.populate('user', 'fullname email');
      await notification.populate('order', 'orderId serviceName status totalAmount');

      // Emit notification via Socket.io
      const socketId = connectedUsers.get(userId.toString());
      if (socketId) {
        io.to(socketId).emit('new_notification', {
          type: 'new-notification',
          notification: {
            _id: notification._id,
            type: notification.type,
            message: notification.message,
            orderId: notification.orderId,
            serviceName: notification.serviceName,
            order: notification.order,
            isRead: notification.isRead,
            createdAt: notification.createdAt
          }
        });
        console.log(`Notification sent to user ${userId} via socket ${socketId}`);
      }

      return notification;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  // Send notification to multiple users (for admin broadcasts)
  static async broadcastNotification(userIds, notificationData) {
    try {
      const notifications = [];
      
      for (const userId of userIds) {
        const notification = await this.sendNotification(userId, notificationData);
        notifications.push(notification);
      }
      
      return notifications;
    } catch (error) {
      console.error('Error broadcasting notification:', error);
      throw error;
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        {
          _id: notificationId,
          user: userId
        },
        {
          isRead: true,
          readAt: new Date()
        },
        { new: true }
      ).populate('order', 'orderId serviceName status');

      if (notification) {
        // Emit read status via Socket.io
        const socketId = connectedUsers.get(userId.toString());
        if (socketId) {
          io.to(socketId).emit('notification_read', {
            type: 'notification-read',
            notificationId: notification._id,
            readAt: notification.readAt
          });
        }
      }

      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Delete notification
  static async deleteNotification(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        {
          _id: notificationId,
          user: userId
        },
        {
          isActive: false
        },
        { new: true }
      );

      if (notification) {
        // Emit delete event via Socket.io
        const socketId = connectedUsers.get(userId.toString());
        if (socketId) {
          io.to(socketId).emit('notification_deleted', {
            type: 'notification-deleted',
            notificationId: notification._id,
            wasUnread: !notification.isRead
          });
        }
      }

      return notification;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Get connected users (for debugging/admin)
  static getConnectedUsers() {
    return Array.from(connectedUsers.entries());
  }
}

module.exports = NotificationService;