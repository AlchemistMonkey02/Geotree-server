const mongoose = require('mongoose');

const successStorySchema = new mongoose.Schema({
    title: { type: String, required: true, unique: true, trim: true },
    description: { type: String, required: true, trim: true },
    impact: { type: String, required: true, trim: true },
    image: {
        filename: { type: String, required: true },
        path: { type: String, required: true },
        size: { type: Number, required: true },
        mimetype: { type: String, required: true }
    }
}, { timestamps: true });

module.exports = mongoose.model('SuccessStory', successStorySchema);
