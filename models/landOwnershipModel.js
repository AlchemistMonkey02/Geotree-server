const mongoose = require('mongoose');
const Organization = require('./organizationModel'); // Ensure this is the correct path

const landOwnershipSchema = new mongoose.Schema({
    ownershipType: {
        type: String,
        enum: [
            'GOVERNMENT',
            'PRIVATE',
            'NGO',
            'CORPORATE',
            'EDUCATIONAL_INSTITUTION',
            'HEALTHCARE',
            'RESEARCH_INSTITUTE',
            'PANCHAYAT',
            'OTHER'
        ],
        required: [true, 'Ownership type is required']
    }
}, { timestamps: true }); // ✅ Auto add createdAt & updatedAt

const LandOwnershipModel = mongoose.model('LandOwnership', landOwnershipSchema);

module.exports = LandOwnershipModel;
