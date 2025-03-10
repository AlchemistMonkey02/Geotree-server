const mongoose = require('mongoose');

// Ultra aggressive performance optimizations
mongoose.set('bufferCommands', false);
mongoose.set('autoIndex', false);
mongoose.set('maxTimeMS', 500); // Reduced timeout

// Minimal schema with absolute minimum fields for signup
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
    rewardPoints: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RewardPoint', // Reference to the RewardPoint model
        required: true // Ensure that reward points are always associated
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

module.exports = mongoose.model('User', userSchema);
