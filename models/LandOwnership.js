const mongoose = require('mongoose');

const landOwnershipSchema = new mongoose.Schema({
    ownerName: { type: String, required: true },
    landArea: { type: String, required: true },
    location: { type: String, required: true },
});

// Check if the model already exists to avoid overwriting
const LandOwnership = mongoose.models.LandOwnership || mongoose.model('LandOwnership', landOwnershipSchema);

module.exports = LandOwnership; 