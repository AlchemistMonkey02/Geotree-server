const express = require("express");
const UserAdmin = require("../models/UserAdmin");
const generateApiKey = require("../utils/apiKeyGenerator");

const router = express.Router();

// Create or Update API Key for Admin User
router.post("/generate", async (req, res) => {
    const { username } = req.body;

    try {
        const apiKey = generateApiKey();
        const adminUser = await UserAdmin.findOneAndUpdate(
            { username },
            { apiKey },
            { new: true, upsert: true } // Create user if not exists
        );

        res.status(201).json({ message: "API Key generated", apiKey: adminUser.apiKey });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

// View API Key for Admin User
router.get("/:username", async (req, res) => {
    const { username } = req.params;

    try {
        const adminUser = await UserAdmin.findOne({ username });
        if (!adminUser) {
            return res.status(404).json({ status: "error", message: "Admin User not found" });
        }

        res.status(200).json({ apiKey: adminUser.apiKey });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

// Revoke API Key for Admin User
router.delete("/:username", async (req, res) => {
    const { username } = req.params;

    try {
        await UserAdmin.findOneAndUpdate({ username }, { apiKey: null });
        res.status(200).json({ message: "API Key revoked" });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

module.exports = router; 