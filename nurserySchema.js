const mongoose = require('mongoose');
const { Nursery } = require('./models');

// Check if the model already exists
const NurserySchema = mongoose.models.Nursery || mongoose.model('Nursery', nurserySchema);

// existing code... 