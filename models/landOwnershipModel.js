const mongoose = require('mongoose');

const landOwnershipSchema = new mongoose.Schema({
    ownershipType: {
        type: String,
        enum: [
            'PRIVATE',
            'GOVERNMENT',
            'COMMUNITY',
            'TEMPLE',
            'EDUCATIONAL_INSTITUTION',
            'CORPORATE',
            'FOREST_DEPARTMENT',
            'PANCHAYAT',
            'OTHER'
        ],
        required: [true, 'Ownership type is required']
    }
}, { timestamps: true }); // ✅ Auto add createdAt & updatedAt

const LandOwnership = mongoose.model('LandOwnership', landOwnershipSchema);

module.exports = LandOwnership;
