const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const SubAdminSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters']
    },
    commission: {
        type: Number,
        required: [true, 'Commission is required'],
        min: [0, 'Commission cannot be negative'],
        max: [100, 'Commission cannot exceed 100%'],
        default: 0
    },
        balance: {
        type: Number,
        default: 0
    },
    active: {
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
});

// Hash password before saving
SubAdminSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return console.log("ok");
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
        next(error);
    }
});

// Update timestamp on save
SubAdminSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
});

// Update timestamp on update
SubAdminSchema.pre('findOneAndUpdate', function(next) {
    this.set({ updatedAt: Date.now() });
});

// Method to compare password
SubAdminSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get public profile (without password)
SubAdminSchema.methods.getPublicProfile = function() {
    const subAdmin = this.toObject();
    delete subAdmin.password;
    delete subAdmin.__v;
    return subAdmin;
};

const SubAdmin = mongoose.model('SubAdmin', SubAdminSchema);

module.exports = SubAdmin;