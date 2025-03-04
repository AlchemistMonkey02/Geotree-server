const express = require('express');
const router = express.Router();
const blockPlantationController = require('./controllers/blockPlantationController'); // Adjust the path as necessary

// Other routes...

router.post('/seed-data', blockPlantationController.seedData);

module.exports = router; 