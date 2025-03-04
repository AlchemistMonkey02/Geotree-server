const mongoose = require('mongoose');

const plantSchema = new mongoose.Schema({
    plant_id: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true,
        unique: true // Ensure plant names are unique
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});


const Plant = mongoose.model('Plant', plantSchema);

module.exports = Plant; 