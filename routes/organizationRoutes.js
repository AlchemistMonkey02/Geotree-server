const express = require('express');
const router = express.Router();
const organizationController = require('../controllers/organizationController');
const { insertOrganizationData } = require('../utils/predefinedDataSeeder'); // Adjust the path as necessary

// 📌 Create a new organization
router.post('/create', organizationController.createOrganization);

// 📌 Get all organizations
router.get('/', organizationController.getOrganizations);

router.post('/insert-organization-data', async (req, res) => {
    try {
        await insertOrganizationData();
        res.status(200).json({ message: "✅ Predefined organization data inserted successfully!" });
    } catch (err) {
        console.error("❌ Error inserting organization data:", err.message);
        res.status(500).json({ error: "❌ Error inserting organization data." });
    }
});

module.exports = router;
