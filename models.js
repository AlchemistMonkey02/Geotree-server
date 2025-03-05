const mongoose = require('mongoose');

const nurserySchema = new mongoose.Schema({
    // define your schema here
});

const nurseryDetailsSchema = new mongoose.Schema({
    // define your schema here
});

// Export models
const Nursery = mongoose.models.Nursery || mongoose.model('Nursery', nurserySchema);
const NurseryDetails = mongoose.models.NurseryDetails || mongoose.model('NurseryDetails', nurseryDetailsSchema);

module.exports = {
    Nursery,
    NurseryDetails,
    nurserySchema, // Export the schema for use in other files
    nurseryDetailsSchema // Export the schema for use in other files
}; 