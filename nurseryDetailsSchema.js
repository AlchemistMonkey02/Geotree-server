const mongoose = require('mongoose');
const { NurseryDetails } = require('./models');

// Check if the model already exists
const NurseryDetailsModel = mongoose.models.NurseryDetails || mongoose.model('NurseryDetails', nurseryDetailsSchema);

// existing code... 