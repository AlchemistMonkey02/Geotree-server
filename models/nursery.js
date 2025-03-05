const mongoose = require("mongoose");

// Function to generate a random nursery ID
const generateNurseryId = () => {
    return `nursery_random_${Math.floor(Math.random() * 1000000)}`; // Generates a random number
};

const nurserySchema = new mongoose.Schema({
    nurseryId: {
        type: String,
        required: true,
        unique: true,
    },
    image: {
        type: String,
        required: true,
    },
    inChargeName: {
        type: String,
        required: true, // or false based on your requirements
    },
    inChargePhone: {
        type: String,
        required: true, // or false based on your requirements
    },
    district: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'District',
        required: true,
    },
    block: {
        type: String,
        required: true,
    },
    gp: { // Gram Panchayat
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GP',
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    asfs: {
        type: String,
        required: true,
    },
    khasraNo: {
        type: String,
        required: true,
    },
    ownership: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LandOwnership',
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    ageOfPlant: {
        type: Number,
        required: true,
    },
    height: {
        type: Number,
        required: true,
    },
    area: {
        type: Number,
        required: true,
    },
    areaType: {
        type: String,
        required: true,
    },
    areaInHectares: {
        type: Number,
        required: true,
    },
    number: {
        type: Number,
        required: true,
    },
    state: {
        type: String,
        required: true,
    },
}, { timestamps: true });

// Pre-save hook to generate nurseryId
nurserySchema.pre('save', function(next) {
    if (!this.nurseryId) {
        this.nurseryId = generateNurseryId(); // Generate a unique nursery ID
    }
    next();
});

module.exports = mongoose.model("Nursery", nurserySchema); 