const express = require("express");
const Userroute = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const User = require("../models/User");
const Bonus = require("../models/Bonus");
const DepositMethod = require("../models/DepositMethod");
const Service = require("../models/Service");
const Order = require("../models/Order");
const FormData = require('form-data');
// Email configuration
const emailConfig = {
    service: 'gmail',
    auth: {
        user:"mplusecomputer@gmail.com",
        pass:"lodn omwa xxor ciqc"
    }
};

// Create transporter
const transporter = nodemailer.createTransport(emailConfig);
const base_url_from_env = process.env.BASE_URL || "http://localhost:5000";
// Verify transporter connection
transporter.verify(function (error, success) {
    if (error) {
        console.log('Email transporter error:', error);
    } else {
        console.log('Email server is ready to send messages');
    }
});

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../public/uploads/profiles'); // Fixed path
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'));
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: fileFilter
});

// Middleware to authenticate user
const authenticateUser = async (req, res, next) => {
    try {
        
        // Try to get userId from different sources
        let userId = null;
        
        // 1. Check headers (from frontend)
        if (req.headers.userid) {
            userId = req.headers.userid;
        }
        // 2. Check query parameters
        else if (req.query.userId) {
            userId = req.query.userId;
        }
        // 3. Check body
        else if (req.body.userId) {
            userId = req.body.userId;
        }
        
        if (!userId) {
            return res.status(401).json({ 
                success: false, 
                message: "Authentication required. User ID not found." 
            });
        }
        
        // Validate userId format (MongoDB ObjectId)
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid user ID format" 
            });
        }
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: "User not found" 
            });
        }
        
        req.user = user;
        next();
    } catch (error) {
        console.error("Authentication error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Server error", 
            error: error.message 
        });
    }
};

// ==================== EMAIL VERIFICATION ROUTES ====================

// 1. SEND EMAIL VERIFICATION OTP (Protected - user must be logged in)
Userroute.post("/send-email-verification", authenticateUser, async (req, res) => {
    try {
        const user = req.user;
        console.log("Sending verification email for:", user.email);
        
        // Check if email is already verified
        if (user.emailverified) {
            return res.status(400).json({
                success: false,
                message: "Email is already verified"
            });
        }
        
        // Check cooldown period
        if (user.lastEmailVerificationSentAt && !user.canResendEmailVerification()) {
            const timeLeft = Math.ceil((60 * 1000 - (Date.now() - user.lastEmailVerificationSentAt.getTime())) / 1000);
            return res.status(429).json({
                success: false,
                message: `Please wait ${timeLeft} seconds before requesting another verification OTP`
            });
        }
        
        // Generate email verification OTP
        const otp = user.generateEmailVerificationOTP();
        await user.save();
        
        // Send verification email
        const mailOptions = {
            from: `"Digital Service" <${emailConfig.auth.user}>`,
            to: user.email,
            subject: 'Verify Your Email Address',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Email Verification</h2>
                    <p>Hello ${user.fullname},</p>
                    <p>Thank you for registering. Please use the verification code below to verify your email address:</p>
                    
                    <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
                        <h1 style="color: #007bff; font-size: 32px; letter-spacing: 5px; margin: 0;">
                            ${otp}
                        </h1>
                    </div>
                    
                    <p>This code will expire in 15 minutes.</p>
                    <p>If you didn't create an account, please ignore this email.</p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                    <p style="color: #666; font-size: 12px;">
                        This is an automated message, please do not reply to this email.
                    </p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        
        res.status(200).json({
            success: true,
            message: "Verification OTP sent to your email",
            data: {
                email: user.email,
                canResendAfter: 60 // seconds
            }
        });
    } catch (error) {
        console.error("Send verification error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to send verification OTP",
            error: error.message
        });
    }
});

// 2. VERIFY EMAIL WITH OTP (Protected)
Userroute.post("/verify-email-otp", authenticateUser, async (req, res) => {
    try {
        const { otp } = req.body;
        const user = req.user;
        
        console.log("Verifying email for:", user.email, "OTP:", otp);
        
        if (!otp) {
            return res.status(400).json({
                success: false,
                message: "OTP is required"
            });
        }
        
        // Check if email is already verified
        if (user.emailverified) {
            return res.status(400).json({
                success: false,
                message: "Email is already verified"
            });
        }
        
        // Verify the OTP
        const verificationResult = user.verifyEmailOTP(otp);
        
        if (!verificationResult.valid) {
            await user.save();
            return res.status(400).json({
                success: false,
                message: verificationResult.message,
                attemptsRemaining: verificationResult.attemptsRemaining
            });
        }
        
        // Save user with verified status
        await user.save();
        
        // Send welcome email
        const mailOptions = {
            from: `"Your App" <${emailConfig.auth.user}>`,
            to: user.email,
            subject: 'Welcome to Our Platform!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Welcome, ${user.fullname}!</h2>
                    <p>Congratulations! Your email has been successfully verified.</p>
                    <p>You can now enjoy all the features of our platform.</p>
                    <p>Thank you for joining us!</p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                    <p style="color: #666; font-size: 12px;">
                        This is an automated message, please do not reply to this email.
                    </p>
                </div>
            `
        };
        
        transporter.sendMail(mailOptions).catch(console.error);
        
        res.status(200).json({
            success: true,
            message: "Email verified successfully",
            data: {
                email: user.email,
                emailverified: user.emailverified,
                status: user.status
            }
        });
    } catch (error) {
        console.error("Verify email error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to verify email",
            error: error.message
        });
    }
});

// 3. CHECK VERIFICATION STATUS (Protected)
Userroute.get("/email-verification-status", authenticateUser, async (req, res) => {
    try {
        const user = req.user;
        
        res.status(200).json({
            success: true,
            data: {
                email: user.email,
                emailverified: user.emailverified,
                status: user.status,
                canResendVerification: user.canResendEmailVerification(),
                lastVerificationSent: user.lastEmailVerificationSentAt
            }
        });
    } catch (error) {
        console.error("Verification status error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get verification status",
            error: error.message
        });
    }
});

// 4. RESEND VERIFICATION OTP (Public - for users who lost the email)
Userroute.post("/resend-email-verification", async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }
        
        console.log("Resending verification for email:", email);
        
        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found with this email"
            });
        }
        
        // Check if email is already verified
        if (user.emailverified) {
            return res.status(400).json({
                success: false,
                message: "Email is already verified"
            });
        }
        
        // Check cooldown period
        if (user.lastEmailVerificationSentAt && !user.canResendEmailVerification()) {
            const timeLeft = Math.ceil((60 * 1000 - (Date.now() - user.lastEmailVerificationSentAt.getTime())) / 1000);
            return res.status(429).json({
                success: false,
                message: `Please wait ${timeLeft} seconds before requesting another verification OTP`
            });
        }
        
        // Generate and send new OTP
        const otp = user.generateEmailVerificationOTP();
        await user.save();
        
        // Send verification email
        const mailOptions = {
            from: `"Your App" <${emailConfig.auth.user}>`,
            to: user.email,
            subject: 'Email Verification OTP',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Email Verification</h2>
                    <p>Hello ${user.fullname},</p>
                    <p>You requested a new verification code. Please use the code below:</p>
                    
                    <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
                        <h1 style="color: #007bff; font-size: 32px; letter-spacing: 5px; margin: 0;">
                            ${otp}
                        </h1>
                    </div>
                    
                    <p>This code will expire in 15 minutes.</p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                    <p style="color: #666; font-size: 12px;">
                        This is an automated message, please do not reply to this email.
                    </p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        
        res.status(200).json({
            success: true,
            message: "Verification OTP sent to your email",
            data: {
                email: user.email,
                canResendAfter: 60
            }
        });
    } catch (error) {
        console.error("Resend verification error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to resend verification OTP",
            error: error.message
        });
    }
});

// ==================== EXISTING ROUTES ====================

// 1. GET USER PROFILE DATA
Userroute.get("/profile", authenticateUser, async (req, res) => {
    try {
        const user = req.user;
        console.log("Profile requested for:", user.email);
        
        const userData = {
            _id: user._id,
            profile: user.profile,
            fullname: user.fullname,
            email: user.email,
            whatsappnumber: user.whatsappnumber,
            emailverified: user.emailverified,
            balance: user.balance,
            totaldeposit: user.totaldeposit,
            status: user.status,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };
        
        console.log("Sending user data for:", user.email);
        
        res.status(200).json({
            success: true,
            message: "User profile retrieved successfully",
            data: userData
        });
    } catch (error) {
        console.error("Profile route error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get user profile",
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// 2. UPDATE PROFILE PICTURE
Userroute.post("/update-profile-picture", 
    authenticateUser, 
    upload.single('profile'), 
    async (req, res) => {
    try {
        console.log("Update profile picture request");
        
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded"
            });
        }
        
        const user = req.user;
        const oldProfilePath = user.profile;
        
        const fileUrl = `/uploads/profiles/${req.file.filename}`;
        
        user.profile = fileUrl;
        await user.save();
        
        if (oldProfilePath && 
            !oldProfilePath.includes('freepik.com') && 
            oldProfilePath.includes('/uploads/profiles/')) {
            const oldFilePath = path.join(__dirname, '../', oldProfilePath);
            if (fs.existsSync(oldFilePath)) {
                fs.unlinkSync(oldFilePath);
            }
        }
        
        res.status(200).json({
            success: true,
            message: "Profile picture updated successfully",
            data: {
                profile: user.profile
            }
        });
    } catch (error) {
        console.error("Update profile picture error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update profile picture",
            error: error.message
        });
    }
});

// 3. UPDATE PASSWORD
Userroute.post("/update-password", authenticateUser, async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        const user = req.user;
        
        console.log("Update password for:", user.email);
        
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "All password fields are required"
            });
        }
        
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "New password must be at least 6 characters"
            });
        }
        
        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "New password and confirmation don't match"
            });
        }
        
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Current password is incorrect"
            });
        }
        
        const isSamePassword = await user.comparePassword(newPassword);
        if (isSamePassword) {
            return res.status(400).json({
                success: false,
                message: "New password cannot be the same as old password"
            });
        }
        
        user.password = newPassword;
        await user.save();
        
        res.status(200).json({
            success: true,
            message: "Password updated successfully"
        });
    } catch (error) {
        console.error("Update password error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update password",
            error: error.message
        });
    }
});

// 4. UPDATE USER DATA
Userroute.post("/update-profile", authenticateUser, async (req, res) => {
    try {
        const { fullname, whatsappnumber } = req.body;
        const user = req.user;
        
        console.log("Update profile for:", user.email, "Data:", { fullname, whatsappnumber });
        
        if (!fullname && !whatsappnumber) {
            return res.status(400).json({
                success: false,
                message: "No data provided for update"
            });
        }
        
        if (fullname) user.fullname = fullname;
        if (whatsappnumber) user.whatsappnumber = whatsappnumber;
        
        await user.save();
        
        const updatedUser = await User.findById(user._id).select('-password -otp -otpExpiry -otpAttempts -lastOtpSentAt -emailVerificationOTP -emailVerificationExpiry -emailVerificationAttempts -lastEmailVerificationSentAt');
        
        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: updatedUser
        });
    } catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update profile",
            error: error.message
        });
    }
});

// 5. DELETE PROFILE PICTURE
Userroute.post("/delete-profile-picture", authenticateUser, async (req, res) => {
    try {
        const user = req.user;
        const oldProfilePath = user.profile;
        
        console.log("Delete profile picture for:", user.email);
        
        user.profile = "https://img.freepik.com/premium-vector/flat-vector-illustration-administrator_1033579-56435.jpg?semt=ais_hybrid&w=740&q=80";
        await user.save();
        
        if (oldProfilePath && 
            !oldProfilePath.includes('freepik.com') && 
            oldProfilePath.includes('/uploads/profiles/')) {
            const oldFilePath = path.join(__dirname, '../', oldProfilePath);
            if (fs.existsSync(oldFilePath)) {
                fs.unlinkSync(oldFilePath);
            }
        }
        
        res.status(200).json({
            success: true,
            message: "Profile picture deleted successfully",
            data: {
                profile: user.profile
            }
        });
    } catch (error) {
        console.error("Delete profile picture error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete profile picture",
            error: error.message
        });
    }
});

// Error handling middleware
Userroute.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: "File too large. Maximum size is 5MB"
            });
        }
        return res.status(400).json({
            success: false,
            message: error.message
        });
    } else if (error) {
        console.error("Route error:", error);
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
    next();
});



// GET all active deposit methods (Public route for users)
Userroute.get('/deposit-methods', async (req, res) => {
    try {
        const depositMethods = await DepositMethod.find({ status: 'active' })
            .select('-__v')
            .sort({ name: 1 });
        
        // Convert image paths to full URLs
        const depositMethodsWithUrls = depositMethods.map(method => {
            const methodObj = method.toObject();
            if (methodObj.image) {
                methodObj.image = req.protocol + '://' + req.get('host') + methodObj.image;
            }
            return methodObj;
        });
        
        res.status(200).json({
            success: true,
            message: 'Deposit methods retrieved successfully',
            data: depositMethodsWithUrls
        });
        
    } catch (error) {
        console.error('Get deposit methods error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch deposit methods',
            error: error.message
        });
    }
});


// GET all active bonuses (Public route for users)
Userroute.get('/bonuses', async (req, res) => {
    try {
        const bonuses = await Bonus.find({ status: 'active' })
            .select('-__v')
            .sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            message: 'Bonuses retrieved successfully',
            data: bonuses
        });
        
    } catch (error) {
        console.error('Get bonuses error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch bonuses',
            error: error.message
        });
    }
});


// ==================== DEPOSIT ROUTES ====================

// POST - Create Deposit Request
Userroute.post("/deposit", authenticateUser, async (req, res) => {
    try {
        const {
            accountNumber,
            transactionId,
            amount,
            depositMethodId
        } = req.body;

        const user = req.user;

        // Validation
        if (!accountNumber || !accountNumber.trim()) {
            return res.status(400).json({
                success: false,
                message: "Account number is required"
            });
        }

        if (!transactionId || !transactionId.trim()) {
            return res.status(400).json({
                success: false,
                message: "Transaction ID is required"
            });
        }

        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Valid amount is required"
            });
        }

        if (!depositMethodId) {
            return res.status(400).json({
                success: false,
                message: "Deposit method is required"
            });
        }

        // Check if deposit method exists
        const depositMethod = await DepositMethod.findById(depositMethodId);
        if (!depositMethod || depositMethod.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: "Invalid deposit method"
            });
        }

        // Check amount range
        const depositAmount = parseFloat(amount);
        if (depositAmount < depositMethod.minimumDeposit) {
            return res.status(400).json({
                success: false,
                message: `Minimum deposit is ${depositMethod.minimumDeposit}৳`
            });
        }

        if (depositAmount > depositMethod.maximumDeposit) {
            return res.status(400).json({
                success: false,
                message: `Maximum deposit is ${depositMethod.maximumDeposit}৳`
            });
        }

        // Calculate bonus
        let bonusAmount = 0;
        const bonus = await Bonus.findOne({
            status: 'active',
            minimumDeposit: { $lte: depositAmount },
            maximumDeposit: { $gte: depositAmount }
        });

        if (bonus) {
            if (bonus.bonusType === 'percentage') {
                bonusAmount = (depositAmount * bonus.bonusAmount) / 100;
            } else {
                bonusAmount = bonus.bonusAmount;
            }
            bonusAmount = Math.round(bonusAmount * 100) / 100;
        }

        // Create deposit
        const Deposit = require("../models/Deposit");
        const deposit = new Deposit({
            user: user._id,
            depositMethod: depositMethod._id,
            accountNumber: accountNumber.trim(),
            transactionId: transactionId.trim(),
            amount: depositAmount,
            bonusAmount: bonusAmount,
            status: 'pending'
        });

        await deposit.save();

        res.status(201).json({
            success: true,
            message: "Deposit request submitted successfully",
            data: {
                depositId: deposit._id,
                amount: deposit.amount,
                bonus: deposit.bonusAmount,
                status: deposit.status
            }
        });

    } catch (error) {
        console.error("Deposit error:", error);
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Transaction ID already exists"
            });
        }
        res.status(500).json({
            success: false,
            message: "Failed to process deposit",
            error: error.message
        });
    }
});

// GET - User Deposit History
Userroute.get("/deposit-history", authenticateUser, async (req, res) => {
    try {
        const user = req.user;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const Deposit = require("../models/Deposit");
        
        // Get total count
        const total = await Deposit.countDocuments({ user: user._id });
        
        // Get deposits with pagination
        const deposits = await Deposit.find({ user: user._id })
            .populate('depositMethod', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Format response
        const history = deposits.map(deposit => ({
            _id: deposit._id,
            paymentMethod: deposit.depositMethod?.name || 'Unknown',
            accountNumber: deposit.accountNumber,
            transactionId: deposit.transactionId,
            amount: deposit.amount,
            bonusAmount: deposit.bonusAmount,
            status: deposit.status,
            createdAt: deposit.createdAt
        }));

        res.status(200).json({
            success: true,
            data: history,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error("History error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch deposit history"
        });
    }
});

Userroute.get('/text-order-services', authenticateUser, async (req, res) => {
    try {
        // Get only text file services that are active
        const services = await Service.find({
            workType: 'text_file',
            workStatus: 'active'
        })
        .sort({ order: 1, createdAt: -1 });
        
        // Format response - INCLUDE fieldNames
        const formattedServices = services.map(service => ({
            _id: service._id,
            workName: service.workName,
            workNameEnglish: service.workNameEnglish,
            workRate: service.workRate,
            workType: service.workType,
            workStatus: service.workStatus,
            fieldNames: service.fieldNames, // ← ADD THIS LINE
            description: service.description,
            isFeatured: service.isFeatured,
            order: service.order,
            createdAt: service.createdAt,
            updatedAt: service.updatedAt
        }));
        
        res.status(200).json({
            success: true,
            message: 'Text file services retrieved successfully',
            data: formattedServices,
            count: services.length
        });
        
    } catch (error) {
        console.error('Get text file services error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch text file services',
            error: error.message
        });
    }
});
// 2. GET all ORDER FILE services only
Userroute.get('/order-file-services', authenticateUser, async (req, res) => {
    try {
        // Get only order file services that are active
        const services = await Service.find({
            workType: 'pdf_file',
            workStatus: 'active'
        })
        .sort({ order: 1, createdAt: -1 });
        
        // Format response - REMEMBER TO INCLUDE fieldNames!
        const formattedServices = services.map(service => ({
            _id: service._id,
            workName: service.workName,
            workNameEnglish: service.workNameEnglish,
            workRate: service.workRate,
            workType: service.workType,
            workStatus: service.workStatus,
            fieldNames: service.fieldNames, // ← ADD THIS LINE
            description: service.description,
            isFeatured: service.isFeatured,
            order: service.order,
            createdAt: service.createdAt,
            updatedAt: service.updatedAt
        }));
        
        res.status(200).json({
            success: true,
            message: 'Order file services retrieved successfully',
            data: formattedServices,
            count: services.length
        });
        
    } catch (error) {
        console.log(error)
        console.error('Get order file services error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch order file services',
            error: error.message
        });
    }
});

// 3. GET single service with field details (for both types)
Userroute.get('/services/:id', authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Validate ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid service ID'
            });
        }
        
        // Find service
        const service = await Service.findById(id);
        
        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Service not found'
            });
        }
        
        // Check if service is active
        if (service.workStatus !== 'active') {
            return res.status(400).json({
                success: false,
                message: 'Service is not active'
            });
        }
        
        // Format response
        const serviceData = {
            _id: service._id,
            workName: service.workName,
            workNameEnglish: service.workNameEnglish,
            workRate: service.workRate,
            workType: service.workType,
            workStatus: service.workStatus,
            fieldNames: service.fieldNames,
            description: service.description,
            isFeatured: service.isFeatured,
            order: service.order,
            createdAt: service.createdAt,
            updatedAt: service.updatedAt
        };
        
        res.status(200).json({
            success: true,
            message: 'Service details retrieved successfully',
            data: serviceData
        });
        
    } catch (error) {
        console.error('Get service details error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch service details',
            error: error.message
        });
    }
});


// POST - Create order
// In your Userroute.js, update the create-order route:
// Configure multer for order file uploads
const orderStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../public/uploads/orders/user-files');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'order-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadOrderFiles = multer({
  storage: orderStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, Word, Excel, images and text files are allowed!'));
    }
  }
}).array('files', 10); // Allow up to 10 files
// POST - Create new file order
const TelegramBot =require('node-telegram-bot-api');
const messagebot = new TelegramBot('7971243262:AAFfFEUPHgQE2wLLRuiyIx0K9X2LX1sj3w0');
Userroute.post("/create-order", authenticateUser, (req, res) => {
  uploadOrderFiles(req, res, async function(err) {
    try {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }

      const { serviceId, quantity, notes, urgency, dynamicData } = req.body;
      const user = req.user;
      
      console.log('Received body:', req.body);
      console.log('Dynamic data:', dynamicData);

      // Basic validation
      if (!serviceId) {
        return res.status(400).json({ 
          success: false, 
          message: "Service ID is required" 
        });
      }

      const service = await Service.findById(serviceId);
      if (!service) {
        return res.status(400).json({ 
          success: false, 
          message: "Service not found" 
        });
      }

      const totalAmount = service.workRate;

      if (user.balance < totalAmount) {
        return res.status(400).json({ 
          success: false, 
          message: "Insufficient balance." 
        });
      }

      const orderId = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const userFiles = req.files.map(file => ({
        originalName: file.originalname,
        fileName: file.filename,
        filePath: `/uploads/orders/user-files/${file.filename}`,
        fileSize: file.size,
        mimeType: file.mimetype
      }));

      // PARSE dynamicData string into fieldValues - FIXED VERSION
      const fieldValues = {};
      if (service.fieldNames && service.fieldNames.length > 0 && dynamicData) {
        // Parse the dynamicData string
        const lines = dynamicData.split(/\r?\n/).filter(line => line.trim() !== '');
        
        console.log('Parsing lines:', lines);
        console.log('Service field names:', service.fieldNames.map(f => f.name));
        
        for (const line of lines) {
          console.log('Processing line:', line);
          
          // Method 1: Split by dash (handles "Field: - value" format)
          const dashIndex = line.indexOf('-');
          if (dashIndex !== -1) {
            let fieldName = line.substring(0, dashIndex).trim();
            const fieldValue = line.substring(dashIndex + 1).trim();
            
            // Clean up field name - remove trailing colon
            fieldName = fieldName.replace(/:\s*$/, '');
            
            if (fieldName && fieldValue) {
              // Find matching field (case-insensitive)
              const fieldConfig = service.fieldNames.find(f => 
                f.name.toLowerCase() === fieldName.toLowerCase()
              );
              
              if (fieldConfig) {
                fieldValues[fieldName] = fieldValue;
                console.log(`✓ Matched field "${fieldName}" with value "${fieldValue}"`);
              } else {
                console.log(`✗ Field "${fieldName}" not found in service fieldNames`);
                
                // Try fuzzy matching - check if field name contains part of the service field name
                for (const serviceField of service.fieldNames) {
                  if (fieldName.toLowerCase().includes(serviceField.name.toLowerCase()) || 
                      serviceField.name.toLowerCase().includes(fieldName.toLowerCase())) {
                    fieldValues[serviceField.name] = fieldValue;
                    console.log(`✓ Fuzzy matched "${fieldName}" to service field "${serviceField.name}"`);
                    break;
                  }
                }
              }
            }
          }
        }
        
        console.log('Parsed fieldValues:', fieldValues);
        
        // Validate that all required fields are present
        const missingFields = [];
        service.fieldNames.forEach(field => {
          if (!fieldValues[field.name]) {
            missingFields.push(field.name);
          }
        });
        
        if (missingFields.length > 0) {
          console.log('Missing fields:', missingFields);
          // Don't fail the order, just log it - the order can still be created
        }
      }
  const now = new Date();
      const timeOptions = { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: true 
      };
      const formattedTime = now.toLocaleTimeString('en-US', timeOptions);
      const simpleTime = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
      // Create order
      const Order = require("../models/Order");
      const order = new Order({
        orderId: orderId,
        user: user._id,
        userId: user._id.toString(),
        username: user.fullname,
        userEmail: user.email,
        service: service._id,
        serviceName: service.workName || service.workNameEnglish,
        serviceRate: service.workRate,
        serviceType: service.workType,
        orderType: service.workType,
        quantity: quantity || 1,
        notes: notes || '',
        urgency: urgency || 'normal',
        totalAmount: totalAmount,
        fieldValues: fieldValues,
        userFiles: userFiles,
        status: 'pending',
        paymentStatus: 'paid',
        paymentMethod: 'wallet'
      });

      await order.save();

           const payinPayload = `
*ইউজার নাম:* ${user.email}
*অর্ডারটির তথ্য:* ${orderId}
*${user.fullname}*
*অর্ডারটির মূল্য:* ${totalAmount} টাকা
*অর্ডারটির সময়:* ${formattedTime}
`;

      // Send first message
      messagebot.sendMessage(7920367057, payinPayload, { parse_mode: "HTML" });

      // SECOND MESSAGE - Signature/copy section (exactly like the image)
      const signaturePayload = `
${service.workName}
${orderId}
${user.fullname}
${simpleTime}
`;

      // Send second message after a small delay
      setTimeout(() => {
        messagebot.sendMessage(7920367057, signaturePayload, { parse_mode: "HTML" });
      }, 500);
      console.log('Order created successfully:', order.orderId);
      console.log('Order fieldValues:', order.fieldValues);

      // Deduct amount from user balance
      user.balance -= totalAmount;
      await user.save();

      res.status(201).json({
        success: true,
        message: "Order created successfully",
        data: {
          orderId: order.orderId,
          serviceName: order.serviceName,
          quantity: order.quantity,
          totalAmount: order.totalAmount,
          status: order.status,
          fieldValues: order.fieldValues,
          createdAt: order.createdAt
        }
      });

    } catch (error) {
      console.error("Create order error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create order",
        error: error.message
      });
    }
  });
});
// Function to generate unique order ID
function generateOrderId() {
  const prefix = 'ORD';
  const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase(); // 4 random chars
  
  return `${prefix}${timestamp}${randomStr}`;
}
Userroute.post('/create-service-order', authenticateUser, async (req, res) => {
  try {
    console.log('Request body:', req.body);
    
    const {
      serviceId,
      serviceName,
      serviceRate,
      serviceType,
      orderType,
      quantity = 1,
      notes = '',
      urgency = 'normal',
      fieldValues = {},
      totalAmount
    } = req.body;

    // Validate required fields
    if (!serviceId || !serviceName || !serviceRate || !totalAmount) {
      return res.status(400).json({
        success: false,
        message: 'অনুগ্রহ করে সমস্ত প্রয়োজনীয় তথ্য প্রদান করুন'
      });
    }

    // Get user information
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ব্যবহারকারী পাওয়া যায়নি'
      });
    }

    // Check if user has sufficient balance
    if (user.balance < totalAmount) {
      return res.status(400).json({
        success: false,
        message: 'আপনার অ্যাকাউন্টে পর্যাপ্ত ব্যালেন্স নেই'
      });
    }

    // Generate unique order ID
    const orderId = generateOrderId();
    
    // Log generated order ID
    console.log('Generated Order ID:', orderId);
    console.log('User object:', {
      id: user._id,
      userId: req.user._id,
      username: user.username,
      name: user.name,
      email: user.email
    });

    // FIX: Get actual service ID from database if needed
    // Since you're passing serviceId as string, either:
    // Option 1: Use a real service ID from your Services collection
    // Option 2: Store serviceId as string in Order model (change model)
    
    // For now, create order without service reference or use a dummy ObjectId
    // If you have a Services collection, find the service by name or type:
    // const service = await Service.findOne({ 
    //   name: serviceName, 
    //   rate: serviceRate 
    // });
    
    // Create order - FIX the service field issue
    const order = new Order({
      user: user._id,
      userId: user.userId || user._id.toString(),
      username: user.username || user.name || 'Unknown User', // Fallback
      userEmail: user.email,
      service: new mongoose.Types.ObjectId(), // Create a dummy ObjectId or use actual service ID
      // OR if you want to store serviceId as string, change your model schema
      // service: serviceId, // This would require changing your Order schema
      serviceName,
      serviceRate,
      serviceType,
      orderType: orderType || 'text_file',
      quantity,
      notes,
      urgency,
      totalAmount,
      fieldValues: fieldValues,
      paymentStatus: 'paid',
      paymentMethod: 'wallet',
      status: 'pending',
      orderId: orderId // Make sure this is set
    });

    // Log order object before saving
    console.log('Order object to save:', order);

    // Deduct amount from user's wallet
    user.balance -= totalAmount;
    await user.save();


        // Get current time
    const now = new Date();
    const formattedTime = now.toLocaleString('en-US', {
      timeZone: 'Asia/Dhaka',
      hour12: true,
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    try {
      // Convert fieldValues object to string with field names and values
      let fieldValuesText = '';
      if (fieldValues && typeof fieldValues === 'object') {
        fieldValuesText = Object.entries(fieldValues)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n');
      } else {
        fieldValuesText = String(fieldValues);
      }

      const payinPayload = `
*ইউজার নাম:* ${user.email}
*অর্ডারটির তথ্য:*
${fieldValuesText}
*অর্ডারটির মূল্য:* ${totalAmount} টাকা
*অর্ডারটির সময়:* ${formattedTime}
`;

      // Send first message
      messagebot.sendMessage(5847592808, payinPayload, { parse_mode: "Markdown" });

      // SECOND MESSAGE - Service order section
      // Extract just the values for easy copying
      let fieldValuesOnly = '';
      if (fieldValues && typeof fieldValues === 'object') {
        fieldValuesOnly = Object.values(fieldValues).join(' ');
      } else {
        fieldValuesOnly = String(fieldValues);
      }

      const servicePayload = `
${serviceName}
${fieldValuesOnly}
`;

      // Send second message after a small delay
      setTimeout(() => {
        messagebot.sendMessage(5847592808, servicePayload, { parse_mode: "Markdown" });
      }, 500);
      
    } catch (botError) {
      console.error("Failed to send Telegram notification:", botError);
      // Don't fail the order if bot notification fails
    }
    // Save order
    await order.save();
    console.log('Order saved successfully:', order._id);

    // Populate order data
    const populatedOrder = await Order.findById(order._id)
      .populate('user', 'username email')
      // .populate('service', 'name rate'); // Remove if service is not a reference

    res.status(201).json({
      success: true,
      message: 'অর্ডার সফলভাবে তৈরি হয়েছে',
      data: populatedOrder || order // Return order if populate fails
    });

  } catch (error) {
    console.error('Order creation error details:', error.message);
    console.error('Full error:', error);
    res.status(500).json({
      success: false,
      message: 'অর্ডার তৈরি করতে সমস্যা হয়েছে',
      error: error.message
    });
  }
});
// GET - User orders
Userroute.get("/orders", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    
    const Order = require("../models/Order");
    const orders = await Order.find({ user: user._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: orders
    });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});
Userroute.get("/pdffile-orders", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    
    const Order = require("../models/Order");
    const orders = await Order.find({ user: user._id,orderType:"pdf_file" })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: orders
    });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});
// ==================== ORDER STATISTICS ROUTE ====================

// GET - Get order statistics (total, pending, completed orders)
Userroute.get("/order-statistics", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    
    // Get all orders for the authenticated user
    const orders = await Order.find({ user: user._id });
    
    // Calculate statistics
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(order => order.status === 'pending').length;
    const processingOrders = orders.filter(order => order.status === 'processing').length;
    const completedOrders = orders.filter(order => order.status === 'completed').length;
    const cancelledOrders = orders.filter(order => order.status === 'cancelled').length;
    
    // Calculate total spent
    const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    
    // Calculate amount for each status
    const pendingAmount = orders
      .filter(order => order.status === 'pending')
      .reduce((sum, order) => sum + order.totalAmount, 0);
    
    const processingAmount = orders
      .filter(order => order.status === 'processing')
      .reduce((sum, order) => sum + order.totalAmount, 0);
    
    const completedAmount = orders
      .filter(order => order.status === 'completed')
      .reduce((sum, order) => sum + order.totalAmount, 0);
    
    const cancelledAmount = orders
      .filter(order => order.status === 'cancelled')
      .reduce((sum, order) => sum + order.totalAmount, 0);

    // Get recent orders (last 5)
    const recentOrders = await Order.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('orderId serviceName totalAmount status createdAt');

    res.status(200).json({
      success: true,
      message: "Order statistics retrieved successfully",
      data: {
        // Count statistics
        counts: {
          total: totalOrders,
          pending: pendingOrders,
          processing: processingOrders,
          completed: completedOrders,
          cancelled: cancelledOrders
        },
        
        // Amount statistics
        amounts: {
          totalSpent: totalSpent,
          pending: pendingAmount,
          processing: processingAmount,
          completed: completedAmount,
          cancelled: cancelledAmount
        },
        
        // Percentage calculations
        percentages: {
          pending: totalOrders > 0 ? ((pendingOrders / totalOrders) * 100).toFixed(1) : 0,
          processing: totalOrders > 0 ? ((processingOrders / totalOrders) * 100).toFixed(1) : 0,
          completed: totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : 0,
          cancelled: totalOrders > 0 ? ((cancelledOrders / totalOrders) * 100).toFixed(1) : 0
        },
        
        // Recent orders
        recentOrders: recentOrders,
        
        // Additional info
        lastOrder: recentOrders.length > 0 ? recentOrders[0].createdAt : null,
        firstOrder: orders.length > 0 ? 
          orders.reduce((oldest, order) => order.createdAt < oldest.createdAt ? order : oldest).createdAt : null
      }
    });

  } catch (error) {
    console.error("Order statistics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order statistics",
      error: error.message
    });
  }
});

// ==================== SIMPLE VERSION ====================
// If you want an even simpler version with just the three numbers:

// GET - Simple order counts (total, pending, completed)
Userroute.get("/order-counts", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    
    // Get counts using MongoDB aggregation for better performance
    const counts = await Order.aggregate([
      {
        $match: {
          user: user._id
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] }
          },
          processing: {
            $sum: { $cond: [{ $eq: ["$status", "processing"] }, 1, 0] }
          },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] }
          }
        }
      }
    ]);

    // Format response
    const result = counts.length > 0 ? counts[0] : {
      total: 0,
      pending: 0,
      processing: 0,
      completed: 0,
      cancelled: 0
    };

    // Remove _id field
    delete result._id;

    res.status(200).json({
      success: true,
      message: "Order counts retrieved successfully",
      data: result
    });

  } catch (error) {
    console.error("Order counts error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order counts",
      error: error.message
    });
  }
});

Userroute.delete('/orders/:id', authenticateUser,async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if order exists
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ 
                success: false,
                error: 'Order not found' 
            });
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

// Import required modules at the top of your Userroute.js file
const axios = require('axios');
const qs = require('qs');

// ==================== NID PDF DATA EXTRACTION ROUTE ====================

// Configure multer for memory storage (no disk saving)
const memoryStorage = multer.memoryStorage();

const uploadNidPdf = multer({
  storage: memoryStorage,
  limits: { 
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'));
    }
  }
});

// POST - Extract data from NID PDF (in-memory processing)
// PDF Extraction Route

// PDF Extraction Route - FIXED VERSION
Userroute.post('/extract-nid-data', uploadNidPdf.single('pdf'), async (req, res) => {
  let user = null;
  
  try {
    // Check if file exists
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No PDF file uploaded'
      });
    }

    // Get user from authentication middleware
    const userId = req.headers['userid'] || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User ID not provided'
      });
    }

    // Find user
    user = await User.findById(userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log("user", user);

    // Check balance
    if (user.balance < 5) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance. Minimum 5৳ required.',
        balance: user.balance
      });
    }

    // Prepare data for the external API
    const externalFormData = new FormData();
    
    // Add PDF file
    externalFormData.append('pdf', req.file.buffer, req.file.originalname);
    
    // Add API credentials
    externalFormData.append('apiKey', 'MJ-35011f464e26');
    externalFormData.append('Key', '7392362559');
    externalFormData.append('domain', req.headers.host || req.headers.origin || 'localhost');

    console.log('Sending request to external API...');

    // Call the external API
    const apiResponse = await axios.post('https://api.autoseba.site/signtonid/index.php', externalFormData, {
      headers: {
        ...externalFormData.getHeaders(),
        'Origin': '',
        'Accept': 'application/json',
        'Content-Type': 'multipart/form-data'
      },
      timeout: 60000, // 60 seconds timeout
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    // External API details for reference
    // {
    //   "cUrl": "https://api.autoseba.site/signtonid/index.php",
    //   "pdf and Key": "",
    //   "apiKey": "MJ-35011f464e26"
    // }

    console.log('API Response received:', apiResponse.status);
    console.log('API Response data:', apiResponse.data);

    // Parse the response
    let extractedData;
    try {
      extractedData = apiResponse.data;
      
      // Validate the response structure
      if (!extractedData || typeof extractedData !== 'object') {
        throw new Error('Invalid response format from API');
      }
      
      // Check if the API returned an error
      if (extractedData.code !== 200 || !extractedData.status) {
        return res.status(400).json({
          success: false,
          message: extractedData.message || 'Failed to extract data from PDF',
          data: extractedData
        });
      }
      
      // Log the successful extraction
      console.log('Data extraction successful:', {
        requestId: extractedData.data?.requestId,
        nameEnglish: extractedData.data?.nameEnglish,
        brn: extractedData.data?.brn
      });
      
    } catch (parseError) {
      console.error('Error parsing API response:', parseError);
      throw new Error('Invalid response from PDF processing service');
    }

    // Deduct balance
    user.balance -= 5;
    await user.save();

    // Log the transaction
    const transaction = new Transaction({
      userId: user._id,
      type: 'debit',
      amount: 5,
      service: 'NID Data Extraction',
      description: 'PDF to NID data extraction',
      balanceAfter: user.balance,
      reference: `NID-${Date.now()}`,
      status: 'completed',
      apiRequestId: extractedData.data?.requestId || null
    });
    await transaction.save();

    // Format the response data according to the new structure
    const formattedResponse = {
      success: true,
      message: 'NID data extracted successfully',
      requestId: extractedData.data?.requestId,
      data: {
        // Personal Information
        personalInfo: {
          nameBangla: extractedData.data?.nameBangla,
          nameEnglish: extractedData.data?.nameEnglish,
          genderBangla: extractedData.data?.genderBangla,
          genderEnglish: extractedData.data?.genderEnglish,
          brn: extractedData.data?.brn,
          dateOfBirth: extractedData.data?.dateOfBirth,
          dobInWord: extractedData.data?.dobInWord,
          phoneNumber: extractedData.data?.phoneNumber,
          religionBangla: extractedData.data?.religionBangla,
          religionEnglish: extractedData.data?.religionEnglish
        },
        
        // Family Information
        familyInfo: {
          fatherNameBangla: extractedData.data?.fatherNameBangla,
          fatherNameEnglish: extractedData.data?.fatherNameEnglish,
          fatherNationalityBangla: extractedData.data?.fathersNationalityBangla,
          fatherNationalityEnglish: extractedData.data?.fathersNationalityEnglish,
          motherNameBangla: extractedData.data?.motherNameBangla,
          motherNameEnglish: extractedData.data?.motherNameEnglish,
          motherNationalityBangla: extractedData.data?.mothersNationalityBangla,
          motherNationalityEnglish: extractedData.data?.mothersNationalityEnglish
        },
        
        // Address Information
        addressInfo: {
          birthPlaceBangla: extractedData.data?.birthPlaceBangla,
          birthPlaceEnglish: extractedData.data?.birthPlaceEnglish,
          addressBangla: extractedData.data?.addressBangla,
          addressEnglish: extractedData.data?.addressEnglish
        },
        
        // Registration Information
        registrationInfo: {
          registerOfficeBangla: extractedData.data?.registerOfficeBangla,
          registerOfficeEnglish: extractedData.data?.registerOfficeEnglish,
          registerOfficeLocationBangla: extractedData.data?.registerOfficeLocationBangla,
          registerOfficeLocationEnglish: extractedData.data?.registerOfficeLocationEnglish,
          officeId: extractedData.data?.officeId
        },
        
        // Additional Information
        additionalInfo: {
          isAdult: extractedData.data?.isAdult === "true",
          todayDateEnglish: extractedData.data?.todayDateEnglish,
          todayDateBangla: extractedData.data?.todayDateBangla,
          convertedDob: extractedData.data?.convertedDob
        }
      },
      transaction: {
        amount: 5,
        balance: user.balance,
        transactionId: transaction._id,
        requestId: extractedData.data?.requestId
      },
      metadata: {
        developer: extractedData.DEVELOPER,
        system: extractedData.SYSTEM,
        timestamp: new Date().toISOString()
      }
    };

    // Return success response
    return res.status(200).json(formattedResponse);

  } catch (error) {
    console.error('PDF extraction error:', error.message);
    console.error('Error stack:', error.stack);
    
    // Return appropriate error response
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({
        success: false,
        message: 'Request timeout. Please try again with a smaller file.'
      });
    }
    
    if (error.response) {
      // The external API returned an error
      console.error('External API error response:', error.response.data);
      return res.status(error.response.status).json({
        success: false,
        message: 'External service error',
        error: error.response.data || 'Unknown error from external service',
        statusCode: error.response.status
      });
    }
    
    // Handle network errors
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        message: 'External service is currently unavailable. Please try again later.'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error during PDF extraction',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});


// ==================== VOMIONNOYON (ভূমি উন্নয়ন কর) ROUTES ====================

// Import the model at the top
const Vomionnoyon = require("../models/Vomionnoyon");
const Transaction = require("../models/Transaction");

// Helper function to generate receipt ID
function generateReceiptId() {
  const prefix = 'VOM';
  const timestamp = Date.now().toString().slice(-8); // Last 8 digits of timestamp
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase(); // 4 random chars
  
  return `${prefix}${timestamp}${randomStr}`;
}

// POST - Save ভূমি উন্নয়ন কর receipt
Userroute.post("/vomionnoyon/save", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    
    // Validate required fields
    const requiredFields = [
      'formNo', 'porishishto', 'slNo', 'officeName', 'mouza', 'upazila',
      'district', 'khatian', 'holding', 'totalLand', 'currentDemand',
      'totalCollect', 'inWords', 'note', 'dateBn', 'dateEn'
    ];
    
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({
          success: false,
          message: `${field} is required`
        });
      }
    }
    
    // Validate arrays
    if (!req.body.owners || !Array.isArray(req.body.owners) || req.body.owners.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one owner is required"
      });
    }
    
    if (!req.body.lands || !Array.isArray(req.body.lands) || req.body.lands.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one land entry is required"
      });
    }
    
    // Generate receipt ID
    const receiptId = generateReceiptId();
    
    // Create the full verification URL with receipt ID
    const verificationUrl = `https://api.xbdapi.my.id/clone-services/vomi-unnoyon-kor-downlaod/${receiptId}`;
    
    // Generate QR code data with full URL and receipt info
    const qrCodeData = `ভূমি উন্নয়ন কর রসিদ  যাচাই করুন: ${verificationUrl}`;
    
    // Create new vomionnoyon document
    const vomionnoyon = new Vomionnoyon({
      user: user._id,
      receiptId: receiptId,
      formNo: req.body.formNo,
      porishishto: req.body.porishishto,
      slNo: req.body.slNo,
      onuchhed: req.body.onuchhed || '৩৯২',
      officeName: req.body.officeName,
      mouza: req.body.mouza,
      upazila: req.body.upazila,
      district: req.body.district,
      khatian: req.body.khatian,
      holding: req.body.holding,
      totalLand: req.body.totalLand,
      arrear3Plus: req.body.arrear3Plus || '০',
      arrearLast3: req.body.arrearLast3 || '০',
      interest: req.body.interest || '০',
      currentDemand: req.body.currentDemand,
      totalDemand: req.body.totalDemand || req.body.currentDemand,
      totalCollect: req.body.totalCollect,
      totalArrear: req.body.totalArrear || '০',
      inWords: req.body.inWords,
      note: req.body.note,
      chalanNo: req.body.chalanNo || '',
      dateBn: req.body.dateBn,
      dateEn: req.body.dateEn,
      owners: req.body.owners,
      lands: req.body.lands,
      qrCodeData: qrCodeData,
      verificationUrl: verificationUrl, // Save the URL separately as well
      status: 'completed'
    });
    
    await vomionnoyon.save();
    
    res.status(201).json({
      success: true,
      message: "ভূমি উন্নয়ন কর রসিদ সফলভাবে সংরক্ষণ করা হয়েছে",
      data: {
        _id: vomionnoyon._id, // Include MongoDB _id in response
        receiptId: vomionnoyon.receiptId,
        slNo: vomionnoyon.slNo,
        totalCollect: vomionnoyon.totalCollect,
        dateEn: vomionnoyon.dateEn,
        verificationUrl: vomionnoyon.verificationUrl,
        createdAt: vomionnoyon.createdAt
      }
    });
    
  } catch (error) {
    console.error("Save vomionnoyon error:", error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Receipt ID already exists. Please try again."
      });
    }
    
    res.status(500).json({
      success: false,
      message: "রসিদ সংরক্ষণ করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get all ভূমি উন্নয়ন কর receipts for user
Userroute.get("/vomionnoyon/all", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Search filter
    const search = req.query.search || '';
    
    // Build query
    let query = { user: user._id };
    
    if (search) {
      query.$or = [
        { slNo: { $regex: search, $options: 'i' } },
        { officeName: { $regex: search, $options: 'i' } },
        { mouza: { $regex: search, $options: 'i' } },
        { upazila: { $regex: search, $options: 'i' } },
        { khatian: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Get total count
    const total = await Vomionnoyon.countDocuments(query);
    
    // Get receipts
    const receipts = await Vomionnoyon.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-qrCodeData -__v');
    
    // Format response
    const formattedReceipts = receipts.map(receipt => ({
      _id: receipt._id,
      receiptId: receipt.receiptId,
      slNo: receipt.slNo,
      officeName: receipt.officeName,
      mouza: receipt.mouza,
      upazila: receipt.upazila,
      district: receipt.district,
      khatian: receipt.khatian,
      holding: receipt.holding,
      totalLand: receipt.totalLand,
      totalCollect: receipt.totalCollect,
      dateBn: receipt.dateBn,
      dateEn: receipt.dateEn,
      ownersCount: receipt.owners.length,
      landsCount: receipt.lands.length,
      status: receipt.status,
      createdAt: receipt.createdAt
    }));
    
    res.status(200).json({
      success: true,
      message: "ভূমি উন্নয়ন কর রসিদ তালিকা",
      data: formattedReceipts,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error("Get vomionnoyon list error:", error);
    res.status(500).json({
      success: false,
      message: "রসিদ তালিকা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get single ভূমি উন্নয়ন কর receipt by ID
Userroute.get("/vomionnoyon/:id", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "অবৈধ রসিদ আইডি"
      });
    }
    
    // Find receipt
    const receipt = await Vomionnoyon.findOne({
      _id: id,
      user: user._id
    });
    
    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: "রসিদ পাওয়া যায়নি"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "রসিদ ডাটা লোড সফল",
      data: receipt
    });
    
  } catch (error) {
    console.error("Get vomionnoyon details error:", error);
    res.status(500).json({
      success: false,
      message: "রসিদ ডাটা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get ভূমি উন্নয়ন কর receipt by receiptId
Userroute.get("/vomionnoyon/receipt/:receiptId", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { receiptId } = req.params;
    
    if (!receiptId) {
      return res.status(400).json({
        success: false,
        message: "রসিদ আইডি প্রয়োজন"
      });
    }
    
    // Find receipt
    const receipt = await Vomionnoyon.findOne({
      receiptId: receiptId,
      user: user._id
    });
    
    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: "রসিদ পাওয়া যায়নি"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "রসিদ ডাটা লোড সফল",
      data: receipt
    });
    
  } catch (error) {
    console.error("Get vomionnoyon by receiptId error:", error);
    res.status(500).json({
      success: false,
      message: "রসিদ ডাটা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// PUT - Update ভূমি উন্নয়ন কর receipt
Userroute.put("/vomionnoyon/:id", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "অবৈধ রসিদ আইডি"
      });
    }
    
    // Find receipt
    const receipt = await Vomionnoyon.findOne({
      _id: id,
      user: user._id
    });
    
    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: "রসিদ পাওয়া যায়নি"
      });
    }
    
    // Check if receipt can be edited (only if not archived)
    if (receipt.status === 'archived') {
      return res.status(400).json({
        success: false,
        message: "আর্কাইভ করা রসিদ সম্পাদনা করা যাবে না"
      });
    }
    
    // Update fields if provided
    const updateFields = [
      'formNo', 'porishishto', 'slNo', 'onuchhed', 'officeName', 'mouza',
      'upazila', 'district', 'khatian', 'holding', 'totalLand', 'arrear3Plus',
      'arrearLast3', 'interest', 'currentDemand', 'totalDemand', 'totalCollect',
      'totalArrear', 'inWords', 'note', 'chalanNo', 'dateBn', 'dateEn'
    ];
    
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        receipt[field] = req.body[field];
      }
    });
    
    // Update owners if provided
    if (req.body.owners && Array.isArray(req.body.owners)) {
      receipt.owners = req.body.owners;
    }
    
    // Update lands if provided
    if (req.body.lands && Array.isArray(req.body.lands)) {
      receipt.lands = req.body.lands;
    }
    
    // Update QR code if relevant fields changed
    if (req.body.slNo || req.body.khatian || req.body.totalCollect || req.body.dateEn) {
      receipt.qrCodeData = `Receipt:${receipt.slNo}|Khatian:${receipt.khatian}|Amount:${receipt.totalCollect}|Date:${receipt.dateEn}`;
    }
    
    await receipt.save();
    
    res.status(200).json({
      success: true,
      message: "রসিদ সফলভাবে আপডেট করা হয়েছে",
      data: {
        receiptId: receipt.receiptId,
        updatedAt: receipt.updatedAt
      }
    });
    
  } catch (error) {
    console.error("Update vomionnoyon error:", error);
    res.status(500).json({
      success: false,
      message: "রসিদ আপডেট করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// DELETE - Delete ভূমি উন্নয়ন কর receipt
Userroute.delete("/vomionnoyon/:id", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "অবৈধ রসিদ আইডি"
      });
    }
    
    // Find and delete receipt
    const result = await Vomionnoyon.findOneAndDelete({
      _id: id,
      user: user._id
    });
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "রসিদ পাওয়া যায়নি"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "রসিদ সফলভাবে ডিলিট করা হয়েছে",
      data: {
        receiptId: result.receiptId,
        deletedAt: new Date()
      }
    });
    
  } catch (error) {
    console.error("Delete vomionnoyon error:", error);
    res.status(500).json({
      success: false,
      message: "রসিদ ডিলিট করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get statistics (total receipts, total amount collected)
Userroute.get("/vomionnoyon/statistics", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    
    // Get all receipts for the user
    const receipts = await Vomionnoyon.find({ user: user._id });
    
    // Calculate statistics
    const totalReceipts = receipts.length;
    
    // Calculate total amount collected (converting string to number)
    const totalAmount = receipts.reduce((sum, receipt) => {
      const amount = parseFloat(receipt.totalCollect) || 0;
      return sum + amount;
    }, 0);
    
    // Count by district
    const districtStats = {};
    receipts.forEach(receipt => {
      const district = receipt.district || 'Unknown';
      districtStats[district] = (districtStats[district] || 0) + 1;
    });
    
    // Get recent receipts (last 5)
    const recentReceipts = receipts
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(receipt => ({
        receiptId: receipt.receiptId,
        slNo: receipt.slNo,
        officeName: receipt.officeName,
        totalCollect: receipt.totalCollect,
        dateEn: receipt.dateEn,
        createdAt: receipt.createdAt
      }));
    
    res.status(200).json({
      success: true,
      message: "ভূমি উন্নয়ন কর পরিসংখ্যান",
      data: {
        totalReceipts,
        totalAmount: totalAmount.toFixed(2),
        districtStats,
        recentReceipts,
        firstReceipt: receipts.length > 0 
          ? receipts.reduce((oldest, receipt) => 
              receipt.createdAt < oldest.createdAt ? receipt : oldest
            ).createdAt 
          : null,
        lastReceipt: receipts.length > 0 
          ? receipts.reduce((latest, receipt) => 
              receipt.createdAt > latest.createdAt ? receipt : latest
            ).createdAt 
          : null
      }
    });
    
  } catch (error) {
    console.error("Vomionnoyon statistics error:", error);
    res.status(500).json({
      success: false,
      message: "পরিসংখ্যান লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});
// Add this to your backend routes (in the same file as your existing Vomionnoyon routes)

// POST - Deduct balance for service
Userroute.post("/balance/deduct", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { amount, service, reference, description } = req.body;
    
    // Validate input
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "বৈধ পরিমাণ প্রদান করুন"
      });
    }
    
    if (!service) {
      return res.status(400).json({
        success: false,
        message: "সেবার নাম প্রদান করুন"
      });
    }
    
    // Check if user has sufficient balance
    if (user.balance < amount) {
      return res.status(400).json({
        success: false,
        message: `অপর্যাপ্ত ব্যালেন্স। আপনার ব্যালেন্স: ${user.balance} টাকা, প্রয়োজন: ${amount} টাকা`
      });
    }
    
    // Create transaction record
    const transaction = new Transaction({
      user: user._id,
      type: 'debit',
      amount: amount,
      service: service,
      reference: reference || `TRX_${Date.now()}`,
      description: description || `${service} সেবার জন্য পেমেন্ট`,
      status: 'completed',
      balanceBefore: user.balance,
      balanceAfter: user.balance - amount
    });
    
    // Deduct from user balance
    user.balance -= amount;
    
    // Save both user and transaction
    await Promise.all([
      user.save(),
      transaction.save()
    ]);
    
    res.status(200).json({
      success: true,
      message: "সফলভাবে পেমেন্ট হয়েছে",
      data: {
        transactionId: transaction._id,
        reference: transaction.reference,
        amountDeducted: amount,
        newBalance: user.balance,
        transactionDate: transaction.createdAt
      }
    });
    
  } catch (error) {
    console.error("Balance deduction error:", error);
    res.status(500).json({
      success: false,
      message: "পেমেন্ট প্রক্রিয়া ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});


// ==================== POLICE CLEARANCE ROUTES ====================

// Import the model
const PoliceClearance = require("../models/PoliceClearance");

// Helper function to generate police clearance receipt ID
function generatePoliceReceiptId() {
  const prefix = 'POL';
  const timestamp = Date.now().toString().slice(-8); // Last 8 digits of timestamp
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase(); // 4 random chars
  
  return `${prefix}${timestamp}${randomStr}`;
}

// Helper function to generate QR code data
function generatePoliceQRCodeData(referenceNo, passportNo, policeStation, district, issueDate, verificationUrl) {
  return `Police Clearance Certificate
Reference No: ${referenceNo}
Passport No: ${passportNo}
Police Station: ${policeStation}
District: ${district}
Issue Date: ${issueDate}

Verify at: ${verificationUrl}`;
}

// POST - Save Police Clearance Certificate
Userroute.post("/police-clearance/save", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    
    // Validate required fields
    const requiredFields = [
      'policeStation', 'passportNo', 'fatherName', 'issueDate',
      'villageArea', 'postCode', 'district', 'issuePlace'
    ];
    
    for (const field of requiredFields) {
      if (!req.body[field] || req.body[field].trim() === '') {
        return res.status(400).json({
          success: false,
          message: `${field} ফিল্ডটি পূরণ করুন`
        });
      }
    }
    
    // Generate receipt ID
    const receiptId = generatePoliceReceiptId();
    
    // Create the full verification URL
    const verificationUrl = `https://api.xbdapi.my.id/clone-services/police-clearance-clone-download/${receiptId}`;
    
    // Generate QR code data
    const qrCodeData = generatePoliceQRCodeData(
      req.body.referenceNo || '1C4GGZZ',
      req.body.passportNo.trim(),
      req.body.policeStation.trim(),
      req.body.district.trim(),
      req.body.issueDate,
      verificationUrl
    );
    
    // Create new police clearance document
    const policeClearance = new PoliceClearance({
      user: user._id,
      receiptId: receiptId,
      referenceNo: req.body.referenceNo || '1C4GGZZ',
      policeStation: req.body.policeStation.trim(),
      passportNo: req.body.passportNo.trim(),
      fatherName: req.body.fatherName.trim(),
      po: req.body.po || 'P/O',
      psUpozila: req.body.psUpozila || 'P/S Upozila',
      issueDate: req.body.issueDate,
      villageArea: req.body.villageArea.trim(),
      postCode: req.body.postCode.trim(),
      district: req.body.district.trim(),
      issuePlace: req.body.issuePlace.trim(),
      verificationUrl: verificationUrl,
      qrCodeData: qrCodeData,
      status: 'completed'
    });
    
    await policeClearance.save();
    
    res.status(201).json({
      success: true,
      message: "পুলিশ ক্লিয়ারেন্স সার্টিফিকেট সফলভাবে সংরক্ষণ করা হয়েছে",
      data: {
        _id: policeClearance._id,
        receiptId: policeClearance.receiptId,
        passportNo: policeClearance.passportNo,
        policeStation: policeClearance.policeStation,
        issueDate: policeClearance.issueDate,
        verificationUrl: policeClearance.verificationUrl,
        qrCodeData: policeClearance.qrCodeData,
        createdAt: policeClearance.createdAt
      }
    });
    
  } catch (error) {
    console.error("Save police clearance error:", error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Receipt ID already exists. Please try again."
      });
    }
    
    res.status(500).json({
      success: false,
      message: "পুলিশ ক্লিয়ারেন্স সংরক্ষণ করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get all Police Clearance certificates for user
Userroute.get("/police-clearance/all", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Search filter
    const search = req.query.search || '';
    
    // Build query
    let query = { user: user._id };
    
    if (search) {
      query.$or = [
        { receiptId: { $regex: search, $options: 'i' } },
        { passportNo: { $regex: search, $options: 'i' } },
        { policeStation: { $regex: search, $options: 'i' } },
        { referenceNo: { $regex: search, $options: 'i' } },
        { district: { $regex: search, $options: 'i' } },
        { issuePlace: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Get total count
    const total = await PoliceClearance.countDocuments(query);
    
    // Get certificates
    const certificates = await PoliceClearance.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-qrCodeData -__v');
    
    // Format response
    const formattedCertificates = certificates.map(cert => ({
      _id: cert._id,
      receiptId: cert.receiptId,
      passportNo: cert.passportNo,
      policeStation: cert.policeStation,
      fatherName: cert.fatherName,
      referenceNo: cert.referenceNo,
      issueDate: cert.issueDate,
      district: cert.district,
      issuePlace: cert.issuePlace,
      status: cert.status,
      createdAt: cert.createdAt,
      updatedAt: cert.updatedAt
    }));
    
    res.status(200).json({
      success: true,
      message: "পুলিশ ক্লিয়ারেন্স সার্টিফিকেট তালিকা",
      data: formattedCertificates,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error("Get police clearance list error:", error);
    res.status(500).json({
      success: false,
      message: "পুলিশ ক্লিয়ারেন্স তালিকা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get single Police Clearance certificate by ID
Userroute.get("/police-clearance/:id", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "অবৈধ সার্টিফিকেট আইডি"
      });
    }
    
    // Find certificate
    const certificate = await PoliceClearance.findOne({
      _id: id,
      user: user._id
    });
    
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "পুলিশ ক্লিয়ারেন্স সার্টিফিকেট পাওয়া যায়নি"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "পুলিশ ক্লিয়ারেন্স ডাটা লোড সফল",
      data: certificate
    });
    
  } catch (error) {
    console.error("Get police clearance details error:", error);
    res.status(500).json({
      success: false,
      message: "পুলিশ ক্লিয়ারেন্স ডাটা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get Police Clearance certificate by receiptId
Userroute.get("/police-clearance/receipt/:receiptId", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { receiptId } = req.params;
    
    if (!receiptId) {
      return res.status(400).json({
        success: false,
        message: "সার্টিফিকেট আইডি প্রয়োজন"
      });
    }
    
    // Find certificate
    const certificate = await PoliceClearance.findOne({
      receiptId: receiptId,
      user: user._id
    });
    
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "পুলিশ ক্লিয়ারেন্স সার্টিফিকেট পাওয়া যায়নি"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "পুলিশ ক্লিয়ারেন্স ডাটা লোড সফল",
      data: certificate
    });
    
  } catch (error) {
    console.error("Get police clearance by receiptId error:", error);
    res.status(500).json({
      success: false,
      message: "পুলিশ ক্লিয়ারেন্স ডাটা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// DELETE - Delete Police Clearance certificate
Userroute.delete("/police-clearance/:id", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "অবৈধ সার্টিফিকেট আইডি"
      });
    }
    
    // Find and delete certificate
    const result = await PoliceClearance.findOneAndDelete({
      _id: id,
      user: user._id
    });
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "পুলিশ ক্লিয়ারেন্স সার্টিফিকেট পাওয়া যায়নি"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "পুলিশ ক্লিয়ারেন্স সার্টিফিকেট সফলভাবে ডিলিট করা হয়েছে",
      data: {
        receiptId: result.receiptId,
        deletedAt: new Date()
      }
    });
    
  } catch (error) {
    console.error("Delete police clearance error:", error);
    res.status(500).json({
      success: false,
      message: "পুলিশ ক্লিয়ারেন্স সার্টিফিকেট ডিলিট করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get QR code data for certificate
Userroute.get("/police-clearance/qr-code/:receiptId", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { receiptId } = req.params;
    
    if (!receiptId) {
      return res.status(400).json({
        success: false,
        message: "সার্টিফিকেট আইডি প্রয়োজন"
      });
    }
    
    // Find certificate
    const certificate = await PoliceClearance.findOne({
      receiptId: receiptId,
      user: user._id
    });
    
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "পুলিশ ক্লিয়ারেন্স সার্টিফিকেট পাওয়া যায়নি"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "QR কোড ডাটা লোড সফল",
      data: {
        qrCodeData: certificate.qrCodeData,
        verificationUrl: certificate.verificationUrl
      }
    });
    
  } catch (error) {
    console.error("Get QR code error:", error);
    res.status(500).json({
      success: false,
      message: "QR কোড ডাটা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});


// ==================== TAKMUL CERTIFICATE ROUTES ====================

// Import the model
const TakmulCertificate = require("../models/TakmulCertificate");

// Helper function to generate takmul certificate receipt ID
function generateTakmulReceiptId() {
  const prefix = 'TAK';
  const timestamp = Date.now().toString().slice(-8);
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  
  return `${prefix}${timestamp}${randomStr}`;
}

// Helper function to generate QR code data
function generateTakmulQRCodeData(certificateNumber, passportNumber, name, issueDate, expiryDate, verificationUrl) {
  return `Takmul Certificate
Certificate No: ${certificateNumber}
Passport No: ${passportNumber}
Name: ${name}
Issue Date: ${issueDate}
Expiry Date: ${expiryDate}

Verify at: ${verificationUrl}`;
}

// POST - Save Takmul Certificate
Userroute.post("/takmul-certificate/save", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    
    // Validate required fields (exactly from your form)
    const requiredFields = [
      'certificateNumber', 'passportNumber', 'name', 'nationality',
      'workType', 'labourNumber', 'issueDate', 'expiryDate'
    ];
    
    for (const field of requiredFields) {
      if (!req.body[field] || req.body[field].trim() === '') {
        return res.status(400).json({
          success: false,
          message: `${field} ফিল্ডটি পূরণ করুন`
        });
      }
    }
    
    // Generate receipt ID
    const receiptId = generateTakmulReceiptId();
    
    // Create the full verification URL
    const verificationUrl = `https://api.xbdapi.my.id/clone-services/takmul-certificate-download/${receiptId}`;
    
    // Generate QR code data
    const qrCodeData = generateTakmulQRCodeData(
      req.body.certificateNumber.trim(),
      req.body.passportNumber.trim(),
      req.body.name.trim(),
      req.body.issueDate,
      req.body.expiryDate,
      verificationUrl
    );
    
    // Create new takmul certificate document
    const takmulCertificate = new TakmulCertificate({
      user: user._id,
      receiptId: receiptId,
      certificateNumber: req.body.certificateNumber.trim(),
      passportNumber: req.body.passportNumber.trim(),
      name: req.body.name.trim(),
      nationality: req.body.nationality.trim(),
      workType: req.body.workType,
      labourNumber: req.body.labourNumber.trim(),
      issueDate: req.body.issueDate,
      expiryDate: req.body.expiryDate,
      verificationUrl: verificationUrl,
      qrCodeData: qrCodeData,
      status: 'completed'
    });
    
    await takmulCertificate.save();
    
    res.status(201).json({
      success: true,
      message: "তাকামুল সার্টিফিকেট সফলভাবে সংরক্ষণ করা হয়েছে",
      data: {
        _id: takmulCertificate._id,
        receiptId: takmulCertificate.receiptId,
        certificateNumber: takmulCertificate.certificateNumber,
        passportNumber: takmulCertificate.passportNumber,
        name: takmulCertificate.name,
        issueDate: takmulCertificate.issueDate,
        expiryDate: takmulCertificate.expiryDate,
        verificationUrl: takmulCertificate.verificationUrl,
        qrCodeData: takmulCertificate.qrCodeData,
        createdAt: takmulCertificate.createdAt
      }
    });
    
  } catch (error) {
    console.error("Save takmul certificate error:", error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Receipt ID already exists. Please try again."
      });
    }
    
    res.status(500).json({
      success: false,
      message: "তাকামুল সার্টিফিকেট সংরক্ষণ করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get all Takmul certificates for user
Userroute.get("/takmul-certificate/all", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Search filter
    const search = req.query.search || '';
    
    // Build query
    let query = { user: user._id };
    
    if (search) {
      query.$or = [
        { receiptId: { $regex: search, $options: 'i' } },
        { certificateNumber: { $regex: search, $options: 'i' } },
        { passportNumber: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { labourNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Get total count
    const total = await TakmulCertificate.countDocuments(query);
    
    // Get certificates
    const certificates = await TakmulCertificate.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-qrCodeData -__v');
    
    // Format response
    const formattedCertificates = certificates.map(cert => ({
      _id: cert._id,
      receiptId: cert.receiptId,
      certificateNumber: cert.certificateNumber,
      passportNumber: cert.passportNumber,
      name: cert.name,
      nationality: cert.nationality,
      workType: cert.workType,
      labourNumber: cert.labourNumber,
      issueDate: cert.issueDate,
      expiryDate: cert.expiryDate,
      status: cert.status,
      createdAt: cert.createdAt,
      updatedAt: cert.updatedAt
    }));
    
    res.status(200).json({
      success: true,
      message: "তাকামুল সার্টিফিকেট তালিকা",
      data: formattedCertificates,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error("Get takmul certificate list error:", error);
    res.status(500).json({
      success: false,
      message: "তাকামুল সার্টিফিকেট তালিকা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get single Takmul certificate by ID
Userroute.get("/takmul-certificate/:id", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "অবৈধ সার্টিফিকেট আইডি"
      });
    }
    
    // Find certificate
    const certificate = await TakmulCertificate.findOne({
      _id: id,
      user: user._id
    });
    
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "তাকামুল সার্টিফিকেট পাওয়া যায়নি"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "তাকামুল সার্টিফিকেট ডাটা লোড সফল",
      data: certificate
    });
    
  } catch (error) {
    console.error("Get takmul certificate details error:", error);
    res.status(500).json({
      success: false,
      message: "তাকামুল সার্টিফিকেট ডাটা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get Takmul certificate by receiptId
Userroute.get("/takmul-certificate/receipt/:receiptId", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { receiptId } = req.params;
    
    if (!receiptId) {
      return res.status(400).json({
        success: false,
        message: "সার্টিফিকেট আইডি প্রয়োজন"
      });
    }
    
    // Find certificate
    const certificate = await TakmulCertificate.findOne({
      receiptId: receiptId,
      user: user._id
    });
    
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "তাকামুল সার্টিফিকেট পাওয়া যায়নি"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "তাকামুল সার্টিফিকেট ডাটা লোড সফল",
      data: certificate
    });
    
  } catch (error) {
    console.error("Get takmul certificate by receiptId error:", error);
    res.status(500).json({
      success: false,
      message: "তাকামুল সার্টিফিকেট ডাটা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// DELETE - Delete Takmul certificate
Userroute.delete("/takmul-certificate/:id", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "অবৈধ সার্টিফিকেট আইডি"
      });
    }
    
    // Find and delete certificate
    const result = await TakmulCertificate.findOneAndDelete({
      _id: id,
      user: user._id
    });
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "তাকামুল সার্টিফিকেট পাওয়া যায়নি"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "তাকামুল সার্টিফিকেট সফলভাবে ডিলিট করা হয়েছে",
      data: {
        receiptId: result.receiptId,
        deletedAt: new Date()
      }
    });
    
  } catch (error) {
    console.error("Delete takmul certificate error:", error);
    res.status(500).json({
      success: false,
      message: "তাকামুল সার্টিফিকেট ডিলিট করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get QR code data for certificate
Userroute.get("/takmul-certificate/qr-code/:receiptId", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { receiptId } = req.params;
    
    if (!receiptId) {
      return res.status(400).json({
        success: false,
        message: "সার্টিফিকেট আইডি প্রয়োজন"
      });
    }
    
    // Find certificate
    const certificate = await TakmulCertificate.findOne({
      receiptId: receiptId,
      user: user._id
    });
    
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "তাকামুল সার্টিফিকেট পাওয়া যায়নি"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "QR কোড ডাটা লোড সফল",
      data: {
        qrCodeData: certificate.qrCodeData,
        verificationUrl: certificate.verificationUrl
      }
    });
    
  } catch (error) {
    console.error("Get QR code error:", error);
    res.status(500).json({
      success: false,
      message: "QR কোড ডাটা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// ==================== SUROKKHA CERTIFICATE ROUTES ====================

const SurokkhaCertificate = require("../models/SurokkhaCertificate");

// Helper function to generate certificate ID
function generateCertificateId() {
  const prefix = 'SUR';
  const timestamp = Date.now().toString().slice(-8);
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  
  return `${prefix}${timestamp}${randomStr}`;
}

// Helper function to generate certificate number
function generateCertificateNumber() {
  const prefix = 'BD';
  const numbers = Math.floor(100000000000000 + Math.random() * 900000000000000);
  return `${prefix}${numbers}`;
}

// Helper function to generate QR code data
function generateQRCodeData(certificateNo, name, passportNo, vaccineNames, verificationUrl) {
  return `COVID-19 Vaccination Certificate
Certificate No: ${certificateNo}
Name: ${name}
Passport No: ${passportNo}
Vaccines: ${vaccineNames}
Total Doses: 3

Verify at: ${verificationUrl}`;
}

// POST - Save Surokkha Certificate
Userroute.post("/surokkha-certificate/save", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    
    // Validate required fields
    const requiredFields = [
      'name', 'gender', 'dateOfBirth', 'dose1Date',
      'dose1VaccineName', 'dose2Date', 'dose2VaccineName',
      'vaccinationCenter', 'totalDoses'
    ];
    
    for (const field of requiredFields) {
      if (!req.body[field] || req.body[field].trim() === '') {
        return res.status(400).json({
          success: false,
          message: `${field} ফিল্ডটি পূরণ করুন`
        });
      }
    }
    
    // Generate IDs
    const certificateId = generateCertificateId();
    const certificateNo = generateCertificateNumber();
    
    // Create the full verification URL
    const verificationUrl = `https://api.xbdapi.my.id/clone-services/suraksha-clone-download/${certificateId}`;
    
    // Generate QR code data
    const vaccineNames = [
      req.body.dose1VaccineName,
      req.body.dose2VaccineName,
      req.body.dose3VaccineName || ''
    ].filter(v => v).join(', ');
    
    const qrCodeData = generateQRCodeData(
      certificateNo,
      req.body.name.trim(),
      req.body.passportNo || 'N/A',
      vaccineNames,
      verificationUrl
    );
    
    // Create new certificate document
    const certificate = new SurokkhaCertificate({
      user: user._id,
      certificateId: certificateId,
      certificateNo: certificateNo,
      name: req.body.name.trim(),
      nationality: req.body.nationality || 'Bangladeshi',
      gender: req.body.gender,
      nationalId: req.body.nationalId || 'N/A',
      birthNo: req.body.birthNo || 'N/A',
      passportNo: req.body.passportNo || 'N/A',
      dateOfBirth: req.body.dateOfBirth,
      vaccinatedBy: req.body.vaccinatedBy || 'Directorate General of Health Services (DGHS)',
      receiptId:certificateId,
      // Dose 1
      dose1Date: req.body.dose1Date,
      dose1VaccineName: req.body.dose1VaccineName,
      dose1OtherVaccine: req.body.dose1OtherVaccine || '',
      
      // Dose 2
      dose2Date: req.body.dose2Date,
      dose2VaccineName: req.body.dose2VaccineName,
      dose2OtherVaccine: req.body.dose2OtherVaccine || '',
      
      // Dose 3
      dose3Date: req.body.dose3Date || '',
      dose3VaccineName: req.body.dose3VaccineName || '',
      dose3OtherVaccine: req.body.dose3OtherVaccine || '',
      
      vaccinationCenter: req.body.vaccinationCenter.trim(),
      totalDoses: req.body.totalDoses,
      verificationUrl: verificationUrl,
      qrCodeData: qrCodeData,
      status: 'completed'
    });
    
    await certificate.save();
    
    res.status(201).json({
      success: true,
      message: "সুরক্ষা সার্টিফিকেট সফলভাবে সংরক্ষণ করা হয়েছে",
      data: {
        _id: certificate._id,
        certificateId: certificate.certificateId,
        certificateNo: certificate.certificateNo,
        name: certificate.name,
        passportNo: certificate.passportNo,
        verificationUrl: certificate.verificationUrl,
        qrCodeData: certificate.qrCodeData,
        createdAt: certificate.createdAt
      }
    });
    
  } catch (error) {
    console.error("Save surokkha certificate error:", error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Certificate ID already exists. Please try again."
      });
    }
    
    res.status(500).json({
      success: false,
      message: "সুরক্ষা সার্টিফিকেট সংরক্ষণ করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get all Surokkha certificates for user
Userroute.get("/surokkha-certificate/all", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Search filter
    const search = req.query.search || '';
    
    // Build query
    let query = { user: user._id };
    
    if (search) {
      query.$or = [
        { certificateId: { $regex: search, $options: 'i' } },
        { certificateNo: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { passportNo: { $regex: search, $options: 'i' } },
        { nationalId: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Get total count
    const total = await SurokkhaCertificate.countDocuments(query);
    
    // Get certificates
    const certificates = await SurokkhaCertificate.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-qrCodeData -__v');
    
    // Format response
    const formattedCertificates = certificates.map(cert => ({
      _id: cert._id,
      certificateId: cert.certificateId,
      certificateNo: cert.certificateNo,
      name: cert.name,
      passportNo: cert.passportNo,
      nationalId: cert.nationalId,
      gender: cert.gender,
      dateOfBirth: cert.dateOfBirth,
      dose1Date: cert.dose1Date,
      dose1VaccineName: cert.dose1VaccineName,
      vaccinationCenter: cert.vaccinationCenter,
      totalDoses: cert.totalDoses,
      status: cert.status,
      createdAt: cert.createdAt,
      updatedAt: cert.updatedAt
    }));
    
    res.status(200).json({
      success: true,
      message: "সুরক্ষা সার্টিফিকেট তালিকা",
      data: formattedCertificates,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error("Get surokkha certificate list error:", error);
    res.status(500).json({
      success: false,
      message: "সুরক্ষা সার্টিফিকেট তালিকা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get single Surokkha certificate by ID
Userroute.get("/surokkha-certificate/:id", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "অবৈধ সার্টিফিকেট আইডি"
      });
    }
    
    // Find certificate
    const certificate = await SurokkhaCertificate.findOne({
      _id: id,
      user: user._id
    });
    
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "সুরক্ষা সার্টিফিকেট পাওয়া যায়নি"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "সুরক্ষা সার্টিফিকেট ডাটা লোড সফল",
      data: certificate
    });
    
  } catch (error) {
    console.error("Get surokkha certificate details error:", error);
    res.status(500).json({
      success: false,
      message: "সুরক্ষা সার্টিফিকেট ডাটা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get Surokkha certificate by certificateId
Userroute.get("/surokkha-certificate/certificate/:certificateId", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { certificateId } = req.params;
    
    if (!certificateId) {
      return res.status(400).json({
        success: false,
        message: "সার্টিফিকেট আইডি প্রয়োজন"
      });
    }
    
    // Find certificate
    const certificate = await SurokkhaCertificate.findOne({
      certificateId: certificateId,
      user: user._id
    });
    
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "সুরক্ষা সার্টিফিকেট পাওয়া যায়নি"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "সুরক্ষা সার্টিফিকেট ডাটা লোড সফল",
      data: certificate
    });
    
  } catch (error) {
    console.error("Get surokkha certificate by certificateId error:", error);
    res.status(500).json({
      success: false,
      message: "সুরক্ষা সার্টিফিকেট ডাটা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// DELETE - Delete Surokkha certificate
Userroute.delete("/surokkha-certificate/:id", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "অবৈধ সার্টিফিকেট আইডি"
      });
    }
    
    // Find and delete certificate
    const result = await SurokkhaCertificate.findOneAndDelete({
      _id: id,
      user: user._id
    });
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "সুরক্ষা সার্টিফিকেট পাওয়া যায়নি"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "সুরক্ষা সার্টিফিকেট সফলভাবে ডিলিট করা হয়েছে",
      data: {
        certificateId: result.certificateId,
        deletedAt: new Date()
      }
    });
    
  } catch (error) {
    console.error("Delete surokkha certificate error:", error);
    res.status(500).json({
      success: false,
      message: "সুরক্ষা সার্টিফিকেট ডিলিট করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get QR code data for certificate
Userroute.get("/surokkha-certificate/qr-code/:certificateId", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { certificateId } = req.params;
    
    if (!certificateId) {
      return res.status(400).json({
        success: false,
        message: "সার্টিফিকেট আইডি প্রয়োজন"
      });
    }
    
    // Find certificate
    const certificate = await SurokkhaCertificate.findOne({
      certificateId: certificateId,
      user: user._id
    });
    
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "সুরক্ষা সার্টিফিকেট পাওয়া যায়নি"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "QR কোড ডাটা লোড সফল",
      data: {
        qrCodeData: certificate.qrCodeData,
        verificationUrl: certificate.verificationUrl
      }
    });
    
  } catch (error) {
    console.error("Get QR code error:", error);
    res.status(500).json({
      success: false,
      message: "QR কোড ডাটা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});


const TradeLicense = require("../models/TradeLicense");
// Helper function to generate trade license receipt ID
function generateTradeReceiptId() {
  const prefix = 'TRADE';
  const timestamp = Date.now().toString().slice(-8); // Last 8 digits of timestamp
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase(); // 4 random chars
  
  return `${prefix}${timestamp}${randomStr}`;
}

// Helper function to generate license number
function generateLicenseNumber(union, year) {
  const unionCode = union.substring(0, 3).toUpperCase();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${unionCode}/TL/${year}/${randomNum}`;
}

// Helper function to generate QR code data
function generateTradeQRCodeData(licenseNumber, applicantName, businessType, validUntil, verificationUrl) {
  return `Trade License Certificate
License No: ${licenseNumber}
Applicant: ${applicantName}
Business Type: ${businessType}
Valid Until: ${validUntil}

Verify at: ${verificationUrl}`;
}

// Calculate total fees
function calculateTotalFees(licenseFee, signboardFee, serviceCharge, developmentFee, otherFees) {
  return licenseFee + signboardFee + serviceCharge + developmentFee + otherFees;
}

// POST - Save Trade License
Userroute.post("/trade-license/save", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    
    // Validate required fields
    const requiredFields = [
      'licenseType', 'licenseName', 'applicantName', 'fatherName',
      'motherName', 'mobileNumber', 'businessType', 'businessAddress',
      'establishmentCount', 'union', 'postOffice', 'postCode', 'upazila',
      'issueYear', 'serialNumber2013', 'licenseNumber' // Added licenseNumber
    ];
    
    for (const field of requiredFields) {
      if (!req.body[field] || req.body[field].toString().trim() === '') {
        return res.status(400).json({
          success: false,
          message: `${field} ফিল্ডটি পূরণ করুন`
        });
      }
    }
    
    // Check if license number already exists
    const existingLicense = await TradeLicense.findOne({ 
      licenseNumber: req.body.licenseNumber.trim() 
    });
    
    if (existingLicense) {
      return res.status(400).json({
        success: false,
        message: "এই লাইসেন্স নম্বরটি ইতিমধ্যে ব্যবহৃত হয়েছে"
      });
    }
    
    // Generate receipt ID
    const receiptId = generateTradeReceiptId();
    
    // Use the provided license number from frontend
    const licenseNumber = req.body.licenseNumber.trim();
    
    // Calculate validity (1 year from now)
    const validUntil = new Date();
    validUntil.setFullYear(validUntil.getFullYear() + 1);
    
    // Calculate fees
    const licenseFee = parseFloat(req.body.licenseFee) || 0.00;
    const signboardFee = parseFloat(req.body.signboardFee) || 0.00;
    const serviceCharge = parseFloat(req.body.serviceCharge) || 0.00;
    const developmentFee = parseFloat(req.body.developmentFee) || 0.00;
    const otherFees = parseFloat(req.body.otherFees) || 0.00;
    const totalFees = calculateTotalFees(licenseFee, signboardFee, serviceCharge, developmentFee, otherFees);
    
    // Create the full verification URL
    const verificationUrl = `https://api.xbdapi.my.id/clone-services/trade-license-clone-download/${receiptId}`;
    
    // Generate QR code data
    const qrCodeData = generateTradeQRCodeData(
      licenseNumber,
      req.body.applicantName.trim(),
      req.body.businessType.trim(),
      validUntil.toISOString().split('T')[0],
      verificationUrl
    );
    
    // Create new trade license document
    const tradeLicense = new TradeLicense({
      user: user._id,
      receiptId: receiptId,
      referenceNo: req.body.referenceNo || 'TRADE',
      licenseType: req.body.licenseType,
      licenseName: req.body.licenseName.trim(),
      applicantName: req.body.applicantName.trim(),
      fatherName: req.body.fatherName.trim(),
      motherName: req.body.motherName.trim(),
      spouseName: req.body.spouseName ? req.body.spouseName.trim() : '',
      mobileNumber: req.body.mobileNumber.trim(),
      businessType: req.body.businessType.trim(),
      businessAddress: req.body.businessAddress.trim(),
      establishmentCount: parseInt(req.body.establishmentCount) || 1,
      licenseNumber: licenseNumber, // Using the provided license number
      issueYear: req.body.issueYear,
      union: req.body.union.trim(),
      postOffice: req.body.postOffice.trim(),
      postCode: req.body.postCode.trim(),
      upazila: req.body.upazila.trim(),
      licenseFee: licenseFee,
      signboardFee: signboardFee,
      serviceCharge: serviceCharge,
      developmentFee: developmentFee,
      otherFees: otherFees,
      totalFees: totalFees,
      serialNumber2013: req.body.serialNumber2013,
      verificationUrl: verificationUrl,
      qrCodeData: qrCodeData,
      validUntil: validUntil,
      status: 'active'
    });
    
    await tradeLicense.save();
    
    res.status(201).json({
      success: true,
      message: "ট্রেড লাইসেন্স সফলভাবে সংরক্ষণ করা হয়েছে",
      data: {
        _id: tradeLicense._id,
        receiptId: tradeLicense.receiptId,
        licenseNumber: tradeLicense.licenseNumber,
        applicantName: tradeLicense.applicantName,
        businessType: tradeLicense.businessType,
        totalFees: tradeLicense.totalFees,
        validUntil: tradeLicense.validUntil,
        verificationUrl: tradeLicense.verificationUrl,
        qrCodeData: tradeLicense.qrCodeData,
        createdAt: tradeLicense.createdAt
      }
    });
    
  } catch (error) {
    console.error("Save trade license error:", error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Receipt ID already exists. Please try again."
      });
    }
    
    res.status(500).json({
      success: false,
      message: "ট্রেড লাইসেন্স সংরক্ষণ করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get all Trade Licenses for user
Userroute.get("/trade-license/all", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Search filter
    const search = req.query.search || '';
    
    // Status filter
    const status = req.query.status;
    
    // Build query
    let query = { user: user._id };
    
    if (search) {
      query.$or = [
        { receiptId: { $regex: search, $options: 'i' } },
        { licenseNumber: { $regex: search, $options: 'i' } },
        { applicantName: { $regex: search, $options: 'i' } },
        { businessType: { $regex: search, $options: 'i' } },
        { licenseName: { $regex: search, $options: 'i' } },
        { mobileNumber: { $regex: search, $options: 'i' } },
        { union: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      query.status = status;
    }
    
    // Get total count
    const total = await TradeLicense.countDocuments(query);
    
    // Get licenses
    const licenses = await TradeLicense.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-qrCodeData -__v');
    
    // Format response
    const formattedLicenses = licenses.map(license => ({
      _id: license._id,
      receiptId: license.receiptId,
      licenseNumber: license.licenseNumber,
      applicantName: license.applicantName,
      fatherName: license.fatherName,
      businessType: license.businessType,
      licenseType: license.licenseType,
      licenseName: license.licenseName,
      mobileNumber: license.mobileNumber,
      union: license.union,
      upazila: license.upazila,
      totalFees: license.totalFees,
      issueYear: license.issueYear,
      validUntil: license.validUntil,
      status: license.status,
      remainingDays: license.remainingDays,
      createdAt: license.createdAt,
      updatedAt: license.updatedAt
    }));
    
    res.status(200).json({
      success: true,
      message: "ট্রেড লাইসেন্স তালিকা",
      data: formattedLicenses,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error("Get trade license list error:", error);
    res.status(500).json({
      success: false,
      message: "ট্রেড লাইসেন্স তালিকা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get single Trade License by ID
Userroute.get("/trade-license/:id", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "অবৈধ লাইসেন্স আইডি"
      });
    }
    
    // Find license
    const license = await TradeLicense.findOne({
      _id: id,
      user: user._id
    });
    
    if (!license) {
      return res.status(404).json({
        success: false,
        message: "ট্রেড লাইসেন্স পাওয়া যায়নি"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "ট্রেড লাইসেন্স ডাটা লোড সফল",
      data: license
    });
    
  } catch (error) {
    console.error("Get trade license details error:", error);
    res.status(500).json({
      success: false,
      message: "ট্রেড লাইসেন্স ডাটা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get Trade License by receiptId
Userroute.get("/trade-license/receipt/:receiptId", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { receiptId } = req.params;
     console.log("receiptId",receiptId)
    if (!receiptId) {
      return res.status(400).json({
        success: false,
        message: "লাইসেন্স আইডি প্রয়োজন"
      });
    }
    
    // Find license
    const license = await TradeLicense.findOne({
      receiptId: receiptId,
      user: user._id
    });
    
    if (!license) {
      return res.status(404).json({
        success: false,
        message: "ট্রেড লাইসেন্স পাওয়া যায়নি"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "ট্রেড লাইসেন্স ডাটা লোড সফল",
      data: license
    });
    
  } catch (error) {
    console.error("Get trade license by receiptId error:", error);
    res.status(500).json({
      success: false,
      message: "ট্রেড লাইসেন্স ডাটা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// PUT - Update Trade License
Userroute.put("/trade-license/:id", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "অবৈধ লাইসেন্স আইডি"
      });
    }
    
    // Find and update license
    const license = await TradeLicense.findOne({
      _id: id,
      user: user._id
    });
    
    if (!license) {
      return res.status(404).json({
        success: false,
        message: "ট্রেড লাইসেন্স পাওয়া যায়নি"
      });
    }
    
    // Update only allowed fields
    const allowedUpdates = [
      'businessType', 'businessAddress', 'mobileNumber',
      'establishmentCount', 'licenseFee', 'signboardFee',
      'serviceCharge', 'developmentFee', 'otherFees'
    ];
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        license[field] = req.body[field];
      }
    });
    
    // Recalculate total fees if any fee changed
    if (
      req.body.licenseFee !== undefined ||
      req.body.signboardFee !== undefined ||
      req.body.serviceCharge !== undefined ||
      req.body.developmentFee !== undefined ||
      req.body.otherFees !== undefined
    ) {
      license.totalFees = calculateTotalFees(
        license.licenseFee,
        license.signboardFee,
        license.serviceCharge,
        license.developmentFee,
        license.otherFees
      );
    }
    
    await license.save();
    
    res.status(200).json({
      success: true,
      message: "ট্রেড লাইসেন্স সফলভাবে আপডেট করা হয়েছে",
      data: {
        _id: license._id,
        receiptId: license.receiptId,
        licenseNumber: license.licenseNumber,
        totalFees: license.totalFees,
        updatedAt: license.updatedAt
      }
    });
    
  } catch (error) {
    console.error("Update trade license error:", error);
    res.status(500).json({
      success: false,
      message: "ট্রেড লাইসেন্স আপডেট করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// DELETE - Delete Trade License
Userroute.delete("/trade-license/:id", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "অবৈধ লাইসেন্স আইডি"
      });
    }
    
    // Find and delete license
    const result = await TradeLicense.findOneAndDelete({
      _id: id,
      user: user._id
    });
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "ট্রেড লাইসেন্স পাওয়া যায়নি"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "ট্রেড লাইসেন্স সফলভাবে ডিলিট করা হয়েছে",
      data: {
        receiptId: result.receiptId,
        licenseNumber: result.licenseNumber,
        deletedAt: new Date()
      }
    });
    
  } catch (error) {
    console.error("Delete trade license error:", error);
    res.status(500).json({
      success: false,
      message: "ট্রেড লাইসেন্স ডিলিট করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get QR code data for license
Userroute.get("/trade-license/qr-code/:receiptId", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { receiptId } = req.params;
    
    if (!receiptId) {
      return res.status(400).json({
        success: false,
        message: "লাইসেন্স আইডি প্রয়োজন"
      });
    }
    
    // Find license
    const license = await TradeLicense.findOne({
      receiptId: receiptId,
      user: user._id
    });
    
    if (!license) {
      return res.status(404).json({
        success: false,
        message: "ট্রেড লাইসেন্স পাওয়া যায়নি"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "QR কোড ডাটা লোড সফল",
      data: {
        qrCodeData: license.qrCodeData,
        verificationUrl: license.verificationUrl
      }
    });
    
  } catch (error) {
    console.error("Get QR code error:", error);
    res.status(500).json({
      success: false,
      message: "QR কোড ডাটা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// PUT - Renew Trade License
Userroute.put("/trade-license/renew/:id", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "অবৈধ লাইসেন্স আইডি"
      });
    }
    
    // Find license
    const license = await TradeLicense.findOne({
      _id: id,
      user: user._id
    });
    
    if (!license) {
      return res.status(404).json({
        success: false,
        message: "ট্রেড লাইসেন্স পাওয়া যায়নি"
      });
    }
    
    // Check if license is active
    if (license.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: "শুধুমাত্র সক্রিয় লাইসেন্স নবায়ন করা যাবে"
      });
    }
    
    // Renew license (extend validity by 1 year)
    const newValidUntil = new Date(license.validUntil);
    newValidUntil.setFullYear(newValidUntil.getFullYear() + 1);
    
    license.validUntil = newValidUntil;
    license.status = 'renewed';
    license.issueYear = new Date().getFullYear().toString();
    
    await license.save();
    
    res.status(200).json({
      success: true,
      message: "ট্রেড লাইসেন্স সফলভাবে নবায়ন করা হয়েছে",
      data: {
        receiptId: license.receiptId,
        licenseNumber: license.licenseNumber,
        newValidUntil: license.validUntil,
        status: license.status
      }
    });
    
  } catch (error) {
    console.error("Renew trade license error:", error);
    res.status(500).json({
      success: false,
      message: "ট্রেড লাইসেন্স নবায়ন করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get license statistics
Userroute.get("/trade-license/statistics", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    
    // Get statistics
    const totalLicenses = await TradeLicense.countDocuments({ user: user._id });
    const activeLicenses = await TradeLicense.countDocuments({ 
      user: user._id, 
      status: 'active',
      validUntil: { $gte: new Date() }
    });
    const expiredLicenses = await TradeLicense.countDocuments({ 
      user: user._id, 
      $or: [
        { status: 'expired' },
        { validUntil: { $lt: new Date() } }
      ]
    });
    
    // Get total revenue
    const revenueResult = await TradeLicense.aggregate([
      { $match: { user: user._id } },
      { $group: { _id: null, total: { $sum: "$totalFees" } } }
    ]);
    
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;
    
    res.status(200).json({
      success: true,
      message: "লাইসেন্স পরিসংখ্যান",
      data: {
        totalLicenses,
        activeLicenses,
        expiredLicenses,
        totalRevenue,
        averageLicenseFee: totalLicenses > 0 ? (totalRevenue / totalLicenses) : 0
      }
    });
    
  } catch (error) {
    console.error("Get license statistics error:", error);
    res.status(500).json({
      success: false,
      message: "পরিসংখ্যান লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

const TaxReturn = require("../models/TaxReturn");

// Helper function to generate tax return receipt ID
function generateTaxReceiptId() {
  const prefix = 'TAX';
  const timestamp = Date.now().toString().slice(-8);
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  
  return `${prefix}${timestamp}${randomStr}`;
}

// Helper function to generate return register serial number
function generateReturnSerialNo() {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

// Helper function to generate QR code data
function generateTaxQRCodeData(tinNumber, taxpayerName, assessmentYear, totalIncome, totalTaxPaid, verificationUrl) {
  return `Income Tax Return Receipt
TIN: ${tinNumber}
Name: ${taxpayerName}
Assessment Year: ${assessmentYear}
Total Income: ${totalIncome} BDT
Tax Paid: ${totalTaxPaid} BDT

Verify at: ${verificationUrl}`;
}

// Helper function to format date for certificate
function formatCertificateDate() {
  const now = new Date();
  const day = now.getDate();
  const month = now.toLocaleString('en-US', { month: 'long' });
  const year = now.getFullYear();
  return `${day} ${month} ${year}`;
}

// POST - Save Income Tax Return
Userroute.post("/tax-return/save", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    
    // Validate required fields (updated with referenceNo)
    const requiredFields = [
      'referenceNo',
      'taxpayerName', 
      'fathersName', 
      'mothersName',
      'currentAddress',
      'permanentAddress',
      'nidNumber', 
      'tinNumber', 
      'totalIncome',
      'assessmentYear', 
      'financialYear', 
      'returnSubmissionDate'
    ];
    
    for (const field of requiredFields) {
      if (!req.body[field] || req.body[field].toString().trim() === '') {
        return res.status(400).json({
          success: false,
          message: `${field} ফিল্ডটি পূরণ করুন`
        });
      }
    }
    
    // Validate TIN format (12 digits)
    const tinRegex = /^\d{12}$/;
    if (!tinRegex.test(req.body.tinNumber.replace(/\s/g, ''))) {
      return res.status(400).json({
        success: false,
        message: "টিআইএন নম্বর ১২ ডিজিটের হতে হবে"
      });
    }
    
    // Validate NID format
    const nidRegex = /^\d{10,17}$/;
    if (!nidRegex.test(req.body.nidNumber.replace(/\s/g, ''))) {
      return res.status(400).json({
        success: false,
        message: "এনআইডি নম্বর সঠিক ফরম্যাটে লিখুন (১০-১৭ ডিজিট)"
      });
    }
    
    // Check if referenceNo already exists for this user
    const existingReference = await TaxReturn.findOne({
      user: user._id,
      referenceNo: req.body.referenceNo.trim()
    });
    
    if (existingReference) {
      return res.status(400).json({
        success: false,
        message: "এই রেফারেন্স নম্বরটি ইতিমধ্যে ব্যবহৃত হয়েছে"
      });
    }
    
    // Generate receipt ID
    const receiptId = generateTaxReceiptId();
    
    // Generate return register serial number
    const returnSerialNo = generateReturnSerialNo();
    
    // Calculate values
    const totalIncome = parseFloat(req.body.totalIncome) || 0;
    const totalTaxPaid = parseFloat(req.body.totalTaxPaid) || 0;
    const taxRebate = parseFloat(req.body.taxRebate) || 0;
    
    // Create the full verification URL
    const verificationUrl = `https://api.xbdapi.my.id/clone-services/tax-return-clone-download/${receiptId}`;
    
    // Generate QR code data (updated with referenceNo)
    const qrCodeData = generateTaxQRCodeData(
      req.body.tinNumber.trim(),
      req.body.taxpayerName.trim(),
      req.body.assessmentYear,
      totalIncome,
      totalTaxPaid,
      verificationUrl,
      req.body.referenceNo.trim()
    );
    
    // Update the QR code generator function to include referenceNo
    function generateTaxQRCodeData(tinNumber, taxpayerName, assessmentYear, totalIncome, totalTaxPaid, verificationUrl, referenceNo) {
      return `Income Tax Return Receipt
Reference No: ${referenceNo}
TIN: ${tinNumber}
Name: ${taxpayerName}
Assessment Year: ${assessmentYear}
Total Income: ${totalIncome} BDT
Tax Paid: ${totalTaxPaid} BDT

Verify at: ${verificationUrl}`;
    }
    
    // Create new tax return document with all fields
    const taxReturn = new TaxReturn({
      user: user._id,
      receiptId: receiptId,
      assessmentYear: req.body.assessmentYear,
      
      // Reference number
      referenceNo: req.body.referenceNo.trim(),
      
      // Personal information from image
      taxpayerName: req.body.taxpayerName.trim(),
      fathersName: req.body.fathersName.trim(),
      mothersName: req.body.mothersName.trim(),
      currentAddress: req.body.currentAddress.trim(),
      permanentAddress: req.body.permanentAddress.trim(),
      taxpayerStatus: req.body.taxpayerStatus || 'Individual -> Bangladesh -> Having NID',
      
      // Identification numbers
      nidNumber: req.body.nidNumber.trim(),
      tinNumber: req.body.tinNumber.trim(),
      
      // Tax information
      circle: req.body.circle || 'Circle-114',
      taxZone: req.body.taxZone || 'Taxes Zone-06, Dhaka',
      totalIncome: totalIncome,
      totalTaxPaid: totalTaxPaid,
      
      // Return registration
      returnRegisterSerialNo: returnSerialNo,
      returnRegisterVolumeNo: req.body.returnRegisterVolumeNo || '',
      returnSubmissionDate: req.body.returnSubmissionDate,
      financialYear: req.body.financialYear,
      
      // Tax calculation
      taxRebate: taxRebate,
      
      // Office information
      taxOfficeName: req.body.taxOfficeName || 'National Board of Revenue',
      taxOfficeAddress: req.body.taxOfficeAddress || 'Income Tax Department, Dhaka',
      
      // Verification and QR code
      verificationUrl: verificationUrl,
      qrCodeData: qrCodeData,
      
      // Certificate information
      certificateDate: req.body.certificateDate || new Date(),
      certificateIssuer: req.body.certificateIssuer || 'System Generated',
      
      // Transaction reference if provided
      transactionId: req.body.transactionId || null,
      
      status: 'completed'
    });
    
    await taxReturn.save();
    
    res.status(201).json({
      success: true,
      message: "আয়কর রিটার্ন সফলভাবে সংরক্ষণ করা হয়েছে",
      data: {
        _id: taxReturn._id,
        receiptId: taxReturn.receiptId,
        referenceNo: taxReturn.referenceNo,
        tinNumber: taxReturn.tinNumber,
        taxpayerName: taxReturn.taxpayerName,
        fathersName: taxReturn.fathersName,
        mothersName: taxReturn.mothersName,
        assessmentYear: taxReturn.assessmentYear,
        totalIncome: taxReturn.totalIncome,
        totalTaxPaid: taxReturn.totalTaxPaid,
        taxLiability: taxReturn.taxLiability,
        netTaxPayable: taxReturn.netTaxPayable,
        verificationUrl: taxReturn.verificationUrl,
        createdAt: taxReturn.createdAt
      }
    });
    
  } catch (error) {
    console.error("Save tax return error:", error);
    
    if (error.code === 11000) {
      if (error.keyPattern && error.keyPattern.receiptId) {
        return res.status(400).json({
          success: false,
          message: "Receipt ID already exists. Please try again."
        });
      }
      if (error.keyPattern && error.keyPattern.referenceNo) {
        return res.status(400).json({
          success: false,
          message: "এই রেফারেন্স নম্বরটি ইতিমধ্যে ব্যবহৃত হয়েছে"
        });
      }
    }
    
    res.status(500).json({
      success: false,
      message: "আয়কর রিটার্ন সংরক্ষণ করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Download Tax Return Certificate
Userroute.get("/tax-return/certificate/:receiptId", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { receiptId } = req.params;
    
    if (!receiptId) {
      return res.status(400).json({
        success: false,
        message: "রসিদ আইডি প্রয়োজন"
      });
    }
    
    // Find tax return
    const taxReturn = await TaxReturn.findOne({
      receiptId: receiptId,
      user: user._id
    });
    
    if (!taxReturn) {
      return res.status(404).json({
        success: false,
        message: "আয়কর রিটার্ন পাওয়া যায়নি"
      });
    }
    
    // Format the certificate data
    const certificateData = {
      // Government header
      government: "Government of the People's Republic of Bangladesh",
      board: "National Board of Revenue",
      department: "Income Tax Department",
      
      // Certificate title
      title: "Income Tax Certificate",
      assessmentYear: taxReturn.assessmentYear,
      
      // Taxpayer information (from image format)
      taxpayerInfo: {
        name: taxReturn.taxpayerName,
        tin: taxReturn.tinNumber,
        fathersName: taxReturn.fathersName,
        mothersName: taxReturn.mothersName,
        currentAddress: taxReturn.currentAddress,
        permanentAddress: taxReturn.permanentAddress,
        status: taxReturn.taxpayerStatus
      },
      
      // Tax details
      taxDetails: {
        circle: taxReturn.circle,
        zone: taxReturn.taxZone,
        totalIncome: taxReturn.totalIncome,
        taxPaid: taxReturn.totalTaxPaid,
        taxLiability: taxReturn.taxLiability,
        netTaxPayable: taxReturn.netTaxPayable
      },
      
      // Certificate metadata
      certificateNumber: taxReturn.receiptId,
      issueDate: formatCertificateDate(),
      issuer: taxReturn.certificateIssuer,
      
      // Verification
      verificationUrl: taxReturn.verificationUrl,
      qrCodeData: taxReturn.qrCodeData
    };
    
    // Add certificate text similar to the image
    certificateData.certificateText = `This is to certify that ${taxReturn.taxpayerName} is a registered taxpayer of ${taxReturn.circle}, ${taxReturn.taxZone}. The taxpayer has filed the return of income for the Assessment Year ${taxReturn.assessmentYear}. Shown Total Income ${taxReturn.totalIncome.toLocaleString()} BDT and Paid Tax ${taxReturn.totalTaxPaid.toLocaleString()} BDT.`;
    
    certificateData.footerNote = "This is a system generated certificate, and requires no signature.";
    
    res.status(200).json({
      success: true,
      message: "আয়কর সার্টিফিকেট ডাটা লোড সফল",
      data: certificateData
    });
    
  } catch (error) {
    console.error("Get tax certificate error:", error);
    res.status(500).json({
      success: false,
      message: "সার্টিফিকেট ডাটা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get all Tax Returns for user (updated response)
Userroute.get("/tax-return/all", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Search filter
    const search = req.query.search || '';
    
    // Assessment year filter
    const assessmentYear = req.query.assessmentYear;
    
    // Build query
    let query = { user: user._id };
    
    if (search) {
      query.$or = [
        { receiptId: { $regex: search, $options: 'i' } },
        { tinNumber: { $regex: search, $options: 'i' } },
        { taxpayerName: { $regex: search, $options: 'i' } },
        { nidNumber: { $regex: search, $options: 'i' } },
        { fathersName: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (assessmentYear) {
      query.assessmentYear = assessmentYear;
    }
    
    // Get total count
    const total = await TaxReturn.countDocuments(query);
    
    // Get tax returns
    const taxReturns = await TaxReturn.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-qrCodeData -__v');
    
    // Format response with all fields
    const formattedReturns = taxReturns.map(taxReturn => ({
      _id: taxReturn._id,
      receiptId: taxReturn.receiptId,
      tinNumber: taxReturn.tinNumber,
      taxpayerName: taxReturn.taxpayerName,
      fathersName: taxReturn.fathersName,
      mothersName: taxReturn.mothersName,
      currentAddress: taxReturn.currentAddress,
      permanentAddress: taxReturn.permanentAddress,
      taxpayerStatus: taxReturn.taxpayerStatus,
      nidNumber: taxReturn.nidNumber,
      assessmentYear: taxReturn.assessmentYear,
      totalIncome: taxReturn.totalIncome,
      totalTaxPaid: taxReturn.totalTaxPaid,
      taxLiability: taxReturn.taxLiability,
      taxableIncome: taxReturn.taxableIncome,
      netTaxPayable: taxReturn.netTaxPayable,
      circle: taxReturn.circle,
      taxZone: taxReturn.taxZone,
      status: taxReturn.status,
      certificateDate: taxReturn.certificateDate,
      createdAt: taxReturn.createdAt,
      updatedAt: taxReturn.updatedAt
    }));
    
    res.status(200).json({
      success: true,
      message: "আয়কর রিটার্ন তালিকা",
      data: formattedReturns,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error("Get tax return list error:", error);
    res.status(500).json({
      success: false,
      message: "আয়কর রিটার্ন তালিকা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get single Tax Return by ID
Userroute.get("/tax-return/:id", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "অবৈধ রিটার্ন আইডি"
      });
    }
    
    // Find tax return
    const taxReturn = await TaxReturn.findOne({
      _id: id,
      user: user._id
    });
    
    if (!taxReturn) {
      return res.status(404).json({
        success: false,
        message: "আয়কর রিটার্ন পাওয়া যায়নি"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "আয়কর রিটার্ন ডাটা লোড সফল",
      data: taxReturn
    });
    
  } catch (error) {
    console.error("Get tax return details error:", error);
    res.status(500).json({
      success: false,
      message: "আয়কর রিটার্ন ডাটা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get Tax Return by receiptId
Userroute.get("/tax-return/receipt/:receiptId", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { receiptId } = req.params;
    
    if (!receiptId) {
      return res.status(400).json({
        success: false,
        message: "রসিদ আইডি প্রয়োজন"
      });
    }
    
    // Find tax return
    const taxReturn = await TaxReturn.findOne({
      receiptId: receiptId,
      user: user._id
    });
    
    if (!taxReturn) {
      return res.status(404).json({
        success: false,
        message: "আয়কর রিটার্ন পাওয়া যায়নি"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "আয়কর রিটার্ন ডাটা লোড সফল",
      data: taxReturn
    });
    
  } catch (error) {
    console.error("Get tax return by receiptId error:", error);
    res.status(500).json({
      success: false,
      message: "আয়কর রিটার্ন ডাটা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// DELETE - Delete Tax Return
Userroute.delete("/tax-return/:id", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "অবৈধ রিটার্ন আইডি"
      });
    }
    
    // Find and delete tax return
    const result = await TaxReturn.findOneAndDelete({
      _id: id,
      user: user._id
    });
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "আয়কর রিটার্ন পাওয়া যায়নি"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "আয়কর রিটার্ন সফলভাবে ডিলিট করা হয়েছে",
      data: {
        receiptId: result.receiptId,
        tinNumber: result.tinNumber,
        deletedAt: new Date()
      }
    });
    
  } catch (error) {
    console.error("Delete tax return error:", error);
    res.status(500).json({
      success: false,
      message: "আয়কর রিটার্ন ডিলিট করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get QR code data for tax return
Userroute.get("/tax-return/qr-code/:receiptId", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { receiptId } = req.params;
    
    if (!receiptId) {
      return res.status(400).json({
        success: false,
        message: "রসিদ আইডি প্রয়োজন"
      });
    }
    
    // Find tax return
    const taxReturn = await TaxReturn.findOne({
      receiptId: receiptId,
      user: user._id
    });
    
    if (!taxReturn) {
      return res.status(404).json({
        success: false,
        message: "আয়কর রিটার্ন পাওয়া যায়নি"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "QR কোড ডাটা লোড সফল",
      data: {
        qrCodeData: taxReturn.qrCodeData,
        verificationUrl: taxReturn.verificationUrl
      }
    });
    
  } catch (error) {
    console.error("Get QR code error:", error);
    res.status(500).json({
      success: false,
      message: "QR কোড ডাটা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get tax return statistics
Userroute.get("/tax-return/statistics", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    
    // Get statistics
    const totalReturns = await TaxReturn.countDocuments({ user: user._id });
    
    // Get total income and tax
    const stats = await TaxReturn.aggregate([
      { $match: { user: user._id } },
      { 
        $group: {
          _id: null,
          totalIncome: { $sum: "$totalIncome" },
          totalTaxPaid: { $sum: "$totalTaxPaid" },
          totalTaxLiability: { $sum: "$taxLiability" },
          avgIncome: { $avg: "$totalIncome" }
        }
      }
    ]);
    
    // Get returns by assessment year
    const returnsByYear = await TaxReturn.aggregate([
      { $match: { user: user._id } },
      { 
        $group: {
          _id: "$assessmentYear",
          count: { $sum: 1 },
          totalIncome: { $sum: "$totalIncome" },
          totalTax: { $sum: "$totalTaxPaid" }
        }
      },
      { $sort: { _id: -1 } }
    ]);
    
    res.status(200).json({
      success: true,
      message: "আয়কর রিটার্ন পরিসংখ্যান",
      data: {
        totalReturns,
        totalIncome: stats.length > 0 ? stats[0].totalIncome : 0,
        totalTaxPaid: stats.length > 0 ? stats[0].totalTaxPaid : 0,
        totalTaxLiability: stats.length > 0 ? stats[0].totalTaxLiability : 0,
        avgIncome: stats.length > 0 ? stats[0].avgIncome : 0,
        returnsByYear
      }
    });
    
  } catch (error) {
    console.error("Get tax statistics error:", error);
    res.status(500).json({
      success: false,
      message: "পরিসংখ্যান লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// PUT - Update Tax Return
Userroute.put("/tax-return/:id", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "অবৈধ রিটার্ন আইডি"
      });
    }
    
    // Find tax return
    const taxReturn = await TaxReturn.findOne({
      _id: id,
      user: user._id
    });
    
    if (!taxReturn) {
      return res.status(404).json({
        success: false,
        message: "আয়কর রিটার্ন পাওয়া যায়নি"
      });
    }
    
    // Update fields (exclude receiptId and user)
    const updatableFields = [
      'taxpayerName', 'fathersName', 'mothersName', 'currentAddress',
      'permanentAddress', 'taxpayerStatus', 'nidNumber', 'tinNumber',
      'circle', 'taxZone', 'totalIncome', 'totalTaxPaid', 'assessmentYear',
      'financialYear', 'returnSubmissionDate', 'taxRebate',
      'taxOfficeName', 'taxOfficeAddress'
    ];
    
    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        taxReturn[field] = req.body[field];
      }
    });
    
    // Recalculate tax if income changed
    if (req.body.totalIncome !== undefined) {
      taxReturn.totalIncome = parseFloat(req.body.totalIncome);
    }
    
    if (req.body.taxRebate !== undefined) {
      taxReturn.taxRebate = parseFloat(req.body.taxRebate);
    }
    
    await taxReturn.save();
    
    res.status(200).json({
      success: true,
      message: "আয়কর রিটার্ন সফলভাবে আপডেট করা হয়েছে",
      data: {
        _id: taxReturn._id,
        receiptId: taxReturn.receiptId,
        taxpayerName: taxReturn.taxpayerName,
        totalIncome: taxReturn.totalIncome,
        totalTaxPaid: taxReturn.totalTaxPaid,
        updatedAt: taxReturn.updatedAt
      }
    });
    
  } catch (error) {
    console.error("Update tax return error:", error);
    res.status(500).json({
      success: false,
      message: "আয়কর রিটার্ন আপডেট করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});
const TaxReturnAcknowledgement = require("../models/TaxReturnAcknowledgement");

// Helper function to generate receipt ID
function generateAcknowledgementReceiptId() {
  const prefix = 'ACK';
  const timestamp = Date.now().toString().slice(-6);
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  
  return `${prefix}${timestamp}${randomStr}`;
}

// Helper function to generate return register serial number
function generateReturnSerialNo() {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

// Helper function to generate QR code data
function generateAcknowledgementQRCodeData(data) {
  return `Acknowledgement Receipt/Certificate of Return of Income
Government of Bangladesh
National Board of Revenue

Taxpayer Name: ${data.taxpayerName}
TIN: ${data.tinNumber}
NID: ${data.nidNumber}
Assessment Year: ${data.assessmentYear}
Total Income: ${data.totalIncome} Taka
Total Tax Paid: ${data.totalTaxPaid} Taka
Return Serial No: ${data.returnRegisterSerialNo}

Verify at: ${data.verificationUrl}`;
}

// POST - Save Acknowledgement Receipt
Userroute.post("/tax-acknowledgement/save", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    
    // Validate required fields
    const requiredFields = [
      'taxpayerName',
      'nidNumber',
      'tinNumber',
      'assessmentYear',
      'circle',
      'taxZone',
      'totalIncome',
      'totalTaxPaid',
      'returnSubmissionDate'
    ];
    
    for (const field of requiredFields) {
      if (!req.body[field] || req.body[field].toString().trim() === '') {
        return res.status(400).json({
          success: false,
          message: `${field} ফিল্ডটি পূরণ করুন`
        });
      }
    }
    
    // Validate TIN format (12 digits)
    const tinRegex = /^\d{12}$/;
    if (!tinRegex.test(req.body.tinNumber.replace(/\s/g, ''))) {
      return res.status(400).json({
        success: false,
        message: "টিআইএন নম্বর ১২ ডিজিটের হতে হবে"
      });
    }
    
    // Validate NID format
    const nidRegex = /^\d{10}$/;
    if (!nidRegex.test(req.body.nidNumber.replace(/\s/g, ''))) {
      return res.status(400).json({
        success: false,
        message: "এনআইডি নম্বর ১০ ডিজিটের হতে হবে"
      });
    }
    
    // Generate receipt ID and reference number
    const receiptId = generateAcknowledgementReceiptId();
    const referenceNo = `TAXACK${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 100)}`;
    
    // Generate return register serial number
    const returnSerialNo = generateReturnSerialNo();
    
    // Parse numerical values
    const totalIncome = parseFloat(req.body.totalIncome) || 0;
    const totalTaxPaid = parseFloat(req.body.totalTaxPaid) || 0;
    
    // Create verification URL
    const verificationUrl = `${req.headers.origin || 'https://etaxnbr.gov.bd'}/verify-acknowledgement/${receiptId}`;
    
    // Create new acknowledgement document
    const acknowledgement = new TaxReturnAcknowledgement({
      user: user._id,
      receiptId: receiptId,
      referenceNo: referenceNo,
      
      // Taxpayer information
      taxpayerName: req.body.taxpayerName.trim(),
      nidNumber: req.body.nidNumber.trim(),
      passportNumber: req.body.passportNumber ? req.body.passportNumber.trim() : '',
      tinNumber: req.body.tinNumber.trim(),
      
      // Assessment information
      assessmentYear: req.body.assessmentYear,
      
      // Tax office information
      circle: req.body.circle.trim(),
      taxZone: req.body.taxZone.trim(),
      
      // Income and tax details
      totalIncome: totalIncome,
      totalTaxPaid: totalTaxPaid,
      
      // Return registration details
      returnRegisterSerialNo: returnSerialNo,
      returnRegisterVolumeNo: req.body.returnRegisterVolumeNo || '',
      returnSubmissionDate: req.body.returnSubmissionDate,
      
      // Additional information
      taxOfficeName: req.body.taxOfficeName || 'National Board of Revenue',
      taxOfficeAddress: req.body.taxOfficeAddress || 'Income Tax Office',
      
      // Verification
      verificationUrl: verificationUrl,
      
      // Transaction reference
      transactionId: req.body.transactionId || null,
      
      status: 'completed'
    });
    
    // Generate QR code data
    acknowledgement.qrCodeData = generateAcknowledgementQRCodeData({
      taxpayerName: acknowledgement.taxpayerName,
      tinNumber: acknowledgement.tinNumber,
      nidNumber: acknowledgement.nidNumber,
      assessmentYear: acknowledgement.assessmentYear,
      totalIncome: acknowledgement.totalIncome,
      totalTaxPaid: acknowledgement.totalTaxPaid,
      returnRegisterSerialNo: acknowledgement.returnRegisterSerialNo,
      verificationUrl: acknowledgement.verificationUrl
    });
    
    await acknowledgement.save();
    
    res.status(201).json({
      success: true,
      message: "স্বীকারপত্র সফলভাবে সংরক্ষণ করা হয়েছে",
      data: {
        _id: acknowledgement._id,
        receiptId: acknowledgement.receiptId,
        referenceNo: acknowledgement.referenceNo,
        taxpayerName: acknowledgement.taxpayerName,
        nidNumber: acknowledgement.nidNumber,
        tinNumber: acknowledgement.tinNumber,
        assessmentYear: acknowledgement.assessmentYear,
        circle: acknowledgement.circle,
        taxZone: acknowledgement.taxZone,
        totalIncome: acknowledgement.totalIncome,
        totalTaxPaid: acknowledgement.totalTaxPaid,
        returnRegisterSerialNo: acknowledgement.returnRegisterSerialNo,
        returnSubmissionDate: acknowledgement.returnSubmissionDate,
        verificationUrl: acknowledgement.verificationUrl,
        createdAt: acknowledgement.createdAt
      }
    });
    
  } catch (error) {
    console.error("Save acknowledgement error:", error);
    
    if (error.code === 11000) {
      if (error.keyPattern && error.keyPattern.receiptId) {
        return res.status(400).json({
          success: false,
          message: "Receipt ID already exists. Please try again."
        });
      }
      if (error.keyPattern && error.keyPattern.referenceNo) {
        return res.status(400).json({
          success: false,
          message: "এই রেফারেন্স নম্বরটি ইতিমধ্যে ব্যবহৃত হয়েছে"
        });
      }
    }
    
    res.status(500).json({
      success: false,
      message: "স্বীকারপত্র সংরক্ষণ করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get all Acknowledgements for user
Userroute.get("/tax-acknowledgement/all", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Search filter
    const search = req.query.search || '';
    
    // Assessment year filter
    const assessmentYear = req.query.assessmentYear;
    
    // Build query
    let query = { user: user._id };
    
    if (search) {
      query.$or = [
        { receiptId: { $regex: search, $options: 'i' } },
        { referenceNo: { $regex: search, $options: 'i' } },
        { tinNumber: { $regex: search, $options: 'i' } },
        { taxpayerName: { $regex: search, $options: 'i' } },
        { nidNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (assessmentYear) {
      query.assessmentYear = assessmentYear;
    }
    
    // Get total count
    const total = await TaxReturnAcknowledgement.countDocuments(query);
    
    // Get acknowledgements
    const acknowledgements = await TaxReturnAcknowledgement.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-qrCodeData -__v');
    
    res.status(200).json({
      success: true,
      message: "স্বীকারপত্র তালিকা",
      data: acknowledgements,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error("Get acknowledgement list error:", error);
    res.status(500).json({
      success: false,
      message: "স্বীকারপত্র তালিকা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get single Acknowledgement by ID
Userroute.get("/tax-acknowledgement/:id", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    
    // Check if id is receiptId or MongoDB ObjectId
    let query;
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: id, user: user._id };
    } else {
      query = { receiptId: id, user: user._id };
    }
    
    // Find acknowledgement
    const acknowledgement = await TaxReturnAcknowledgement.findOne(query);
    
    if (!acknowledgement) {
      return res.status(404).json({
        success: false,
        message: "স্বীকারপত্র পাওয়া যায়নি"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "স্বীকারপত্র ডাটা লোড সফল",
      data: acknowledgement
    });
    
  } catch (error) {
    console.error("Get acknowledgement details error:", error);
    res.status(500).json({
      success: false,
      message: "স্বীকারপত্র ডাটা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get Acknowledgement by receiptId
Userroute.get("/tax-acknowledgement/receipt/:receiptId", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { receiptId } = req.params;
    
    if (!receiptId) {
      return res.status(400).json({
        success: false,
        message: "রসিদ আইডি প্রয়োজন"
      });
    }
    
    // Find acknowledgement
    const acknowledgement = await TaxReturnAcknowledgement.findOne({
      receiptId: receiptId,
      user: user._id
    });
    
    if (!acknowledgement) {
      return res.status(404).json({
        success: false,
        message: "স্বীকারপত্র পাওয়া যায়নি"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "স্বীকারপত্র ডাটা লোড সফল",
      data: acknowledgement
    });
    
  } catch (error) {
    console.error("Get acknowledgement by receiptId error:", error);
    res.status(500).json({
      success: false,
      message: "স্বীকারপত্র ডাটা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// DELETE - Delete Acknowledgement
Userroute.delete("/tax-acknowledgement/:id", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "অবৈধ আইডি"
      });
    }
    
    // Find and delete acknowledgement
    const result = await TaxReturnAcknowledgement.findOneAndDelete({
      _id: id,
      user: user._id
    });
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "স্বীকারপত্র পাওয়া যায়নি"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "স্বীকারপত্র সফলভাবে ডিলিট করা হয়েছে",
      data: {
        receiptId: result.receiptId,
        taxpayerName: result.taxpayerName,
        deletedAt: new Date()
      }
    });
    
  } catch (error) {
    console.error("Delete acknowledgement error:", error);
    res.status(500).json({
      success: false,
      message: "স্বীকারপত্র ডিলিট করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get acknowledgement statistics
Userroute.get("/tax-acknowledgement/statistics", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    
    // Get statistics
    const totalAcknowledgements = await TaxReturnAcknowledgement.countDocuments({ user: user._id });
    
    // Get total income and tax
    const stats = await TaxReturnAcknowledgement.aggregate([
      { $match: { user: user._id } },
      { 
        $group: {
          _id: null,
          totalIncome: { $sum: "$totalIncome" },
          totalTaxPaid: { $sum: "$totalTaxPaid" }
        }
      }
    ]);
    
    // Get acknowledgements by assessment year
    const acknowledgementsByYear = await TaxReturnAcknowledgement.aggregate([
      { $match: { user: user._id } },
      { 
        $group: {
          _id: "$assessmentYear",
          count: { $sum: 1 },
          totalIncome: { $sum: "$totalIncome" },
          totalTax: { $sum: "$totalTaxPaid" }
        }
      },
      { $sort: { _id: -1 } }
    ]);
    
    res.status(200).json({
      success: true,
      message: "স্বীকারপত্র পরিসংখ্যান",
      data: {
        totalAcknowledgements,
        totalIncome: stats.length > 0 ? stats[0].totalIncome : 0,
        totalTaxPaid: stats.length > 0 ? stats[0].totalTaxPaid : 0,
        acknowledgementsByYear
      }
    });
    
  } catch (error) {
    console.error("Get acknowledgement statistics error:", error);
    res.status(500).json({
      success: false,
      message: "পরিসংখ্যান লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// PUT - Update Acknowledgement
Userroute.put("/tax-acknowledgement/:id", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "অবৈধ আইডি"
      });
    }
    
    // Find acknowledgement
    const acknowledgement = await TaxReturnAcknowledgement.findOne({
      _id: id,
      user: user._id
    });
    
    if (!acknowledgement) {
      return res.status(404).json({
        success: false,
        message: "স্বীকারপত্র পাওয়া যায়নি"
      });
    }
    
    // Update fields
    const updatableFields = [
      'taxpayerName', 'nidNumber', 'passportNumber', 'tinNumber',
      'assessmentYear', 'circle', 'taxZone', 'totalIncome',
      'totalTaxPaid', 'returnRegisterVolumeNo', 'returnSubmissionDate',
      'taxOfficeName', 'taxOfficeAddress'
    ];
    
    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        acknowledgement[field] = req.body[field];
      }
    });
    
    // Parse numerical values
    if (req.body.totalIncome !== undefined) {
      acknowledgement.totalIncome = parseFloat(req.body.totalIncome);
    }
    
    if (req.body.totalTaxPaid !== undefined) {
      acknowledgement.totalTaxPaid = parseFloat(req.body.totalTaxPaid);
    }
    
    // Regenerate QR code if data changed
    const changedFields = ['taxpayerName', 'tinNumber', 'nidNumber', 'assessmentYear', 'totalIncome', 'totalTaxPaid'];
    const hasChanged = changedFields.some(field => req.body[field] !== undefined);
    
    if (hasChanged) {
      acknowledgement.qrCodeData = generateAcknowledgementQRCodeData({
        taxpayerName: acknowledgement.taxpayerName,
        tinNumber: acknowledgement.tinNumber,
        nidNumber: acknowledgement.nidNumber,
        assessmentYear: acknowledgement.assessmentYear,
        totalIncome: acknowledgement.totalIncome,
        totalTaxPaid: acknowledgement.totalTaxPaid,
        returnRegisterSerialNo: acknowledgement.returnRegisterSerialNo,
        verificationUrl: acknowledgement.verificationUrl
      });
    }
    
    await acknowledgement.save();
    
    res.status(200).json({
      success: true,
      message: "স্বীকারপত্র সফলভাবে আপডেট করা হয়েছে",
      data: {
        _id: acknowledgement._id,
        receiptId: acknowledgement.receiptId,
        taxpayerName: acknowledgement.taxpayerName,
        totalIncome: acknowledgement.totalIncome,
        totalTaxPaid: acknowledgement.totalTaxPaid,
        updatedAt: acknowledgement.updatedAt
      }
    });
    
  } catch (error) {
    console.error("Update acknowledgement error:", error);
    res.status(500).json({
      success: false,
      message: "স্বীকারপত্র আপডেট করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});
// Add at the top with other imports
const TinCertificate = require("../models/TinCertificate");

// Add these routes after other routes:

// Helper function to generate TIN receipt ID
function generateTinReceiptId() {
  const prefix = 'TIN';
  const timestamp = Date.now().toString().slice(-8);
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${randomStr}`;
}

// Helper function to generate QR code data
function generateTinQRCodeData(tinNumber, name, issueDate, verificationUrl) {
  return `TIN Certificate
TIN Number: ${tinNumber}
Name: ${name}
Issue Date: ${issueDate}
Status: Active Taxpayer

Verify at: ${verificationUrl}`;
}

// POST - Save TIN Certificate
Userroute.post("/tin-certificate/save", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    
    // Validate required fields
    const requiredFields = [
      'tinNumber', 'name', 'fatherName', 'motherName',
      'currentAddress', 'permanentAddress'
    ];
    
    for (const field of requiredFields) {
      if (!req.body[field] || req.body[field].trim() === '') {
        return res.status(400).json({
          success: false,
          message: `${field} ফিল্ডটি পূরণ করুন`
        });
      }
    }
    
    // Generate receipt ID
    const receiptId = generateTinReceiptId();
    
    // Create verification URL
    const verificationUrl = `https://api.xbdapi.my.id/clone-services/tin-certificate-download/${receiptId}`;
    
    // Generate QR code data
    const qrCodeData = generateTinQRCodeData(
      req.body.tinNumber.trim(),
      req.body.name.trim(),
      req.body.issueDate || new Date(),
      verificationUrl
    );
    
    // Create new TIN certificate
    const tinCertificate = new TinCertificate({
      user: user._id,
      receiptId: receiptId,
      tinNumber: req.body.tinNumber.trim(),
      name: req.body.name.trim(),
      fatherName: req.body.fatherName.trim(),
      motherName: req.body.motherName.trim(),
      currentAddress: req.body.currentAddress.trim(),
      permanentAddress: req.body.permanentAddress.trim(),
      taxesCircle: req.body.taxesCircle || '114',
      taxesZone: req.body.taxesZone || '06',
      city: req.body.city || 'Dhaka',
      issueDate: req.body.issueDate || new Date(),
      previousTin: req.body.previousTin || 'Not Applicable',
      taxpayerType: req.body.taxpayerType || 'Individual',
      verificationUrl: verificationUrl,
      qrCodeData: qrCodeData,
      status: 'active'
    });
    
    await tinCertificate.save();
    
    res.status(201).json({
      success: true,
      message: "TIN সার্টিফিকেট সফলভাবে সংরক্ষণ করা হয়েছে",
      data: {
        _id: tinCertificate._id,
        receiptId: tinCertificate.receiptId,
        tinNumber: tinCertificate.tinNumber,
        name: tinCertificate.name,
        issueDate: tinCertificate.issueDate,
        verificationUrl: tinCertificate.verificationUrl,
        createdAt: tinCertificate.createdAt
      }
    });
    
  } catch (error) {
    console.error("Save TIN certificate error:", error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Receipt ID already exists. Please try again."
      });
    }
    
    res.status(500).json({
      success: false,
      message: "TIN সার্টিফিকেট সংরক্ষণ করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get all TIN certificates for user
Userroute.get("/tin-certificate/all", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Search filter
    const search = req.query.search || '';
    
    // Build query
    let query = { user: user._id };
    
    if (search) {
      query.$or = [
        { receiptId: { $regex: search, $options: 'i' } },
        { tinNumber: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { fatherName: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Get total count
    const total = await TinCertificate.countDocuments(query);
    
    // Get certificates
    const certificates = await TinCertificate.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-qrCodeData -__v');
    
    // Format response
    const formattedCertificates = certificates.map(cert => ({
      _id: cert._id,
      receiptId: cert.receiptId,
      tinNumber: cert.tinNumber,
      name: cert.name,
      fatherName: cert.fatherName,
      motherName: cert.motherName,
      currentAddress: cert.currentAddress,
      taxesCircle: cert.taxesCircle,
      taxesZone: cert.taxesZone,
      city: cert.city,
      issueDate: cert.issueDate,
      taxpayerType: cert.taxpayerType,
      status: cert.status,
      createdAt: cert.createdAt,
      updatedAt: cert.updatedAt
    }));
    
    res.status(200).json({
      success: true,
      message: "TIN সার্টিফিকেট তালিকা",
      data: formattedCertificates,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error("Get TIN certificate list error:", error);
    res.status(500).json({
      success: false,
      message: "TIN সার্টিফিকেট তালিকা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get single TIN certificate by ID
Userroute.get("/tin-certificate/:id", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "অবৈধ সার্টিফিকেট আইডি"
      });
    }
    
    // Find certificate
    const certificate = await TinCertificate.findOne({
      _id: id,
      user: user._id
    });
    
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "TIN সার্টিফিকেট পাওয়া যায়নি"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "TIN ডাটা লোড সফল",
      data: certificate
    });
    
  } catch (error) {
    console.error("Get TIN certificate details error:", error);
    res.status(500).json({
      success: false,
      message: "TIN ডাটা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get TIN certificate by receiptId
Userroute.get("/tin-certificate/receipt/:receiptId", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { receiptId } = req.params;
    
    if (!receiptId) {
      return res.status(400).json({
        success: false,
        message: "সার্টিফিকেট আইডি প্রয়োজন"
      });
    }
    
    // Find certificate
    const certificate = await TinCertificate.findOne({
      receiptId: receiptId,
      user: user._id
    });
    
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "TIN সার্টিফিকেট পাওয়া যায়নি"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "TIN ডাটা লোড সফল",
      data: certificate
    });
    
  } catch (error) {
    console.error("Get TIN certificate by receiptId error:", error);
    res.status(500).json({
      success: false,
      message: "TIN ডাটা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// DELETE - Delete TIN certificate
Userroute.delete("/tin-certificate/:id", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "অবৈধ সার্টিফিকেট আইডি"
      });
    }
    
    // Find and delete certificate
    const result = await TinCertificate.findOneAndDelete({
      _id: id,
      user: user._id
    });
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "TIN সার্টিফিকেট পাওয়া যায়নি"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "TIN সার্টিফিকেট সফলভাবে ডিলিট করা হয়েছে",
      data: {
        receiptId: result.receiptId,
        deletedAt: new Date()
      }
    });
    
  } catch (error) {
    console.error("Delete TIN certificate error:", error);
    res.status(500).json({
      success: false,
      message: "TIN সার্টিফিকেট ডিলিট করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get QR code data for certificate
Userroute.get("/tin-certificate/qr-code/:receiptId", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { receiptId } = req.params;
    
    if (!receiptId) {
      return res.status(400).json({
        success: false,
        message: "সার্টিফিকেট আইডি প্রয়োজন"
      });
    }
    
    // Find certificate
    const certificate = await TinCertificate.findOne({
      receiptId: receiptId,
      user: user._id
    });
    
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "TIN সার্টিফিকেট পাওয়া যায়নি"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "QR কোড ডাটা লোড সফল",
      data: {
        qrCodeData: certificate.qrCodeData,
        verificationUrl: certificate.verificationUrl
      }
    });
    
  } catch (error) {
    console.error("Get QR code error:", error);
    res.status(500).json({
      success: false,
      message: "QR কোড ডাটা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// Add at the top with other imports
const SscCertificate = require("../models/SscCertificate");

// Add these routes after other routes:

// Helper function to generate SSC receipt ID
function generateSscReceiptId() {
  const prefix = 'SSC';
  const timestamp = Date.now().toString().slice(-8);
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${randomStr}`;
}

// Helper function to convert date to words
function convertDateToWords(dateString) {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'long' });
  const year = date.getFullYear();
  
  // Convert day to ordinal
  const getOrdinal = (n) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };
  
  // Convert year to words
  const convertYearToWords = (year) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    
    if (year < 1900 || year > 2099) return year.toString();
    
    let words = '';
    const thousand = Math.floor(year / 1000);
    const hundred = Math.floor((year % 1000) / 100);
    const ten = Math.floor((year % 100) / 10);
    const one = year % 10;
    
    if (thousand === 1 && hundred === 9) {
      words = 'Nineteen';
      if (ten === 0 && one === 0) {
        words += ' Hundred';
      } else {
        words += ' ';
        if (ten === 0) {
          words += ones[one];
        } else if (ten === 1) {
          words += teens[one];
        } else {
          words += tens[ten];
          if (one > 0) words += ' ' + ones[one];
        }
      }
    } else if (thousand === 2 && hundred === 0) {
      words = 'Two Thousand';
      if (ten > 0 || one > 0) {
        words += ' ';
        if (ten === 0) {
          words += ones[one];
        } else if (ten === 1) {
          words += teens[one];
        } else {
          words += tens[ten];
          if (one > 0) words += ' ' + ones[one];
        }
      }
    } else {
      return year.toString();
    }
    
    return words;
  };
  
  const dayOrdinal = getOrdinal(day);
  const yearWords = convertYearToWords(year);
  
  return `${dayOrdinal} ${month} ${yearWords}`;
}

// Helper function to generate QR code data
function generateSscQRCodeData(serialNo, rollNo, studentName, registrationNo, verificationUrl) {
  return `SSC Certificate
Serial No: ${serialNo}
Roll No: ${rollNo}
Name: ${studentName}
Registration No: ${registrationNo}
Board: Dhaka

Verify at: ${verificationUrl}`;
}

// POST - Save SSC Certificate
Userroute.post("/ssc-certificate/save", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    
    // Validate required fields
    const requiredFields = [
      'studentName', 'fatherName', 'motherName', 'schoolName',
      'schoolLocation', 'rollNo', 'dateOfBirth', 'resultPublicationDate'
    ];
    
    for (const field of requiredFields) {
      if (!req.body[field] || req.body[field].trim() === '') {
        return res.status(400).json({
          success: false,
          message: `${field} ফিল্ডটি পূরণ করুন`
        });
      }
    }
    
    // Generate receipt ID
    const receiptId = generateSscReceiptId();
    
    // Create verification URL
    const verificationUrl = `https://api.xbdapi.my.id/clone-services/ssc-certificate-download/${receiptId}`;
    
    // Convert date to words
    const birthDateInWords = convertDateToWords(req.body.dateOfBirth);
    
    // Generate QR code data
    const qrCodeData = generateSscQRCodeData(
      req.body.serialNo || 'DBS 5001144',
      req.body.rollNo.trim(),
      req.body.studentName.trim(),
      req.body.registrationNo || '804466/2012',
      verificationUrl
    );
    
    // Create new SSC certificate
    const sscCertificate = new SscCertificate({
      user: user._id,
      receiptId: receiptId,
      serialNo: req.body.serialNo || 'DBS 5001144',
      registrationNo: req.body.registrationNo || '804466/2012',
      dbcscNo: req.body.dbcscNo || '08001332',
      studentName: req.body.studentName.trim(),
      fatherName: req.body.fatherName.trim(),
      motherName: req.body.motherName.trim(),
      schoolName: req.body.schoolName.trim(),
      schoolLocation: req.body.schoolLocation.trim(),
      district: req.body.district || 'Kishorganj',
      rollNo: req.body.rollNo.trim(),
      group: req.body.group || 'Science',
      gpa: req.body.gpa || '4.18',
      dateOfBirth: req.body.dateOfBirth,
      birthDateInWords: birthDateInWords,
      board: req.body.board || 'Dhaka',
      resultPublicationDate: req.body.resultPublicationDate,
      examinationYear: req.body.examinationYear || '2012',
      verificationUrl: verificationUrl,
      qrCodeData: qrCodeData,
      status: 'issued'
    });
    
    await sscCertificate.save();
    
    res.status(201).json({
      success: true,
      message: "SSC সার্টিফিকেট সফলভাবে সংরক্ষণ করা হয়েছে",
      data: {
        _id: sscCertificate._id,
        receiptId: sscCertificate.receiptId,
        studentName: sscCertificate.studentName,
        rollNo: sscCertificate.rollNo,
        schoolName: sscCertificate.schoolName,
        gpa: sscCertificate.gpa,
        verificationUrl: sscCertificate.verificationUrl,
        createdAt: sscCertificate.createdAt
      }
    });
    
  } catch (error) {
    console.error("Save SSC certificate error:", error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Receipt ID already exists. Please try again."
      });
    }
    
    res.status(500).json({
      success: false,
      message: "SSC সার্টিফিকেট সংরক্ষণ করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get all SSC certificates for user
Userroute.get("/ssc-certificate/all", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Search filter
    const search = req.query.search || '';
    
    // Build query
    let query = { user: user._id };
    
    if (search) {
      query.$or = [
        { receiptId: { $regex: search, $options: 'i' } },
        { rollNo: { $regex: search, $options: 'i' } },
        { studentName: { $regex: search, $options: 'i' } },
        { fatherName: { $regex: search, $options: 'i' } },
        { schoolName: { $regex: search, $options: 'i' } },
        { registrationNo: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Get total count
    const total = await SscCertificate.countDocuments(query);
    
    // Get certificates
    const certificates = await SscCertificate.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-qrCodeData -__v');
    
    // Format response
    const formattedCertificates = certificates.map(cert => ({
      _id: cert._id,
      receiptId: cert.receiptId,
      studentName: cert.studentName,
      fatherName: cert.fatherName,
      motherName: cert.motherName,
      rollNo: cert.rollNo,
      registrationNo: cert.registrationNo,
      schoolName: cert.schoolName,
      group: cert.group,
      gpa: cert.gpa,
      dateOfBirth: cert.dateOfBirth,
      resultPublicationDate: cert.resultPublicationDate,
      examinationYear: cert.examinationYear,
      board: cert.board,
      status: cert.status,
      createdAt: cert.createdAt,
      updatedAt: cert.updatedAt
    }));
    
    res.status(200).json({
      success: true,
      message: "SSC সার্টিফিকেট তালিকা",
      data: formattedCertificates,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error("Get SSC certificate list error:", error);
    res.status(500).json({
      success: false,
      message: "SSC সার্টিফিকেট তালিকা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get single SSC certificate by ID
Userroute.get("/ssc-certificate/:id", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "অবৈধ সার্টিফিকেট আইডি"
      });
    }
    
    // Find certificate
    const certificate = await SscCertificate.findOne({
      _id: id,
      user: user._id
    });
    
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "SSC সার্টিফিকেট পাওয়া যায়নি"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "SSC ডাটা লোড সফল",
      data: certificate
    });
    
  } catch (error) {
    console.error("Get SSC certificate details error:", error);
    res.status(500).json({
      success: false,
      message: "SSC ডাটা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get SSC certificate by receiptId
Userroute.get("/ssc-certificate/receipt/:receiptId", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { receiptId } = req.params;
    
    if (!receiptId) {
      return res.status(400).json({
        success: false,
        message: "সার্টিফিকেট আইডি প্রয়োজন"
      });
    }
    
    // Find certificate
    const certificate = await SscCertificate.findOne({
      receiptId: receiptId,
      user: user._id
    });
    
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "SSC সার্টিফিকেট পাওয়া যায়নি"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "SSC ডাটা লোড সফল",
      data: certificate
    });
    
  } catch (error) {
    console.error("Get SSC certificate by receiptId error:", error);
    res.status(500).json({
      success: false,
      message: "SSC ডাটা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// DELETE - Delete SSC certificate
Userroute.delete("/ssc-certificate/:id", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "অবৈধ সার্টিফিকেট আইডি"
      });
    }
    
    // Find and delete certificate
    const result = await SscCertificate.findOneAndDelete({
      _id: id,
      user: user._id
    });
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "SSC সার্টিফিকেট পাওয়া যায়নি"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "SSC সার্টিফিকেট সফলভাবে ডিলিট করা হয়েছে",
      data: {
        receiptId: result.receiptId,
        deletedAt: new Date()
      }
    });
    
  } catch (error) {
    console.error("Delete SSC certificate error:", error);
    res.status(500).json({
      success: false,
      message: "SSC সার্টিফিকেট ডিলিট করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get QR code data for certificate
Userroute.get("/ssc-certificate/qr-code/:receiptId", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { receiptId } = req.params;
    
    if (!receiptId) {
      return res.status(400).json({
        success: false,
        message: "সার্টিফিকেট আইডি প্রয়োজন"
      });
    }
    
    // Find certificate
    const certificate = await SscCertificate.findOne({
      receiptId: receiptId,
      user: user._id
    });
    
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "SSC সার্টিফিকেট পাওয়া যায়নি"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "QR কোড ডাটা লোড সফল",
      data: {
        qrCodeData: certificate.qrCodeData,
        verificationUrl: certificate.verificationUrl
      }
    });
    
  } catch (error) {
    console.error("Get QR code error:", error);
    res.status(500).json({
      success: false,
      message: "QR কোড ডাটা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// Add at the top with other imports
const HscCertificate = require("../models/HscCertificate");

// Add these routes after other routes:

// Helper function to generate HSC receipt ID
function generateHscReceiptId() {
  const prefix = 'HSC';
  const timestamp = Date.now().toString().slice(-8);
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${randomStr}`;
}

// Helper function to convert date to words (more comprehensive for HSC)
function convertDateToWords(dateString) {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'long' });
  const year = date.getFullYear();
  
  // Convert day to word
  const dayWords = {
    1: 'First', 2: 'Second', 3: 'Third', 4: 'Fourth', 5: 'Fifth',
    6: 'Sixth', 7: 'Seventh', 8: 'Eighth', 9: 'Ninth', 10: 'Tenth',
    11: 'Eleventh', 12: 'Twelfth', 13: 'Thirteenth', 14: 'Fourteenth', 15: 'Fifteenth',
    16: 'Sixteenth', 17: 'Seventeenth', 18: 'Eighteenth', 19: 'Nineteenth', 20: 'Twentieth',
    21: 'Twenty First', 22: 'Twenty Second', 23: 'Twenty Third', 24: 'Twenty Fourth',
    25: 'Twenty Fifth', 26: 'Twenty Sixth', 27: 'Twenty Seventh', 28: 'Twenty Eighth',
    29: 'Twenty Ninth', 30: 'Thirtieth', 31: 'Thirty First'
  };
  
  // Convert year to words
  const convertYearToWords = (year) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    
    if (year < 1900 || year > 2099) return year.toString();
    
    let words = '';
    const thousand = Math.floor(year / 1000);
    const hundred = Math.floor((year % 1000) / 100);
    const ten = Math.floor((year % 100) / 10);
    const one = year % 10;
    
    if (thousand === 1 && hundred === 9) {
      words = 'Nineteen';
      if (ten === 0 && one === 0) {
        words += ' Hundred';
      } else {
        words += ' ';
        if (ten === 0) {
          words += ones[one];
        } else if (ten === 1) {
          words += teens[one];
        } else {
          words += tens[ten];
          if (one > 0) words += ' ' + ones[one];
        }
      }
    } else if (thousand === 2 && hundred === 0) {
      words = 'Two Thousand';
      if (ten > 0 || one > 0) {
        words += ' ';
        if (ten === 0) {
          words += ones[one];
        } else if (ten === 1) {
          words += teens[one];
        } else {
          words += tens[ten];
          if (one > 0) words += ' ' + ones[one];
        }
      }
    } else {
      return year.toString();
    }
    
    return words;
  };
  
  const dayWord = dayWords[day] || day.toString();
  const yearWords = convertYearToWords(year);
  
  return `${dayWord} ${month} ${yearWords}`;
}

// Helper function to generate QR code data
function generateHscQRCodeData(serialNo, rollNo, studentName, registrationNo, verificationUrl) {
  return `HSC Certificate
Serial No: ${serialNo}
Roll No: ${rollNo}
Name: ${studentName}
Registration No: ${registrationNo}
Board: Dhaka
Certificate Type: Higher Secondary School Certificate

Verify at: ${verificationUrl}`;
}

// POST - Save HSC Certificate
Userroute.post("/hsc-certificate/save", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    
    // Validate required fields
    const requiredFields = [
      'studentName', 'fatherName', 'motherName', 'collegeName',
      'collegeLocation', 'rollNo', 'dateOfBirth', 'resultPublicationDate'
    ];
    
    for (const field of requiredFields) {
      if (!req.body[field] || req.body[field].trim() === '') {
        return res.status(400).json({
          success: false,
          message: `${field} ফিল্ডটি পূরণ করুন`
        });
      }
    }
    
    // Generate receipt ID
    const receiptId = generateHscReceiptId();
    
    // Create verification URL
    const verificationUrl = `https://api.xbdapi.my.id/clone-services/hsc-certificate-download/${receiptId}`;
    
    // Convert date to words
    const birthDateInWords = convertDateToWords(req.body.dateOfBirth);
    
    // Generate QR code data
    const qrCodeData = generateHscQRCodeData(
      req.body.serialNo || 'DBH 6002245',
      req.body.rollNo.trim(),
      req.body.studentName.trim(),
      req.body.registrationNo || '904466/2014',
      verificationUrl
    );
    
    // Create new HSC certificate
    const hscCertificate = new HscCertificate({
      user: user._id,
      receiptId: receiptId,
      serialNo: req.body.serialNo || 'DBH 6002245',
      registrationNo: req.body.registrationNo || '904466/2014',
      dbhscNo: req.body.dbhscNo || '09002332',
      studentName: req.body.studentName.trim(),
      fatherName: req.body.fatherName.trim(),
      motherName: req.body.motherName.trim(),
      collegeName: req.body.collegeName.trim(),
      collegeLocation: req.body.collegeLocation.trim(),
      district: req.body.district || 'Dhaka',
      rollNo: req.body.rollNo.trim(),
      group: req.body.group || 'Science',
      gpa: req.body.gpa || '4.50',
      dateOfBirth: req.body.dateOfBirth,
      birthDateInWords: birthDateInWords,
      board: req.body.board || 'Dhaka',
      resultPublicationDate: req.body.resultPublicationDate,
      examinationYear: req.body.examinationYear || '2014',
      division: req.body.division || 'First',
      session: req.body.session || '2013-2014',
      verificationUrl: verificationUrl,
      qrCodeData: qrCodeData,
      status: 'issued'
    });
    
    await hscCertificate.save();
    
    res.status(201).json({
      success: true,
      message: "HSC সার্টিফিকেট সফলভাবে সংরক্ষণ করা হয়েছে",
      data: {
        _id: hscCertificate._id,
        receiptId: hscCertificate.receiptId,
        studentName: hscCertificate.studentName,
        rollNo: hscCertificate.rollNo,
        collegeName: hscCertificate.collegeName,
        gpa: hscCertificate.gpa,
        division: hscCertificate.division,
        verificationUrl: hscCertificate.verificationUrl,
        createdAt: hscCertificate.createdAt
      }
    });
    
  } catch (error) {
    console.error("Save HSC certificate error:", error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Receipt ID already exists. Please try again."
      });
    }
    
    res.status(500).json({
      success: false,
      message: "HSC সার্টিফিকেট সংরক্ষণ করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get all HSC certificates for user
Userroute.get("/hsc-certificate/all", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Search filter
    const search = req.query.search || '';
    
    // Build query
    let query = { user: user._id };
    
    if (search) {
      query.$or = [
        { receiptId: { $regex: search, $options: 'i' } },
        { rollNo: { $regex: search, $options: 'i' } },
        { studentName: { $regex: search, $options: 'i' } },
        { fatherName: { $regex: search, $options: 'i' } },
        { collegeName: { $regex: search, $options: 'i' } },
        { registrationNo: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Get total count
    const total = await HscCertificate.countDocuments(query);
    
    // Get certificates
    const certificates = await HscCertificate.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-qrCodeData -__v');
    
    // Format response
    const formattedCertificates = certificates.map(cert => ({
      _id: cert._id,
      receiptId: cert.receiptId,
      studentName: cert.studentName,
      fatherName: cert.fatherName,
      motherName: cert.motherName,
      rollNo: cert.rollNo,
      registrationNo: cert.registrationNo,
      collegeName: cert.collegeName,
      group: cert.group,
      gpa: cert.gpa,
      division: cert.division,
      dateOfBirth: cert.dateOfBirth,
      resultPublicationDate: cert.resultPublicationDate,
      examinationYear: cert.examinationYear,
      session: cert.session,
      board: cert.board,
      status: cert.status,
      createdAt: cert.createdAt,
      updatedAt: cert.updatedAt
    }));
    
    res.status(200).json({
      success: true,
      message: "HSC সার্টিফিকেট তালিকা",
      data: formattedCertificates,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error("Get HSC certificate list error:", error);
    res.status(500).json({
      success: false,
      message: "HSC সার্টিফিকেট তালিকা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get single HSC certificate by ID
Userroute.get("/hsc-certificate/:id", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "অবৈধ সার্টিফিকেট আইডি"
      });
    }
    
    // Find certificate
    const certificate = await HscCertificate.findOne({
      _id: id,
      user: user._id
    });
    
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "HSC সার্টিফিকেট পাওয়া যায়নি"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "HSC ডাটা লোড সফল",
      data: certificate
    });
    
  } catch (error) {
    console.error("Get HSC certificate details error:", error);
    res.status(500).json({
      success: false,
      message: "HSC ডাটা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get HSC certificate by receiptId
Userroute.get("/hsc-certificate/receipt/:receiptId", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { receiptId } = req.params;
    
    if (!receiptId) {
      return res.status(400).json({
        success: false,
        message: "সার্টিফিকেট আইডি প্রয়োজন"
      });
    }
    
    // Find certificate
    const certificate = await HscCertificate.findOne({
      receiptId: receiptId,
      user: user._id
    });
    
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "HSC সার্টিফিকেট পাওয়া যায়নি"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "HSC ডাটা লোড সফল",
      data: certificate
    });
    
  } catch (error) {
    console.error("Get HSC certificate by receiptId error:", error);
    res.status(500).json({
      success: false,
      message: "HSC ডাটা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// DELETE - Delete HSC certificate
Userroute.delete("/hsc-certificate/:id", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "অবৈধ সার্টিফিকেট আইডি"
      });
    }
    
    // Find and delete certificate
    const result = await HscCertificate.findOneAndDelete({
      _id: id,
      user: user._id
    });
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "HSC সার্টিফিকেট পাওয়া যায়নি"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "HSC সার্টিফিকেট সফলভাবে ডিলিট করা হয়েছে",
      data: {
        receiptId: result.receiptId,
        deletedAt: new Date()
      }
    });
    
  } catch (error) {
    console.error("Delete HSC certificate error:", error);
    res.status(500).json({
      success: false,
      message: "HSC সার্টিফিকেট ডিলিট করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get QR code data for certificate
Userroute.get("/hsc-certificate/qr-code/:receiptId", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { receiptId } = req.params;
    
    if (!receiptId) {
      return res.status(400).json({
        success: false,
        message: "সার্টিফিকেট আইডি প্রয়োজন"
      });
    }
    
    // Find certificate
    const certificate = await HscCertificate.findOne({
      receiptId: receiptId,
      user: user._id
    });
    
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "HSC সার্টিফিকেট পাওয়া যায়নি"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "QR কোড ডাটা লোড সফল",
      data: {
        qrCodeData: certificate.qrCodeData,
        verificationUrl: certificate.verificationUrl
      }
    });
    
  } catch (error) {
    console.error("Get QR code error:", error);
    res.status(500).json({
      success: false,
      message: "QR কোড ডাটা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});


// ==================== NAGORIK SONOD ROUTES ====================

// Import the model
const NagorikSonod = require("../models/NagorikSonod");

// Helper function to generate receipt ID
function generateNagorikReceiptId() {
  const prefix = 'NGS';
  const timestamp = Date.now().toString().slice(-8);
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  
  return `${prefix}${timestamp}${randomStr}`;
}

// Helper function to generate QR code data
function generateNagorikQRCodeData(certificateNo, name, fatherName, municipalityName, issueDate, verificationUrl) {
  return `নাগরিক সনদ
সনদ নং: ${certificateNo}
নাম: ${name}
পিতার নাম: ${fatherName}
পৌরসভা: ${municipalityName}
ইস্যু তারিখ: ${issueDate}

যাচাই করুন: ${verificationUrl}`;
}

// Helper function to generate certificate number
function generateCertificateNumber() {
  const randomNum = Math.floor(Math.random() * 1000000000000);
  return randomNum.toString().padStart(12, '0');
}

// POST - Save Nagorik Sonod Certificate
Userroute.post("/nagorik-sonod/save", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    
    // Validate required fields
    const requiredFields = [
      'name', 'fatherName', 'motherName', 'birthDate',
      'wardNo', 'villageArea', 'postOffice', 'postCode',
      'thana', 'upazila', 'district', 'municipalityName',
      'municipalityEmail', 'municipalityMobile', 'issueDate'
    ];
    
    for (const field of requiredFields) {
      if (!req.body[field] || req.body[field].trim() === '') {
        return res.status(400).json({
          success: false,
          message: `${field} ফিল্ডটি পূরণ করুন`
        });
      }
    }
    
    // Generate receipt ID and certificate number
    const receiptId = generateNagorikReceiptId();
    const certificateNo = req.body.certificateNo || generateCertificateNumber();
    
    // Create the full verification URL
    const verificationUrl = `https://api.xbdapi.my.id/clone-services/nagorik-sonod-clone-download/${receiptId}`;
    
    // Generate QR code data
    const qrCodeData = generateNagorikQRCodeData(
      certificateNo,
      req.body.name.trim(),
      req.body.fatherName.trim(),
      req.body.municipalityName.trim(),
      req.body.issueDate,
      verificationUrl
    );
    
    // Create new nagorik sonod document
    const nagorikSonod = new NagorikSonod({
      user: user._id,
      receiptId: receiptId,
      certificateNo: certificateNo,
      issueDate: req.body.issueDate,
      name: req.body.name.trim(),
      fatherName: req.body.fatherName.trim(),
      motherName: req.body.motherName.trim(),
      spouseName: req.body.spouseName || '',
      birthDate: req.body.birthDate,
      nidNumber: req.body.nidNumber || '',
      grandfatherName: req.body.grandfatherName || '',
      wardNo: req.body.wardNo.trim(),
      villageArea: req.body.villageArea.trim(),
      postOffice: req.body.postOffice.trim(),
      postCode: req.body.postCode.trim(),
      thana: req.body.thana.trim(),
      upazila: req.body.upazila.trim(),
      district: req.body.district.trim(),
      municipalityName: req.body.municipalityName.trim(),
      municipalityEmail: req.body.municipalityEmail.trim(),
      municipalityMobile: req.body.municipalityMobile.trim(),
      verificationUrl: verificationUrl,
      qrCodeData: qrCodeData,
      status: 'completed'
    });
    
    await nagorikSonod.save();
    
    res.status(201).json({
      success: true,
      message: "নাগরিক সনদ সফলভাবে সংরক্ষণ করা হয়েছে",
      data: {
        _id: nagorikSonod._id,
        receiptId: nagorikSonod.receiptId,
        certificateNo: nagorikSonod.certificateNo,
        name: nagorikSonod.name,
        fatherName: nagorikSonod.fatherName,
        municipalityName: nagorikSonod.municipalityName,
        issueDate: nagorikSonod.issueDate,
        verificationUrl: nagorikSonod.verificationUrl,
        qrCodeData: nagorikSonod.qrCodeData,
        createdAt: nagorikSonod.createdAt
      }
    });
    
  } catch (error) {
    console.error("Save nagorik sonod error:", error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Receipt ID already exists. Please try again."
      });
    }
    
    res.status(500).json({
      success: false,
      message: "নাগরিক সনদ সংরক্ষণ করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get all Nagorik Sonod certificates for user
Userroute.get("/nagorik-sonod/all", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Search filter
    const search = req.query.search || '';
    
    // Build query
    let query = { user: user._id };
    
    if (search) {
      query.$or = [
        { receiptId: { $regex: search, $options: 'i' } },
        { certificateNo: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { fatherName: { $regex: search, $options: 'i' } },
        { nidNumber: { $regex: search, $options: 'i' } },
        { municipalityName: { $regex: search, $options: 'i' } },
        { district: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Get total count
    const total = await NagorikSonod.countDocuments(query);
    
    // Get certificates
    const certificates = await NagorikSonod.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-qrCodeData -__v');
    
    // Format response
    const formattedCertificates = certificates.map(cert => ({
      _id: cert._id,
      receiptId: cert.receiptId,
      certificateNo: cert.certificateNo,
      name: cert.name,
      fatherName: cert.fatherName,
      birthDate: cert.birthDate,
      municipalityName: cert.municipalityName,
      district: cert.district,
      issueDate: cert.issueDate,
      status: cert.status,
      createdAt: cert.createdAt,
      updatedAt: cert.updatedAt
    }));
    
    res.status(200).json({
      success: true,
      message: "নাগরিক সনদ তালিকা",
      data: formattedCertificates,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error("Get nagorik sonod list error:", error);
    res.status(500).json({
      success: false,
      message: "নাগরিক সনদ তালিকা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get single Nagorik Sonod certificate by ID
Userroute.get("/nagorik-sonod/:id", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "অবৈধ সনদ আইডি"
      });
    }
    
    // Find certificate
    const certificate = await NagorikSonod.findOne({
      _id: id,
      user: user._id
    });
    
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "নাগরিক সনদ পাওয়া যায়নি"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "নাগরিক সনদ ডাটা লোড সফল",
      data: certificate
    });
    
  } catch (error) {
    console.error("Get nagorik sonod details error:", error);
    res.status(500).json({
      success: false,
      message: "নাগরিক সনদ ডাটা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get Nagorik Sonod certificate by receiptId
Userroute.get("/nagorik-sonod/receipt/:receiptId", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { receiptId } = req.params;
    
    if (!receiptId) {
      return res.status(400).json({
        success: false,
        message: "সনদ আইডি প্রয়োজন"
      });
    }
    
    // Find certificate
    const certificate = await NagorikSonod.findOne({
      receiptId: receiptId,
      user: user._id
    });
    
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "নাগরিক সনদ পাওয়া যায়নি"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "নাগরিক সনদ ডাটা লোড সফল",
      data: certificate
    });
    
  } catch (error) {
    console.error("Get nagorik sonod by receiptId error:", error);
    res.status(500).json({
      success: false,
      message: "নাগরিক সনদ ডাটা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// DELETE - Delete Nagorik Sonod certificate
Userroute.delete("/nagorik-sonod/:id", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "অবৈধ সনদ আইডি"
      });
    }
    
    // Find and delete certificate
    const result = await NagorikSonod.findOneAndDelete({
      _id: id,
      user: user._id
    });
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "নাগরিক সনদ পাওয়া যায়নি"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "নাগরিক সনদ সফলভাবে ডিলিট করা হয়েছে",
      data: {
        receiptId: result.receiptId,
        deletedAt: new Date()
      }
    });
    
  } catch (error) {
    console.error("Delete nagorik sonod error:", error);
    res.status(500).json({
      success: false,
      message: "নাগরিক সনদ ডিলিট করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get QR code data for certificate
Userroute.get("/nagorik-sonod/qr-code/:receiptId", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { receiptId } = req.params;
    
    if (!receiptId) {
      return res.status(400).json({
        success: false,
        message: "সনদ আইডি প্রয়োজন"
      });
    }
    
    // Find certificate
    const certificate = await NagorikSonod.findOne({
      receiptId: receiptId,
      user: user._id
    });
    
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "নাগরিক সনদ পাওয়া যায়নি"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "QR কোড ডাটা লোড সফল",
      data: {
        qrCodeData: certificate.qrCodeData,
        verificationUrl: certificate.verificationUrl
      }
    });
    
  } catch (error) {
    console.error("Get QR code error:", error);
    res.status(500).json({
      success: false,
      message: "QR কোড ডাটা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

const UttoradhikarSonod = require("../models/UttoradhikarSonod");

// Helper function to generate receipt ID
function generateUttoradhikarReceiptId() {
  const prefix = 'UTS';
  const timestamp = Date.now().toString().slice(-8);
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  
  return `${prefix}${timestamp}${randomStr}`;
}

// Helper function to generate certificate number (array of Bangla digits)
function generateCertificateNumberArray() {
  const numbers = [];
  for (let i = 0; i < 15; i++) {
    const digit = Math.floor(Math.random() * 10);
    numbers.push(digit.toString().replace(/\d/g, d => "০১২৩৪৫৬৭৮৯"[d]));
  }
  return numbers;
}

// Helper function to generate QR code data
function generateUttoradhikarQRCodeData(certificateNo, deceasedName, unionName, issueDate, verificationUrl) {
  return `উত্তরাধিকার সনদ
সনদ নং: ${certificateNo.join('')}
মৃত ব্যক্তির নাম: ${deceasedName}
ইউনিয়ন: ${unionName}
ইস্যু তারিখ: ${issueDate}

যাচাই করুন: ${verificationUrl}`;
}

// POST - Save Uttoradhikar Sonod Certificate
Userroute.post("/uttoradhikar-sonod/save", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    
    // Validate required fields
    const requiredFields = [
      'deceasedName', 'deceasedRelation', 'deceasedVillage',
      'deceasedWardNo', 'deceasedPostOffice', 'deceasedThana',
      'deceasedUpazila', 'deceasedDistrict', 'deceasedDeathDate',
      'issueDate', 'unionName', 'heirs'
    ];
    
    for (const field of requiredFields) {
      if (!req.body[field] || (Array.isArray(req.body[field]) && req.body[field].length === 0)) {
        return res.status(400).json({
          success: false,
          message: `${field} ফিল্ডটি পূরণ করুন`
        });
      }
    }
    
    // Validate heirs array
    if (!Array.isArray(req.body.heirs) || req.body.heirs.length === 0) {
      return res.status(400).json({
        success: false,
        message: "অন্তত একজন উত্তরাধিকারের তথ্য প্রয়োজন"
      });
    }
    
    // Generate receipt ID and certificate number
    const receiptId = generateUttoradhikarReceiptId();
    const certificateNo = req.body.certificateNo || generateCertificateNumberArray();
    
    // Create the full verification URL
    const verificationUrl = `https://api.xbdapi.my.id/clone-services/uttoradhikar-sonod-clone-download/${receiptId}`;
    
    // Generate QR code data
    const qrCodeData = generateUttoradhikarQRCodeData(
      certificateNo,
      req.body.deceasedName.trim(),
      req.body.unionName.trim(),
      req.body.issueDate,
      verificationUrl
    );
    
    // Create new uttoradhikar sonod document
    const uttoradhikarSonod = new UttoradhikarSonod({
      user: user._id,
      receiptId: receiptId,
      certificateNo: certificateNo,
      issueDate: req.body.issueDate,
      
      // Deceased Person Information
      deceasedName: req.body.deceasedName.trim(),
      deceasedRelation: req.body.deceasedRelation.trim(),
      deceasedFatherOrHusband: req.body.deceasedFatherOrHusband?.trim() || '',
      deceasedVillage: req.body.deceasedVillage.trim(),
      deceasedWardNo: req.body.deceasedWardNo.trim(),
      deceasedPostOffice: req.body.deceasedPostOffice.trim(),
      deceasedThana: req.body.deceasedThana.trim(),
      deceasedUpazila: req.body.deceasedUpazila.trim(),
      deceasedDistrict: req.body.deceasedDistrict.trim(),
      deceasedDeathDate: req.body.deceasedDeathDate,
      
      // Heirs Information
      heirs: req.body.heirs.map(heir => ({
        name: heir.name?.trim() || '',
        relation: heir.relation?.trim() || '',
        nidNumber: heir.nidNumber?.trim() || ''
      })),
      
      // Chairman Information
      chairmanName: req.body.chairmanName?.trim() || '',
      chairmanSignature: req.body.chairmanSignature?.trim() || '',
      
      // Union Information
      unionName: req.body.unionName.trim(),
      unionWebsite: req.body.unionWebsite?.trim() || 'https://amarnothi.com',
      unionEmail: req.body.unionEmail?.trim() || 'info@amarnothi.com',
      unionPhone: req.body.unionPhone?.trim() || '',
      
      verificationUrl: verificationUrl,
      qrCodeData: qrCodeData,
      transactionId: req.body.transactionId || null,
      status: 'completed'
    });
    
    await uttoradhikarSonod.save();
    
    res.status(201).json({
      success: true,
      message: "উত্তরাধিকার সনদ সফলভাবে সংরক্ষণ করা হয়েছে",
      data: {
        _id: uttoradhikarSonod._id,
        receiptId: uttoradhikarSonod.receiptId,
        certificateNo: uttoradhikarSonod.certificateNo,
        deceasedName: uttoradhikarSonod.deceasedName,
        unionName: uttoradhikarSonod.unionName,
        issueDate: uttoradhikarSonod.issueDate,
        verificationUrl: uttoradhikarSonod.verificationUrl,
        createdAt: uttoradhikarSonod.createdAt
      }
    });
    
  } catch (error) {
    console.error("Save uttoradhikar sonod error:", error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Receipt ID already exists. Please try again."
      });
    }
    
    res.status(500).json({
      success: false,
      message: "উত্তরাধিকার সনদ সংরক্ষণ করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get all Uttoradhikar Sonod certificates for user
Userroute.get("/uttoradhikar-sonod/all", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Search filter
    const search = req.query.search || '';
    
    // Build query
    let query = { user: user._id };
    
    if (search) {
      query.$or = [
        { receiptId: { $regex: search, $options: 'i' } },
        { deceasedName: { $regex: search, $options: 'i' } },
        { 'heirs.name': { $regex: search, $options: 'i' } },
        { unionName: { $regex: search, $options: 'i' } },
        { deceasedDistrict: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Get total count
    const total = await UttoradhikarSonod.countDocuments(query);
    
    // Get certificates
    const certificates = await UttoradhikarSonod.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-qrCodeData -__v');
    
    // Format response
    const formattedCertificates = certificates.map(cert => ({
      _id: cert._id,
      receiptId: cert.receiptId,
      certificateNo: cert.certificateNo.join(''),
      deceasedName: cert.deceasedName,
      unionName: cert.unionName,
      deceasedDistrict: cert.deceasedDistrict,
      issueDate: cert.issueDate,
      heirsCount: cert.heirs.length,
      status: cert.status,
      createdAt: cert.createdAt,
      updatedAt: cert.updatedAt
    }));
    
    res.status(200).json({
      success: true,
      message: "উত্তরাধিকার সনদ তালিকা",
      data: formattedCertificates,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error("Get uttoradhikar sonod list error:", error);
    res.status(500).json({
      success: false,
      message: "উত্তরাধিকার সনদ তালিকা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get single Uttoradhikar Sonod certificate by ID
Userroute.get("/uttoradhikar-sonod/:id", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "অবৈধ সনদ আইডি"
      });
    }
    
    // Find certificate
    const certificate = await UttoradhikarSonod.findOne({
      _id: id,
      user: user._id
    });
    
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "উত্তরাধিকার সনদ পাওয়া যায়নি"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "উত্তরাধিকার সনদ ডাটা লোড সফল",
      data: certificate
    });
    
  } catch (error) {
    console.error("Get uttoradhikar sonod details error:", error);
    res.status(500).json({
      success: false,
      message: "উত্তরাধিকার সনদ ডাটা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get Uttoradhikar Sonod certificate by receiptId
Userroute.get("/uttoradhikar-sonod/receipt/:receiptId", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { receiptId } = req.params;
    
    if (!receiptId) {
      return res.status(400).json({
        success: false,
        message: "সনদ আইডি প্রয়োজন"
      });
    }
    
    // Find certificate
    const certificate = await UttoradhikarSonod.findOne({
      receiptId: receiptId,
      user: user._id
    });
    
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "উত্তরাধিকার সনদ পাওয়া যায়নি"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "উত্তরাধিকার সনদ ডাটা লোড সফল",
      data: certificate
    });
    
  } catch (error) {
    console.error("Get uttoradhikar sonod by receiptId error:", error);
    res.status(500).json({
      success: false,
      message: "উত্তরাধিকার সনদ ডাটা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// DELETE - Delete Uttoradhikar Sonod certificate
Userroute.delete("/uttoradhikar-sonod/:id", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "অবৈধ সনদ আইডি"
      });
    }
    
    // Find and delete certificate
    const result = await UttoradhikarSonod.findOneAndDelete({
      _id: id,
      user: user._id
    });
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "উত্তরাধিকার সনদ পাওয়া যায়নি"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "উত্তরাধিকার সনদ সফলভাবে ডিলিট করা হয়েছে",
      data: {
        receiptId: result.receiptId,
        deletedAt: new Date()
      }
    });
    
  } catch (error) {
    console.error("Delete uttoradhikar sonod error:", error);
    res.status(500).json({
      success: false,
      message: "উত্তরাধিকার সনদ ডিলিট করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get QR code data for certificate
Userroute.get("/uttoradhikar-sonod/qr-code/:receiptId", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { receiptId } = req.params;
    
    if (!receiptId) {
      return res.status(400).json({
        success: false,
        message: "সনদ আইডি প্রয়োজন"
      });
    }
    
    // Find certificate
    const certificate = await UttoradhikarSonod.findOne({
      receiptId: receiptId,
      user: user._id
    });
    
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "উত্তরাধিকার সনদ পাওয়া যায়নি"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "QR কোড ডাটা লোড সফল",
      data: {
        qrCodeData: certificate.qrCodeData,
        verificationUrl: certificate.verificationUrl
      }
    });
    
  } catch (error) {
    console.error("Get QR code error:", error);
    res.status(500).json({
      success: false,
      message: "QR কোড ডাটা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});
// ==================== SIMPLE SERVICE PRICE ROUTES ====================

// Import the PriceList model
const PriceList = require("../models/PriceList");
const NidOrder = require("../models/NidOrder");

// 1. ভূমি উন্নয়ন কর (Land Development Tax)
Userroute.get("/service/price/vomi-unnoyon-kor", async (req, res) => {
  try {
    const service = await PriceList.findOne({ 
      name: "ভূমি উন্নয়ন কর" 
    });
    res.json({ price: service?.price || 0 });
  } catch (error) {
    res.json({ price: 100 });
  }
});

// 2. পুলিশ ক্রিয়ারেড়ে ক্লান (Police Clearance)
Userroute.get("/service/price/police-clearance", async (req, res) => {
  try {
    const service = await PriceList.findOne({ 
      name: "পুলিশ ক্লিয়ারেন্স ক্লোন" 
    });
    res.json({ price: service?.price || 0 });
  } catch (error) {
    res.json({ price: 100 });
  }
});

// 3. তাকামূল সাটিফিকেট ক্লান (Takmul Certificate)
Userroute.get("/service/price/takmul-certificate", async (req, res) => {
  try {
    const service = await PriceList.findOne({ 
      name: "তাকামূল সাটিফিকেট ক্লোন" 
    });
    res.json({ price: service?.price || 0 });
  } catch (error) {
    res.json({ price: 150 });
  }
});

// 4. সুরক্ষা ক্লান (Surokkha Certificate)
Userroute.get("/service/price/surokkha-certificate", async (req, res) => {
  try {
    const service = await PriceList.findOne({ 
      name: "সুরক্ষা ক্লোন" 
    });
    res.json({ price: service?.price || 0 });
  } catch (error) {
    res.json({ price: 50 });
  }
});

// 5. ছুড়ি লাইসেন্স ক্লান (Trade License)
Userroute.get("/service/price/trade-license", async (req, res) => {
  try {
    const service = await PriceList.findOne({ 
      name: "ট্রেড লাইসেন্স ক্লোন" 
    });
    res.json({ price: service?.price || 0 });
  } catch (error) {
    res.json({ price: 400 });
  }
});

// 6. রিটার্ন ক্লান (Tax Return)
Userroute.get("/service/price/tax-return", async (req, res) => {
  try {
    const service = await PriceList.findOne({ 
      name: "রিটার্ন ক্লোন" 
    });
    res.json({ price: service?.price || 0 });
  } catch (error) {
    res.json({ price: 500 });
  }
});

// 7. নাগরিক সন্দ (Nagorik Sonod)
Userroute.get("/service/price/nagorik-sonod", async (req, res) => {
  try {
    const service = await PriceList.findOne({ 
      name: "নাগরিক সনদ" 
    });
    res.json({ price: service?.price || 0 });
  } catch (error) {
    res.json({ price: 200 });
  }
});

// 8. টিন সাটিফিকেট ক্লান (TIN Certificate)
Userroute.get("/service/price/tin-certificate", async (req, res) => {
  try {
    const service = await PriceList.findOne({ 
      name: "টিন সাটিফিকেট ক্লোন" 
    });
    res.json({ price: service?.price || 0 });
  } catch (error) {
    res.json({ price: 100 });
  }
});
// 8. টিন সাটিফিকেট ক্লান (TIN Certificate)
Userroute.get("/service/price/tin-certificate-clone", async (req, res) => {
  try {
    const service = await PriceList.findOne({ 
      name: "টিন সাটিফিকেট ক্লোন" 
    });
    res.json({ price: service?.price});
  } catch (error) {
    res.json({ price: 100 });
  }
});
// 9. এসএসসি সাটিফিকেট ক্লান (SSC Certificate)
Userroute.get("/service/price/ssc-certificate", async (req, res) => {
  try {
    const service = await PriceList.findOne({ 
      name: "এসএসসি সাটিফিকেট ক্লোন" 
    });
    res.json({ price: service?.price || 0 });
  } catch (error) {
    res.json({ price: 300 });
  }
});

// 10. এইচএসসি সাটিফিকেট ক্লান (HSC Certificate)
Userroute.get("/service/price/hsc-certificate", async (req, res) => {
  try {
    const service = await PriceList.findOne({ 
      name: "এইচএসসি সাটিফিকেট ক্লোন" 
    });
    res.json({ price: service?.price || 0 });
  } catch (error) {
    res.json({ price: 200 });
  }
});
Userroute.get("/service/price/nid-make", async (req, res) => {
  try {
    const service = await PriceList.findOne({ 
      name: "এনআইডি মেক" 
    });
    res.json({ price: service?.price || 0 });
  } catch (error) {
    res.json({ price: 200 });
  }
});
Userroute.get("/service/price/nid-make2", async (req, res) => {
  try {
    const service = await PriceList.findOne({ 
      name: "এনআইডি মেক 2" 
    });
    res.json({ price: service?.price || 0 });
  } catch (error) {
    res.json({ price: 200 });
  }
});
Userroute.get("/service/price/return-tax", async (req, res) => {
  try {
    const service = await PriceList.findOne({ 
      name: "রিটার্ন ক্লোন" 
    });
    res.json({ price: service?.price || 0 });
  } catch (error) {
    res.json({ price: 300 });
  }
});
Userroute.get("/service/price/tax-acknowledgement", async (req, res) => {
  try {
    const service = await PriceList.findOne({ 
      name: "একনলেজ রিটার্ন ক্লোন" 
    });
    res.json({ price: service?.price || 0 });
  } catch (error) {
    res.json({ price: 300 });
  }
});

Userroute.get("/service/price/sign-copy-order", async (req, res) => {
  try {
    const service1 = await PriceList.findOne({ 
      name: "FORM No" 
    });
     const service2 = await PriceList.findOne({ 
      name: "NID No" 
    });
     const service3 = await PriceList.findOne({ 
      name: "Birth Number" 
    });
     const service4 = await PriceList.findOne({ 
      name: "Voter Number" 
    });
    res.json({ price1: service1?.price,price2: service2?.price,price3: service3?.price,price4: service4?.price });
  } catch (error) {
    res.json({ price: 300 });
  }
});

Userroute.get("/service/price/biometrix-order", async (req, res) => {
  try {
    const service1 = await PriceList.findOne({ 
      name: "banglalink" 
    });
     const service2 = await PriceList.findOne({ 
      name: "Robi" 
    });
     const service3 = await PriceList.findOne({ 
      name: "Birth Number" 
    });
     const service4 = await PriceList.findOne({ 
      name: "Teletalk" 
    });
       const service5 = await PriceList.findOne({ 
      name: "Airtel" 
    });
    res.json({ price1: service1?.price,price2: service2?.price,price3: service3?.price,price6:service5?.price});
  } catch (error) {
    res.json({ price: 300 });
  }
});
Userroute.get("/service/price/call-list", async (req, res) => {
  try {
    const service1 = await PriceList.findOne({ 
      name: "কল লিস্ট ৩ মাস" 
    });
     const service2 = await PriceList.findOne({ 
      name: "কল লিস্ট ৬ মাস" 
    });
    res.json({ price1: service1?.price,price2: service2?.price});
  } catch (error) {
    res.json({ price: 300 });
  }
});
Userroute.get("/service/price/passport-make", async (req, res) => {
  try {
    const service1 = await PriceList.findOne({ 
      name: "ই-পাসপোর্ট" 
    });
     const service2 = await PriceList.findOne({ 
      name: "এমআরপি পাসপোর্ট" 
    });
    res.json({ price1: service1?.price,price2: service2?.price});
  } catch (error) {
    res.json({ price: 300 });
  }
});

Userroute.get("/service/price/number-to-location", async (req, res) => {
  try {
    const service = await PriceList.findOne({ 
      name: "নাম্বার টু লোকেশন" 
    });
    res.json({ price: service?.price || 0 });
  } catch (error) {
    res.json({ price: 300 });
  }
});
Userroute.get("/service/price/imei-to-number", async (req, res) => {
  try {
    const service = await PriceList.findOne({ 
      name: "আইএমইআই টু নাম্বার" 
    });
    res.json({ price: service?.price || 0 });
  } catch (error) {
    res.json({ price: 300 });
  }
});

Userroute.get("/service/price/nid-user-to-pass", async (req, res) => {
  try {
    const service = await PriceList.findOne({ 
      name: "এনআইডি ইউজার পাস" 
    });
    res.json({ price: service?.price || 0 });
  } catch (error) {
    res.json({ price: 300 });
  }
});

Userroute.get("/service/price/new-birth-certificate", async (req, res) => {
  try {
    const service = await PriceList.findOne({ 
      name: "নতুন জন্ম নিবন্ধন" 
    });
    res.json({ price: service?.price || 0 });
  } catch (error) {
    res.json({ price: 300 });
  }
});

Userroute.get("/service/price/tin-certificate-order", async (req, res) => {
  try {
    const service = await PriceList.findOne({ 
      name: "টিন সার্টিফিকেট অর্ডার" 
    });
    res.json({ price: service?.price || 0 });
  } catch (error) {
    res.json({ price: 300 });
  }
});


Userroute.get("/service/price/zero-return-order", async (req, res) => {
  try {
    const service = await PriceList.findOne({ 
      name: "জিরো রিটার্ন অর্ডার" 
    });
    res.json({ price: service?.price || 0 });
  } catch (error) {
    res.json({ price: 300 });
  }
});

Userroute.get("/service/price/nid-to-all-number", async (req, res) => {
  try {
    const service = await PriceList.findOne({ 
      name: "এনআইডি টু অল নাম্বার" 
    });
    res.json({ price: service?.price || 0 });
  } catch (error) {
    res.json({ price: 300 });
  }
});
Userroute.get("/service/price/nameaddress-to-nid-card", async (req, res) => {
  try {
    const service = await PriceList.findOne({ 
      name: "নাম ও ঠিকানা থেকে এনআইডি" 
    });
    res.json({ price: service?.price || 0 });
  } catch (error) {
    res.json({ price: 300 });
  }
});

Userroute.get("/service/price/smart-card-order", async (req, res) => {
  try {
    const service = await PriceList.findOne({ 
      name: "স্মার্টকার্ড অর্ডার" 
    });
    res.json({ price: service?.price || 0 });
  } catch (error) {
    res.json({ price: 300 });
  }
});

Userroute.get("/service/price/nid-card-order", async (req, res) => {
  try {
    const service = await PriceList.findOne({ 
      name: "এনআইডি কার্ড অর্ডার" 
    });
    res.json({ price: service?.price || 0 });
  } catch (error) {
    res.json({ price: 300 });
  }
})

Userroute.get("/service/price/server-copy-order", async (req, res) => {
  try {
    const service = await PriceList.findOne({ 
      name: "সার্ভার কপি অর্ডার" 
    });
    res.json({ price: service?.price || 0 });
  } catch (error) {
    res.json({ price: 300 });
  }
})

Userroute.get("/service/price/birth-data", async (req, res) => {
  try {
    const service = await PriceList.findOne({ 
      name: "জন্মনিবন্ধন ডাটা" 
    });
    res.json({ price: service?.price || 0 });
  } catch (error) {
    res.json({ price: 300 });
  }
})
Userroute.get("/service/price/auto-nid-maker", async (req, res) => {
  try {
    const service = await PriceList.findOne({ 
      name: "অটো আইডি মেকার" 
    });
    res.json({ price: service?.price || 0 });
  } catch (error) {
    res.json({ price: 300 });
  }
})
// ==================== SIGN TO NID PDF EXTRACTION ROUTE (SIMPLE) ====================
const uploadPdfSimple = multer({
  storage: memoryStorage,
  limits: { 
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'));
    }
  }
});

// POST - Extract NID data from PDF (Simple version - no balance deduction)
Userroute.post("/sign-to-nid", uploadPdfSimple.single('pdf'), async (req, res) => {
  try {
    // Check if file exists
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No PDF file uploaded'
      });
    }

    console.log('Processing PDF file:', req.file.originalname, 'Size:', req.file.size);

    // Prepare form data for external API
    const formData = new FormData();
    
    // Add API key from your screenshot
    const API_KEY = '1f2e36a82f24515989736a85fa9980b1';
    formData.append('key', API_KEY);
    
    // Add PDF file as buffer
    formData.append('pdf', req.file.buffer, req.file.originalname);
    
    console.log('Sending request to external API...');
    
    // Call external API from your screenshot
    const apiResponse = await axios.post('https://xbdapi.store/SIGN-API/signtonid.php', formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 60000, // 60 seconds timeout
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    console.log('API Response status:', apiResponse.status);
    
    // Return whatever the API returns
    return res.status(200).json({
      success: true,
      message: 'PDF processed successfully',
      data: apiResponse.data
    });

  } catch (error) {
    console.error('PDF extraction error:', error.message);
    
    // Return appropriate error response
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({
        success: false,
        message: 'Request timeout. Please try again.'
      });
    }
    
    if (error.response) {
      // The external API returned an error
      return res.status(error.response.status).json({
        success: false,
        message: 'External service error',
        error: error.response.data
      });
    }
    
    // Handle network errors
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        message: 'External service is currently unavailable'
      });
    }
    
    // Handle multer errors
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 10MB'
        });
      }
    }
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// ==================== SIMPLE PDF ANALYSIS ROUTE ====================

// Configure multer for memory storage (no disk saving needed)

const uploadPdf = multer({
  storage: memoryStorage,
  limits: { 
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'));
    }
  }
});

// POST - Analyze PDF (exact replica of your PHP functionality)
Userroute.post("/analyze-pdf", uploadPdf.single('pdf'), async (req, res) => {
  try {
    // Check if file exists
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No PDF file uploaded'
      });
    }

    console.log('Processing PDF:', req.file.originalname, 'Size:', req.file.size);

    // Prepare form data for external API
    const formData = new FormData();
    
    // Add API key from your PHP code
    const API_KEY = '862d71f5a799bab4b809411d4e6d2bd';
    formData.append('key', API_KEY);
    
    // Add PDF file as buffer
    formData.append('pdf', req.file.buffer, req.file.originalname);
    
    console.log('Sending to external API...');
    
    // Call external API (same as your PHP code)
    const apiResponse = await axios.post('http://all-seba.online/api/v2/sv/analyze', formData, {
      headers: {
        ...formData.getHeaders(),
        'User-Agent': 'Mozilla/5.0' // Cloudflare Bypass
      },
      httpsAgent: new (require('https')).Agent({
        rejectUnauthorized: false // SSL verification disabled
      }),
      timeout: 60000 // 60 seconds timeout
    });

    console.log('API Response received');
    
    // Return exactly what the external API returns
    return res.json(apiResponse.data);

  } catch (error) {
    console.error('PDF analysis error:', error.message);
    
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({
        success: false,
        message: 'Request timeout'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Failed to analyze PDF',
      error: error.message
    });
  }
});
// ==================== NID ORDER ROUTES ====================

// Configure multer for file uploads
const nidStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../public/uploads/nid-orders');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const uploadNidFiles = multer({
  storage: nidStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/webp'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and image files are allowed!'));
    }
  }
});

// POST - Create NID Order (handles both file uploads and URLs)
Userroute.post("/create-nid-order", authenticateUser, uploadNidFiles.fields([
  { name: 'pdfFile', maxCount: 1 },
  { name: 'nidImage', maxCount: 1 },
  { name: 'signImage', maxCount: 1 }
]), async (req, res) => {
  try {
    const user = req.user;
    const files = req.files;
    
    console.log('Creating NID order for:', user.email);
    console.log('Files received:', files);
    console.log('Body data:', req.body);
    
    // Validate required fields
    const requiredFields = [
      'nameBangla', 'nameEnglish', 'nationalId', 'pin',
      'dateOfBirth', 'fatherName', 'motherName', 'birthPlace',
      'dateOfToday', 'address'
    ];
    
    for (const field of requiredFields) {
      if (!req.body[field] || req.body[field].toString().trim() === '') {
        return res.status(400).json({
          success: false,
          message: `${field} ফিল্ডটি পূরণ করুন`
        });
      }
    }
    
    // Check NID photo - can be file or URL
    let nidPhoto = '';
    let nidPhotoType = 'none';
    
    if (files?.nidImage && files.nidImage[0]) {
      // NID photo uploaded as file
      nidPhoto = `${base_url_from_env}/uploads/nid-orders/${files.nidImage[0].filename}`;
      nidPhotoType = 'file';
      console.log('NID photo uploaded as file:', nidPhoto);
    } else if (req.body.nidImageUrl && req.body.nidImageUrl.trim() !== '') {
      // NID photo provided as URL (from PDF extraction)
      nidPhoto = req.body.nidImageUrl.trim();
      nidPhotoType = 'url';
      console.log('NID photo provided as URL:', nidPhoto);
    } else {
      return res.status(400).json({
        success: false,
        message: "এনআইডি ছবি আপলোড করুন বা URL প্রদান করুন"
      });
    }
    
    // Check signature - optional, can be file, URL, or none
    let signature = null;
    let signatureType = 'none';
    
    if (files?.signImage && files.signImage[0]) {
      // Signature uploaded as file
      signature = `${base_url_from_env}/uploads/nid-orders/${files.signImage[0].filename}`;
      signatureType = 'file';
      console.log('Signature uploaded as file:', signature);
    } else if (req.body.signImageUrl && req.body.signImageUrl.trim() !== '') {
      // Signature provided as URL (from PDF extraction)
      signature = req.body.signImageUrl.trim();
      signatureType = 'url';
      console.log('Signature provided as URL:', signature);
    }
    
    // Handle PDF file - optional
    let pdfFile = null;
    if (files?.pdfFile && files.pdfFile[0]) {
      pdfFile = `/uploads/nid-orders/${files.pdfFile[0].filename}`;
      console.log('PDF file uploaded:', pdfFile);
    }
    
    // Get service price
    let servicePrice = 200; // Default
    try {
      const priceData = await PriceList.findOne({ name: "এনআইডি মেক" });
      if (priceData && priceData.price) {
        servicePrice = priceData.price;
      }
    } catch (priceError) {
      console.error('Error fetching price:', priceError);
    }
    
    // Check user balance
    if (user.balance < servicePrice) {
      return res.status(400).json({
        success: false,
        message: `অপর্যাপ্ত ব্যালেন্স। প্রয়োজন ${servicePrice} টাকা, আপনার ব্যালেন্স: ${user.balance} টাকা`
      });
    }
    
    // Generate receipt ID
    const receiptId = `NID-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Create NID order
    const nidOrder = new NidOrder({
      user: user._id,
      userId: user._id.toString(),
      username: user.fullname,
      userEmail: user.email,
      receiptId: receiptId,
      
      // Personal Information
      nameBangla: req.body.nameBangla.trim(),
      nameEnglish: req.body.nameEnglish.trim(),
      nationalId: req.body.nationalId.trim(),
      pin: req.body.pin.trim(),
      dateOfBirth: req.body.dateOfBirth,
      fatherName: req.body.fatherName.trim(),
      motherName: req.body.motherName.trim(),
      birthPlace: req.body.birthPlace.trim(),
      bloodGroup: req.body.bloodGroup || '',
      dateOfToday: req.body.dateOfToday,
      address: req.body.address.trim(),
      gender: req.body.gender || '',
      religion: req.body.religion || '',
      
      // File Information
      pdfFile: pdfFile,
      nidPhoto: nidPhoto,
      nidPhotoType: nidPhotoType,
      signature: signature,
      signatureType: signatureType,
      
      // Payment Information
      servicePrice: servicePrice,
      status: 'pending'
    });
    
    await nidOrder.save();
    
    // Deduct balance
    user.balance -= servicePrice;
    await user.save();
    
    // Create transaction record
    const transaction = new Transaction({
      user: user._id,
      type: 'debit',
      amount: servicePrice,
      service: 'এনআইডি কার্ড তৈরি',
      description: `এনআইডি কার্ড তৈরি - ${req.body.nameBangla}`,
      reference: receiptId,
      status: 'completed',
      balanceBefore: user.balance + servicePrice,
      balanceAfter: user.balance
    });
    await transaction.save();
    
    console.log('NID order created successfully:', receiptId);
    
    res.status(201).json({
      success: true,
      message: "এনআইডি অর্ডার সফলভাবে তৈরি হয়েছে",
      data: {
        receiptId: nidOrder.receiptId,
        orderId: nidOrder._id,
        nameBangla: nidOrder.nameBangla,
        nameEnglish: nidOrder.nameEnglish,
        nationalId: nidOrder.nationalId,
        servicePrice: nidOrder.servicePrice,
        nidPhotoType: nidOrder.nidPhotoType,
        signatureType: nidOrder.signatureType,
        hasPdfFile: !!nidOrder.pdfFile,
        status: nidOrder.status,
        createdAt: nidOrder.createdAt
      }
    });
    
  } catch (error) {
    console.error('Create NID order error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "এই রসিদ আইডি ইতিমধ্যে ব্যবহৃত হয়েছে, আবার চেষ্টা করুন"
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: "ডেটা ভ্যালিডেশন ব্যর্থ হয়েছে",
        errors: errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: "এনআইডি অর্ডার তৈরি করতে সমস্যা হয়েছে",
      error: error.message
    });
  }
});

// GET - Get all NID orders for user
Userroute.get("/nid-orders", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Search filter
    const search = req.query.search || '';
    
    // Build query
    let query = { user: user._id };
    
    if (search) {
      query.$or = [
        { receiptId: { $regex: search, $options: 'i' } },
        { nameBangla: { $regex: search, $options: 'i' } },
        { nameEnglish: { $regex: search, $options: 'i' } },
        { nationalId: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Get total count
    const total = await NidOrder.countDocuments(query);
    
    // Get orders
    const orders = await NidOrder.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Format response
    const formattedOrders = orders.map(order => ({
      _id: order._id,
      receiptId: order.receiptId,
      nameBangla: order.nameBangla,
      nameEnglish: order.nameEnglish,
      nationalId: order.nationalId,
      servicePrice: order.servicePrice,
      nidPhotoType: order.nidPhotoType,
      signatureType: order.signatureType,
      hasPdfFile: !!order.pdfFile,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }));
    
    res.status(200).json({
      success: true,
      message: "এনআইডি অর্ডার তালিকা",
      data: formattedOrders,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error("Get NID orders error:", error);
    res.status(500).json({
      success: false,
      message: "এনআইডি অর্ডার তালিকা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get single NID order by ID
Userroute.get("/nid-orders/:id", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
  
    
    // Find order
    const order = await NidOrder.findOne({
      receiptId: id,
      user: user._id
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "এনআইডি অর্ডার পাওয়া যায়নি"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "এনআইডি অর্ডার ডাটা লোড সফল",
      data: order
    });
    
  } catch (error) {
    console.error("Get NID order details error:", error);
    res.status(500).json({
      success: false,
      message: "এনআইডি অর্ডার ডাটা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// DELETE - Delete NID order
Userroute.delete("/nid-orders/:id", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "অবৈধ অর্ডার আইডি"
      });
    }
    
    // Find and delete order
    const order = await NidOrder.findOne({
      _id: id,
      user: user._id
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "এনআইডি অর্ডার পাওয়া যায়নি"
      });
    }
    
    // Check if order can be deleted (only pending orders)
    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: "শুধুমাত্র পেন্ডিং অর্ডার ডিলিট করা যাবে"
      });
    }
    
    // Delete order
    await order.deleteOne();
    
    // Refund balance
    user.balance += order.servicePrice;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: "এনআইডি অর্ডার সফলভাবে ডিলিট করা হয়েছে",
      data: {
        receiptId: order.receiptId,
        refundedAmount: order.servicePrice,
        newBalance: user.balance,
        deletedAt: new Date()
      }
    });
    
  } catch (error) {
    console.error("Delete NID order error:", error);
    res.status(500).json({
      success: false,
      message: "এনআইডি অর্ডার ডিলিট করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// PUT - Update NID order status
Userroute.put("/nid-orders/:id/status", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const { status, adminNotes } = req.body;
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "অবৈধ অর্ডার আইডি"
      });
    }
    
    // Validate status
    const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "অবৈধ স্ট্যাটাস"
      });
    }
    
    // Find and update order
    const order = await NidOrder.findOneAndUpdate(
      {
        _id: id,
        user: user._id
      },
      {
        status: status,
        adminNotes: adminNotes || order.adminNotes,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "এনআইডি অর্ডার পাওয়া যায়নি"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "এনআইডি অর্ডার স্ট্যাটাস আপডেট করা হয়েছে",
      data: {
        receiptId: order.receiptId,
        status: order.status,
        updatedAt: order.updatedAt
      }
    });
    
  } catch (error) {
    console.error("Update NID order status error:", error);
    res.status(500).json({
      success: false,
      message: "এনআইডি অর্ডার স্ট্যাটাস আপডেট করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// ==================== BDRIS (BIRTH CERTIFICATE DATA) ROUTE ====================

// POST - Get BDRIS Birth Certificate Data
Userroute.post("/bdris-data", authenticateUser, async (req, res) => {
    try {
        const user = req.user;
        const { UBRN, BirthDate, captcha } = req.body;

        // Validate required fields
        if (!UBRN || !BirthDate) {
            return res.status(400).json({
                success: false,
                message: "UBRN এবং জন্ম তারিখ প্রয়োজন"
            });
        }

        // Check user balance for this service
        const servicePrice = 10; // Set your price for this service
        if (user.balance < servicePrice) {
            return res.status(400).json({
                success: false,
                message: `অপর্যাপ্ত ব্যালেন্স। প্রয়োজন ${servicePrice} টাকা, আপনার ব্যালেন্স: ${user.balance} টাকা`
            });
        }

        console.log(`Processing BDRIS request for UBRN: ${UBRN}, Date: ${BirthDate}`);

        // =========== STEP 1: GET CAPTCHA ===========
        const formDataStep1 = new FormData();
        formDataStep1.append('key', '862d71f5a799bab4b809411d4e6d2bd');
        formDataStep1.append('UBRN', UBRN);
        formDataStep1.append('BirthDate', BirthDate);

        console.log('Step 1: Getting CAPTCHA...');

        const step1Response = await axios.post(
            'http://all-seba.online/api/v2/bdris/captcha',
            formDataStep1,
            {
                headers: {
                    ...formDataStep1.getHeaders()
                },
                httpsAgent: new (require('https')).Agent({
                    rejectUnauthorized: false
                }),
                timeout: 30000
            }
        );

        const step1Data = step1Response.data;
        console.log('Step 1 Response:', step1Data);

        if (!step1Data.success) {
            return res.status(400).json({
                success: false,
                message: "CAPTCHA লোড করতে ব্যর্থ হয়েছে",
                error: step1Data.message || 'Unknown error'
            });
        }

        const sessionId = step1Data.id;
        const captchaImg = step1Data.captchaUrl;

        console.log(`Session ID: ${sessionId}, CAPTCHA URL: ${captchaImg}`);

        // If captcha not provided in request, return captcha to frontend
        if (!captcha) {
            return res.status(200).json({
                success: true,
                message: "CAPTCHA প্রস্তুত",
                requiresCaptcha: true,
                data: {
                    sessionId: sessionId,
                    captchaUrl: captchaImg,
                    captchaBase64: step1Data.captchaBase64 || null
                }
            });
        }

        // =========== STEP 2: VERIFY DATA WITH CAPTCHA ===========
        console.log(`Step 2: Verifying with CAPTCHA: ${captcha}`);

        const formDataStep2 = new FormData();
        formDataStep2.append('key', '862d71f5a799bab4b809411d4e6d2bd');
        formDataStep2.append('req_id', sessionId);
        formDataStep2.append('captcha', captcha);

        const step2Response = await axios.post(
            'http://all-seba.online/api/v2/bdris/verify',
            formDataStep2,
            {
                headers: {
                    ...formDataStep2.getHeaders()
                },
                httpsAgent: new (require('https')).Agent({
                    rejectUnauthorized: false
                }),
                timeout: 30000
            }
        );

        const finalData = step2Response.data;
        console.log('Step 2 Response received');

        // Deduct balance since service was successful
        user.balance -= servicePrice;
        await user.save();

        // Create transaction record
        const transaction = new Transaction({
            user: user._id,
            type: 'debit',
            amount: servicePrice,
            service: 'জন্ম নিবন্ধন তথ্য (BDRIS)',
            description: `জন্ম নিবন্ধন তথ্য সংগ্রহ - UBRN: ${UBRN}`,
            reference: `BDRIS-${Date.now()}`,
            status: 'completed',
            balanceBefore: user.balance + servicePrice,
            balanceAfter: user.balance
        });
        await transaction.save();

        // Return the data from the BDRIS API
        return res.status(200).json({
            success: true,
            message: "জন্ম নিবন্ধন তথ্য সফলভাবে সংগ্রহ করা হয়েছে",
            data: finalData,
            transaction: {
                amount: servicePrice,
                balance: user.balance,
                transactionId: transaction._id
            }
        });

    } catch (error) {
        console.error("BDRIS data fetch error:", error.message);
        
        // Handle specific errors
        if (error.response) {
            // External API returned an error
            return res.status(error.response.status || 500).json({
                success: false,
                message: "বাহ্যিক সেবা থেকে ত্রুটি",
                error: error.response.data || error.message
            });
        }
        
        if (error.code === 'ECONNABORTED') {
            return res.status(504).json({
                success: false,
                message: "রিকুয়েস্ট টাইমআউট হয়েছে, আবার চেষ্টা করুন"
            });
        }
        
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            return res.status(503).json({
                success: false,
                message: "বাহ্যিক সেবা বর্তমানে অনুপলব্ধ"
            });
        }
        
        return res.status(500).json({
            success: false,
            message: "জন্ম নিবন্ধন তথ্য সংগ্রহ করতে ব্যর্থ হয়েছে",
            error: error.message
        });
    }
});

// POST - Verify BDRIS with CAPTCHA (for when captcha is provided separately)
Userroute.post("/bdris-verify", authenticateUser, async (req, res) => {
    try {
        const user = req.user;
        const { sessionId, captcha } = req.body;

        // Validate required fields
        if (!sessionId || !captcha) {
            return res.status(400).json({
                success: false,
                message: "সেশন আইডি এবং CAPTCHA প্রয়োজন"
            });
        }

        // Check user balance
        const servicePrice = 10;
        if (user.balance < servicePrice) {
            return res.status(400).json({
                success: false,
                message: `অপর্যাপ্ত ব্যালেন্স। প্রয়োজন ${servicePrice} টাকা, আপনার ব্যালেন্স: ${user.balance} টাকা`
            });
        }

        console.log(`Verifying BDRIS with Session: ${sessionId}, CAPTCHA: ${captcha}`);

        const formData = new FormData();
        formData.append('key', '862d71f5a799bab4b809411d4e6d2bd');
        formData.append('req_id', sessionId);
        formData.append('captcha', captcha);

        const response = await axios.post(
            'http://all-seba.online/api/v2/bdris/verify',
            formData,
            {
                headers: {
                    ...formData.getHeaders()
                },
                httpsAgent: new (require('https')).Agent({
                    rejectUnauthorized: false
                }),
                timeout: 30000
            }
        );
       console.log("responses",response)
        const result = response.data;

        // Deduct balance
        user.balance -= servicePrice;
        await user.save();

        // Create transaction record
        const transaction = new Transaction({
            user: user._id,
            type: 'debit',
            amount: servicePrice,
            service: 'জন্ম নিবন্ধন তথ্য (BDRIS)',
            description: 'জন্ম নিবন্ধন তথ্য যাচাইকরণ',
            reference: `BDRIS-VERIFY-${Date.now()}`,
            status: 'completed',
            balanceBefore: user.balance + servicePrice,
            balanceAfter: user.balance
        });
        await transaction.save();

        return res.status(200).json({
            success: true,
            message: "জন্ম নিবন্ধন তথ্য যাচাই সম্পন্ন হয়েছে",
            data: result,
            transaction: {
                amount: servicePrice,
                balance: user.balance,
                transactionId: transaction._id
            }
        });

    } catch (error) {
        console.error("BDRIS verify error:", error.message);
        
        if (error.response) {
            return res.status(error.response.status || 500).json({
                success: false,
                message: "যাচাইকরণ ব্যর্থ হয়েছে",
                error: error.response.data || error.message
            });
        }
        
        return res.status(500).json({
            success: false,
            message: "যাচাইকরণ প্রক্রিয়ায় ত্রুটি",
            error: error.message
        });
    }
});

// GET - Get BDRIS service price
Userroute.get("/service/price/bdris", async (req, res) => {
    try {
        const service = await PriceList.findOne({ 
            name: "জন্ম নিবন্ধন তথ্য (BDRIS)" 
        });
        res.json({ 
            success: true,
            price: service?.price || 10,
            serviceName: "জন্ম নিবন্ধন তথ্য (BDRIS)"
        });
    } catch (error) {
        res.json({ 
            success: true,
            price: 10,
            serviceName: "জন্ম নিবন্ধন তথ্য (BDRIS)"
        });
    }
});


// ==================== AUTO BIRTH CERTIFICATE ROUTES ====================

// Import the model
const AutoBirthCertificate = require("../models/AutoBirthCertificate");

// POST - Save auto birth certificate (main save endpoint)
Userroute.post("/users/birth-certificate/save", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    
    // Validate required fields
    const requiredFields = [
      'nameBangla', 'nameEnglish', 'birthRegistrationNumber', 
      'dateOfBirth', 'dateOfRegistration', 'fatherNameBangla',
      'motherNameBangla', 'birthPlaceBangla', 'permanentAddressBangla',
      'registerOfficeAddress', 'upazilaPourashavaCityCorporationZila'
    ];
    
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `দয়া করে সকল প্রয়োজনীয় তথ্য প্রদান করুন: ${missingFields.join(', ')}`
      });
    }
    
    // Generate receipt ID if not provided
    const receiptId = req.body.receiptId || generateAutoBirthReceiptId();
    
    // Generate verification key
    const verificationKey = generateVerificationKey();
    
    // Get current date for issuance if not provided
    const dateOfIssuance = req.body.dateOfIssuance || new Date().toISOString().split('T')[0];
    
    // Create new auto birth certificate document
    const autoBirthCertificate = new AutoBirthCertificate({
      user: user._id,
      receiptId: receiptId,
      verificationKey: verificationKey,
      
      // UBRN and birth date
      ubrn: req.body.ubrn || req.body.birthRegistrationNumber,
      birthDate: req.body.birthDate || req.body.dateOfBirth,
      
      // Personal Information
      nameBangla: req.body.nameBangla.trim(),
      nameEnglish: req.body.nameEnglish.trim(),
      fatherNameBangla: req.body.fatherNameBangla.trim(),
      fatherNameEnglish: req.body.fatherNameEnglish.trim(),
      fatherNationalityBangla: req.body.fatherNationalityBangla.trim(),
      fatherNationalityEnglish: req.body.fatherNationalityEnglish.trim(),
      motherNameBangla: req.body.motherNameBangla.trim(),
      motherNameEnglish: req.body.motherNameEnglish.trim(),
      motherNationalityBangla: req.body.motherNationalityBangla.trim(),
      motherNationalityEnglish: req.body.motherNationalityEnglish.trim(),
      birthPlaceBangla: req.body.birthPlaceBangla.trim(),
      birthPlaceEnglish: req.body.birthPlaceEnglish.trim(),
      gender: req.body.gender,
      
      // Birth Registration Details
      birthRegistrationNumber: req.body.birthRegistrationNumber.trim(),
      dateOfRegistration: req.body.dateOfRegistration.trim(),
      dateOfBirth: req.body.dateOfBirth.trim(),
      dateOfBirthInWords: req.body.dateOfBirthInWords?.trim() || '',
      dateOfIssuance: dateOfIssuance,
      
      // Location Details
      registerOfficeAddress: req.body.registerOfficeAddress.trim(),
      upazilaPourashavaCityCorporationZila: req.body.upazilaPourashavaCityCorporationZila.trim(),
      permanentAddressBangla: req.body.permanentAddressBangla.trim(),
      permanentAddressEnglish: req.body.permanentAddressEnglish.trim(),
      
      // Technical Details
      qrLink: req.body.qrLink?.trim(),
      leftBarcode: req.body.leftBarcode?.trim() || 
                  Math.floor(10000 + Math.random() * 90000).toString(),
      autoBarcode: req.body.autoBarcode?.trim() || 
                  Math.floor(10000 + Math.random() * 90000).toString(),
      
      // Payment & Service Details
      serviceName: req.body.serviceName || 'অটো জন্মানিবন্ধন মেক',
      servicePrice: req.body.servicePrice || req.body.price || 200,
      
      // Transaction
      transactionId: req.body.transactionId || null,
      
      // CAPTCHA Data (if available)
      sessionId: req.body.sessionId || null,
      captchaValue: req.body.captchaValue || null,
      
      // Status
      status: 'completed',
      apiResponse: req.body.apiResponse || null
    });
    
    await autoBirthCertificate.save();
    
    res.status(201).json({
      success: true,
      message: "জন্ম নিবন্ধন সনদ সফলভাবে সংরক্ষণ করা হয়েছে",
      data: {
        _id: autoBirthCertificate._id,
        receiptId: autoBirthCertificate.receiptId,
        birthRegistrationNumber: autoBirthCertificate.birthRegistrationNumber,
        nameBangla: autoBirthCertificate.nameBangla,
        nameEnglish: autoBirthCertificate.nameEnglish,
        fatherNameBangla: autoBirthCertificate.fatherNameBangla,
        motherNameBangla: autoBirthCertificate.motherNameBangla,
        dateOfBirth: autoBirthCertificate.dateOfBirth,
        servicePrice: autoBirthCertificate.servicePrice,
        serviceName: autoBirthCertificate.serviceName,
        verificationKey: autoBirthCertificate.verificationKey,
        createdAt: autoBirthCertificate.createdAt
      }
    });
    
  } catch (error) {
    console.error("Save auto birth certificate error:", error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Receipt ID already exists. Please try again."
      });
    }
    
    res.status(500).json({
      success: false,
      message: "জন্ম নিবন্ধন সনদ সংরক্ষণ করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get all auto birth certificates for user
Userroute.get("/users/birth-certificate/all", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Search filter
    const search = req.query.search || '';
    
    // Build query
    let query = { user: user._id };
    
    if (search) {
      query.$or = [
        { receiptId: { $regex: search, $options: 'i' } },
        { birthRegistrationNumber: { $regex: search, $options: 'i' } },
        { ubrn: { $regex: search, $options: 'i' } },
        { nameBangla: { $regex: search, $options: 'i' } },
        { nameEnglish: { $regex: search, $options: 'i' } },
        { fatherNameBangla: { $regex: search, $options: 'i' } },
        { fatherNameEnglish: { $regex: search, $options: 'i' } },
        { motherNameBangla: { $regex: search, $options: 'i' } },
        { motherNameEnglish: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Get total count
    const total = await AutoBirthCertificate.countDocuments(query);
    
    // Get certificates
    const certificates = await AutoBirthCertificate.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-apiResponse -verificationKey -__v');
    
    res.status(200).json({
      success: true,
      message: "অটো জন্ম নিবন্ধন সনদ তালিকা",
      data: certificates,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error("Get auto birth certificate list error:", error);
    res.status(500).json({
      success: false,
      message: "অটো জন্ম নিবন্ধন সনদ তালিকা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get single auto birth certificate by ID
Userroute.get("/users/birth-certificate/:id", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "অবৈধ সার্টিফিকেট আইডি"
      });
    }
    
    // Find certificate
    const certificate = await AutoBirthCertificate.findOne({
      _id: id,
      user: user._id
    });
    
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "অটো জন্ম নিবন্ধন সনদ পাওয়া যায়নি"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "অটো জন্ম নিবন্ধন সনদ ডাটা লোড সফল",
      data: certificate
    });
    
  } catch (error) {
    console.error("Get auto birth certificate details error:", error);
    res.status(500).json({
      success: false,
      message: "অটো জন্ম নিবন্ধন সনদ ডাটা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get auto birth certificate by receiptId
Userroute.get("/users/birth-certificate/receipt/:receiptId", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { receiptId } = req.params;
    
    if (!receiptId) {
      return res.status(400).json({
        success: false,
        message: "সার্টিফিকেট আইডি প্রয়োজন"
      });
    }
    
    // Find certificate
    const certificate = await AutoBirthCertificate.findOne({
      receiptId: receiptId,
      user: user._id
    });
    
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "অটো জন্ম নিবন্ধন সনদ পাওয়া যায়নি"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "অটো জন্ম নিবন্ধন সনদ ডাটা লোড সফল",
      data: certificate
    });
    
  } catch (error) {
    console.error("Get auto birth certificate by receiptId error:", error);
    res.status(500).json({
      success: false,
      message: "অটো জন্ম নিবন্ধন সনদ ডাটা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// DELETE - Delete auto birth certificate
Userroute.delete("/users/birth-certificate/:id", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "অবৈধ সার্টিফিকেট আইডি"
      });
    }
    
    // Find and delete certificate
    const result = await AutoBirthCertificate.findOneAndDelete({
      _id: id,
      user: user._id
    });
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "অটো জন্ম নিবন্ধন সনদ পাওয়া যায়নি"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "অটো জন্ম নিবন্ধন সনদ সফলভাবে ডিলিট করা হয়েছে",
      data: {
        receiptId: result.receiptId,
        deletedAt: new Date()
      }
    });
    
  } catch (error) {
    console.error("Delete auto birth certificate error:", error);
    res.status(500).json({
      success: false,
      message: "অটো জন্ম নিবন্ধন সনদ ডিলিট করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});


// Helper function to generate receipt ID
function generateAutoBirthReceiptId() {
  const prefix = 'ABTH';
  const timestamp = Date.now().toString().slice(-8);
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${randomStr}`;
}

// Helper function to generate verification key
function generateVerificationKey() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// ==================== SMART NID CARD ROUTES ====================

// POST - Create Smart NID Order (with auto-extraction from PDF)
Userroute.post("/smart-nid/create-order", authenticateUser, uploadNidFiles.fields([
  { name: 'pdfFile', maxCount: 1 },
  { name: 'nidImage', maxCount: 1 },
  { name: 'signImage', maxCount: 1 }
]), async (req, res) => {
  try {
    const user = req.user;
    const files = req.files;
    
    console.log('Creating Smart NID order for:', user.email);
    console.log('Files received:', files);
    console.log('Body data:', req.body);
    
    // Validate required fields
    const requiredFields = [
      'nameBangla', 'nameEnglish', 'nationalId', 'pin',
      'dateOfBirth', 'fatherName', 'motherName', 'birthPlace',
      'dateOfToday', 'address'
    ];
    
    for (const field of requiredFields) {
      if (!req.body[field] || req.body[field].toString().trim() === '') {
        return res.status(400).json({
          success: false,
          message: `${field} ফিল্ডটি পূরণ করুন`
        });
      }
    }
    
    // Check NID photo - can be file or URL
    let nidPhoto = '';
    let nidPhotoType = 'none';
    
    if (files?.nidImage && files.nidImage[0]) {
      // NID photo uploaded as file
      nidPhoto = `${base_url_from_env}/uploads/nid-orders/${files.nidImage[0].filename}`;
      nidPhotoType = 'file';
      console.log('NID photo uploaded as file:', nidPhoto);
    } else if (req.body.nidImageUrl && req.body.nidImageUrl.trim() !== '') {
      // NID photo provided as URL (from PDF extraction)
      nidPhoto = req.body.nidImageUrl.trim();
      nidPhotoType = 'url';
      console.log('NID photo provided as URL:', nidPhoto);
    } else {
      return res.status(400).json({
        success: false,
        message: "এনআইডি ছবি আপলোড করুন বা URL প্রদান করুন"
      });
    }
    
    // Check signature - optional, can be file, URL, or none
    let signature = null;
    let signatureType = 'none';
    
    if (files?.signImage && files.signImage[0]) {
      // Signature uploaded as file
      signature = `${base_url_from_env}/uploads/nid-orders/${files.signImage[0].filename}`;
      signatureType = 'file';
      console.log('Signature uploaded as file:', signature);
    } else if (req.body.signImageUrl && req.body.signImageUrl.trim() !== '') {
      // Signature provided as URL (from PDF extraction)
      signature = req.body.signImageUrl.trim();
      signatureType = 'url';
      console.log('Signature provided as URL:', signature);
    }
    
    // Handle PDF file - optional
    let pdfFile = null;
    if (files?.pdfFile && files.pdfFile[0]) {
      pdfFile = `/uploads/nid-orders/${files.pdfFile[0].filename}`;
      console.log('PDF file uploaded:', pdfFile);
    }
    
    // Get service price for Smart NID
    let servicePrice = 200; // Default
    try {
      const priceData = await PriceList.findOne({ name: "স্মার্ট এনআইডি কার্ড" });
      if (priceData && priceData.price) {
        servicePrice = priceData.price;
      }
    } catch (priceError) {
      console.error('Error fetching price:', priceError);
    }
    
    // Check user balance
    if (user.balance < servicePrice) {
      return res.status(400).json({
        success: false,
        message: `অপর্যাপ্ত ব্যালেন্স। প্রয়োজন ${servicePrice} টাকা, আপনার ব্যালেন্স: ${user.balance} টাকা`
      });
    }
     const convertBanglaDateToEnglish = (banglaDate) => {
      // Check if it's already in English format (from date picker)
      if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(banglaDate)) {
        const [day, month, year] = banglaDate.split('-');
        const date = new Date(`${year}-${month}-${day}`);
        return date.toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        }).replace(',', '');
      }
      
      // Convert Bangla digits to English
      const banglaToEnglishDigits = {
        '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
        '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
      };
      
      let englishDate = '';
      for (let char of banglaDate) {
        englishDate += banglaToEnglishDigits[char] || char;
      }
      
      // Parse the date (assuming format DD-MM-YYYY)
      const [day, month, year] = englishDate.split('-');
      const date = new Date(`${year}-${month}-${day}`);
      
      // Format to "26 May 2024"
      return date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }).replace(',', '');
    };

    // Generate receipt ID for Smart NID
    const receiptId = `SMART-NID-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Create Smart NID order using existing NidOrder model
    const smartNidOrder = new SmartNid({
      user: user._id,
      userId: user._id.toString(),
      username: user.fullname,
      userEmail: user.email,
      receiptId: receiptId,
      
      // Personal Information
      nameBangla: req.body.nameBangla.trim(),
      nameEnglish: req.body.nameEnglish.trim(),
      nationalId: req.body.nationalId.trim(),
      pin: req.body.pin.trim(),
      dateOfBirth: req.body.dateOfBirth,
      fatherName: req.body.fatherName.trim(),
      motherName: req.body.motherName.trim(),
      birthPlace: req.body.birthPlace.trim(),
      bloodGroup: req.body.bloodGroup || '',
      dateOfToday: convertBanglaDateToEnglish(req.body.dateOfToday), // Convert here
      address: req.body.address.trim(),
      gender: req.body.gender || '',
      religion: req.body.religion || '',
      
      // File Information
      pdfFile: pdfFile,
      nidPhoto: nidPhoto,
      nidPhotoType: nidPhotoType,
      signature: signature,
      signatureType: signatureType,
      
      // Payment Information
      servicePrice: servicePrice,
      status: 'pending'
    });
    
    await smartNidOrder.save();
    
    // Deduct balance
    user.balance -= servicePrice;
    await user.save();
    
    // Create transaction record
    const transaction = new Transaction({
      user: user._id,
      type: 'debit',
      amount: servicePrice,
      service: 'স্মার্ট এনআইডি কার্ড তৈরি',
      description: `স্মার্ট এনআইডি কার্ড তৈরি - ${req.body.nameBangla}`,
      reference: receiptId,
      status: 'completed',
      balanceBefore: user.balance + servicePrice,
      balanceAfter: user.balance
    });
    await transaction.save();
    
    console.log('Smart NID order created successfully:', receiptId);
    
    res.status(201).json({
      success: true,
      message: "স্মার্ট এনআইডি অর্ডার সফলভাবে তৈরি হয়েছে",
      data: {
        receiptId: smartNidOrder.receiptId,
        orderId: smartNidOrder._id,
        nameBangla: smartNidOrder.nameBangla,
        nameEnglish: smartNidOrder.nameEnglish,
        nationalId: smartNidOrder.nationalId,
        servicePrice: smartNidOrder.servicePrice,
        nidPhotoType: smartNidOrder.nidPhotoType,
        signatureType: smartNidOrder.signatureType,
        hasPdfFile: !!smartNidOrder.pdfFile,
        status: smartNidOrder.status,
        createdAt: smartNidOrder.createdAt
      }
    });
    
  } catch (error) {
    console.error('Create Smart NID order error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "এই রসিদ আইডি ইতিমধ্যে ব্যবহৃত হয়েছে, আবার চেষ্টা করুন"
      });
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: "ডেটা ভ্যালিডেশন ব্যর্থ হয়েছে",
        errors: errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: "স্মার্ট এনআইডি অর্ডার তৈরি করতে সমস্যা হয়েছে",
      error: error.message
    });
  }
});

// GET - Get all Smart NID orders for user
Userroute.get("/smart-nid/orders", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Search filter
    const search = req.query.search || '';
    
    // Build query for Smart NID (receiptId starts with SMART-NID)
    let query = { 
      user: user._id,
      receiptId: /^SMART-NID-/ // Only Smart NID orders
    };
    
    if (search) {
      query.$or = [
        { receiptId: { $regex: search, $options: 'i' } },
        { nameBangla: { $regex: search, $options: 'i' } },
        { nameEnglish: { $regex: search, $options: 'i' } },
        { nationalId: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Get total count
    const total = await SmartNid.countDocuments(query);
    
    // Get orders
    const orders = await SmartNid.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Format response
    const formattedOrders = orders.map(order => ({
      _id: order._id,
      receiptId: order.receiptId,
      nameBangla: order.nameBangla,
      nameEnglish: order.nameEnglish,
      nationalId: order.nationalId,
      servicePrice: order.servicePrice,
      nidPhotoType: order.nidPhotoType,
      signatureType: order.signatureType,
      hasPdfFile: !!order.pdfFile,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }));
    
    res.status(200).json({
      success: true,
      message: "স্মার্ট এনআইডি অর্ডার তালিকা",
      data: formattedOrders,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error("Get Smart NID orders error:", error);
    res.status(500).json({
      success: false,
      message: "স্মার্ট এনআইডি অর্ডার তালিকা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get single Smart NID order by receiptId
Userroute.get("/smart-nid/order/:receiptId", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { receiptId } = req.params;
    
    if (!receiptId) {
      return res.status(400).json({
        success: false,
        message: "রসিদ আইডি প্রয়োজন"
      });
    }
    
    // Find Smart NID order
    const order = await SmartNid.findOne({
      receiptId: receiptId,
      user: user._id,
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "স্মার্ট এনআইডি অর্ডার পাওয়া যায়নি"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "স্মার্ট এনআইডি অর্ডার ডাটা লোড সফল",
      data: order
    });
    
  } catch (error) {
    console.error("Get Smart NID order details error:", error);
    res.status(500).json({
      success: false,
      message: "স্মার্ট এনআইডি অর্ডার ডাটা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// DELETE - Delete Smart NID order
Userroute.delete("/smart-nid/order/:id", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "অবৈধ অর্ডার আইডি"
      });
    }
    
    // Find and delete order (must be Smart NID and belong to user)
    const order = await SmartNid.findOne({
      _id: id,
      user: user._id,
      receiptId: /^SMART-NID-/ // Must be a Smart NID order
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "স্মার্ট এনআইডি অর্ডার পাওয়া যায়নি"
      });
    }
    
    // Check if order can be deleted (only pending orders)
    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: "শুধুমাত্র পেন্ডিং অর্ডার ডিলিট করা যাবে"
      });
    }
    
    // Delete order
    await order.deleteOne();
    
    // Refund balance
    user.balance += order.servicePrice;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: "স্মার্ট এনআইডি অর্ডার সফলভাবে ডিলিট করা হয়েছে",
      data: {
        receiptId: order.receiptId,
        refundedAmount: order.servicePrice,
        newBalance: user.balance,
        deletedAt: new Date()
      }
    });
    
  } catch (error) {
    console.error("Delete Smart NID order error:", error);
    res.status(500).json({
      success: false,
      message: "স্মার্ট এনআইডি অর্ডার ডিলিট করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get Smart NID service price
Userroute.get("/service/price/smart-nid", async (req, res) => {
  try {
    const service = await PriceList.findOne({ 
      name: "স্মার্ট কার্ড PDF মেক" 
    });
    res.json({ 
      success: true,
      price: service?.price || 200,
      serviceName: "স্মার্ট কার্ড PDF মেক"
    });
  } catch (error) {
    res.json({ 
      success: true,
      price: 200,
      serviceName: "স্মার্ট এনআইডি কার্ড"
    });
  }
});
// GET - Get Smart NID service price
Userroute.get("/service/price/death-certificate", async (req, res) => {
  try {
    const service = await PriceList.findOne({ 
      name: "মৃত্যনিবন্ধন" 
    });
    res.json({ 
      success: true,
      price: service?.price || 200,
      serviceName: "মৃত্যনিবন্ধন"
    });
  } catch (error) {
    res.json({ 
      success: true,
      price: 200,
      serviceName: "মৃত্যনিবন্ধন"
    });
  }
});

Userroute.get("/service/price/uttoradhikar-sonod", async (req, res) => {
  try {
    const service = await PriceList.findOne({ 
      name: "উত্তরাধিকার সনদ" 
    });
    res.json({ 
      success: true,
      price: service?.price || 0,
      serviceName: "উত্তরাধিকার সনদ"
    });
  } catch (error) {
    res.json({ 
      success: true,
      price: 0,
      serviceName: "উত্তরাধিকার সনদ"
    });
  }
});

Userroute.get("/service/price/birth-certificate", async (req, res) => {
  try {
    const service = await PriceList.findOne({ 
      name: "ম্যানুয়ালি জন্মানিবন্ধন মেক" 
    });
    res.json({ 
      success: true,
      price: service?.price || 0,
      serviceName: "ম্যানুয়ালি জন্মানিবন্ধন মেক"
    });
  } catch (error) {
    res.json({ 
      success: true,
      price: 0,
      serviceName: "ম্যানুয়ালি জন্মানিবন্ধন মেক"
    });
  }
});
Userroute.get("/service/price/auto-birth-certificate", async (req, res) => {
  try {
    const service = await PriceList.findOne({ 
      name: "অটো জন্মানিবন্ধন মেক" 
    });
    res.json({ 
      success: true,
      price: service?.price || 0,
      serviceName: "অটো জন্মানিবন্ধন মেক"
    });
  } catch (error) {
    res.json({ 
      success: true,
      price: 0,
      serviceName: "অটো জন্মানিবন্ধন মেক"
    });
  }
});
Userroute.get("/service/price/manual-birth-certificate", async (req, res) => {
  try {
    const service = await PriceList.findOne({ 
      name: "ম্যানুয়ালি জন্মানিবন্ধন মেক" 
    });
    res.json({ 
      success: true,
      price: service?.price || 0,
      serviceName: "ম্যানুয়ালি জন্মানিবন্ধন মেক"
    });
  } catch (error) {
    res.json({ 
      success: true,
      price: 0,
      serviceName: "ম্যানুয়ালি জন্মানিবন্ধন মেক"
    });
  }
});
Userroute.get("/service/price/server-copy-unofficial", async (req, res) => {
  try {
    const service = await PriceList.findOne({ 
      name: "সার্ভার কপি Unofficial" 
    });
    res.json({ 
      success: true,
      price: service?.price || 0,
      serviceName: "সার্ভার কপি Unofficial"
    });
  } catch (error) {
    res.json({ 
      success: true,
      price: 0,
      serviceName: "সার্ভার কপি Unofficial"
    });
  }
});
Userroute.get("/service/price/server-copy", async (req, res) => {
  try {
    const service = await PriceList.findOne({ 
      name: "সাইন টু সার্ভার কপি" 
    });
    res.json({ 
      success: true,
      price: service?.price || 0,
      serviceName: "সাইন টু সার্ভার কপি"
    });
  } catch (error) {
    res.json({ 
      success: true,
      price: 0,
      serviceName: "সাইন টু সার্ভার কপি"
    });
  }
});
// ==================== DEATH CERTIFICATE ROUTES ====================

const DeathCertificate = require("../models/DeathCertificate");

// Helper function to generate death certificate receipt ID
function generateDeathReceiptId() {
  const prefix = 'DTH';
  const timestamp = Date.now().toString().slice(-8);
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${randomStr}`;
}

// Helper function to generate death registration number (17 digits)
function generateDeathRegistrationNumber() {
  const year = new Date().getFullYear().toString().slice(-2);
  const randomDigits = Math.floor(Math.random() * 1000000000000000).toString().padStart(15, '0');
  return `${year}${randomDigits}`.slice(0, 17);
}

// Helper function to convert date to English words
function dateToEnglishWords(dateString) {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const day = date.getDate();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();
  
  const dayNames = [
    "First", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh", "Eighth", "Ninth", "Tenth",
    "Eleventh", "Twelfth", "Thirteenth", "Fourteenth", "Fifteenth", "Sixteenth", "Seventeenth",
    "Eighteenth", "Nineteenth", "Twentieth", "Twenty First", "Twenty Second", "Twenty Third",
    "Twenty Fourth", "Twenty Fifth", "Twenty Sixth", "Twenty Seventh", "Twenty Eighth",
    "Twenty Ninth", "Thirtieth", "Thirty First"
  ];
  
  const dayInWords = dayNames[day - 1];
  const yearInWords = numberToEnglishWords(year);
  
  return `${dayInWords} of ${month} ${yearInWords}`;
}

// Helper function to convert date to Bangla words
function dateToBanglaWords(dateString) {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const day = date.getDate();
  const monthNames = [
    "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
    "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
  ];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();
  
  const dayNames = [
    "প্রথম", "দ্বিতীয়", "তৃতীয়", "চতুর্থ", "পঞ্চম", "ষষ্ঠ", "সপ্তম", "অষ্টম", "নবম", "দশম",
    "একাদশ", "দ্বাদশ", "ত্রয়োদশ", "চতুর্দশ", "পঞ্চদশ", "ষোড়শ", "সপ্তদশ",
    "অষ্টাদশ", "ঊনবিংশ", "বিংশ", "একবিংশ", "বাইশ", "তেইশ",
    "চব্বিশ", "পঁচিশ", "ছাব্বিশ", "সাতাশ", "আটাশ",
    "ঊনত্রিশ", "ত্রিশ", "একত্রিশ"
  ];
  
  const dayInWords = dayNames[day - 1];
  const yearInWords = numberToBanglaWords(year);
  
  return `${dayInWords} ${month} ${yearInWords}`;
}

// Helper function to convert number to English words
function numberToEnglishWords(num) {
  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  if (num === 0) return 'Zero';
  if (num < 10) return units[num];
  if (num < 20) return teens[num - 10];
  if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + units[num % 10] : '');
  
  // For years (like 2025)
  if (num < 10000) {
    const thousands = Math.floor(num / 1000);
    const remainder = num % 1000;
    let words = units[thousands] + ' Thousand';
    if (remainder > 0) words += ' ' + numberToEnglishWords(remainder);
    return words;
  }
  
  return num.toString();
}

// Helper function to convert number to Bangla words
function numberToBanglaWords(num) {
  const units = ['', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়'];
  const teens = ['দশ', 'এগারো', 'বারো', 'তেরো', 'চৌদ্দ', 'পনেরো', 'ষোল', 'সতেরো', 'আঠারো', 'উনিশ'];
  const tens = ['', '', 'বিশ', 'ত্রিশ', 'চল্লিশ', 'পঞ্চাশ', 'ষাট', 'সত্তর', 'আশি', 'নব্বই'];
  const hundreds = ['', 'একশ', 'দুইশ', 'তিনশ', 'চারশ', 'পাঁচশ', 'ছয়শ', 'সাতশ', 'আটশ', 'নয়শ'];
  
  if (num === 0) return 'শূন্য';
  if (num < 10) return units[num];
  if (num < 20) return teens[num - 10];
  if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + units[num % 10] : '');
  if (num < 1000) return hundreds[Math.floor(num / 100)] + (num % 100 !== 0 ? ' ' + numberToBanglaWords(num % 100) : '');
  
  // For years (like ২০২৫)
  if (num < 10000) {
    const thousands = Math.floor(num / 1000);
    const remainder = num % 1000;
    let words = units[thousands] + ' হাজার';
    if (remainder > 0) words += ' ' + numberToBanglaWords(remainder);
    return words;
  }
  
  return num.toString();
}

// Helper function to generate QR code data
function generateDeathQRCodeData(registrationNumber, nameEnglish, fatherNameEnglish, dateOfDeath, verificationUrl) {
  return `Death Registration Certificate
Registration No: ${registrationNumber}
Name: ${nameEnglish}
Father: ${fatherNameEnglish}
Date of Death: ${new Date(dateOfDeath).toLocaleDateString()}

Verify at: ${verificationUrl}`;
}

// POST - Save Death Certificate
Userroute.post("/death-certificate/save", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    
    // Validate required fields
    const requiredFields = [
      'name', 'fatherName', 'motherName', 'dateOfBirth',
      'sex', 'dateOfDeath', 'placeOfDeath', 'unionParishad', 
      'upazila', 'district', 'dateOfRegistration', 'dateOfIssuance',
      'causeOfDeath'
    ];
    
    for (const field of requiredFields) {
      if (field === 'name' || field === 'fatherName' || field === 'motherName' || field === 'placeOfDeath' || 
          field === 'unionParishad' || field === 'upazila' || field === 'district' || field === 'causeOfDeath') {
        if ((!req.body[field]?.english || req.body[field].english.trim() === '')) {
          return res.status(400).json({
            success: false,
            message: `${field} ফিল্ডটি ইংরেজি এবং বাংলা উভয় ভাষায় পূরণ করুন`
          });
        }
      } else if (!req.body[field] || req.body[field].toString().trim() === '') {
        return res.status(400).json({
          success: false,
          message: `${field} ফিল্ডটি পূরণ করুন`
        });
      }
    }
    
    // Generate receipt ID
    const receiptId = generateDeathReceiptId();
    
    // Generate registration number
    const deathRegistrationNumber = generateDeathRegistrationNumber();
    
    // Create the full verification URL
    const verificationUrl = `${process.env.FRONTEND_URL || 'https://api.xbdapi.my.id'}/clone-services/death-certificate-download/${receiptId}`;
    
    // Generate date of death in words
    const dateOfDeathEnglishWords = dateToEnglishWords(req.body.dateOfDeath);
    const dateOfDeathBanglaWords = dateToBanglaWords(req.body.dateOfDeath);
    
    // Generate QR code data
    const qrCodeData = generateDeathQRCodeData(
      deathRegistrationNumber,
      req.body.name.english.trim(),
      req.body.fatherName.english.trim(),
      req.body.dateOfDeath,
      verificationUrl
    );
    
    // Set dates
    const currentDate = new Date();
    const dateOfRegistration = req.body.dateOfRegistration ? new Date(req.body.dateOfRegistration) : currentDate;
    const dateOfIssuance = req.body.dateOfIssuance ? new Date(req.body.dateOfIssuance) : currentDate;
    const dateOfBirth = new Date(req.body.dateOfBirth);
    const dateOfDeath = new Date(req.body.dateOfDeath);
    
    // Map sex values
    const sexEnglish = req.body.sex?.english || 'Female';
    let sexBangla = 'মহিলা';
    if (sexEnglish === 'Male') sexBangla = 'পুরুষ';
    else if (sexEnglish === 'Other') sexBangla = 'অন্যান্য';
    
    // Create new death certificate document
    const deathCertificate = new DeathCertificate({
      user: user._id,
      receiptId: receiptId,
      
      // Header Information
      governmentHeader: {
        english: req.body.governmentHeader?.english || "Government of the People's Republic of Bangladesh",
        bangla: req.body.governmentHeader?.bangla || "গণপ্রজাতন্ত্রী বাংলাদেশ সরকার"
      },
      officeOfRegistrar: {
        english: req.body.officeOfRegistrar?.english || "Office of the Registrar, Birth and Death Registration",
        bangla: req.body.officeOfRegistrar?.bangla || "জন্ম ও মৃত্যু নিবন্ধন অফিস"
      },
      unionParishad: {
        english: req.body.unionParishad.english.trim(),
        bangla: req.body.unionParishad.bangla.trim()
      },
      upazila: {
        english: req.body.upazila.english.trim(),
        bangla: req.body.upazila.bangla.trim()
      },
      district: {
        english: req.body.district.english.trim(),
        bangla: req.body.district.bangla.trim()
      },
      rule: {
        english: req.body.rule?.english || "Rule 9, 10",
        bangla: req.body.rule?.bangla || "নিয়ম ৯, ১০"
      },
      
      // Certificate Title
      certificateTitle: {
        english: req.body.certificateTitle?.english || "Death Registration Certificate",
        bangla: req.body.certificateTitle?.bangla || "মৃত্যু নিবন্ধন সনদ"
      },
      
      // Registration Details
      dateOfRegistration: dateOfRegistration,
      deathRegistrationNumber: deathRegistrationNumber,
      dateOfIssuance: dateOfIssuance,
      
      // Personal Information
      name: {
        english: req.body.name.english.trim(),
        bangla: req.body.name.bangla.trim()
      },
      motherName: {
        english: req.body.motherName.english.trim(),
        bangla: req.body.motherName.bangla.trim()
      },
      personNationality: {
        english: req.body.personNationality?.english || "Bangladeshi",
        bangla: req.body.personNationality?.bangla || "বাংলাদেশি"
      },
      fatherName: {
        english: req.body.fatherName.english.trim(),
        bangla: req.body.fatherName.bangla.trim()
      },
      fatherNationality: {
        english: req.body.fatherNationality?.english || "Bangladeshi",
        bangla: req.body.fatherNationality?.bangla || "বাংলাদেশি"
      },
      placeOfDeath: {
        english: req.body.placeOfDeath.english.trim(),
        bangla: req.body.placeOfDeath.bangla.trim()
      },
      
      // Additional Information
      dateOfBirth: dateOfBirth,
      sex: {
        english: sexEnglish,
        bangla: sexBangla
      },
      dateOfDeath: dateOfDeath,
      dateOfDeathInWords: {
        english: req.body.dateOfDeathInWords?.english || dateOfDeathEnglishWords,
        bangla: req.body.dateOfDeathInWords?.bangla || dateOfDeathBanglaWords
      },
      causeOfDeath: {
        english: req.body.causeOfDeath.english.trim(),
        bangla: req.body.causeOfDeath.bangla.trim()
      },
      
      // Signature Section
      sealSignature: {
        english: req.body.sealSignature?.english || "Seal & Signature",
        bangla: req.body.sealSignature?.bangla || "সিল ও স্বাক্ষর"
      },
      assistantRegistrar: {
        english: req.body.assistantRegistrar?.english || "Assistant to Registrar",
        bangla: req.body.assistantRegistrar?.bangla || "নিবন্ধকের সহকারী"
      },
      preparationVerification: {
        english: req.body.preparationVerification?.english || "(Preparation, Verification)",
        bangla: req.body.preparationVerification?.bangla || "(প্রস্তুতি, যাচাই)"
      },
      registrar: {
        english: req.body.registrar?.english || "Registrar",
        bangla: req.body.registrar?.bangla || "নিবন্ধক"
      },
      
      // Footer Information
      generatedFrom: {
        english: req.body.generatedFrom?.english || "bdris.gov.bd",
        bangla: req.body.generatedFrom?.bangla || "bdris.gov.bd"
      },
      verificationNote: {
        english: req.body.verificationNote?.english || "This certificate is generated from bdris.gov.bd, and to verify this certificate, please scan the above QR Code & Bar Code.",
        bangla: req.body.verificationNote?.bangla || "এই সনদটি bdris.gov.bd থেকে তৈরি করা হয়েছে, এবং এই সনদটি যাচাই করতে উপরের কিউআর কোড ও বার কোড স্ক্যান করুন।"
      },
      
      // Technical Information
      verificationUrl: verificationUrl,
      qrCodeData: qrCodeData,
      barcodeData: deathRegistrationNumber,
      status: 'completed'
    });
    
    await deathCertificate.save();
    
    res.status(201).json({
      success: true,
      message: "মৃত্যু নিবন্ধন সনদ সফলভাবে সংরক্ষণ করা হয়েছে",
      data: {
        _id: deathCertificate._id,
        receiptId: deathCertificate.receiptId,
        deathRegistrationNumber: deathCertificate.deathRegistrationNumber,
        name: deathCertificate.name,
        fatherName: deathCertificate.fatherName,
        motherName: deathCertificate.motherName,
        dateOfDeath: deathCertificate.dateOfDeath,
        placeOfDeath: deathCertificate.placeOfDeath,
        verificationUrl: deathCertificate.verificationUrl,
        qrCodeData: deathCertificate.qrCodeData,
        createdAt: deathCertificate.createdAt
      }
    });
    
  } catch (error) {
    console.error("Save death certificate error:", error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Receipt ID or Registration Number already exists. Please try again."
      });
    }
    
    res.status(500).json({
      success: false,
      message: "মৃত্যু নিবন্ধন সনদ সংরক্ষণ করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get all Death Certificates for user
Userroute.get("/death-certificate/all", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Search filter
    const search = req.query.search || '';
    
    // Build query
    let query = { user: user._id };
    
    if (search) {
      query.$or = [
        { receiptId: { $regex: search, $options: 'i' } },
        { deathRegistrationNumber: { $regex: search, $options: 'i' } },
        { 'name.english': { $regex: search, $options: 'i' } },
        { 'name.bangla': { $regex: search, $options: 'i' } },
        { 'fatherName.english': { $regex: search, $options: 'i' } },
        { 'fatherName.bangla': { $regex: search, $options: 'i' } },
        { 'motherName.english': { $regex: search, $options: 'i' } },
        { 'motherName.bangla': { $regex: search, $options: 'i' } },
        { 'placeOfDeath.english': { $regex: search, $options: 'i' } },
        { 'placeOfDeath.bangla': { $regex: search, $options: 'i' } },
        { 'district.english': { $regex: search, $options: 'i' } },
        { 'district.bangla': { $regex: search, $options: 'i' } }
      ];
    }
    
    // Get total count
    const total = await DeathCertificate.countDocuments(query);
    
    // Get certificates
    const certificates = await DeathCertificate.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-qrCodeData -barcodeData -__v');
    
    // Format response
    const formattedCertificates = certificates.map(cert => ({
      _id: cert._id,
      receiptId: cert.receiptId,
      deathRegistrationNumber: cert.deathRegistrationNumber,
      name: cert.name,
      fatherName: cert.fatherName,
      motherName: cert.motherName,
      dateOfDeath: cert.dateOfDeath,
      placeOfDeath: cert.placeOfDeath,
      district: cert.district,
      unionParishad: cert.unionParishad,
      sex: cert.sex,
      causeOfDeath: cert.causeOfDeath,
      status: cert.status,
      createdAt: cert.createdAt,
      updatedAt: cert.updatedAt
    }));
    
    res.status(200).json({
      success: true,
      message: "মৃত্যু নিবন্ধন সনদ তালিকা",
      data: formattedCertificates,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error("Get death certificate list error:", error);
    res.status(500).json({
      success: false,
      message: "মৃত্যু নিবন্ধন সনদ তালিকা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get single Death Certificate by ID
Userroute.get("/death-certificate/:id", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "অবৈধ সার্টিফিকেট আইডি"
      });
    }
    
    // Find certificate
    const certificate = await DeathCertificate.findOne({
      _id: id,
      user: user._id
    });
    
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "মৃত্যু নিবন্ধন সনদ পাওয়া যায়নি"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "মৃত্যু নিবন্ধন সনদ ডাটা লোড সফল",
      data: certificate
    });
    
  } catch (error) {
    console.error("Get death certificate details error:", error);
    res.status(500).json({
      success: false,
      message: "মৃত্যু নিবন্ধন সনদ ডাটা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get Death Certificate by receiptId
Userroute.get("/death-certificate/receipt/:receiptId", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { receiptId } = req.params;
    
    if (!receiptId) {
      return res.status(400).json({
        success: false,
        message: "সার্টিফিকেট আইডি প্রয়োজন"
      });
    }
    
    // Find certificate
    const certificate = await DeathCertificate.findOne({
      receiptId: receiptId,
      user: user._id
    });
    
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "মৃত্যু নিবন্ধন সনদ পাওয়া যায়নি"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "মৃত্যু নিবন্ধন সনদ ডাটা লোড সফল",
      data: certificate
    });
    
  } catch (error) {
    console.error("Get death certificate by receiptId error:", error);
    res.status(500).json({
      success: false,
      message: "মৃত্যু নিবন্ধন সনদ ডাটা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// DELETE - Delete Death Certificate
Userroute.delete("/death-certificate/:id", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "অবৈধ সার্টিফিকেট আইডি"
      });
    }
    
    // Find and delete certificate
    const result = await DeathCertificate.findOneAndDelete({
      _id: id,
      user: user._id
    });
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "মৃত্যু নিবন্ধন সনদ পাওয়া যায়নি"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "মৃত্যু নিবন্ধন সনদ সফলভাবে ডিলিট করা হয়েছে",
      data: {
        receiptId: result.receiptId,
        deletedAt: new Date()
      }
    });
    
  } catch (error) {
    console.error("Delete death certificate error:", error);
    res.status(500).json({
      success: false,
      message: "মৃত্যু নিবন্ধন সনদ ডিলিট করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// ==================== BIRTH CERTIFICATE ROUTES ====================

// Import the model (add this at the top with other imports)
const BirthCertificate = require("../models/BirthCertificate");
const SmartNid = require("../models/SmartNidModel");

// Helper function to generate birth certificate receipt ID
function generateBirthReceiptId() {
  const prefix = 'BTH';
  const timestamp = Date.now().toString().slice(-8);
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${randomStr}`;
}

// Helper function to generate birth registration number (17 digits)
function generateBirthRegistrationNumber() {
  const year = new Date().getFullYear().toString().slice(-2);
  const randomDigits = Math.floor(Math.random() * 1000000000000000).toString().padStart(15, '0');
  return `${year}${randomDigits}`.slice(0, 17);
}

// Helper function to generate QR code data
function generateBirthQRCodeData(registrationNumber, nameEnglish, fatherNameEnglish, dateOfBirth, verificationUrl) {
  return `Birth Registration Certificate
Registration No: ${registrationNumber}
Name: ${nameEnglish}
Father: ${fatherNameEnglish}
Date of Birth: ${new Date(dateOfBirth).toLocaleDateString()}

Verify at: ${verificationUrl}`;
}

// POST - Save Birth Certificate
Userroute.post("/birth-certificate/save", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    
    // Validate required fields
    const requiredFields = [
      'name', 'fatherName', 'motherName', 'dateOfBirth',
      'placeOfBirth', 'permanentAddress', 'zoneCityCorporation', 
      'cityCorporation', 'dateOfRegistration', 'dateOfIssuance'
    ];
    
    for (const field of requiredFields) {
      if (field === 'name' || field === 'fatherName' || field === 'motherName' || 
          field === 'placeOfBirth' || field === 'permanentAddress' || field === 'zoneCityCorporation' || 
          field === 'cityCorporation') {
        
        const fieldData = req.body[field];
        if (!fieldData?.english || fieldData.english.trim() === '' || 
            !fieldData?.bangla || fieldData.bangla.trim() === '') {
          return res.status(400).json({
            success: false,
            message: `${field} ফিল্ডটি ইংরেজি এবং বাংলা উভয় ভাষায় পূরণ করুন`
          });
        }
      } else if (!req.body[field] || req.body[field].toString().trim() === '') {
        return res.status(400).json({
          success: false,
          message: `${field} ফিল্ডটি পূরণ করুন`
        });
      }
    }
    
    // Generate receipt ID
    const receiptId = generateBirthReceiptId();
    
    // Generate or use provided registration number
    const birthRegistrationNumber = req.body.birthRegistrationNumber || generateBirthRegistrationNumber();
    
    // Create the full verification URL
    const verificationUrl = `https://api.xbdapi.my.id/clone-services/birth-certificate-download/${receiptId}`;
    
    // Generate date of birth in words if not provided
    const dateOfBirth = new Date(req.body.dateOfBirth);
    const dateOfBirthInWordsEnglish = req.body.dateOfBirthInWords?.english || dateToEnglishWords(req.body.dateOfBirth);
    const dateOfBirthInWordsBangla = req.body.dateOfBirthInWords?.bangla || dateToBanglaWords(req.body.dateOfBirth);
    
    // Generate QR code data
    const qrCodeData = generateBirthQRCodeData(
      birthRegistrationNumber,
      req.body.name.english.trim(),
      req.body.fatherName.english.trim(),
      req.body.dateOfBirth,
      verificationUrl
    );
    
    // Set dates
    const currentDate = new Date();
    const dateOfRegistration = req.body.dateOfRegistration ? new Date(req.body.dateOfRegistration) : currentDate;
    const dateOfIssuance = req.body.dateOfIssuance ? new Date(req.body.dateOfIssuance) : currentDate;
    
    // Map sex values
    const sexEnglish = req.body.sex?.english || 'Female';
    let sexBangla = 'মহিলা';
    if (sexEnglish === 'Male') sexBangla = 'পুরুষ';
    else if (sexEnglish === 'Other') sexBangla = 'অন্যান্য';
    
    // Create new birth certificate document
    const birthCertificate = new BirthCertificate({
      user: user._id,
      receiptId: receiptId,
      
      // Header Information
      governmentHeader: req.body.governmentHeader || {
        english: "Government of the People's Republic of Bangladesh",
        bangla: "গণপ্রজাতন্ত্রী বাংলাদেশ সরকার"
      },
      officeOfRegistrar: req.body.officeOfRegistrar || {
        english: "Office of the Registrar, Birth and Death Registration",
        bangla: "জন্ম ও মৃত্যু নিবন্ধন অফিস"
      },
      zoneCityCorporation: {
        english: req.body.zoneCityCorporation.english.trim(),
        bangla: req.body.zoneCityCorporation.bangla.trim()
      },
      cityCorporation: {
        english: req.body.cityCorporation.english.trim(),
        bangla: req.body.cityCorporation.bangla.trim()
      },
      rule: req.body.rule || {
        english: "Rule 9, 10",
        bangla: "নিয়ম ৯, ১০"
      },
      
      // Certificate Title
      certificateTitle: req.body.certificateTitle || {
        english: "Birth Registration Certificate",
        bangla: "জন্ম নিবন্ধন সনদ"
      },
      
      // Registration Details
      dateOfRegistration: dateOfRegistration,
      birthRegistrationNumber: birthRegistrationNumber,
      dateOfIssuance: dateOfIssuance,
      
      // Personal Information
      name: {
        english: req.body.name.english.trim(),
        bangla: req.body.name.bangla.trim()
      },
      motherName: {
        english: req.body.motherName.english.trim(),
        bangla: req.body.motherName.bangla.trim()
      },
      motherNationality: req.body.motherNationality || {
        english: "Bangladeshi",
        bangla: "বাংলাদেশি"
      },
      fatherName: {
        english: req.body.fatherName.english.trim(),
        bangla: req.body.fatherName.bangla.trim()
      },
      fatherNationality: req.body.fatherNationality || {
        english: "Bangladeshi",
        bangla: "বাংলাদেশি"
      },
      placeOfBirth: {
        english: req.body.placeOfBirth.english.trim(),
        bangla: req.body.placeOfBirth.bangla.trim()
      },
      permanentAddress: {
        english: req.body.permanentAddress.english.trim(),
        bangla: req.body.permanentAddress.bangla.trim()
      },
      
      // Additional Information
      dateOfBirth: dateOfBirth,
      sex: {
        english: sexEnglish,
        bangla: sexBangla
      },
      dateOfBirthInWords: {
        english: dateOfBirthInWordsEnglish,
        bangla: dateOfBirthInWordsBangla
      },
      
      // Signature Section
      sealSignature: req.body.sealSignature || {
        english: "Seal & Signature",
        bangla: "সিল ও স্বাক্ষর"
      },
      assistantRegistrar: req.body.assistantRegistrar || {
        english: "Assistant to Registrar",
        bangla: "নিবন্ধকের সহকারী"
      },
      preparationVerification: req.body.preparationVerification || {
        english: "(Preparation, Verification)",
        bangla: "(প্রস্তুতি, যাচাই)"
      },
      
      // Footer Information
      generatedFrom: req.body.generatedFrom || {
        english: "bdris.gov.bd",
        bangla: "bdris.gov.bd"
      },
      verificationNote: req.body.verificationNote || {
        english: "This certificate is generated from bdris.gov.bd, and to verify this certificate, please scan the above QR Code & Bar Code.",
        bangla: "এই সনদটি bdris.gov.bd থেকে তৈরি করা হয়েছে, এবং এই সনদটি যাচাই করতে উপরের কিউআর কোড ও বার কোড স্ক্যান করুন।"
      },
      
      // Technical Information
      verificationUrl: verificationUrl,
      qrCodeData: qrCodeData,
      barcodeData: birthRegistrationNumber,
      transactionId: req.body.transactionId || null,
      status: 'completed'
    });
    
    await birthCertificate.save();
    
    res.status(201).json({
      success: true,
      message: "জন্ম নিবন্ধন সনদ সফলভাবে সংরক্ষণ করা হয়েছে",
      data: {
        _id: birthCertificate._id,
        receiptId: birthCertificate.receiptId,
        birthRegistrationNumber: birthCertificate.birthRegistrationNumber,
        name: birthCertificate.name,
        fatherName: birthCertificate.fatherName,
        motherName: birthCertificate.motherName,
        dateOfBirth: birthCertificate.dateOfBirth,
        placeOfBirth: birthCertificate.placeOfBirth,
        verificationUrl: birthCertificate.verificationUrl,
        qrCodeData: birthCertificate.qrCodeData,
        createdAt: birthCertificate.createdAt
      }
    });
    
  } catch (error) {
    console.error("Save birth certificate error:", error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Receipt ID or Registration Number already exists. Please try again."
      });
    }
    
    res.status(500).json({
      success: false,
      message: "জন্ম নিবন্ধন সনদ সংরক্ষণ করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get all Birth Certificates for user
Userroute.get("/birth-certificate/all", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Search filter
    const search = req.query.search || '';
    
    // Build query
    let query = { user: user._id };
    
    if (search) {
      query.$or = [
        { receiptId: { $regex: search, $options: 'i' } },
        { birthRegistrationNumber: { $regex: search, $options: 'i' } },
        { 'name.english': { $regex: search, $options: 'i' } },
        { 'name.bangla': { $regex: search, $options: 'i' } },
        { 'fatherName.english': { $regex: search, $options: 'i' } },
        { 'fatherName.bangla': { $regex: search, $options: 'i' } },
        { 'motherName.english': { $regex: search, $options: 'i' } },
        { 'motherName.bangla': { $regex: search, $options: 'i' } },
        { 'placeOfBirth.english': { $regex: search, $options: 'i' } },
        { 'placeOfBirth.bangla': { $regex: search, $options: 'i' } },
        { 'cityCorporation.english': { $regex: search, $options: 'i' } },
        { 'cityCorporation.bangla': { $regex: search, $options: 'i' } }
      ];
    }
    
    // Get total count
    const total = await BirthCertificate.countDocuments(query);
    
    // Get certificates
    const certificates = await BirthCertificate.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-qrCodeData -barcodeData -__v');
    
    // Format response
    const formattedCertificates = certificates.map(cert => ({
      _id: cert._id,
      receiptId: cert.receiptId,
      birthRegistrationNumber: cert.birthRegistrationNumber,
      name: cert.name,
      fatherName: cert.fatherName,
      motherName: cert.motherName,
      dateOfBirth: cert.dateOfBirth,
      placeOfBirth: cert.placeOfBirth,
      cityCorporation: cert.cityCorporation,
      sex: cert.sex,
      status: cert.status,
      createdAt: cert.createdAt,
      updatedAt: cert.updatedAt
    }));
    
    res.status(200).json({
      success: true,
      message: "জন্ম নিবন্ধন সনদ তালিকা",
      data: formattedCertificates,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error("Get birth certificate list error:", error);
    res.status(500).json({
      success: false,
      message: "জন্ম নিবন্ধন সনদ তালিকা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get single Birth Certificate by ID
Userroute.get("/birth-certificate/:id", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "অবৈধ সার্টিফিকেট আইডি"
      });
    }
    
    // Find certificate
    const certificate = await BirthCertificate.findOne({
      _id: id,
      user: user._id
    });
    
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "জন্ম নিবন্ধন সনদ পাওয়া যায়নি"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "জন্ম নিবন্ধন সনদ ডাটা লোড সফল",
      data: certificate
    });
    
  } catch (error) {
    console.error("Get birth certificate details error:", error);
    res.status(500).json({
      success: false,
      message: "জন্ম নিবন্ধন সনদ ডাটা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get Birth Certificate by receiptId
Userroute.get("/birth-certificate/receipt/:receiptId", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { receiptId } = req.params;
    
    if (!receiptId) {
      return res.status(400).json({
        success: false,
        message: "সার্টিফিকেট আইডি প্রয়োজন"
      });
    }
    
    // Find certificate
    const certificate = await BirthCertificate.findOne({
      receiptId: receiptId,
      user: user._id
    });
    
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "জন্ম নিবন্ধন সনদ পাওয়া যায়নি"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "জন্ম নিবন্ধন সনদ ডাটা লোড সফল",
      data: certificate
    });
    
  } catch (error) {
    console.error("Get birth certificate by receiptId error:", error);
    res.status(500).json({
      success: false,
      message: "জন্ম নিবন্ধন সনদ ডাটা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// DELETE - Delete Birth Certificate
Userroute.delete("/birth-certificate/:id", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "অবৈধ সার্টিফিকেট আইডি"
      });
    }
    
    // Find and delete certificate
    const result = await BirthCertificate.findOneAndDelete({
      _id: id,
      user: user._id
    });
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "জন্ম নিবন্ধন সনদ পাওয়া যায়নি"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "জন্ম নিবন্ধন সনদ সফলভাবে ডিলিট করা হয়েছে",
      data: {
        receiptId: result.receiptId,
        deletedAt: new Date()
      }
    });
    
  } catch (error) {
    console.error("Delete birth certificate error:", error);
    res.status(500).json({
      success: false,
      message: "জন্ম নিবন্ধন সনদ ডিলিট করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get QR code data for certificate
Userroute.get("/birth-certificate/qr-code/:receiptId", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { receiptId } = req.params;
    
    if (!receiptId) {
      return res.status(400).json({
        success: false,
        message: "সার্টিফিকেট আইডি প্রয়োজন"
      });
    }
    
    // Find certificate
    const certificate = await BirthCertificate.findOne({
      receiptId: receiptId,
      user: user._id
    });
    
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "জন্ম নিবন্ধন সনদ পাওয়া যায়নি"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "QR কোড ডাটা লোড সফল",
      data: {
        qrCodeData: certificate.qrCodeData,
        verificationUrl: certificate.verificationUrl
      }
    });
    
  } catch (error) {
    console.error("Get QR code error:", error);
    res.status(500).json({
      success: false,
      message: "QR কোড ডাটা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get birth certificate statistics
Userroute.get("/birth-certificate/statistics", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    
    // Get statistics
    const totalCertificates = await BirthCertificate.countDocuments({ user: user._id });
    
    // Count by gender
    const genderStats = await BirthCertificate.aggregate([
      { $match: { user: user._id } },
      { 
        $group: {
          _id: "$sex.english",
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get certificates by year
    const certsByYear = await BirthCertificate.aggregate([
      { $match: { user: user._id } },
      { 
        $group: {
          _id: { $year: "$createdAt" },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);
    
    res.status(200).json({
      success: true,
      message: "জন্ম নিবন্ধন সনদ পরিসংখ্যান",
      data: {
        totalCertificates,
        genderStats,
        certsByYear
      }
    });
    
  } catch (error) {
    console.error("Get birth certificate statistics error:", error);
    res.status(500).json({
      success: false,
      message: "পরিসংখ্যান লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});
// Add at the top with other imports
// ==================== BIRTH CERTIFICATE DATA ROUTE ====================

Userroute.post("/birth-certificate-data", authenticateUser, async (req, res) => {
    try {
        const user = req.user;
        const { brn, dob, captcha_code, sessionId } = req.body;
        console.log('Request body:', req.body);

        // Validate required fields
        if (!brn || !dob) {
            return res.status(400).json({
                success: false,
                message: "জন্ম নিবন্ধন নম্বর এবং জন্ম তারিখ প্রয়োজন"
            });
        }

        // Check user balance for this service
        const servicePrice = 10; // Set your price for this service
        if (user.balance < servicePrice) {
            return res.status(400).json({
                success: false,
                message: `অপর্যাপ্ত ব্যালেন্স। প্রয়োজন ${servicePrice} টাকা, আপনার ব্যালেন্স: ${user.balance} টাকা`
            });
        }

        console.log(`Processing birth certificate request for BRN: ${brn}, Date: ${dob}`);

        // If no captcha_code and no sessionId, get captcha first
        if (!captcha_code && !sessionId) {
            // =========== STEP 1: GET CAPTCHA ===========
            console.log('Step 1: Getting CAPTCHA from new API...');
            
            // Create session ID
            const generatedSessionId = `session_${Date.now()}_${brn}`;
            
            // Return CAPTCHA URL with timestamp to prevent caching
            const timestamp = Date.now();
            const captchaUrl = `https://xbdapi.my.id/birth/mn/captcha.php?t=${timestamp}`;
            
            console.log('Generated session ID:', generatedSessionId);
            console.log('CAPTCHA URL:', captchaUrl);
            
            return res.status(200).json({
                success: true,
                message: "CAPTCHA প্রস্তুত",
                requiresCaptcha: true,
                data: {
                    sessionId: generatedSessionId,
                    captchaUrl: captchaUrl,
                    captchaBase64: null
                }
            });
        }

        // If we have both captcha_code and sessionId, verify the data
        if (captcha_code && sessionId) {
            // =========== STEP 2: VERIFY DATA WITH CAPTCHA ===========
            console.log(`Step 2: Verifying with CAPTCHA: ${captcha_code}, Session ID: ${sessionId}`);
            
            // Function to convert date to MM/DD/YYYY format for PHP API
            const formatDateToMMDDYYYY = (dateStr) => {
                if (!dateStr) return '';
                
                // Remove any whitespace
                dateStr = dateStr.toString().trim();
                
                // Handle different date formats
                if (dateStr.includes('/')) {
                    // Handle DD/MM/YYYY format
                    const parts = dateStr.split('/');
                    if (parts.length === 3) {
                        const day = parts[0];
                        const month = parts[1];
                        const year = parts[2];
                        return `${month}/${day}/${year}`; // Convert to MM/DD/YYYY
                    }
                } else if (dateStr.includes('-')) {
                    // Handle DD-MM-YYYY format
                    const parts = dateStr.split('-');
                    if (parts.length === 3) {
                        // Check if it's already in YYYY-MM-DD format
                        if (parts[0].length === 4) {
                            // YYYY-MM-DD to MM/DD/YYYY
                            const year = parts[0];
                            const month = parts[1];
                            const day = parts[2];
                            return `${month}/${day}/${year}`;
                        } else {
                            // DD-MM-YYYY to MM/DD/YYYY
                            const day = parts[0];
                            const month = parts[1];
                            const year = parts[2];
                            return `${month}/${day}/${year}`;
                        }
                    }
                }
                
                // If format not recognized, return as-is
                console.warn('Date format not recognized:', dateStr);
                return dateStr;
            };
            
            // Format the date to MM/DD/YYYY for PHP API
            const formattedDob = formatDateToMMDDYYYY(dob);
            
            console.log('Original DOB:', dob, 'Formatted DOB (MM/DD/YYYY):', formattedDob);

            // Prepare data for new API
            const postData = qs.stringify({
                brn: brn,
                dob: formattedDob, // Use formatted date in MM/DD/YYYY format
                captcha_code: captcha_code
            });

            console.log('Sending to external API:', postData);

            // Call the new API endpoint
            const step2Response = await axios.post(
                'https://xbdapi.my.id/birth/mn/verify.php',
                postData,
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    },
                    timeout: 30000
                }
            );

            const apiResponse = step2Response.data;
            console.log('Step 2 Response status:', step2Response.status);
            console.log('Step 2 Response data:', apiResponse);

            // Check if API response is successful
            if (!apiResponse) {
                return res.status(400).json({
                    success: false,
                    message: "API থেকে কোন রেসপন্স পাওয়া যায়নি",
                    error: 'No response from external API'
                });
            }

            // Handle different response formats
            if (apiResponse.status === false || !apiResponse.data) {
                return res.status(400).json({
                    success: false,
                    message: apiResponse.message || "API থেকে ডেটা লোড করতে ব্যর্থ হয়েছে",
                    error: apiResponse,
                    debug: {
                        brn: brn,
                        dob: formattedDob,
                        response: apiResponse
                    }
                });
            }

            // Process the response data
            const apiData = apiResponse.data || {};
            console.log('API Data received:', apiData);

            // Helper function to convert date to YYYY-MM-DD format for frontend
            const convertToYMD = (dateStr) => {
                if (!dateStr) return '';
                
                // Handle different date formats
                if (dateStr.includes('/')) {
                    // MM/DD/YYYY or DD/MM/YYYY to YYYY-MM-DD
                    const parts = dateStr.split('/');
                    if (parts.length === 3) {
                        // Check which format it is
                        const firstPart = parseInt(parts[0]);
                        const secondPart = parseInt(parts[1]);
                        
                        if (firstPart > 12) {
                            // DD/MM/YYYY
                            const day = parts[0].padStart(2, '0');
                            const month = parts[1].padStart(2, '0');
                            const year = parts[2];
                            return `${year}-${month}-${day}`;
                        } else {
                            // MM/DD/YYYY
                            const month = parts[0].padStart(2, '0');
                            const day = parts[1].padStart(2, '0');
                            const year = parts[2];
                            return `${year}-${month}-${day}`;
                        }
                    }
                } else if (dateStr.includes('-')) {
                    // Check if it's already in YYYY-MM-DD or DD-MM-YYYY
                    const parts = dateStr.split('-');
                    if (parts.length === 3) {
                        if (parts[0].length === 4) {
                            // Already YYYY-MM-DD
                            return dateStr;
                        } else {
                            // DD-MM-YYYY to YYYY-MM-DD
                            const day = parts[0].padStart(2, '0');
                            const month = parts[1].padStart(2, '0');
                            const year = parts[2];
                            return `${year}-${month}-${day}`;
                        }
                    }
                }
                return dateStr;
            };

            // Convert date to words function
            const convertDateToWords = (dateStr) => {
                try {
                    // First convert to Date object
                    let date;
                    if (dateStr.includes('/')) {
                        const parts = dateStr.split('/');
                        if (parts.length === 3) {
                            // MM/DD/YYYY format
                            date = new Date(parts[2], parts[0] - 1, parts[1]);
                        }
                    } else if (dateStr.includes('-')) {
                        // Try parsing as ISO format
                        date = new Date(dateStr);
                    }
                    
                    if (!date || isNaN(date.getTime())) {
                        // Fallback to current date if parsing fails
                        date = new Date();
                    }
                    
                    const day = date.getDate();
                    const monthNames = [
                        "January", "February", "March", "April", "May", "June",
                        "July", "August", "September", "October", "November", "December"
                    ];
                    const month = monthNames[date.getMonth()];
                    const year = date.getFullYear();
                    
                    const dayNames = [
                        "First", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh", "Eighth", "Ninth", "Tenth",
                        "Eleventh", "Twelfth", "Thirteenth", "Fourteenth", "Fifteenth", "Sixteenth", "Seventeenth",
                        "Eighteenth", "Nineteenth", "Twentieth", "Twenty First", "Twenty Second", "Twenty Third",
                        "Twenty Fourth", "Twenty Fifth", "Twenty Sixth", "Twenty Seventh", "Twenty Eighth",
                        "Twenty Ninth", "Thirtieth", "Thirty First"
                    ];
                    
                    const dayInWords = dayNames[day - 1] || day.toString();
                    return `${dayInWords} of ${month} ${year}`;
                } catch (error) {
                    console.error('Error converting date to words:', error);
                    return dateStr;
                }
            };

            // Transform data to match your expected format
            const transformedData = {
                status: true,
                data: {
                    // Personal Information
                    nameBangla: apiData.nameBangla || apiData.name_bn || '',
                    nameEnglish: apiData.nameEnglish || apiData.name_en || '',
                    fatherNameBangla: apiData.fatherNameBangla || apiData.father_name_bn || '',
                    fatherNameEnglish: apiData.fatherNameEnglish || apiData.father_name_en || '',
                    fatherNationalityBangla: 'বাংলাদেশী',
                    fatherNationalityEnglish: 'Bangladeshi',
                    motherNameBangla: apiData.motherNameBangla || apiData.mother_name_bn || '',
                    motherNameEnglish: apiData.motherNameEnglish || apiData.mother_name_en || '',
                    motherNationalityBangla: 'বাংলাদেশী',
                    motherNationalityEnglish: 'Bangladeshi',
                    birthPlaceBangla: apiData.birthPlaceBangla || apiData.place_of_birth_bn || '',
                    birthPlaceEnglish: apiData.birthPlaceEnglish || apiData.place_of_birth_en || '',
                    
                    // Birth Registration Details
                    brn: apiData.brn || brn,
                    birthRegistrationNumber: apiData.brn || brn,
                    dateOfBirth: convertToYMD(apiData.dob) || convertToYMD(formattedDob) || convertToYMD(dob),
                    dobWords: apiData.dobWords || convertDateToWords(apiData.dob || formattedDob || dob),
                    dateOfRegistration: convertToYMD(apiData.registrationDate) || '',
                    dateOfIssuance: convertToYMD(apiData.issuanceDate) || '',
                    
                    // Location Details
                    genderEnglish: apiData.genderEnglish || apiData.gender || 'Male',
                    registerOfficeAddress: apiData.registrationOfficeAddress || apiData.office_address || '',
                    registrationOffice: apiData.registrationOffice || apiData.office_name || '',
                    
                    // QR Link (generate if not provided)
                    qrLink: apiData.qrLink || `https://bdris.gov.bd/certificate/verify?key=${apiData.brn || brn}`
                }
            };

            console.log('Transformed data:', transformedData);

            // Deduct balance since service was successful
            user.balance -= servicePrice;
            await user.save();

            // Create transaction record
            const transaction = new Transaction({
                user: user._id,
                type: 'debit',
                amount: servicePrice,
                service: 'Birth Certificate Data',
                description: `জন্ম নিবন্ধন ডেটা সংগ্রহ - BRN: ${brn}`,
                reference: `BIRTH-${Date.now()}`,
                status: 'completed',
                balanceBefore: user.balance + servicePrice,
                balanceAfter: user.balance
            });
            await transaction.save();

            return res.status(200).json({
                success: true,
                message: "জন্ম নিবন্ধন ডেটা সফলভাবে সংগ্রহ করা হয়েছে",
                data: transformedData,
                transaction: {
                    amount: servicePrice,
                    balance: user.balance,
                    transactionId: transaction._id
                }
            });
        }

        // If we have sessionId but no captcha_code, or vice versa
        return res.status(400).json({
            success: false,
            message: "সেশন আইডি এবং CAPTCHA কোড উভয়ই প্রয়োজন"
        });

    } catch (error) {
        console.error("Birth certificate data fetch error:", error.message);
        console.error("Error details:", error);
        
        // Handle specific errors
        if (error.response) {
            // External API returned an error
            console.error("External API error response:", error.response.data);
            console.error("External API error status:", error.response.status);
            
            return res.status(error.response.status || 500).json({
                success: false,
                message: "বাহ্যিক পরিষেবা ত্রুটি",
                error: error.response.data || error.message,
                debug: {
                    status: error.response.status,
                    headers: error.response.headers
                }
            });
        }
        
        if (error.code === 'ECONNABORTED') {
            return res.status(504).json({
                success: false,
                message: "অনুরোধের সময়সীমা শেষ, অনুগ্রহ করে আবার চেষ্টা করুন"
            });
        }
        
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            return res.status(503).json({
                success: false,
                message: "বাহ্যিক পরিষেবা বর্তমানে অপ্রাপ্য"
            });
        }
        
        return res.status(500).json({
            success: false,
            message: "জন্ম নিবন্ধন ডেটা সংগ্রহ করতে ব্যর্থ হয়েছে",
            error: error.message,
            stack: error.stack
        });
    }
});
// Alternative: Simple two-step route (separate endpoints) - Updated
// Alternative: Simple two-step route (separate endpoints) - Updated
Userroute.post("/birth-certificate-captcha", authenticateUser, async (req, res) => {
    try {
        const { brn, dob } = req.body;
        console.log('CAPTCHA request:', { brn, dob });

        if (!brn || !dob) {
            return res.status(400).json({
                success: false,
                message: "জন্ম নিবন্ধন নম্বর এবং জন্ম তারিখ প্রয়োজন"
            });
        }

        // Return CAPTCHA URL for new API with timestamp
        const timestamp = Date.now();
        const captchaUrl = `https://xbdapi.my.id/birth/mn/captcha.php?t=${timestamp}`;
        
        const sessionId = `session_${timestamp}_${brn}`;
        
        console.log('Generated CAPTCHA URL:', captchaUrl);
        console.log('Generated Session ID:', sessionId);
        
        res.json({
            success: true,
            requiresCaptcha: true,
            sessionId: sessionId,
            captchaUrl: captchaUrl,
            message: "CAPTCHA প্রস্তুত"
        });

    } catch (error) {
        console.error("CAPTCHA fetch error:", error.message);
        res.status(500).json({
            success: false,
            message: "CAPTCHA লোড করতে ব্যর্থ হয়েছে",
            error: error.message
        });
    }
});

Userroute.post("/birth-certificate-verify", authenticateUser, async (req, res) => {
    try {
        const user = req.user;
        const { brn, dob, captcha_code } = req.body; // Note parameter names
        
        console.log('Verify request:', { brn, dob, captcha_code });

        if (!brn || !dob || !captcha_code) {
            return res.status(400).json({
                success: false,
                message: "জন্ম নিবন্ধন নম্বর, জন্ম তারিখ এবং CAPTCHA কোড প্রয়োজন"
            });
        }

        // Check balance if you want to charge
        const servicePrice = 10;
        if (user.balance < servicePrice) {
            return res.status(400).json({
                success: false,
                message: `অপর্যাপ্ত ব্যালেন্স। প্রয়োজন ${servicePrice} টাকা`
            });
        }

        // Convert date format from YYYY-MM-DD to DD/MM/YYYY
        let formattedDob = dob;
        if (dob.includes('-')) {
            const parts = dob.split('-');
            if (parts.length === 3) {
                formattedDob = `${parts[2]}/${parts[1]}/${parts[0]}`;
            }
        }

        // Prepare data for new API
        const postData = qs.stringify({
            brn: brn,
            dob: formattedDob,
            captcha_code: captcha_code
        });

        console.log('Sending to external API:', postData);

        const response = await axios.post(
            'https://xbdapi.my.id/birth/mn/verify.php',
            postData,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                },
                timeout: 30000
            }
        );

        const apiResponse = response.data;
        console.log('External API response:', apiResponse);
        
        if (!apiResponse) {
            return res.status(400).json({
                success: false,
                message: "API থেকে কোন রেসপন্স পাওয়া যায়নি",
                error: 'No response from external API'
            });
        }

        if (apiResponse.status !== true) {
            return res.status(400).json({
                success: false,
                message: apiResponse.message || "API থেকে ডেটা লোড করতে ব্যর্থ হয়েছে",
                error: apiResponse,
                debug: {
                    brn: brn,
                    dob: formattedDob,
                    response: apiResponse
                }
            });
        }

        // Convert date back to YYYY-MM-DD format
        const convertToYMD = (dateStr) => {
            if (!dateStr) return '';
            if (dateStr.includes('/')) {
                const parts = dateStr.split('/');
                if (parts.length === 3) {
                    return `${parts[2]}-${parts[1]}-${parts[0]}`;
                }
            }
            return dateStr;
        };

        // Transform the data
        const apiData = apiResponse.data || {};
        const transformedData = {
            status: true,
            data: {
                nameBangla: apiData.nameBangla || apiData.name_bn || '',
                nameEnglish: apiData.nameEnglish || apiData.name_en || '',
                fatherNameBangla: apiData.fatherNameBangla || apiData.father_name_bn || '',
                fatherNameEnglish: apiData.fatherNameEnglish || apiData.father_name_en || '',
                motherNameBangla: apiData.motherNameBangla || apiData.mother_name_bn || '',
                motherNameEnglish: apiData.motherNameEnglish || apiData.mother_name_en || '',
                birthRegistrationNumber: apiData.brn || brn,
                dob: convertToYMD(apiData.dob) || dob,
                dobWords: apiData.dobWords || '',
                birthPlaceBangla: apiData.birthPlaceBangla || apiData.place_of_birth_bn || '',
                birthPlaceEnglish: apiData.birthPlaceEnglish || apiData.place_of_birth_en || '',
                registrationOffice: apiData.registrationOffice || apiData.office_name || '',
                registrationOfficeAddress: apiData.registrationOfficeAddress || apiData.office_address || '',
                genderEnglish: apiData.genderEnglish || apiData.gender || 'Male',
                issuanceDate: convertToYMD(apiData.issuanceDate) || '',
                registrationDate: convertToYMD(apiData.registrationDate) || ''
            }
        };

        // Deduct balance
        user.balance -= servicePrice;
        await user.save();

        // Create transaction
        const transaction = new Transaction({
            user: user._id,
            type: 'debit',
            amount: servicePrice,
            service: 'জন্ম নিবন্ধন যাচাইকরণ',
            description: 'জন্ম নিবন্ধন ডেটা যাচাইকরণ',
            reference: `BIRTH-VERIFY-${Date.now()}`,
            status: 'completed',
            balanceBefore: user.balance + servicePrice,
            balanceAfter: user.balance
        });
        await transaction.save();

        res.json({
            ...transformedData,
            transaction: {
                amount: servicePrice,
                balance: user.balance,
                transactionId: transaction._id
            }
        });

    } catch (error) {
        console.error("Verification error:", error.message);
        console.error("Error details:", error);
        
        if (error.response) {
            console.error("External API error:", error.response.data);
            return res.status(500).json({
                success: false,
                message: "CAPTCHA যাচাই করতে ব্যর্থ হয়েছে",
                error: error.response.data || error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: "CAPTCHA যাচাই করতে ব্যর্থ হয়েছে",
            error: error.message
        });
    }
});

// Helper function to convert date to words
function convertDateToWords(dateString) {
    if (!dateString) return '';
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        
        const day = date.getDate();
        const monthNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();
        
        const dayNames = [
            "First", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh", 
            "Eighth", "Ninth", "Tenth", "Eleventh", "Twelfth", "Thirteenth", 
            "Fourteenth", "Fifteenth", "Sixteenth", "Seventeenth", "Eighteenth", 
            "Nineteenth", "Twentieth", "Twenty First", "Twenty Second", 
            "Twenty Third", "Twenty Fourth", "Twenty Fifth", "Twenty Sixth", 
            "Twenty Seventh", "Twenty Eighth", "Twenty Ninth", "Thirtieth", 
            "Thirty First"
        ];
        
        const dayInWords = dayNames[day - 1] || day.toString();
        return `${dayInWords} ${month} ${year}`;
    } catch (error) {
        console.error('Error converting date to words:', error);
        return dateString;
    }
}
// GET - Get service price
Userroute.get("/service/price/birth-certificate", async (req, res) => {
    try {
        // You can fetch from PriceList or set a fixed price
        const service = await PriceList.findOne({ 
            name: "Birth Certificate Data" 
        });
        res.json({ 
            success: true,
            price: service?.price || 10,
            serviceName: "Birth Certificate Data"
        });
    } catch (error) {
        res.json({ 
            success: true,
            price: 10,
            serviceName: "Birth Certificate Data"
        });
    }
});

Userroute.get("/service/price/auto-tin-certificate", async (req, res) => {
    try {
        // You can fetch from PriceList or set a fixed price
        const service = await PriceList.findOne({ 
            name: "অটো টিন সার্টিফিকেট" 
        });
        res.json({ 
            success: true,
            price: service?.price || 10,
            serviceName: "Birth Certificate Data"
        });
    } catch (error) {
        res.json({ 
            success: true,
            price: 10,
            serviceName: "Birth Certificate Data"
        });
    }
});


// ==================== PDF ANALYSIS ROUTE (Replica of your PHP code) ====================
// ==================== NID INFORMATION CHECK ROUTE (TeamCyber71 API) ====================

Userroute.post("/check-nid-info", uploadNidPdf.single('pdf'), async (req, res) => {
  try {
    // Check if file exists
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No PDF file uploaded'
      });
    }

    console.log('Processing NID PDF for TeamCyber71 API:', req.file.originalname);

    // Prepare form data for the external API
    const externalFormData = new FormData();
    
    // Add PDF file
    externalFormData.append('pdf', req.file.buffer, req.file.originalname);
    
    // Add API credentials from your screenshot
    externalFormData.append('apiKey', 'MJ-35011f464e26');
    externalFormData.append('Key', '7392362559');
    externalFormData.append('domain', req.headers.host || req.headers.origin || 'localhost');
    
    // Add the specific API owner from your screenshot
    externalFormData.append('Api Owner', '@TeamCyber71');
    externalFormData.append('Api Name', '@userpass2238');

    console.log('Sending request to TeamCyber71 API...');

    // Call the external API - using the same endpoint as your successful one
    const apiResponse = await axios.post('https://api.autoseba.site/signtonid/index.php', externalFormData, {
      headers: {
        ...externalFormData.getHeaders(),
        'Accept': 'application/json',
        'Content-Type': 'multipart/form-data'
      },
      timeout: 60000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    console.log('API Response received:', apiResponse.status);
    console.log('API Response data:', apiResponse.data);

    // Parse the response
    let extractedData;
    try {
      extractedData = apiResponse.data;
      
      // Validate the response structure
      if (!extractedData || typeof extractedData !== 'object') {
        throw new Error('Invalid response format from API');
      }
      
      // Format response according to your screenshot
      const formattedResponse = {
        "Api Owner": "@TeamCyber71",
        "code": extractedData.code || 500,
        "success": extractedData.status || false,
        "message": extractedData.message || "NID Information Not Found",
        "Api Name": "@userpass2238",
        "Remaining Balance": 24, // You might want to make this dynamic
        "API Expiry Date": "2026-12-30"
      };
      
      // If the API was successful, add the data
      if (extractedData.code === 200 && extractedData.status) {
        formattedResponse.data = extractedData.data;
      }

      return res.status(200).json(formattedResponse);

    } catch (parseError) {
      console.error('Error parsing API response:', parseError);
      
      // Return the exact structure from your screenshot
      return res.status(200).json({
        "Api Owner": "@TeamCyber71",
        "code": 500,
        "success": false,
        "message": "NID Information Not Found",
        "Api Name": "@userpass2238",
        "Remaining Balance": 24,
        "API Expiry Date": "2026-12-30"
      });
    }

  } catch (error) {
    console.error('NID info check error:', error.message);
    
    // Return the exact structure from your screenshot on error
    return res.status(200).json({
      "Api Owner": "@TeamCyber71",
      "code": 500,
      "success": false,
      "message": "NID Information Not Found",
      "Api Name": "@userpass2238",
      "Remaining Balance": 24,
      "API Expiry Date": "2026-12-30"
    });
  }
});

// If you want a version with user authentication and balance check:

Userroute.post("/check-nid-info-auth", authenticateUser, uploadNidPdf.single('pdf'), async (req, res) => {
  let user = null;
  
  try {
    // Check if file exists
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No PDF file uploaded'
      });
    }

    // Get user from authentication middleware
    const userId = req.headers['userid'] || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User ID not provided'
      });
    }

    // Find user
    user = await User.findById(userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check balance (optional - if you want to charge for this)
    const servicePrice = 5; // 5৳ per check
    if (user.balance < servicePrice) {
      return res.status(400).json({
        "Api Owner": "@TeamCyber71",
        "code": 400,
        "success": false,
        "message": `Insufficient balance. Required ${servicePrice}৳, your balance: ${user.balance}৳`,
        "Api Name": "@userpass2238",
        "Remaining Balance": 24,
        "API Expiry Date": "2026-12-30"
      });
    }

    console.log('Processing NID PDF for TeamCyber71 API:', req.file.originalname);

    // Prepare form data for the external API
    const externalFormData = new FormData();
    
    // Add PDF file
    externalFormData.append('pdf', req.file.buffer, req.file.originalname);
    
    // Add API credentials
    externalFormData.append('apiKey', 'MJ-35011f464e26');
    externalFormData.append('Key', '7392362559');
    externalFormData.append('domain', req.headers.host || req.headers.origin || 'localhost');

    console.log('Sending request to TeamCyber71 API...');

    // Call the external API
    const apiResponse = await axios.post('https://api.autoseba.site/signtonid/index.php', externalFormData, {
      headers: {
        ...externalFormData.getHeaders(),
        'Accept': 'application/json',
        'Content-Type': 'multipart/form-data'
      },
      timeout: 60000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    console.log('API Response received:', apiResponse.status);

    // Parse the response
    let extractedData;
    try {
      extractedData = apiResponse.data;
      
      // Validate the response structure
      if (!extractedData || typeof extractedData !== 'object') {
        throw new Error('Invalid response format from API');
      }
      
      // Deduct balance if successful or not (depending on your business logic)
      if (extractedData.code === 200 && extractedData.status) {
        user.balance -= servicePrice;
        await user.save();
        
        // Create transaction record
        const transaction = new Transaction({
          userId: user._id,
          type: 'debit',
          amount: servicePrice,
          service: 'NID Info Check',
          description: 'NID information extraction from PDF',
          balanceAfter: user.balance,
          reference: `NID-CHECK-${Date.now()}`,
          status: 'completed',
          apiRequestId: extractedData.data?.requestId || null
        });
        await transaction.save();
      }
      
      // Format response according to your screenshot
      const formattedResponse = {
        "Api Owner": "@TeamCyber71",
        "code": extractedData.code || 500,
        "success": extractedData.status || false,
        "message": extractedData.message || "NID Information Not Found",
        "Api Name": "@userpass2238",
        "Remaining Balance": 24, // This could be user's remaining balance
        "API Expiry Date": "2026-12-30",
        "userBalance": user.balance // Add user's actual balance
      };
      
      // If the API was successful, add the data
      if (extractedData.code === 200 && extractedData.status) {
        formattedResponse.data = extractedData.data;
        formattedResponse.transaction = {
          amount: servicePrice,
          balance: user.balance,
          transactionId: transaction?._id
        };
      }

      return res.status(200).json(formattedResponse);

    } catch (parseError) {
      console.error('Error parsing API response:', parseError);
      
      // Return the exact structure from your screenshot
      return res.status(200).json({
        "Api Owner": "@TeamCyber71",
        "code": 500,
        "success": false,
        "message": "NID Information Not Found",
        "Api Name": "@userpass2238",
        "Remaining Balance": 24,
        "API Expiry Date": "2026-12-30",
        "userBalance": user.balance
      });
    }

  } catch (error) {
    console.error('NID info check error:', error.message);
    
    // Return the exact structure from your screenshot on error
    return res.status(200).json({
      "Api Owner": "@TeamCyber71",
      "code": 500,
      "success": false,
      "message": "NID Information Not Found",
      "Api Name": "@userpass2238",
      "Remaining Balance": 24,
      "API Expiry Date": "2026-12-30",
      "userBalance": user?.balance || 0
    });
  }
});

// GET - Get server copy service price
Userroute.get("/service/price/server-copy-nid", async (req, res) => {
  try {
    const service = await PriceList.findOne({ 
      name: "NID Server Copy" 
    });
    res.json({ 
      success: true,
      price: service?.price || 10,
      serviceName: "NID Server Copy"
    });
  } catch (error) {
    res.json({ 
      success: true,
      price: 10,
      serviceName: "NID Server Copy"
    });
  }
});

// ==================== SERVER COPY PDF ANALYSIS ROUTE ====================
// ==================== SERVER COPY PDF ANALYSIS ROUTE ====================

// Configure multer for memory storage (for direct buffer handling)
const serverCopyStorage = multer.memoryStorage();

const uploadServerCopyPdf = multer({
  storage: serverCopyStorage,
  limits: { 
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'));
    }
  }
});

// POST - Analyze PDF for Server Copy (exact replica of your PHP functionality)
Userroute.post("/server-copy/analyze-pdf", uploadServerCopyPdf.single('pdf'), async (req, res) => {
  let tempFilePath = null;
  
  try {
    // Check if file exists
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No PDF file uploaded'
      });
    }

    console.log('Processing PDF for Server Copy:', req.file.originalname, 'Size:', req.file.size);

    // Save file to temp location (similar to PHP approach)
    const tempDir = path.join(__dirname, '../temp');
    
    // Create temp directory if it doesn't exist
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Generate unique temp filename
    const tempFileName = `temp_${Date.now()}_${Math.random().toString(36).substring(2)}.pdf`;
    tempFilePath = path.join(tempDir, tempFileName);
    
    // Write buffer to file
    await fs.promises.writeFile(tempFilePath, req.file.buffer);
    
    console.log('Temporary file created:', tempFilePath);
    
    // Check if file exists and has content
    const stats = await fs.promises.stat(tempFilePath);
    if (stats.size === 0) {
      throw new Error('Uploaded file is empty (0 bytes)');
    }

    // Prepare form data for external API
    const formData = new FormData();
    
    // Add API key from your PHP code
    const API_KEY = 'cIUxUS3e49qS4FumMSIO';
    formData.append('key', API_KEY);
    
    // Add PDF file from temp path (like PHP does)
    formData.append('pdf', fs.createReadStream(tempFilePath), {
      filename: req.file.originalname,
      contentType: 'application/pdf'
    });
    
    console.log('Sending to Server Copy API...');
    
    // Call external API (same as your PHP code)
    const apiResponse = await axios.post('https://xbdapi.store/SIGNTOSV/SIGNTOSV.php', formData, {
      headers: {
        ...formData.getHeaders(),
        'User-Agent': 'Mozilla/5.0' // Cloudflare Bypass
      },
      httpsAgent: new (require('https')).Agent({
        rejectUnauthorized: false // SSL verification disabled
      }),
      timeout: 60000 // 60 seconds timeout
    });

    console.log('Server Copy API Response received');
    
    // Return exactly what the external API returns
    return res.json(apiResponse.data);

  } catch (error) {
    console.error('Server Copy PDF analysis error:', error.message);
    
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({
        success: false,
        message: 'Request timeout'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Failed to analyze PDF',
      error: error.message
    });
  } finally {
    // Clean up temp file (like PHP unlink)
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        await fs.promises.unlink(tempFilePath);
        console.log('Temporary file cleaned up:', tempFilePath);
      } catch (cleanupError) {
        console.error('Error cleaning up temp file:', cleanupError.message);
      }
    }
  }
});

// Alternative route with authentication and balance check
Userroute.post("/server-copy/analyze", authenticateUser, uploadServerCopyPdf.single('pdf'), async (req, res) => {
  let tempFilePath = null;
  let user = req.user;
  
  try {
    // Check if file exists
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No PDF file uploaded'
      });
    }

    // Check user balance
    const servicePrice = 5; // Set your price
    if (user.balance < servicePrice) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Required ${servicePrice}৳, your balance: ${user.balance}৳`
      });
    }

    console.log('Processing Server Copy for user:', user.email);

    // Save file to temp location
    const tempDir = path.join(__dirname, '../temp');
    
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const tempFileName = `temp_${Date.now()}_${Math.random().toString(36).substring(2)}.pdf`;
    tempFilePath = path.join(tempDir, tempFileName);
    
    await fs.promises.writeFile(tempFilePath, req.file.buffer);
    
    // Check file size
    const stats = await fs.promises.stat(tempFilePath);
    if (stats.size === 0) {
      throw new Error('Uploaded file is empty');
    }

    // Prepare form data
    const formData = new FormData();
    const API_KEY = 'cIUxUS3e49qS4FumMSIO';
    formData.append('key', API_KEY);
    
    formData.append('pdf', fs.createReadStream(tempFilePath), {
      filename: req.file.originalname,
      contentType: 'application/pdf'
    });
    
    console.log('Sending to Server Copy API...');
    
    // Call external API
    const apiResponse = await axios.post('https://xbdapi.store/SIGNTOSV/SIGNTOSV.php', formData, {
      headers: {
        ...formData.getHeaders(),
        'User-Agent': 'Mozilla/5.0'
      },
      httpsAgent: new (require('https')).Agent({
        rejectUnauthorized: false
      }),
      timeout: 60000
    });

    console.log('API Response received');
    
    // Deduct balance
    user.balance -= servicePrice;
    await user.save();
    
    // Create transaction record
    const transaction = new Transaction({
      user: user._id,
      type: 'debit',
      amount: servicePrice,
      service: 'Server Copy PDF Analysis',
      description: `PDF analysis for server copy - ${req.file.originalname}`,
      reference: `SERVER-COPY-${Date.now()}`,
      status: 'completed',
      balanceBefore: user.balance + servicePrice,
      balanceAfter: user.balance
    });
    await transaction.save();

    // Return API response with transaction info
    return res.json({
      ...apiResponse.data,
      transaction: {
        amount: servicePrice,
        balance: user.balance,
        transactionId: transaction._id
      }
    });

  } catch (error) {
    console.error('Server Copy error:', error.message);
    
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    
    return res.status(500).json({
      success: false,
      message: 'Failed to process PDF',
      error: error.message
    });
  } finally {
    // Clean up temp file
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        await fs.promises.unlink(tempFilePath);
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError.message);
      }
    }
  }
});

// GET - Get server copy service price
Userroute.get("/service/price/server-copy", async (req, res) => {
  try {
    const service = await PriceList.findOne({ 
      name: "Server Copy PDF Analysis" 
    });
    res.json({ 
      success: true,
      price: service?.price || 5,
      serviceName: "Server Copy PDF Analysis"
    });
  } catch (error) {
    res.json({ 
      success: true,
      price: 5,
      serviceName: "Server Copy PDF Analysis"
    });
  }
});


// ==================== SERVER COPY ROUTES ====================

// Import the model at the top with other imports
const ServerCopy = require("../models/ServerCopy");
const Notice = require("../models/Notice");
const SocialMedia = require("../models/SocialMedia");
const Notification = require("../models/Notification");


// Configure multer for server copy file uploads
const uploadServerCopyFiles = multer({
  storage: serverCopyStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/webp'
    ];
    
    console.log('Checking file type:', file.mimetype, 'for field:', file.fieldname);
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and image files are allowed!'));
    }
  }
});
// 3. POST - Process and Create Server Copy
// Configure storage for server copy files
// Create uploads directory if it doesn't exist
const uploadDir2 = path.join(__dirname, '../public/uploads/server-copy'); // Fixed path
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file upload
const serverCopyDiskStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir2);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
    }
});
// Configure multer for server copy file uploads
const uploadServerCopyFilesToDisk = multer({
  storage: serverCopyDiskStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/webp'
    ];
    
    console.log('Checking file type:', file.mimetype, 'for field:', file.fieldname);
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and image files are allowed!'));
    }
  }
});
// 3. POST - Process and Create Server Copy
// 3. POST - Process and Create Server Copy
Userroute.post("/server-copy/process-birth-certificate", 
  authenticateUser, 
  uploadServerCopyFilesToDisk.fields([  // Changed to new name
    { name: 'pdf', maxCount: 1 },
    { name: 'nidImage', maxCount: 1 }
  ]), 
  async (req, res) => {
    try {
      const user = req.user;
      const files = req.files;
      const formData = req.body;

      console.log('Processing server copy order for user:', user.email);
      console.log('Files received:', JSON.stringify(files, null, 2));
      console.log('Form data received:', formData);

      // Helper function to safely get string value from form data
      const getStringValue = (value) => {
        if (Array.isArray(value)) {
          return value[0] || '';
        }
        return value || '';
      };

      // Validate required fields
      const requiredFields = [
        'nameBangla', 'nameEnglish', 'nationalId', 'pinNumber',
        'fatherName', 'motherName', 'birthDate', 'birthPlace',
        'gender', 'currentAddress', 'permanentAddress'
      ];

      for (const field of requiredFields) {
        const fieldValue = getStringValue(formData[field]);
        if (!fieldValue || fieldValue.trim() === '') {
          return res.status(400).json({
            success: false,
            message: `${field} ফিল্ডটি পূরণ করুন`
          });
        }
      }

      // Check if PDF file exists
      if (!files?.pdf || files.pdf.length === 0) {
        return res.status(400).json({
          success: false,
          message: "PDF ফাইল আপলোড করুন"
        });
      }

      // Get service price
      const servicePrice = 5; // Default price
      const service = await PriceList.findOne({ name: "সার্ভার কপি" });
      const actualPrice = service?.price || servicePrice;

      // Check user balance
      if (user.balance < actualPrice) {
        return res.status(400).json({
          success: false,
          message: `অপর্যাপ্ত ব্যালেন্স। প্রয়োজন ${actualPrice}৳, আপনার ব্যালেন্স: ${user.balance}৳`
        });
      }

      // Get base URL from environment or use default
      const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

      // Handle PDF file - ensure filename is captured
      let pdfFilePath = '';
      if (files.pdf && files.pdf[0]) {
        const pdfFile = files.pdf[0];
        pdfFilePath = `/uploads/server-copy/${pdfFile.filename}`;
        console.log('PDF file saved:', pdfFile.filename);
      }

      // Handle NID image - can be file or URL
      let nidImagePath = '';
      
      // Check if NID image was uploaded as file
      if (files?.nidImage && files.nidImage.length > 0) {
        const nidFile = files.nidImage[0];
        nidImagePath = `${baseUrl}/uploads/server-copy/${nidFile.filename}`;
        console.log('NID image uploaded as file:', nidFile.filename);
      } 
      // Check if photo URL was provided in form data
      else if (formData.photo) {
        const photoValue = getStringValue(formData.photo);
        if (photoValue && photoValue.trim() !== '') {
          nidImagePath = photoValue.trim();
          console.log('Using photo URL from form data:', nidImagePath);
        }
      }

      // Generate verification URL
      const verificationUrl = `${baseUrl}/verify/server-copy/${Date.now()}`;

      // Create server copy record
      const serverCopy = new ServerCopy({
        user: user._id,
        
        // Personal Information
        nameBangla: getStringValue(formData.nameBangla).trim(),
        nameEnglish: getStringValue(formData.nameEnglish).trim(),
        nationalId: getStringValue(formData.nationalId).trim(),
        pinNumber: getStringValue(formData.pinNumber).trim(),
        formNumber: getStringValue(formData.formNumber) || '',
        voterNumber: getStringValue(formData.voterNumber) || '',
        voterArea: getStringValue(formData.voterArea) || '',
        mobileNumber: getStringValue(formData.mobileNumber) || '',
        
        // Family Information
        fatherName: getStringValue(formData.fatherName).trim(),
        motherName: getStringValue(formData.motherName).trim(),
        spouseName: getStringValue(formData.spouseName) || '',
        
        // Personal Information
        education: getStringValue(formData.education) || '',
        ocupation: getStringValue(formData.ocupation) || '',
        birthPlace: getStringValue(formData.birthPlace).trim(),
        birthDate: getStringValue(formData.birthDate),
        bloodGroup: getStringValue(formData.bloodGroup) || '',
        gender: getStringValue(formData.gender),
        
        // Address Information
        currentAddress: getStringValue(formData.currentAddress).trim(),
        permanentAddress: getStringValue(formData.permanentAddress).trim(),
        
        // File Information - Fix: Handle photo field properly
        photo: getStringValue(formData.photo) || '',
        pdfFile: pdfFilePath, // Use the captured path
        nidImage: nidImagePath, // Use the captured path
        
        // UBRN Information
        UBRN: getStringValue(formData.UBRN) || '',
        birthDateUBRN: getStringValue(formData.birthDateUBRN) || '',
        
        // Service Information
        copyType: getStringValue(formData.copyType) || 'old',
        servicePrice: actualPrice,
        status: 'processing',
        verificationUrl: verificationUrl
      });

      await serverCopy.save();

      // Deduct balance
      user.balance -= actualPrice;
      await user.save();

      // Create transaction record
      const transaction = new Transaction({
        user: user._id,
        type: 'debit',
        amount: actualPrice,
        service: 'সার্ভার কপি তৈরি',
        description: `সার্ভার কপি তৈরি - ${getStringValue(formData.nameBangla)}`,
        reference: serverCopy.orderId,
        status: 'completed',
        balanceBefore: user.balance + actualPrice,
        balanceAfter: user.balance
      });
      await transaction.save();

      // Update server copy with transaction ID
      serverCopy.transactionId = transaction._id;
      serverCopy.status = 'completed';
      await serverCopy.save();

      console.log('Server copy order created successfully:', {
        orderId: serverCopy.orderId,
        pdfFile: serverCopy.pdfFile,
        nidImage: serverCopy.nidImage
      });

      res.status(201).json({
        success: true,
        message: "সার্ভার কপি সফলভাবে তৈরি হয়েছে",
        data: {
          orderId: serverCopy.orderId,
          receiptId: serverCopy.orderId,
          nameBangla: serverCopy.nameBangla,
          nameEnglish: serverCopy.nameEnglish,
          nationalId: serverCopy.nationalId,
          ocupation: serverCopy.ocupation,
          servicePrice: serverCopy.servicePrice,
          verificationUrl: serverCopy.verificationUrl,
          createdAt: serverCopy.createdAt,
          downloadUrl: `/api/user/server-copy/download/${serverCopy.orderId}`,
          pdfFile: serverCopy.pdfFile,
          nidImage: serverCopy.nidImage
        }
      });

    } catch (error) {
      console.error('Process server copy error:', error);
      
      // Clean up uploaded files on error
      if (req.files) {
        Object.values(req.files).forEach(fileArray => {
          fileArray.forEach(file => {
            if (file.path) {
              try {
                fs.unlinkSync(file.path);
                console.log('Cleaned up file:', file.path);
              } catch (cleanupError) {
                console.error('Error cleaning up file:', cleanupError.message);
              }
            }
          });
        });
      }
      
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: "এই অর্ডার আইডি ইতিমধ্যে ব্যবহৃত হয়েছে, আবার চেষ্টা করুন"
        });
      }
      
      res.status(500).json({
        success: false,
        message: "সার্ভার কপি তৈরি করতে ব্যর্থ হয়েছে",
        error: error.message
      });
    }
  }
);
// 1. POST - Analyze PDF for Server Copy
Userroute.post("/server-copy/analyze", authenticateUser, uploadServerCopyFiles.single('pdf'), async (req, res) => {
  try {
    const user = req.user;
    
    // Check if file exists
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No PDF file uploaded'
      });
    }

    // Get service price
    const servicePrice = 5; // Default price for server copy analysis
    const service = await PriceList.findOne({ name: "সার্ভার কপি" });
    const actualPrice = service?.price || servicePrice;

    // Check user balance
    if (user.balance < actualPrice) {
      return res.status(400).json({
        success: false,
        message: `অপর্যাপ্ত ব্যালেন্স। প্রয়োজন ${actualPrice}৳, আপনার ব্যালেন্স: ${user.balance}৳`
      });
    }

    console.log('Processing Server Copy PDF for user:', user.email, 'File:', req.file.originalname);

    // Prepare form data for external API
    const formData = new FormData();
    
    // Add PDF file
    const fileStream = fs.createReadStream(req.file.path);
    formData.append('pdf', fileStream, req.file.originalname);
    
    // Add API key
    const API_KEY = '862d71f5a799baba4b809411d4e6d2bd';
    formData.append('key', API_KEY);
    
    console.log('Sending to external API for PDF analysis...');

    // Call external API for PDF analysis
    const apiResponse = await axios.post('http://all-seba.online/api/v2/sv/analyze', formData, {
      headers: {
        ...formData.getHeaders(),
        'User-Agent': 'Mozilla/5.0'
      },
      httpsAgent: new (require('https')).Agent({
        rejectUnauthorized: false
      }),
      timeout: 60000
    });

    console.log('PDF Analysis Response received');

    // Deduct balance
    user.balance -= actualPrice;
    await user.save();
    
    // Create transaction record
    const transaction = new Transaction({
      user: user._id,
      type: 'debit',
      amount: actualPrice,
      service: 'সার্ভার কপি PDF বিশ্লেষণ',
      description: `PDF বিশ্লেষণ সার্ভার কপির জন্য - ${req.file.originalname}`,
      reference: `SC-ANALYZE-${Date.now()}`,
      status: 'completed',
      balanceBefore: user.balance + actualPrice,
      balanceAfter: user.balance
    });
    await transaction.save();

    // Save file path
    const pdfFile = `/uploads/server-copy/${req.file.filename}`;

    // Format extracted data for auto-filling
    const extractedData = apiResponse.data;
    const formattedData = {
      // Personal Information
      nameBangla: extractedData.nameBn || extractedData.nameBangla || '',
      nameEnglish: extractedData.nameEn || extractedData.nameEnglish || '',
      nationalId: extractedData.nationalId || extractedData.nid_number || '',
      pinNumber: extractedData.pin || extractedData.pinNumber || '',
      formNumber: extractedData.slNo || extractedData.formNumber || '',
      
      // Family Information
      fatherName: extractedData.father || extractedData.fatherName || '',
      motherName: extractedData.mother || extractedData.motherName || '',
      spouseName: extractedData.spouse || extractedData.spouseName || '',
      
      // Birth Information
      birthDate: extractedData.dateOfBirth || extractedData.birthDate || '',
      birthPlace: extractedData.birthPlace || extractedData.place_of_birth || '',
      
      // Demographic Information
      gender: extractedData.gender ? 
        (extractedData.gender === 'male' ? 'Male' : 
         extractedData.gender === 'female' ? 'Female' : 
         extractedData.gender.charAt(0).toUpperCase() + extractedData.gender.slice(1)) : 'Gender',
      
      bloodGroup: extractedData.bloodGroup || '',
      
      // Education
      education: extractedData.education || extractedData.education_qualification || '',
      
      // Voter Information
      voterNumber: extractedData.voterNo || extractedData.voterNumber || '',
      voterArea: extractedData.voterArea || extractedData.voter_area || '',
      
      // Address Information
      currentAddress: extractedData.presentAddress?.addressLine || extractedData.address || '',
      permanentAddress: extractedData.permanentAddress?.addressLine || 
                        extractedData.permanent_address || 
                        extractedData.presentAddress?.addressLine || '',
      
      // Photo URL
      photo: extractedData.photo || '',
      
      // Raw extracted data
      rawData: extractedData
    };

    // Create temporary server copy record
    const serverCopy = new ServerCopy({
      user: user._id,
      pdfFile: pdfFile,
      extractedData: extractedData,
      servicePrice: actualPrice,
      status: 'processing'
    });

    await serverCopy.save();

    // Return response
    return res.status(200).json({
      success: true,
      message: "PDF বিশ্লেষণ সফল হয়েছে",
      data: formattedData,
      transaction: {
        amount: actualPrice,
        balance: user.balance,
        transactionId: transaction._id
      },
      serverCopyId: serverCopy._id,
      pdfFile: pdfFile
    });

  } catch (error) {
    console.error('Server Copy PDF analysis error:', error.message);
    
    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError.message);
      }
    }
    
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        message: error.response.data.message || 'PDF বিশ্লেষণ ব্যর্থ হয়েছে',
        error: error.response.data
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'PDF বিশ্লেষণ করতে ব্যর্থ হয়েছে',
      error: error.message
    });
  }
});

// 2. POST - Get UBRN data (CAPTCHA first step)
Userroute.post("/server-copy/birth-certificate-ubrn", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { UBRN, BirthDate, captcha, req_id } = req.body;

    // Validate required fields for initial request
    if (!UBRN || !BirthDate) {
      return res.status(400).json({
        success: false,
        message: "UBRN এবং জন্ম তারিখ প্রয়োজন"
      });
    }

    // Check if this is initial request (get CAPTCHA) or verification request
    if (!captcha) {
      // =========== STEP 1: GET CAPTCHA ===========
      console.log('Step 1: Getting CAPTCHA for UBRN:', UBRN);
      
      // Check balance for UBRN service
      const servicePrice = 10; // Price for UBRN service
      if (user.balance < servicePrice) {
        return res.status(400).json({
          success: false,
          message: `অপর্যাপ্ত ব্যালেন্স। প্রয়োজন ${servicePrice}৳, আপনার ব্যালেন্স: ${user.balance}৳`
        });
      }

      const step1Data = qs.stringify({
        key: '862d71f5a799baba4b809411d4e6d2bd',
        UBRN: UBRN,
        BirthDate: BirthDate
      });

      const step1Response = await axios.post(
        'http://all-seba.online/api/v2/bdris/captcha',
        step1Data,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 30000
        }
      );

      const step1Result = step1Response.data;
      console.log('Step 1 Response:', step1Result);

      if (!step1Result.success) {
        return res.status(400).json({
          success: false,
          message: "CAPTCHA লোড করতে ব্যর্থ হয়েছে",
          error: step1Result.message || 'Unknown error'
        });
      }

      // Store UBRN request temporarily (optional)
      // You might want to store this in session or temporary database

      return res.status(200).json({
        success: true,
        message: "CAPTCHA প্রস্তুত",
        requiresCaptcha: true,
        data: {
          sessionId: step1Result.id,
          captchaUrl: step1Result.captchaUrl,
          captchaBase64: step1Result.captchaBase64 || null,
          UBRN: UBRN,
          BirthDate: BirthDate
        }
      });

    } else {
      // =========== STEP 2: VERIFY WITH CAPTCHA ===========
      if (!req_id) {
        return res.status(400).json({
          success: false,
          message: "সেশন আইডি প্রয়োজন"
        });
      }

      console.log(`Step 2: Verifying with CAPTCHA: ${captcha}, Session ID: ${req_id}`);

      // Check balance for verification
      const servicePrice = 10;
      if (user.balance < servicePrice) {
        return res.status(400).json({
          success: false,
          message: `অপর্যাপ্ত ব্যালেন্স। প্রয়োজন ${servicePrice}৳, আপনার ব্যালেন্স: ${user.balance}৳`
        });
      }

      const step2Data = qs.stringify({
        key: '862d71f5a799baba4b809411d4e6d2bd',
        req_id: req_id,
        captcha: captcha
      });

      const step2Response = await axios.post(
        'http://all-seba.online/api/v2/bdris/verify',
        step2Data,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 30000
        }
      );

      const finalData = step2Response.data;
      console.log('Step 2 Response received');

      // Deduct balance
      user.balance -= servicePrice;
      await user.save();

      // Create transaction record
      const transaction = new Transaction({
        user: user._id,
        type: 'debit',
        amount: servicePrice,
        service: 'সার্ভার কপি UBRN ডাটা',
        description: `UBRN এর মাধ্যমে জন্ম নিবন্ধন তথ্য - UBRN: ${UBRN}`,
        reference: `SC-UBRN-${Date.now()}`,
        status: 'completed',
        balanceBefore: user.balance + servicePrice,
        balanceAfter: user.balance
      });
      await transaction.save();

      // Format UBRN data for auto-filling
      const formattedData = {
        // Map UBRN data to your form fields
        nameBangla: finalData.nameBn || finalData.nameBangla || '',
        nameEnglish: finalData.nameEn || finalData.nameEnglish || '',
        nationalId: finalData.nid_number || finalData.nationalId || '',
        pinNumber: finalData.pin || finalData.pinNumber || '',
        fatherName: finalData.father || finalData.fatherName || '',
        motherName: finalData.mother || finalData.motherName || '',
        birthDate: finalData.dateOfBirth || finalData.birthDate || '',
        birthPlace: finalData.birthPlace || finalData.place_of_birth || '',
        gender: finalData.gender || '',
        photo: finalData.photo || '',
        address: finalData.address || finalData.presentAddress?.addressLine || ''
      };

      return res.status(200).json({
        success: true,
        message: "UBRN ডাটা সফলভাবে পাওয়া গেছে",
        data: formattedData,
        rawData: finalData,
        transaction: {
          amount: servicePrice,
          balance: user.balance,
          transactionId: transaction._id
        }
      });
    }

  } catch (error) {
    console.error("Server Copy UBRN error:", error.message);
    
    if (error.response) {
      return res.status(error.response.status || 500).json({
        success: false,
        message: "বাহ্যিক সেবা থেকে ত্রুটি",
        error: error.response.data || error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      message: "UBRN ডাটা সংগ্রহ করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});


// 4. GET - Download Server Copy PDF
Userroute.get("/server-copy/download/:orderId", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { orderId } = req.params;

    // Find server copy order
    const serverCopy = await ServerCopy.findOne({
      orderId: orderId,
      user: user._id
    });

    if (!serverCopy) {
      return res.status(404).json({
        success: false,
        message: "সার্ভার কপি অর্ডার পাওয়া যায়নি"
      });
    }

    // Check if PDF file exists
    if (!serverCopy.pdfFile) {
      return res.status(404).json({
        success: false,
        message: "PDF ফাইল পাওয়া যায়নি"
      });
    }

    // For now, return the original PDF
    // In a real application, you would generate a new PDF with the form data
    const filePath = path.join(__dirname, '..', serverCopy.pdfFile);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "PDF ফাইল পাওয়া যায়নি"
      });
    }

    // Set headers for download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="server-copy-${orderId}.pdf"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Download server copy error:', error);
    res.status(500).json({
      success: false,
      message: "সার্ভার কপি ডাউনলোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// 5. GET - Get all server copies for user
Userroute.get("/server-copy/all", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Search filter
    const search = req.query.search || '';
    
    // Build query
    let query = { user: user._id };
    
    if (search) {
      query.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { nameBangla: { $regex: search, $options: 'i' } },
        { nameEnglish: { $regex: search, $options: 'i' } },
        { nationalId: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Get total count
    const total = await ServerCopy.countDocuments(query);
    
    // Get server copies
    const serverCopies = await ServerCopy.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-extractedData -ubrnData -qrCodeData -__v');
    
    // Format response
    const formattedCopies = serverCopies.map(copy => ({
      _id: copy._id,
      orderId: copy.orderId,
      nameBangla: copy.nameBangla,
      nameEnglish: copy.nameEnglish,
      nationalId: copy.nationalId,
      servicePrice: copy.servicePrice,
      status: copy.status,
      verificationUrl: copy.verificationUrl,
      createdAt: copy.createdAt,
      updatedAt: copy.updatedAt
    }));
    
    res.status(200).json({
      success: true,
      message: "সার্ভার কপি তালিকা",
      data: formattedCopies,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error("Get server copies error:", error);
    res.status(500).json({
      success: false,
      message: "সার্ভার কপি তালিকা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// 6. GET - Get single server copy by orderId
Userroute.get("/server-copy/:orderId", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { orderId } = req.params;
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "অর্ডার আইডি প্রয়োজন"
      });
    }
    
    // Find server copy
    const serverCopy = await ServerCopy.findOne({
      orderId: orderId,
      user: user._id
    });
    
    if (!serverCopy) {
      return res.status(404).json({
        success: false,
        message: "সার্ভার কপি পাওয়া যায়নি"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "সার্ভার কপি ডাটা লোড সফল",
      data: serverCopy
    });
    
  } catch (error) {
    console.error("Get server copy details error:", error);
    res.status(500).json({
      success: false,
      message: "সার্ভার কপি ডাটা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// 7. DELETE - Delete server copy
Userroute.delete("/server-copy/:id", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    console.log(user)
    // Find and delete server copy
    const result = await ServerCopy.findOneAndDelete({
      _id: id,
      user:user._id
    });
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "সার্ভার কপি পাওয়া যায়নি বা ডিলিট করা যাবে না"
      });
    }
    
    // Clean up files if they exist
    if (result.pdfFile) {
      const filePath = path.join(__dirname, '..', result.pdfFile);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    if (result.nidImage && result.nidImage.startsWith('/uploads/')) {
      const nidPath = path.join(__dirname, '..', result.nidImage);
      if (fs.existsSync(nidPath)) {
        fs.unlinkSync(nidPath);
      }
    }
    
    res.status(200).json({
      success: true,
      message: "সার্ভার কপি সফলভাবে ডিলিট করা হয়েছে",
      data: {
        orderId: result.orderId,
        deletedAt: new Date()
      }
    });
    
  } catch (error) {
    console.error("Delete server copy error:", error);
    res.status(500).json({
      success: false,
      message: "সার্ভার কপি ডিলিট করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// 8. GET - Get server copy statistics
Userroute.get("/server-copy/statistics", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    
    // Get statistics
    const totalCopies = await ServerCopy.countDocuments({ user: user._id });
    
    const stats = await ServerCopy.aggregate([
      { $match: { user: user._id } },
      { 
        $group: {
          _id: null,
          totalAmount: { $sum: "$servicePrice" },
          completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
          processing: { $sum: { $cond: [{ $eq: ["$status", "processing"] }, 1, 0] } }
        }
      }
    ]);
    
    // Get copies by month
    const copiesByMonth = await ServerCopy.aggregate([
      { $match: { user: user._id } },
      { 
        $group: {
          _id: { 
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          count: { $sum: 1 },
          totalAmount: { $sum: "$servicePrice" }
        }
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } }
    ]);
    
    res.status(200).json({
      success: true,
      message: "সার্ভার কপি পরিসংখ্যান",
      data: {
        totalCopies,
        totalAmount: stats.length > 0 ? stats[0].totalAmount : 0,
        completed: stats.length > 0 ? stats[0].completed : 0,
        pending: stats.length > 0 ? stats[0].pending : 0,
        processing: stats.length > 0 ? stats[0].processing : 0,
        copiesByMonth
      }
    });
    
  } catch (error) {
    console.error("Get server copy statistics error:", error);
    res.status(500).json({
      success: false,
      message: "পরিসংখ্যান লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// 9. POST - Public PDF analysis (without authentication)
Userroute.post("/server-copy/analyze-pdf", uploadServerCopyFiles.single('pdf'), async (req, res) => {
  try {
    // Check if file exists
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No PDF file uploaded'
      });
    }

    console.log('Processing PDF for public analysis:', req.file.originalname);

    // Prepare form data for external API
    const formData = new FormData();
    
    // Add PDF file
    const fileStream = fs.createReadStream(req.file.path);
    formData.append('pdf', fileStream, req.file.originalname);
    
    // Add API key
    const API_KEY = '862d71f5a799baba4b809411d4e6d2bd';
    formData.append('key', API_KEY);
    
    console.log('Sending to external API...');

    // Call external API
    const apiResponse = await axios.post('http://all-seba.online/api/v2/sv/analyze', formData, {
      headers: {
        ...formData.getHeaders(),
        'User-Agent': 'Mozilla/5.0'
      },
      httpsAgent: new (require('https')).Agent({
        rejectUnauthorized: false
      }),
      timeout: 60000
    });

    console.log('PDF Analysis Response received');

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    // Format response
    const extractedData = apiResponse.data;
    const formattedData = {
      nameBangla: extractedData.nameBn || extractedData.nameBangla || '',
      nameEnglish: extractedData.nameEn || extractedData.nameEnglish || '',
      nationalId: extractedData.nationalId || extractedData.nid_number || '',
      pinNumber: extractedData.pin || extractedData.pinNumber || '',
      fatherName: extractedData.father || extractedData.fatherName || '',
      motherName: extractedData.mother || extractedData.motherName || '',
      birthDate: extractedData.dateOfBirth || extractedData.birthDate || '',
      birthPlace: extractedData.birthPlace || extractedData.place_of_birth || '',
      gender: extractedData.gender || '',
      photo: extractedData.photo || ''
    };

    return res.status(200).json({
      success: true,
      message: "PDF বিশ্লেষণ সফল হয়েছে",
      data: formattedData
    });

  } catch (error) {
    console.error('Public PDF analysis error:', error.message);
    
    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError.message);
      }
    }
    
    return res.status(500).json({
      success: false,
      message: 'PDF বিশ্লেষণ করতে ব্যর্থ হয়েছে',
      error: error.message
    });
  }
});

// ------------------------------------------all-notice----------------------------------------------
Userroute.get("/service/notice/sign-copy-order", async (req, res) => {
  try {
    const service = await Notice.findOne({ 
      serviceName: "সাইন কপি" 
    });
    res.json({ service:service.notice});
  } catch (error) {
    res.json({ service:"not found!" });
  }
});
Userroute.get("/service/notice/biomatrix", async (req, res) => {
  try {
    const service = await Notice.findOne({ 
      serviceName: "বায়োমেট্রিক" 
    });
    res.json({ service:service.notice});
  } catch (error) {
    res.json({ service:"not found!" });
  }
});
Userroute.get("/service/notice/call-list", async (req, res) => {
  try {
    const service = await Notice.findOne({ 
      serviceName: "কল লিস্ট" 
    });
    res.json({ service:service.notice});
  } catch (error) {
    res.json({ service:"not found!" });
  }
});
Userroute.get("/service/notice/passport-make", async (req, res) => {
  try {
    const service = await Notice.findOne({ 
      serviceName: "পাসপোর্ট মেক" 
    });
    res.json({ service:service.notice});
  } catch (error) {
    res.json({ service:"not found!" });
  }
});

Userroute.get("/service/notice/vomiunnoyon", async (req, res) => {
  try {
    const service = await Notice.findOne({ 
      serviceName: "ভূমি উন্নয়ন কর" 
    });
    res.json({ service:service.notice});
  } catch (error) {
    res.json({ service:"not found!" });
  }
});
Userroute.get("/service/notice/police-clearance", async (req, res) => {
  try {
    const service = await Notice.findOne({ 
      serviceName: "পুলিশ ক্লিয়ারেন্স ক্লোন" 
    });
    res.json({ service:service.notice});
  } catch (error) {
    res.json({ service:"not found!" });
  }
});

Userroute.get("/service/notice/takamul-certificate", async (req, res) => {
  try {
    const service = await Notice.findOne({ 
      serviceName: "তাকামূল সাটিফিকেট ক্লোন" 
    });
    res.json({ service:service.notice});
  } catch (error) {
    res.json({ service:"not found!" });
  }
});
Userroute.get("/service/notice/surokkha-clone", async (req, res) => {
  try {
    const service = await Notice.findOne({ 
      serviceName: "সুরক্ষা ক্লোন" 
    });
    res.json({ service:service.notice});
  } catch (error) {
    res.json({ service:"not found!" });
  }
});
Userroute.get("/service/notice/trade-license", async (req, res) => {
  try {
    const service = await Notice.findOne({ 
      serviceName: "ট্রেড লাইসেন্স ক্লোন" 
    });
    res.json({ service:service.notice});
  } catch (error) {
    res.json({ service:"not found!" });
  }
});

Userroute.get("/service/notice/return-clone", async (req, res) => {
  try {
    const service = await Notice.findOne({ 
      serviceName: "রিটার্ন ক্লোন" 
    });
    res.json({ service:service.notice});
  } catch (error) {
    res.json({ service:"not found!" });
  }
});

Userroute.get("/service/notice/nagorik-sonod", async (req, res) => {
  try {
    const service = await Notice.findOne({ 
      serviceName: "নাগরিক সনদ" 
    });
    res.json({ service:service.notice});
  } catch (error) {
    res.json({ service:"not found!" });
  }
});
Userroute.get("/service/notice/tin-certificate-clone", async (req, res) => {
  try {
    const service = await Notice.findOne({ 
      serviceName: "টিন সাটিফিকেট ক্লোন" 
    });
    res.json({ service:service.notice});
  } catch (error) {
    res.json({ service:"not found!" });
  }
});
Userroute.get("/service/notice/ssc-certificate", async (req, res) => {
  try {
    const service = await Notice.findOne({ 
      serviceName: "এসএসসি সাটিফিকেট ক্লোন" 
    });
    res.json({ service:service.notice});
  } catch (error) {
    res.json({ service:"not found!" });
  }
});


Userroute.get("/service/notice/hsc-certificate", async (req, res) => {
  try {
    const service = await Notice.findOne({ 
      serviceName: "এইচএসসি সাটিফিকেট ক্লোন" 
    });
    res.json({ service:service.notice});
  } catch (error) {
    res.json({ service:"not found!" });
  }
});

Userroute.get("/service/notice/nid-make", async (req, res) => {
  try {
    const service = await Notice.findOne({ 
      serviceName: "এনআইডি মেক" 
    });
    res.json({ service:service.notice});
  } catch (error) {
    res.json({ service:"not found!" });
  }
});
Userroute.get("/service/notice/nid-make2", async (req, res) => {
  try {
    const service = await Notice.findOne({ 
      serviceName: "এনআইডি মেক 2" 
    });
    res.json({ service:service.notice});
  } catch (error) {
    res.json({ service:"not found!" });
  }
});
Userroute.get("/service/notice/birth-data", async (req, res) => {
  try {
    const service = await Notice.findOne({ 
      serviceName: "জন্মনিবন্ধন ডাটা" 
    });
    res.json({ service:service.notice});
  } catch (error) {
    res.json({ service:"not found!" });
  }
});
Userroute.get("/service/notice/smart-nid-make", async (req, res) => {
  try {
    const service = await Notice.findOne({ 
      serviceName: "স্মার্ট  কাড PDF মেক" 
    });
    res.json({ service:service.notice});
  } catch (error) {
    res.json({ service:"not found!" });
  }
});
Userroute.get("/service/notice/manual-birth-certificate", async (req, res) => {
  try {
    const service = await Notice.findOne({ 
      serviceName: "ম্যানুয়ালি জন্মানিবন্ধন মেক" 
    });
    res.json({ service:service.notice});
  } catch (error) {
    res.json({ service:"not found!" });
  }
});
Userroute.get("/service/notice/auto-birth-certificate", async (req, res) => {
  try {
    const service = await Notice.findOne({ 
      serviceName: "অটো জন্মানিবন্ধন মেক" 
    });
    res.json({ service:service.notice});
  } catch (error) {
    res.json({ service:"not found!" });
  }
});
Userroute.get("/service/notice/death-certificate", async (req, res) => {
  try {
    const service = await Notice.findOne({ 
      serviceName: "মৃত্যনিবন্ধন" 
    });
    res.json({ service:service.notice});
  } catch (error) {
    res.json({ service:"not found!" });
  }
});
Userroute.get("/service/notice/server-copy-unofficial", async (req, res) => {
  try {
    const service = await Notice.findOne({ 
      serviceName: "সার্ভার কপি Unofficial" 
    });
    res.json({ service:service.notice});
  } catch (error) {
    res.json({ service:"not found!" });
  }
});

Userroute.get("/service/notice/sign-to-server-copy", async (req, res) => {
  try {
    const service = await Notice.findOne({ 
      serviceName: "সাইন টু সার্ভার কপি" 
    });
    res.json({ service:service.notice});
  } catch (error) {
    res.json({ service:"not found!" });
  }
});


Userroute.get("/service/notice/acknowledge-tax", async (req, res) => {
  try {
    const service = await Notice.findOne({ 
      serviceName: "আয়কর রিটার্ন স্বীকারপত্র" 
    });
    res.json({ service:service.notice});
  } catch (error) {
    res.json({ service:"not found!" });
  }
});

Userroute.get("/service/notice/uttoradhikar-sonod", async (req, res) => {
  try {
    const service = await Notice.findOne({ 
      serviceName: "উত্তরাধিকার সনদ" 
    });
    res.json({ service:service.notice});
  } catch (error) {
    res.json({ service:"not found!" });
  }
});


Userroute.get("/service/notice/number-to-location", async (req, res) => {
  try {
    const service = await Notice.findOne({ 
      serviceName: "নাম্বার টু লোকেশন" 
    });
    res.json({ service:service.notice});
  } catch (error) {
    res.json({ service:"not found!" });
  }
});
Userroute.get("/service/notice/imei-to-number", async (req, res) => {
  try {
    const service = await Notice.findOne({ 
      serviceName: "আইএমইআই টু নাম্বার" 
    });
    res.json({ service:service.notice});
  } catch (error) {
    res.json({ service:"not found!" });
  }
});
Userroute.get("/service/notice/nid-user-pass", async (req, res) => {
  try {
    const service = await Notice.findOne({ 
      serviceName: "এনআইডি ইউজার পাস" 
    });
    res.json({ service:service.notice});
  } catch (error) {
    res.json({ service:"not found!" });
  }
});
Userroute.get("/service/notice/new-death-certificate", async (req, res) => {
  try {
    const service = await Notice.findOne({ 
      serviceName: "নতুন জন্ম নিবন্ধন" 
    });
    res.json({ service:service.notice});
  } catch (error) {
    res.json({ service:"not found!" });
  }
});

Userroute.get("/service/notice/tin-certificate-order", async (req, res) => {
  try {
    const service = await Notice.findOne({ 
      serviceName: "টিন সার্টিফিকেট অর্ডার" 
    });
    res.json({ service:service.notice});
  } catch (error) {
    res.json({ service:"not found!" });
  }
});

Userroute.get("/service/notice/zero-return-order", async (req, res) => {
  try {
    const service = await Notice.findOne({ 
      serviceName: "জিরো রিটার্ন অর্ডার" 
    });
    res.json({ service:service.notice});
  } catch (error) {
    res.json({ service:"not found!" });
  }
});


Userroute.get("/service/notice/nid-to-all-number", async (req, res) => {
  try {
    const service = await Notice.findOne({ 
      serviceName: "এনআইডি টু অল নাম্বার" 
    });
    res.json({ service:service.notice});
  } catch (error) {
    res.json({ service:"not found!" });
  }
});


Userroute.get("/service/notice/name-address-to-nid", async (req, res) => {
  try {
    const service = await Notice.findOne({ 
      serviceName: "নাম ও ঠিকানা থেকে এনআইডি" 
    });
    res.json({ service:service.notice});
  } catch (error) {
    res.json({ service:"not found!" });
  }
});

Userroute.get("/service/notice/smart-card-order", async (req, res) => {
  try {
    const service = await Notice.findOne({ 
      serviceName: "স্মার্টকার্ড অর্ডার" 
    });
    res.json({ service:service.notice});
  } catch (error) {
    res.json({ service:"not found!" });
  }
});

Userroute.get("/service/notice/nid-card-order", async (req, res) => {
  try {
    const service = await Notice.findOne({ 
      serviceName: "এনআইডি কার্ড অর্ডার" 
    });
    res.json({ service:service.notice});
  } catch (error) {
    res.json({ service:"not found!" });
  }
});

Userroute.get("/service/notice/server-copy-order", async (req, res) => {
  try {
    const service = await Notice.findOne({ 
      serviceName: "সার্ভার কপি অর্ডার" 
    });
    res.json({ service:service.notice});
  } catch (error) {
    res.json({ service:"not found!" });
  }
});


Userroute.get("/service/notice/auto-nid-maker", async (req, res) => {
  try {
    const service = await Notice.findOne({ 
      serviceName: "অটো আইডি মেকার" 
    });
    res.json({ service:service.notice});
  } catch (error) {
    res.json({ service:"not found!" });
  }
});
// ==================== SOCIAL MEDIA ROUTE ====================

// GET - Get all active social media links (Public route)
Userroute.get("/social-media", async (req, res) => {
    try {
        const socialMedia = await SocialMedia.find({ isActive: true })
            .select('platform url')
            .sort({ platform: 1 });
        
        res.status(200).json({
            success: true,
            data: socialMedia
        });
        
    } catch (error) {
        console.error("Social media error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch social media"
        });
    }
});
// Add these imports at the top
const NotificationService = require("../services/NotificationService");
const { connectedUsers } = require("..");
const AutoTinCertificate = require("../models/AutoTinCertificate");
const ServerCopyUnofficial = require("../models/ServerCopyUnofficial");
const Menu = require("../models/Menu");

// Add these routes after other routes:

// GET - Get notifications (updated for Socket.io)
Userroute.get("/notifications", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Filter by read status
    const filter = req.query.filter; // 'all', 'unread', 'read'
    
    // Build query
    let query = { 
      user: user._id,
      isActive: true
    };
    
    // Apply filter
    if (filter === 'unread') {
      query.isRead = false;
    } else if (filter === 'read') {
      query.isRead = true;
    }
    
    // Get total count
    const total = await Notification.countDocuments(query);
    
    // Get unread count separately
    const unreadCount = await Notification.countDocuments({
      user: user._id,
      isRead: false,
      isActive: true
    });
    
    // Get notifications
    const notifications = await Notification.find(query)
      .populate('order', 'orderId serviceName status totalAmount')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Format response
    const formattedNotifications = notifications.map(notif => ({
      _id: notif._id,
      type: notif.type,
      message: notif.message,
      orderId: notif.orderId,
      serviceName: notif.serviceName,
      order: notif.order,
      isRead: notif.isRead,
      readAt: notif.readAt,
      createdAt: notif.createdAt
    }));
    
    res.status(200).json({
      success: true,
      message: "Notifications retrieved successfully",
      data: {
        notifications: formattedNotifications,
        unreadCount: unreadCount,
        total: total
      },
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
      error: error.message
    });
  }
});

// PUT - Mark notification as read
// PUT - Mark notification as read
Userroute.put("/notifications/:id/read", authenticateUser, async (req, res) => {
  try {
    const notification = await NotificationService.markAsRead(req.params.id, req.user._id);
    
    if (!notification) return res.status(404).json({ 
      success: false, 
      message: "Notification not found" 
    });
    
    res.json({ 
      success: true, 
      message: "Notification marked as read",
      data: notification 
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to mark notification as read" 
    });
  }
});

// PUT - Mark all notifications as read
Userroute.put("/notifications/read-all", authenticateUser, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { user: req.user._id, isRead: false, isActive: true },
      { isRead: true, readAt: new Date() }
    );
    
    // Emit socket event if user is connected
    const socketId = connectedUsers.get(req.user._id.toString());
    if (socketId) {
      io.to(socketId).emit('all_notifications_read', { type: 'all-notifications-read' });
    }
    
    res.json({ 
      success: true, 
      message: `${result.modifiedCount} notifications marked as read`,
      markedCount: result.modifiedCount 
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to mark all notifications as read" 
    });
  }
});

// DELETE - Delete notification
Userroute.delete("/notifications/:id", authenticateUser, async (req, res) => {
  try {
    const notification = await NotificationService.deleteNotification(req.params.id, req.user._id);
    
    if (!notification) return res.status(404).json({ 
      success: false, 
      message: "Notification not found" 
    });
    
    res.json({ 
      success: true, 
      message: "Notification deleted successfully" 
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to delete notification" 
    });
  }
});

// DELETE - Delete all notifications
Userroute.delete("/notifications", authenticateUser, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { user: req.user._id, isActive: true },
      { isActive: false }
    );
    
    // Emit socket event if user is connected
    const socketId = connectedUsers.get(req.user._id.toString());
    if (socketId) {
      io.to(socketId).emit('all_notifications_deleted', { type: 'all-notifications-deleted' });
    }
    
    res.json({ 
      success: true, 
      message: `${result.modifiedCount} notifications deleted`,
      deletedCount: result.modifiedCount 
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to delete notifications" 
    });
  }
});
// GET - Get notification count (for badge)
Userroute.get("/notifications/count", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    
    const unreadCount = await Notification.countDocuments({
      user: user._id,
      isRead: false,
      isActive: true
    });
    
    const totalCount = await Notification.countDocuments({
      user: user._id,
      isActive: true
    });
    
    res.status(200).json({
      success: true,
      data: {
        unreadCount,
        totalCount
      }
    });
    
  } catch (error) {
    console.error("Get notification count error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get notification count",
      error: error.message
    });
  }
});









// ==================== TIN CERTIFICATE API ROUTES ====================

// POST - Get TIN Certificate Data from External API
// POST - Get TIN Certificate Data from External API and Save to Database
Userroute.post("/tin-certificate-api/fetch", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { tinNumber } = req.body;

    // Validate required fields
    if (!tinNumber || tinNumber.trim() === '') {
      return res.status(400).json({
        success: false,
        message: "TIN নম্বর প্রয়োজন"
      });
    }


    // Check user balance for TIN certificate service
    let servicePrice = 100; // Default price
    try {
      const priceData = await PriceList.findOne({ name: "টিন সার্টিফিকেট অর্ডার" });
      if (priceData && priceData.price) {
        servicePrice = priceData.price;
      }
    } catch (priceError) {
      console.error('Error fetching price:', priceError);
    }

    if (user.balance < servicePrice) {
      return res.status(400).json({
        success: false,
        message: `অপর্যাপ্ত ব্যালেন্স। প্রয়োজন ${servicePrice}৳, আপনার ব্যালেন্স: ${user.balance}৳`
      });
    }

    console.log('Fetching TIN Certificate data for TIN:', tinNumber, 'User:', user.email);

    // Call the external TIN certificate API
    const apiResponse = await axios.get('https://sell.ourseba.shop/proxy', {
      params: {
        token: 'eagle2',
        tin: tinNumber.trim()
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    console.log('External TIN API Response Status:', apiResponse.status);
    console.log('External TIN API Response Code:', apiResponse.data.code);
    console.log('External TIN API Response Status:', apiResponse.data.status);

    // Check if API response is successful
    if (apiResponse.data.code !== 200 || apiResponse.data.status !== 'success') {
      return res.status(400).json({
        success: false,
        message: "TIN সার্টিফিকেট পাওয়া যায়নি",
        error: apiResponse.data.message || "অবৈধ TIN নম্বর"
      });
    }

    // Extract data from API response
    const apiData = apiResponse.data.data;
    
    // Parse address information
    const presentAddress = apiData.presentAddress || '';
    const permanentAddress = apiData.permanentAddress || '';
    
    // Extract tax zone and circle information
    const taxZone = apiData.taxZone || '';
    const taxCircle = apiData.taxCircle || '';
    
    // Parse issue date
    let issueDate = new Date();
    if (apiData.date) {
      try {
        // Try to parse the date string (e.g., "January 15, 2026")
        const parsedDate = new Date(apiData.date);
        if (!isNaN(parsedDate.getTime())) {
          issueDate = parsedDate;
        }
      } catch (dateError) {
        console.error('Error parsing date:', dateError);
      }
    }

    // Extract city from address
    const extractCityFromAddress = (address) => {
      if (!address) return 'Dhaka';
      const parts = address.split(', ');
      // Last part is usually the district/city
      return parts[parts.length - 1] || 'Dhaka';
    };

    // Extract circle number from tax circle string
    const extractCircleNumber = (circleString) => {
      if (!circleString) return '02';
      const match = circleString.match(/Circle-(\d+)/);
      return match ? match[1].padStart(2, '0') : '02';
    };

    // Extract zone number from tax zone string
    const extractZoneNumber = (zoneString) => {
      if (!zoneString) return '06';
      // Simple mapping - you might need a more comprehensive mapping
      const zoneMap = {
        'Noakhali': '06',
        'Dhaka': '01',
        'Chittagong': '02',
        'Rajshahi': '03',
        'Khulna': '04',
        'Barishal': '05',
        'Sylhet': '07',
        'Rangpur': '08',
        'Mymensingh': '09'
      };
      return zoneMap[zoneString] || '06';
    };

    // Generate receipt ID
    const generateTinReceiptId = () => {
      const prefix = 'TINAPI';
      const timestamp = Date.now().toString().slice(-8);
      const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
      return `${prefix}${timestamp}${randomStr}`;
    };

    // Generate QR code data helper
    const generateTinQRCodeData = (tinNumber, name, issueDate, verificationUrl, status) => {
      return `TIN Certificate
TIN Number: ${tinNumber}
Name: ${name}
Issue Date: ${new Date(issueDate).toLocaleDateString('en-US', { 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
})}
Status: ${status || 'Active Taxpayer'}

Verify at: ${verificationUrl}`;
    };

    const receiptId = generateTinReceiptId();
    const verificationUrl = `https://api.xbdapi.my.id/clone-services/tin-certificate-api-verify/${receiptId}`;
    const qrCodeData = apiData.QR || generateTinQRCodeData(
      apiData.TIN || tinNumber,
      apiData.nameEn || 'Unknown',
      issueDate,
      verificationUrl,
      apiData.status || 'Individual'
    );

    // Format data for database
    const formattedData = {
      tinNumber: apiData.TIN || tinNumber,
      name: apiData.nameEn || '',
      nameBangla: '', // Could add translation service here
      fatherName: apiData.fatherName || '',
      fatherNameBangla: '',
      motherName: apiData.motherName || '',
      motherNameBangla: '',
      currentAddress: presentAddress,
      currentAddressBangla: '',
      permanentAddress: permanentAddress,
      permanentAddressBangla: '',
      taxesCircle: extractCircleNumber(taxCircle),
      taxesZone: extractZoneNumber(taxZone),
      city: extractCityFromAddress(presentAddress),
      issueDate: issueDate,
      status: apiData.status || 'Individual',
      previousTIN: apiData.previousTIN || 'Not Applicable',
      zoneAddress: apiData.zoneAddress || '',
      zonePhone: apiData.zonePhone || '',
      qrCode: apiData.QR || ''
    };

    // Deduct balance
    const balanceBefore = user.balance;
    user.balance -= servicePrice;
    await user.save();
    const balanceAfter = user.balance;

    // Create transaction record
    const transaction = new Transaction({
      user: user._id,
      type: 'debit',
      amount: servicePrice,
      service: 'টিন সার্টিফিকেট তথ্য সংগ্রহ',
      description: `TIN সার্টিফিকেট তথ্য - TIN: ${tinNumber}, নাম: ${formattedData.name}`,
      reference: `TIN-${Date.now()}`,
      status: 'completed',
      balanceBefore: balanceBefore,
      balanceAfter: balanceAfter,
      metadata: {
        tinNumber: tinNumber,
        receiptId: receiptId
      }
    });
    await transaction.save();

    // Check if TIN certificate already exists for this user
    const existingCertificate = await TinCertificate.findOne({
      user: user._id,
      tinNumber: tinNumber.trim(),
      source: 'api'
    });

    let tinCertificate;
    if (existingCertificate) {
      // Update existing certificate
      existingCertificate.name = formattedData.name;
      existingCertificate.fatherName = formattedData.fatherName;
      existingCertificate.motherName = formattedData.motherName;
      existingCertificate.currentAddress = formattedData.currentAddress;
      existingCertificate.permanentAddress = formattedData.permanentAddress;
      existingCertificate.taxesCircle = formattedData.taxesCircle;
      existingCertificate.taxesZone = formattedData.taxesZone;
      existingCertificate.city = formattedData.city;
      existingCertificate.issueDate = formattedData.issueDate;
      existingCertificate.status = formattedData.status;
      existingCertificate.previousTIN = formattedData.previousTIN;
      existingCertificate.zoneAddress = formattedData.zoneAddress;
      existingCertificate.zonePhone = formattedData.zonePhone;
      existingCertificate.qrCode = formattedData.qrCode;
      existingCertificate.apiData = apiResponse.data;
      existingCertificate.verificationUrl = verificationUrl;
      existingCertificate.qrCodeData = qrCodeData;
      existingCertificate.updatedAt = new Date();
      existingCertificate.transactionId = transaction._id;
      
      tinCertificate = await existingCertificate.save();
      console.log('Updated existing TIN Certificate:', tinCertificate._id);
    } else {
      // Create new TIN certificate
      tinCertificate = new AutoTinCertificate({
        user: user._id,
        receiptId: receiptId,
        tinNumber: tinNumber.trim(),
        name: formattedData.name,
        nameBangla: formattedData.nameBangla,
        fatherName: formattedData.fatherName,
        fatherNameBangla: formattedData.fatherNameBangla,
        motherName: formattedData.motherName,
        motherNameBangla: formattedData.motherNameBangla,
        currentAddress: formattedData.currentAddress,
        currentAddressBangla: formattedData.currentAddressBangla,
        permanentAddress: formattedData.permanentAddress,
        permanentAddressBangla: formattedData.permanentAddressBangla,
        taxesCircle: formattedData.taxesCircle,
        taxesZone: formattedData.taxesZone,
        city: formattedData.city,
        issueDate: formattedData.issueDate,
        status: formattedData.status,
        previousTIN: formattedData.previousTIN,
        zoneAddress: formattedData.zoneAddress,
        zonePhone: formattedData.zonePhone,
        qrCode: formattedData.qrCode,
        apiData: apiResponse.data,
        verificationUrl: verificationUrl,
        qrCodeData: qrCodeData,
        status: 'active', // System status
        source: 'api',
        transactionId: transaction._id,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await tinCertificate.save();
      console.log('Created new TIN Certificate:', tinCertificate._id);
    }

    // Return success response
    return res.status(200).json({
      success: true,
      message: existingCertificate 
        ? "TIN সার্টিফিকেট তথ্য সফলভাবে হালনাগাদ করা হয়েছে" 
        : "TIN সার্টিফিকেট তথ্য সফলভাবে সংগ্রহ এবং সংরক্ষণ করা হয়েছে",
      data: {
        certificateId: tinCertificate._id,
        certificate: {
          _id: tinCertificate._id,
          receiptId: tinCertificate.receiptId,
          tinNumber: tinCertificate.tinNumber,
          name: tinCertificate.name,
          fatherName: tinCertificate.fatherName,
          motherName: tinCertificate.motherName,
          currentAddress: tinCertificate.currentAddress,
          permanentAddress: tinCertificate.permanentAddress,
          taxesCircle: tinCertificate.taxesCircle,
          taxesZone: tinCertificate.taxesZone,
          city: tinCertificate.city,
          issueDate: tinCertificate.issueDate,
          status: tinCertificate.status,
          previousTIN: tinCertificate.previousTIN,
          zoneAddress: tinCertificate.zoneAddress,
          zonePhone: tinCertificate.zonePhone,
          verificationUrl: tinCertificate.verificationUrl,
          createdAt: tinCertificate.createdAt,
          updatedAt: tinCertificate.updatedAt
        },
        apiData: {
          requestId: apiResponse.data.requestId,
          TIN: apiData.TIN,
          nameEn: apiData.nameEn,
          taxZone: apiData.taxZone,
          taxCircle: apiData.taxCircle,
          status: apiData.status,
          date: apiData.date
        },
        formattedData: formattedData
      },
      receiptId: receiptId,
      verificationUrl: verificationUrl,
      qrCodeData: qrCodeData,
      transaction: {
        amount: servicePrice,
        balance: user.balance,
        transactionId: transaction._id,
        balanceBefore: balanceBefore,
        balanceAfter: balanceAfter
      },
      metadata: {
        isNewCertificate: !existingCertificate,
        existingUpdated: !!existingCertificate,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("TIN Certificate API fetch error:", error.message);
    
    // Handle specific errors
    if (error.response) {
      console.error('External API error response:', error.response.data);
      
      if (error.response.status === 404) {
        return res.status(404).json({
          success: false,
          message: "TIN নম্বরটি পাওয়া যায়নি",
          error: "TIN number not found in government database"
        });
      }
      
      if (error.response.status === 400) {
        return res.status(400).json({
          success: false,
          message: "অবৈধ TIN নম্বর",
          error: error.response.data.message || "Invalid TIN number format"
        });
      }
      
      // External API returned an error
      return res.status(error.response.status || 500).json({
        success: false,
        message: "বাহ্যিক TIN API থেকে ত্রুটি",
        error: error.response.data.message || "External API error",
        apiError: error.response.data
      });
    }
    
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({
        success: false,
        message: "রিকুয়েস্ট টাইমআউট হয়েছে, দয়া করে আবার চেষ্টা করুন"
      });
    }
    
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        message: "TIN সার্টিফিকেট API বর্তমানে অনুপলব্ধ। দয়া করে কিছুক্ষণ পর আবার চেষ্টা করুন"
      });
    }
    
    // Handle database errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: "ডেটা ভ্যালিডেশন ত্রুটি",
        error: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      message: "TIN সার্টিফিকেট তথ্য সংগ্রহ করতে ব্যর্থ হয়েছে",
      error: process.env.NODE_ENV === 'development' ? error.message : "অভ্যন্তরীণ সার্ভার ত্রুটি",
      timestamp: new Date().toISOString()
    });
  }
});

// POST - Save TIN Certificate from API data
Userroute.post("/tin-certificate-api/save", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const {
      tinNumber,
      name,
      nameBangla,
      fatherName,
      fatherNameBangla,
      motherName,
      motherNameBangla,
      currentAddress,
      currentAddressBangla,
      permanentAddress,
      permanentAddressBangla,
      taxesCircle,
      taxesZone,
      city,
      issueDate,
      status,
      previousTIN,
      zoneAddress,
      zonePhone,
      qrCode,
      apiData,
      receiptId
    } = req.body;

    // Validate required fields
    if (!tinNumber || tinNumber.trim() === '') {
      return res.status(400).json({
        success: false,
        message: "TIN নম্বর প্রয়োজন"
      });
    }

    // Use provided receiptId or generate new one
    const finalReceiptId = receiptId || generateTinReceiptId();

    // Create verification URL
    const verificationUrl = `https://api.xbdapi.my.id/clone-services/tin-certificate-api-download/${finalReceiptId}`;

    // Generate QR code data if not provided
    const qrCodeData = qrCode || generateTinQRCodeData(
      tinNumber.trim(),
      name || 'Unknown',
      issueDate || new Date(),
      verificationUrl,
      status || 'Active Taxpayer'
    );

    // Create new TIN certificate from API data
    const tinCertificate = new AutoTinCertificate({
      user: user._id,
      receiptId: finalReceiptId,
      tinNumber: tinNumber.trim(),
      name: name?.trim() || 'Unknown',
      nameBangla: nameBangla?.trim() || '',
      fatherName: fatherName?.trim() || '',
      fatherNameBangla: fatherNameBangla?.trim() || '',
      motherName: motherName?.trim() || '',
      motherNameBangla: motherNameBangla?.trim() || '',
      currentAddress: currentAddress?.trim() || '',
      currentAddressBangla: currentAddressBangla?.trim() || '',
      permanentAddress: permanentAddress?.trim() || '',
      permanentAddressBangla: permanentAddressBangla?.trim() || '',
      taxesCircle: taxesCircle || '114',
      taxesZone: taxesZone || '06',
      city: city || 'Dhaka',
      issueDate: issueDate || new Date(),
      status: status || 'Individual',
      previousTIN: previousTIN || 'Not Applicable',
      zoneAddress: zoneAddress || '',
      zonePhone: zonePhone || '',
      qrCode: qrCodeData,
      apiData: apiData || {},
      verificationUrl: verificationUrl,
      qrCodeData: qrCodeData,
      status: 'active',
      source: 'api'
    });

    await tinCertificate.save();

    res.status(201).json({
      success: true,
      message: "TIN সার্টিফিকেট API ডেটা সংরক্ষণ করা হয়েছে",
      data: {
        _id: tinCertificate._id,
        receiptId: tinCertificate.receiptId,
        tinNumber: tinCertificate.tinNumber,
        name: tinCertificate.name,
        fatherName: tinCertificate.fatherName,
        status: tinCertificate.status,
        verificationUrl: tinCertificate.verificationUrl,
        createdAt: tinCertificate.createdAt
      }
    });

  } catch (error) {
    console.error("Save TIN Certificate API data error:", error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Receipt ID already exists. Please try again."
      });
    }
    
    res.status(500).json({
      success: false,
      message: "TIN সার্টিফিকেট API ডেটা সংরক্ষণ করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get all TIN certificates from API
Userroute.get("/tin-certificate-api/all", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Search filter
    const search = req.query.search || '';
    
    // Build query for API-generated certificates
    let query = { 
      user: user._id,
      source: 'api' 
    };
    
    if (search) {
      query.$or = [
        { receiptId: { $regex: search, $options: 'i' } },
        { tinNumber: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { fatherName: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { status: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Get total count
    const total = await AutoTinCertificate.countDocuments(query);
    
    // Get certificates
    const certificates = await AutoTinCertificate.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-apiData -qrCodeData -qrCode -__v');
    
    // Format response
    const formattedCertificates = certificates.map(cert => ({
      _id: cert._id,
      receiptId: cert.receiptId,
      tinNumber: cert.tinNumber,
      name: cert.name,
      nameBangla: cert.nameBangla,
      fatherName: cert.fatherName,
      fatherNameBangla: cert.fatherNameBangla,
      currentAddress: cert.currentAddress,
      currentAddressBangla: cert.currentAddressBangla,
      taxesCircle: cert.taxesCircle,
      taxesZone: cert.taxesZone,
      city: cert.city,
      issueDate: cert.issueDate,
      status: cert.status,
      previousTIN: cert.previousTIN,
      source: cert.source,
      createdAt: cert.createdAt,
      updatedAt: cert.updatedAt,
      verificationUrl: cert.verificationUrl
    }));
    
    res.status(200).json({
      success: true,
      message: "TIN সার্টিফিকেট API তালিকা",
      data: formattedCertificates,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error("Get TIN certificate API list error:", error);
    res.status(500).json({
      success: false,
      message: "TIN সার্টিফিকেট API তালিকা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// GET - Get single TIN certificate API data by receiptId
Userroute.get("/tin-certificate-api/receipt/:receiptId", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { receiptId } = req.params;
    
    if (!receiptId) {
      return res.status(400).json({
        success: false,
        message: "সার্টিফিকেট আইডি প্রয়োজন"
      });
    }
    
    // Find certificate
    const certificate = await AutoTinCertificate.findOne({
      receiptId: receiptId,
      user: user._id,
      source: 'api'
    });
    
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "TIN সার্টিফিকেট API ডেটা পাওয়া যায়নি"
      });
    }
    
    // Format response with all details
    const formattedCertificate = {
      _id: certificate._id,
      receiptId: certificate.receiptId,
      tinNumber: certificate.tinNumber,
      name: certificate.name,
      nameBangla: certificate.nameBangla,
      fatherName: certificate.fatherName,
      fatherNameBangla: certificate.fatherNameBangla,
      motherName: certificate.motherName,
      motherNameBangla: certificate.motherNameBangla,
      currentAddress: certificate.currentAddress,
      currentAddressBangla: certificate.currentAddressBangla,
      permanentAddress: certificate.permanentAddress,
      permanentAddressBangla: certificate.permanentAddressBangla,
      taxesCircle: certificate.taxesCircle,
      taxesZone: certificate.taxesZone,
      city: certificate.city,
      issueDate: certificate.issueDate,
      status: certificate.status,
      previousTIN: certificate.previousTIN,
      zoneAddress: certificate.zoneAddress,
      zonePhone: certificate.zonePhone,
      qrCode: certificate.qrCode,
      apiData: certificate.apiData,
      verificationUrl: certificate.verificationUrl,
      qrCodeData: certificate.qrCodeData,
      source: certificate.source,
      createdAt: certificate.createdAt,
      updatedAt: certificate.updatedAt
    };
    
    res.status(200).json({
      success: true,
      message: "TIN সার্টিফিকেট API ডেটা লোড সফল",
      data: formattedCertificate
    });
    
  } catch (error) {
    console.error("Get TIN certificate API details error:", error);
    res.status(500).json({
      success: false,
      message: "TIN সার্টিফিকেট API ডেটা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// POST - Validate TIN number with API
Userroute.post("/tin-certificate-api/validate", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { tinNumber } = req.body;

    if (!tinNumber || tinNumber.trim() === '') {
      return res.status(400).json({
        success: false,
        message: "TIN নম্বর প্রয়োজন"
      });
    }

    // Simple TIN validation (12 digits for Bangladesh)
    const tinRegex = /^\d{12}$/;
    const isValidFormat = tinRegex.test(tinNumber.trim());

    // Check if TIN exists in our database
    const existingTin = await AutoTinCertificate.findOne({
      tinNumber: tinNumber.trim(),
      user: user._id
    });

    // Check service price (lower price for validation only)
    let servicePrice = 10; // Lower price for validation
    try {
      const priceData = await PriceList.findOne({ name: "TIN Validation" });
      if (priceData && priceData.price) {
        servicePrice = priceData.price;
      }
    } catch (priceError) {
      console.error('Error fetching price:', priceError);
    }

    // Check if user wants to proceed with API check
    const { checkApi } = req.body;
    
    if (checkApi && user.balance >= servicePrice) {
      try {
        // Call external API to verify TIN
        const apiResponse = await axios.get('https://sell.ourseba.shop/proxy', {
          params: {
            token: 'eagle2',
            tin: tinNumber.trim()
          },
          timeout: 15000
        });

        const apiData = apiResponse.data.data || {};
        
        // Deduct balance only if API call is successful
        user.balance -= servicePrice;
        await user.save();

        return res.status(200).json({
          success: true,
          message: "TIN নম্বর যাচাই সম্পন্ন হয়েছে",
          data: {
            tinNumber: tinNumber.trim(),
            isValidFormat: isValidFormat,
            existsInDatabase: !!existingTin,
            apiResponse: {
              status: apiResponse.data.status,
              data: {
                nameEn: apiData.nameEn,
                fatherName: apiData.fatherName,
                motherName: apiData.motherName,
                presentAddress: apiData.presentAddress,
                status: apiData.status,
                taxZone: apiData.taxZone,
                taxCircle: apiData.taxCircle
              }
            },
            validationPrice: servicePrice,
            newBalance: user.balance,
            isValidTIN: apiResponse.data.code === 200 && apiResponse.data.status === 'success'
          }
        });
      } catch (apiError) {
        return res.status(200).json({
          success: false,
          message: "TIN API থেকে যাচাই ব্যর্থ",
          data: {
            tinNumber: tinNumber.trim(),
            isValidFormat: isValidFormat,
            existsInDatabase: !!existingTin,
            apiError: apiError.message,
            validationPrice: servicePrice,
            currentBalance: user.balance
          }
        });
      }
    }

    // Return basic validation result
    return res.status(200).json({
      success: true,
      message: "TIN নম্বর যাচাই সম্পন্ন হয়েছে",
      data: {
        tinNumber: tinNumber.trim(),
        isValidFormat: isValidFormat,
        existsInDatabase: !!existingTin,
        validationPrice: servicePrice,
        currentBalance: user.balance,
        requiresApiCheck: !existingTin
      }
    });

  } catch (error) {
    console.error("TIN validation error:", error);
    return res.status(500).json({
      success: false,
      message: "TIN নম্বর যাচাই করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});
Userroute.get("/aut-tin-certificate-api/receipt/:receiptId", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { receiptId } = req.params;
    
    if (!receiptId) {
      return res.status(400).json({
        success: false,
        message: "সার্টিফিকেট আইডি প্রয়োজন"
      });
    }
    
    // Find certificate
    const certificate = await AutoTinCertificate.findOne({
      receiptId: receiptId,
      user: user._id,
      source: 'api'
    });
    
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "TIN সার্টিফিকেট API ডেটা পাওয়া যায়নি"
      });
    }
    
    // Format response with all details
    const formattedCertificate = {
      _id: certificate._id,
      receiptId: certificate.receiptId,
      tinNumber: certificate.tinNumber,
      name: certificate.name,
      nameBangla: certificate.nameBangla,
      fatherName: certificate.fatherName,
      fatherNameBangla: certificate.fatherNameBangla,
      motherName: certificate.motherName,
      motherNameBangla: certificate.motherNameBangla,
      currentAddress: certificate.currentAddress,
      currentAddressBangla: certificate.currentAddressBangla,
      permanentAddress: certificate.permanentAddress,
      permanentAddressBangla: certificate.permanentAddressBangla,
      taxesCircle: certificate.taxesCircle,
      taxesZone: certificate.taxesZone,
      city: certificate.city,
      issueDate: certificate.issueDate,
      status: certificate.status,
      previousTIN: certificate.previousTIN,
      zoneAddress: certificate.zoneAddress,
      zonePhone: certificate.zonePhone,
      qrCode: certificate.qrCode,
      apiData: certificate.apiData,
      verificationUrl: certificate.verificationUrl,
      qrCodeData: certificate.qrCodeData,
      source: certificate.source,
      createdAt: certificate.createdAt,
      updatedAt: certificate.updatedAt
    };
    
    res.status(200).json({
      success: true,
      message: "TIN সার্টিফিকেট API ডেটা লোড সফল",
      data: formattedCertificate
    });
    
  } catch (error) {
    console.error("Get TIN certificate API details error:", error);
    res.status(500).json({
      success: false,
      message: "TIN সার্টিফিকেট API ডেটা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// Helper function to extract circle number from tax circle string
function extractCircleNumber(taxCircle) {
  if (!taxCircle) return '02';
  const match = taxCircle.match(/Circle-(\d+)/);
  return match ? match[1].padStart(2, '0') : '02';
}

// Helper function to extract zone number from tax zone string
function extractZoneNumber(taxZone) {
  if (!taxZone) return '06';
  // This is a simplified example - you'll need to map zone names to numbers
  const zoneMap = {
    'Noakhali': '06',
    'Dhaka': '01',
    'Chittagong': '02',
    // Add more mappings as needed
  };
  return zoneMap[taxZone] || '06';
}

// Helper function to extract city from address
function extractCityFromAddress(address) {
  if (!address) return 'Dhaka';
  const parts = address.split(', ');
  return parts[parts.length - 1] || 'Dhaka';
}

// Helper function to generate TIN receipt ID
function generateTinReceiptId() {
  const prefix = 'TINAPI';
  const timestamp = Date.now().toString().slice(-8);
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${randomStr}`;
}

// Helper function to generate random TIN number (for mock data)
function generateRandomTinNumber() {
  return Math.floor(100000000000 + Math.random() * 900000000000).toString();
}

// Helper function to generate QR code data
function generateTinQRCodeData(tinNumber, name, issueDate, verificationUrl, status) {
  return `TIN Certificate
TIN Number: ${tinNumber}
Name: ${name}
Issue Date: ${new Date(issueDate).toISOString().split('T')[0]}
Status: ${status || 'Active Taxpayer'}

Verify at: ${verificationUrl}`;
}


// ---------------------------------server-copy-unofficial--------------------------------------------
// Get all server copies for a user
Userroute.get("/server-copy-unofficial/all", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { page = 1, limit = 10, search = '' } = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query - using your existing schema fields
    const query = { user: user._id };
    
    // Add search functionality based on your schema fields
    if (search) {
      query.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { nameBangla: { $regex: search, $options: 'i' } },
        { nameEnglish: { $regex: search, $options: 'i' } },
        { nationalId: { $regex: search, $options: 'i' } },
        { pinNumber: { $regex: search, $options: 'i' } },
        { mobileNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // Get total count
    const total = await ServerCopyUnofficial.countDocuments(query);
    
    // Get data with pagination
    const serverCopies = await ServerCopyUnofficial.find(query)
      .select('orderId nameBangla nameEnglish nationalId pinNumber birthDate servicePrice status createdAt updatedAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    return res.status(200).json({
      success: true,
      data: serverCopies,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum
      }
    });

  } catch (error) {
    console.error("Get server copies error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch server copies",
      error: error.message
    });
  }
});

// Create server copy (unofficial) - MAIN ENDPOINT
Userroute.post("/server-copy-nid", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { nid, dob } = req.body;

    // Validate required fields
    if (!nid || !dob) {
      return res.status(400).json({
        success: false,
        message: "NID number and Date of Birth are required"
      });
    }

    // Validate NID format (10, 13, or 17 digits)
    const nidRegex = /^\d{10}$|^\d{13}$|^\d{17}$/;
    const cleanedNid = nid.replace(/\s/g, '');
    if (!nidRegex.test(cleanedNid)) {
      return res.status(400).json({
        success: false,
        message: "NID number must be 10, 13, or 17 digits"
      });
    }

    // Validate and convert date format to YYYY-MM-DD
    let formattedDob;
    
    // Check if date is in DD-MM-YYYY format
    const ddMmYyyyRegex = /^\d{2}-\d{2}-\d{4}$/;
    
    // Check if date is in YYYY-MM-DD format
    const yyyyMmDdRegex = /^\d{4}-\d{2}-\d{2}$/;
    
    if (ddMmYyyyRegex.test(dob)) {
      // Convert DD-MM-YYYY to YYYY-MM-DD
      const [day, month, year] = dob.split('-');
      formattedDob = `${year}-${month}-${day}`;
    } else if (yyyyMmDdRegex.test(dob)) {
      // Already in correct format
      formattedDob = dob;
    } else {
      return res.status(400).json({
        success: false,
        message: "Date of birth must be in DD-MM-YYYY or YYYY-MM-DD format"
      });
    }

    // Check user balance
    const servicePrice = req.body.serviceprice; // Default price, you can adjust or fetch from DB
    
    if (user.balance < servicePrice) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Required ${servicePrice}৳, your balance: ${user.balance}৳`
      });
    }

    console.log(`Fetching NID server copy for: NID=${cleanedNid}, DOB=${formattedDob}`);

    // Prepare query parameters
    const queryParams = new URLSearchParams({
      key: 'MN-QQJ1HDFFKYCj', // Your API key
      nid: cleanedNid,
      dob: formattedDob  // Use the formatted date
    }).toString();

    // Construct API URL
    const apiUrl = `https://xbdapi.store/SV/server.php?${queryParams}`;
    
    console.log('API Request URL:', apiUrl);
    
    // Make API request using axios
    const response = await axios.get(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 30000
    });

    console.log('API Response status:', response.status);
    console.log('API Response data:', JSON.stringify(response.data, null, 2));

    // Check if API response is valid
    if (!response.data) {
      throw new Error('Empty response from API');
    }

    // Parse the API response
    const apiData = response.data;
    
    // Check if API returned an error
    if (!apiData.success || apiData.code !== 200) {
      throw new Error(apiData.message || 'API returned an error');
    }

    // Extract data from response
    const nidData = apiData.data;
    
    // Map API data to your schema fields
    const serverCopyData = {
      user: user._id,
      nationalId: cleanedNid,
      birthDate: formattedDob,
      servicePrice: servicePrice,
      extractedData: apiData, // Store raw extracted data
      
      // Map fields from API response
      nameEnglish: nidData?.nameEn || 'N/A',
      nameBangla: nidData?.name || 'N/A',
      pinNumber: nidData?.pin || '',
      oldNid: nidData?.oldNid || '',
      formNumber: '',
      voterNumber: '',
      voterArea: nidData?.voterArea || '',
      mobileNumber: '',
      fatherName: nidData?.father || '',
      motherName: nidData?.mother || '',
      spouseName: '',
      education: '',
      birthPlace: nidData?.birthPlace || '',
      birthDay: nidData?.birthDay || '',
      age: nidData?.age || '',
      religion: nidData?.religion || '',
      bloodGroup: nidData?.bloodGroup || '',
      gender: nidData?.gender === 'female' ? 'Female' : (nidData?.gender === 'male' ? 'Male' : 'Other'),
      currentAddress: nidData?.presentAddress?.addressLine || '',
      permanentAddressLine: nidData?.permanentAddress?.addressLine || '',
      
      // Address objects
      presentAddress: {
        division: nidData?.presentAddress?.division || '',
        district: nidData?.presentAddress?.district || '',
        upozila: nidData?.presentAddress?.upozila || '',
        postOffice: nidData?.presentAddress?.postOffice || '',
        postalCode: nidData?.presentAddress?.postalCode || '',
        homeOrHolding: nidData?.presentAddress?.homeOrHolding || '',
        region: nidData?.presentAddress?.region || '',
        addressLine: nidData?.presentAddress?.addressLine || ''
      },
      permanentAddress: {
        division: nidData?.permanentAddress?.division || '',
        district: nidData?.permanentAddress?.district || '',
        upozila: nidData?.permanentAddress?.upozila || '',
        postOffice: nidData?.permanentAddress?.postOffice || '',
        postalCode: nidData?.permanentAddress?.postalCode || '',
        homeOrHolding: nidData?.permanentAddress?.homeOrHolding || '',
        region: nidData?.permanentAddress?.region || '',
        addressLine: nidData?.permanentAddress?.addressLine || ''
      },
      
      // Location codes
      upazilaCode: nidData?.upazilaCode || '',
      districtCode: nidData?.districtCode || '',
      
      // Photo URL
      photo: nidData?.photo || '',
      
      // API metadata
      apiOwner: apiData['Api Owner'] || '',
      apiMessage: apiData.message || '',
      apiSuccess: apiData.success || false,
      apiCode: apiData.code || 0,
      
      // API user info
      apiUserInfo: {
        username: apiData.userInfo?.username || '',
        keyType: apiData.userInfo?.keyType || '',
        balance: apiData.userInfo?.balance || '',
        expDate: apiData.userInfo?.expDate || ''
      },
      
      // Status
      status: 'completed'
    };

    // Create server copy record using your schema
    const serverCopy = new ServerCopyUnofficial(serverCopyData);
    await serverCopy.save();

    // Deduct balance
    user.balance -= servicePrice;
    await user.save();

    // Create transaction record
    const Transaction = require('../models/Transaction');
    const transaction = new Transaction({
      user: user._id,
      type: 'debit',
      amount: servicePrice,
      service: 'NID Server Copy Unofficial',
      description: `NID server copy data - NID: ${cleanedNid}, Order: ${serverCopy.orderId}`,
      reference: `SC-${serverCopy.orderId}`,
      status: 'completed',
      balanceBefore: user.balance + servicePrice,
      balanceAfter: user.balance
    });
    await transaction.save();

    // Update server copy with transaction ID
    serverCopy.transactionId = transaction._id;
    await serverCopy.save();

    // Return the API response data
    return res.status(200).json({
      success: true,
      message: "NID server copy data retrieved successfully",
      data: apiData, // Return the raw API data
      serverCopy: {
        id: serverCopy._id,
        orderId: serverCopy.orderId,
        nameEnglish: serverCopy.nameEnglish,
        nameBangla: serverCopy.nameBangla,
        nationalId: serverCopy.nationalId,
        photo: serverCopy.photo
      },
      transaction: {
        amount: servicePrice,
        balance: user.balance,
        transactionId: transaction._id
      }
    });

  } catch (error) {
    console.error("Server copy NID error:", error.message);
    console.error("Error stack:", error.stack);
    
    // Handle specific errors
    if (error.response) {
      console.error('External API error response:', error.response.data);
      return res.status(error.response.status || 500).json({
        success: false,
        message: "External service error",
        error: error.response.data?.message || error.message
      });
    }
    
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({
        success: false,
        message: "Request timeout. Please try again."
      });
    }
    
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        message: "External service is currently unavailable"
      });
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors
      });
    }
    
    return res.status(500).json({
      success: false,
      message: "Failed to fetch NID server copy data",
      error: error.message
    });
  }
});
// Get single server copy by ID
Userroute.get("/server-copy-unofficial/:orderId", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { orderId } = req.params;
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "অর্ডার আইডি প্রয়োজন"
      });
    }
    
    // Find server copy
    const serverCopy = await ServerCopyUnofficial.findOne({
      orderId: orderId,
      user: user._id
    });
    
    if (!serverCopy) {
      return res.status(404).json({
        success: false,
        message: "সার্ভার কপি পাওয়া যায়নি"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "সার্ভার কপি ডাটা লোড সফল",
      data: serverCopy
    });
    
  } catch (error) {
    console.error("Get server copy details error:", error);
    res.status(500).json({
      success: false,
      message: "সার্ভার কপি ডাটা লোড করতে ব্যর্থ হয়েছে",
      error: error.message
    });
  }
});

// Delete server copy
Userroute.delete("/server-copy-unofficial/:id", authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    const serverCopy = await ServerCopyUnofficial.findOne({
      _id: id,
      user: user._id
    });

    if (!serverCopy) {
      return res.status(404).json({
        success: false,
        message: "Server copy not found"
      });
    }

    // Delete the server copy
    await ServerCopyUnofficial.deleteOne({ _id: id });

    return res.status(200).json({
      success: true,
      message: "Server copy deleted successfully"
    });

  } catch (error) {
    console.error("Delete server copy error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete server copy",
      error: error.message
    });
  }
});

// Get notice only
Userroute.get("/service/notice/server-copy-unofficial", authenticateUser, async (req, res) => {
  try {
    const defaultNotice = '⚠️ নোটিশঃ ফরম নং হলে NIDFN জন্মতারিখ তারিখ এবং ১৩ ডিজিট হলে জন্মসাল যোগ অর্ডার করবেন';

    return res.status(200).json({
      service: defaultNotice
    });

  } catch (error) {
    console.error("Get notice error:", error);
    return res.status(200).json({
      service: defaultNotice
    });
  }
});

// In your React component
const fetchServerCopies = async () => {
  try {
    setLoadingCopies(true);
    const response = await axios.get(`${base_url}/api/user/server-copy-unofficial/all`, {
      params: {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm
      },
      headers: {
        'Authorization': `Bearer ${token}`
        // Remove userId header as it's handled by token
      }
    });
    
    if (response.data && response.data.success) {
      setServerCopies(response.data.data || []);
    } else {
      setServerCopies([]);
    }
  } catch (err) {
    console.error('Failed to fetch server copies:', err);
    toast.error('সার্ভার কপি তালিকা লোড করতে ব্যর্থ হয়েছে');
    setServerCopies([]);
  } finally {
    setLoadingCopies(false);
  }
};
// ----------------------------active-menu---------------------
Userroute.get("/service/active-menu", async (req, res) => {
  try {
    const menu = await Menu.find({ 
      isActive:true 
    });
    res.json({ 
      success: true,
       menu
    });
  } catch (error) {
    res.json({ 
      success: true,
      serviceName: "Menu"
    });
  }
});


// Add these constants at the top of your Userroute.js file, after other imports

// Define Bkash configuration
const BKASH_CONFIG = {
    // Live environment
    BASEURL: "https://tokenized.pay.bka.sh/v1.2.0-beta",
    APPKEY: "SxR1VDB9HSSwtkIV3rc5VyBntc",
    APPSECRET: "Nf7ecCmeW05jMIGxuCJt47VjaVorF5uRyHNnyvdDDBgJQKeXSHlr",
    USERNAME: "01906666775",
    PASSWORD: "-%bUT[y7YwY",
    
    // Sandbox environment (commented out as in PHP)
    // BASEURL: "https://tokenized.sandbox.bka.sh/v1.2.0-beta",
    // APPKEY: "4f6o0cjiki2rfm34kfdadl1eqq",
    // APPSECRET: "2is7hdktrekvrbljjh44ll3d9l1dtjo4pasmjvs5vl5qr3fug4b",
    // USERNAME: "sandboxTokenizedUser02",
    // PASSWORD: "sandboxTokenizedUser02@12345"
};

// Function to generate callback URL dynamically (similar to PHP)
const getCallbackUrl = (req) => {
    const protocol = req.protocol === 'https' ? 'https://' : 'http://';
    const domain = req.get('host');
    const path = req.baseUrl || ''; // You might need to adjust this based on your routing
    return `${protocol}${domain}${path}/execute-payment.php`;
};

// GET - Get Bkash configuration (for frontend)
Userroute.get("/bkash/config", authenticateUser, (req, res) => {
    try {
        const callbackUrl = getCallbackUrl(req);
        
        res.status(200).json({
            success: true,
            data: {
                baseUrl: BKASH_CONFIG.BASEURL,
                appKey: BKASH_CONFIG.APPKEY,
                callbackUrl: callbackUrl
                // Note: We don't expose secret, username, password to frontend
            }
        });
    } catch (error) {
        console.error("Bkash config error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get payment configuration"
        });
    }
});

// POST - Create Bkash payment (server-side)
Userroute.post("/bkash/create-payment", authenticateUser, async (req, res) => {
    try {
        const { amount, orderId, serviceType } = req.body;
        const user = req.user;
        
        // Validate required fields
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Valid amount is required"
            });
        }
        
        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: "Order ID is required"
            });
        }
        
        // First, get access token from Bkash
        const authResponse = await axios.post(
            `${BKASH_CONFIG.BASEURL}/tokenized/checkout/token/grant`,
            {
                app_key: BKASH_CONFIG.APPKEY,
                app_secret: BKASH_CONFIG.APPSECRET
            },
            {
                headers: {
                    'username': BKASH_CONFIG.USERNAME,
                    'password': BKASH_CONFIG.PASSWORD,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (!authResponse.data || !authResponse.data.id_token) {
            throw new Error('Failed to get Bkash access token');
        }
        
        const idToken = authResponse.data.id_token;
        const callbackUrl = getCallbackUrl(req);
        
        // Create payment request
        const paymentResponse = await axios.post(
            `${BKASH_CONFIG.BASEURL}/tokenized/checkout/create`,
            {
                mode: '0011', // Merchant QR
                payerReference: user._id.toString(),
                callbackURL: callbackUrl,
                amount: amount.toString(),
                currency: 'BDT',
                intent: 'sale',
                merchantInvoiceNumber: orderId
            },
            {
                headers: {
                    'Authorization': idToken,
                    'X-APP-Key': BKASH_CONFIG.APPKEY,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (!paymentResponse.data || !paymentResponse.data.paymentID) {
            throw new Error('Failed to create Bkash payment');
        }
        
        // Save payment record in your database
        const Payment = require("../models/Payment");
        const payment = new Payment({
            user: user._id,
            orderId: orderId,
            paymentId: paymentResponse.data.paymentID,
            amount: amount,
            currency: 'BDT',
            status: 'initiated',
            paymentMethod: 'bkash',
            serviceType: serviceType || 'deposit',
            bkashData: {
                paymentID: paymentResponse.data.paymentID,
                bkashURL: paymentResponse.data.bkashURL,
                successCallbackUrl: callbackUrl
            }
        });
        
        await payment.save();
        
        res.status(200).json({
            success: true,
            message: "Payment initiated successfully",
            data: {
                paymentID: paymentResponse.data.paymentID,
                bkashURL: paymentResponse.data.bkashURL,
                paymentPageURL: paymentResponse.data.paymentPageURL,
                amount: amount,
                orderId: orderId
            }
        });
        
    } catch (error) {
        console.error("Create Bkash payment error:", error);
        
        if (error.response) {
            console.error("Bkash API error:", error.response.data);
        }
        
        res.status(500).json({
            success: false,
            message: "Failed to create payment",
            error: error.message
        });
    }
});// Helper function to ensure bKash deposit method exists

// POST - Execute Bkash payment (callback endpoint)
Userroute.post("/execute-payment", async (req, res) => {
    try {
        const { paymentID } = req.query || req.body;
        
        if (!paymentID) {
            return res.status(400).json({
                success: false,
                message: "Payment ID is required"
            });
        }
        
        // First get access token
        const authResponse = await axios.post(
            `${BKASH_CONFIG.BASEURL}/tokenized/checkout/token/grant`,
            {
                app_key: BKASH_CONFIG.APPKEY,
                app_secret: BKASH_CONFIG.APPSECRET
            },
            {
                headers: {
                    'username': BKASH_CONFIG.USERNAME,
                    'password': BKASH_CONFIG.PASSWORD,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (!authResponse.data || !authResponse.data.id_token) {
            throw new Error('Failed to get Bkash access token');
        }
        
        const idToken = authResponse.data.id_token;
        
        // Execute payment
        const executeResponse = await axios.post(
            `${BKASH_CONFIG.BASEURL}/tokenized/checkout/execute`,
            {
                paymentID: paymentID
            },
            {
                headers: {
                    'Authorization': idToken,
                    'X-APP-Key': BKASH_CONFIG.APPKEY,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (!executeResponse.data) {
            throw new Error('Failed to execute payment');
        }
        
        const paymentData = executeResponse.data;
        
        // Update payment record in database
        const Payment = require("../models/Payment");
        const payment = await Payment.findOne({ paymentId: paymentID });
        
        if (payment) {
            payment.status = paymentData.transactionStatus === 'Completed' ? 'completed' : 'failed';
            payment.transactionId = paymentData.trxID;
            payment.bkashData.response = paymentData;
            payment.completedAt = new Date();
            
            await payment.save();
            
            // If payment is successful, update user balance or order status
            if (payment.status === 'completed') {
                const user = await User.findById(payment.user);
                if (user) {
                    user.balance += payment.amount;
                    user.totaldeposit += payment.amount;
                    await user.save();
                }
            }
        }
        
        // Return response for Bkash callback
        res.json({
            success: true,
            message: "Payment processed",
            data: paymentData
        });
        
    } catch (error) {
        console.error("Execute payment error:", error);
        
        if (error.response) {
            console.error("Bkash API error:", error.response.data);
        }
        
        res.status(500).json({
            success: false,
            message: "Failed to execute payment",
            error: error.message
        });
    }
});

// POST - Query payment status
Userroute.post("/bkash/query-payment", authenticateUser, async (req, res) => {
    try {
        const { paymentID } = req.body;
        
        if (!paymentID) {
            return res.status(400).json({
                success: false,
                message: "Payment ID is required"
            });
        }
        
        // Get access token
        const authResponse = await axios.post(
            `${BKASH_CONFIG.BASEURL}/tokenized/checkout/token/grant`,
            {
                app_key: BKASH_CONFIG.APPKEY,
                app_secret: BKASH_CONFIG.APPSECRET
            },
            {
                headers: {
                    'username': BKASH_CONFIG.USERNAME,
                    'password': BKASH_CONFIG.PASSWORD,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (!authResponse.data || !authResponse.data.id_token) {
            throw new Error('Failed to get Bkash access token');
        }
        
        const idToken = authResponse.data.id_token;
        
        // Query payment
        const queryResponse = await axios.post(
            `${BKASH_CONFIG.BASEURL}/tokenized/checkout/payment/status`,
            {
                paymentID: paymentID
            },
            {
                headers: {
                    'Authorization': idToken,
                    'X-APP-Key': BKASH_CONFIG.APPKEY,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        res.status(200).json({
            success: true,
            data: queryResponse.data
        });
        
    } catch (error) {
        console.error("Query payment error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to query payment status",
            error: error.message
        });
    }
});

// GET - Get payment history for user
Userroute.get("/bkash/payment-history", authenticateUser, async (req, res) => {
    try {
        const user = req.user;
        
        const Payment = require("../models/Payment");
        const payments = await Payment.find({ user: user._id })
            .sort({ createdAt: -1 })
            .limit(20);
        
        res.status(200).json({
            success: true,
            data: payments
        });
        
    } catch (error) {
        console.error("Payment history error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get payment history",
            error: error.message
        });
    }
});

Userroute.post("/deposit/bkash", authenticateUser, async (req, res) => {
    try {
        const { amount } = req.body;
        const user = req.user;
        
        console.log("📱 Bkash deposit request from:", user.email);
        console.log("💰 Amount:", amount);
        
        // Validate amount
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Valid amount is required"
            });
        }
        
        // Check minimum amount
        if (amount < 10) {
            return res.status(400).json({
                success: false,
                message: "Minimum deposit amount is 10 BDT"
            });
        }
        
        // Check maximum amount (optional)
        if (amount > 50000) {
            return res.status(400).json({
                success: false,
                message: "Maximum deposit amount is 50,000 BDT"
            });
        }
        
        // First, get access token from Bkash
        console.log("🔑 Getting Bkash access token...");
        const authResponse = await axios.post(
            `${BKASH_CONFIG.BASEURL}/tokenized/checkout/token/grant`,
            {
                app_key: BKASH_CONFIG.APPKEY,
                app_secret: BKASH_CONFIG.APPSECRET
            },
            {
                headers: {
                    'username': BKASH_CONFIG.USERNAME,
                    'password': BKASH_CONFIG.PASSWORD,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (!authResponse.data || !authResponse.data.id_token) {
            throw new Error('Failed to get Bkash access token');
        }
        
        const idToken = authResponse.data.id_token;
        const callbackUrl = getCallbackUrl(req);
        const orderId = `BKASH-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const transactionId = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        
        console.log("💳 Creating Bkash payment...");
        console.log("📋 Order ID:", orderId);
        console.log("🔄 Callback URL:", callbackUrl);
        
        // Create payment request
        const paymentResponse = await axios.post(
            `${BKASH_CONFIG.BASEURL}/tokenized/checkout/create`,
            {
                mode: '0011',
                payerReference: user._id.toString(),
                callbackURL: callbackUrl,
                amount: amount.toString(),
                currency: 'BDT',
                intent: 'sale',
                merchantInvoiceNumber: orderId
            },
            {
                headers: {
                    'Authorization': idToken,
                    'X-APP-Key': BKASH_CONFIG.APPKEY,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (!paymentResponse.data || !paymentResponse.data.paymentID) {
            throw new Error('Failed to create Bkash payment');
        }
        
        console.log("✅ Payment created:", paymentResponse.data.paymentID);
        
        // Create deposit record
        const Deposit = require("../models/Deposit");
        
        const deposit = new Deposit({
            user: user._id,
            depositMethod: null, // Remove the method reference
            accountNumber: user.phone || user.email || user._id.toString(),
            transactionId: transactionId,
            amount: amount,
            status: 'pending',
            userNotes: `bKash Auto Payment - Order: ${orderId}`,
            // Remove depositMethodDetails since we don't have a method object
            paymentMethod: 'bkash',
            paymentId: paymentResponse.data.paymentID,
            bkashData: {
                paymentID: paymentResponse.data.paymentID,
                bkashURL: paymentResponse.data.bkashURL,
                paymentPageURL: paymentResponse.data.paymentPageURL,
                orderId: orderId,
                createResponse: paymentResponse.data
            },
            isAutoPayment: true
        });
        
        await deposit.save();
        console.log("💾 Deposit record saved:", deposit._id);
        
        res.status(200).json({
            success: true,
            message: "Payment initiated successfully",
            data: {
                depositId: deposit._id,
                orderId: orderId,
                transactionId: transactionId,
                amount: amount,
                paymentID: paymentResponse.data.paymentID,
                bkashURL: paymentResponse.data.bkashURL,
                paymentPageURL: paymentResponse.data.paymentPageURL,
                redirectUrl: paymentResponse.data.bkashURL,
                depositMethod: null // Remove method data from response
            }
        });
        
    } catch (error) {
        console.error("❌ Bkash auto deposit error:", error.message);
        
        if (error.response) {
            console.error("📡 Bkash API response:", error.response.data);
        }
        
        res.status(500).json({
            success: false,
            message: "Failed to create payment",
            error: error.message,
            details: error.response?.data || null
        });
    }
});




// ==================== NID MAKE 2 SERVICE ROUTES ====================

// Import the model at the top with other imports
const NidMake2 = require("../models/NidMake2");

/**
 * ============================================
 * SERVICE PRICE ROUTES
 * ============================================
 */

// GET - Service price for NID Make 2
// Endpoint: /api/user/service/price/nid-make2
Userroute.get("/service/price/nid-make2", async (req, res) => {
    try {
        let servicePrice = 200; // Default price
        
        // Try to get price from PriceList model if it exists
        try {
            const PriceList = require("../models/PriceList");
            const priceData = await PriceList.findOne({ 
                name: "এনআইডি মেক 2" 
            });
            
            if (priceData && priceData.price) {
                servicePrice = priceData.price;
            }
        } catch (priceError) {
            console.error('Error fetching price from PriceList:', priceError.message);
            // Continue with default price
        }
        
        res.status(200).json({
            success: true,
            price: servicePrice,
            serviceName: "এনআইডি মেক 2"
        });
        
    } catch (error) {
        console.error("Get NID Make 2 price error:", error);
        res.status(500).json({
            success: false,
            message: "সেবার মূল্য লোড করতে ব্যর্থ হয়েছে",
            error: error.message,
            price: 200 // Fallback price
        });
    }
});

//  * ============================================
//  * NID MAKE 2 ORDER ROUTES
//  * ============================================

const nidMake2Storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../public/uploads/nid-make2-orders');
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'nidmake2-' + file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const uploadNidMake2Files = multer({
    storage: nidMake2Storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: function (req, file, cb) {
        const allowedTypes = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/jpg',
            'image/webp'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF and image files are allowed!'));
        }
    }
});

// POST - Extract NID data from PDF (Simple version - no balance deduction)
Userroute.post("/sign-to-nid2", uploadPdfSimple.single('pdf'), async (req, res) => {
  try {
    // Check if file exists
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No PDF file uploaded'
      });
    }

    console.log('Processing PDF file:', req.file.originalname, 'Size:', req.file.size);

    // Prepare form data for external API
    const formData = new FormData();
    
    // Add API key from your screenshot
    const API_KEY = '34e56a8765d1f7bbb758624e3b17f940';
    formData.append('key', API_KEY);
    
    // Add PDF file as buffer
    formData.append('pdf', req.file.buffer, req.file.originalname);
    
    console.log('Sending request to external API...');
    
    // Call external API from your screenshot
    const apiResponse = await axios.post('https://xbdapi.store/SIGN-API/signtonid.php', formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 60000, // 60 seconds timeout
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    console.log('API Response status:', apiResponse);
    
    // Return whatever the API returns
    return res.status(200).json({
      success: true,
      message: 'PDF processed successfully',
      data: apiResponse.data
    });

  } catch (error) {
    console.error('PDF extraction error:', error.message);
    
    // Return appropriate error response
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({
        success: false,
        message: 'Request timeout. Please try again.'
      });
    }
    
    if (error.response) {
      // The external API returned an error
      return res.status(error.response.status).json({
        success: false,
        message: 'External service error',
        error: error.response.data
      });
    }
    
    // Handle network errors
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        message: 'External service is currently unavailable'
      });
    }
    
    // Handle multer errors
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 10MB'
        });
      }
    }
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});


Userroute.post("/create-nid-make2-order", 
    authenticateUser, 
    uploadNidMake2Files.fields([
        { name: 'pdfFile', maxCount: 1 },
        { name: 'nidImage', maxCount: 1 },
        { name: 'signImage', maxCount: 1 }
    ]), 
    async (req, res) => {
        try {
            const user = req.user;
            const files = req.files || {};
            
            console.log('Creating NID Make 2 order for user:', user.email);
            console.log('Files received:', Object.keys(files).length > 0 ? 'Yes' : 'No');
            console.log('Body data keys:', Object.keys(req.body));

            // =========== VALIDATE REQUIRED FIELDS ===========
            const requiredFields = [
                'nameBangla', 'nameEnglish', 'nationalId', 'pin',
                'dateOfBirth', 'fatherName', 'motherName', 'birthPlace',
                'dateOfToday', 'address'
            ];

            const missingFields = [];
            for (const field of requiredFields) {
                if (!req.body[field] || req.body[field].toString().trim() === '') {
                    missingFields.push(field);
                }
            }

            if (missingFields.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `নিম্নলিখিত 필드গুলি পূরণ করুন: ${missingFields.join(', ')}`
                });
            }

            // =========== HANDLE NID PHOTO ===========
            let nidPhoto = '';
            let nidPhotoType = 'none';

            // Check if NID photo uploaded as file
            if (files.nidImage && files.nidImage[0]) {
                nidPhoto = `${base_url_from_env}/uploads/nid-make2-orders/${files.nidImage[0].filename}`;
                nidPhotoType = 'file';
                console.log('NID photo uploaded as file:', nidPhoto);
            } 
            // Check if NID photo provided as URL (from PDF extraction)
            else if (req.body.nidImageUrl && req.body.nidImageUrl.trim() !== '') {
                nidPhoto = req.body.nidImageUrl.trim();
                nidPhotoType = 'url';
                console.log('NID photo provided as URL:', nidPhoto);
            } 
            else {
                return res.status(400).json({
                    success: false,
                    message: "এনআইডি ছবি আপলোড করুন অথবা URL প্রদান করুন"
                });
            }

            // =========== HANDLE SIGNATURE ===========
            let signature = null;
            let signatureType = 'none';

            // Check if signature uploaded as file
            if (files.signImage && files.signImage[0]) {
                signature = `${base_url_from_env}/uploads/nid-make2-orders/${files.signImage[0].filename}`;
                signatureType = 'file';
                console.log('Signature uploaded as file:', signature);
            } 
            // Check if signature provided as URL (from PDF extraction)
            else if (req.body.signImageUrl && req.body.signImageUrl.trim() !== '') {
                signature = req.body.signImageUrl.trim();
                signatureType = 'url';
                console.log('Signature provided as URL:', signature);
            }

            // =========== HANDLE PDF FILE ===========
            let pdfFile = null;
            if (files.pdfFile && files.pdfFile[0]) {
                pdfFile = `/uploads/nid-make2-orders/${files.pdfFile[0].filename}`;
                console.log('PDF file uploaded:', pdfFile);
            }

            // =========== GET SERVICE PRICE ===========
            let servicePrice = 200; // Default price
            try {
                const PriceList = require("../models/PriceList");
                const priceData = await PriceList.findOne({ 
                    name: "এনআইডি মেক 2" 
                });
                if (priceData && priceData.price) {
                    servicePrice = priceData.price;
                }
            } catch (priceError) {
                console.error('Error fetching price:', priceError.message);
                // Continue with default price
            }

            // =========== CHECK USER BALANCE ===========
            if (user.balance < servicePrice) {
                return res.status(400).json({
                    success: false,
                    message: `অপর্যাপ্ত ব্যালেন্স। প্রয়োজন ${servicePrice} টাকা, আপনার ব্যালেন্স: ${user.balance} টাকা`,
                    requiredBalance: servicePrice,
                    currentBalance: user.balance
                });
            }

            // =========== GENERATE RECEIPT ID ===========
            const receiptId = `NID2-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

            // =========== CAPTURE IP AND USER AGENT ===========
            const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            const userAgent = req.headers['user-agent'];

            // =========== CREATE NID MAKE 2 ORDER ===========
            const nidMake2Order = new NidMake2({
                // User Information
                user: user._id,
                userId: user._id.toString(),
                username: user.fullname || user.name || 'Unknown',
                userEmail: user.email,
                receiptId: receiptId,
                
                // Personal Information
                nameBangla: req.body.nameBangla.trim(),
                nameEnglish: req.body.nameEnglish.trim(),
                nationalId: req.body.nationalId.trim(),
                pin: req.body.pin.trim(),
                dateOfBirth: req.body.dateOfBirth,
                fatherName: req.body.fatherName.trim(),
                motherName: req.body.motherName.trim(),
                birthPlace: req.body.birthPlace.trim(),
                bloodGroup: req.body.bloodGroup || '',
                dateOfToday: req.body.dateOfToday,
                address: req.body.address.trim(),
                gender: req.body.gender || '',
                religion: req.body.religion || '',
                
                // File Information
                pdfFile: pdfFile,
                nidPhoto: nidPhoto,
                nidPhotoType: nidPhotoType,
                signature: signature,
                signatureType: signatureType,
                
                // Payment Information
                servicePrice: servicePrice,
                
                // Extraction Reference (if available)
                extractionId: req.body.extractionId || null,
                extractionData: req.body.extractionData ? JSON.parse(req.body.extractionData) : null,
                
                // Metadata
                ipAddress: ipAddress,
                userAgent: userAgent,
                
                // Status
                status: 'pending'
            });

            await nidMake2Order.save();
            
            // =========== DEDUCT BALANCE ===========
            const balanceBefore = user.balance;
            user.balance -= servicePrice;
            await user.save();
            const balanceAfter = user.balance;

            // =========== CREATE TRANSACTION RECORD ===========
            const Transaction = require("../models/Transaction");
            const transaction = new Transaction({
                user: user._id,
                type: 'debit',
                amount: servicePrice,
                service: 'এনআইডি মেক 2',
                description: `এনআইডি মেক 2 অর্ডার - রসিদ: ${receiptId}, নাম: ${req.body.nameBangla}`,
                reference: receiptId,
                status: 'completed',
                balanceBefore: balanceBefore,
                balanceAfter: balanceAfter,
                metadata: {
                    orderId: nidMake2Order._id,
                    receiptId: receiptId,
                    nationalId: req.body.nationalId
                }
            });
            await transaction.save();

            // =========== UPDATE ORDER WITH TRANSACTION ID ===========
            nidMake2Order.transactionId = transaction._id;
            await nidMake2Order.save();

            console.log('NID Make 2 order created successfully:', receiptId);

            // =========== RETURN SUCCESS RESPONSE ===========
            res.status(201).json({
                success: true,
                message: "এনআইডি মেক 2 অর্ডার সফলভাবে তৈরি হয়েছে",
                data: {
                    _id: nidMake2Order._id,
                    receiptId: nidMake2Order.receiptId,
                    nameBangla: nidMake2Order.nameBangla,
                    nameEnglish: nidMake2Order.nameEnglish,
                    nationalId: nidMake2Order.nationalId,
                    servicePrice: nidMake2Order.servicePrice,
                    nidPhotoType: nidMake2Order.nidPhotoType,
                    signatureType: nidMake2Order.signatureType,
                    hasPdfFile: !!nidMake2Order.pdfFile,
                    status: nidMake2Order.status,
                    createdAt: nidMake2Order.createdAt
                },
                transaction: {
                    id: transaction._id,
                    amount: transaction.amount,
                    balance: user.balance,
                    reference: transaction.reference
                }
            });

        } catch (error) {
            console.error('Create NID Make 2 order error:', error);
            
            // =========== CLEAN UP UPLOADED FILES ON ERROR ===========
            if (req.files) {
                Object.values(req.files).forEach(fileArray => {
                    fileArray.forEach(file => {
                        if (file.path && fs.existsSync(file.path)) {
                            try {
                                fs.unlinkSync(file.path);
                                console.log('Cleaned up file:', file.path);
                            } catch (unlinkError) {
                                console.error('Error cleaning up file:', unlinkError.message);
                            }
                        }
                    });
                });
            }

            // =========== HANDLE DUPLICATE KEY ERROR ===========
            if (error.code === 11000) {
                return res.status(400).json({
                    success: false,
                    message: "এই রসিদ আইডি ইতিমধ্যে ব্যবহৃত হয়েছে, আবার চেষ্টা করুন"
                });
            }

            // =========== HANDLE VALIDATION ERRORS ===========
            if (error.name === 'ValidationError') {
                const errors = Object.values(error.errors).map(err => err.message);
                return res.status(400).json({
                    success: false,
                    message: "ডেটা ভ্যালিডেশন ব্যর্থ হয়েছে",
                    errors: errors
                });
            }

            // =========== HANDLE OTHER ERRORS ===========
            res.status(500).json({
                success: false,
                message: "এনআইডি মেক 2 অর্ডার তৈরি করতে সমস্যা হয়েছে",
                error: process.env.NODE_ENV === 'development' ? error.message : 'অভ্যন্তরীণ সার্ভার ত্রুটি'
            });
        }
    }
);

Userroute.get("/nid-make2-orders", authenticateUser, async (req, res) => {
    try {
        const user = req.user;
        
        // Pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        // Search filter
        const search = req.query.search || '';
        
        // Build query
        let query = { userId: user._id.toString() };
        
        if (search && search.trim() !== '') {
            query.$or = [
                { receiptId: { $regex: search, $options: 'i' } },
                { nameBangla: { $regex: search, $options: 'i' } },
                { nameEnglish: { $regex: search, $options: 'i' } },
                { nationalId: { $regex: search, $options: 'i' } }
            ];
        }
        
        // Get total count for pagination
        const total = await NidMake2.countDocuments(query);
        
        // Get orders with pagination
        const orders = await NidMake2.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('-extractionData -__v'); // Exclude large fields
        
        // Format response using toSafeResponse method
        const formattedOrders = orders.map(order => order.toSafeResponse());
        
        res.status(200).json({
            success: true,
            message: "এনআইডি মেক 2 অর্ডার তালিকা",
            data: formattedOrders,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1
            }
        });
        
    } catch (error) {
        console.error("Get NID Make 2 orders error:", error);
        res.status(500).json({
            success: false,
            message: "এনআইডি মেক 2 অর্ডার তালিকা লোড করতে ব্যর্থ হয়েছে",
            error: error.message
        });
    }
});

Userroute.get("/nid-make2-order/:receiptId", authenticateUser, async (req, res) => {
    try {
        const user = req.user;
        const { receiptId } = req.params;
        
        if (!receiptId) {
            return res.status(400).json({
                success: false,
                message: "রসিদ আইডি প্রয়োজন"
            });
        }
        
        // Find order by receiptId
        const order = await NidMake2.findOne({
            receiptId: receiptId,
            userId: user._id.toString()
        });
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "এনআইডি মেক 2 অর্ডার পাওয়া যায়নি"
            });
        }
        
        res.status(200).json({
            success: true,
            message: "এনআইডি মেক 2 অর্ডার ডাটা লোড সফল",
            data: order
        });
        
    } catch (error) {
        console.error("Get NID Make 2 order details error:", error);
        res.status(500).json({
            success: false,
            message: "এনআইডি মেক 2 অর্ডার ডাটা লোড করতে ব্যর্থ হয়েছে",
            error: error.message
        });
    }
});

Userroute.get("/nid-make2-order/id/:id", authenticateUser, async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        
        // Validate MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "অবৈধ অর্ডার আইডি"
            });
        }
        
        // Find order by _id
        const order = await NidMake2.findOne({
            _id: id,
            userId: user._id.toString()
        });
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "এনআইডি মেক 2 অর্ডার পাওয়া যায়নি"
            });
        }
        
        res.status(200).json({
            success: true,
            message: "এনআইডি মেক 2 অর্ডার ডাটা লোড সফল",
            data: order
        });
        
    } catch (error) {
        console.error("Get NID Make 2 order by ID error:", error);
        res.status(500).json({
            success: false,
            message: "এনআইডি মেক 2 অর্ডার ডাটা লোড করতে ব্যর্থ হয়েছে",
            error: error.message
        });
    }
});

Userroute.delete("/nid-make2-order/:id", authenticateUser, async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        
        // Validate MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "অবৈধ অর্ডার আইডি"
            });
        }
        
        // Find order
        const order = await NidMake2.findOne({
            _id: id,
            userId: user._id.toString()
        });
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "এনআইডি মেক 2 অর্ডার পাওয়া যায়নি"
            });
        }
        
        // Check if order can be deleted (only pending orders)
        if (order.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: "শুধুমাত্র পেন্ডিং অর্ডার ডিলিট করা যাবে। বর্তমান স্ট্যাটাস: " + order.status
            });
        }
        
        // Store order info for response before deletion
        const receiptId = order.receiptId;
        const refundAmount = order.servicePrice;
        
        // Delete physical files if they exist
        if (order.pdfFile && order.pdfFile.startsWith('/uploads/')) {
            const filePath = path.join(__dirname, '..', order.pdfFile);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log('Deleted PDF file:', filePath);
            }
        }
        
        if (order.nidPhoto && order.nidPhotoType === 'file' && order.nidPhoto.startsWith('/uploads/')) {
            const filePath = path.join(__dirname, '..', order.nidPhoto);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log('Deleted NID photo file:', filePath);
            }
        }
        
        if (order.signature && order.signatureType === 'file' && order.signature.startsWith('/uploads/')) {
            const filePath = path.join(__dirname, '..', order.signature);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log('Deleted signature file:', filePath);
            }
        }
        
        // Delete order from database
        await order.deleteOne();
        
        // Refund balance to user
        const balanceBefore = user.balance;
        user.balance += refundAmount;
        await user.save();
        const balanceAfter = user.balance;
        
        // Create transaction record for refund
        const Transaction = require("../models/Transaction");
        const transaction = new Transaction({
            user: user._id,
            type: 'credit',
            amount: refundAmount,
            service: 'এনআইডি মেক 2 রিফান্ড',
            description: `অর্ডার ডিলিটের জন্য রিফান্ড - রসিদ: ${receiptId}`,
            reference: `REFUND-${receiptId}`,
            status: 'completed',
            balanceBefore: balanceBefore,
            balanceAfter: balanceAfter,
            metadata: {
                orderReceiptId: receiptId,
                refundReason: 'order_deleted_by_user'
            }
        });
        await transaction.save();
        
        res.status(200).json({
            success: true,
            message: "এনআইডি মেক 2 অর্ডার সফলভাবে ডিলিট করা হয়েছে",
            data: {
                receiptId: receiptId,
                refundedAmount: refundAmount,
                newBalance: user.balance,
                transactionId: transaction._id,
                deletedAt: new Date()
            }
        });
        
    } catch (error) {
        console.error("Delete NID Make 2 order error:", error);
        res.status(500).json({
            success: false,
            message: "এনআইডি मेক 2 অর্ডার ডিলিট করতে ব্যর্থ হয়েছে",
            error: error.message
        });
    }
});

Userroute.post("/nid-make2-order/:receiptId/download", authenticateUser, async (req, res) => {
    try {
        const user = req.user;
        const { receiptId } = req.params;
        
        if (!receiptId) {
            return res.status(400).json({
                success: false,
                message: "রসিদ আইডি প্রয়োজন"
            });
        }
        
        // Find order
        const order = await NidMake2.findOne({
            receiptId: receiptId,
            userId: user._id.toString()
        });
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "এনআইডি মেক 2 অর্ডার পাওয়া যায়নি"
            });
        }
        
        // Increment download count using model method
        await order.incrementDownload();
        
        res.status(200).json({
            success: true,
            message: "ডাউনলোড কাউন্ট আপডেট করা হয়েছে",
            data: {
                receiptId: order.receiptId,
                downloadCount: order.downloadCount,
                lastDownloadedAt: order.lastDownloadedAt
            }
        });
        
    } catch (error) {
        console.error("Increment download count error:", error);
        res.status(500).json({
            success: false,
            message: "ডাউনলোড কাউন্ট আপডেট করতে ব্যর্থ হয়েছে",
            error: error.message
        });
    }
});

Userroute.get("/nid-make2-statistics", authenticateUser, async (req, res) => {
    try {
        const user = req.user;
        
        // Use model method to get statistics
        const statistics = await NidMake2.getOrderStatistics(user._id.toString());
        
        res.status(200).json({
            success: true,
            message: "এনআইডি মেক 2 পরিসংখ্যান",
            data: statistics
        });
        
    } catch (error) {
        console.error("Get NID Make 2 statistics error:", error);
        res.status(500).json({
            success: false,
            message: "পরিসংখ্যান লোড করতে ব্যর্থ হয়েছে",
            error: error.message
        });
    }
});

Userroute.put("/nid-make2-order/:id/status", authenticateUser, async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const { status, adminNotes } = req.body;
        
        // Check if user is admin
        if (user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: "এই অপারেশনের জন্য অ্যাডমিন অনুমতি প্রয়োজন"
            });
        }
        
        // Validate MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "অবৈধ অর্ডার আইডি"
            });
        }
        
        // Validate status
        const validStatuses = ['pending', 'processing', 'completed', 'cancelled', 'refunded'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `অবৈধ স্ট্যাটাস। অনুমোদিত স্ট্যাটাস: ${validStatuses.join(', ')}`
            });
        }
        
        // Find and update order
        const order = await NidMake2.findById(id);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "এনআইডি মেক 2 অর্ডার পাওয়া যায়নি"
            });
        }
        
        // Update status
        order.status = status;
        if (adminNotes) {
            order.adminNotes = adminNotes;
        }
        await order.save();
        
        res.status(200).json({
            success: true,
            message: "এনআইডি মেক 2 অর্ডার স্ট্যাটাস আপডেট করা হয়েছে",
            data: {
                _id: order._id,
                receiptId: order.receiptId,
                status: order.status,
                adminNotes: order.adminNotes,
                updatedAt: order.updatedAt
            }
        });
        
    } catch (error) {
        console.error("Update NID Make 2 order status error:", error);
        res.status(500).json({
            success: false,
            message: "অর্ডার স্ট্যাটাস আপডেট করতে ব্যর্থ হয়েছে",
            error: error.message
        });
    }
});

Userroute.get("/nid-make2/status", async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            message: "এনআইডি মেক 2 সেবা চালু আছে",
            data: {
                serviceName: "এনআইডি মেক 2",
                status: "active",
                version: "1.0.0",
                features: [
                    "PDF থেকে ডেটা এক্সট্রাক্ট",
                    "ছবি ও স্বাক্ষর আপলোড",
                    "অর্ডার ট্র্যাকিং",
                    "ডাউনলোড ইতিহাস"
                ]
            }
        });
    } catch (error) {
        console.error("NID Make 2 status error:", error);
        res.status(500).json({
            success: false,
            message: "সেবার অবস্থা পরীক্ষা করতে ব্যর্থ হয়েছে",
            error: error.message
        });
    }
});

Userroute.post("/nid-make2-orders/bulk-delete", authenticateUser, async (req, res) => {
    try {
        const user = req.user;
        const { receiptIds } = req.body;
        
        if (!receiptIds || !Array.isArray(receiptIds) || receiptIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: "রসিদ আইডির তালিকা প্রয়োজন"
            });
        }
        
        // Only allow in development environment
        if (process.env.NODE_ENV !== 'development') {
            return res.status(403).json({
                success: false,
                message: "এই অপারেশন শুধুমাত্র ডেভেলপমেন্ট মোডে অনুমোদিত"
            });
        }
        
        // Find and delete orders
        const result = await NidMake2.deleteMany({
            receiptId: { $in: receiptIds },
            userId: user._id.toString()
        });
        
        res.status(200).json({
            success: true,
            message: `${result.deletedCount} টি অর্ডার ডিলিট করা হয়েছে`,
            data: {
                deletedCount: result.deletedCount,
                receiptIds: receiptIds
            }
        });
        
    } catch (error) {
        console.error("Bulk delete NID Make 2 orders error:", error);
        res.status(500).json({
            success: false,
            message: "বাল্ক ডিলিট করতে ব্যর্থ হয়েছে",
            error: error.message
        });
    }
});

// ==================== END OF NID MAKE 2 SERVICE ROUTES ====================

// ==================== SIMPLE AUTO METHOD STATUS ROUTE ====================
const AutoMethod = require("../models/AutoMethod");

// GET - Get auto method status (ON/OFF) for users
Userroute.get("/auto-method-status", async (req, res) => {
    try {
        const autoMethod = await AutoMethod.findOne();
        
        // If no settings exist, return false (OFF) by default
        const status = autoMethod ? autoMethod.status : false;
        
        res.status(200).json({
            success: true,
            status: status,
            isActive: status
        });
        
    } catch (error) {
        console.error("Auto method status error:", error);
        res.status(500).json({
            success: false,
            status: false,
            isActive: false,
            message: "Failed to get auto method status"
        });
    }
});



// ==================== WEBSITE STATUS ROUTE ====================
const WebsiteStatus = require("../models/WebsiteStatus");

// GET - Get website status (ON/OFF) for users
Userroute.get("/website-status", async (req, res) => {
    try {
        const websiteStatus = await WebsiteStatus.findOne();
        
        // If no settings exist, return true (ACTIVE) by default
        const isActive = websiteStatus ? websiteStatus.isActive : true;
        const message = websiteStatus ? websiteStatus.message : '';
        
        res.status(200).json({
            success: true,
            isActive: isActive,
            status: isActive ? 'active' : 'maintenance',
            message: message,
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error("Website status error:", error);
        res.status(500).json({
            success: false,
            isActive: false, // Default to maintenance mode on error
            status: 'error',
            message: "Failed to get website status",
            error: error.message
        });
    }
});


// ==================== AUTO BIRTH CERTIFICATE ROUTE ====================

// GET auto birth certificate by name (Bangla or English)
Userroute.get("/birth-certificate-data/search-by-name", authenticateUser, async (req, res) => {
    try {
        const { name } = req.query;
        const user = req.user;
        
        console.log("Searching birth certificate by name:", name, "for user:", user.email);
        
        // Validate input
        if (!name || name.trim() === '') {
            return res.status(400).json({
                success: false,
                message: "Name is required for search"
            });
        }
        
        // Create search query - search in both Bangla and English name fields
        const searchRegex = new RegExp(name.trim(), 'i'); // 'i' for case-insensitive
        
        const query = {
            $or: [
                { nameBangla: searchRegex },
                { nameEnglish: searchRegex }
            ]
        };
        
        // Find certificates matching the name
        const certificates = await AutoBirthCertificate.find(query)
            .populate('user', 'fullname email whatsappnumber')
            .populate('transactionId', 'amount status')
            .sort({ createdAt: -1 });
        
        if (!certificates || certificates.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No birth certificate found with the provided name"
            });
        }
               // Format the response
        const formattedCertificates = certificates.map(cert => ({
            _id: cert._id,
            receiptId: cert.receiptId,
            ubrn: cert.ubrn,
            
            // Personal Information
            nameBangla: cert.nameBangla,
            nameEnglish: cert.nameEnglish,
            fatherNameBangla: cert.fatherNameBangla,
            fatherNameEnglish: cert.fatherNameEnglish,
            motherNameBangla: cert.motherNameBangla,
            motherNameEnglish: cert.motherNameEnglish,
            birthPlaceBangla: cert.birthPlaceBangla,
            birthPlaceEnglish: cert.birthPlaceEnglish,
            gender: cert.gender,
            
            // Birth Registration Details
            birthRegistrationNumber: cert.birthRegistrationNumber,
            dateOfRegistration: cert.dateOfRegistration,
            dateOfBirth: cert.dateOfBirth,
            dateOfBirthInWords: cert.dateOfBirthInWords,
            dateOfIssuance: cert.dateOfIssuance,
            
            // Location Details
            registerOfficeAddress: cert.registerOfficeAddress,
            upazilaPourashavaCityCorporationZila: cert.upazilaPourashavaCityCorporationZila,
            permanentAddressBangla: cert.permanentAddressBangla,
            permanentAddressEnglish: cert.permanentAddressEnglish,
            
            // Technical Details
            qrLink: cert.qrLink,
            leftBarcode: cert.leftBarcode,
            autoBarcode: cert.autoBarcode,
            
            // Service Details
            serviceName: cert.serviceName,
            servicePrice: cert.servicePrice,
            
            // Status
            status: cert.status,
            verificationKey: cert.verificationKey,
            
            // User Info
            user: cert.user ? {
                _id: cert.user._id,
                fullname: cert.user.fullname,
                email: cert.user.email
            } : null,
            
            // Timestamps
            createdAt: cert.createdAt,
            updatedAt: cert.updatedAt
        }));

        res.status(200).json({
            success: true,
            message: `Found ${formattedCertificates.length} birth certificate(s)`,
                      count: formattedCertificates.length,
            data: formattedCertificates
        });
        
    } catch (error) {
        console.error("Search birth certificate by name error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to search birth certificate",
            error: error.message
        });
    }
});

Userroute.get("/birth-certificate-data/confirmed", authenticateUser, async (req, res) => {
    try {
        const { name,serviceprice } = req.query;
        const user = req.user;
        
        console.log("Searching birth certificate by name:", name, "for user:", user.email);
        
        // Validate input
        if (!name || name.trim() === '') {
            return res.status(400).json({
                success: false,
                message: "Name is required for search"
            });
        }
        
        // Create search query - search in both Bangla and English name fields
        const searchRegex = new RegExp(name.trim(), 'i'); // 'i' for case-insensitive
        
        const query = {
            $or: [
                { nameBangla: searchRegex },
                { nameEnglish: searchRegex }
            ]
        };
        
        // Find certificates matching the name
        const certificates = await AutoBirthCertificate.find(query)
            .populate('user', 'fullname email whatsappnumber')
            .populate('transactionId', 'amount status')
            .sort({ createdAt: -1 });
        
        if (!certificates || certificates.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No birth certificate found with the provided name"
            });
        }
        
        // Format the response
        const formattedCertificates = certificates.map(cert => ({
            _id: cert._id,
            receiptId: cert.receiptId,
            ubrn: cert.ubrn,
            
            // Personal Information
            nameBangla: cert.nameBangla,
            nameEnglish: cert.nameEnglish,
            fatherNameBangla: cert.fatherNameBangla,
            fatherNameEnglish: cert.fatherNameEnglish,
            motherNameBangla: cert.motherNameBangla,
            motherNameEnglish: cert.motherNameEnglish,
            birthPlaceBangla: cert.birthPlaceBangla,
            birthPlaceEnglish: cert.birthPlaceEnglish,
            gender: cert.gender,
            
            // Birth Registration Details
            birthRegistrationNumber: cert.birthRegistrationNumber,
            dateOfRegistration: cert.dateOfRegistration,
            dateOfBirth: cert.dateOfBirth,
            dateOfBirthInWords: cert.dateOfBirthInWords,
            dateOfIssuance: cert.dateOfIssuance,
            
            // Location Details
            registerOfficeAddress: cert.registerOfficeAddress,
            upazilaPourashavaCityCorporationZila: cert.upazilaPourashavaCityCorporationZila,
            permanentAddressBangla: cert.permanentAddressBangla,
            permanentAddressEnglish: cert.permanentAddressEnglish,
            
            // Technical Details
            qrLink: cert.qrLink,
            leftBarcode: cert.leftBarcode,
            autoBarcode: cert.autoBarcode,
            
            // Service Details
            serviceName: cert.serviceName,
            servicePrice: cert.servicePrice,
            
            // Status
            status: cert.status,
            verificationKey: cert.verificationKey,
            
            // User Info
            user: cert.user ? {
                _id: cert.user._id,
                fullname: cert.user.fullname,
                email: cert.user.email
            } : null,
            
            // Timestamps
            createdAt: cert.createdAt,
            updatedAt: cert.updatedAt
        }));

        const matcheduser=await User.findById({_id:user._id});
        if(!matcheduser){
            res.send("user not found!")
        }

        matcheduser.balance-=serviceprice;

        matcheduser.save();
        res.status(200).json({
            success: true,
            message: `Found ${formattedCertificates.length} birth certificate(s)`,
            count: formattedCertificates.length,
            data: formattedCertificates
        });
        
    } catch (error) {
        console.error("Search birth certificate by name error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to search birth certificate",
            error: error.message
        });
    }
});


// ==================== REGISTRATION STATUS ROUTE ====================
const RegistrationStatus = require("../models/RegistrationStatus");

// GET - Get registration status (OPEN/CLOSED) for users
Userroute.get("/registration-status", async (req, res) => {
    try {
        const registrationStatus = await RegistrationStatus.getStatus();
        
        // Return the status
        const isActive = registrationStatus ? registrationStatus.isActive : true;
        const message = registrationStatus ? registrationStatus.message : 'Registration is currently closed. Please try again later.';
        
        res.status(200).json({
            success: true,
            isActive: isActive,
            status: isActive ? 'open' : 'closed',
            message: message,
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error("Registration status error:", error);
        res.status(500).json({
            success: false,
            isActive: false,
            status: 'error',
            message: "Failed to get registration status",
            error: error.message
        });
    }
});



// ==================== AUTO NID MAKER ROUTES ====================

// Import the model at the top with other imports
const AutoNidMaker = require("../models/AutoNidMaker");

/**
 * ============================================
 * SERVICE PRICE ROUTES
 * ============================================
 */

// GET - Service price for Auto NID Maker
Userroute.get("/service/price/auto-nid-maker", async (req, res) => {
    try {
        let servicePrice = 200; // Default price
        
        // Try to get price from PriceList model
        try {
            const PriceList = require("../models/PriceList");
            const priceData = await PriceList.findOne({ 
                name: "অটো এনআইডি মেকার" 
            });
            
            if (priceData && priceData.price) {
                servicePrice = priceData.price;
            }
        } catch (priceError) {
            console.error('Error fetching price from PriceList:', priceError.message);
            // Continue with default price
        }
        
        res.status(200).json({
            success: true,
            price: servicePrice,
            serviceName: "অটো এনআইডি মেকার"
        });
        
    } catch (error) {
        console.error("Get Auto NID Maker price error:", error);
        res.status(500).json({
            success: false,
            message: "সেবার মূল্য লোড করতে ব্যর্থ হয়েছে",
            error: error.message,
            price: 200 // Fallback price
        });
    }
});

/**
 * ============================================
 * PDF EXTRACTION ROUTE (SIGN TO NID)
 * ============================================
 */

// Configure multer for PDF upload (memory storage)
const pdfUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: function (req, file, cb) {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed!'));
        }
    }
});

// POST - Extract data from PDF for Auto NID Maker
Userroute.post("/auto-nid-maker/extract-pdf", authenticateUser, pdfUpload.single('pdf'), async (req, res) => {
    try {
        // Check if file exists
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No PDF file uploaded'
            });
        }

        console.log('Processing PDF for Auto NID Maker:', req.file.originalname, 'Size:', req.file.size);

        // Prepare form data for external API
        const FormData = require('form-data');
        const formData = new FormData();
        
        // Add API key (you can store this in environment variables)
        const API_KEY = process.env.SIGN_TO_NID_API_KEY || '34e56a8765d1f7bbb758624e3b17f940';
        formData.append('key', API_KEY);
        
        // Add PDF file as buffer
        formData.append('pdf', req.file.buffer, req.file.originalname);
        
        console.log('Sending request to external API...');
        
        // Call external API
        const apiResponse = await axios.post('https://xbdapi.store/SIGN-API/signtonid.php', formData, {
            headers: {
                ...formData.getHeaders(),
            },
            timeout: 60000 // 60 seconds timeout
        });

        console.log('API Response received');
        
        // Return the API response
        return res.status(200).json({
            success: true,
            message: 'PDF processed successfully',
            data: apiResponse.data
        });

    } catch (error) {
        console.error('PDF extraction error:', error.message);
        
        if (error.code === 'ECONNABORTED') {
            return res.status(504).json({
                success: false,
                message: 'Request timeout. Please try again.'
            });
        }
        
        if (error.response) {
            return res.status(error.response.status).json({
                success: false,
                message: 'External service error',
                error: error.response.data
            });
        }
        
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            return res.status(503).json({
                success: false,
                message: 'External service is currently unavailable'
            });
        }
        
        if (error instanceof multer.MulterError) {
            if (error.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false,
                    message: 'File too large. Maximum size is 10MB'
                });
            }
        }
        
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

/**
 * ============================================
 * FILE UPLOAD CONFIGURATION
 * ============================================
 */

// Configure multer disk storage for file uploads
const autoNidStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../public/uploads/auto-nid-maker');
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'autonid-' + file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const uploadAutoNidFiles = multer({
    storage: autoNidStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: function (req, file, cb) {
        const allowedTypes = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/jpg',
            'image/webp'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF and image files are allowed!'));
        }
    }
});

/**
 * ============================================
 * CREATE AUTO NID MAKER ORDER
 * ============================================
 */

Userroute.post("/auto-nid-maker/create-order", 
    authenticateUser, 
    uploadAutoNidFiles.fields([
        { name: 'pdf', maxCount: 1 },
        { name: 'nid', maxCount: 1 },
        { name: 'sign', maxCount: 1 }
    ]), 
    async (req, res) => {
        try {
            const user = req.user;
            const files = req.files || {};
            
            console.log('Creating Auto NID Maker order for user:', user.email);
            console.log('Files received:', Object.keys(files).length > 0 ? 'Yes' : 'No');
            
            // =========== VALIDATE REQUIRED FIELDS ===========
            const requiredFields = [
                'nameBangla', 'nameEnglish', 'nationalId', 'pin',
                'dateOfBirth', 'fatherName', 'motherName', 'birthPlace',
                'dateOfToday', 'address'
            ];

            const missingFields = [];
            for (const field of requiredFields) {
                if (!req.body[field] || req.body[field].toString().trim() === '') {
                    missingFields.push(field);
                }
            }

            if (missingFields.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `নিম্নলিখিত 필드গুলি পূরণ করুন: ${missingFields.join(', ')}`
                });
            }

            // =========== HANDLE NID PHOTO ===========
            let nidPhoto = '';
            let nidPhotoType = 'none';
            let nidPhotoFileName = null;

            // Check if NID photo uploaded as file
            if (files.nid && files.nid[0]) {
                const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
                nidPhoto = `${baseUrl}/uploads/auto-nid-maker/${files.nid[0].filename}`;
                nidPhotoType = 'file';
                nidPhotoFileName = files.nid[0].originalname;
                console.log('NID photo uploaded as file:', nidPhoto);
            } 
            // Check if NID photo provided as URL (from PDF extraction)
            else if (req.body.nidImageUrl && req.body.nidImageUrl.trim() !== '') {
                nidPhoto = req.body.nidImageUrl.trim();
                nidPhotoType = 'url';
                console.log('NID photo provided as URL:', nidPhoto);
            } 
            else {
                return res.status(400).json({
                    success: false,
                    message: "এনআইডি ছবি আপলোড করুন অথবা URL প্রদান করুন"
                });
            }

            // =========== HANDLE SIGNATURE ===========
            let signature = null;
            let signatureType = 'none';
            let signatureFileName = null;

            // Check if signature uploaded as file
            if (files.sign && files.sign[0]) {
                const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
                signature = `${baseUrl}/uploads/auto-nid-maker/${files.sign[0].filename}`;
                signatureType = 'file';
                signatureFileName = files.sign[0].originalname;
                console.log('Signature uploaded as file:', signature);
            } 
            // Check if signature provided as URL (from PDF extraction)
            else if (req.body.signImageUrl && req.body.signImageUrl.trim() !== '') {
                signature = req.body.signImageUrl.trim();
                signatureType = 'url';
                console.log('Signature provided as URL:', signature);
            }

            // =========== HANDLE PDF FILE ===========
            let pdfFile = null;
            let pdfFileName = null;
            
            if (files.pdf && files.pdf[0]) {
                pdfFile = `/uploads/auto-nid-maker/${files.pdf[0].filename}`;
                pdfFileName = files.pdf[0].originalname;
                console.log('PDF file uploaded:', pdfFile);
            }

            // =========== GET SERVICE PRICE ===========
            let servicePrice = 200; // Default price
            try {
                const PriceList = require("../models/PriceList");
                const priceData = await PriceList.findOne({ 
                    name: "অটো এনআইডি মেকার" 
                });
                if (priceData && priceData.price) {
                    servicePrice = priceData.price;
                }
            } catch (priceError) {
                console.error('Error fetching price:', priceError.message);
                // Continue with default price
            }

            // =========== CHECK USER BALANCE ===========
            if (user.balance < servicePrice) {
                return res.status(400).json({
                    success: false,
                    message: `অপর্যাপ্ত ব্যালেন্স। প্রয়োজন ${servicePrice} টাকা, আপনার ব্যালেন্স: ${user.balance} টাকা`,
                    requiredBalance: servicePrice,
                    currentBalance: user.balance
                });
            }

            // =========== GENERATE RECEIPT ID ===========
            const receiptId = `AUTO-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

            // =========== CAPTURE IP AND USER AGENT ===========
            const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            const userAgent = req.headers['user-agent'];

            // =========== PARSE EXTRACTION DATA IF PROVIDED ===========
            let extractionData = null;
            if (req.body.extractionData) {
                try {
                    extractionData = JSON.parse(req.body.extractionData);
                } catch (e) {
                    console.error('Error parsing extraction data:', e);
                }
            }

            // =========== CREATE AUTO NID MAKER ORDER ===========
            const autoNidOrder = new AutoNidMaker({
                // User Information
                user: user._id,
                userId: user._id.toString(),
                username: user.fullname || user.name || 'Unknown',
                userEmail: user.email,
                receiptId: receiptId,
                
                // Personal Information
                nameBangla: req.body.nameBangla.trim(),
                nameEnglish: req.body.nameEnglish.trim(),
                nationalId: req.body.nationalId.trim(),
                pin: req.body.pin.trim(),
                dateOfBirth: req.body.dateOfBirth,
                fatherName: req.body.fatherName.trim(),
                motherName: req.body.motherName.trim(),
                birthPlace: req.body.birthPlace.trim(),
                bloodGroup: req.body.bloodGroup || '',
                dateOfToday: req.body.dateOfToday,
                address: req.body.address.trim(),
                gender: req.body.gender || '',
                religion: req.body.religion || '',
                
                // File Information
                pdfFile: pdfFile,
                pdfFileName: pdfFileName,
                nidPhoto: nidPhoto,
                nidPhotoType: nidPhotoType,
                nidPhotoFileName: nidPhotoFileName,
                signature: signature,
                signatureType: signatureType,
                signatureFileName: signatureFileName,
                
                // Extraction Information
                extractionId: req.body.extractionId || null,
                extractionData: extractionData,
                extractedFromPdf: !!extractionData,
                
                // Payment Information
                servicePrice: servicePrice,
                
                // Metadata
                ipAddress: ipAddress,
                userAgent: userAgent,
                
                // Status
                status: 'pending',
                paymentStatus: 'paid'
            });

            await autoNidOrder.save();
            
            // =========== DEDUCT BALANCE ===========
            const balanceBefore = user.balance;
            user.balance -= servicePrice;
            await user.save();
            const balanceAfter = user.balance;

            // =========== CREATE TRANSACTION RECORD ===========
            const Transaction = require("../models/Transaction");
            const transaction = new Transaction({
                user: user._id,
                type: 'debit',
                amount: servicePrice,
                service: 'অটো এনআইডি মেকার',
                description: `অটো এনআইডি মেকার অর্ডার - রসিদ: ${receiptId}, নাম: ${req.body.nameBangla}`,
                reference: receiptId,
                status: 'completed',
                balanceBefore: balanceBefore,
                balanceAfter: balanceAfter,
                metadata: {
                    orderId: autoNidOrder._id,
                    receiptId: receiptId,
                    nationalId: req.body.nationalId
                }
            });
            await transaction.save();

            // =========== UPDATE ORDER WITH TRANSACTION ID ===========
            autoNidOrder.transactionId = transaction._id;
            await autoNidOrder.save();

            console.log('Auto NID Maker order created successfully:', receiptId);

            // =========== RETURN SUCCESS RESPONSE ===========
            res.status(201).json({
                success: true,
                message: "অটো এনআইডি মেকার অর্ডার সফলভাবে তৈরি হয়েছে",
                data: {
                    _id: autoNidOrder._id,
                    receiptId: autoNidOrder.receiptId,
                    nameBangla: autoNidOrder.nameBangla,
                    nameEnglish: autoNidOrder.nameEnglish,
                    nationalId: autoNidOrder.nationalId,
                    servicePrice: autoNidOrder.servicePrice,
                    nidPhotoType: autoNidOrder.nidPhotoType,
                    signatureType: autoNidOrder.signatureType,
                    hasPdfFile: !!autoNidOrder.pdfFile,
                    status: autoNidOrder.status,
                    createdAt: autoNidOrder.createdAt
                },
                transaction: {
                    id: transaction._id,
                    amount: transaction.amount,
                    balance: user.balance,
                    reference: transaction.reference
                }
            });

        } catch (error) {
            console.error('Create Auto NID Maker order error:', error);
            
            // =========== CLEAN UP UPLOADED FILES ON ERROR ===========
            if (req.files) {
                Object.values(req.files).forEach(fileArray => {
                    fileArray.forEach(file => {
                        if (file.path && fs.existsSync(file.path)) {
                            try {
                                fs.unlinkSync(file.path);
                                console.log('Cleaned up file:', file.path);
                            } catch (unlinkError) {
                                console.error('Error cleaning up file:', unlinkError.message);
                            }
                        }
                    });
                });
            }

            // =========== HANDLE DUPLICATE KEY ERROR ===========
            if (error.code === 11000) {
                return res.status(400).json({
                    success: false,
                    message: "এই রসিদ আইডি ইতিমধ্যে ব্যবহৃত হয়েছে, আবার চেষ্টা করুন"
                });
            }

            // =========== HANDLE VALIDATION ERRORS ===========
            if (error.name === 'ValidationError') {
                const errors = Object.values(error.errors).map(err => err.message);
                return res.status(400).json({
                    success: false,
                    message: "ডেটা ভ্যালিডেশন ব্যর্থ হয়েছে",
                    errors: errors
                });
            }

            // =========== HANDLE OTHER ERRORS ===========
            res.status(500).json({
                success: false,
                message: "অটো এনআইডি মেকার অর্ডার তৈরি করতে সমস্যা হয়েছে",
                error: process.env.NODE_ENV === 'development' ? error.message : 'অভ্যন্তরীণ সার্ভার ত্রুটি'
            });
        }
    }
);

/**
 * ============================================
 * GET ALL AUTO NID MAKER ORDERS FOR USER
 * ============================================
 */

Userroute.get("/auto-nid-maker/orders", authenticateUser, async (req, res) => {
    try {
        const user = req.user;
        
        // Pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        // Search filter
        const search = req.query.search || '';
        
        // Build query
        let query = { userId: user._id.toString() };
        
        if (search && search.trim() !== '') {
            query.$or = [
                { receiptId: { $regex: search, $options: 'i' } },
                { nameBangla: { $regex: search, $options: 'i' } },
                { nameEnglish: { $regex: search, $options: 'i' } },
                { nationalId: { $regex: search, $options: 'i' } }
            ];
        }
        
        // Get total count for pagination
        const total = await AutoNidMaker.countDocuments(query);
        
        // Get orders with pagination
        const orders = await AutoNidMaker.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('-extractionData -apiResponse -__v'); // Exclude large fields
        
        // Format response using toSafeResponse method
        const formattedOrders = orders.map(order => order.toSafeResponse());
        
        res.status(200).json({
            success: true,
            message: "অটো এনআইডি মেকার অর্ডার তালিকা",
            data: formattedOrders,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1
            }
        });
        
    } catch (error) {
        console.error("Get Auto NID Maker orders error:", error);
        res.status(500).json({
            success: false,
            message: "অটো এনআইডি মেকার অর্ডার তালিকা লোড করতে ব্যর্থ হয়েছে",
            error: error.message
        });
    }
});

/**
 * ============================================
 * GET SINGLE AUTO NID MAKER ORDER BY RECEIPT ID
 * ============================================
 */

Userroute.get("/auto-nid-maker/order/:receiptId", authenticateUser, async (req, res) => {
    try {
        const user = req.user;
        const { receiptId } = req.params;
        
        if (!receiptId) {
            return res.status(400).json({
                success: false,
                message: "রসিদ আইডি প্রয়োজন"
            });
        }
        
        // Find order by receiptId
        const order = await AutoNidMaker.findOne({
            receiptId: receiptId,
            userId: user._id.toString()
        });
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "অটো এনআইডি মেকার অর্ডার পাওয়া যায়নি"
            });
        }
        
        res.status(200).json({
            success: true,
            message: "অটো এনআইডি মেকার অর্ডার ডাটা লোড সফল",
            data: order
        });
        
    } catch (error) {
        console.error("Get Auto NID Maker order details error:", error);
        res.status(500).json({
            success: false,
            message: "অটো এনআইডি মেকার অর্ডার ডাটা লোড করতে ব্যর্থ হয়েছে",
            error: error.message
        });
    }
});

/**
 * ============================================
 * GET SINGLE AUTO NID MAKER ORDER BY ID
 * ============================================
 */

Userroute.get("/auto-nid-maker/order/id/:id", authenticateUser, async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        
        // Validate MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "অবৈধ অর্ডার আইডি"
            });
        }
        
        // Find order by _id
        const order = await AutoNidMaker.findOne({
            _id: id,
            userId: user._id.toString()
        });
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "অটো এনআইডি মেকার অর্ডার পাওয়া যায়নি"
            });
        }
        
        res.status(200).json({
            success: true,
            message: "অটো এনআইডি মেকার অর্ডার ডাটা লোড সফল",
            data: order
        });
        
    } catch (error) {
        console.error("Get Auto NID Maker order by ID error:", error);
        res.status(500).json({
            success: false,
            message: "অটো এনআইডি মেকার অর্ডার ডাটা লোড করতে ব্যর্থ হয়েছে",
            error: error.message
        });
    }
});

/**
 * ============================================
 * DELETE AUTO NID MAKER ORDER
 * ============================================
 */

Userroute.delete("/auto-nid-maker/order/:id", authenticateUser, async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        
        // Validate MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "অবৈধ অর্ডার আইডি"
            });
        }
        
        // Find order
        const order = await AutoNidMaker.findOne({
            _id: id,
            userId: user._id.toString()
        });
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "অটো এনআইডি মেকার অর্ডার পাওয়া যায়নি"
            });
        }
        
        // Check if order can be deleted (only pending orders)
        if (order.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: "শুধুমাত্র পেন্ডিং অর্ডার ডিলিট করা যাবে। বর্তমান স্ট্যাটাস: " + order.status
            });
        }
        
        // Store order info for response before deletion
        const receiptId = order.receiptId;
        const refundAmount = order.servicePrice;
        
        // Delete physical files if they exist
        if (order.pdfFile && order.pdfFile.startsWith('/uploads/')) {
            const filePath = path.join(__dirname, '..', order.pdfFile);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log('Deleted PDF file:', filePath);
            }
        }
        
        if (order.nidPhoto && order.nidPhotoType === 'file' && order.nidPhoto.startsWith('/uploads/')) {
            // Extract path from full URL
            const urlParts = order.nidPhoto.split('/uploads/');
            if (urlParts.length > 1) {
                const filePath = path.join(__dirname, '../public/uploads/auto-nid-maker', urlParts[1]);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log('Deleted NID photo file:', filePath);
                }
            }
        }
        
        if (order.signature && order.signatureType === 'file' && order.signature.startsWith('/uploads/')) {
            const urlParts = order.signature.split('/uploads/');
            if (urlParts.length > 1) {
                const filePath = path.join(__dirname, '../public/uploads/auto-nid-maker', urlParts[1]);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log('Deleted signature file:', filePath);
                }
            }
        }
        
        // Delete order from database
        await order.deleteOne();
        
        // Refund balance to user
        const balanceBefore = user.balance;
        user.balance += refundAmount;
        await user.save();
        const balanceAfter = user.balance;
        
        // Create transaction record for refund
        const Transaction = require("../models/Transaction");
        const transaction = new Transaction({
            user: user._id,
            type: 'credit',
            amount: refundAmount,
            service: 'অটো এনআইডি মেকার রিফান্ড',
            description: `অর্ডার ডিলিটের জন্য রিফান্ড - রসিদ: ${receiptId}`,
            reference: `REFUND-${receiptId}`,
            status: 'completed',
            balanceBefore: balanceBefore,
            balanceAfter: balanceAfter,
            metadata: {
                orderReceiptId: receiptId,
                refundReason: 'order_deleted_by_user'
            }
        });
        await transaction.save();
        
        res.status(200).json({
            success: true,
            message: "অটো এনআইডি মেকার অর্ডার সফলভাবে ডিলিট করা হয়েছে",
            data: {
                receiptId: receiptId,
                refundedAmount: refundAmount,
                newBalance: user.balance,
                transactionId: transaction._id,
                deletedAt: new Date()
            }
        });
        
    } catch (error) {
        console.error("Delete Auto NID Maker order error:", error);
        res.status(500).json({
            success: false,
            message: "অটো এনআইডি মেকার অর্ডার ডিলিট করতে ব্যর্থ হয়েছে",
            error: error.message
        });
    }
});

Userroute.post("/auto-nid-maker/order/:receiptId/download", authenticateUser, async (req, res) => {
    try {
        const user = req.user;
        const { receiptId } = req.params;
        
        if (!receiptId) {
            return res.status(400).json({
                success: false,
                message: "রসিদ আইডি প্রয়োজন"
            });
        }
        
        // Find order
        const order = await AutoNidMaker.findOne({
            receiptId: receiptId,
            userId: user._id.toString()
        });
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "অটো এনআইডি মেকার অর্ডার পাওয়া যায়নি"
            });
        }
        
        // Increment download count using model method
        await order.incrementDownload();
        
        res.status(200).json({
            success: true,
            message: "ডাউনলোড কাউন্ট আপডেট করা হয়েছে",
            data: {
                receiptId: order.receiptId,
                downloadCount: order.downloadCount,
                lastDownloadedAt: order.lastDownloadedAt
            }
        });
        
    } catch (error) {
        console.error("Increment download count error:", error);
        res.status(500).json({
            success: false,
            message: "ডাউনলোড কাউন্ট আপডেট করতে ব্যর্থ হয়েছে",
            error: error.message
        });
    }
});

module.exports = Userroute;