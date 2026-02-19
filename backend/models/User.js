const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    profile: {
        type: String,
        default: "https://i.ibb.co.com/RTkGPXtm/Whats-App-Image-2026-01-01-at-6-38-12-PM.jpg"
    },
    fullname: {
        type: String,
        required: [true, 'Fullname is required'],
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters']
    },
    whatsappnumber: {
        type: String,
        required: [true, 'whatsappnumber number is required']
    },
    emailverified: {
        type: Boolean,
        default: false,
    },
    balance: {
        type: Number,
        default: 0
    },
    bonusbalance:{
        type: Number,
        default: 0
    },
    totaldeposit: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended', 'pending'],
        default: 'active' // Changed to pending until email verification
    },
    depositCount: {
        type: Number,
        default: 0
    },
    lastDepositAt: {
        type: Date
    },
    // Email Verification OTP fields
    emailVerificationOTP: {
        type: String,
        default: null
    },
    emailVerificationExpiry: {
        type: Date,
        default: null
    },
    emailVerificationAttempts: {
        type: Number,
        default: 0
    },
    lastEmailVerificationSentAt: {
        type: Date,
        default: null
    },
    // General OTP fields (for password reset, etc.)
    otp: {
        type: String,
        default: null
    },
    otpExpiry: {
        type: Date,
        default: null
    },
    otpAttempts: {
        type: Number,
        default: 0
    },
    lastOtpSentAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return console.log("");

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// ==================== EMAIL VERIFICATION METHODS ====================

// Generate Email Verification OTP
userSchema.methods.generateEmailVerificationOTP = function () {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    this.emailVerificationOTP = otp;
    this.emailVerificationExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes expiry
    this.emailVerificationAttempts = 0;
    this.lastEmailVerificationSentAt = new Date();
    return otp;
};

// Verify Email OTP
userSchema.methods.verifyEmailOTP = function (enteredOtp) {
    // Check if OTP exists and not expired
    if (!this.emailVerificationOTP || !this.emailVerificationExpiry) {
        return { valid: false, message: 'No verification OTP found' };
    }

    if (Date.now() > this.emailVerificationExpiry) {
        this.clearEmailVerificationOTP();
        return { valid: false, message: 'Verification OTP expired' };
    }

    // Check attempts
    if (this.emailVerificationAttempts >= 5) {
        this.clearEmailVerificationOTP();
        return { valid: false, message: 'Too many verification attempts' };
    }

    // Verify OTP
    if (this.emailVerificationOTP !== enteredOtp) {
        this.emailVerificationAttempts += 1;
        return {
            valid: false,
            message: 'Invalid verification code',
            attemptsRemaining: 5 - this.emailVerificationAttempts
        };
    }

    // OTP is valid - mark email as verified
    this.emailverified = true;
    this.status = 'active';
    this.clearEmailVerificationOTP();
    return { valid: true, message: 'Email verified successfully' };
};

// Clear Email Verification OTP
userSchema.methods.clearEmailVerificationOTP = function () {
    this.emailVerificationOTP = null;
    this.emailVerificationExpiry = null;
    this.emailVerificationAttempts = 0;
};

// Check if can resend email verification OTP
userSchema.methods.canResendEmailVerification = function () {
    if (!this.lastEmailVerificationSentAt) return true;

    const timeSinceLast = Date.now() - this.lastEmailVerificationSentAt.getTime();
    return timeSinceLast > 60 * 1000; // 60 seconds cooldown
};

// ==================== GENERAL OTP METHODS ====================

// Generate General OTP method (for password reset, etc.)
userSchema.methods.generateOTP = function () {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    this.otp = otp;
    this.otpExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes
    this.otpAttempts = 0;
    this.lastOtpSentAt = new Date();
    return otp;
};

// Verify General OTP method
userSchema.methods.verifyOTP = function (enteredOtp) {
    // Check if OTP exists and not expired
    if (!this.otp || !this.otpExpiry) {
        return { valid: false, message: 'No OTP found' };
    }

    if (Date.now() > this.otpExpiry) {
        this.clearOTP();
        return { valid: false, message: 'OTP expired' };
    }

    // Check attempts
    if (this.otpAttempts >= 5) {
        this.clearOTP();
        return { valid: false, message: 'Too many attempts' };
    }

    // Verify OTP
    if (this.otp !== enteredOtp) {
        this.otpAttempts += 1;
        return {
            valid: false,
            message: 'OTP ভুল হয়েছে',
            attemptsRemaining: 5 - this.otpAttempts
        };
    }

    // OTP is valid
    this.clearOTP();
    return { valid: true, message: 'OTP verified' };
};

// Clear General OTP method
userSchema.methods.clearOTP = function () {
    this.otp = null;
    this.otpExpiry = null;
    this.otpAttempts = 0;
};

// Check if can resend General OTP
userSchema.methods.canResendOTP = function () {
    if (!this.lastOtpSentAt) return true;

    const timeSinceLastOTP = Date.now() - this.lastOtpSentAt.getTime();
    return timeSinceLastOTP > 30 * 1000; // 30 seconds cooldown
};

module.exports = mongoose.model('User', userSchema);