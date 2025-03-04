const mongoose = require('mongoose');

const plantationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    plantName: { type: String, required: true },
    height: { type: Number, required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    areaType: { type: String, required: true },
    userIp: { type: String },
    userLocation: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    district: { type: String },
    gpName: { type: String },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'TreeCategory' },
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
    prePlantationImage: {
        filename: String,
        path: String,
        size: Number,
        mimetype: String,
    },
    plantationImage: {
        filename: String,
        path: String,
        size: Number,
        mimetype: String,
    },
}, { timestamps: true });

module.exports = mongoose.model('Plantation', plantationSchema);
