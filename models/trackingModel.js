const mongoose = require('mongoose');

const trackingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    tableNumber: { type: Number, required: true },
    value: { type: String, required: true },
}, { timestamps: true });

const TrackingTable = mongoose.models.TrackingTable || mongoose.model('TrackingTable', trackingSchema);

module.exports = TrackingTable;
