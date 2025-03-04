const mongoose = require('mongoose');

const treePlantationSchema = new mongoose.Schema({
    stateUT: {
        type: String,
        required: [true, 'State/UT is required']
    },
    district: {
        type: String,
        required: [true, 'District is required']
    },
    department: {
        type: String,
        required: [true, 'Department is required']
    },
    institution: {
        type: String,
        required: [true, 'Institution is required']
    },
    municipalArea: {
        type: String,
        default: ''
    },
    wardNo: {
        type: String,
        default: ''
    },
    place: {
        type: String,
        default: ''
    },
    location: {
        type: String,
        default: ''
    },
    activityCategory: {
        type: String,
        default: 'Tree Plantation'
    },
    activityName: {
        type: String,
        default: ''
    },
    numberOfTrees: {
        type: Number,
        required: [true, 'Number of trees is required']
    },
    placeCategory: {
        type: String,
        enum: ['Urban', 'Rural'],
        required: [true, 'Place category is required']
    },
    plantationDate: {
        type: Date,
        required: [true, 'Plantation date is required']
    },
    geoTagPhoto: {
        type: String,
        default: ''
    },
    videoClip: {
        type: String,
        default: 'Not Uploaded'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
treePlantationSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('TreePlantation', treePlantationSchema); 