const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');
const Authrouter = express.Router();
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const SubAdmin = require('../models/SubAdmin');
require('dotenv').config();

// Email configuration
const emailConfig = {
    service: 'gmail',
    auth: {
        user:"mplusecomputer@gmail.com",
        pass:"lodn omwa xxor ciqc"
    }
};

// Create email transporter
const transporter = nodemailer.createTransport(emailConfig);

// Verify email configuration
transporter.verify((error, success) => {
    if (error) {
        console.log('Email configuration error:', error);
    } else {
        console.log('Email server is ready to send messages');
    }
});

// Middleware to check JWT_SECRET
const checkJwtSecret = (req, res, next) => {
    if (!process.env.JWT_SECRET) {
        return res.status(500).json({
            success: false,
            message: 'Server configuration error: JWT_SECRET not set'
        });
    }
    next();
};

// CORS middleware
Authrouter.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// ========== USER REGISTRATION ==========
Authrouter.post('/register', async (req, res) => {
    try {
        const { fullname, email, password, whatsappnumber } = req.body;

        // Validate input
        if (!fullname || !email || !password || !whatsappnumber) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required: fullname, email, password, whatsappnumber'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ 
            $or: [{ email }] 
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Create new user
        const user = new User({
            fullname,
            email,
            password,
            whatsappnumber
        });

        await user.save();

        // Create JWT token
        const token = jwt.sign(
            { 
                userId: user._id, 
                email: user.email,
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                username: user.fullname,
                email: user.email,
                phoneNumber: user.whatsappnumber,
                balance: user.balance,
                status: user.status
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        
        res.status(500).json({
            success: false,
            message: 'Server error during registration',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ========== USER LOGIN ==========
Authrouter.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check user status
        if (user.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: `Account is ${user.status}. Please contact support.`
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Create JWT token
        const token = jwt.sign(
            { 
                userId: user._id, 
                email: user.email,
                role: 'user'
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                phoneNumber: user.phoneNumber,
                balance: user.balance,
                status: user.status
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ========== SEND OTP FOR PASSWORD RESET ==========
Authrouter.post('/send-otp', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User with this email does not exist'
            });
        }

        // Check if can resend OTP (30 seconds cooldown)
        if (!user.canResendOTP()) {
            return res.status(429).json({
                success: false,
                message: 'Please wait 30 seconds before requesting a new OTP'
            });
        }

        // Generate OTP
        const otp = user.generateOTP();
        await user.save();

        console.log(`OTP for ${email}: ${otp}`);

        // Email content
        const mailOptions = {
            from:'"Digital Service Support" <mplusecomputer@gmail.com>',
            to: user.email,
            subject: 'Password Reset OTP - Digital Service',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h2 style="color: #333; margin-bottom: 10px;">Password Reset OTP</h2>
                        <p style="color: #666; font-size: 14px;"Digital Service Account</p>
                    </div>
                    
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
                        <p style="color: #333; margin-bottom: 15px;">Hello <strong>${user.fullname}</strong>,</p>
                        <p style="color: #555; line-height: 1.6;">
                            You requested to reset your password. Use the following OTP to verify your identity:
                        </p>
                        
                        <div style="text-align: center; margin: 25px 0;">
                            <div style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 3px; border-radius: 12px;">
                                <div style="background: white; padding: 20px 40px; border-radius: 10px;">
                                    <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #333;">
                                        ${otp}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <p style="color: #d9534f; font-size: 13px; text-align: center; margin-bottom: 15px;">
                            ⚠️ This OTP will expire in 5 minutes
                        </p>
                    </div>
                    
                    <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center;">
                        <p style="color: #888; font-size: 12px; margin-bottom: 10px;">
                            If you didn't request this password reset, please ignore this email.
                        </p>
                        <p style="color: #888; font-size: 12px;">
                            For security reasons, do not share this OTP with anyone.
                        </p>
                    </div>
                </div>
            `
        };

        // Send email
        try {
            await transporter.sendMail(mailOptions);
            console.log(`Email sent successfully to ${email}`);
            
            res.status(200).json({
                success: true,
                message: 'OTP sent successfully to your email',
                expiresIn: 300 // 5 minutes in seconds
            });
        } catch (emailError) {
            console.error('Email sending error:', emailError);
        }

    } catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ========== VERIFY OTP ==========
Authrouter.post('/verify-otp', checkJwtSecret, async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Email and OTP are required'
            });
        }

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Verify OTP
        const verification = user.verifyOTP(otp);
        
        if (!verification.valid) {
            await user.save(); // Save updated attempts
            return res.status(400).json({
                success: false,
                message: verification.message,
                attemptsRemaining: verification.attemptsRemaining
            });
        }

        // Save user (to clear OTP)
        await user.save();

        // Generate a reset token for password reset
        const resetToken = jwt.sign(
            { 
                userId: user._id, 
                email: user.email,
                purpose: 'password_reset',
                timestamp: Date.now()
            },
            process.env.JWT_SECRET,
            { expiresIn: '15m' } // 15 minutes for password reset
        );

        res.status(200).json({
            success: true,
            message: 'OTP verified successfully',
            resetToken: resetToken,
            expiresIn: 900 // 15 minutes in seconds
        });

    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ========== RESET PASSWORD WITH TOKEN ==========
Authrouter.post('/reset-password', checkJwtSecret, async (req, res) => {
    try {
        const { resetToken, newPassword, confirmPassword } = req.body;

        // Validate input
        if (!resetToken || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Passwords do not match'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }

        // Verify reset token
        let decoded;
        try {
            decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
            
            // Check if token is for password reset
            if (decoded.purpose !== 'password_reset') {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid reset token'
                });
            }
        } catch (jwtError) {
            return res.status(400).json({
                success: false,
                message: jwtError.name === 'TokenExpiredError' ? 
                    'Reset token has expired. Please request a new OTP.' : 
                    'Invalid reset token'
            });
        }

        // Find user
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if new password is same as old password
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            return res.status(400).json({
                success: false,
                message: 'New password cannot be the same as the old password'
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        // Send confirmation email
        const mailOptions = {
            from:'"Digital Service Support" <mplusecomputer@gmail.com>',
            to: user.email,
            subject: 'Password Reset Successful - Digital Service',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h2 style="color: #28a745; margin-bottom: 10px;">✅ Password Reset Successful</h2>
                    </div>
                    
                    <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
                        <p style="color: #333; margin-bottom: 15px;">Hello <strong>${user.fullname}</strong>,</p>
                        <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
                            Your password has been successfully reset at <strong>${new Date().toLocaleString()}</strong>.
                        </p>
                        
                        <div style="background-color: #d4edda; color: #155724; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745; margin: 20px 0;">
                            <p style="margin: 0;">
                                <strong>Security Notice:</strong> If you didn't make this change, please contact our support team immediately.
                            </p>
                        </div>
                    </div>
                    
                    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                        <p style="color: #666; font-size: 14px;">
                            You can now login with your new password.
                        </p>
                    </div>
                </div>
            `
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log(`Password reset confirmation sent to ${user.email}`);
        } catch (emailError) {
            console.error('Confirmation email error:', emailError);
            // Don't fail the request if email fails
        }

        res.status(200).json({
            success: true,
            message: 'Password reset successfully. You can now login with your new password.'
        });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Error resetting password',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ========== RESEND OTP ==========
Authrouter.post('/resend-otp', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User with this email does not exist'
            });
        }

        // Check if can resend OTP
        if (!user.canResendOTP()) {
            return res.status(429).json({
                success: false,
                message: 'Please wait 30 seconds before requesting a new OTP'
            });
        }

        // Generate new OTP
        const otp = user.generateOTP();
        await user.save();

        console.log(`New OTP for ${email}: ${otp}`);

        // Send email
        const mailOptions = {
            from:'"Digital Service Support" <mplusecomputer@gmail.com>',
            to: user.email,
            subject: 'New Password Reset OTP - Digital Service',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #333; text-align: center;">New Password Reset OTP</h2>
                    <p>Hello ${user.username},</p>
                    <p>As requested, here is your new OTP for password reset:</p>
                    <div style="text-align: center; margin: 30px 0; font-size: 32px; font-weight: bold; letter-spacing: 10px;">
                        ${otp}
                    </div>
                    <p style="color: #dc3545;">This OTP will expire in 5 minutes.</p>
                    <p>If you didn't request this, please ignore this email.</p>
                </div>
            `
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log(`Resent OTP email to ${email}`);
            
            res.status(200).json({
                success: true,
                message: 'New OTP sent successfully',
                expiresIn: 300
            });
        } catch (emailError) {
            console.error('Resend email error:', emailError);
        }

    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ========== CHECK OTP STATUS ==========
Authrouter.get('/otp-status/:email', async (req, res) => {
    try {
        const { email } = req.params;
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        if (!user.otp || !user.otpExpiry) {
            return res.status(200).json({
                success: false,
                hasOtp: false,
                message: 'No active OTP found'
            });
        }
        
        const timeRemaining = Math.max(0, user.otpExpiry.getTime() - Date.now());
        const expiresIn = Math.floor(timeRemaining / 1000);
        
        res.status(200).json({
            success: true,
            hasOtp: true,
            expiresIn: expiresIn,
            attempts: user.otpAttempts,
            attemptsRemaining: Math.max(0, 5 - user.otpAttempts)
        });
        
    } catch (error) {
        console.error('OTP status error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// ========== CHANGE PASSWORD (LOGGED IN USERS) ==========
Authrouter.post('/change-password', checkJwtSecret, async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (jwtError) {
            return res.status(401).json({
                success: false,
                message: jwtError.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token'
            });
        }

        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Validate input
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'New passwords do not match'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }

        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Check if new password is same as current
        if (currentPassword === newPassword) {
            return res.status(400).json({
                success: false,
                message: 'New password cannot be the same as current password'
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Error changing password',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ========== ADMIN REGISTRATION ==========
Authrouter.post("/admin-register", checkJwtSecret, async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required: username, email, password"
            });
        }

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ 
            $or: [{ email }, { username }] 
        });

        if (existingAdmin) {
            return res.status(400).json({
                success: false,
                message: "Admin with this email or username already exists"
            });
        }

        // Create new admin (password will be hashed by pre-save middleware)
        const newAdmin = new Admin({
            username,
            email,
            password
        });

        // Save admin to database
        await newAdmin.save();

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: newAdmin._id,
                username: newAdmin.username,
                email: newAdmin.email,
                role: newAdmin.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            message: "Admin registered successfully",
            data: {
                id: newAdmin._id,
                username: newAdmin.username,
                email: newAdmin.email,
                role: newAdmin.role,
                token: token
            }
        });

    } catch (error) {
        console.error("Registration error:", error);
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }
        
        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Username or email already exists'
            });
        }
        
        res.status(500).json({
            success: false,
            message: "Internal server error during registration",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ========== ADMIN LOGIN ==========
Authrouter.post("/admin-login", checkJwtSecret, async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        // Find admin by email
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Check if admin is active
        if (!admin.isActive) {
            return res.status(403).json({
                success: false,
                message: "Admin account is deactivated"
            });
        }

        // Check password
        const isPasswordValid = await admin.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: admin._id,
                username: admin.username,
                email: admin.email,
                role: admin.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                id: admin._id,
                username: admin.username,
                email: admin.email,
                role: admin.role,
                token: token
            }
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error during login",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ========== VERIFY TOKEN ==========
Authrouter.post('/verify-token', checkJwtSecret, (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        res.status(200).json({
            success: true,
            message: 'Token is valid',
            data: decoded
        });
    } catch (error) {
        res.status(401).json({
            success: false,
            message: error.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token'
        });
    }
});


// ========== SUBADMIN LOGIN ==========
Authrouter.post('/subadmin-login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Check if subadmin exists
        const subAdmin = await SubAdmin.findOne({ email }).select('+password');
        if (!subAdmin) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if subadmin is active
        if (!subAdmin.active) {
            return res.status(403).json({
                success: false,
                message: 'Account is deactivated. Please contact administrator.'
            });
        }

        // Check password
        const isMatch = await subAdmin.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Create JWT token
        const token = jwt.sign(
            { 
                id: subAdmin._id, 
                email: subAdmin.email,
                name: subAdmin.name,
                role: 'subadmin',
                commission: subAdmin.commission
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Get public profile (without password)
        const publicProfile = subAdmin.getPublicProfile();

        res.json({
            success: true,
            message: 'Login successful',
            token,
            subadmin: {
                id: publicProfile._id,
                name: publicProfile.name,
                email: publicProfile.email,
                commission: publicProfile.commission,
                balance: publicProfile.balance,
                active: publicProfile.active,
                createdAt: publicProfile.createdAt,
                updatedAt: publicProfile.updatedAt
            }
        });

    } catch (error) {
        console.error('SubAdmin login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
module.exports = Authrouter;