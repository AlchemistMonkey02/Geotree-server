const mongoose = require("mongoose");

const userAdminSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    apiKey: {
        type: String,
        unique: true,
    },
    apiKeyUsage: {
        type: Number,
        default: 0, // Track the number of requests made with the API key
    },
    apiKeyLimit: {
        type: Number,
        default: 1000, // Set a default limit for API key usage
    },
    role: {
        type: String,
        enum: ['user', 'admin'], // Define roles
        default: 'admin', // Default role for this model
    },
    // Add other admin-specific fields as necessary
});

const UserAdmin = mongoose.model("UserAdmin", userAdminSchema);

module.exports = UserAdmin; 