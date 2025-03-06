const express = require("express");
const User = require("../models/User");
const generateApiKey = require("../utils/apiKeyGenerator");
const { authenticateToken } = require("../utils/auth"); // Import the authenticateToken function
const adminMiddleware = require("../middlewares/adminMiddleware"); // Import the admin middleware

const router = express.Router();

// Protect API Key routes with authentication and admin middleware
router.use(authenticateToken); // First, authenticate the token
router.use(adminMiddleware); // Then, check if the user is an admin or superadmin

// Create or Update API Key for User (only super admins can do this)
router.post("/generate", async (req, res) => {
    const { email, apiKeyLimit } = req.body; // Accept email and apiKeyLimit from the request

    // Check if the user is a super admin
    if (req.user.role !== 'superadmin') {
        return res.status(403).json({ status: "error", message: "Forbidden: Only super admins can generate API keys." });
    }

    try {
        const apiKey = generateApiKey();
        const user = await User.findOneAndUpdate(
            { email },
            { apiKey, apiKeyUsage: 0, apiKeyLimit: apiKeyLimit || 1000 },
            { new: true, upsert: true } // Create user if not exists
        );

        res.status(201).json({ message: "API Key generated", apiKey: user.apiKey });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

// View API Key for User
router.get("/:email", async (req, res) => {
    const { email } = req.params;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ status: "error", message: "User not found" });
        }

        res.status(200).json({ apiKey: user.apiKey });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

// Revoke API Key for User
router.delete("/:email", async (req, res) => {
    const { email } = req.params;

    try {
        await User.findOneAndUpdate({ email }, { apiKey: null });
        res.status(200).json({ message: "API Key revoked" });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

module.exports = router; 