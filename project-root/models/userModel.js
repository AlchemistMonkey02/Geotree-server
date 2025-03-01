const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, unique: true, required: true, trim: true, lowercase: true },
    phone: { type: String, unique: true, sparse: true },
    password: { type: String, minlength: 8, required: true },
    refreshTokens: { type: [String], default: [] },
    role: { type: String, enum: ['user', 'admin', 'superadmin'], default: 'user' },
    verified: { type: Boolean, default: false },
    city: { type: String, trim: true },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    otp: {
        type: String,
        required: false,
    },
    otpExpires: {
        type: Date,
        required: false,
    },
    failedLoginAttempts: { type: Number, default: 0 },
    lockoutUntil: { type: Date },
    emailVerificationToken: { type: String },  // ✅ New Field
    emailVerificationExpires: { type: Date }  // ✅ Expiry for Token
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
