const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    plantName: { type: String, required: true },
    height: { type: Number, required: true },
    areaType: { type: String, required: true },
    event: { type: String, required: true },
    userName: { type: String, required: true },
    userMobile: { type: String, required: true },
    plantedDate: { type: Date, default: Date.now },
    prePlantationImage: { type: String, required: true },
    plantationImage: { type: String, required: true },
    location: {
        type: { type: String, enum: ['Point'], required: true },
        coordinates: { type: [Number], required: true } // [longitude, latitude]
    },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'TreeCategory' },
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
}, { timestamps: true });

module.exports = mongoose.model('Activity', activitySchema);
