const mongoose = require('mongoose');

const individualPlantationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    plantName: {
        type: String,
        required: true
    },
    height: {
        type: Number,
        required: true
    },
    areaType: {
        type: String,
        required: true,
        enum: ['Private', 'Public', 'School', 'Temple', 'Other']
    },
    event: {
        type: String,
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    userMobile: {
        type: String,
        required: true
    },
    plantedDate: {
        type: Date,
        default: Date.now
    },
    prePlantationImage: {
        filename: String,
        path: String,
        mimetype: String,
        size: Number
    },
    plantationImage: {
        filename: String,
        path: String,
        mimetype: String,
        size: Number
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    userIp: String,
    userLocation: String,
    latitude: Number,
    longitude: Number,
    district: String,
    gpName: String,
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TreeCategory',
        required: true
    },
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event'
    },
    campaignId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Campaign'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Create a 2dsphere index for location-based queries
individualPlantationSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('IndividualPlantation', individualPlantationSchema); 