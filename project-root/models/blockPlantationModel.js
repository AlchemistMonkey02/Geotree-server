const mongoose = require('mongoose');

const blockPlantationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    plantationType: {
        type: String,
        required: true,
        enum: ['Teak', 'Bamboo', 'Neem', 'Mahogany']
    },
    areaType: {
        type: String,
        required: true,
        enum: ['Private', 'Public', 'School', 'Temple', 'Other']
    },
    area: {
        type: Number,
        required: true
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true,
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    boundaryPoints: [{
        lat: { type: Number, required: true },
        long: { type: Number, required: true }
    }],
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
    userMobile: {
        type: String,
        required: true
    },
    userName: {
        type: String,
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
    event: {
        type: String,
        required: true
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
blockPlantationSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('BlockPlantation', blockPlantationSchema);
