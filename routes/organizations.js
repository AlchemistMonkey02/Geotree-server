const express = require('express');
const router = express.Router();

// Mock database for demonstration
let organizations = [];

// Route to create a new organization
router.post('/organizations', (req, res) => {
    const { name, address } = req.body;

    // Basic validation
    if (!name || !address) {
        return res.status(400).json({ error: 'Name and address are required' });
    }

    const newOrganization = { id: organizations.length + 1, name, address };
    organizations.push(newOrganization);

    // Respond with the created organization
    return res.status(201).json(newOrganization);
});

// Other routes can be added here...

module.exports = router; 