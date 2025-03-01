const mongoose = require('mongoose');

const individualPlantationSchema = new mongoose.Schema({
    treeType: {
        type: String,
        required: [true, 'Tree type is required']
    },
    height: {
        type: Number,
        required: [true, 'Tree height is required']
    },
    state: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'State',
        required: [true, 'State is required']
    },
    district: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'District',
        required: [true, 'District is required']
    },
    village: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Village',
        required: [true, 'Village is required']
    },
    gramPanchayat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GramPanchayat',
        required: [true, 'Gram Panchayat is required']
    },
    landOwnership: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LandOwnership',
        required: [true, 'Land ownership details are required']
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            required: [true, 'Coordinates are required']
        }
    },
    plantationDate: {
        type: Date,
        required: [true, 'Plantation date is required']
    },
    contactNumber: {
        type: String,
        required: [true, 'Contact number is required'],
        match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit contact number']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    photos: [{
        url: {
            type: String,
            required: true
        },
        caption: String,
        uploadDate: {
            type: Date,
            default: Date.now
        }
    }],
    status: {
        type: String,
        enum: ['PENDING', 'VERIFIED', 'REJECTED'],
        default: 'PENDING'
    },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    verificationDate: Date,
    verificationComments: String,
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
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

// Update timestamp before saving
individualPlantationSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Geospatial index for location queries
individualPlantationSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('IndividualPlantation', individualPlantationSchema); 