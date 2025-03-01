const mongoose = require('mongoose');

const treeCategorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true, trim: true }, 
    description: { type: String, trim: true }, 
    species: [{ type: String, trim: true }], 
}, { timestamps: true });

module.exports = mongoose.model('TreeCategory', treeCategorySchema);
