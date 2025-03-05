const mongoose = require('mongoose');

// Function to generate a custom plant ID
const generatePlantId = () => {
    return 'PLANT-' + Math.random().toString(36).substr(2, 9).toUpperCase(); // Example format
};

const plantSchema = new mongoose.Schema({
    plant_id: {
        type: String,
        required: true,
        unique: true,
        default: generatePlantId // Set default to custom ID generator
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