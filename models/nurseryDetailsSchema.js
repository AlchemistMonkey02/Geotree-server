const mongoose = require("mongoose");

// Import the Nursery and Plant models to create references
const Nursery = require("./nursery");
const Plant = require("./plantModel"); // Import the Plant schema

const nurseryDetailsSchema = new mongoose.Schema({
    nurseryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Nursery",
        required: true,
    },
    plantHistory: [
        {
            plantId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Plant", // Reference the Plant schema
                required: true,
            },
            numberOfPlantsPlanted: {
                type: Number,
                required: true,
            },
            totalPlantedTrees: {
                type: Number,
                required: true,
            },
            actionStatus: {
                type: String,
                enum: ["add", "remove"],
                required: true,
            },
            adminVerificationStatus: {
                type: String,
                enum: ["approved", "pending"],
                default: "pending",
            },
        },
    ],
});

module.exports = mongoose.model("NurseryDetails", nurseryDetailsSchema); 