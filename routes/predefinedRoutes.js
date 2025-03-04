const express = require('express');
const { insertPredefinedData, insertPlantData, insertLandOwnershipData } = require('../utils/predefinedDataSeeder');

const router = express.Router();

// 🚀 Endpoint to insert predefined location data
router.post('/insert-predefined-data', async (req, res) => {
    try {
        await insertPredefinedData();
        res.status(200).json({ message: "✅ Predefined data inserted successfully!" });
    } catch (err) {
        console.error("❌ Error inserting predefined data:", err.message);
        res.status(500).json({ error: "❌ Error inserting predefined data." });
    }
});

// 🚀 Endpoint to insert predefined plant data
router.post('/insert-plant-data', async (req, res) => {
    try {
        await insertPlantData();
        res.status(200).json({ message: "✅ Predefined plant data inserted successfully!" });
    } catch (err) {
        console.error("❌ Error inserting plant data:", err.message);
        res.status(500).json({ error: "❌ Error inserting plant data." });
    }
});

// 🚀 Endpoint to insert predefined land ownership data
router.post('/insert-land-ownership-data', async (req, res) => {
    try {
        await insertLandOwnershipData();
        res.status(200).json({ message: "✅ Predefined land ownership data inserted successfully!" });
    } catch (err) {
        console.error("❌ Error inserting land ownership data:", err.message);
        res.status(500).json({ error: "❌ Error inserting land ownership data." });
    }
});

module.exports = router;
