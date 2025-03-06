const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
    organizationType: {
        type: String,
        enum: [
            'GOVERNMENT',
            'PRIVATE',
            'NGO'
        ],
        required: [true, 'Organization type is required']
    }
}, { timestamps: true }); // ✅ Auto add createdAt & updatedAt

// ✅ Prevent OverwriteModelError by checking if model already exists
const Organization = mongoose.models.Organization || mongoose.model('Organization', organizationSchema);

module.exports = Organization;
