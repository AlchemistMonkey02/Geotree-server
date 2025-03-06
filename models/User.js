const mongoose = require("mongoose");

// Ultra aggressive performance optimizations
mongoose.set('bufferCommands', false);
mongoose.set('autoIndex', false);
mongoose.set('maxTimeMS', 500); // Reduced timeout

// Updated schema with API key fields
const userSchema = new mongoose.Schema({
    userId: { 
        type: String, 
        unique: true,
        default: () => Date.now().toString(36) + Math.random().toString(36).slice(2) // Faster ID generation
    },
    refreshTokens: { type: [String], default: [] },
    firstName: String,
    lastName: String,
    email: { 
        type: String, 
        unique: true,
        lowercase: true
    },
    phone: { 
        type: String, 
        sparse: true
    },
    password: String,
    role: { 
        type: String, 
        enum: ['user', 'admin', 'superadmin'], // Added superadmin role
        default: 'user'
    },
    verified: { 
        type: Boolean, 
        default: false
    },
    adminVerified: { 
        type: Boolean, 
        default: true
    },
    adminVerificationStatus: { 
        type: String, 
        default: 'Approved'
    },
    city: String,
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    apiKey: {
        type: String,
        unique: true,
    },
    apiKeyUsage: {
        type: Number,
        default: 0, // Track the number of requests made with the API key
    },
    apiKeyLimit: {
        type: Number,
        default: 1000, // Set a default limit for API key usage
    }
}, { 
    timestamps: true,
    minimize: true,
    versionKey: false,
    strict: false,
    bufferCommands: false,
    autoIndex: false,
    id: false // Disable virtual id getter
});

// Single compound index for most common queries
userSchema.index({ email: 1, phone: 1 }, { sparse: true });

// Ultra-optimized lean query helper
userSchema.statics.findByEmail = function(email) {
    return this.findOne({ email }, 'email phone', { lean: true });
};

// Optimize response
userSchema.set('toJSON', {
    transform: (_, ret) => {
        const { _id, __v, password, ...user } = ret;
        return user;
    }
});

// Check if the model already exists
const User = mongoose.models.User || mongoose.model("User", userSchema);

module.exports = User; 