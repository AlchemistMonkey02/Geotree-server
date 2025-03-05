const mongoose = require('mongoose');

const landOwnershipSchema = new mongoose.Schema({
    ownershipType: {
        type: String,
        required: true
    },
    ownerName: {
        type: String,
        required: true
    },
    landArea: {
        type: Number,
        required: true
    },
    boundaries: {
        type: {
            type: String,
            enum: ['Polygon'],
            required: true
        },
        coordinates: {
            type: [[[Number]]], // Array of coordinates for the polygon
            required: true
        }
    },
    landUseType: {
        type: String,
        required: true
    },
    verificationStatus: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending'
    },
    verificationComments: {
        type: String
    },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // Assuming you have a User model
    },
    verificationDate: {
        type: Date
    }
}, { timestamps: true });

const LandOwnership = mongoose.model('LandOwnership', landOwnershipSchema);

module.exports = LandOwnership; 