const express = require("express");
const Subadminroute = express.Router();
const Admin = require("../models/Admin"); // Adjust path as needed
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require("../models/User");
const jwt=require("jsonwebtoken");
const DepositMethod = require("../models/DepositMethod");
const Service = require("../models/Service");
// Middleware for authentication
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Bonus = require("../models/Bonus");
const Order = require("../models/Order");
const PriceList=require("../models/PriceList")
// ==================== MULTER CONFIGURATION FOR IMAGE UPLOAD ====================

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../public/uploads/deposit-methods');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Create unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'deposit-method-' + uniqueSuffix + ext);
    }
});

// File filter to allow only images
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|svg|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
};

// Configure multer upload
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: fileFilter
});


const authenticateAdmin = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                success: false,
                error: 'Access denied. No token provided.' 
            });
        }
        
        const token = authHeader.split(' ')[1];
        
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.admin = decoded;
        
        // Check if admin exists
        const admin = await SubAdmin.findById(req.admin.id);
        if (!admin) {
            return res.status(401).json({ 
                success: false,
                error: 'Admin not found or invalid token.' 
            });
        }
        
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                success: false,
                error: 'Invalid token.' 
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false,
                error: 'Token expired.' 
            });
        }
        res.status(401).json({ 
            success: false,
            error: 'Authentication failed.' 
        });
    }
};
// Helper function to delete old image file
const deleteOldImage = async (imagePath) => {
    if (imagePath) {
        const fullPath = path.join(__dirname, '..', imagePath);
        try {
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
                console.log(`Deleted old image: ${fullPath}`);
            }
        } catch (error) {
            console.error('Error deleting old image:', error);
            // Don't fail the request if image deletion fails
        }
    }
};
// Middleware for authorization based on role
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.admin || !allowedRoles.includes(req.admin.role)) {
            return res.status(403).json({ 
                success: false,
                error: 'Forbidden. You do not have permission to perform this action.' 
            });
        }
        next();
    };
};

// ==================== DASHBOARD OVERVIEW ROUTE ====================

// GET dashboard overview with total history
Subadminroute.get('/dashboard/overview', authenticateAdmin, async (req, res) => {
    try {
        // Get today's date for filtering
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // Get this week's date range
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - today.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        
        // Get this month's date range
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        // Get current date for display
        const currentDate = new Date();
        const formattedDate = currentDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // ========== 1. USERS STATISTICS ==========
        const userStats = await User.aggregate([
            {
                $group: {
                    _id: null,
                    totalUsers: { $sum: 1 },
                    totalBalance: { $sum: "$balance" },
                    totalDeposit: { $sum: "$totaldeposit" },
                    activeUsers: { 
                        $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } 
                    },
                    pendingUsers: { 
                        $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } 
                    },
                    suspendedUsers: { 
                        $sum: { $cond: [{ $eq: ["$status", "suspended"] }, 1, 0] } 
                    },
                    verifiedUsers: { 
                        $sum: { $cond: ["$emailverified", 1, 0] } 
                    }
                }
            }
        ]);

        // Recent users (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentUsers = await User.countDocuments({
            createdAt: { $gte: sevenDaysAgo }
        });

        // New users today
        const newUsersToday = await User.countDocuments({
            createdAt: { $gte: today, $lt: tomorrow }
        });

        // ========== 2. DEPOSIT STATISTICS ==========
        const depositStats = await Deposit.aggregate([
            {
                $group: {
                    _id: null,
                    totalDeposits: { $sum: 1 },
                    totalAmount: { $sum: '$amount' },
                    totalBonus: { $sum: '$bonusAmount' },
                    approvedDeposits: { 
                        $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } 
                    },
                    approvedAmount: { 
                        $sum: { $cond: [{ $eq: ['$status', 'approved'] }, '$amount', 0] } 
                    },
                    approvedBonus: { 
                        $sum: { $cond: [{ $eq: ['$status', 'approved'] }, '$bonusAmount', 0] } 
                    },
                    pendingDeposits: { 
                        $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } 
                    },
                    pendingAmount: { 
                        $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] } 
                    },
                    rejectedDeposits: { 
                        $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } 
                    }
                }
            }
        ]);

        // Today's deposits
        const todayDeposits = await Deposit.aggregate([
            {
                $match: {
                    createdAt: { $gte: today, $lt: tomorrow },
                    status: 'approved'
                }
            },
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 },
                    amount: { $sum: '$amount' },
                    bonus: { $sum: '$bonusAmount' }
                }
            }
        ]);

        // Weekly deposits
        const weeklyDeposits = await Deposit.aggregate([
            {
                $match: {
                    createdAt: { $gte: weekStart, $lt: weekEnd },
                    status: 'approved'
                }
            },
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 },
                    amount: { $sum: '$amount' },
                    bonus: { $sum: '$bonusAmount' }
                }
            }
        ]);

        // Monthly deposits
        const monthlyDeposits = await Deposit.aggregate([
            {
                $match: {
                    createdAt: { $gte: monthStart, $lt: monthEnd },
                    status: 'approved'
                }
            },
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 },
                    amount: { $sum: '$amount' },
                    bonus: { $sum: '$bonusAmount' }
                }
            }
        ]);

        // ========== 3. ORDER STATISTICS ==========
        const orderStats = await Order.aggregate([
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalAmount: { $sum: '$totalAmount' },
                    completedOrders: { 
                        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } 
                    },
                    completedAmount: { 
                        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$totalAmount', 0] } 
                    },
                    pendingOrders: { 
                        $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } 
                    },
                    pendingAmount: { 
                        $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$totalAmount', 0] } 
                    },
                    processingOrders: { 
                        $sum: { $cond: [{ $eq: ['$status', 'processing'] }, 1, 0] } 
                    },
                    processingAmount: { 
                        $sum: { $cond: [{ $eq: ['$status', 'processing'] }, '$totalAmount', 0] } 
                    },
                    cancelledOrders: { 
                        $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } 
                    }
                }
            }
        ]);

        // Today's orders
        const todayOrders = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: today, $lt: tomorrow }
                }
            },
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 },
                    amount: { $sum: '$totalAmount' }
                }
            }
        ]);

        // Weekly orders
        const weeklyOrders = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: weekStart, $lt: weekEnd }
                }
            },
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 },
                    amount: { $sum: '$totalAmount' }
                }
            }
        ]);

        // Monthly orders
        const monthlyOrders = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: monthStart, $lt: monthEnd }
                }
            },
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 },
                    amount: { $sum: '$totalAmount' }
                }
            }
        ]);

        // ========== 4. SERVICE STATISTICS ==========
        const serviceStats = await Service.aggregate([
            {
                $group: {
                    _id: null,
                    totalServices: { $sum: 1 },
                    activeServices: { 
                        $sum: { $cond: [{ $eq: ["$workStatus", "active"] }, 1, 0] } 
                    },
                    inactiveServices: { 
                        $sum: { $cond: [{ $eq: ["$workStatus", "inactive"] }, 1, 0] } 
                    },
                    featuredServices: { 
                        $sum: { $cond: ["$isFeatured", 1, 0] } 
                    },
                    totalWorkRate: { $sum: "$workRate" },
                    avgWorkRate: { $avg: "$workRate" }
                }
            }
        ]);

        // ========== 5. BONUS STATISTICS ==========
        const bonusStats = await Bonus.aggregate([
            {
                $group: {
                    _id: null,
                    totalBonuses: { $sum: 1 },
                    activeBonuses: { 
                        $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } 
                    },
                    inactiveBonuses: { 
                        $sum: { $cond: [{ $eq: ["$status", "inactive"] }, 1, 0] } 
                    },
                    totalBonusAmount: { $sum: "$bonusAmount" },
                    totalMinimumDeposit: { $sum: "$minimumDeposit" }
                }
            }
        ]);

        // ========== 6. DEPOSIT METHOD STATISTICS ==========
        const depositMethodStats = await DepositMethod.aggregate([
            {
                $group: {
                    _id: null,
                    totalMethods: { $sum: 1 },
                    activeMethods: { 
                        $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } 
                    },
                    inactiveMethods: { 
                        $sum: { $cond: [{ $eq: ["$status", "inactive"] }, 1, 0] } 
                    }
                }
            }
        ]);

        // ========== 7. RECENT ACTIVITY ==========
        // Recent deposits (last 5)
        const recentDeposits = await Deposit.find()
            .populate('user', 'fullname email')
            .populate('depositMethod', 'name')
            .sort({ createdAt: -1 })
            .limit(5);

        // Recent orders (last 5)
        const recentOrders = await Order.find()
            .populate('user', 'fullname email')
            .populate('service', 'workName')
            .sort({ createdAt: -1 })
            .limit(5);

        // Recent users (last 5)
        const recentUsersList = await User.find()
            .select('fullname email whatsappnumber createdAt status balance')
            .sort({ createdAt: -1 })
            .limit(5);

        // ========== 8. SYSTEM TOTALS ==========
        const systemTotals = {
            totalRevenue: (orderStats[0]?.completedAmount || 0) + (depositStats[0]?.approvedAmount || 0),
            totalTransactions: (orderStats[0]?.totalOrders || 0) + (depositStats[0]?.totalDeposits || 0),
            totalClients: userStats[0]?.totalUsers || 0,
            averageOrderValue: orderStats[0]?.totalOrders > 0 ? 
                (orderStats[0]?.totalAmount / orderStats[0]?.totalOrders).toFixed(2) : 0,
            averageDepositValue: depositStats[0]?.totalDeposits > 0 ? 
                (depositStats[0]?.totalAmount / depositStats[0]?.totalDeposits).toFixed(2) : 0
        };

        // ========== 9. STATUS BREAKDOWN ==========
        // Orders by status
        const orderStatusBreakdown = await Order.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    amount: { $sum: '$totalAmount' }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        // Deposits by status
        const depositStatusBreakdown = await Deposit.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    amount: { $sum: '$amount' }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        // Users by status
        const userStatusBreakdown = await User.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        // ========== PREPARE RESPONSE ==========
        const response = {
            success: true,
            data: {
                // Current date and time
                currentDate: formattedDate,
                timestamp: currentDate,
                
                // Users Overview
                users: {
                    total: userStats[0]?.totalUsers || 0,
                    active: userStats[0]?.activeUsers || 0,
                    pending: userStats[0]?.pendingUsers || 0,
                    suspended: userStats[0]?.suspendedUsers || 0,
                    verified: userStats[0]?.verifiedUsers || 0,
                    totalBalance: userStats[0]?.totalBalance || 0,
                    totalDeposit: userStats[0]?.totalDeposit || 0,
                    recentUsers: recentUsers,
                    newUsersToday: newUsersToday,
                    breakdown: userStatusBreakdown
                },
                
                // Deposits Overview
                deposits: {
                    total: depositStats[0]?.totalDeposits || 0,
                    totalAmount: depositStats[0]?.totalAmount || 0,
                    totalBonus: depositStats[0]?.totalBonus || 0,
                    approved: {
                        count: depositStats[0]?.approvedDeposits || 0,
                        amount: depositStats[0]?.approvedAmount || 0,
                        bonus: depositStats[0]?.approvedBonus || 0
                    },
                    pending: {
                        count: depositStats[0]?.pendingDeposits || 0,
                        amount: depositStats[0]?.pendingAmount || 0
                    },
                    rejected: depositStats[0]?.rejectedDeposits || 0,
                    today: todayDeposits[0] || { count: 0, amount: 0, bonus: 0 },
                    weekly: weeklyDeposits[0] || { count: 0, amount: 0, bonus: 0 },
                    monthly: monthlyDeposits[0] || { count: 0, amount: 0, bonus: 0 },
                    breakdown: depositStatusBreakdown
                },
                
                // Orders Overview
                orders: {
                    total: orderStats[0]?.totalOrders || 0,
                    totalAmount: orderStats[0]?.totalAmount || 0,
                    completed: {
                        count: orderStats[0]?.completedOrders || 0,
                        amount: orderStats[0]?.completedAmount || 0
                    },
                    pending: {
                        count: orderStats[0]?.pendingOrders || 0,
                        amount: orderStats[0]?.pendingAmount || 0
                    },
                    processing: {
                        count: orderStats[0]?.processingOrders || 0,
                        amount: orderStats[0]?.processingAmount || 0
                    },
                    cancelled: orderStats[0]?.cancelledOrders || 0,
                    today: todayOrders[0] || { count: 0, amount: 0 },
                    weekly: weeklyOrders[0] || { count: 0, amount: 0 },
                    monthly: monthlyOrders[0] || { count: 0, amount: 0 },
                    breakdown: orderStatusBreakdown
                },
                
                // Services Overview
                services: {
                    total: serviceStats[0]?.totalServices || 0,
                    active: serviceStats[0]?.activeServices || 0,
                    inactive: serviceStats[0]?.inactiveServices || 0,
                    featured: serviceStats[0]?.featuredServices || 0,
                    totalWorkRate: serviceStats[0]?.totalWorkRate || 0,
                    avgWorkRate: serviceStats[0]?.avgWorkRate || 0
                },
                
                // Bonuses Overview
                bonuses: {
                    total: bonusStats[0]?.totalBonuses || 0,
                    active: bonusStats[0]?.activeBonuses || 0,
                    inactive: bonusStats[0]?.inactiveBonuses || 0,
                    totalBonusAmount: bonusStats[0]?.totalBonusAmount || 0,
                    totalMinimumDeposit: bonusStats[0]?.totalMinimumDeposit || 0
                },
                
                // Deposit Methods Overview
                depositMethods: {
                    total: depositMethodStats[0]?.totalMethods || 0,
                    active: depositMethodStats[0]?.activeMethods || 0,
                    inactive: depositMethodStats[0]?.inactiveMethods || 0
                },
                
                // Recent Activity
                recentActivity: {
                    deposits: recentDeposits,
                    orders: recentOrders,
                    users: recentUsersList
                },
                
                // System Totals
                systemTotals: systemTotals,
                
                // Quick Stats for Dashboard Cards
                quickStats: {
                    totalPendingDeposits: depositStats[0]?.pendingDeposits || 0,
                    totalPendingOrders: orderStats[0]?.pendingOrders || 0,
                    totalProcessingOrders: orderStats[0]?.processingOrders || 0,
                    pendingActions: (depositStats[0]?.pendingDeposits || 0) + 
                                  (orderStats[0]?.pendingOrders || 0) + 
                                  (orderStats[0]?.processingOrders || 0),
                    revenueToday: todayOrders[0]?.amount || 0,
                    depositsToday: todayDeposits[0]?.amount || 0
                }
            }
        };

        res.json(response);

    } catch (error) {
        console.error('Dashboard overview error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while fetching dashboard data',
            details: error.message 
        });
    }
});
// GET admin profile (authenticated admin can view their own profile)
Subadminroute.get('/profile', authenticateAdmin, async (req, res) => {
    try {
        const admin = await SubAdmin.findById(req.admin.id || req.admin._id)
            .select('-password -__v');
        
        if (!admin) {
            return res.status(404).json({ error: 'Admin not found' });
        }
        
        res.json({
            success: true,
            data: admin
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// UPDATE password (authenticated admin can update their own password)
Subadminroute.put('/update-password', authenticateAdmin, async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        const adminId = req.admin.id || req.admin._id;
        
        // Validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ 
                error: 'Current password, new password, and confirm password are required' 
            });
        }
        
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ 
                error: 'New password and confirm password do not match' 
            });
        }
        
        if (newPassword.length < 6) {
            return res.status(400).json({ 
                error: 'New password must be at least 6 characters long' 
            });
        }
        
        // Find admin
        const admin = await SubAdmin.findById(adminId);
        if (!admin) {
            return res.status(404).json({ error: 'Admin not found' });
        }
        
        // Verify current password
        const isPasswordValid = await admin.comparePassword(currentPassword);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }
        
        // Check if new password is same as current
        const isSamePassword = await admin.comparePassword(newPassword);
        if (isSamePassword) {
            return res.status(400).json({ 
                error: 'New password must be different from current password' 
            });
        }
        
        // Update password
        admin.password = newPassword;
        await admin.save();
        
        res.json({
            success: true,
            message: 'Password updated successfully'
        });
    } catch (error) {
        console.error('Update password error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// UPDATE admin profile (authenticated admin can update their own profile)
Subadminroute.put('/profile', authenticateAdmin, async (req, res) => {
    try {
        const { username, email } = req.body;
        const adminId = req.admin.id || req.admin._id;
        
        const updateData = {};
        if (username) updateData.username = username;
        if (email) updateData.email = email;
        
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ 
                error: 'No data provided for update' 
            });
        }
        
        // Check if email already exists (if updating email)
        if (email) {
            const existingAdmin = await SubAdmin.findOne({ 
                email, 
                _id: { $ne: adminId } 
            });
            if (existingAdmin) {
                return res.status(400).json({ 
                    error: 'Email already exists' 
                });
            }
        }
        
        const updatedAdmin = await SubAdmin.findByIdAndUpdate(
            adminId,
            updateData,
            { new: true, runValidators: true }
        ).select('-password -__v');
        
        if (!updatedAdmin) {
            return res.status(404).json({ error: 'Admin not found' });
        }
        
        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: updatedAdmin
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// UPDATE admin by ID (superadmin can update other admins)
Subadminroute.put('/:id', authenticateAdmin, authorizeRoles('superadmin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { username, email, role, isActive } = req.body;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid admin ID' });
        }
        
        const updateData = {};
        if (username) updateData.username = username;
        if (email) updateData.email = email;
        if (role) updateData.role = role;
        if (isActive !== undefined) updateData.isActive = isActive;
        
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ 
                error: 'No data provided for update' 
            });
        }
        
        // Check if email already exists (if updating email)
        if (email) {
            const existingAdmin = await SubAdmin.findOne({ 
                email, 
                _id: { $ne: id } 
            });
            if (existingAdmin) {
                return res.status(400).json({ 
                    error: 'Email already exists' 
                });
            }
        }
        
        const updatedAdmin = await SubAdmin.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password -__v');
        
        if (!updatedAdmin) {
            return res.status(404).json({ error: 'Admin not found' });
        }
        
        res.json({
            success: true,
            message: 'Admin updated successfully',
            data: updatedAdmin
        });
    } catch (error) {
        console.error('Update admin error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// FORGOT/RESET password endpoint (if needed)
Subadminroute.post('/reset-password', async (req, res) => {
    try {
        const { email, newPassword, confirmPassword, resetToken } = req.body;
        
        // This is a basic structure - you should implement proper reset token logic
        // Usually involves sending email with reset link containing token
        
        if (!email || !newPassword || !confirmPassword) {
            return res.status(400).json({ 
                error: 'Email, new password, and confirm password are required' 
            });
        }
        
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ 
                error: 'Passwords do not match' 
            });
        }
        
        const admin = await SubAdmin.findOne({ email });
        if (!admin) {
            return res.status(404).json({ error: 'Admin not found with this email' });
        }
        
        // Verify reset token here (you need to implement token storage/validation)
        // if (!validateResetToken(admin, resetToken)) {
        //     return res.status(401).json({ error: 'Invalid or expired reset token' });
        // }
        
        admin.password = newPassword;
        await admin.save();
        
        res.json({
            success: true,
            message: 'Password reset successfully'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ==================== USER MANAGEMENT ROUTES ====================

// GET all users (with filtering, pagination, and sorting)
Subadminroute.get('/users', authenticateAdmin,async (req, res) => {
    try {
        // Execute query with pagination
        const users = await User.find()
            .sort({createdAt:-1})
        res.json({
            success: true,
            data: users,
        });
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while fetching users' 
        });
    }
});
Subadminroute.get('/active-users', authenticateAdmin,async (req, res) => {
    try {
        // Execute query with pagination
        const users = await User.find({status:"active"})
            .sort({createdAt:-1})
        res.json({
            success: true,
            data: users,
        });
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while fetching users' 
        });
    }
});
Subadminroute.get('/inactive-users', authenticateAdmin,async (req, res) => {
    try {
        // Execute query with pagination
        const users = await User.find({status:"inactive"})
            .sort({createdAt:-1})
        res.json({
            success: true,
            data: users,
        });
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while fetching users' 
        });
    }
});
// GET single user by ID
Subadminroute.get('/users/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid user ID' 
            });
        }
        
        const user = await User.findById(id)
            .select('-password -__v -emailVerificationOTP -emailVerificationExpiry -otp -otpExpiry');
        
        if (!user) {
            return res.status(404).json({ 
                success: false,
                error: 'User not found' 
            });
        }
        
        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Get user by ID error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error' 
        });
    }
});

// CREATE new user (admin can create users)
Subadminroute.post('/users', authenticateAdmin,async (req, res) => {
    try {
        const { 
            fullname, 
            email, 
            password, 
            whatsappnumber, 
            status,
            balance,
            totaldeposit,
            emailverified
        } = req.body;
        
        // Validation
        if (!fullname || !email || !password || !whatsappnumber) {
            return res.status(400).json({ 
                success: false,
                error: 'Fullname, email, password, and whatsapp number are required' 
            });
        }
        
        // Check if user already exists
        const existingUser = await User.findOne({ 
            $or: [
                { email: email.toLowerCase() },
                { whatsappnumber }
            ]
        });
        
        if (existingUser) {
            return res.status(400).json({ 
                success: false,
                error: 'User with this email or whatsapp number already exists' 
            });
        }
        
        // Create new user
        const userData = {
            fullname,
            email: email.toLowerCase(),
            password,
            whatsappnumber,
            emailverified: emailverified || false,
            status: status || (emailverified ? 'active' : 'pending')
        };
        
        // Add optional fields if provided
        if (balance !== undefined) userData.balance = Number(balance);
        if (totaldeposit !== undefined) userData.totaldeposit = Number(totaldeposit);
        
        const newUser = new User(userData);
        await newUser.save();
        
        // Remove sensitive data from response
        const userResponse = newUser.toObject();
        delete userResponse.password;
        delete userResponse.__v;
        delete userResponse.emailVerificationOTP;
        delete userResponse.emailVerificationExpiry;
        delete userResponse.otp;
        delete userResponse.otpExpiry;
        
        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: userResponse
        });
    } catch (error) {
        console.error('Create user error:', error);
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ 
                success: false,
                error: 'Validation failed',
                details: errors 
            });
        }
        
        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({ 
                success: false,
                error: 'Email already exists' 
            });
        }
        
        res.status(500).json({ 
            success: false,
            error: 'Server error while creating user' 
        });
    }
});

// UPDATE user by ID
Subadminroute.put('/users/:id', authenticateAdmin,async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            fullname, 
            email, 
            whatsappnumber, 
            status,
            balance,
            totaldeposit,
            emailverified,
            profile
        } = req.body;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid user ID' 
            });
        }
        
        // Check if user exists
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ 
                success: false,
                error: 'User not found' 
            });
        }
        
        // Build update object
        const updateData = {};
        if (fullname) updateData.fullname = fullname;
        if (email) updateData.email = email.toLowerCase();
        if (whatsappnumber) updateData.whatsappnumber = whatsappnumber;
        if (status && ['active', 'inactive', 'suspended', 'pending'].includes(status)) {
            updateData.status = status;
        }
        if (balance !== undefined) updateData.balance = Number(balance);
        if (totaldeposit !== undefined) updateData.totaldeposit = Number(totaldeposit);
        if (emailverified !== undefined) updateData.emailverified = emailverified;
        if (profile) updateData.profile = profile;
        
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ 
                success: false,
                error: 'No data provided for update' 
            });
        }
        
        // Check for duplicate email or whatsapp number
        if (email || whatsappnumber) {
            const duplicateFilter = { _id: { $ne: id } };
            const orConditions = [];
            
            if (email) orConditions.push({ email: email.toLowerCase() });
            if (whatsappnumber) orConditions.push({ whatsappnumber });
            
            if (orConditions.length > 0) {
                duplicateFilter.$or = orConditions;
                
                const existingUser = await User.findOne(duplicateFilter);
                if (existingUser) {
                    return res.status(400).json({ 
                        success: false,
                        error: 'Email or whatsapp number already exists' 
                    });
                }
            }
        }
        
        // Update user
        const updatedUser = await User.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password -__v -emailVerificationOTP -emailVerificationExpiry -otp -otpExpiry');
        
        res.json({
            success: true,
            message: 'User updated successfully',
            data: updatedUser
        });
    } catch (error) {
        console.error('Update user error:', error);
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ 
                success: false,
                error: 'Validation failed',
                details: errors 
            });
        }
        
        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({ 
                success: false,
                error: 'Duplicate field value' 
            });
        }
        
        res.status(500).json({ 
            success: false,
            error: 'Server error while updating user' 
        });
    }
});

// DELETE user by ID
Subadminroute.delete('/users/:id', authenticateAdmin,async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid user ID' 
            });
        }
        
        // Check if user exists
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ 
                success: false,
                error: 'User not found' 
            });
        }
        
        // You might want to add additional checks here
        // For example, check if user has active deposits/withdrawals
        // or if user balance is zero
        
        // Soft delete option (recommended instead of hard delete):
        // Option 1: Mark as inactive/suspended
        // await User.findByIdAndUpdate(id, { status: 'suspended' });
        
        // Option 2: Hard delete (permanent removal)
        await User.findByIdAndDelete(id);
        
        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while deleting user' 
        });
    }
});
// DELETE ALL USERS (Dangerous operation - only for superadmin)
Subadminroute.delete('/users', authenticateAdmin,async (req, res) => {
    try {
        // Optional: Add a confirmation token or password for extra security
        const { confirmation, password } = req.body;
        
        // Uncomment the following code if you want extra confirmation
        /*
        if (!confirmation || confirmation !== 'DELETE_ALL_USERS') {
            return res.status(400).json({
                success: false,
                error: 'Confirmation phrase is required. Send confirmation: "DELETE_ALL_USERS" in the request body.'
            });
        }
        
        // Optionally verify admin password for extra security
        const admin = await Admin.findById(req.admin.id);
        if (!admin) {
            return res.status(404).json({
                success: false,
                error: 'Admin not found'
            });
        }
        
        const isPasswordValid = await admin.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                error: 'Admin password is incorrect'
            });
        }
        */
        
        // Get count of users before deletion for the response
        const totalUsers = await User.countDocuments();
        
        if (totalUsers === 0) {
            return res.status(404).json({
                success: false,
                error: 'No users found to delete'
            });
        }
        
        // Optional: Backup data before deletion (recommended for production)
        // You could export users to a CSV or JSON file here
        
        // Delete all users
        const result = await User.deleteMany({});
        
        // Alternative: Soft delete (mark all as suspended instead of hard delete)
        // const result = await User.updateMany({}, { status: 'suspended' });
        
        res.json({
            success: true,
            message: `Successfully deleted ${result.deletedCount} users`,
            data: {
                deletedCount: result.deletedCount,
                totalUsersBeforeDeletion: totalUsers
            }
        });
        
    } catch (error) {
        console.error('Delete all users error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while deleting all users'
        });
    }
});
// UPDATE user status (active/inactive/suspended/pending)
Subadminroute.put('/users/:id/status', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid user ID' 
            });
        }
        
        // Validate status
        const validStatuses = ['active', 'inactive', 'suspended', 'pending'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ 
                success: false,
                error: 'Valid status is required: active, inactive, suspended, or pending' 
            });
        }
        
        // Check if user exists
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ 
                success: false,
                error: 'User not found' 
            });
        }
        
        // Check if status is same as current
        if (user.status === status) {
            return res.status(400).json({ 
                success: false,
                error: `User is already ${status}` 
            });
        }
        
        // Update user status
        const updateData = {
            status: status
        };
        
        // If activating a pending user, you might want to automatically verify email
        if (status === 'active' && user.status === 'pending') {
            updateData.emailverified = true;
        }
        
        const updatedUser = await User.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password -__v -emailVerificationOTP -emailVerificationExpiry -otp -otpExpiry');
        
        res.json({
            success: true,
            message: `User status updated to ${status}`,
            data: updatedUser
        });
    } catch (error) {
        console.error('Update user status error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while updating user status' 
        });
    }
});
// ==================== USER BALANCE MANAGEMENT ROUTES ====================

// ADD balance to user account
Subadminroute.post('/users/:id/add-balance', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, notes } = req.body;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid user ID' 
            });
        }
        
        // Validate amount
        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({ 
                success: false,
                error: 'Valid positive amount is required' 
            });
        }
        
        // Find user
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ 
                success: false,
                error: 'User not found' 
            });
        }
        
        // Calculate new balance
        const oldBalance = user.balance || 0;
        const addAmount = parseFloat(amount);
        const newBalance = oldBalance + addAmount;
        
        // Update user balance
        user.balance = newBalance;
        await user.save();
        
        // Create balance history record
        const balanceHistory = new BalanceHistory({
            user: user._id,
            admin: req.admin.id,
            type: 'add',
            amount: addAmount,
            oldBalance: oldBalance,
            newBalance: newBalance,
            notes: notes || `Admin added balance: ${addAmount.toFixed(2)}`,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            metadata: {
                route: '/users/:id/add-balance',
                method: 'POST',
                adminName: req.admin.name || req.admin.username,
                userEmail: user.email,
                userFullName: user.fullname
            }
        });
        await balanceHistory.save();
        
        // Optional: Create transaction record if you have Transaction model
        // if (Transaction) {
        //     const transaction = new Transaction({
        //         userId: user._id,
        //         type: 'credit',
        //         amount: addAmount,
        //         status: 'completed',
        //         description: notes || 'Balance added by admin',
        //         adminId: req.admin.id,
        //         referenceId: balanceHistory._id,
        //         oldBalance: oldBalance,
        //         newBalance: newBalance
        //     });
        //     await transaction.save();
        // }
        
        res.json({
            success: true,
            message: `Balance added successfully: ${addAmount.toFixed(2)}`,
            data: {
                userId: user._id,
                fullname: user.fullname,
                email: user.email,
                oldBalance: oldBalance.toFixed(2),
                amountAdded: addAmount.toFixed(2),
                newBalance: newBalance.toFixed(2),
                balanceHistoryId: balanceHistory._id,
                timestamp: balanceHistory.createdAt,
                notes: notes || 'Balance added by admin'
            }
        });
    } catch (error) {
        console.error('Add balance error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while adding balance' 
        });
    }
});

// SUBTRACT balance from user account
Subadminroute.post('/users/:id/subtract-balance', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, notes } = req.body;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid user ID' 
            });
        }
        
        // Validate amount
        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({ 
                success: false,
                error: 'Valid positive amount is required' 
            });
        }
        
        // Find user
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ 
                success: false,
                error: 'User not found' 
            });
        }
        
        // Check if user has sufficient balance
        const oldBalance = parseFloat(user.balance) || 0;
        const deductionAmount = parseFloat(amount);
        
        // IMPORTANT: Check if deduction would result in negative balance
        if (oldBalance < deductionAmount) {
            return res.status(400).json({ 
                success: false,
                error: `Insufficient balance. User has: ${oldBalance.toFixed(2)}, cannot subtract ${deductionAmount.toFixed(2)}` 
            });
        }
        
        // Calculate new balance
        const newBalance = oldBalance - deductionAmount;
        
        // Ensure new balance is not negative (extra safety check)
        if (newBalance < 0) {
            return res.status(400).json({ 
                success: false,
                error: 'Operation would result in negative balance' 
            });
        }
        
        // Update user balance
        user.balance = newBalance;
        await user.save();
        
        // Create balance history record
        const balanceHistory = new BalanceHistory({
            user: user._id,
            admin: req.admin.id,
            type: 'subtract',
            amount: deductionAmount,
            oldBalance: oldBalance,
            newBalance: newBalance,
            notes: notes || `Admin subtracted balance: ${deductionAmount.toFixed(2)}`,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            metadata: {
                route: '/users/:id/subtract-balance',
                method: 'POST',
                adminName: req.admin.name || req.admin.username,
                userEmail: user.email,
                userFullName: user.fullname
            }
        });
        await balanceHistory.save();
        
        // Optional: Create transaction record if you have Transaction model
        // if (Transaction) {
        //     const transaction = new Transaction({
        //         userId: user._id,
        //         type: 'debit',
        //         amount: deductionAmount,
        //         status: 'completed',
        //         description: notes || 'Balance subtracted by admin',
        //         adminId: req.admin.id,
        //         referenceId: balanceHistory._id,
        //         oldBalance: oldBalance,
        //         newBalance: newBalance
        //     });
        //     await transaction.save();
        // }
        
        res.json({
            success: true,
            message: `Balance subtracted successfully: ${deductionAmount.toFixed(2)}`,
            data: {
                userId: user._id,
                fullname: user.fullname,
                email: user.email,
                oldBalance: oldBalance.toFixed(2),
                amountSubtracted: deductionAmount.toFixed(2),
                newBalance: newBalance.toFixed(2),
                balanceHistoryId: balanceHistory._id,
                timestamp: balanceHistory.createdAt,
                notes: notes || 'Balance subtracted by admin'
            }
        });
    } catch (error) {
        console.error('Subtract balance error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while subtracting balance' 
        });
    }
});
// GET user statistics
Subadminroute.get('/users/stats/overview', authenticateAdmin,async (req, res) => {
    try {
        const stats = await User.aggregate([
            {
                $group: {
                    _id: null,
                    totalUsers: { $sum: 1 },
                    totalBalance: { $sum: "$balance" },
                    totalDeposit: { $sum: "$totaldeposit" },
                    activeUsers: { 
                        $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } 
                    },
                    pendingUsers: { 
                        $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } 
                    },
                    suspendedUsers: { 
                        $sum: { $cond: [{ $eq: ["$status", "suspended"] }, 1, 0] } 
                    },
                    verifiedUsers: { 
                        $sum: { $cond: ["$emailverified", 1, 0] } 
                    }
                }
            }
        ]);
        
        // Get recent users (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const recentUsers = await User.countDocuments({
            createdAt: { $gte: sevenDaysAgo }
        });
        
        const responseStats = stats[0] || {
            totalUsers: 0,
            totalBalance: 0,
            totalDeposit: 0,
            activeUsers: 0,
            pendingUsers: 0,
            suspendedUsers: 0,
            verifiedUsers: 0
        };
        
        responseStats.recentUsers = recentUsers;
        
        res.json({
            success: true,
            data: responseStats
        });
    } catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while fetching statistics' 
        });
    }
});

// UPDATE user password (admin can reset user password)
Subadminroute.put('/users/:id/password', authenticateAdmin,async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid user ID' 
            });
        }
        
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ 
                success: false,
                error: 'New password must be at least 6 characters long' 
            });
        }
        
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ 
                success: false,
                error: 'User not found' 
            });
        }
        
        // Update password (the pre-save middleware will hash it)
        user.password = newPassword;
        await user.save();
        
        res.json({
            success: true,
            message: 'User password updated successfully'
        });
    } catch (error) {
        console.error('Update user password error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while updating password' 
        });
    }
});



// ==================== DEPOSIT METHOD MANAGEMENT ROUTES ====================

// ==================== DEPOSIT METHOD ROUTES WITH IMAGE UPLOAD ====================

// CREATE new deposit method with image upload
Subadminroute.post('/deposit-methods', 
    authenticateAdmin, 
    authorizeRoles('superadmin', 'admin'),
    upload.single('image'),
    async (req, res) => {
        try {
            const { 
                name, 
                description, 
                accountType,
                agentNumber, 
                minimumDeposit, 
                maximumDeposit,
                status = 'active'
            } = req.body;
            
            // Validation
            const requiredFields = ['name', 'description', 'accountType', 'agentNumber', 'minimumDeposit', 'maximumDeposit'];
            const missingFields = requiredFields.filter(field => !req.body[field]);
            
            if (missingFields.length > 0) {
                // Delete uploaded file if validation fails
                if (req.file) {
                    fs.unlinkSync(req.file.path);
                }
                return res.status(400).json({ 
                    success: false,
                    error: `Missing required fields: ${missingFields.join(', ')}` 
                });
            }
            
            // Check if image was uploaded
            if (!req.file) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Image file is required' 
                });
            }
            
            // Validate account type
            const validAccountTypes = ['agent', 'personal', 'business', 'merchant', 'corporate'];
            if (!validAccountTypes.includes(accountType)) {
                if (req.file) fs.unlinkSync(req.file.path);
                return res.status(400).json({ 
                    success: false,
                    error: `Invalid account type. Must be one of: ${validAccountTypes.join(', ')}` 
                });
            }
            
            // Check if deposit method with same name already exists
            const existingMethod = await DepositMethod.findOne({ name });
            
            if (existingMethod) {
                // Delete uploaded file if method exists
                fs.unlinkSync(req.file.path);
                return res.status(400).json({ 
                    success: false,
                    error: 'Deposit method with this name already exists' 
                });
            }
            
            // Create image path relative to server root
            const imagePath = '/uploads/deposit-methods/' + req.file.filename;
            
            // Create new deposit method
            const depositMethodData = {
                name,
                description,
                accountType,
                agentNumber,
                minimumDeposit: Number(minimumDeposit),
                maximumDeposit: Number(maximumDeposit),
                image: imagePath,
                status: status || 'active'
            };
            
            const newDepositMethod = new DepositMethod(depositMethodData);
            await newDepositMethod.save();
            
            res.status(201).json({
                success: true,
                message: 'Deposit method created successfully',
                data: newDepositMethod
            });
        } catch (error) {
            console.error('Create deposit method error:', error);
            
            // Delete uploaded file if error occurs
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            
            // Handle validation errors
            if (error.name === 'ValidationError') {
                const errors = Object.values(error.errors).map(err => err.message);
                return res.status(400).json({ 
                    success: false,
                    error: 'Validation failed',
                    details: errors 
                });
            }
            
            // Handle duplicate key error
            if (error.code === 11000) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Deposit method with this name already exists' 
                });
            }
            
            // Handle multer errors
            if (error instanceof multer.MulterError) {
                if (error.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({
                        success: false,
                        error: 'File size too large. Maximum size is 5MB'
                    });
                }
                return res.status(400).json({
                    success: false,
                    error: error.message
                });
            }
            
            res.status(500).json({ 
                success: false,
                error: 'Server error while creating deposit method' 
            });
        }
    }
);

// UPDATE deposit method by ID with optional image upload
Subadminroute.put('/deposit-methods/:id', 
    authenticateAdmin, 
    authorizeRoles('superadmin', 'admin'),
    upload.single('image'),
    async (req, res) => {
        try {
            const { id } = req.params;
            const { 
                name, 
                description, 
                accountType,
                agentNumber, 
                minimumDeposit, 
                maximumDeposit,
                status,
                removeImage // Optional flag to remove existing image
            } = req.body;
            
            if (!mongoose.Types.ObjectId.isValid(id)) {
                // Delete uploaded file if invalid ID
                if (req.file) {
                    fs.unlinkSync(req.file.path);
                }
                return res.status(400).json({ 
                    success: false,
                    error: 'Invalid deposit method ID' 
                });
            }
            
            // Check if deposit method exists
            const depositMethod = await DepositMethod.findById(id);
            if (!depositMethod) {
                // Delete uploaded file if method not found
                if (req.file) {
                    fs.unlinkSync(req.file.path);
                }
                return res.status(404).json({ 
                    success: false,
                    error: 'Deposit method not found' 
                });
            }
            
            // Build update object
            const updateData = {};
            
            if (name && name.trim() !== depositMethod.name) {
                updateData.name = name.trim();
            }
            if (description && description.trim() !== depositMethod.description) {
                updateData.description = description.trim();
            }
            if (accountType && accountType !== depositMethod.accountType) {
                // Validate account type
                const validAccountTypes = ['agent', 'personal', 'business', 'merchant', 'corporate'];
                if (!validAccountTypes.includes(accountType)) {
                    if (req.file) fs.unlinkSync(req.file.path);
                    return res.status(400).json({ 
                        success: false,
                        error: `Invalid account type. Must be one of: ${validAccountTypes.join(', ')}` 
                    });
                }
                updateData.accountType = accountType;
            }
            if (agentNumber && agentNumber.trim() !== depositMethod.agentNumber) {
                updateData.agentNumber = agentNumber.trim();
            }
            
            // Handle minimum and maximum deposit
            let minDeposit = minimumDeposit !== undefined ? parseFloat(minimumDeposit) : depositMethod.minimumDeposit;
            let maxDeposit = maximumDeposit !== undefined ? parseFloat(maximumDeposit) : depositMethod.maximumDeposit;
            
            // Validate deposits
            if (minimumDeposit !== undefined) {
                minDeposit = parseFloat(minimumDeposit);
                if (isNaN(minDeposit) || minDeposit < 0) {
                    if (req.file) fs.unlinkSync(req.file.path);
                    return res.status(400).json({ 
                        success: false,
                        error: 'Minimum deposit must be a valid positive number' 
                    });
                }
                updateData.minimumDeposit = minDeposit;
            }
            
            if (maximumDeposit !== undefined) {
                maxDeposit = parseFloat(maximumDeposit);
                if (isNaN(maxDeposit) || maxDeposit < 0) {
                    if (req.file) fs.unlinkSync(req.file.path);
                    return res.status(400).json({ 
                        success: false,
                        error: 'Maximum deposit must be a valid positive number' 
                    });
                }
                updateData.maximumDeposit = maxDeposit;
            }
            
            // Validate maximum >= minimum
            if (maxDeposit < minDeposit) {
                if (req.file) fs.unlinkSync(req.file.path);
                return res.status(400).json({ 
                    success: false,
                    error: 'Maximum deposit must be greater than or equal to minimum deposit' 
                });
            }
            
            if (status && ['active', 'inactive', 'maintenance'].includes(status)) {
                updateData.status = status;
            }
            
            // Handle image update
            let oldImagePath = null;
            if (req.file) {
                // New image uploaded
                oldImagePath = depositMethod.image;
                updateData.image = '/uploads/deposit-methods/' + req.file.filename;
            } else if (removeImage === 'true') {
                // Remove existing image
                oldImagePath = depositMethod.image;
                updateData.image = null;
            }
            // If not updating image, don't include it in updateData
            
            if (Object.keys(updateData).length === 0) {
                // Delete uploaded file if no update data
                if (req.file) {
                    fs.unlinkSync(req.file.path);
                }
                return res.status(400).json({ 
                    success: false,
                    error: 'No data provided for update' 
                });
            }
            
            // Check for duplicate name (only if name is being updated)
            if (updateData.name) {
                const existingMethod = await DepositMethod.findOne({ 
                    name: updateData.name, 
                    _id: { $ne: id } 
                });
                if (existingMethod) {
                    // Delete uploaded file if duplicate name
                    if (req.file) {
                        fs.unlinkSync(req.file.path);
                    }
                    return res.status(400).json({ 
                        success: false,
                        error: 'Deposit method with this name already exists' 
                    });
                }
            }
            
            // Use findOneAndUpdate instead of findByIdAndUpdate for better validation control
            const updatedDepositMethod = await DepositMethod.findOneAndUpdate(
                { _id: id },
                updateData,
                { 
                    new: true, 
                    runValidators: true,
                    context: 'query' // Important for update validators
                }
            ).select('-__v');
            
            // Delete old image file after successful update
            if (oldImagePath) {
                await deleteOldImage(oldImagePath);
            }
            
            res.json({
                success: true,
                message: 'Deposit method updated successfully',
                data: updatedDepositMethod
            });
        } catch (error) {
            console.error('Update deposit method error:', error);
            
            // Delete uploaded file if error occurs
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            
            // Handle validation errors
            if (error.name === 'ValidationError') {
                const errors = Object.values(error.errors).map(err => err.message);
                return res.status(400).json({ 
                    success: false,
                    error: 'Validation failed',
                    details: errors 
                });
            }
            
            // Handle custom validation error from pre-hook
            if (error.message && error.message.includes('Maximum deposit must be greater than')) {
                return res.status(400).json({
                    success: false,
                    error: error.message
                });
            }
            
            // Handle duplicate key error
            if (error.code === 11000) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Deposit method with this name already exists' 
                });
            }
            
            // Handle multer errors
            if (error instanceof multer.MulterError) {
                if (error.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({
                        success: false,
                        error: 'File size too large. Maximum size is 5MB'
                    });
                }
                return res.status(400).json({
                    success: false,
                    error: error.message
                });
            }
            
            res.status(500).json({ 
                success: false,
                error: 'Server error while updating deposit method' 
            });
        }
    }
);

// GET all deposit methods (updated to handle image URLs and filtering by accountType)
Subadminroute.get('/deposit-methods', authenticateAdmin, async (req, res) => {
    try {
        const { status, accountType, sortBy = 'name', sortOrder = 'asc' } = req.query;
        
        // Build filter
        const filter = {};
        if (status && ['active', 'inactive', 'maintenance'].includes(status)) {
            filter.status = status;
        }
        if (accountType) {
            const validAccountTypes = ['agent', 'personal', 'business', 'merchant', 'corporate'];
            if (validAccountTypes.includes(accountType)) {
                filter.accountType = accountType;
            }
        }
        
        // Build sort
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
        
        // Execute query
        const depositMethods = await DepositMethod.find(filter)
            .sort(sort)
            .select('-__v');
        
        // Convert image paths to full URLs
        const depositMethodsWithUrls = depositMethods.map(method => {
            const methodObj = method.toObject();
            if (methodObj.image) {
                methodObj.image = req.protocol + '://' + req.get('host') + methodObj.image;
            }
            return methodObj;
        });
        
        res.json({
            success: true,
            count: depositMethods.length,
            data: depositMethodsWithUrls
        });
    } catch (error) {
        console.error('Get deposit methods error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while fetching deposit methods' 
        });
    }
});

// GET active deposit methods by account type (new endpoint)
Subadminroute.get('/deposit-methods/active/:accountType', authenticateAdmin, async (req, res) => {
    try {
        const { accountType } = req.params;
        
        // Validate account type
        const validAccountTypes = ['agent', 'personal', 'business', 'merchant', 'corporate'];
        if (!validAccountTypes.includes(accountType)) {
            return res.status(400).json({ 
                success: false,
                error: `Invalid account type. Must be one of: ${validAccountTypes.join(', ')}` 
            });
        }
        
        const depositMethods = await DepositMethod.getMethodsByAccountType(accountType)
            .select('-__v');
        
        // Convert image paths to full URLs
        const depositMethodsWithUrls = depositMethods.map(method => {
            const methodObj = method.toObject();
            if (methodObj.image) {
                methodObj.image = req.protocol + '://' + req.get('host') + methodObj.image;
            }
            return methodObj;
        });
        
        res.json({
            success: true,
            count: depositMethods.length,
            data: depositMethodsWithUrls
        });
    } catch (error) {
        console.error('Get active deposit methods by account type error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while fetching active deposit methods' 
        });
    }
});
// GET single deposit method by ID (updated to handle image URL)
Subadminroute.get('/deposit-methods/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid deposit method ID' 
            });
        }
        
        const depositMethod = await DepositMethod.findById(id)
            .select('-__v');
        
        if (!depositMethod) {
            return res.status(404).json({ 
                success: false,
                error: 'Deposit method not found' 
            });
        }
        
        // If image exists, convert to full URL
        if (depositMethod.image) {
            depositMethod.image = req.protocol + '://' + req.get('host') + depositMethod.image;
        }
        
        res.json({
            success: true,
            data: depositMethod
        });
    } catch (error) {
        console.error('Get deposit method by ID error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error' 
        });
    }
});

// GET all available account types (new endpoint)
Subadminroute.get('/deposit-methods/account-types', authenticateAdmin, async (req, res) => {
    try {
        // Get unique account types from existing deposit methods
        const accountTypes = await DepositMethod.distinct('accountType');
        
        // Define account type details
        const accountTypeDetails = {
            'agent': {
                name: 'Agent Account',
                description: 'For registered agents or representatives',
                count: await DepositMethod.countDocuments({ accountType: 'agent', status: 'active' })
            },
            'personal': {
                name: 'Personal Account',
                description: 'For individual users',
                count: await DepositMethod.countDocuments({ accountType: 'personal', status: 'active' })
            },
            'business': {
                name: 'Business Account',
                description: 'For small to medium businesses',
                count: await DepositMethod.countDocuments({ accountType: 'business', status: 'active' })
            },
            'merchant': {
                name: 'Merchant Account',
                description: 'For commercial merchants',
                count: await DepositMethod.countDocuments({ accountType: 'merchant', status: 'active' })
            },
            'corporate': {
                name: 'Corporate Account',
                description: 'For large corporations',
                count: await DepositMethod.countDocuments({ accountType: 'corporate', status: 'active' })
            }
        };
        
        // Filter to only include account types that exist in the database
        const availableAccountTypes = accountTypes.map(type => ({
            type,
            ...accountTypeDetails[type]
        }));
        
        res.json({
            success: true,
            count: availableAccountTypes.length,
            data: availableAccountTypes
        });
    } catch (error) {
        console.error('Get account types error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while fetching account types' 
        });
    }
});

// PATCH deposit method by ID (partial update, doesn't require all fields)
Subadminroute.patch('/deposit-methods/:id', 
    authenticateAdmin, 
    authorizeRoles('superadmin', 'admin'),
    upload.single('image'),
    async (req, res) => {
        try {
            const { id } = req.params;
            const updateData = req.body;
            
            if (!mongoose.Types.ObjectId.isValid(id)) {
                if (req.file) fs.unlinkSync(req.file.path);
                return res.status(400).json({ 
                    success: false,
                    error: 'Invalid deposit method ID' 
                });
            }
            
            // Check if deposit method exists
            const depositMethod = await DepositMethod.findById(id);
            if (!depositMethod) {
                if (req.file) fs.unlinkSync(req.file.path);
                return res.status(404).json({ 
                    success: false,
                    error: 'Deposit method not found' 
                });
            }
            
            // Handle account type validation
            if (updateData.accountType !== undefined) {
                const validAccountTypes = ['agent', 'personal', 'business', 'merchant', 'corporate'];
                if (!validAccountTypes.includes(updateData.accountType)) {
                    if (req.file) fs.unlinkSync(req.file.path);
                    return res.status(400).json({ 
                        success: false,
                        error: `Invalid account type. Must be one of: ${validAccountTypes.join(', ')}` 
                    });
                }
            }
            
            // Handle number conversions
            if (updateData.minimumDeposit !== undefined) {
                updateData.minimumDeposit = Number(updateData.minimumDeposit);
                if (updateData.minimumDeposit < 0) {
                    if (req.file) fs.unlinkSync(req.file.path);
                    return res.status(400).json({ 
                        success: false,
                        error: 'Minimum deposit cannot be negative' 
                    });
                }
            }
            
            if (updateData.maximumDeposit !== undefined) {
                updateData.maximumDeposit = Number(updateData.maximumDeposit);
                if (updateData.maximumDeposit < 0) {
                    if (req.file) fs.unlinkSync(req.file.path);
                    return res.status(400).json({ 
                        success: false,
                        error: 'Maximum deposit cannot be negative' 
                    });
                }
            }
            
            // Validate min/max relationship
            const minDeposit = updateData.minimumDeposit !== undefined ? 
                updateData.minimumDeposit : depositMethod.minimumDeposit;
            const maxDeposit = updateData.maximumDeposit !== undefined ? 
                updateData.maximumDeposit : depositMethod.maximumDeposit;
            
            if (maxDeposit < minDeposit) {
                if (req.file) fs.unlinkSync(req.file.path);
                return res.status(400).json({ 
                    success: false,
                    error: 'Maximum deposit must be greater than or equal to minimum deposit' 
                });
            }
            
            // Handle image
            let oldImagePath = null;
            if (req.file) {
                oldImagePath = depositMethod.image;
                updateData.image = '/uploads/deposit-methods/' + req.file.filename;
            } else if (updateData.removeImage === 'true') {
                oldImagePath = depositMethod.image;
                updateData.image = null;
                delete updateData.removeImage;
            }
            
            // Check for duplicate name if name is being updated
            if (updateData.name) {
                const existingMethod = await DepositMethod.findOne({ 
                    name: updateData.name.trim(), 
                    _id: { $ne: id } 
                });
                if (existingMethod) {
                    if (req.file) fs.unlinkSync(req.file.path);
                    return res.status(400).json({ 
                        success: false,
                        error: 'Deposit method with this name already exists' 
                    });
                }
                updateData.name = updateData.name.trim();
            }
            
            // Trim other string fields
            if (updateData.description) updateData.description = updateData.description.trim();
            if (updateData.agentNumber) updateData.agentNumber = updateData.agentNumber.trim();
            
            // Remove empty fields
            Object.keys(updateData).forEach(key => {
                if (updateData[key] === undefined || updateData[key] === '') {
                    delete updateData[key];
                }
            });
            
            if (Object.keys(updateData).length === 0) {
                if (req.file) fs.unlinkSync(req.file.path);
                return res.status(400).json({ 
                    success: false,
                    error: 'No data provided for update' 
                });
            }
            
            // Update
            const updatedDepositMethod = await DepositMethod.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true, context: 'query' }
            ).select('-__v');
            
            // Clean up old image
            if (oldImagePath) {
                await deleteOldImage(oldImagePath);
            }
            
            res.json({
                success: true,
                message: 'Deposit method updated successfully',
                data: updatedDepositMethod
            });
            
        } catch (error) {
            console.error('Patch deposit method error:', error);
            
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            
            // Handle validation errors
            if (error.name === 'ValidationError') {
                const errors = Object.values(error.errors).map(err => err.message);
                return res.status(400).json({ 
                    success: false,
                    error: 'Validation failed',
                    details: errors 
                });
            }
            
            // Handle duplicate key error
            if (error.code === 11000) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Deposit method with this name already exists' 
                });
            }
            
            res.status(400).json({
                success: false,
                error: error.message || 'Failed to update deposit method'
            });
        }
    }
);
Subadminroute.delete('/deposit-methods/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if deposit method exists
        const depositMethod = await DepositMethod.findById(id);
        if (!depositMethod) {
            return res.status(404).json({ 
                success: false,
                error: 'Deposit method not found' 
            });
        }
        
        // Store image path before deletion
        const imagePath = depositMethod.image;
        
        // Delete deposit method from database
        await DepositMethod.findByIdAndDelete(id);
        
        // Delete associated image file
        await deleteOldImage(imagePath);
        
        res.json({
            success: true,
            message: 'Deposit method deleted successfully'
        });
    } catch (error) {
        console.error('Delete deposit method error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while deleting deposit method' 
        });
    }
});
// Note: The other endpoints (GET single by ID, DELETE, etc.) don't need changes as they return the full document
// which now includes the accountType field automatically
// ==================== IMAGE-SPECIFIC ROUTES ====================

// GET deposit method image
Subadminroute.get('/deposit-methods/:id/image', async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid deposit method ID' 
            });
        }
        
        const depositMethod = await DepositMethod.findById(id)
            .select('image');
        
        if (!depositMethod) {
            return res.status(404).json({ 
                success: false,
                error: 'Deposit method not found' 
            });
        }
        
        if (!depositMethod.image) {
            return res.status(404).json({ 
                success: false,
                error: 'No image found for this deposit method' 
            });
        }
        
        // Construct full path to image
        const imagePath = path.join(__dirname, '..', depositMethod.image);
        
        // Check if file exists
        if (!fs.existsSync(imagePath)) {
            return res.status(404).json({ 
                success: false,
                error: 'Image file not found' 
            });
        }
        
        // Send the image file
        res.sendFile(imagePath);
    } catch (error) {
        console.error('Get deposit method image error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while fetching image' 
        });
    }
});

// UPDATE only deposit method image
Subadminroute.patch('/deposit-methods/:id/image', 
    authenticateAdmin, 
    authorizeRoles('superadmin', 'admin'),
    upload.single('image'),
    async (req, res) => {
        try {
            const { id } = req.params;
            
            if (!mongoose.Types.ObjectId.isValid(id)) {
                if (req.file) {
                    fs.unlinkSync(req.file.path);
                }
                return res.status(400).json({ 
                    success: false,
                    error: 'Invalid deposit method ID' 
                });
            }
            
            // Check if deposit method exists
            const depositMethod = await DepositMethod.findById(id);
            if (!depositMethod) {
                if (req.file) {
                    fs.unlinkSync(req.file.path);
                }
                return res.status(404).json({ 
                    success: false,
                    error: 'Deposit method not found' 
                });
            }
            
            // Check if image was uploaded
            if (!req.file) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Image file is required' 
                });
            }
            
            // Store old image path
            const oldImagePath = depositMethod.image;
            
            // Update image path
            const imagePath = '/uploads/deposit-methods/' + req.file.filename;
            
            const updatedDepositMethod = await DepositMethod.findByIdAndUpdate(
                id,
                { image: imagePath },
                { new: true }
            ).select('-__v');
            
            // Delete old image file
            if (oldImagePath) {
                await deleteOldImage(oldImagePath);
            }
            
            // Add full URL to response
            if (updatedDepositMethod.image) {
                updatedDepositMethod.image = req.protocol + '://' + req.get('host') + updatedDepositMethod.image;
            }
            
            res.json({
                success: true,
                message: 'Deposit method image updated successfully',
                data: updatedDepositMethod
            });
        } catch (error) {
            console.error('Update deposit method image error:', error);
            
            // Delete uploaded file if error occurs
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            
            // Handle multer errors
            if (error instanceof multer.MulterError) {
                if (error.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({
                        success: false,
                        error: 'File size too large. Maximum size is 5MB'
                    });
                }
                return res.status(400).json({
                    success: false,
                    error: error.message
                });
            }
            
            res.status(500).json({ 
                success: false,
                error: 'Server error while updating image' 
            });
        }
    }
);

// DELETE deposit method image only
Subadminroute.delete('/deposit-methods/:id/image', 
    authenticateAdmin, 
    authorizeRoles('superadmin', 'admin'),
    async (req, res) => {
        try {
            const { id } = req.params;
            
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Invalid deposit method ID' 
                });
            }
            
            // Check if deposit method exists
            const depositMethod = await DepositMethod.findById(id);
            if (!depositMethod) {
                return res.status(404).json({ 
                    success: false,
                    error: 'Deposit method not found' 
                });
            }
            
            // Check if deposit method has an image
            if (!depositMethod.image) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Deposit method does not have an image' 
                });
            }
            
            // Store image path
            const imagePath = depositMethod.image;
            
            // Update deposit method to remove image
            const updatedDepositMethod = await DepositMethod.findByIdAndUpdate(
                id,
                { image: null },
                { new: true }
            ).select('-__v');
            
            // Delete image file
            await deleteOldImage(imagePath);
            
            res.json({
                success: true,
                message: 'Deposit method image deleted successfully',
                data: updatedDepositMethod
            });
        } catch (error) {
            console.error('Delete deposit method image error:', error);
            res.status(500).json({ 
                success: false,
                error: 'Server error while deleting image' 
            });
        }
    }
);

// UPDATE deposit method status only
Subadminroute.patch('/deposit-methods/:id/status', 
    authenticateAdmin, 
    authorizeRoles('superadmin', 'admin'),
    async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;
            
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Invalid deposit method ID' 
                });
            }
            
            // Check if deposit method exists
            const depositMethod = await DepositMethod.findById(id);
            if (!depositMethod) {
                return res.status(404).json({ 
                    success: false,
                    error: 'Deposit method not found' 
                });
            }
            
            // Validate status
            const validStatuses = ['active', 'inactive', 'maintenance'];
            if (!status || !validStatuses.includes(status)) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Valid status is required: active, inactive, or maintenance' 
                });
            }
            
            // Check if status is same as current
            if (depositMethod.status === status) {
                return res.status(400).json({ 
                    success: false,
                    error: `Deposit method is already ${status}` 
                });
            }
            
            // Update status
            const updatedDepositMethod = await DepositMethod.findByIdAndUpdate(
                id,
                { 
                    status: status,
                    updatedAt: Date.now()
                },
                { new: true, runValidators: true }
            ).select('-__v');
            
            // Add full URL to response if image exists
            if (updatedDepositMethod.image) {
                updatedDepositMethod.image = req.protocol + '://' + req.get('host') + updatedDepositMethod.image;
            }
            
            res.json({
                success: true,
                message: `Deposit method status updated to ${status}`,
                data: updatedDepositMethod
            });
        } catch (error) {
            console.error('Update deposit method status error:', error);
            
            // Handle validation errors
            if (error.name === 'ValidationError') {
                const errors = Object.values(error.errors).map(err => err.message);
                return res.status(400).json({ 
                    success: false,
                    error: 'Validation failed',
                    details: errors 
                });
            }
            
            res.status(500).json({ 
                success: false,
                error: 'Server error while updating deposit method status' 
            });
        }
    }
);

// Alternative: Toggle status (active <-> inactive)
Subadminroute.patch('/deposit-methods/:id/toggle-status', 
    authenticateAdmin, 
    authorizeRoles('superadmin', 'admin'),
    async (req, res) => {
        try {
            const { id } = req.params;
            
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Invalid deposit method ID' 
                });
            }
            
            // Check if deposit method exists
            const depositMethod = await DepositMethod.findById(id);
            if (!depositMethod) {
                return res.status(404).json({ 
                    success: false,
                    error: 'Deposit method not found' 
                });
            }
            
            // Toggle status
            const currentStatus = depositMethod.status;
            let newStatus;
            
            if (currentStatus === 'active') {
                newStatus = 'inactive';
            } else if (currentStatus === 'inactive') {
                newStatus = 'active';
            } else {
                // If it's maintenance, default to active
                newStatus = 'active';
            }
            
            // Update status
            const updatedDepositMethod = await DepositMethod.findByIdAndUpdate(
                id,
                { 
                    status: newStatus,
                    updatedAt: Date.now()
                },
                { new: true, runValidators: true }
            ).select('-__v');
            
            // Add full URL to response if image exists
            if (updatedDepositMethod.image) {
                updatedDepositMethod.image = req.protocol + '://' + req.get('host') + updatedDepositMethod.image;
            }
            
            res.json({
                success: true,
                message: `Deposit method status changed from ${currentStatus} to ${newStatus}`,
                data: updatedDepositMethod
            });
        } catch (error) {
            console.error('Toggle deposit method status error:', error);
            
            // Handle validation errors
            if (error.name === 'ValidationError') {
                const errors = Object.values(error.errors).map(err => err.message);
                return res.status(400).json({ 
                    success: false,
                    error: 'Validation failed',
                    details: errors 
                });
            }
            
            res.status(500).json({ 
                success: false,
                error: 'Server error while toggling deposit method status' 
            });
        }
    }
);

// ==================== BONUS MANAGEMENT ROUTES ====================

// GET all bonuses
Subadminroute.get('/bonuses', authenticateAdmin, async (req, res) => {
    try {
        const bonuses = await Bonus.find().sort({ createdAt: -1 });
        
        res.json({
            success: true,
            count: bonuses.length,
            data: bonuses
        });
    } catch (error) {
        console.error('Get bonuses error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while fetching bonuses' 
        });
    }
});

// GET active bonuses
Subadminroute.get('/bonuses/active', authenticateAdmin, async (req, res) => {
    try {
        const bonuses = await Bonus.find({ status: 'active' }).sort({ createdAt: -1 });
        
        res.json({
            success: true,
            count: bonuses.length,
            data: bonuses
        });
    } catch (error) {
        console.error('Get active bonuses error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while fetching active bonuses' 
        });
    }
});

// GET single bonus by ID
Subadminroute.get('/bonuses/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid bonus ID' 
            });
        }
        
        const bonus = await Bonus.findById(id);
        
        if (!bonus) {
            return res.status(404).json({ 
                success: false,
                error: 'Bonus not found' 
            });
        }
        
        res.json({
            success: true,
            data: bonus
        });
    } catch (error) {
        console.error('Get bonus by ID error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error' 
        });
    }
});

// CREATE new bonus
Subadminroute.post('/bonuses', authenticateAdmin,async (req, res) => {
    try {
        const { 
            title, 
            minimumDeposit, 
            bonusAmount, 
            description,
            status = 'active'
        } = req.body;
        
        // Validation
        if (!title || minimumDeposit === undefined || bonusAmount === undefined) {
            return res.status(400).json({ 
                success: false,
                error: 'Title, minimum deposit, and bonus amount are required' 
            });
        }
        
        if (minimumDeposit < 0) {
            return res.status(400).json({ 
                success: false,
                error: 'Minimum deposit cannot be negative' 
            });
        }
        
        if (bonusAmount < 0) {
            return res.status(400).json({ 
                success: false,
                error: 'Bonus amount cannot be negative' 
            });
        }
        
        // Create new bonus
        const bonusData = {
            title,
            minimumDeposit: Number(minimumDeposit),
            bonusAmount: Number(bonusAmount),
            status: status || 'active'
        };
        
        if (description) bonusData.description = description;
        
        const newBonus = new Bonus(bonusData);
        await newBonus.save();
        
        res.status(201).json({
            success: true,
            message: 'Bonus created successfully',
            data: newBonus
        });
    } catch (error) {
        console.error('Create bonus error:', error);
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ 
                success: false,
                error: 'Validation failed',
                details: errors 
            });
        }
        
        res.status(500).json({ 
            success: false,
            error: 'Server error while creating bonus' 
        });
    }
});

// UPDATE bonus by ID
Subadminroute.put('/bonuses/:id', authenticateAdmin,async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            title, 
            minimumDeposit, 
            bonusAmount, 
            description,
            status
        } = req.body;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid bonus ID' 
            });
        }
        
        // Check if bonus exists
        const bonus = await Bonus.findById(id);
        if (!bonus) {
            return res.status(404).json({ 
                success: false,
                error: 'Bonus not found' 
            });
        }
        
        // Build update object
        const updateData = {};
        if (title) updateData.title = title;
        if (minimumDeposit !== undefined) {
            if (minimumDeposit < 0) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Minimum deposit cannot be negative' 
                });
            }
            updateData.minimumDeposit = Number(minimumDeposit);
        }
        if (bonusAmount !== undefined) {
            if (bonusAmount < 0) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Bonus amount cannot be negative' 
                });
            }
            updateData.bonusAmount = Number(bonusAmount);
        }
        if (description !== undefined) updateData.description = description;
        if (status && ['active', 'inactive'].includes(status)) {
            updateData.status = status;
        }
        
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ 
                success: false,
                error: 'No data provided for update' 
            });
        }
        
        // Update bonus
        const updatedBonus = await Bonus.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );
        
        res.json({
            success: true,
            message: 'Bonus updated successfully',
            data: updatedBonus
        });
    } catch (error) {
        console.error('Update bonus error:', error);
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ 
                success: false,
                error: 'Validation failed',
                details: errors 
            });
        }
        
        res.status(500).json({ 
            success: false,
            error: 'Server error while updating bonus' 
        });
    }
});

// DELETE bonus by ID
Subadminroute.delete('/bonuses/:id', authenticateAdmin,async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid bonus ID' 
            });
        }
        
        // Check if bonus exists
        const bonus = await Bonus.findById(id);
        if (!bonus) {
            return res.status(404).json({ 
                success: false,
                error: 'Bonus not found' 
            });
        }
        
        // Delete bonus
        await Bonus.findByIdAndDelete(id);
        
        res.json({
            success: true,
            message: 'Bonus deleted successfully'
        });
    } catch (error) {
        console.error('Delete bonus error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while deleting bonus' 
        });
    }
});

// TOGGLE bonus status (active/inactive)
Subadminroute.patch('/bonuses/:id/toggle-status', authenticateAdmin,async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid bonus ID' 
            });
        }
        
        // Check if bonus exists
        const bonus = await Bonus.findById(id);
        if (!bonus) {
            return res.status(404).json({ 
                success: false,
                error: 'Bonus not found' 
            });
        }
        
        // Toggle status
        const newStatus = bonus.status === 'active' ? 'inactive' : 'active';
        
        // Update status
        const updatedBonus = await Bonus.findByIdAndUpdate(
            id,
            { status: newStatus },
            { new: true }
        );
        
        res.json({
            success: true,
            message: `Bonus status changed to ${newStatus}`,
            data: updatedBonus
        });
    } catch (error) {
        console.error('Toggle bonus status error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while toggling bonus status' 
        });
    }
});

// DELETE all bonuses (optional - for superadmin only)
Subadminroute.delete('/bonuses', authenticateAdmin,async (req, res) => {
    try {
        const { confirmation } = req.body;
        
        // Optional confirmation for safety
        if (!confirmation || confirmation !== 'DELETE_ALL_BONUSES') {
            return res.status(400).json({
                success: false,
                error: 'Confirmation phrase is required. Send confirmation: "DELETE_ALL_BONUSES" in the request body.'
            });
        }
        
        // Get count of bonuses before deletion
        const totalBonuses = await Bonus.countDocuments();
        
        if (totalBonuses === 0) {
            return res.status(404).json({
                success: false,
                error: 'No bonuses found to delete'
            });
        }
        
        // Delete all bonuses
        const result = await Bonus.deleteMany({});
        
        res.json({
            success: true,
            message: `Successfully deleted ${result.deletedCount} bonuses`,
            data: {
                deletedCount: result.deletedCount,
                totalBonusesBeforeDeletion: totalBonuses
            }
        });
        
    } catch (error) {
        console.error('Delete all bonuses error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while deleting all bonuses'
        });
    }
});

// GET bonus statistics
Subadminroute.get('/bonuses/stats/overview', authenticateAdmin,async (req, res) => {
    try {
        const stats = await Bonus.aggregate([
            {
                $group: {
                    _id: null,
                    totalBonuses: { $sum: 1 },
                    activeBonuses: { 
                        $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } 
                    },
                    inactiveBonuses: { 
                        $sum: { $cond: [{ $eq: ["$status", "inactive"] }, 1, 0] } 
                    },
                    totalMinimumDeposit: { $sum: "$minimumDeposit" },
                    totalBonusAmount: { $sum: "$bonusAmount" },
                    avgMinimumDeposit: { $avg: "$minimumDeposit" },
                    avgBonusAmount: { $avg: "$bonusAmount" }
                }
            }
        ]);
        
        const responseStats = stats[0] || {
            totalBonuses: 0,
            activeBonuses: 0,
            inactiveBonuses: 0,
            totalMinimumDeposit: 0,
            totalBonusAmount: 0,
            avgMinimumDeposit: 0,
            avgBonusAmount: 0
        };
        
        res.json({
            success: true,
            data: responseStats
        });
    } catch (error) {
        console.error('Get bonus stats error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while fetching bonus statistics' 
        });
    }
});


// Add at the top with other imports
const Deposit = require("../models/Deposit");
const Transaction = require("../models/Transaction");
const BalanceHistory = require("../models/BalanceHistory");

// ==================== DEPOSIT MANAGEMENT ROUTES ====================

// GET all deposits (with filtering, pagination, and sorting)
Subadminroute.get('/deposits', authenticateAdmin, async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            status,
            startDate,
            endDate,
            search,
            userId,
            depositMethodId,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build filter
        const filter = {};
        
        if (status && ['pending', 'approved', 'rejected'].includes(status)) {
            filter.status = status;
        }
        
        if (userId && mongoose.Types.ObjectId.isValid(userId)) {
            filter.user = userId;
        }
        
        if (depositMethodId && mongoose.Types.ObjectId.isValid(depositMethodId)) {
            filter.depositMethod = depositMethodId;
        }
        
        // Date range filter
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) {
                filter.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                filter.createdAt.$lte = new Date(endDate);
            }
        }
        
        // Search in transaction ID or account number
        if (search) {
            filter.$or = [
                { transactionId: { $regex: search, $options: 'i' } },
                { accountNumber: { $regex: search, $options: 'i' } }
            ];
        }

        // Calculate pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Build sort
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Get total count
        const total = await Deposit.countDocuments(filter);

        // Get deposits with population
        const deposits = await Deposit.find(filter)
            .populate('user', 'fullname email whatsappnumber')
            .populate('depositMethod', 'name')
            .sort(sort)
            .skip(skip)
            .limit(limitNum);

        // Calculate totals
        const totals = await Deposit.aggregate([
            { $match: filter },
            { $group: {
                _id: null,
                totalAmount: { $sum: '$amount' },
                totalBonus: { $sum: '$bonusAmount' },
                approvedAmount: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, '$amount', 0] } },
                approvedBonus: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, '$bonusAmount', 0] } },
                pendingAmount: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] } }
            }}
        ]);

        const totalsData = totals[0] || {
            totalAmount: 0,
            totalBonus: 0,
            approvedAmount: 0,
            approvedBonus: 0,
            pendingAmount: 0
        };

        res.json({
            success: true,
            data: deposits,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                pages: Math.ceil(total / limitNum)
            },
            totals: totalsData
        });

    } catch (error) {
        console.error('Get deposits error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while fetching deposits' 
        });
    }
});

// GET single deposit by ID
Subadminroute.get('/deposits/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid deposit ID' 
            });
        }
        
        const deposit = await Deposit.findById(id)
            .populate('user', 'fullname email whatsappnumber profile')
            .populate('depositMethod', 'name agentNumber minimumDeposit maximumDeposit image');
        
        if (!deposit) {
            return res.status(404).json({ 
                success: false,
                error: 'Deposit not found' 
            });
        }
        
        // If deposit method has image, convert to full URL
        if (deposit.depositMethod && deposit.depositMethod.image) {
            deposit.depositMethod.image = req.protocol + '://' + req.get('host') + deposit.depositMethod.image;
        }
        
        res.json({
            success: true,
            data: deposit
        });
    } catch (error) {
        console.error('Get deposit by ID error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error' 
        });
    }
});

// GET deposit statistics
Subadminroute.get('/deposits/stats/overview', authenticateAdmin, async (req, res) => {
    try {
        // Get today's date range
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get this week's date range
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        // Get this month's date range
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        const stats = await Deposit.aggregate([
            {
                $group: {
                    _id: null,
                    totalDeposits: { $sum: 1 },
                    totalAmount: { $sum: '$amount' },
                    totalBonus: { $sum: '$bonusAmount' },
                    approvedDeposits: { 
                        $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } 
                    },
                    approvedAmount: { 
                        $sum: { $cond: [{ $eq: ['$status', 'approved'] }, '$amount', 0] } 
                    },
                    pendingDeposits: { 
                        $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } 
                    },
                    pendingAmount: { 
                        $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] } 
                    },
                    rejectedDeposits: { 
                        $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } 
                    }
                }
            }
        ]);

        // Get today's deposits
        const todayStats = await Deposit.aggregate([
            {
                $match: {
                    createdAt: { $gte: today, $lt: tomorrow },
                    status: 'approved'
                }
            },
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 },
                    amount: { $sum: '$amount' }
                }
            }
        ]);

        // Get weekly deposits
        const weeklyStats = await Deposit.aggregate([
            {
                $match: {
                    createdAt: { $gte: weekStart, $lt: weekEnd },
                    status: 'approved'
                }
            },
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 },
                    amount: { $sum: '$amount' }
                }
            }
        ]);

        // Get monthly deposits
        const monthlyStats = await Deposit.aggregate([
            {
                $match: {
                    createdAt: { $gte: monthStart, $lt: monthEnd },
                    status: 'approved'
                }
            },
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 },
                    amount: { $sum: '$amount' }
                }
            }
        ]);

        const responseStats = stats[0] || {
            totalDeposits: 0,
            totalAmount: 0,
            totalBonus: 0,
            approvedDeposits: 0,
            approvedAmount: 0,
            pendingDeposits: 0,
            pendingAmount: 0,
            rejectedDeposits: 0
        };

        responseStats.today = todayStats[0] || { count: 0, amount: 0 };
        responseStats.weekly = weeklyStats[0] || { count: 0, amount: 0 };
        responseStats.monthly = monthlyStats[0] || { count: 0, amount: 0 };

        // Get deposits by status for chart
        const statusStats = await Deposit.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    amount: { $sum: '$amount' }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        res.json({
            success: true,
            data: {
                overview: responseStats,
                byStatus: statusStats
            }
        });
    } catch (error) {
        console.error('Get deposit stats error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while fetching deposit statistics' 
        });
    }
});

// UPDATE deposit status (approve/reject)
// Adminroute.put('/deposits/:id/status', authenticateAdmin,async (req, res) => {
//     try {
//         const { id } = req.params;
//         const { status, adminNotes } = req.body;
        
//         if (!mongoose.Types.ObjectId.isValid(id)) {
//             return res.status(400).json({ 
//                 success: false,
//                 error: 'Invalid deposit ID' 
//             });
//         }
        
//         // Validate status
//         if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
//             return res.status(400).json({ 
//                 success: false,
//                 error: 'Valid status is required: approved, rejected, or pending' 
//             });
//         }
        
//         // Find deposit
//         const deposit = await Deposit.findById(id);
//         if (!deposit) {
//             return res.status(404).json({ 
//                 success: false,
//                 error: 'Deposit not found' 
//             });
//         }
        
//         // Check if deposit is already in the requested status
//         if (deposit.status === status) {
//             return res.status(400).json({ 
//                 success: false,
//                 error: `Deposit is already ${status}` 
//             });
//         }
        
//         // If approving deposit, update user balance
//         if (status === 'approved' && deposit.status !== 'approved') {
//             const user = await User.findById(deposit.user);
//             if (user) {
//                 const totalAmount = deposit.amount + deposit.bonusAmount;
//                 user.balance += totalAmount;
//                 user.bonusbalance+=deposit.bonusAmount;
//                 user.totaldeposit += deposit.amount;
//                 user.depositCount = (user.depositCount || 0) + 1;
//                 user.lastDepositAt = new Date();
//                 await user.save();
//             }
//         }
        
//         // If changing from approved to something else, reverse the balance
//         if (deposit.status === 'approved' && status !== 'approved') {
//             const user = await User.findById(deposit.user);
//             if (user) {
//                 const totalAmount = deposit.amount + deposit.bonusAmount;
//                 user.balance -= totalAmount;
//                 user.totaldeposit -= deposit.amount;
//                 user.depositCount = Math.max(0, (user.depositCount || 0) - 1);
//                 await user.save();
//             }
//         }
        
//         // Update deposit
//         const updateData = {
//             status,
//             statusChangedBy: req.admin.id || req.admin._id,
//             statusChangedAt: new Date()
//         };
        
//         if (adminNotes) {
//             updateData.adminNotes = adminNotes;
//         }
        
//         const updatedDeposit = await Deposit.findByIdAndUpdate(
//             id,
//             updateData,
//             { new: true, runValidators: true }
//         ).populate('user', 'fullname email');
        
//         res.json({
//             success: true,
//             message: `Deposit status updated to ${status}`,
//             data: updatedDeposit
//         });
//     } catch (error) {
//         console.error('Update deposit status error:', error);
//         res.status(500).json({ 
//             success: false,
//             error: 'Server error while updating deposit status' 
//         });
//     }
// });


Subadminroute.put('/deposits/:id/status', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, adminNotes } = req.body;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid deposit ID' 
            });
        }
        
        // Validate status
        if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
            return res.status(400).json({ 
                success: false,
                error: 'Valid status is required: approved, rejected, or pending' 
            });
        }
        
        // Find deposit
        const deposit = await Deposit.findById(id);
        if (!deposit) {
            return res.status(404).json({ 
                success: false,
                error: 'Deposit not found' 
            });
        }
        
        // Check if deposit is already in the requested status
        if (deposit.status === status) {
            return res.status(400).json({ 
                success: false,
                error: `Deposit is already ${status}` 
            });
        }
        
        // Find active bonuses that match the deposit amount
        let applicableBonus = null;
        if (status === 'approved') {
            const activeBonuses = await Bonus.find({ 
                status: 'active',
                minimumDeposit: { $lte: deposit.amount }
            }).sort({ minimumDeposit: -1 }); // Get highest applicable bonus
            
            if (activeBonuses.length > 0) {
                applicableBonus = activeBonuses[0]; // Get the bonus with highest minimumDeposit that's <= deposit amount
                
                // Only apply if deposit amount hasn't already been bonused
                if (!deposit.bonusApplied) {
                    deposit.bonusAmount = applicableBonus.bonusAmount;
                    deposit.bonusApplied = true;
                    deposit.bonusId = applicableBonus._id;
                    deposit.bonusTitle = applicableBonus.title;
                }
            }
        }
        
        // If approving deposit, update user balance
        if (status === 'approved' && deposit.status !== 'approved') {
            const user = await User.findById(deposit.user);
            if (user) {
                const totalAmount = deposit.amount + (deposit.bonusAmount || 0);
                user.balance += totalAmount;
                
                // Add bonus amount to bonus balance if applicable
                if (deposit.bonusAmount && deposit.bonusAmount > 0) {
                    user.bonusbalance += deposit.bonusAmount;
                }
                
                user.totaldeposit += deposit.amount;
                user.depositCount = (user.depositCount || 0) + 1;
                user.lastDepositAt = new Date();
                await user.save();
            }
        }
        
        // If changing from approved to something else, reverse the balance
        if (deposit.status === 'approved' && status !== 'approved') {
            const user = await User.findById(deposit.user);
            if (user) {
                const totalAmount = deposit.amount + (deposit.bonusAmount || 0);
                user.balance -= totalAmount;
                
                // Remove bonus amount from bonus balance if applicable
                if (deposit.bonusAmount && deposit.bonusAmount > 0) {
                    user.bonusbalance = Math.max(0, user.bonusbalance - deposit.bonusAmount);
                }
                
                user.totaldeposit -= deposit.amount;
                user.depositCount = Math.max(0, (user.depositCount || 0) - 1);
                await user.save();
            }
        }
        
        // Update deposit
        const updateData = {
            status,
            statusChangedBy: req.admin.id || req.admin._id,
            statusChangedAt: new Date()
        };
        
        // Include bonus data if applicable
        if (applicableBonus && !deposit.bonusApplied) {
            updateData.bonusAmount = applicableBonus.bonusAmount;
            updateData.bonusApplied = true;
            updateData.bonusId = applicableBonus._id;
            updateData.bonusTitle = applicableBonus.title;
        }
        
        if (adminNotes) {
            updateData.adminNotes = adminNotes;
        }
        
        const updatedDeposit = await Deposit.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('user', 'fullname email');
        
        res.json({
            success: true,
            message: `Deposit status updated to ${status}`,
            data: updatedDeposit
        });
    } catch (error) {
        console.error('Update deposit status error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while updating deposit status' 
        });
    }
});

// Approve deposit (shortcut route)
Subadminroute.post('/deposits/:id/approve', authenticateAdmin,async (req, res) => {
    try {
        const { id } = req.params;
        const { adminNotes } = req.body;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid deposit ID' 
            });
        }
        
        const deposit = await Deposit.findById(id);
        if (!deposit) {
            return res.status(404).json({ 
                success: false,
                error: 'Deposit not found' 
            });
        }
        
        if (deposit.status === 'approved') {
            return res.status(400).json({ 
                success: false,
                error: 'Deposit is already approved' 
            });
        }
        
        // Update user balance
        const user = await User.findById(deposit.user);
        if (user) {
            const totalAmount = deposit.amount + deposit.bonusAmount;
            user.balance += totalAmount;
            user.totaldeposit += deposit.amount;
            user.depositCount = (user.depositCount || 0) + 1;
            user.lastDepositAt = new Date();
            await user.save();
        }
        
        // Update deposit
        const updateData = {
            status: 'approved',
            statusChangedBy: req.admin.id || req.admin._id,
            statusChangedAt: new Date()
        };
        
        if (adminNotes) {
            updateData.adminNotes = adminNotes;
        }
        
        const updatedDeposit = await Deposit.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('user', 'fullname email');
        
        res.json({
            success: true,
            message: 'Deposit approved successfully',
            data: updatedDeposit
        });
    } catch (error) {
        console.error('Approve deposit error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while approving deposit' 
        });
    }
});

// Reject deposit (shortcut route)
Subadminroute.post('/deposits/:id/reject', authenticateAdmin,async (req, res) => {
    try {
        const { id } = req.params;
        const { adminNotes } = req.body;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid deposit ID' 
            });
        }
        
        const deposit = await Deposit.findById(id);
        if (!deposit) {
            return res.status(404).json({ 
                success: false,
                error: 'Deposit not found' 
            });
        }
        
        if (deposit.status === 'rejected') {
            return res.status(400).json({ 
                success: false,
                error: 'Deposit is already rejected' 
            });
        }
        
        // If deposit was previously approved, reverse the balance
        if (deposit.status === 'approved') {
            const user = await User.findById(deposit.user);
            if (user) {
                const totalAmount = deposit.amount + deposit.bonusAmount;
                user.balance -= totalAmount;
                user.totaldeposit -= deposit.amount;
                user.depositCount = Math.max(0, (user.depositCount || 0) - 1);
                await user.save();
            }
        }
        
        // Update deposit
        const updateData = {
            status: 'rejected',
            statusChangedBy: req.admin.id || req.admin._id,
            statusChangedAt: new Date()
        };
        
        if (adminNotes) {
            updateData.adminNotes = adminNotes;
        }
        
        const updatedDeposit = await Deposit.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('user', 'fullname email');
        
        res.json({
            success: true,
            message: 'Deposit rejected successfully',
            data: updatedDeposit
        });
    } catch (error) {
        console.error('Reject deposit error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while rejecting deposit' 
        });
    }
});

// POST - Admin can create deposit for user (manual deposit)
Subadminroute.post('/deposits', authenticateAdmin,async (req, res) => {
    try {
        const {
            userId,
            depositMethodId,
            accountNumber,
            transactionId,
            amount,
            bonusAmount = 0,
            status = 'approved',
            adminNotes
        } = req.body;

        // Validation
        if (!userId) {
            return res.status(400).json({
                success: false,
                error: "User ID is required"
            });
        }

        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({
                success: false,
                error: "Valid amount is required"
            });
        }

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: "User not found"
            });
        }

        // Check deposit method if provided
        let depositMethod = null;
        if (depositMethodId) {
            depositMethod = await DepositMethod.findById(depositMethodId);
            if (!depositMethod) {
                return res.status(404).json({
                    success: false,
                    error: "Deposit method not found"
                });
            }
        }

        // Create transaction ID if not provided
        const finalTransactionId = transactionId || `ADMIN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Create deposit
        const deposit = new Deposit({
            user: userId,
            depositMethod: depositMethodId || null,
            accountNumber: accountNumber || 'Admin Manual',
            transactionId: finalTransactionId,
            amount: parseFloat(amount),
            bonusAmount: parseFloat(bonusAmount),
            status: status || 'approved',
            adminNotes: adminNotes || 'Created by admin',
            statusChangedBy: req.admin.id || req.admin._id,
            statusChangedAt: new Date()
        });

        await deposit.save();

        // If deposit is approved, update user balance
        if (status === 'approved') {
            const totalAmount = deposit.amount + deposit.bonusAmount;
            user.balance += totalAmount;
            user.totaldeposit += deposit.amount;
            user.depositCount = (user.depositCount || 0) + 1;
            user.lastDepositAt = new Date();
            await user.save();
        }

        // Populate response
        const populatedDeposit = await Deposit.findById(deposit._id)
            .populate('user', 'fullname email')
            .populate('depositMethod', 'name');

        res.status(201).json({
            success: true,
            message: 'Deposit created successfully',
            data: populatedDeposit
        });

    } catch (error) {
        console.error('Create deposit error:', error);
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                error: "Transaction ID already exists"
            });
        }
        res.status(500).json({
            success: false,
            error: 'Failed to create deposit',
            details: error.message
        });
    }
});

// DELETE deposit by ID
Subadminroute.delete('/deposits/:id', authenticateAdmin,async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid deposit ID' 
            });
        }
        
        const deposit = await Deposit.findById(id);
        if (!deposit) {
            return res.status(404).json({ 
                success: false,
                error: 'Deposit not found' 
            });
        }
        
        // If deposit is approved, reverse the user balance
        if (deposit.status === 'approved') {
            const user = await User.findById(deposit.user);
            if (user) {
                const totalAmount = deposit.amount + deposit.bonusAmount;
                user.balance -= totalAmount;
                user.totaldeposit -= deposit.amount;
                user.depositCount = Math.max(0, (user.depositCount || 0) - 1);
                await user.save();
            }
        }
        
        // Delete deposit
        await Deposit.findByIdAndDelete(id);
        
        res.json({
            success: true,
            message: 'Deposit deleted successfully'
        });
    } catch (error) {
        console.error('Delete deposit error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while deleting deposit' 
        });
    }
});

// UPDATE deposit (admin can edit deposit details)
Subadminroute.put('/deposits/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            accountNumber,
            transactionId,
            amount,
            bonusAmount,
            depositMethodId,
            userNotes,
            adminNotes
        } = req.body;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid deposit ID' 
            });
        }
        
        const deposit = await Deposit.findById(id);
        if (!deposit) {
            return res.status(404).json({ 
                success: false,
                error: 'Deposit not found' 
            });
        }
        
        // Build update object
        const updateData = {};
        if (accountNumber) updateData.accountNumber = accountNumber;
        if (transactionId) {
            // Check for duplicate transaction ID
            const existingDeposit = await Deposit.findOne({ 
                transactionId: transactionId.trim(),
                _id: { $ne: id } 
            });
            if (existingDeposit) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Transaction ID already used' 
                });
            }
            updateData.transactionId = transactionId.trim();
        }
        if (amount !== undefined) updateData.amount = Number(amount);
        if (bonusAmount !== undefined) updateData.bonusAmount = Number(bonusAmount);
        if (depositMethodId) {
            if (mongoose.Types.ObjectId.isValid(depositMethodId)) {
                updateData.depositMethod = depositMethodId;
            }
        }
        if (userNotes !== undefined) updateData.userNotes = userNotes;
        if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
        
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ 
                success: false,
                error: 'No data provided for update' 
            });
        }
        
        const updatedDeposit = await Deposit.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('user', 'fullname email')
         .populate('depositMethod', 'name');
        
        res.json({
            success: true,
            message: 'Deposit updated successfully',
            data: updatedDeposit
        });
    } catch (error) {
        console.error('Update deposit error:', error);
        
        if (error.code === 11000) {
            return res.status(400).json({ 
                success: false,
                error: 'Transaction ID already exists' 
            });
        }
        
        res.status(500).json({ 
            success: false,
            error: 'Server error while updating deposit' 
        });
    }
});

// GET deposits by user ID
Subadminroute.get('/users/:userId/deposits', authenticateAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        const { status, startDate, endDate, limit = 50 } = req.query;
        
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid user ID' 
            });
        }
        
        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ 
                success: false,
                error: 'User not found' 
            });
        }
        
        // Build filter
        const filter = { user: userId };
        
        if (status && ['pending', 'approved', 'rejected'].includes(status)) {
            filter.status = status;
        }
        
        // Date range filter
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) {
                filter.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                filter.createdAt.$lte = new Date(endDate);
            }
        }
        
        const deposits = await Deposit.find(filter)
            .populate('depositMethod', 'name')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));
        
        // Calculate user deposit totals
        const totals = await Deposit.aggregate([
            { $match: { user: user._id } },
            { $group: {
                _id: null,
                totalAmount: { $sum: '$amount' },
                totalBonus: { $sum: '$bonusAmount' },
                approvedAmount: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, '$amount', 0] } },
                totalCount: { $sum: 1 }
            }}
        ]);
        
        const totalsData = totals[0] || {
            totalAmount: 0,
            totalBonus: 0,
            approvedAmount: 0,
            totalCount: 0
        };
        
        res.json({
            success: true,
            data: {
                user: {
                    _id: user._id,
                    fullname: user.fullname,
                    email: user.email,
                    balance: user.balance,
                    totaldeposit: user.totaldeposit
                },
                deposits,
                totals: totalsData
            }
        });
    } catch (error) {
        console.error('Get user deposits error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while fetching user deposits' 
        });
    }
});

// Bulk approve deposits
Subadminroute.post('/deposits/bulk-approve', authenticateAdmin,async (req, res) => {
    try {
        const { depositIds } = req.body;
        
        if (!depositIds || !Array.isArray(depositIds) || depositIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Array of deposit IDs is required'
            });
        }
        
        // Validate all IDs
        const validIds = depositIds.filter(id => mongoose.Types.ObjectId.isValid(id));
        if (validIds.length !== depositIds.length) {
            return res.status(400).json({
                success: false,
                error: 'Invalid deposit IDs found'
            });
        }
        
        // Find deposits
        const deposits = await Deposit.find({ 
            _id: { $in: validIds },
            status: 'pending'
        });
        
        if (deposits.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No pending deposits found to approve'
            });
        }
        
        // Process each deposit
        const approvedDeposits = [];
        const failedDeposits = [];
        
        for (const deposit of deposits) {
            try {
                // Update user balance
                const user = await User.findById(deposit.user);
                if (user) {
                    const totalAmount = deposit.amount + deposit.bonusAmount;
                    user.balance += totalAmount;
                    user.totaldeposit += deposit.amount;
                    user.depositCount = (user.depositCount || 0) + 1;
                    user.lastDepositAt = new Date();
                    await user.save();
                }
                
                // Update deposit
                deposit.status = 'approved';
                deposit.statusChangedBy = req.admin.id || req.admin._id;
                deposit.statusChangedAt = new Date();
                await deposit.save();
                
                approvedDeposits.push(deposit._id);
            } catch (error) {
                console.error(`Failed to approve deposit ${deposit._id}:`, error);
                failedDeposits.push({
                    id: deposit._id,
                    error: error.message
                });
            }
        }
        
        res.json({
            success: true,
            message: `Successfully approved ${approvedDeposits.length} deposit(s)`,
            data: {
                approved: approvedDeposits,
                failed: failedDeposits,
                totalProcessed: deposits.length
            }
        });
    } catch (error) {
        console.error('Bulk approve deposits error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while bulk approving deposits'
        });
    }
});

// Bulk reject deposits
Subadminroute.post('/deposits/bulk-reject', authenticateAdmin, async (req, res) => {
    try {
        const { depositIds, adminNotes } = req.body;
        
        if (!depositIds || !Array.isArray(depositIds) || depositIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Array of deposit IDs is required'
            });
        }
        
        // Validate all IDs
        const validIds = depositIds.filter(id => mongoose.Types.ObjectId.isValid(id));
        if (validIds.length !== depositIds.length) {
            return res.status(400).json({
                success: false,
                error: 'Invalid deposit IDs found'
            });
        }
        
        // Update deposits
        const result = await Deposit.updateMany(
            { 
                _id: { $in: validIds },
                status: 'pending'
            },
            {
                status: 'rejected',
                statusChangedBy: req.admin.id || req.admin._id,
                statusChangedAt: new Date(),
                adminNotes: adminNotes || 'Bulk rejected by admin'
            }
        );
        
        res.json({
            success: true,
            message: `Successfully rejected ${result.modifiedCount} pending deposit(s)`,
            data: {
                modifiedCount: result.modifiedCount
            }
        });
    } catch (error) {
        console.error('Bulk reject deposits error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while bulk rejecting deposits'
        });
    }
});



// ==================== SERVICE MANAGEMENT ROUTES ====================

// GET all services (with filtering, pagination, and sorting)
Subadminroute.get('/services', authenticateAdmin, async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            workStatus,
            workType,
            search,
            isFeatured,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build filter
        const filter = {};
        
        if (workStatus && ['active', 'inactive', 'pending', 'completed'].includes(workStatus)) {
            filter.workStatus = workStatus;
        }
        
        if (workType && ['hourly', 'fixed', 'project', 'monthly', 'custom'].includes(workType)) {
            filter.workType = workType;
        }
        
        if (isFeatured === 'true' || isFeatured === 'false') {
            filter.isFeatured = isFeatured === 'true';
        }
        
        // Search in workName, workNameEnglish, or field names
        if (search) {
            filter.$or = [
                { workName: { $regex: search, $options: 'i' } },
                { workNameEnglish: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { 'fieldNames.name': { $regex: search, $options: 'i' } },
                { 'fieldNames.placeholder': { $regex: search, $options: 'i' } }
            ];
        }

        // Calculate pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Build sort
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Get total count
        const total = await Service.countDocuments(filter);

        // Get services
        const services = await Service.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limitNum);

        res.json({
            success: true,
            data: services,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                pages: Math.ceil(total / limitNum)
            }
        });

    } catch (error) {
        console.error('Get services error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while fetching services' 
        });
    }
});

// GET active services
Subadminroute.get('/services/active', authenticateAdmin, async (req, res) => {
    try {
        const services = await Service.getActiveServices();
        
        res.json({
            success: true,
            count: services.length,
            data: services
        });
    } catch (error) {
        console.error('Get active services error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while fetching active services' 
        });
    }
});

// GET featured services
Subadminroute.get('/services/featured', authenticateAdmin, async (req, res) => {
    try {
        const services = await Service.getFeaturedServices();
        
        res.json({
            success: true,
            count: services.length,
            data: services
        });
    } catch (error) {
        console.error('Get featured services error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while fetching featured services' 
        });
    }
});

// GET single service by ID
Subadminroute.get('/services/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid service ID' 
            });
        }
        
        const service = await Service.findById(id);
        
        if (!service) {
            return res.status(404).json({ 
                success: false,
                error: 'Service not found' 
            });
        }
        
        res.json({
            success: true,
            data: service
        });
    } catch (error) {
        console.error('Get service by ID error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error' 
        });
    }
});

// CREATE new service
Subadminroute.post('/services', authenticateAdmin,async (req, res) => {
    try {
        const { 
            workName, 
            workNameEnglish, 
            workRate, 
            workType,
            workStatus = 'active',
            fieldNames,
            description,
            isFeatured = false,
            order = 0
        } = req.body;
        
        // Validation
        if (!workName || !workNameEnglish || !workRate || !workType) {
            return res.status(400).json({ 
                success: false,
                error: 'Work name, work name in English, work rate, and work type are required' 
            });
        }
        
        if (!fieldNames || !Array.isArray(fieldNames) || fieldNames.length === 0) {
            return res.status(400).json({ 
                success: false,
                error: 'Field names array is required with at least one field' 
            });
        }
        
        // Validate each field in fieldNames
        const validatedFieldNames = [];
        for (const field of fieldNames) {
            if (!field.name || !field.name.trim()) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Field name is required for all fields' 
                });
            }
            
            if (!field.placeholder || !field.placeholder.trim()) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Field placeholder is required for all fields' 
                });
            }
            
            validatedFieldNames.push({
                name: field.name.trim(),
                placeholder: field.placeholder.trim()
            });
        }
        
        if (workRate < 0) {
            return res.status(400).json({ 
                success: false,
                error: 'Work rate cannot be negative' 
            });
        }
        
        // Create new service
        const serviceData = {
            workName: workName.trim(),
            workNameEnglish: workNameEnglish.trim(),
            workRate: Number(workRate),
            workType: workType.trim(),
            workStatus: workStatus || 'active',
            fieldNames: validatedFieldNames,
            isFeatured: isFeatured === true || isFeatured === 'true',
            order: Number(order) || 0
        };
        
        if (description) serviceData.description = description.trim();
        
        const newService = new Service(serviceData);
        await newService.save();
        
        res.status(201).json({
            success: true,
            message: 'Service created successfully',
            data: newService
        });
    } catch (error) {
        console.error('Create service error:', error);
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ 
                success: false,
                error: 'Validation failed',
                details: errors 
            });
        }
        
        // Handle duplicate key error (if you add unique constraints later)
        if (error.code === 11000) {
            return res.status(400).json({ 
                success: false,
                error: 'Service with this name already exists' 
            });
        }
        
        res.status(500).json({ 
            success: false,
            error: 'Server error while creating service' 
        });
    }
});

// UPDATE service by ID
Subadminroute.put('/services/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            workName, 
            workNameEnglish, 
            workRate, 
            workType,
            workStatus,
            fieldNames,
            description,
            isFeatured,
            order
        } = req.body;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid service ID' 
            });
        }
        
        // Check if service exists
        const service = await Service.findById(id);
        if (!service) {
            return res.status(404).json({ 
                success: false,
                error: 'Service not found' 
            });
        }
        
        // Build update object
        const updateData = {};
        if (workName) updateData.workName = workName.trim();
        if (workNameEnglish) updateData.workNameEnglish = workNameEnglish.trim();
        if (workRate !== undefined) {
            if (workRate < 0) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Work rate cannot be negative' 
                });
            }
            updateData.workRate = Number(workRate);
        }
        if (workType) updateData.workType = workType.trim();
        if (workStatus && ['active', 'inactive', 'pending', 'completed'].includes(workStatus)) {
            updateData.workStatus = workStatus;
        }
        if (fieldNames && Array.isArray(fieldNames)) {
            // Validate each field in fieldNames
            const validatedFieldNames = [];
            for (const field of fieldNames) {
                if (!field.name || !field.name.trim()) {
                    return res.status(400).json({ 
                        success: false,
                        error: 'Field name is required for all fields' 
                    });
                }
                
                if (!field.placeholder || !field.placeholder.trim()) {
                    return res.status(400).json({ 
                        success: false,
                        error: 'Field placeholder is required for all fields' 
                    });
                }
                
                validatedFieldNames.push({
                    name: field.name.trim(),
                    placeholder: field.placeholder.trim()
                });
            }
            
            if (validatedFieldNames.length > 0) {
                updateData.fieldNames = validatedFieldNames;
            }
        }
        if (description !== undefined) updateData.description = description.trim();
        if (isFeatured !== undefined) updateData.isFeatured = isFeatured === true || isFeatured === 'true';
        if (order !== undefined) updateData.order = Number(order);
        
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ 
                success: false,
                error: 'No data provided for update' 
            });
        }
        
        // Update service
        const updatedService = await Service.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );
        
        res.json({
            success: true,
            message: 'Service updated successfully',
            data: updatedService
        });
    } catch (error) {
        console.error('Update service error:', error);
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ 
                success: false,
                error: 'Validation failed',
                details: errors 
            });
        }
        
        // Handle duplicate key error (if you add unique constraints later)
        if (error.code === 11000) {
            return res.status(400).json({ 
                success: false,
                error: 'Service with this name already exists' 
            });
        }
        
        res.status(500).json({ 
            success: false,
            error: 'Server error while updating service' 
        });
    }
});

// ADD field to service
Subadminroute.post('/services/:id/fields', authenticateAdmin,async (req, res) => {
    try {
        const { id } = req.params;
        const { name, placeholder } = req.body;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid service ID' 
            });
        }
        
        if (!name || !name.trim()) {
            return res.status(400).json({ 
                success: false,
                error: 'Field name is required' 
            });
        }
        
        if (!placeholder || !placeholder.trim()) {
            return res.status(400).json({ 
                success: false,
                error: 'Field placeholder is required' 
            });
        }
        
        const service = await Service.findById(id);
        if (!service) {
            return res.status(404).json({ 
                success: false,
                error: 'Service not found' 
            });
        }
        
        // Add new field to fieldNames array
        service.fieldNames.push({
            name: name.trim(),
            placeholder: placeholder.trim()
        });
        
        await service.save();
        
        res.json({
            success: true,
            message: 'Field added successfully',
            data: service
        });
    } catch (error) {
        console.error('Add field error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while adding field' 
        });
    }
});

// UPDATE field in service
Subadminroute.put('/services/:id/fields/:fieldIndex', authenticateAdmin,async (req, res) => {
    try {
        const { id, fieldIndex } = req.params;
        const { name, placeholder } = req.body;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid service ID' 
            });
        }
        
        const index = parseInt(fieldIndex);
        if (isNaN(index) || index < 0) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid field index' 
            });
        }
        
        const service = await Service.findById(id);
        if (!service) {
            return res.status(404).json({ 
                success: false,
                error: 'Service not found' 
            });
        }
        
        if (index >= service.fieldNames.length) {
            return res.status(400).json({ 
                success: false,
                error: 'Field index out of bounds' 
            });
        }
        
        // Update field
        if (name && name.trim()) {
            service.fieldNames[index].name = name.trim();
        }
        
        if (placeholder && placeholder.trim()) {
            service.fieldNames[index].placeholder = placeholder.trim();
        }
        
        await service.save();
        
        res.json({
            success: true,
            message: 'Field updated successfully',
            data: service
        });
    } catch (error) {
        console.error('Update field error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while updating field' 
        });
    }
});

// REMOVE field from service
Subadminroute.delete('/services/:id/fields/:fieldIndex', authenticateAdmin,async (req, res) => {
    try {
        const { id, fieldIndex } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid service ID' 
            });
        }
        
        const index = parseInt(fieldIndex);
        if (isNaN(index) || index < 0) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid field index' 
            });
        }
        
        const service = await Service.findById(id);
        if (!service) {
            return res.status(404).json({ 
                success: false,
                error: 'Service not found' 
            });
        }
        
        if (index >= service.fieldNames.length) {
            return res.status(400).json({ 
                success: false,
                error: 'Field index out of bounds' 
            });
        }
        
        // Check if removing last field
        if (service.fieldNames.length <= 1) {
            return res.status(400).json({ 
                success: false,
                error: 'Cannot remove the last field. Service must have at least one field.' 
            });
        }
        
        // Remove field from array
        service.fieldNames.splice(index, 1);
        await service.save();
        
        res.json({
            success: true,
            message: 'Field removed successfully',
            data: service
        });
    } catch (error) {
        console.error('Remove field error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while removing field' 
        });
    }
});

// REORDER fields in service
Subadminroute.put('/services/:id/fields/reorder', authenticateAdmin,async (req, res) => {
    try {
        const { id } = req.params;
        const { fieldNames } = req.body;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid service ID' 
            });
        }
        
        if (!fieldNames || !Array.isArray(fieldNames) || fieldNames.length === 0) {
            return res.status(400).json({ 
                success: false,
                error: 'Array of fields is required' 
            });
        }
        
        const service = await Service.findById(id);
        if (!service) {
            return res.status(404).json({ 
                success: false,
                error: 'Service not found' 
            });
        }
        
        // Update fieldNames array
        service.fieldNames = fieldNames;
        await service.save();
        
        res.json({
            success: true,
            message: 'Fields reordered successfully',
            data: service
        });
    } catch (error) {
        console.error('Reorder fields error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while reordering fields' 
        });
    }
});

// DELETE service by ID
Subadminroute.delete('/services/:id', authenticateAdmin,async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid service ID' 
            });
        }
        
        // Check if service exists
        const service = await Service.findById(id);
        if (!service) {
            return res.status(404).json({ 
                success: false,
                error: 'Service not found' 
            });
        }
        
        // Delete service
        await Service.findByIdAndDelete(id);
        
        res.json({
            success: true,
            message: 'Service deleted successfully'
        });
    } catch (error) {
        console.error('Delete service error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while deleting service' 
        });
    }
});

// TOGGLE service status (active/inactive)
Subadminroute.patch('/services/:id/toggle-status', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid service ID' 
            });
        }
        
        // Check if service exists
        const service = await Service.findById(id);
        if (!service) {
            return res.status(404).json({ 
                success: false,
                error: 'Service not found' 
            });
        }
        
        // Toggle between active and inactive
        const newStatus = service.workStatus === 'active' ? 'inactive' : 'active';
        
        // Update status
        const updatedService = await Service.findByIdAndUpdate(
            id,
            { workStatus: newStatus },
            { new: true }
        );
        
        res.json({
            success: true,
            message: `Service status changed from ${service.workStatus} to ${newStatus}`,
            data: updatedService
        });
    } catch (error) {
        console.error('Toggle service status error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while toggling service status' 
        });
    }
});

// TOGGLE featured status
Subadminroute.patch('/services/:id/toggle-featured', authenticateAdmin,async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid service ID' 
            });
        }
        
        // Check if service exists
        const service = await Service.findById(id);
        if (!service) {
            return res.status(404).json({ 
                success: false,
                error: 'Service not found' 
            });
        }
        
        // Toggle featured status
        const newFeaturedStatus = !service.isFeatured;
        
        // Update featured status
        const updatedService = await Service.findByIdAndUpdate(
            id,
            { isFeatured: newFeaturedStatus },
            { new: true }
        );
        
        res.json({
            success: true,
            message: `Service featured status changed to ${newFeaturedStatus ? 'featured' : 'not featured'}`,
            data: updatedService
        });
    } catch (error) {
        console.error('Toggle service featured status error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while toggling featured status' 
        });
    }
});

// GET service statistics
Subadminroute.get('/services/stats/overview', authenticateAdmin,async (req, res) => {
    try {
        const stats = await Service.aggregate([
            {
                $group: {
                    _id: null,
                    totalServices: { $sum: 1 },
                    activeServices: { 
                        $sum: { $cond: [{ $eq: ["$workStatus", "active"] }, 1, 0] } 
                    },
                    inactiveServices: { 
                        $sum: { $cond: [{ $eq: ["$workStatus", "inactive"] }, 1, 0] } 
                    },
                    pendingServices: { 
                        $sum: { $cond: [{ $eq: ["$workStatus", "pending"] }, 1, 0] } 
                    },
                    featuredServices: { 
                        $sum: { $cond: ["$isFeatured", 1, 0] } 
                    },
                    totalWorkRate: { $sum: "$workRate" },
                    avgWorkRate: { $avg: "$workRate" },
                    minWorkRate: { $min: "$workRate" },
                    maxWorkRate: { $max: "$workRate" },
                    totalFields: { 
                        $sum: { $size: "$fieldNames" }
                    },
                    avgFieldsPerService: { 
                        $avg: { $size: "$fieldNames" }
                    }
                }
            }
        ]);
        
        // Get services by work type
        const typeStats = await Service.aggregate([
            {
                $group: {
                    _id: "$workType",
                    count: { $sum: 1 },
                    avgRate: { $avg: "$workRate" },
                    avgFields: { $avg: { $size: "$fieldNames" } }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);
        
        const responseStats = stats[0] || {
            totalServices: 0,
            activeServices: 0,
            inactiveServices: 0,
            pendingServices: 0,
            featuredServices: 0,
            totalWorkRate: 0,
            avgWorkRate: 0,
            minWorkRate: 0,
            maxWorkRate: 0,
            totalFields: 0,
            avgFieldsPerService: 0
        };
        
        res.json({
            success: true,
            data: {
                overview: responseStats,
                byType: typeStats
            }
        });
    } catch (error) {
        console.error('Get service stats error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while fetching service statistics' 
        });
    }
});

// GET services by work type
Subadminroute.get('/services/type/:workType', authenticateAdmin, async (req, res) => {
    try {
        const { workType } = req.params;
        const { status = 'active' } = req.query;
        
        const validWorkTypes = ['hourly', 'fixed', 'project', 'monthly', 'custom'];
        if (!validWorkTypes.includes(workType)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid work type. Must be one of: hourly, fixed, project, monthly, custom' 
            });
        }
        
        const filter = { workType };
        
        if (status && ['active', 'inactive', 'pending', 'completed'].includes(status)) {
            filter.workStatus = status;
        }
        
        const services = await Service.find(filter)
            .sort({ order: 1, createdAt: -1 });
        
        res.json({
            success: true,
            count: services.length,
            data: services
        });
    } catch (error) {
        console.error('Get services by type error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while fetching services by type' 
        });
    }
});

// REORDER services (update order for multiple services)
Subadminroute.put('/services/reorder', authenticateAdmin,async (req, res) => {
    try {
        const { services } = req.body;
        
        if (!services || !Array.isArray(services) || services.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Array of services with ids and orders is required'
            });
        }
        
        const updatePromises = services.map(service => 
            Service.findByIdAndUpdate(
                service.id,
                { order: service.order },
                { new: true }
            )
        );
        
        await Promise.all(updatePromises);
        
        res.json({
            success: true,
            message: 'Services reordered successfully'
        });
    } catch (error) {
        console.error('Reorder services error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while reordering services'
        });
    }
});

// BULK update services status
Subadminroute.put('/services/bulk/status', authenticateAdmin, async (req, res) => {
    try {
        const { serviceIds, workStatus } = req.body;
        
        if (!serviceIds || !Array.isArray(serviceIds) || serviceIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Array of service IDs is required'
            });
        }
        
        if (!workStatus || !['active', 'inactive', 'pending', 'completed'].includes(workStatus)) {
            return res.status(400).json({
                success: false,
                error: 'Valid work status is required: active, inactive, pending, or completed'
            });
        }
        
        // Validate all IDs
        const validIds = serviceIds.filter(id => mongoose.Types.ObjectId.isValid(id));
        if (validIds.length !== serviceIds.length) {
            return res.status(400).json({
                success: false,
                error: 'Invalid service IDs found'
            });
        }
        
        // Update services
        const result = await Service.updateMany(
            { _id: { $in: validIds } },
            { workStatus }
        );
        
        res.json({
            success: true,
            message: `Successfully updated ${result.modifiedCount} service(s) to ${workStatus}`,
            data: {
                modifiedCount: result.modifiedCount
            }
        });
    } catch (error) {
        console.error('Bulk update services status error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while bulk updating services status'
        });
    }
});

// DELETE all services (optional - for superadmin only)
Subadminroute.delete('/services', authenticateAdmin,async (req, res) => {
    try {
        const { confirmation } = req.body;
        
        // Optional confirmation for safety
        if (!confirmation || confirmation !== 'DELETE_ALL_SERVICES') {
            return res.status(400).json({
                success: false,
                error: 'Confirmation phrase is required. Send confirmation: "DELETE_ALL_SERVICES" in the request body.'
            });
        }
        
        // Get count of services before deletion
        const totalServices = await Service.countDocuments();
        
        if (totalServices === 0) {
            return res.status(404).json({
                success: false,
                error: 'No services found to delete'
            });
        }
        
        // Delete all services
        const result = await Service.deleteMany({});
        
        res.json({
            success: true,
            message: `Successfully deleted ${result.deletedCount} services`,
            data: {
                deletedCount: result.deletedCount,
                totalServicesBeforeDeletion: totalServices
            }
        });
        
    } catch (error) {
        console.error('Delete all services error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while deleting all services'
        });
    }
});

// GET service field names by ID (for form generation)
Subadminroute.get('/services/:id/fields', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid service ID' 
            });
        }
        
        const service = await Service.findById(id).select('fieldNames workName workNameEnglish');
        
        if (!service) {
            return res.status(404).json({ 
                success: false,
                error: 'Service not found' 
            });
        }
        
        res.json({
            success: true,
            data: {
                workName: service.workName,
                workNameEnglish: service.workNameEnglish,
                fieldNames: service.fieldNames
            }
        });
    } catch (error) {
        console.error('Get service fields error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while fetching service fields' 
        });
    }
});

// Add at the top with other imports (after Service import)

const orderUploadDir = path.join(__dirname, '../public/uploads/orders/outputs');
if (!fs.existsSync(orderUploadDir)) {
    fs.mkdirSync(orderUploadDir, { recursive: true });
}

// Multer configuration for PDF files
const orderFileStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, orderUploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'order-output-' + uniqueSuffix + ext);
    }
});

// File filter for PDF only
const orderFileFilter = (req, file, cb) => {
    const allowedTypes = /pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only PDF files are allowed'));
    }
};

const uploadOrderFile = multer({
    storage: orderFileStorage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: orderFileFilter
});

// Helper function to delete old PDF files
const deleteOldOrderFile = async (filePath) => {
    if (filePath) {
        const fullPath = path.join(__dirname, '..', filePath);
        try {
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
                console.log(`Deleted old order file: ${fullPath}`);
            }
        } catch (error) {
            console.error('Error deleting old order file:', error);
        }
    }
};

// ==================== ORDER FILE/TEXT SUBMISSION ROUTES ====================

Subadminroute.post('/orders/:id/submit-pdf', 
    authenticateAdmin,
    uploadOrderFile.single('pdfFile'),
    async (req, res) => {
        try {
            const { id } = req.params;
            const { adminNotes } = req.body;
            
            if (!mongoose.Types.ObjectId.isValid(id)) {
                // Delete uploaded file if invalid ID
                if (req.file) {
                    fs.unlinkSync(req.file.path);
                }
                return res.status(400).json({ 
                    success: false,
                    error: 'Invalid order ID' 
                });
            }
            
            // Find order
            const order = await Order.findById(id);
            if (!order) {
                // Delete uploaded file if order not found
                if (req.file) {
                    fs.unlinkSync(req.file.path);
                }
                return res.status(404).json({ 
                    success: false,
                    error: 'Order not found' 
                });
            }
            
            // Check if order type is PDF
            if (order.orderType !== 'pdf_file') {
                if (req.file) {
                    fs.unlinkSync(req.file.path);
                }
                return res.status(400).json({ 
                    success: false,
                    error: 'This order is not a PDF file order. Order type is: ' + order.orderType 
                });
            }
            
            // Check if file was uploaded
            if (!req.file) {
                return res.status(400).json({ 
                    success: false,
                    error: 'PDF file is required' 
                });
            }
            
            // Store old file path for cleanup
            const oldFilePath = order.adminPdfFile?.filePath;
            
            // Create file path relative to server root
            const filePath = '/uploads/orders/outputs/' + req.file.filename;
            
            // Update order with PDF file information
            const updateData = {
                adminPdfFile: {
                    fileName: req.file.filename,
                    filePath: filePath,
                    fileSize: req.file.size,
                    uploadedAt: new Date(),
                    uploadedBy: req.admin.id || req.admin._id
                },
                version: order.version + 1,
                textSubmittedAt: null,
                textSubmittedBy: null,
                adminTextContent: '' // Clear text content if exists
            };
            
            if (adminNotes) {
                updateData.adminNotes = adminNotes;
                updateData.adminNotesUpdatedAt = new Date();
            }
            
            // If order was pending or processing, automatically mark as completed
            if (order.status === 'pending' || order.status === 'processing') {
                updateData.status = 'completed';
                updateData.completedAt = new Date();
                updateData.completedBy = req.admin.id || req.admin._id;
            }
            
            const updatedOrder = await Order.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            ).populate('user', 'fullname email')
             .populate('service', 'workName workNameEnglish');
            
            // Delete old file after successful update
            if (oldFilePath) {
                await deleteOldOrderFile(oldFilePath);
            }
            
            res.json({
                success: true,
                message: 'PDF file submitted successfully',
                data: updatedOrder
            });
        } catch (error) {
            console.error('Submit PDF for order error:', error);
            
            // Delete uploaded file if error occurs
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            
            // Handle multer errors
            if (error instanceof multer.MulterError) {
                if (error.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({
                        success: false,
                        error: 'File size too large. Maximum size is 10MB'
                    });
                }
                return res.status(400).json({
                    success: false,
                    error: error.message
                });
            }
            
            res.status(500).json({ 
                success: false,
                error: 'Server error while submitting PDF file' 
            });
        }
    }
);

// SUBMIT text content for order (for text file orders)
Subadminroute.post('/orders/:id/submit-text', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { adminTextContent, adminNotes } = req.body;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid order ID' 
            });
        }
        
        // Find order
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ 
                success: false,
                error: 'Order not found' 
            });
        }
        
        // Check if order type is text
        if (order.orderType !== 'text_file') {
            return res.status(400).json({ 
                success: false,
                error: 'This order is not a text file order. Order type is: ' + order.orderType 
            });
        }
        
        // Check if text content is provided
        if (!adminTextContent || adminTextContent.trim() === '') {
            return res.status(400).json({ 
                success: false,
                error: 'Text content is required' 
            });
        }
        
        // Store old PDF file path for cleanup if exists
        const oldFilePath = order.adminPdfFile?.filePath;
        
        // Update order with text content
        const updateData = {
            adminTextContent: adminTextContent.trim(),
            textSubmittedAt: new Date(),
            textSubmittedBy: req.admin.id || req.admin._id,
            adminPdfFile: null, // Clear PDF file if exists
            version: order.version + 1
        };
        
        if (adminNotes) {
            updateData.adminNotes = adminNotes;
            updateData.adminNotesUpdatedAt = new Date();
        }
        
        // If order was pending or processing, automatically mark as completed
        if (order.status === 'pending' || order.status === 'processing') {
            updateData.status = 'completed';
            updateData.completedAt = new Date();
            updateData.completedBy = req.admin.id || req.admin._id;
        }
        
        const updatedOrder = await Order.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('user', 'fullname email')
         .populate('service', 'workName workNameEnglish');
        
        // Delete old PDF file if exists
        if (oldFilePath) {
            await deleteOldOrderFile(oldFilePath);
        }
        
        res.json({
            success: true,
            message: 'Text content submitted successfully',
            data: updatedOrder
        });
    } catch (error) {
        console.error('Submit text for order error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while submitting text content' 
        });
    }
});

// UPDATE order admin notes
Subadminroute.put('/orders/:id/notes', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { adminNotes } = req.body;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid order ID' 
            });
        }
        
        // Find order
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ 
                success: false,
                error: 'Order not found' 
            });
        }
        
        if (!adminNotes && adminNotes !== '') {
            return res.status(400).json({ 
                success: false,
                error: 'Admin notes are required' 
            });
        }
        
        const updateData = {
            adminNotes: adminNotes,
            adminNotesUpdatedAt: new Date(),
            version: order.version + 1
        };
        
        const updatedOrder = await Order.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('user', 'fullname email')
         .populate('service', 'workName workNameEnglish');
        
        res.json({
            success: true,
            message: 'Admin notes updated successfully',
            data: updatedOrder
        });
    } catch (error) {
        console.error('Update order notes error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while updating admin notes' 
        });
    }
});

// DOWNLOAD order PDF file
Subadminroute.get('/orders/:id/download-pdf', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid order ID' 
            });
        }
        
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ 
                success: false,
                error: 'Order not found' 
            });
        }
        
        if (order.orderType !== 'pdf_file') {
            return res.status(400).json({ 
                success: false,
                error: 'This order does not have a PDF file' 
            });
        }
        
        if (!order.adminPdfFile || !order.adminPdfFile.filePath) {
            return res.status(404).json({ 
                success: false,
                error: 'No PDF file found for this order' 
            });
        }
        
        // Construct full path to file
        const filePath = path.join(__dirname, '..', order.adminPdfFile.filePath);
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ 
                success: false,
                error: 'PDF file not found on server' 
            });
        }
        
        // Set headers for file download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${order.adminPdfFile.fileName}"`);
        
        // Stream the file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
        
    } catch (error) {
        console.error('Download order PDF error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while downloading PDF file' 
        });
    }
});
// ==================== CANCEL ORDER ROUTE ====================

// CANCEL order - with cancellation reason validation
Subadminroute.post('/orders/:id/cancel', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { cancellationReason } = req.body;
        
        // Validate order ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid order ID' 
            });
        }
        
        // Validate cancellation reason is provided
        if (!cancellationReason || cancellationReason.trim() === '') {
            return res.status(400).json({ 
                success: false,
                error: 'Cancellation reason is required' 
            });
        }
        
        // Validate reason length (minimum 5 characters)
        if (cancellationReason.trim().length < 5) {
            return res.status(400).json({ 
                success: false,
                error: 'Cancellation reason must be at least 5 characters long' 
            });
        }
        
        // Find order
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ 
                success: false,
                error: 'Order not found' 
            });
        }
        
        // Check if order is already cancelled
        if (order.status === 'cancelled') {
            return res.status(400).json({ 
                success: false,
                error: 'Order is already cancelled' 
            });
        }
        
        // Check if order is completed
        if (order.status === 'completed') {
            return res.status(400).json({ 
                success: false,
                error: 'Cannot cancel a completed order' 
            });
        }
        
        // Update order to cancelled status
        const updateData = {
            status: 'cancelled',
            cancelledAt: new Date(),
            cancelledBy: req.admin.id || req.admin._id,
            cancellationReason: cancellationReason.trim(),
            version: order.version + 1
        };
        
        // If order was paid, consider refunding (optional)
        if (order.paymentStatus === 'paid') {
            // You can add refund logic here if needed
            // updateData.paymentStatus = 'refunded';
        }
        
        const updatedOrder = await Order.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        )
        .populate('user', 'fullname email')
        .populate('service', 'workName workNameEnglish')
        .populate('cancelledBy', 'username email fullname');
        
        res.json({
            success: true,
            message: 'Order cancelled successfully',
            data: updatedOrder
        });
    } catch (error) {
        console.error('Cancel order error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while cancelling order' 
        });
    }
});
// DELETE admin PDF file (remove uploaded PDF)
Subadminroute.delete('/orders/:id/pdf', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid order ID' 
            });
        }
        
        // Find order
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ 
                success: false,
                error: 'Order not found' 
            });
        }
        
        if (!order.adminPdfFile || !order.adminPdfFile.filePath) {
            return res.status(400).json({ 
                success: false,
                error: 'No PDF file exists for this order' 
            });
        }
        
        // Store file path for cleanup
        const filePath = order.adminPdfFile.filePath;
        
        // Update order to remove PDF file
        const updateData = {
            adminPdfFile: null,
            version: order.version + 1
        };
        
        const updatedOrder = await Order.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('user', 'fullname email')
         .populate('service', 'workName workNameEnglish');
        
        // Delete the file from storage
        await deleteOldOrderFile(filePath);
        
        res.json({
            success: true,
            message: 'PDF file removed successfully',
            data: updatedOrder
        });
    } catch (error) {
        console.error('Delete order PDF error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while deleting PDF file' 
        });
    }
});

// DELETE admin text content (clear submitted text)
Subadminroute.delete('/orders/:id/text', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid order ID' 
            });
        }
        
        // Find order
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ 
                success: false,
                error: 'Order not found' 
            });
        }
        
        if (!order.adminTextContent || order.adminTextContent.trim() === '') {
            return res.status(400).json({ 
                success: false,
                error: 'No text content exists for this order' 
            });
        }
        
        // Update order to clear text content
        const updateData = {
            adminTextContent: '',
            textSubmittedAt: null,
            textSubmittedBy: null,
            version: order.version + 1
        };
        
        const updatedOrder = await Order.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('user', 'fullname email')
         .populate('service', 'workName workNameEnglish');
        
        res.json({
            success: true,
            message: 'Text content cleared successfully',
            data: updatedOrder
        });
    } catch (error) {
        console.error('Delete order text error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while deleting text content' 
        });
    }
});

// COMPLETE order (mark as completed without file submission)
Subadminroute.post('/orders/:id/complete', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { adminNotes } = req.body;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid order ID' 
            });
        }
        
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ 
                success: false,
                error: 'Order not found' 
            });
        }
        
        if (order.status === 'completed') {
            return res.status(400).json({ 
                success: false,
                error: 'Order is already completed' 
            });
        }
        
        // Update order
        const updateData = {
            status: 'completed',
            completedAt: new Date(),
            completedBy: req.admin.id || req.admin._id,
            version: order.version + 1
        };
        
        if (adminNotes) {
            updateData.adminNotes = adminNotes;
            updateData.adminNotesUpdatedAt = new Date();
        }
        
        const updatedOrder = await Order.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('user', 'fullname email')
         .populate('service', 'workName workNameEnglish');
        
        res.json({
            success: true,
            message: 'Order marked as completed',
            data: updatedOrder
        });
    } catch (error) {
        console.error('Complete order error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while completing order' 
        });
    }
});

// GET order output (file or text based on order type)
Subadminroute.get('/orders/:id/output', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid order ID' 
            });
        }
        
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ 
                success: false,
                error: 'Order not found' 
            });
        }
        
        // Check what type of output is available
        let output = null;
        
        if (order.orderType === 'pdf_file' && order.adminPdfFile) {
            output = {
                type: 'pdf',
                fileName: order.adminPdfFile.fileName,
                filePath: order.adminPdfFile.filePath,
                fileSize: order.adminPdfFile.fileSize,
                uploadedAt: order.adminPdfFile.uploadedAt,
                downloadUrl: `${req.protocol}://${req.get('host')}/api/admin/orders/${id}/download-pdf`
            };
        } else if (order.orderType === 'text_file' && order.adminTextContent) {
            output = {
                type: 'text',
                content: order.adminTextContent,
                submittedAt: order.textSubmittedAt,
                characterCount: order.adminTextContent.length,
                wordCount: order.adminTextContent.trim().split(/\s+/).length
            };
        } else if (order.orderType === 'image_file' || order.orderType === 'document_file') {
            output = {
                type: order.orderType,
                message: 'For this order type, output is handled through admin notes',
                adminNotes: order.adminNotes,
                hasOutput: !!order.adminNotes
            };
        }
        
        res.json({
            success: true,
            data: {
                orderId: order.orderId,
                orderType: order.orderType,
                status: order.status,
                hasOutput: !!output,
                output: output,
                adminNotes: order.adminNotes
            }
        });
    } catch (error) {
        console.error('Get order output error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while fetching order output' 
        });
    }
});

// VIEW order PDF file (inline view)
Subadminroute.get('/orders/:id/view-pdf', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid order ID' 
            });
        }
        
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ 
                success: false,
                error: 'Order not found' 
            });
        }
        
        if (order.orderType !== 'pdf_file') {
            return res.status(400).json({ 
                success: false,
                error: 'This order does not have a PDF file' 
            });
        }
        
        if (!order.adminPdfFile || !order.adminPdfFile.filePath) {
            return res.status(404).json({ 
                success: false,
                error: 'No PDF file found for this order' 
            });
        }
        
        // Construct full path to file
        const filePath = path.join(__dirname, '..', order.adminPdfFile.filePath);
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ 
                success: false,
                error: 'PDF file not found on server' 
            });
        }
        
        // Set headers for inline viewing
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${order.adminPdfFile.fileName}"`);
        
        // Stream the file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
        
    } catch (error) {
        console.error('View order PDF error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while viewing PDF file' 
        });
    }
});

// UPDATE order with file/text based on order type (smart update)
Subadminroute.put('/orders/:id/submit-output', 
    authenticateAdmin,
    uploadOrderFile.single('pdfFile'),
    async (req, res) => {
        try {
            const { id } = req.params;
            const { adminTextContent, adminNotes } = req.body;
            
            if (!mongoose.Types.ObjectId.isValid(id)) {
                if (req.file) {
                    fs.unlinkSync(req.file.path);
                }
                return res.status(400).json({ 
                    success: false,
                    error: 'Invalid order ID' 
                });
            }
            
            // Find order
            const order = await Order.findById(id);
            if (!order) {
                if (req.file) {
                    fs.unlinkSync(req.file.path);
                }
                return res.status(404).json({ 
                    success: false,
                    error: 'Order not found' 
                });
            }
            
            // Determine update based on order type
            const updateData = {
                version: order.version + 1
            };
            
            // Store old file path for cleanup
            let oldFilePath = null;
            
            if (order.orderType === 'pdf_file') {
                if (!req.file) {
                    return res.status(400).json({ 
                        success: false,
                        error: 'PDF file is required for PDF file orders' 
                    });
                }
                
                oldFilePath = order.adminPdfFile?.filePath;
                
                // Create file path
                const filePath = '/uploads/orders/outputs/' + req.file.filename;
                
                updateData.adminPdfFile = {
                    fileName: req.file.filename,
                    filePath: filePath,
                    fileSize: req.file.size,
                    uploadedAt: new Date(),
                    uploadedBy: req.admin.id || req.admin._id
                };
                updateData.adminTextContent = ''; // Clear text
                updateData.textSubmittedAt = null;
                updateData.textSubmittedBy = null;
                
            } else if (order.orderType === 'text_file') {
                if (!adminTextContent || adminTextContent.trim() === '') {
                    if (req.file) {
                        fs.unlinkSync(req.file.path);
                    }
                    return res.status(400).json({ 
                        success: false,
                        error: 'Text content is required for text file orders' 
                    });
                }
                
                oldFilePath = order.adminPdfFile?.filePath; // Clean up old PDF if exists
                
                updateData.adminTextContent = adminTextContent.trim();
                updateData.textSubmittedAt = new Date();
                updateData.textSubmittedBy = req.admin.id || req.admin._id;
                updateData.adminPdfFile = null; // Clear PDF
                
            } else {
                // For image_file and document_file, just update notes
                if (!adminNotes && adminNotes !== '') {
                    if (req.file) {
                        fs.unlinkSync(req.file.path);
                    }
                    return res.status(400).json({ 
                        success: false,
                        error: 'Admin notes are required for image/document orders' 
                    });
                }
                
                updateData.adminNotes = adminNotes;
                updateData.adminNotesUpdatedAt = new Date();
            }
            
            if (adminNotes && adminNotes.trim() !== '') {
                updateData.adminNotes = adminNotes;
                updateData.adminNotesUpdatedAt = new Date();
            }
            
            // Auto-complete order if was pending/processing
            if (order.status === 'pending' || order.status === 'processing') {
                updateData.status = 'completed';
                updateData.completedAt = new Date();
                updateData.completedBy = req.admin.id || req.admin._id;
            }
            
            const updatedOrder = await Order.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            ).populate('user', 'fullname email')
             .populate('service', 'workName workNameEnglish');
            
            // Clean up old file
            if (oldFilePath) {
                await deleteOldOrderFile(oldFilePath);
            }
            
            const message = order.orderType === 'pdf_file' ? 'PDF file submitted successfully' :
                          order.orderType === 'text_file' ? 'Text content submitted successfully' :
                          'Admin notes updated successfully';
            
            res.json({
                success: true,
                message: message,
                data: updatedOrder
            });
        } catch (error) {
            console.error('Submit order output error:', error);
            
            // Delete uploaded file if error occurs
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            
            // Handle multer errors
            if (error instanceof multer.MulterError) {
                if (error.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({
                        success: false,
                        error: 'File size too large. Maximum size is 10MB'
                    });
                }
                return res.status(400).json({
                    success: false,
                    error: error.message
                });
            }
            
            res.status(500).json({ 
                success: false,
                error: 'Server error while submitting order output' 
            });
        }
    }
);

Subadminroute.get('/orders', authenticateAdmin, async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json({
            success: true,
            data: orders
        });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error' 
        });
    }
});
// GET all pending orders
Subadminroute.get('/orders/pending', authenticateAdmin, async (req, res) => {
    try {
        const orders = await Order.find({ status: 'pending' })
            .populate('user', 'fullname email')
            .populate('service', 'workName')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (error) {
        console.error('Get pending orders error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while fetching pending orders' 
        });
    }
});

// GET all cancelled orders
Subadminroute.get('/orders/cancelled', authenticateAdmin, async (req, res) => {
    try {
        const orders = await Order.find({ status: 'cancelled' })
            .populate('user', 'fullname email')
            .populate('service', 'workName')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (error) {
        console.error('Get cancelled orders error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while fetching cancelled orders' 
        });
    }
});

// GET all completed orders
Subadminroute.get('/orders/completed', authenticateAdmin, async (req, res) => {
    try {
        const orders = await Order.find({ status: 'completed' })
            .populate('user', 'fullname email')
            .populate('service', 'workName')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (error) {
        console.error('Get completed orders error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while fetching completed orders' 
        });
    }
});
// GET orders by status
Subadminroute.get('/orders/status/:status', authenticateAdmin, async (req, res) => {
    try {
        const { status } = req.params;
        const { limit = 50, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        
        const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid status. Must be one of: pending, processing, completed, cancelled' 
            });
        }
        
        // Build sort
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
        
        const orders = await Order.find({ status })
            .populate('user', 'fullname email whatsappnumber')
            .populate('service', 'workName workNameEnglish')
            .sort(sort)
            .limit(parseInt(limit));
        
        const count = await Order.countDocuments({ status });
        
        res.json({
            success: true,
            count: orders.length,
            total: count,
            data: orders
        });
    } catch (error) {
        console.error('Get orders by status error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while fetching orders by status' 
        });
    }
});

// GET orders by order type
Subadminroute.get('/orders/type/:orderType', authenticateAdmin, async (req, res) => {
    try {
        const { orderType } = req.params;
        const { limit = 50, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        
        const validTypes = ['text_file', 'pdf_file', 'image_file', 'document_file'];
        if (!validTypes.includes(orderType)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid order type. Must be one of: text_file, pdf_file, image_file, document_file' 
            });
        }
        
        // Build sort
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
        
        const orders = await Order.find({ orderType })
            .populate('user', 'fullname email whatsappnumber')
            .populate('service', 'workName workNameEnglish')
            .sort(sort)
            .limit(parseInt(limit));
        
        const count = await Order.countDocuments({ orderType });
        
        res.json({
            success: true,
            count: orders.length,
            total: count,
            data: orders
        });
    } catch (error) {
        console.error('Get orders by type error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while fetching orders by type' 
        });
    }
});

// GET single order by ID
Subadminroute.get('/orders/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid order ID' 
            });
        }
        
        const order = await Order.findById(id)
            .populate('user', 'fullname email whatsappnumber profile')
            .populate('service', 'workName workNameEnglish workRate workType fieldNames')
            .populate('completedBy', 'username email')
            .populate('cancelledBy', 'username email')
            .populate('textSubmittedBy', 'username email')
            .populate('adminPdfFile.uploadedBy', 'username email');
        
        if (!order) {
            return res.status(404).json({ 
                success: false,
                error: 'Order not found' 
            });
        }
        
        // Convert fieldValues Map to Object for easier frontend handling
        if (order.fieldValues && order.fieldValues instanceof Map) {
            order.fieldValues = Object.fromEntries(order.fieldValues);
        }
        
        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error('Get order by ID error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error' 
        });
    }
});

// GET order by orderId (string identifier)
Subadminroute.get('/orders/orderId/:orderId', authenticateAdmin, async (req, res) => {
    try {
        const { orderId } = req.params;
        
        const order = await Order.findOne({ orderId })
            .populate('user', 'fullname email whatsappnumber profile')
            .populate('service', 'workName workNameEnglish workRate workType')
            .populate('completedBy', 'username email')
            .populate('cancelledBy', 'username email');
        
        if (!order) {
            return res.status(404).json({ 
                success: false,
                error: 'Order not found' 
            });
        }
        
        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error('Get order by orderId error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error' 
        });
    }
});

// GET order statistics
Subadminroute.get('/orders/stats/overview', authenticateAdmin, async (req, res) => {
    try {
        // Get today's date range
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get this week's date range
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        // Get this month's date range
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        const stats = await Order.aggregate([
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalAmount: { $sum: '$totalAmount' },
                    completedOrders: { 
                        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } 
                    },
                    completedAmount: { 
                        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$totalAmount', 0] } 
                    },
                    pendingOrders: { 
                        $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } 
                    },
                    pendingAmount: { 
                        $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$totalAmount', 0] } 
                    },
                    processingOrders: { 
                        $sum: { $cond: [{ $eq: ['$status', 'processing'] }, 1, 0] } 
                    },
                    processingAmount: { 
                        $sum: { $cond: [{ $eq: ['$status', 'processing'] }, '$totalAmount', 0] } 
                    },
                    cancelledOrders: { 
                        $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } 
                    }
                }
            }
        ]);

        // Get today's orders
        const todayStats = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: today, $lt: tomorrow }
                }
            },
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 },
                    amount: { $sum: '$totalAmount' }
                }
            }
        ]);

        // Get weekly orders
        const weeklyStats = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: weekStart, $lt: weekEnd }
                }
            },
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 },
                    amount: { $sum: '$totalAmount' }
                }
            }
        ]);

        // Get monthly orders
        const monthlyStats = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: monthStart, $lt: monthEnd }
                }
            },
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 },
                    amount: { $sum: '$totalAmount' }
                }
            }
        ]);

        // Get orders by status for chart
        const statusStats = await Order.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    amount: { $sum: '$totalAmount' }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        // Get orders by order type
        const typeStats = await Order.aggregate([
            {
                $group: {
                    _id: '$orderType',
                    count: { $sum: 1 },
                    amount: { $sum: '$totalAmount' }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        const responseStats = stats[0] || {
            totalOrders: 0,
            totalAmount: 0,
            completedOrders: 0,
            completedAmount: 0,
            pendingOrders: 0,
            pendingAmount: 0,
            processingOrders: 0,
            processingAmount: 0,
            cancelledOrders: 0
        };

        responseStats.today = todayStats[0] || { count: 0, amount: 0 };
        responseStats.weekly = weeklyStats[0] || { count: 0, amount: 0 };
        responseStats.monthly = monthlyStats[0] || { count: 0, amount: 0 };

        res.json({
            success: true,
            data: {
                overview: responseStats,
                byStatus: statusStats,
                byType: typeStats
            }
        });
    } catch (error) {
        console.error('Get order stats error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while fetching order statistics' 
        });
    }
});

// UPDATE order status
Subadminroute.put('/orders/:id/status', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, cancellationReason } = req.body;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid order ID' 
            });
        }
        
        // Validate status
        const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ 
                success: false,
                error: 'Valid status is required: pending, processing, completed, or cancelled' 
            });
        }
        
        // Find order
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ 
                success: false,
                error: 'Order not found' 
            });
        }
        
        // Check if order is already in the requested status
        if (order.status === status) {
            return res.status(400).json({ 
                success: false,
                error: `Order is already ${status}` 
            });
        }
        
        // Build update object based on status
        const updateData = {
            status,
            version: order.version + 1
        };
        
        if (status === 'completed') {
            updateData.completedAt = new Date();
            updateData.completedBy = req.admin.id || req.admin._id;
        } else if (status === 'cancelled') {
            updateData.cancelledAt = new Date();
            updateData.cancelledBy = req.admin.id || req.admin._id;
            updateData.cancellationReason = cancellationReason || '';
            
            // If order was paid, consider refunding
            if (order.paymentStatus === 'paid') {
                // Optionally implement refund logic here
                // updateData.paymentStatus = 'refunded';
            }
        } else if (status === 'processing') {
            // Update processing time if needed
        }
        
        const updatedOrder = await Order.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('user', 'fullname email')
         .populate('service', 'workName workNameEnglish');
        
        res.json({
            success: true,
            message: `Order status updated to ${status}`,
            data: updatedOrder
        });
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while updating order status' 
        });
    }
});

// UPDATE order - general update
Subadminroute.put('/orders/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            status,
            urgency,
            notes,
            adminNotes,
            adminTextContent,
            cancellationReason,
            paymentStatus
        } = req.body;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid order ID' 
            });
        }
        
        // Find order
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ 
                success: false,
                error: 'Order not found' 
            });
        }
        
        // Build update object
        const updateData = {};
        
        if (status && ['pending', 'processing', 'completed', 'cancelled'].includes(status)) {
            updateData.status = status;
            
            // Handle status-specific fields
            if (status === 'completed') {
                updateData.completedAt = order.completedAt || new Date();
                updateData.completedBy = order.completedBy || req.admin.id || req.admin._id;
            } else if (status === 'cancelled') {
                updateData.cancelledAt = order.cancelledAt || new Date();
                updateData.cancelledBy = order.cancelledBy || req.admin.id || req.admin._id;
            }
        }
        
        if (urgency && ['normal', 'urgent', 'very_urgent'].includes(urgency)) {
            updateData.urgency = urgency;
        }
        
        if (notes !== undefined) updateData.notes = notes;
        
        if (adminNotes !== undefined) {
            updateData.adminNotes = adminNotes;
            updateData.adminNotesUpdatedAt = new Date();
        }
        
        if (adminTextContent !== undefined && order.orderType === 'text_file') {
            updateData.adminTextContent = adminTextContent;
            updateData.textSubmittedAt = new Date();
            updateData.textSubmittedBy = req.admin.id || req.admin._id;
        }
        
        if (cancellationReason !== undefined) {
            updateData.cancellationReason = cancellationReason;
        }
        
        if (paymentStatus && ['paid', 'pending', 'refunded'].includes(paymentStatus)) {
            updateData.paymentStatus = paymentStatus;
        }
        
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ 
                success: false,
                error: 'No data provided for update' 
            });
        }
        
        // Increment version for any update
        updateData.version = order.version + 1;
        
        const updatedOrder = await Order.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('user', 'fullname email')
         .populate('service', 'workName workNameEnglish');
        
        res.json({
            success: true,
            message: 'Order updated successfully',
            data: updatedOrder
        });
    } catch (error) {
        console.error('Update order error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while updating order' 
        });
    }
});

// DELETE order by ID
Subadminroute.delete('/orders/:id', authenticateAdmin,async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid order ID' 
            });
        }
        
        // Check if order exists
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ 
                success: false,
                error: 'Order not found' 
            });
        }
        
        // Optional: Delete associated files from storage
        if (order.userFiles && order.userFiles.length > 0) {
            // Delete user uploaded files
            for (const file of order.userFiles) {
                try {
                    const filePath = path.join(__dirname, '..', file.filePath);
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                } catch (fileError) {
                    console.error(`Error deleting user file ${file.fileName}:`, fileError);
                }
            }
        }
        
        // Delete admin uploaded PDF if exists
        if (order.adminPdfFile && order.adminPdfFile.filePath) {
            try {
                const filePath = path.join(__dirname, '..', order.adminPdfFile.filePath);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch (fileError) {
                console.error(`Error deleting admin PDF file:`, fileError);
            }
        }
        
        // Delete order
        await Order.findByIdAndDelete(id);
        
        res.json({
            success: true,
            message: 'Order deleted successfully'
        });
    } catch (error) {
        console.error('Delete order error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while deleting order' 
        });
    }
});

// GET orders by user ID
Subadminroute.get('/users/:userId/orders', authenticateAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        const { status, limit = 50 } = req.query;
        
        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ 
                success: false,
                error: 'User not found' 
            });
        }
        
        // Build filter
        const filter = { user: userId };
        
        if (status && ['pending', 'processing', 'completed', 'cancelled'].includes(status)) {
            filter.status = status;
        }
        
        const orders = await Order.find(filter)
            .populate('service', 'workName workNameEnglish')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));
        
        // Calculate user order totals
        const totals = await Order.aggregate([
            { $match: { user: user._id } },
            { $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalAmount: { $sum: '$totalAmount' },
                completedOrders: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                completedAmount: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$totalAmount', 0] } }
            }}
        ]);
        
        const totalsData = totals[0] || {
            totalOrders: 0,
            totalAmount: 0,
            completedOrders: 0,
            completedAmount: 0
        };
        
        res.json({
            success: true,
            data: {
                user: {
                    _id: user._id,
                    fullname: user.fullname,
                    email: user.email
                },
                orders,
                totals: totalsData
            }
        });
    } catch (error) {
        console.error('Get user orders error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while fetching user orders' 
        });
    }
});

// GET orders by service ID
Subadminroute.get('/services/:serviceId/orders', authenticateAdmin, async (req, res) => {
    try {
        const { serviceId } = req.params;
        const { status, limit = 50 } = req.query;
        
        if (!mongoose.Types.ObjectId.isValid(serviceId)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid service ID' 
            });
        }
        
        // Check if service exists
        const service = await Service.findById(serviceId);
        if (!service) {
            return res.status(404).json({ 
                success: false,
                error: 'Service not found' 
            });
        }
        
        // Build filter
        const filter = { service: serviceId };
        
        if (status && ['pending', 'processing', 'completed', 'cancelled'].includes(status)) {
            filter.status = status;
        }
        
        const orders = await Order.find(filter)
            .populate('user', 'fullname email whatsappnumber')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));
        
        const count = await Order.countDocuments(filter);
        
        res.json({
            success: true,
            data: {
                service: {
                    _id: service._id,
                    workName: service.workName,
                    workNameEnglish: service.workNameEnglish
                },
                orders,
                count: orders.length,
                total: count
            }
        });
    } catch (error) {
        console.error('Get service orders error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while fetching service orders' 
        });
    }
});

// BULK update orders status
Subadminroute.put('/orders/bulk/status', authenticateAdmin, async (req, res) => {
    try {
        const { orderIds, status, adminNotes } = req.body;
        
        if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Array of order IDs is required'
            });
        }
        
        if (!status || !['pending', 'processing', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Valid status is required: pending, processing, completed, or cancelled'
            });
        }
        
        // Validate all IDs
        const validIds = orderIds.filter(id => mongoose.Types.ObjectId.isValid(id));
        if (validIds.length !== orderIds.length) {
            return res.status(400).json({
                success: false,
                error: 'Invalid order IDs found'
            });
        }
        
        // Build update data
        const updateData = {
            status
        };
        
        if (status === 'completed') {
            updateData.completedAt = new Date();
        } else if (status === 'cancelled') {
            updateData.cancelledAt = new Date();
        }
        
        if (adminNotes) {
            updateData.adminNotes = adminNotes;
            updateData.adminNotesUpdatedAt = new Date();
        }
        
        // Update orders
        const result = await Order.updateMany(
            { _id: { $in: validIds } },
            updateData
        );
        
        res.json({
            success: true,
            message: `Successfully updated ${result.modifiedCount} order(s) to ${status}`,
            data: {
                modifiedCount: result.modifiedCount
            }
        });
    } catch (error) {
        console.error('Bulk update orders status error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while bulk updating orders status'
        });
    }
});

// MARK order as completed with admin output
Subadminroute.post('/orders/:id/complete', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { adminNotes } = req.body;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid order ID' 
            });
        }
        
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ 
                success: false,
                error: 'Order not found' 
            });
        }
        
        if (order.status === 'completed') {
            return res.status(400).json({ 
                success: false,
                error: 'Order is already completed' 
            });
        }
        
        // Check if admin has provided output based on order type
        let hasOutput = false;
        
        if (order.orderType === 'pdf_file') {
            hasOutput = !!(order.adminPdfFile && order.adminPdfFile.fileName);
        } else if (order.orderType === 'text_file') {
            hasOutput = !!order.adminTextContent;
        } else {
            // For image_file and document_file, admin notes might be sufficient
            hasOutput = true;
        }
        
        if (!hasOutput) {
            return res.status(400).json({ 
                success: false,
                error: 'Cannot complete order without admin output. Please submit text content for text orders or upload PDF for PDF orders.' 
            });
        }
        
        // Update order
        const updateData = {
            status: 'completed',
            completedAt: new Date(),
            completedBy: req.admin.id || req.admin._id,
            version: order.version + 1
        };
        
        if (adminNotes) {
            updateData.adminNotes = adminNotes;
            updateData.adminNotesUpdatedAt = new Date();
        }
        
        const updatedOrder = await Order.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('user', 'fullname email')
         .populate('service', 'workName workNameEnglish');
        
        res.json({
            success: true,
            message: 'Order marked as completed',
            data: updatedOrder
        });
    } catch (error) {
        console.error('Complete order error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while completing order' 
        });
    }
});

// CANCEL order
Subadminroute.post('/orders/:id/cancel', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { cancellationReason } = req.body;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid order ID' 
            });
        }
        
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ 
                success: false,
                error: 'Order not found' 
            });
        }
        
        if (order.status === 'cancelled') {
            return res.status(400).json({ 
                success: false,
                error: 'Order is already cancelled' 
            });
        }
        
        if (order.status === 'completed') {
            return res.status(400).json({ 
                success: false,
                error: 'Cannot cancel a completed order' 
            });
        }
        
        // Update order
        const updateData = {
            status: 'cancelled',
            cancelledAt: new Date(),
            cancelledBy: req.admin.id || req.admin._id,
            cancellationReason: cancellationReason || 'Cancelled by admin',
            version: order.version + 1
        };
        
        // If order was paid, consider refunding
        if (order.paymentStatus === 'paid') {
            // Optionally implement refund logic here
            // updateData.paymentStatus = 'refunded';
        }
        
        const updatedOrder = await Order.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('user', 'fullname email')
         .populate('service', 'workName workNameEnglish');
        
        res.json({
            success: true,
            message: 'Order cancelled successfully',
            data: updatedOrder
        });
    } catch (error) {
        console.error('Cancel order error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while cancelling order' 
        });
    }
});

// GET pending orders count (for dashboard)
Subadminroute.get('/orders/pending/count', authenticateAdmin, async (req, res) => {
    try {
        const pendingCount = await Order.countDocuments({ status: 'pending' });
        const processingCount = await Order.countDocuments({ status: 'processing' });
        
        res.json({
            success: true,
            data: {
                pending: pendingCount,
                processing: processingCount,
                totalAwaitingAction: pendingCount + processingCount
            }
        });
    } catch (error) {
        console.error('Get pending orders count error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while fetching pending orders count' 
        });
    }
});

// GET recent orders (for dashboard)
Subadminroute.get('/orders/recent', authenticateAdmin, async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        
        const recentOrders = await Order.find()
            .populate('user', 'fullname email')
            .populate('service', 'workName')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));
        
        res.json({
            success: true,
            data: recentOrders
        });
    } catch (error) {
        console.error('Get recent orders error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while fetching recent orders' 
        });
    }
});
// Add this import at the top with other imports

// ==================== PRICE LIST MANAGEMENT ROUTES ====================

// GET all price list items
Subadminroute.get('/pricelist', authenticateAdmin, async (req, res) => {
    try {
        const { search, isActive, sortBy = 'name', sortOrder = 'asc' } = req.query;

        // Build filter
        const filter = {};
        
        if (isActive === 'true' || isActive === 'false') {
            filter.isActive = isActive === 'true';
        }
        
        // Search in name
        if (search) {
            filter.name = { $regex: search, $options: 'i' };
        }

        // Build sort
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Get price list items
        const priceList = await PriceList.find(filter).sort(sort);

        res.json({
            success: true,
            data: priceList
        });

    } catch (error) {
        console.error('Get price list error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while fetching price list' 
        });
    }
});

// GET active price list items
Subadminroute.get('/pricelist/active', authenticateAdmin, async (req, res) => {
    try {
        const priceList = await PriceList.getActiveServices();
        
        res.json({
            success: true,
            data: priceList
        });
    } catch (error) {
        console.error('Get active price list error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while fetching active price list' 
        });
    }
});

// GET single price list item by ID
Subadminroute.get('/pricelist/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid price list ID' 
            });
        }
        
        const priceListItem = await PriceList.findById(id);
        
        if (!priceListItem) {
            return res.status(404).json({ 
                success: false,
                error: 'Price list item not found' 
            });
        }
        
        res.json({
            success: true,
            data: priceListItem
        });
    } catch (error) {
        console.error('Get price list by ID error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error' 
        });
    }
});

// CREATE new price list item
Subadminroute.post('/pricelist', authenticateAdmin,async (req, res) => {
    try {
        const { 
            name, 
            price = 0,
            isActive = true
        } = req.body;
        
        // Validation
        if (!name) {
            return res.status(400).json({ 
                success: false,
                error: 'Service name is required' 
            });
        }
        
        if (price < 0) {
            return res.status(400).json({ 
                success: false,
                error: 'Price cannot be negative' 
            });
        }
        
        // Check if service already exists
        const existingService = await PriceList.findOne({ 
            name: name.trim()
        });
        
        if (existingService) {
            return res.status(400).json({ 
                success: false,
                error: 'Service with this name already exists' 
            });
        }
        
        // Create new price list item
        const priceListData = {
            name: name.trim(),
            price: Number(price),
            isActive: isActive === true || isActive === 'true'
        };
        
        const newPriceListItem = new PriceList(priceListData);
        await newPriceListItem.save();
        
        res.status(201).json({
            success: true,
            message: 'Price list item created successfully',
            data: newPriceListItem
        });
    } catch (error) {
        console.error('Create price list item error:', error);
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ 
                success: false,
                error: 'Validation failed',
                details: errors 
            });
        }
        
        res.status(500).json({ 
            success: false,
            error: 'Server error while creating price list item' 
        });
    }
});

// UPDATE price list item by ID
Subadminroute.put('/pricelist/:id', authenticateAdmin,async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            name, 
            price,
            isActive
        } = req.body;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid price list ID' 
            });
        }
        
        // Check if price list item exists
        const priceListItem = await PriceList.findById(id);
        if (!priceListItem) {
            return res.status(404).json({ 
                success: false,
                error: 'Price list item not found' 
            });
        }
        
        // Build update object
        const updateData = {};
        
        if (name && name.trim() !== priceListItem.name) {
            updateData.name = name.trim();
        }
        
        if (price !== undefined) {
            const priceValue = Number(price);
            if (priceValue < 0) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Price cannot be negative' 
                });
            }
            updateData.price = priceValue;
        }
        
        if (isActive !== undefined) {
            updateData.isActive = isActive === true || isActive === 'true';
        }
        
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ 
                success: false,
                error: 'No data provided for update' 
            });
        }
        
        // Check for duplicate name (only if name is being updated)
        if (updateData.name) {
            const existingService = await PriceList.findOne({ 
                name: updateData.name, 
                _id: { $ne: id } 
            });
            if (existingService) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Service with this name already exists' 
                });
            }
        }
        
        // Update price list item
        const updatedPriceListItem = await PriceList.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );
        
        res.json({
            success: true,
            message: 'Price list item updated successfully',
            data: updatedPriceListItem
        });
    } catch (error) {
        console.error('Update price list item error:', error);
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ 
                success: false,
                error: 'Validation failed',
                details: errors 
            });
        }
        
        res.status(500).json({ 
            success: false,
            error: 'Server error while updating price list item' 
        });
    }
});

// UPDATE price only (for quick price updates)
Subadminroute.patch('/pricelist/:id/price',async (req, res) => {
    try {
        const { id } = req.params;
        const { price } = req.body;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid price list ID' 
            });
        }
        
        if (price === undefined || isNaN(price)) {
            return res.status(400).json({ 
                success: false,
                error: 'Valid price is required' 
            });
        }
        
        if (price < 0) {
            return res.status(400).json({ 
                success: false,
                error: 'Price cannot be negative' 
            });
        }
        
        const priceListItem = await PriceList.findById(id);
        if (!priceListItem) {
            return res.status(404).json({ 
                success: false,
                error: 'Price list item not found' 
            });
        }
        
        const updateData = {
            price: Number(price)
        };
        
        const updatedPriceListItem = await PriceList.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );
        
        res.json({
            success: true,
            message: 'Price updated successfully',
            data: updatedPriceListItem
        });
    } catch (error) {
        console.error('Update price error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while updating price' 
        });
    }
});

// BULK update prices
Subadminroute.put('/pricelist/bulk/price',async (req, res) => {
    try {
        const { priceUpdates } = req.body;
        
        if (!priceUpdates || !Array.isArray(priceUpdates) || priceUpdates.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Array of price updates is required'
            });
        }
        
        // Validate all updates
        const validatedUpdates = [];
        const invalidUpdates = [];
        
        for (const update of priceUpdates) {
            if (!update.id || !mongoose.Types.ObjectId.isValid(update.id)) {
                invalidUpdates.push({
                    id: update.id,
                    error: 'Invalid ID'
                });
                continue;
            }
            
            if (update.price === undefined || isNaN(update.price) || update.price < 0) {
                invalidUpdates.push({
                    id: update.id,
                    error: 'Invalid price value'
                });
                continue;
            }
            
            validatedUpdates.push({
                id: update.id,
                price: Number(update.price)
            });
        }
        
        if (validatedUpdates.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No valid price updates provided',
                details: invalidUpdates
            });
        }
        
        // Bulk update
        const result = await PriceList.bulkUpdatePrices(validatedUpdates);
        
        res.json({
            success: true,
            message: `Successfully updated ${result.modifiedCount} price(s)`,
            data: {
                modifiedCount: result.modifiedCount,
                matchedCount: result.matchedCount,
                invalidUpdates: invalidUpdates
            }
        });
    } catch (error) {
        console.error('Bulk update prices error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while bulk updating prices'
        });
    }
});

// TOGGLE active status
Subadminroute.patch('/pricelist/:id/toggle-status',async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid price list ID' 
            });
        }
        
        const priceListItem = await PriceList.findById(id);
        if (!priceListItem) {
            return res.status(404).json({ 
                success: false,
                error: 'Price list item not found' 
            });
        }
        
        const newStatus = !priceListItem.isActive;
        
        const updateData = {
            isActive: newStatus
        };
        
        const updatedPriceListItem = await PriceList.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );
        
        res.json({
            success: true,
            message: `Price list item status changed to ${newStatus ? 'active' : 'inactive'}`,
            data: updatedPriceListItem
        });
    } catch (error) {
        console.error('Toggle price list status error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while toggling status' 
        });
    }
});

// DELETE price list item by ID
Subadminroute.delete('/pricelist/:id',async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid price list ID' 
            });
        }
        
        const priceListItem = await PriceList.findById(id);
        if (!priceListItem) {
            return res.status(404).json({ 
                success: false,
                error: 'Price list item not found' 
            });
        }
        
        await PriceList.findByIdAndDelete(id);
        
        res.json({
            success: true,
            message: 'Price list item deleted successfully'
        });
    } catch (error) {
        console.error('Delete price list item error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while deleting price list item' 
        });
    }
});

// DELETE multiple price list items
Subadminroute.post('/pricelist/bulk-delete', async (req, res) => {
    try {
        const { ids } = req.body;
        
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Array of price list IDs is required'
            });
        }
        
        // Validate all IDs
        const validIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id));
        if (validIds.length !== ids.length) {
            return res.status(400).json({
                success: false,
                error: 'Invalid price list IDs found'
            });
        }
        
        // Delete multiple items
        const result = await PriceList.deleteMany({ _id: { $in: validIds } });
        
        res.json({
            success: true,
            message: `Successfully deleted ${result.deletedCount} price list item(s)`,
            data: {
                deletedCount: result.deletedCount
            }
        });
    } catch (error) {
        console.error('Bulk delete price list items error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while bulk deleting price list items'
        });
    }
});

// ==================== TRANSACTION MANAGEMENT ROUTES ====================

// GET all transactions (with filtering, pagination, and sorting)
Subadminroute.get('/transactions', authenticateAdmin, async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            type,
            status,
            service,
            userId,
            startDate,
            endDate,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build filter
        const filter = {};
        
        if (type && ['credit', 'debit'].includes(type)) {
            filter.type = type;
        }
        
        if (status && ['pending', 'completed', 'failed', 'refunded'].includes(status)) {
            filter.status = status;
        }
        
        if (service) {
            filter.service = { $regex: service, $options: 'i' };
        }
        
        if (userId && mongoose.Types.ObjectId.isValid(userId)) {
            filter.user = userId;
        }
        
        // Date range filter
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) {
                filter.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                filter.createdAt.$lte = new Date(endDate);
            }
        }
        
        // Search in reference or description
        if (search) {
            filter.$or = [
                { reference: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Calculate pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Build sort
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Get total count
        const total = await Transaction.countDocuments(filter);

        // Get transactions with user population
        const transactions = await Transaction.find(filter)
            .populate('user', 'fullname email whatsappnumber')
            .sort(sort)
            .skip(skip)
            .limit(limitNum);

        // Calculate totals
        const totals = await Transaction.aggregate([
            { $match: filter },
            { $group: {
                _id: null,
                totalAmount: { $sum: '$amount' },
                creditTotal: { $sum: { $cond: [{ $eq: ['$type', 'credit'] }, '$amount', 0] } },
                debitTotal: { $sum: { $cond: [{ $eq: ['$type', 'debit'] }, '$amount', 0] } },
                totalTransactions: { $sum: 1 }
            }}
        ]);

        const totalsData = totals[0] || {
            totalAmount: 0,
            creditTotal: 0,
            debitTotal: 0,
            totalTransactions: 0
        };

        res.json({
            success: true,
            data: transactions,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                pages: Math.ceil(total / limitNum)
            },
            totals: totalsData
        });

    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while fetching transactions' 
        });
    }
});

// DELETE transaction by ID
Subadminroute.delete('/transactions/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid transaction ID' 
            });
        }
        
        // Check if transaction exists
        const transaction = await Transaction.findById(id);
        if (!transaction) {
            return res.status(404).json({ 
                success: false,
                error: 'Transaction not found' 
            });
        }
        
        // IMPORTANT: Check if this is a completed transaction that affected user balance
        // You might want to prevent deletion of completed transactions that affected balance
        if (transaction.status === 'completed' && 
            (transaction.type === 'credit' || transaction.type === 'debit')) {
            // Optional: Check if transaction has been reconciled or if balance adjustment is needed
            // You can add logic here to reverse the balance effect before deletion
            // For now, we'll just warn the admin
            
            return res.status(400).json({ 
                success: false,
                error: 'Cannot delete completed transactions. Please use refund or reversal instead.',
                suggestion: 'If you need to reverse this transaction, create a new opposite transaction instead.'
            });
        }
        
        // Delete transaction
        await Transaction.findByIdAndDelete(id);
        
        res.json({
            success: true,
            message: 'Transaction deleted successfully',
            data: {
                transactionId: id,
                reference: transaction.reference
            }
        });
    } catch (error) {
        console.error('Delete transaction error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while deleting transaction' 
        });
    }
});

// GET all balance history (with filtering, pagination, and sorting)
Subadminroute.get('/balance-history', authenticateAdmin, async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            userId,
            adminId,
            type,
            startDate,
            endDate,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build filter
        const filter = {};
        
        if (userId && mongoose.Types.ObjectId.isValid(userId)) {
            filter.user = userId;
        }
        
        if (adminId && mongoose.Types.ObjectId.isValid(adminId)) {
            filter.admin = adminId;
        }
        
        if (type && ['add', 'subtract', 'adjustment', 'refund', 'purchase', 'withdrawal'].includes(type)) {
            filter.type = type;
        }
        
        // Date range filter
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) {
                filter.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                filter.createdAt.$lte = new Date(endDate);
            }
        }
        
        // Search in notes
        if (search) {
            filter.notes = { $regex: search, $options: 'i' };
        }

        // Calculate pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Build sort
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Get total count
        const total = await BalanceHistory.countDocuments(filter);

        // Get balance history with user and admin population
        const balanceHistory = await BalanceHistory.find(filter)
            .populate('user', 'fullname email whatsappnumber')
            .populate('admin', 'username email name')
            .sort(sort)
            .skip(skip)
            .limit(limitNum);

        // Calculate totals
        const totals = await BalanceHistory.aggregate([
            { $match: filter },
            { $group: {
                _id: null,
                totalAdditions: { $sum: { $cond: [{ $eq: ['$type', 'add'] }, '$amount', 0] } },
                totalSubtractions: { $sum: { $cond: [{ $eq: ['$type', 'subtract'] }, '$amount', 0] } },
                totalAdjustments: { $sum: { $cond: [{ $eq: ['$type', 'adjustment'] }, '$amount', 0] } },
                totalRefunds: { $sum: { $cond: [{ $eq: ['$type', 'refund'] }, '$amount', 0] } },
                totalRecords: { $sum: 1 }
            }}
        ]);

        const totalsData = totals[0] || {
            totalAdditions: 0,
            totalSubtractions: 0,
            totalAdjustments: 0,
            totalRefunds: 0,
            totalRecords: 0
        };

        // Add virtual field to each record for easier frontend display
        const enhancedHistory = balanceHistory.map(record => {
            const recordObj = record.toObject();
            // Calculate net change (positive for add, negative for subtract)
            recordObj.balanceChange = record.type === 'add' ? record.amount : -record.amount;
            return recordObj;
        });

        res.json({
            success: true,
            data: enhancedHistory,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                pages: Math.ceil(total / limitNum)
            },
            totals: totalsData
        });

    } catch (error) {
        console.error('Get balance history error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while fetching balance history' 
        });
    }
});

// GET single balance history record by ID
Subadminroute.get('/balance-history/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid balance history ID' 
            });
        }
        
        const balanceRecord = await BalanceHistory.findById(id)
            .populate('user', 'fullname email whatsappnumber profile')
            .populate('admin', 'username email name')
            .populate('transactionId');
        
        if (!balanceRecord) {
            return res.status(404).json({ 
                success: false,
                error: 'Balance history record not found' 
            });
        }
        
        // Add virtual field for balance change
        const recordObj = balanceRecord.toObject();
        recordObj.balanceChange = balanceRecord.type === 'add' ? balanceRecord.amount : -balanceRecord.amount;
        
        res.json({
            success: true,
            data: recordObj
        });
    } catch (error) {
        console.error('Get balance history by ID error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error' 
        });
    }
});

// ==================== SOCIAL MEDIA ROUTES ====================
// Add this import at top: const SocialMedia = require("../models/SocialMedia");

// GET all social media links
Subadminroute.get('/social-media', authenticateAdmin, async (req, res) => {
  try {
    const socialMedia = await SocialMedia.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      data: socialMedia
    });
  } catch (error) {
    console.error('Get social media error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error' 
    });
  }
});

// GET active social media links
Subadminroute.get('/social-media/active', async (req, res) => {
  try {
    const socialMedia = await SocialMedia.find({ isActive: true });
    res.json({
      success: true,
      data: socialMedia
    });
  } catch (error) {
    console.error('Get active social media error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error' 
    });
  }
});

// CREATE new social media link
Subadminroute.post('/social-media', authenticateAdmin, async (req, res) => {
  try {
    const { platform, url, isActive = true } = req.body;
    
    if (!platform || !url) {
      return res.status(400).json({ 
        success: false,
        error: 'Platform and URL are required' 
      });
    }
    
    const validPlatforms = ['facebook', 'whatsapp', 'youtube', 'telegram'];
    if (!validPlatforms.includes(platform)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid platform' 
      });
    }
    
    const newSocialMedia = new SocialMedia({
      platform,
      url,
      isActive
    });
    
    await newSocialMedia.save();
    
    res.status(201).json({
      success: true,
      message: 'Social media link added',
      data: newSocialMedia
    });
  } catch (error) {
    console.error('Create social media error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error' 
    });
  }
});

// UPDATE social media link
Subadminroute.put('/social-media/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { platform, url, isActive } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid ID' 
      });
    }
    
    const updateData = {};
    if (platform) {
      const validPlatforms = ['facebook', 'whatsapp', 'youtube', 'telegram'];
      if (!validPlatforms.includes(platform)) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid platform' 
        });
      }
      updateData.platform = platform;
    }
    if (url) updateData.url = url;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    const updated = await SocialMedia.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    
    if (!updated) {
      return res.status(404).json({ 
        success: false,
        error: 'Not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Updated',
      data: updated
    });
  } catch (error) {
    console.error('Update social media error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error' 
    });
  }
});

// DELETE social media link
Subadminroute.delete('/social-media/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid ID' 
      });
    }
    
    await SocialMedia.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: 'Deleted'
    });
  } catch (error) {
    console.error('Delete social media error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error' 
    });
  }
});

// TOGGLE active status
Subadminroute.patch('/social-media/:id/toggle', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid ID' 
      });
    }
    
    const social = await SocialMedia.findById(id);
    if (!social) {
      return res.status(404).json({ 
        success: false,
        error: 'Not found' 
      });
    }
    
    social.isActive = !social.isActive;
    await social.save();
    
    res.json({
      success: true,
      message: `Status changed to ${social.isActive ? 'active' : 'inactive'}`,
      data: social
    });
  } catch (error) {
    console.error('Toggle status error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error' 
    });
  }
});

// Add this with your other imports at the top
const SocialMedia = require("../models/SocialMedia");

// ==================== NOTICE MANAGEMENT ROUTES ====================
// Add this with your other imports at the top
const Notice = require("../models/Notice");

// ==================== NOTICE MANAGEMENT ROUTES ====================

// GET all notices
Subadminroute.get('/notices', authenticateAdmin, async (req, res) => {
  try {
    const { search, isActive, sortBy = 'serviceName', sortOrder = 'asc' } = req.query;

    // Build filter
    const filter = {};
    
    if (isActive === 'true' || isActive === 'false') {
      filter.isActive = isActive === 'true';
    }
    
    // Search in serviceName or notice
    if (search) {
      filter.$or = [
        { serviceName: { $regex: search, $options: 'i' } },
        { notice: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get notices
    const notices = await Notice.find(filter).sort(sort);

    res.json({
      success: true,
      data: notices
    });

  } catch (error) {
    console.error('Get notices error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error while fetching notices' 
    });
  }
});

// GET active notices
Subadminroute.get('/notices/active', authenticateAdmin, async (req, res) => {
  try {
    const notices = await Notice.find({ isActive: true }).sort({ serviceName: 1 });
    
    res.json({
      success: true,
      data: notices
    });
  } catch (error) {
    console.error('Get active notices error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error while fetching active notices' 
    });
  }
});

// Check if defaults need to be saved
Subadminroute.get('/notices/check-defaults', authenticateAdmin, async (req, res) => {
  try {
    const count = await Notice.countDocuments();
    
    res.json({
      success: true,
      needsDefaults: count === 0
    });
  } catch (error) {
    console.error('Check defaults error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error while checking defaults' 
    });
  }
});

// Save default notices to database
Subadminroute.post('/notices/save-defaults', authenticateAdmin, async (req, res) => {
  try {
    const { notices } = req.body;
    
    if (!notices || !Array.isArray(notices) || notices.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Array of notices is required' 
      });
    }
    
    // Check if any notices already exist
    const existingNotices = await Notice.find({
      serviceName: { $in: notices.map(n => n.serviceName) }
    });
    
    const existingServiceNames = existingNotices.map(n => n.serviceName);
    const newNotices = notices.filter(n => !existingServiceNames.includes(n.serviceName));
    
    if (newNotices.length === 0) {
      return res.json({
        success: true,
        message: 'All default notices already exist',
        addedCount: 0
      });
    }
    
    // Save new notices
    const noticesToSave = newNotices.map(notice => ({
      serviceName: notice.serviceName,
      notice: notice.notice,
      isActive: notice.isActive !== undefined ? notice.isActive : true,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    const result = await Notice.insertMany(noticesToSave);
    
    res.json({
      success: true,
      message: `Successfully added ${result.length} default notices`,
      addedCount: result.length,
      data: result
    });
    
  } catch (error) {
    console.error('Save default notices error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error while saving default notices' 
    });
  }
});

// GET single notice by ID
Subadminroute.get('/notices/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid notice ID' 
      });
    }
    
    const notice = await Notice.findById(id);
    
    if (!notice) {
      return res.status(404).json({ 
        success: false,
        error: 'Notice not found' 
      });
    }
    
    res.json({
      success: true,
      data: notice
    });
  } catch (error) {
    console.error('Get notice by ID error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error' 
    });
  }
});

// CREATE new notice
Subadminroute.post('/notices', authenticateAdmin,async (req, res) => {
  try {
    const { 
      serviceName, 
      notice,
      isActive = true
    } = req.body;
    
    // Validation
    if (!serviceName || !serviceName.trim()) {
      return res.status(400).json({ 
        success: false,
        error: 'Service name is required' 
      });
    }
    
    if (!notice || !notice.trim()) {
      return res.status(400).json({ 
        success: false,
        error: 'Notice text is required' 
      });
    }
    
    // Check if notice already exists for this service
    const existingNotice = await Notice.findOne({ 
      serviceName: serviceName.trim()
    });
    
    if (existingNotice) {
      return res.status(400).json({ 
        success: false,
        error: 'Notice already exists for this service' 
      });
    }
    
    // Create new notice
    const noticeData = {
      serviceName: serviceName.trim(),
      notice: notice.trim(),
      isActive: isActive === true || isActive === 'true'
    };
    
    const newNotice = new Notice(noticeData);
    await newNotice.save();
    
    res.status(201).json({
      success: true,
      message: 'Notice created successfully',
      data: newNotice
    });
  } catch (error) {
    console.error('Create notice error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false,
        error: 'Validation failed',
        details: errors 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Server error while creating notice' 
    });
  }
});

// UPDATE notice by ID
Subadminroute.put('/notices/:id', authenticateAdmin,async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      serviceName, 
      notice,
      isActive
    } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid notice ID' 
      });
    }
    
    // Check if notice exists
    const noticeItem = await Notice.findById(id);
    if (!noticeItem) {
      return res.status(404).json({ 
        success: false,
        error: 'Notice not found' 
      });
    }
    
    // Build update object
    const updateData = {};
    
    if (serviceName && serviceName.trim() !== noticeItem.serviceName) {
      updateData.serviceName = serviceName.trim();
    }
    
    if (notice && notice.trim() !== noticeItem.notice) {
      updateData.notice = notice.trim();
    }
    
    if (isActive !== undefined) {
      updateData.isActive = isActive === true || isActive === 'true';
    }
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'No data provided for update' 
      });
    }
    
    // Check for duplicate service name (only if serviceName is being updated)
    if (updateData.serviceName) {
      const existingNotice = await Notice.findOne({ 
        serviceName: updateData.serviceName, 
        _id: { $ne: id } 
      });
      if (existingNotice) {
        return res.status(400).json({ 
          success: false,
          error: 'Notice already exists for this service' 
        });
      }
    }
    
    // Update notice
    updateData.updatedAt = Date.now();
    
    const updatedNotice = await Notice.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      message: 'Notice updated successfully',
      data: updatedNotice
    });
  } catch (error) {
    console.error('Update notice error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false,
        error: 'Validation failed',
        details: errors 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Server error while updating notice' 
    });
  }
});

// DELETE notice by ID
Subadminroute.delete('/notices/:id', authenticateAdmin,async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid notice ID' 
      });
    }
    
    const notice = await Notice.findById(id);
    if (!notice) {
      return res.status(404).json({ 
        success: false,
        error: 'Notice not found' 
      });
    }
    
    await Notice.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: 'Notice deleted successfully'
    });
  } catch (error) {
    console.error('Delete notice error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error while deleting notice' 
    });
  }
});

// TOGGLE notice status (active/inactive)
Subadminroute.patch('/notices/:id/toggle-status', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid notice ID' 
      });
    }
    
    const notice = await Notice.findById(id);
    if (!notice) {
      return res.status(404).json({ 
        success: false,
        error: 'Notice not found' 
      });
    }
    
    const newStatus = !notice.isActive;
    
    const updateData = {
      isActive: newStatus,
      updatedAt: Date.now()
    };
    
    const updatedNotice = await Notice.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    
    res.json({
      success: true,
      message: `Notice status changed to ${newStatus ? 'active' : 'inactive'}`,
      data: updatedNotice
    });
  } catch (error) {
    console.error('Toggle notice status error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error while toggling notice status' 
    });
  }
});

// GET notice statistics
Subadminroute.get('/notices/stats/overview', authenticateAdmin,async (req, res) => {
  try {
    const stats = await Notice.aggregate([
      {
        $group: {
          _id: null,
          totalNotices: { $sum: 1 },
          activeNotices: { 
            $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] } 
          },
          inactiveNotices: { 
            $sum: { $cond: [{ $eq: ["$isActive", false] }, 1, 0] } 
          }
        }
      }
    ]);
    
    const responseStats = stats[0] || {
      totalNotices: 0,
      activeNotices: 0,
      inactiveNotices: 0
    };
    
    res.json({
      success: true,
      data: responseStats
    });
  } catch (error) {
    console.error('Get notice stats error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error while fetching notice statistics' 
    });
  }
});


// ==================== SUB ADMIN MANAGEMENT ROUTES ====================
const SubAdmin = require("../models/SubAdmin");

// GET all sub admins
Subadminroute.get('/subadmins', authenticateAdmin,async (req, res) => {
    try {
        const subadmins = await SubAdmin.find()
            .select('-password -__v')
            .sort({ createdAt: -1 });
        
        res.json({
            success: true,
            count: subadmins.length,
            data: subadmins
        });
    } catch (error) {
        console.error('Get subadmins error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while fetching sub admins' 
        });
    }
});

// GET active sub admins
Subadminroute.get('/subadmins/active', authenticateAdmin, async (req, res) => {
    try {
        const subadmins = await SubAdmin.find({ active: true })
            .select('-password -__v')
            .sort({ createdAt: -1 });
        
        res.json({
            success: true,
            count: subadmins.length,
            data: subadmins
        });
    } catch (error) {
        console.error('Get active subadmins error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while fetching active sub admins' 
        });
    }
});

// GET inactive sub admins
Subadminroute.get('/subadmins/inactive', authenticateAdmin,async (req, res) => {
    try {
        const subadmins = await SubAdmin.find({ active: false })
            .select('-password -__v')
            .sort({ createdAt: -1 });
        
        res.json({
            success: true,
            count: subadmins.length,
            data: subadmins
        });
    } catch (error) {
        console.error('Get inactive subadmins error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while fetching inactive sub admins' 
        });
    }
});

// GET single sub admin by ID
Subadminroute.get('/subadmins/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid sub admin ID' 
            });
        }
        
        const subadmin = await SubAdmin.findById(id).select('-password -__v');
        
        if (!subadmin) {
            return res.status(404).json({ 
                success: false,
                error: 'Sub admin not found' 
            });
        }
        
        res.json({
            success: true,
            data: subadmin
        });
    } catch (error) {
        console.error('Get sub admin by ID error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error' 
        });
    }
});

// CREATE new sub admin
Subadminroute.post('/subadmins', authenticateAdmin,async (req, res) => {
    try {
        const { name, email, password, commission = 0, active = true } = req.body;
        
        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ 
                success: false,
                error: 'Name, email, and password are required' 
            });
        }
        
        if (commission < 0 || commission > 100) {
            return res.status(400).json({ 
                success: false,
                error: 'Commission must be between 0 and 100' 
            });
        }
        
        // Check if sub admin already exists
        const existingSubAdmin = await SubAdmin.findOne({ 
            email: email.toLowerCase() 
        });
        
        if (existingSubAdmin) {
            return res.status(400).json({ 
                success: false,
                error: 'Sub admin with this email already exists' 
            });
        }
        
        // Create new sub admin
        const subAdminData = {
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password,
            commission: Number(commission),
            active: active === true || active === 'true'
        };
        
        const newSubAdmin = new SubAdmin(subAdminData);
        await newSubAdmin.save();
        
        // Get public profile without password
        const subAdminResponse = newSubAdmin.getPublicProfile();
        
        res.status(201).json({
            success: true,
            message: 'Sub admin created successfully',
            data: subAdminResponse
        });
    } catch (error) {
        console.error('Create sub admin error:', error);
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ 
                success: false,
                error: 'Validation failed',
                details: errors 
            });
        }
        
        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({ 
                success: false,
                error: 'Email already exists' 
            });
        }
        
        res.status(500).json({ 
            success: false,
            error: 'Server error while creating sub admin' 
        });
    }
});

// UPDATE sub admin by ID
Subadminroute.put('/subadmins/:id', authenticateAdmin,async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, commission, active } = req.body;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid sub admin ID' 
            });
        }
        
        // Check if sub admin exists
        const subadmin = await SubAdmin.findById(id);
        if (!subadmin) {
            return res.status(404).json({ 
                success: false,
                error: 'Sub admin not found' 
            });
        }
        
        // Build update object
        const updateData = {};
        if (name) updateData.name = name.trim();
        if (email) updateData.email = email.toLowerCase().trim();
        if (commission !== undefined) {
            const commissionValue = Number(commission);
            if (commissionValue < 0 || commissionValue > 100) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Commission must be between 0 and 100' 
                });
            }
            updateData.commission = commissionValue;
        }
        if (active !== undefined) {
            updateData.active = active === true || active === 'true';
        }
        
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ 
                success: false,
                error: 'No data provided for update' 
            });
        }
        
        // Check for duplicate email (if updating email)
        if (email) {
            const existingSubAdmin = await SubAdmin.findOne({ 
                email: email.toLowerCase(), 
                _id: { $ne: id } 
            });
            if (existingSubAdmin) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Email already exists' 
                });
            }
        }
        
        // Update sub admin
        const updatedSubAdmin = await SubAdmin.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password -__v');
        
        res.json({
            success: true,
            message: 'Sub admin updated successfully',
            data: updatedSubAdmin
        });
    } catch (error) {
        console.error('Update sub admin error:', error);
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ 
                success: false,
                error: 'Validation failed',
                details: errors 
            });
        }
        
        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({ 
                success: false,
                error: 'Email already exists' 
            });
        }
        
        res.status(500).json({ 
            success: false,
            error: 'Server error while updating sub admin' 
        });
    }
});

// UPDATE sub admin commission only
Subadminroute.patch('/subadmins/:id/commission', authenticateAdmin,async (req, res) => {
    try {
        const { id } = req.params;
        const { commission } = req.body;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid sub admin ID' 
            });
        }
        
        if (commission === undefined || isNaN(commission)) {
            return res.status(400).json({ 
                success: false,
                error: 'Valid commission is required' 
            });
        }
        
        const commissionValue = Number(commission);
        if (commissionValue < 0 || commissionValue > 100) {
            return res.status(400).json({ 
                success: false,
                error: 'Commission must be between 0 and 100' 
            });
        }
        
        const subadmin = await SubAdmin.findById(id);
        if (!subadmin) {
            return res.status(404).json({ 
                success: false,
                error: 'Sub admin not found' 
            });
        }
        
        const updateData = {
            commission: commissionValue
        };
        
        const updatedSubAdmin = await SubAdmin.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password -__v');
        
        res.json({
            success: true,
            message: `Commission updated to ${commissionValue}%`,
            data: updatedSubAdmin
        });
    } catch (error) {
        console.error('Update commission error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while updating commission' 
        });
    }
});

// TOGGLE sub admin active status
Subadminroute.patch('/subadmins/:id/toggle-status', authenticateAdmin,async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid sub admin ID' 
            });
        }
        
        const subadmin = await SubAdmin.findById(id);
        if (!subadmin) {
            return res.status(404).json({ 
                success: false,
                error: 'Sub admin not found' 
            });
        }
        
        const newStatus = !subadmin.active;
        
        const updateData = {
            active: newStatus
        };
        
        const updatedSubAdmin = await SubAdmin.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        ).select('-password -__v');
        
        res.json({
            success: true,
            message: `Sub admin status changed to ${newStatus ? 'active' : 'inactive'}`,
            data: updatedSubAdmin
        });
    } catch (error) {
        console.error('Toggle sub admin status error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while toggling status' 
        });
    }
});

// UPDATE sub admin password
Subadminroute.put('/subadmins/:id/password', authenticateAdmin,async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword, confirmPassword } = req.body;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid sub admin ID' 
            });
        }
        
        if (!newPassword || !confirmPassword) {
            return res.status(400).json({ 
                success: false,
                error: 'New password and confirm password are required' 
            });
        }
        
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ 
                success: false,
                error: 'Passwords do not match' 
            });
        }
        
        if (newPassword.length < 6) {
            return res.status(400).json({ 
                success: false,
                error: 'Password must be at least 6 characters long' 
            });
        }
        
        const subadmin = await SubAdmin.findById(id);
        if (!subadmin) {
            return res.status(404).json({ 
                success: false,
                error: 'Sub admin not found' 
            });
        }
        
        // Update password (pre-save middleware will hash it)
        subadmin.password = newPassword;
        await subadmin.save();
        
        res.json({
            success: true,
            message: 'Password updated successfully'
        });
    } catch (error) {
        console.error('Update sub admin password error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while updating password' 
        });
    }
});

// DELETE sub admin by ID
Subadminroute.delete('/subadmins/:id', authenticateAdmin,async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid sub admin ID' 
            });
        }
        
        // Check if sub admin exists
        const subadmin = await SubAdmin.findById(id);
        if (!subadmin) {
            return res.status(404).json({ 
                success: false,
                error: 'Sub admin not found' 
            });
        }
        
        // Delete sub admin
        await SubAdmin.findByIdAndDelete(id);
        
        res.json({
            success: true,
            message: 'Sub admin deleted successfully'
        });
    } catch (error) {
        console.error('Delete sub admin error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while deleting sub admin' 
        });
    }
});

// DELETE all sub admins (optional - for superadmin only)
Subadminroute.delete('/subadmins', authenticateAdmin,async (req, res) => {
    try {
        const { confirmation } = req.body;
        
        // Optional confirmation for safety
        if (!confirmation || confirmation !== 'DELETE_ALL_SUBADMINS') {
            return res.status(400).json({
                success: false,
                error: 'Confirmation phrase is required. Send confirmation: "DELETE_ALL_SUBADMINS" in the request body.'
            });
        }
        
        // Get count of sub admins before deletion
        const totalSubAdmins = await SubAdmin.countDocuments();
        
        if (totalSubAdmins === 0) {
            return res.status(404).json({
                success: false,
                error: 'No sub admins found to delete'
            });
        }
        
        // Delete all sub admins
        const result = await SubAdmin.deleteMany({});
        
        res.json({
            success: true,
            message: `Successfully deleted ${result.deletedCount} sub admin(s)`,
            data: {
                deletedCount: result.deletedCount,
                totalSubAdminsBeforeDeletion: totalSubAdmins
            }
        });
        
    } catch (error) {
        console.error('Delete all sub admins error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while deleting all sub admins'
        });
    }
});

// GET sub admin statistics
Subadminroute.get('/subadmins/stats/overview', authenticateAdmin, async (req, res) => {
    try {
        const stats = await SubAdmin.aggregate([
            {
                $group: {
                    _id: null,
                    totalSubAdmins: { $sum: 1 },
                    activeSubAdmins: { 
                        $sum: { $cond: ["$active", 1, 0] } 
                    },
                    inactiveSubAdmins: { 
                        $sum: { $cond: ["$active", 0, 1] } 
                    },
                    totalCommission: { $sum: "$commission" },
                    avgCommission: { $avg: "$commission" },
                    minCommission: { $min: "$commission" },
                    maxCommission: { $max: "$commission" }
                }
            }
        ]);
        
        const responseStats = stats[0] || {
            totalSubAdmins: 0,
            activeSubAdmins: 0,
            inactiveSubAdmins: 0,
            totalCommission: 0,
            avgCommission: 0,
            minCommission: 0,
            maxCommission: 0
        };
        
        res.json({
            success: true,
            data: responseStats
        });
    } catch (error) {
        console.error('Get sub admin stats error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error while fetching sub admin statistics' 
        });
    }
});

// BULK update sub admin commissions
Subadminroute.put('/subadmins/bulk/commission', authenticateAdmin,async (req, res) => {
    try {
        const { subadminIds, commission } = req.body;
        
        if (!subadminIds || !Array.isArray(subadminIds) || subadminIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Array of sub admin IDs is required'
            });
        }
        
        if (commission === undefined || isNaN(commission)) {
            return res.status(400).json({
                success: false,
                error: 'Valid commission is required'
            });
        }
        
        const commissionValue = Number(commission);
        if (commissionValue < 0 || commissionValue > 100) {
            return res.status(400).json({
                success: false,
                error: 'Commission must be between 0 and 100'
            });
        }
        
        // Validate all IDs
        const validIds = subadminIds.filter(id => mongoose.Types.ObjectId.isValid(id));
        if (validIds.length !== subadminIds.length) {
            return res.status(400).json({
                success: false,
                error: 'Invalid sub admin IDs found'
            });
        }
        
        // Update sub admins
        const result = await SubAdmin.updateMany(
            { _id: { $in: validIds } },
            { commission: commissionValue }
        );
        
        res.json({
            success: true,
            message: `Successfully updated commission to ${commissionValue}% for ${result.modifiedCount} sub admin(s)`,
            data: {
                modifiedCount: result.modifiedCount
            }
        });
    } catch (error) {
        console.error('Bulk update sub admin commissions error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while bulk updating commissions'
        });
    }
});

// BULK update sub admin status
Subadminroute.put('/subadmins/bulk/status', authenticateAdmin, async (req, res) => {
    try {
        const { subadminIds, active } = req.body;
        
        if (!subadminIds || !Array.isArray(subadminIds) || subadminIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Array of sub admin IDs is required'
            });
        }
        
        if (active === undefined || typeof active !== 'boolean') {
            return res.status(400).json({
                success: false,
                error: 'Valid active status is required (true/false)'
            });
        }
        
        // Validate all IDs
        const validIds = subadminIds.filter(id => mongoose.Types.ObjectId.isValid(id));
        if (validIds.length !== subadminIds.length) {
            return res.status(400).json({
                success: false,
                error: 'Invalid sub admin IDs found'
            });
        }
        
        // Update sub admins
        const result = await SubAdmin.updateMany(
            { _id: { $in: validIds } },
            { active }
        );
        
        res.json({
            success: true,
            message: `Successfully updated status to ${active ? 'active' : 'inactive'} for ${result.modifiedCount} sub admin(s)`,
            data: {
                modifiedCount: result.modifiedCount
            }
        });
    } catch (error) {
        console.error('Bulk update sub admin status error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while bulk updating status'
        });
    }
});

module.exports = Subadminroute;