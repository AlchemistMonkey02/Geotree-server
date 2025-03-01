const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    video: { 
        filename: String, 
        path: String, 
        mimetype: String, 
        size: Number,
        url: String // ✅ Supports video URLs
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    city: { type: String, required: true, trim: true },
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
