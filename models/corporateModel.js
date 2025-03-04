const mongoose = require('mongoose');

const corporateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    logo: {
        filename: String,
        path: String,
        mimetype: String,
        size: Number
    },
    website: {
        type: String,
        trim: true
    },
    contactPerson: {
        name: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },
        phone: {
            type: String,
            required: true,
            trim: true
        }
    },
    address: {
        street: String,
        city: String,
        state: String,
        country: String,
        pincode: String
    },
    plantationGoal: {
        type: Number,
        default: 0
    },
    plantationsDone: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'pending'],
        default: 'active'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Create indexes for frequently queried fields
corporateSchema.index({ name: 1 });
corporateSchema.index({ status: 1 });
corporateSchema.index({ 'contactPerson.email': 1 });

module.exports = mongoose.model('Corporate', corporateSchema); 